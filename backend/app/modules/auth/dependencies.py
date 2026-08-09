import uuid
from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import JWTError, TokenType, decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=True)


@dataclass(frozen=True)
class CurrentUser:
    """
    Everything downstream code needs to enforce tenant isolation, sourced
    from the JWT (not the DB) so every request gets scoping without an
    extra query. org_id here is *the* tenant boundary — repositories must
    filter on it for every query, not just the router layer.
    """

    user_id: uuid.UUID
    org_id: uuid.UUID
    role: str


def _decode(token: str, expected_type: TokenType) -> CurrentUser:
    try:
        payload = decode_token(token)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if payload.get("type") != expected_type.value:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Wrong token type")

    try:
        return CurrentUser(
            user_id=uuid.UUID(payload["sub"]),
            org_id=uuid.UUID(payload["org_id"]),
            role=payload["role"],
        )
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Malformed token") from exc


def get_current_user(token: str = Depends(oauth2_scheme)) -> CurrentUser:
    return _decode(token, TokenType.ACCESS)


def get_user_from_refresh_token(token: str) -> CurrentUser:
    return _decode(token, TokenType.REFRESH)


# Role hierarchy for require_role's "at least" check.
_ROLE_RANK = {"rep": 0, "manager": 1, "admin": 2}


def require_role(minimum_role: str):
    """Usage: Depends(require_role("manager")) allows manager and admin, not rep."""

    def _dependency(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if _ROLE_RANK.get(current_user.role, -1) < _ROLE_RANK.get(minimum_role, 99):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role '{minimum_role}' or higher",
            )
        return current_user

    return _dependency
