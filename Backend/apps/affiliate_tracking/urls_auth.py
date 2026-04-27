"""
Affiliate portal auth (OTP). Mounted at /api/affiliate/auth/
— separate from JWT portal routes at /api/auth/login/.
"""

from django.urls import path

from . import views

urlpatterns = [
    path("login", views.auth_login),
    path("login/", views.auth_login),
    path("request-otp", views.auth_request_otp),
    path("request-otp/", views.auth_request_otp),
    path("verify-otp", views.auth_verify_otp),
    path("verify-otp/", views.auth_verify_otp),
]
