import asyncio
import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.organization import Organization
from app.models.user import User
from app.models.client import Client
from app.models.pipeline import PipelineStage, ClientPipelineState
from app.models.call import Call
from app.models.message import Message, MessageThread
from app.models.interaction import Interaction, InteractionType
from app.models.reminder import Reminder

async def seed():
    async with AsyncSessionLocal() as db:
        # Get all organizations
        orgs = (await db.scalars(select(Organization))).all()
        if not orgs:
            print("No organizations found! Please run the app or register first.")
            return

        print(f"Found {len(orgs)} organizations to seed.")

        # Get global clients to claim
        global_clients = (await db.scalars(
            select(Client).where(Client.org_id.is_(None)).limit(100)
        )).all()

        if not global_clients:
            print("No global clients found! Creating some global clients first.")
            # Create some dummy global clients
            for i in range(20):
                c = Client(
                    name=f"Global Discovery Client {i+1}",
                    city=random.choice(["New York", "San Francisco", "London", "Berlin", "Tokyo"]),
                    country=random.choice(["US", "US", "GB", "DE", "JP"]),
                    rating=round(random.uniform(3.5, 5.0), 1),
                    source="google_places"
                )
                db.add(c)
            await db.flush()
            global_clients = (await db.scalars(
                select(Client).where(Client.org_id.is_(None)).limit(100)
            )).all()

        # Seed each organization
        for org in orgs:
            print(f"Seeding organization: {org.name} ({org.id})")

            # Check if stages already exist for this org
            existing_stages = (await db.scalars(
                select(PipelineStage).where(PipelineStage.org_id == org.id)
            )).all()

            stage_map = {}
            if not existing_stages:
                # Create the 6 default stages
                stage_definitions = [
                    ("new", "New", 0, False),
                    ("contacted", "Contacted", 1, False),
                    ("responded", "Responded", 2, False),
                    ("negotiating", "Negotiating", 3, False),
                    ("won", "Won", 4, True),
                    ("lost", "Lost", 5, True),
                ]
                for slug, name, pos, is_term in stage_definitions:
                    stage = PipelineStage(
                        org_id=org.id,
                        name=name,
                        position=pos,
                        is_terminal=is_term
                    )
                    db.add(stage)
                    await db.flush()
                    stage_map[slug] = stage
            else:
                for stage in existing_stages:
                    slug = stage.name.lower()
                    stage_map[slug] = stage

            # Find users in this org
            org_users = (await db.scalars(
                select(User).where(User.org_id == org.id)
            )).all()
            if not org_users:
                print(f"  No users found for org {org.name}, skipping client assignments.")
                continue
            rep_user = org_users[0]

            # Clear existing claimed states to avoid constraint issues, then re-seed
            # (Or select distinct global clients that aren't claimed yet)
            claimed_client_ids = (await db.scalars(
                select(ClientPipelineState.client_id).where(ClientPipelineState.org_id == org.id)
            )).all()

            available_clients = [c for c in global_clients if c.id not in claimed_client_ids]
            if len(available_clients) < 10:
                available_clients = global_clients

            # Assign 6 clients to different stages
            stages_keys = list(stage_map.keys())
            seeded_clients = []
            for i, stage_key in enumerate(stages_keys):
                if i >= len(available_clients):
                    break
                client = available_clients[i]
                stage = stage_map[stage_key]

                # Create pipeline state
                state = ClientPipelineState(
                    org_id=org.id,
                    client_id=client.id,
                    stage_id=stage.id,
                    assigned_user_id=rep_user.id
                )
                db.add(state)
                seeded_clients.append(client)

            await db.flush()

            if not seeded_clients:
                continue

            # Seed Calls
            # Insert at least 3 calls
            call_logs = [
                ("answered", 154, "Discussed initial proposal; rep will send follow-up details."),
                ("no-answer", 0, "No answer, left voicemail."),
                ("answered", 325, "Client called back with questions regarding integration timeline.")
            ]
            for i, (outcome, duration, notes) in enumerate(call_logs):
                client = seeded_clients[i % len(seeded_clients)]
                call = Call(
                    org_id=org.id,
                    client_id=client.id,
                    user_id=rep_user.id,
                    duration_seconds=duration,
                    provider_call_sid=f"mock-sid-{uuid.uuid4().hex[:12]}",
                    recording_url="http://example.com/recording.mp3" if duration > 0 else None,
                    outcome=outcome
                )
                db.add(call)
                await db.flush()

                # Add interaction
                interaction = Interaction(
                    org_id=org.id,
                    client_id=client.id,
                    user_id=rep_user.id,
                    type=InteractionType.CALL.value,
                    summary=f"Call outcome: {outcome}. {notes}"[:200],
                    related_id=call.id
                )
                db.add(interaction)

            # Seed Chat Threads and Messages
            for i in range(2):
                client = seeded_clients[(i + 2) % len(seeded_clients)]
                
                # Check if thread already exists
                thread = await db.scalar(
                    select(MessageThread).where(MessageThread.org_id == org.id, MessageThread.client_id == client.id)
                )
                if not thread:
                    thread = MessageThread(org_id=org.id, client_id=client.id)
                    db.add(thread)
                    await db.flush()

                # Add some messages
                msg1 = Message(
                    thread_id=thread.id,
                    sender_user_id=rep_user.id,
                    body="Hello! Thanks for discovering us. How can we help you scale your operations?",
                    status="read"
                )
                db.add(msg1)
                await db.flush()

                # Add interaction for first message
                int1 = Interaction(
                    org_id=org.id,
                    client_id=client.id,
                    user_id=rep_user.id,
                    type=InteractionType.CHAT_MESSAGE.value,
                    summary=msg1.body[:150],
                    related_id=msg1.id
                )
                db.add(int1)

                msg2 = Message(
                    thread_id=thread.id,
                    sender_user_id=None,  # from client
                    body="Hi! We saw your discovery tool and are interested in your corporate package details.",
                    status="delivered"
                )
                db.add(msg2)
                await db.flush()

                int2 = Interaction(
                    org_id=org.id,
                    client_id=client.id,
                    user_id=None,
                    type=InteractionType.CHAT_MESSAGE.value,
                    summary=msg2.body[:150],
                    related_id=msg2.id
                )
                db.add(int2)

            # Seed Reminders (Tasks)
            reminder_titles = [
                "Follow up on corporate contract proposal",
                "Prepare product demo slides",
                "Finalize pricing structure discuss"
            ]
            for i, title in enumerate(reminder_titles):
                client = seeded_clients[i % len(seeded_clients)]
                reminder = Reminder(
                    org_id=org.id,
                    user_id=rep_user.id,
                    title=title,
                    notes=f"Linked to {client.name}. Ensure we touch base on Q3 objectives.",
                    due_at=datetime.now(timezone.utc) + timedelta(hours=random.choice([6, 12, 24, 36])),
                    is_done=False,
                    client_id=client.id
                )
                db.add(reminder)

        await db.commit()
        print("Database successfully seeded for all organizations!")

if __name__ == "__main__":
    asyncio.run(seed())
