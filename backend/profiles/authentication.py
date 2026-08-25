import jwt
from jwt import PyJWKClient, PyJWTError
from django.conf import settings
from rest_framework import authentication, exceptions


# Fetches Supabase's public signing keys, caches them, matches by "kid".
# Same JWKS endpoint we confirmed working with the FastAPI backend.
_jwks_client = PyJWKClient(
    f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json",
    cache_keys=True,
)


class SupabaseUser:
    """
    A minimal stand-in for a 'user' object. We're not using Django's built-in
    User model here - the real user record lives in Supabase, not in Django's
    own auth_user table. This just carries the id we need.
    """
    def __init__(self, user_id, email=None):
        self.id = user_id
        self.email = email
        self.is_authenticated = True  # DRF checks this attribute


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None  # No token provided - let DRF treat this as anonymous

        token = auth_header.split(" ", 1)[1]

        try:
            signing_key = _jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256"],
                audience="authenticated",
            )
        except PyJWTError as exc:
            raise exceptions.AuthenticationFailed("Invalid or expired authentication token") from exc

        user_id = payload.get("sub")
        if not user_id:
            raise exceptions.AuthenticationFailed("Token missing subject claim")

        return (SupabaseUser(user_id, payload.get("email")), None)

    def authenticate_header(self, request):
        return "Bearer"