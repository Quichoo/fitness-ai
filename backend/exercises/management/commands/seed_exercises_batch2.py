from django.core.management.base import BaseCommand
from exercises.models import Exercise

NEW_EXERCISES = [
    # Legs
    {"name": "Leg Press", "muscle_group": "legs", "equipment": "machine", "difficulty": "beginner"},
    {"name": "Romanian Deadlift", "muscle_group": "legs", "equipment": "barbell", "difficulty": "intermediate"},
    {"name": "Step-up", "muscle_group": "legs", "equipment": "dumbbell", "difficulty": "beginner"},
    {"name": "Box Jump", "muscle_group": "legs", "equipment": "bodyweight", "difficulty": "intermediate"},
    {"name": "Glute Bridge", "muscle_group": "legs", "equipment": "bodyweight", "difficulty": "beginner"},
    {"name": "Hack Squat", "muscle_group": "legs", "equipment": "machine", "difficulty": "intermediate"},
    {"name": "Sissy Squat", "muscle_group": "legs", "equipment": "bodyweight", "difficulty": "advanced"},
    {"name": "Nordic Hamstring Curl", "muscle_group": "legs", "equipment": "bodyweight", "difficulty": "advanced"},
    {"name": "Good Morning", "muscle_group": "legs", "equipment": "barbell", "difficulty": "intermediate"},
    {"name": "Pistol Squat", "muscle_group": "legs", "equipment": "bodyweight", "difficulty": "advanced"},

    # Back
    {"name": "Barbell Row", "muscle_group": "back", "equipment": "barbell", "difficulty": "intermediate"},
    {"name": "Chin-up", "muscle_group": "back", "equipment": "bodyweight", "difficulty": "intermediate"},
    {"name": "Straight-Arm Pulldown", "muscle_group": "back", "equipment": "cable", "difficulty": "beginner"},
    {"name": "Renegade Row", "muscle_group": "back", "equipment": "dumbbell", "difficulty": "intermediate"},
    {"name": "Single-Arm Dumbbell Row", "muscle_group": "back", "equipment": "dumbbell", "difficulty": "beginner"},
    {"name": "Pendlay Row", "muscle_group": "back", "equipment": "barbell", "difficulty": "advanced"},
    {"name": "Superman", "muscle_group": "back", "equipment": "bodyweight", "difficulty": "beginner"},

    # Chest
    {"name": "Machine Chest Press", "muscle_group": "chest", "equipment": "machine", "difficulty": "beginner"},
    {"name": "Pec Deck Fly", "muscle_group": "chest", "equipment": "machine", "difficulty": "beginner"},
    {"name": "Svend Press", "muscle_group": "chest", "equipment": "dumbbell", "difficulty": "intermediate"},
    {"name": "Landmine Press", "muscle_group": "chest", "equipment": "barbell", "difficulty": "intermediate"},
    {"name": "Cable Fly", "muscle_group": "chest", "equipment": "cable", "difficulty": "beginner"},
    {"name": "Floor Press", "muscle_group": "chest", "equipment": "dumbbell", "difficulty": "intermediate"},

    # Shoulders
    {"name": "Cable Lateral Raise", "muscle_group": "shoulders", "equipment": "cable", "difficulty": "intermediate"},
    {"name": "Machine Shoulder Press", "muscle_group": "shoulders", "equipment": "machine", "difficulty": "beginner"},
    {"name": "Cuban Press", "muscle_group": "shoulders", "equipment": "dumbbell", "difficulty": "advanced"},
    {"name": "Reverse Pec Deck", "muscle_group": "shoulders", "equipment": "machine", "difficulty": "beginner"},
    {"name": "Kettlebell Press", "muscle_group": "shoulders", "equipment": "kettlebell", "difficulty": "intermediate"},
    {"name": "Push Press", "muscle_group": "shoulders", "equipment": "barbell", "difficulty": "advanced"},

    # Arms
    {"name": "Tricep Pushdown", "muscle_group": "arms", "equipment": "cable", "difficulty": "beginner"},
    {"name": "Cable Curl", "muscle_group": "arms", "equipment": "cable", "difficulty": "beginner"},
    {"name": "Zottman Curl", "muscle_group": "arms", "equipment": "dumbbell", "difficulty": "intermediate"},
    {"name": "Diamond Push-up", "muscle_group": "arms", "equipment": "bodyweight", "difficulty": "intermediate"},
    {"name": "Barbell Curl", "muscle_group": "arms", "equipment": "barbell", "difficulty": "beginner"},
    {"name": "Dumbbell Kickback", "muscle_group": "arms", "equipment": "dumbbell", "difficulty": "beginner"},
    {"name": "21s Bicep Curl", "muscle_group": "arms", "equipment": "dumbbell", "difficulty": "intermediate"},
    {"name": "Tricep Dip Machine", "muscle_group": "arms", "equipment": "machine", "difficulty": "beginner"},
    {"name": "EZ Bar Curl", "muscle_group": "arms", "equipment": "barbell", "difficulty": "beginner"},

    # Core
    {"name": "Bicycle Crunch", "muscle_group": "core", "equipment": "bodyweight", "difficulty": "beginner"},
    {"name": "Dead Bug", "muscle_group": "core", "equipment": "bodyweight", "difficulty": "beginner"},
    {"name": "Cable Woodchopper", "muscle_group": "core", "equipment": "cable", "difficulty": "intermediate"},
    {"name": "Side Plank", "muscle_group": "core", "equipment": "bodyweight", "difficulty": "beginner"},
    {"name": "V-Up", "muscle_group": "core", "equipment": "bodyweight", "difficulty": "intermediate"},
    {"name": "Hollow Body Hold", "muscle_group": "core", "equipment": "bodyweight", "difficulty": "intermediate"},
    {"name": "Kettlebell Windmill", "muscle_group": "core", "equipment": "kettlebell", "difficulty": "advanced"},
    {"name": "Toes to Bar", "muscle_group": "core", "equipment": "bodyweight", "difficulty": "advanced"},

    # Full body
    {"name": "Thruster", "muscle_group": "full_body", "equipment": "barbell", "difficulty": "advanced"},
    {"name": "Kettlebell Snatch", "muscle_group": "full_body", "equipment": "kettlebell", "difficulty": "advanced"},
    {"name": "Turkish Get-up", "muscle_group": "full_body", "equipment": "kettlebell", "difficulty": "advanced"},
    {"name": "Wall Ball", "muscle_group": "full_body", "equipment": "kettlebell", "difficulty": "intermediate"},
]


class Command(BaseCommand):
    help = "Seeds the second batch of exercises (idempotent, safe to re-run)"

    def handle(self, *args, **options):
        created_count = 0
        skipped_count = 0
        for ex in NEW_EXERCISES:
            obj, created = Exercise.objects.get_or_create(
                name=ex["name"],
                defaults={
                    "muscle_group": ex["muscle_group"],
                    "equipment": ex["equipment"],
                    "difficulty": ex["difficulty"],
                },
            )
            if created:
                created_count += 1
            else:
                skipped_count += 1

        self.stdout.write(self.style.SUCCESS(f"Created: {created_count}, Skipped: {skipped_count}"))
        self.stdout.write(f"Total exercises now: {Exercise.objects.count()}")