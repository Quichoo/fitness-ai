from profiles.authentication import SupabaseUser


def make_authenticated_client(client, user_id):
    """
    Forces DRF's test client to treat requests as coming from a specific,
    already-authenticated user - bypassing real JWT/JWKS verification.
    We already proved the real token verification works, via manual testing
    against a live Supabase project - these tests focus on what happens
    AFTER authentication succeeds (ownership, ownership boundaries).
    """
    client.force_authenticate(user=SupabaseUser(user_id=user_id))
    return client