# Generated manually for playlist purchases

import django.core.validators
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("video_streaming", "0007_streamplaylist_price_and_rating"),
    ]

    operations = [
        migrations.CreateModel(
            name="StreamPlaylistPurchase",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("pending", "Pending"), ("paid", "Paid"), ("cancelled", "Cancelled"), ("failed", "Failed")], db_index=True, default="pending", max_length=16)),
                ("stripe_checkout_session_id", models.CharField(blank=True, db_index=True, max_length=255)),
                ("amount_paid", models.DecimalField(decimal_places=2, default=0, max_digits=10, validators=[django.core.validators.MinValueValidator(0)])),
                ("currency", models.CharField(default="gbp", max_length=12)),
                ("paid_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("playlist", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="purchases", to="video_streaming.streamplaylist")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="stream_playlist_purchases", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-updated_at", "-id"]},
        ),
        migrations.AddConstraint(
            model_name="streamplaylistpurchase",
            constraint=models.UniqueConstraint(fields=("user", "playlist"), name="stream_playlist_purchase_unique_user_playlist"),
        ),
    ]
