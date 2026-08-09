from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import CurrentUser, get_current_user, get_user_from_refresh_token
from app.modules.auth.service import login, refresh, register_org
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterOrgRequest,
    TokenPairResponse,
    UserResponse,
)
from app.models.user import User

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=TokenPairResponse, status_code=201)
async def register(payload: RegisterOrgRequest, db: AsyncSession = Depends(get_db)):
    """Creates a new Organization + its first (admin) User in one step."""
    return await register_org(db, payload)


@router.post("/login", response_model=TokenPairResponse)
async def login_route(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    return await login(db, payload)


@router.post("/refresh", response_model=TokenPairResponse)
async def refresh_route(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    claims = get_user_from_refresh_token(payload.refresh_token)
    return await refresh(db, user_id=str(claims.user_id), org_id=str(claims.org_id))


@router.get("/me", response_model=UserResponse)
async def me(current_user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.id == current_user.user_id))
    return user
