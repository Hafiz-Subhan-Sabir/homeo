from django.urls import path

from . import views
from . import auth_views

urlpatterns = [
    path("auth/signup/", auth_views.signup),
    path("auth/login/", auth_views.login),
    path("auth/logout/", auth_views.logout),
    path("auth/me/", auth_views.me),
    path("health/", views.health),
    path("mindset/status/", views.mindset_status),
    path("documents/upload/", views.upload_document),
    path("documents/<int:document_id>/download-url/", views.document_download_url),
    path("documents/ingest/", views.ingest_document),
    path("syndicate/bootstrap/", views.syndicate_bootstrap),
]
