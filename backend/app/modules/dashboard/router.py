from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, get_current_user
from app.modules.dashboard import service
from app.schemas.dashboard import DashboardOverviewResponse, DashboardAnalyticsResponse

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])

@router.get("/overview", response_model=DashboardOverviewResponse)
async def get_overview(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_overview(db, org_id=current_user.org_id)

@router.get("/analytics", response_model=DashboardAnalyticsResponse)
async def get_analytics(
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_analytics(db, org_id=current_user.org_id)
