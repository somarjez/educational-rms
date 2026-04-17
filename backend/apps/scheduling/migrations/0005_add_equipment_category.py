from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('scheduling', '0004_alter_equipment_quantity_alter_room_equipment_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='equipment',
            name='category',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]
