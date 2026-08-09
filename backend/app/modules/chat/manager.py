import asyncio
import json
import uuid

from fastapi import WebSocket

from app.core.redis_client import get_redis


def _channel(thread_id: uuid.UUID) -> str:
    return f"chat:thread:{thread_id}"


class ThreadConnectionManager:
    """
    Holds the WebSocket connections *this process* has open, keyed by
    thread_id. Broadcasting a message always goes out via Redis pub/sub
    (PUBLISH), and every pod SUBSCRIBEs to the threads its local clients
    are watching — so a message sent by a user connected to pod A reaches
    a user connected to pod B without either pod needing direct knowledge
    of the other.
    """

    def __init__(self) -> None:
        self._connections: dict[uuid.UUID, set[WebSocket]] = {}
        self._pubsub_tasks: dict[uuid.UUID, asyncio.Task] = {}

    async def connect(self, thread_id: uuid.UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections.setdefault(thread_id, set()).add(websocket)
        if thread_id not in self._pubsub_tasks:
            self._pubsub_tasks[thread_id] = asyncio.create_task(self._listen(thread_id))

    async def disconnect(self, thread_id: uuid.UUID, websocket: WebSocket) -> None:
        conns = self._connections.get(thread_id)
        if conns and websocket in conns:
            conns.remove(websocket)
        if conns is not None and not conns:
            del self._connections[thread_id]
            task = self._pubsub_tasks.pop(thread_id, None)
            if task:
                task.cancel()

    async def publish(self, thread_id: uuid.UUID, event: dict) -> None:
        redis = get_redis()
        await redis.publish(_channel(thread_id), json.dumps(event))

    async def _listen(self, thread_id: uuid.UUID) -> None:
        redis = get_redis()
        pubsub = redis.pubsub()
        await pubsub.subscribe(_channel(thread_id))
        try:
            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                event = message["data"]
                for ws in list(self._connections.get(thread_id, ())):
                    try:
                        await ws.send_text(event)
                    except Exception:
                        await self.disconnect(thread_id, ws)
        finally:
            await pubsub.unsubscribe(_channel(thread_id))


manager = ThreadConnectionManager()
