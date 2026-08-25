import uuid
from django.db import models


class Profile(models.Model):
    # This ID matches the authenticated Supabase user's ID directly -
    # it's not auto-generated, we set it ourselves when creating the row.
    id = models.UUIDField(primary_key=True, editable=False)
    display_name = models.CharField(max_length=100, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    sex = models.CharField(max_length=30, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    fitness_level = models.CharField(max_length=30, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "profiles"

    def __str__(self):
        return self.display_name or str(self.id)