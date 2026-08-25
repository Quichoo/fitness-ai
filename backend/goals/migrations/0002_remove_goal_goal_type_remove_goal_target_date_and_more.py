from django.db import migrations, models


def backfill_structured_goal_fields(apps, schema_editor):
    """
    Copies data from the old flat goal_type/target_value/target_unit/target_date
    fields into the new structured category/objective/metrics/deadline shape,
    before the old fields are removed - so no existing goal data is lost.
    """
    Goal = apps.get_model("goals", "Goal")
    for goal in Goal.objects.all():
        goal.category = goal.goal_type
        goal.objective = "general"  # old system had no concept of objective
        goal.metrics = {
            "target_value": float(goal.target_value) if goal.target_value is not None else None,
            "unit": goal.target_unit,
        }
        goal.deadline = goal.target_date
        goal.save()


def reverse_backfill(apps, schema_editor):
    """Allows this migration to be reversed - copies data back the other way."""
    Goal = apps.get_model("goals", "Goal")
    for goal in Goal.objects.all():
        goal.goal_type = goal.category
        goal.target_value = goal.metrics.get("target_value")
        goal.target_unit = goal.metrics.get("unit")
        goal.target_date = goal.deadline
        goal.save()


class Migration(migrations.Migration):

    dependencies = [
        ('goals', '0001_initial'),
    ]

    operations = [
        # Step 1: add the new fields - old fields still exist alongside them
        migrations.AddField(
            model_name='goal',
            name='category',
            field=models.CharField(choices=[('weight_loss', 'Weight loss'), ('muscle_gain', 'Muscle gain'), ('strength', 'Strength'), ('running', 'Running'), ('cycling', 'Cycling'), ('general_fitness', 'General fitness')], default='general_fitness', max_length=50),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='goal',
            name='deadline',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='goal',
            name='metrics',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='goal',
            name='objective',
            field=models.CharField(default='general', max_length=50),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='goal',
            name='training_preferences',
            field=models.JSONField(blank=True, default=dict),
        ),

        # Step 2: copy real data from old fields into new fields, while both exist
        migrations.RunPython(backfill_structured_goal_fields, reverse_backfill),

        # Step 3: now safe to remove the old fields - their data has been preserved
        migrations.RemoveField(
            model_name='goal',
            name='goal_type',
        ),
        migrations.RemoveField(
            model_name='goal',
            name='target_date',
        ),
        migrations.RemoveField(
            model_name='goal',
            name='target_unit',
        ),
        migrations.RemoveField(
            model_name='goal',
            name='target_value',
        ),
    ]