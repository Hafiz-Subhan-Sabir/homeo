from django.urls import path

from apps.courses import views

urlpatterns = [
    path("<int:pk>/videos/", views.CourseVideosListView.as_view(), name="courses-videos"),
    path("<int:pk>/", views.CourseDetailView.as_view(), name="courses-detail"),
    path("", views.CourseListCreateView.as_view(), name="courses-list"),
]
