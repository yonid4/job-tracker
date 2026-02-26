# Third-party
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# Local
from app.database import supabase
from app.models.users import User
from app.schemas.user import UserResponse, supabase_user_to_response
from app.schemas.auth import SignUpRequest, LoginRequest, Token
from app.utils.security import create_access_token, hash_password, verify_password, verify_token

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(request: SignUpRequest):
    """
    Register a new user.

    - **email**: Valid email address (must be unique)
    - **password**: Password (min 8 characters)
    - **name**: Optional user name
    - **age**: Optional age (1-150)
    
    Returns the created user (without password).
    """
    
    existing_user = supabase.table("users").select("*").eq("email", request.email).execute()

    if existing_user.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email for this user already exists"
        )

    hashed_password = hash_password(request.password)
    
    user = User(
        email=request.email,
        password_hash=hashed_password,
        username=request.username,
    )

    user = supabase.table("users").insert({"email":user.email, "password_hash":user.password_hash, "username":user.username}).execute()

    user = supabase_user_to_response(user.data[0])

    return user

@router.post("/signin", response_model=Token)
def login(request: LoginRequest):
    """
    Login with email and password.

    - **email**: User's email
    - **password**: User's password 
    
    Returns a JWT access token.
    """

    user = supabase.table("users").select("*").eq("email", request.email).execute()

    if not user.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email"
        )

    if not verify_password(request.password, user.data[0]["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )

    access_token = create_access_token(data={"sub": user.data[0]["email"]})

    return Token(access_token=access_token, token_type="bearer")

@router.get("/me", response_model=UserResponse)
def get_current_me(
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    
):
    """
    Get current logged-in user's information.
    
    Requires: Bearer token in Authorization header
    
    Returns the current user's data.
    """

    token = credentials.credentials

    email = verify_token(token)

    user = supabase.table("users").select("*").eq("email", email).execute()

    if not user.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    user = supabase_user_to_response(user.data[0])

    return user