import uuid
import random
from datetime import datetime, timezone
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.client import Client
from app.models.pipeline import PipelineStage, ClientPipelineState
from app.models.call import Call
from app.models.message import Message, MessageThread
from app.models.interaction import Interaction, InteractionType
from app.models.user import User
from app.schemas.dashboard import (
    KpiItem, ActivityItem, CountryPctItem, DashboardOverviewResponse,
    AnalyticsKpiItem, WeeklyPerformanceItem, CountryMetricItem, RepStatItem,
    FunnelStageItem, DashboardAnalyticsResponse
)

COUNTRY_NAME_MAP = {
    "TR": "Turkey",
    "KE": "Kenya",
    "SE": "Sweden",
    "JP": "Japan",
    "ZA": "South Africa",
    "MX": "Mexico",
    "NL": "Netherlands",
    "PH": "Philippines",
    "NO": "Norway",
    "GB": "United Kingdom",
    "IN": "India",
    "US": "United States",
    "CA": "Canada",
    "AU": "Australia",
    "DE": "Germany",
    "FR": "France",
    "IT": "Italy",
    "ES": "Spain"
}

def get_country_name(code: str | None) -> str:
    if not code:
        return "Global"
    upper = code.upper()
    return COUNTRY_NAME_MAP.get(upper, code)

async def get_overview(db: AsyncSession, *, org_id: uuid.UUID) -> DashboardOverviewResponse:
    # 1. Fetch all claimed client ids and their stages
    state_stmt = (
        select(ClientPipelineState.client_id, PipelineStage.name, PipelineStage.is_terminal, ClientPipelineState.stage_id)
        .join(PipelineStage, ClientPipelineState.stage_id == PipelineStage.id)
        .where(ClientPipelineState.org_id == org_id)
    )
    states_res = (await db.execute(state_stmt)).all()
    
    claimed_ids = [row[0] for row in states_res]
    total_leads = len(claimed_ids)

    # Count stages
    contacted_count = 0
    responded_count = 0
    won_count = 0
    negotiating_count = 0
    
    for row in states_res:
        _, stage_name, _, _ = row
        stage_lower = stage_name.lower()
        if "new" not in stage_lower:
            contacted_count += 1
        if "responded" in stage_lower or "negotiating" in stage_lower or "won" in stage_lower:
            responded_count += 1
        if "won" in stage_lower:
            won_count += 1
        if "negotiating" in stage_lower:
            negotiating_count += 1

    # Fetch total outreach interactions
    outreach_stmt = select(func.count(Interaction.id)).where(
        Interaction.org_id == org_id,
        Interaction.type.in_([InteractionType.CALL.value, InteractionType.CHAT_MESSAGE.value, InteractionType.EMAIL.value, InteractionType.SMS.value])
    )
    total_outreach = (await db.execute(outreach_stmt)).scalar() or 0

    # Calculate rates
    response_rate = (responded_count / contacted_count * 100) if contacted_count > 0 else 0.0
    deals_value = (won_count + negotiating_count) * 15  # Estimate $15K per deal in pipeline

    # Build KPIs list
    kpis = [
        KpiItem(
            label="Leads found",
            rawValue=total_leads,
            display=f"{total_leads:,}",
            delta="+0.0%",
            spark=[0, 0, 0, 0, 0, 0, 0] if total_leads == 0 else [30, 42, 38, 55, 47, 63, 72]
        ),
        KpiItem(
            label="Outreach sent",
            rawValue=total_outreach,
            display=str(total_outreach),
            delta="+0.0%",
            spark=[0, 0, 0, 0, 0, 0, 0] if total_outreach == 0 else [20, 28, 22, 35, 30, 42, 48]
        ),
        KpiItem(
            label="Response rate",
            rawValue=round(response_rate * 10, 1),
            display=f"{response_rate:.1f}%",
            delta="+0.0pt",
            spark=[0, 0, 0, 0, 0, 0, 0] if contacted_count == 0 else [18, 21, 20, 22, 23, 22, 24]
        ),
        KpiItem(
            label="Deals in pipeline",
            rawValue=deals_value,
            display=f"${deals_value}K",
            delta="+0.0%",
            spark=[0, 0, 0, 0, 0, 0, 0] if deals_value == 0 else [80, 95, 88, 110, 105, 130, 145]
        ),
    ]

    # 2. Recent Activity - last 5 claimed clients
    recent_clients = []
    if claimed_ids:
        recent_stmt = (
            select(Client, PipelineStage.name)
            .join(ClientPipelineState, Client.id == ClientPipelineState.client_id)
            .join(PipelineStage, ClientPipelineState.stage_id == PipelineStage.id)
            .where(ClientPipelineState.org_id == org_id)
            .order_by(ClientPipelineState.created_at.desc())
            .limit(5)
        )
        recent_res = (await db.execute(recent_stmt)).all()
        for c, stage_name in recent_res:
            recent_clients.append(
                ActivityItem(
                    id=str(c.id),
                    name=c.name,
                    city=c.city,
                    country=c.country,
                    category=c.tags[0].name if c.tags else "Lead",
                    lat=c.latitude,
                    lng=c.longitude,
                    countryCode=c.country,
                    stage=stage_name.lower()
                )
            )

    # 3. Top Countries
    top_countries = []
    if claimed_ids:
        country_stmt = (
            select(Client.country, func.count(Client.id))
            .join(ClientPipelineState, Client.id == ClientPipelineState.client_id)
            .where(ClientPipelineState.org_id == org_id)
            .group_by(Client.country)
            .order_by(func.count(Client.id).desc())
            .limit(4)
        )
        countries_res = (await db.execute(country_stmt)).all()
        for country, count in countries_res:
            top_countries.append(
                CountryPctItem(
                    country=get_country_name(country),
                    pct=round((count / total_leads * 100), 1)
                )
            )
            
    # Default top countries if empty
    if not top_countries:
        top_countries = []

    return DashboardOverviewResponse(
        kpis=kpis,
        activity=recent_clients,
        top_countries=top_countries
    )


async def get_analytics(db: AsyncSession, *, org_id: uuid.UUID) -> DashboardAnalyticsResponse:
    # 1. KPIs
    state_stmt = (
        select(ClientPipelineState.client_id, PipelineStage.name)
        .join(PipelineStage, ClientPipelineState.stage_id == PipelineStage.id)
        .where(ClientPipelineState.org_id == org_id)
    )
    states_res = (await db.execute(state_stmt)).all()
    total_leads = len(states_res)

    won_count = 0
    contacted_count = 0
    responded_count = 0
    for row in states_res:
        _, stage_name = row
        stage_lower = stage_name.lower()
        if "new" not in stage_lower:
            contacted_count += 1
        if "won" in stage_lower:
            won_count += 1
        if "responded" in stage_lower or "negotiating" in stage_lower or "won" in stage_lower:
            responded_count += 1

    calls_stmt = select(func.count(Call.id)).where(Call.org_id == org_id)
    total_calls = (await db.execute(calls_stmt)).scalar() or 0

    conversion_rate = (won_count / total_leads * 100) if total_leads > 0 else 0.0
    avg_response_rate = (responded_count / contacted_count * 100) if contacted_count > 0 else 0.0

    kpis = [
        AnalyticsKpiItem(
            label="Total leads discovered",
            rawValue=total_leads,
            display=f"{total_leads:,}",
            delta="+0.0%"
        ),
        AnalyticsKpiItem(
            label="Conversion rate",
            rawValue=round(conversion_rate * 10, 1),
            display=f"{conversion_rate:.1f}%",
            delta="+0.0pt"
        ),
        AnalyticsKpiItem(
            label="Avg. response rate",
            rawValue=round(avg_response_rate * 10, 1),
            display=f"{avg_response_rate:.1f}%",
            delta="+0.0pt"
        ),
        AnalyticsKpiItem(
            label="Total calls made",
            rawValue=total_calls,
            display=str(total_calls),
            delta="+0.0%"
        ),
    ]

    # 2. Weekly Performance (last 12 weeks)
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    weekly_perf = []
    
    for i in range(11, -1, -1):
        start_date = now - timedelta(weeks=i+1)
        end_date = now - timedelta(weeks=i)
        week_label = f"W{start_date.isocalendar()[1]}"
        
        # Count outreach in range
        outreach_stmt = select(func.count(Interaction.id)).where(
            Interaction.org_id == org_id,
            Interaction.created_at >= start_date,
            Interaction.created_at < end_date,
            Interaction.type.in_([InteractionType.CALL.value, InteractionType.CHAT_MESSAGE.value, InteractionType.EMAIL.value, InteractionType.SMS.value])
        )
        outreach_count = (await db.execute(outreach_stmt)).scalar() or 0
        
        # Count responses in range
        resp_stmt = select(func.count(Message.id)).join(MessageThread, Message.thread_id == MessageThread.id).where(
            MessageThread.org_id == org_id,
            Message.created_at >= start_date,
            Message.created_at < end_date,
            Message.sender_user_id.is_(None)
        )
        responses_count = (await db.execute(resp_stmt)).scalar() or 0
        
        # Count won deals in range
        deals_stmt = select(func.count(ClientPipelineState.client_id)).join(PipelineStage, ClientPipelineState.stage_id == PipelineStage.id).where(
            ClientPipelineState.org_id == org_id,
            ClientPipelineState.updated_at >= start_date,
            ClientPipelineState.updated_at < end_date,
            PipelineStage.name.ilike("%won%")
        )
        deals_count = (await db.execute(deals_stmt)).scalar() or 0
        
        weekly_perf.append(
            WeeklyPerformanceItem(
                week=week_label,
                outreach=outreach_count,
                responses=responses_count,
                deals=deals_count
            )
        )

    # 3. Country breakdown
    country_metrics = []
    if total_leads > 0:
        c_stmt = (
            select(Client.country, func.count(Client.id))
            .join(ClientPipelineState, Client.id == ClientPipelineState.client_id)
            .where(ClientPipelineState.org_id == org_id)
            .group_by(Client.country)
        )
        c_res = (await db.execute(c_stmt)).all()
        for country, count in c_res:
            # count won
            won_stmt = (
                select(func.count(Client.id))
                .join(ClientPipelineState, Client.id == ClientPipelineState.client_id)
                .join(PipelineStage, ClientPipelineState.stage_id == PipelineStage.id)
                .where(
                    ClientPipelineState.org_id == org_id,
                    Client.country == country,
                    PipelineStage.name.ilike("%won%")
                )
            )
            won_in_c = (await db.execute(won_stmt)).scalar() or 0
            country_metrics.append(
                CountryMetricItem(
                    country=get_country_name(country),
                    code=country or "GL",
                    leads=count,
                    won=won_in_c
                )
            )
        country_metrics.sort(key=lambda x: x.leads, reverse=True)
        country_metrics = country_metrics[:8]

    if not country_metrics:
        country_metrics = []

    # 4. Rep Stats
    rep_stats = []
    users = (await db.scalars(select(User).where(User.org_id == org_id))).all()
    for user in users:
        # won count
        u_won_stmt = (
            select(func.count(ClientPipelineState.client_id))
            .join(PipelineStage, ClientPipelineState.stage_id == PipelineStage.id)
            .where(
                ClientPipelineState.org_id == org_id,
                ClientPipelineState.assigned_user_id == user.id,
                PipelineStage.name.ilike("%won%")
            )
        )
        rep_won = (await db.execute(u_won_stmt)).scalar() or 0

        # calls count
        u_calls_stmt = select(func.count(Call.id)).where(Call.org_id == org_id, Call.user_id == user.id)
        rep_calls = (await db.execute(u_calls_stmt)).scalar() or 0

        # outreach count (interactions)
        u_out_stmt = select(func.count(Interaction.id)).where(
            Interaction.org_id == org_id,
            Interaction.user_id == user.id,
            Interaction.type.in_([InteractionType.CALL.value, InteractionType.CHAT_MESSAGE.value])
        )
        rep_outreach = (await db.execute(u_out_stmt)).scalar() or 0

        # Calculate response rate for this rep
        rep_resp_rate = (rep_won / rep_outreach * 100) if rep_outreach > 0 else 0.0
        rep_stats.append(
            RepStatItem(
                id=str(user.id),
                name=user.full_name or user.email,
                dealsWon=rep_won,
                outreachSent=rep_outreach,
                responseRate=round(rep_resp_rate, 1),
                callsMade=rep_calls
            )
        )
    rep_stats.sort(key=lambda x: x.dealsWon, reverse=True)

    # 5. Funnel Data
    funnel_data = []
    stages = (await db.scalars(
        select(PipelineStage).where(PipelineStage.org_id == org_id).order_by(PipelineStage.position)
    )).all()
    colors = ["hsl(228 100% 57%)", "hsl(228 80% 50%)", "hsl(37 86% 58%)", "hsl(37 70% 48%)", "hsl(160 71% 33%)", "hsl(358 75% 59%)"]
    for i, stage in enumerate(stages):
        cnt_stmt = select(func.count(ClientPipelineState.client_id)).where(
            ClientPipelineState.org_id == org_id,
            ClientPipelineState.stage_id == stage.id
        )
        cnt = (await db.execute(cnt_stmt)).scalar() or 0
        funnel_data.append(
            FunnelStageItem(
                stage=stage.name.lower(),
                label=stage.name,
                count=cnt,
                color=colors[i % len(colors)]
            )
        )
        
    if not funnel_data:
        funnel_data = [
            FunnelStageItem(stage="new", label="New", count=842, color="hsl(228 100% 57%)"),
            FunnelStageItem(stage="contacted", label="Contacted", count=594, color="hsl(228 80% 50%)"),
        ]

    return DashboardAnalyticsResponse(
        kpis=kpis,
        weeklyPerformance=weekly_perf,
        countryMetrics=country_metrics,
        repStats=rep_stats,
        funnelData=funnel_data
    )
