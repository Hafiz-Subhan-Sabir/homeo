"""Mounted at /api/track/ — public referral tracking + stats."""

from django.urls import path

from . import views

urlpatterns = [
    path("health", views.health),
    path("health/", views.health),
    path("stats", views.stats),
    path("stats/", views.stats),
    path("click", views.click),
    path("click/", views.click),
    path("lead", views.lead),
    path("lead/", views.lead),
    path("sale", views.sale),
    path("sale/", views.sale),
    path("affiliate-visitors", views.affiliate_visitors),
    path("affiliate-visitors/", views.affiliate_visitors),
    path("funnel", views.funnel),
    path("funnel/", views.funnel),
    path("recent-referrals", views.recent_referrals),
    path("recent-referrals/", views.recent_referrals),
]
