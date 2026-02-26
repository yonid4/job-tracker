# create_access_token, hash_password, verify_password, verify_token

# Standard library
from datetime import datetime, timedelta, timezone
from typing import Optional
import os

# Third-party
from dotenv import load_dotenv
from fastapi import HTTPException, status
import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

# Local
from app.database import supabase
from app.schemas.auth import TokenData

load_dotenv()

# init the JWT var settings
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """
    Hash a plain text password.
    """
    return password_hash.hash(password)


def verify_password(plain_password, hashed_password):
    """
    Verify a plain password against a hashed password.
    """
    return password_hash.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[str]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except InvalidTokenError:
        raise credentials_exception
    user = supabase.table("users").select("*").eq("email", token_data.email).execute()
    if not user.data:
        raise credentials_exception
    return user.data[0]["email"]