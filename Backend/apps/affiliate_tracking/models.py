from __future__ import annotations

from decimal import Decimal

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class ApiToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="affiliate_api_tokens")
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)


class EmailOTP(models.Model):
    email = models.EmailField(db_index=True)
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at


class AffiliateProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="affiliate_profile")
    display_name = models.CharField(max_length=120)
    earnings_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    points_total = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class SectionReferral(models.Model):
    SECTION_CHOICES = [
        ("complete", "Complete Programs Affiliate"),
        ("single", "Single Program"),
        ("exclusive", "Exclusive Content of Gussy Bahi"),
    ]

    profile = models.ForeignKey(AffiliateProfile, on_delete=models.CASCADE, related_name="section_referrals")
    section = models.CharField(max_length=24, choices=SECTION_CHOICES)
    referral_id = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("profile", "section")


class ClickEvent(models.Model):
    referral = models.ForeignKey(SectionReferral, on_delete=models.CASCADE, related_name="click_events")
    visitor_id = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("referral", "visitor_id")


class LeadEvent(models.Model):
    referral = models.ForeignKey(SectionReferral, on_delete=models.CASCADE, related_name="lead_events")
    visitor_id = models.CharField(max_length=128)
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("referral", "visitor_id")


class SaleEvent(models.Model):
    referral = models.ForeignKey(SectionReferral, on_delete=models.CASCADE, related_name="sale_events")
    visitor_id = models.CharField(max_length=128)
    email = models.EmailField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("referral", "visitor_id", "email", "amount")
