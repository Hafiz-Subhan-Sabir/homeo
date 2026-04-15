from django.urls import path

from apps.courses import views

urlpatterns = [
    path("upload-credentials/", views.UploadCredentialsView.as_view(), name="videos-upload-credentials"),
    path("<int:pk>/otp/", views.VideoOTPView.as_view(), name="videos-otp"),
    path("<int:pk>/progress/", views.VideoProgressView.as_view(), name="videos-progress"),
    path("", views.VideoMetadataCreateView.as_view(), name="videos-create"),
]
