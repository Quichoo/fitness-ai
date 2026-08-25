from rest_framework import generics, permissions
from .models import Profile
from .serializers import ProfileSerializer


class ProfileDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # request.user is now the SupabaseUser we built from the verified JWT -
        # this replaces the old Profile.objects.first() placeholder.
        profile, _created = Profile.objects.get_or_create(id=self.request.user.id)
        return profile