from django.urls import path

from . import views
from .agent_quote_view import agent_quote_today

urlpatterns = [
    path("me/progress/", views.syndicate_progress),
    path("me/streak_record/", views.syndicate_streak_record),
    path("me/streak_restore/", views.syndicate_streak_restore),
    path("", views.challenge_list_create),
    path("today/", views.challenges_today),
    path("user_task/", views.challenges_user_custom),
    path("generate/", views.generate_challenges_view),
    path("history/", views.challenge_history),
    path("recent/", views.challenges_recent),
    path("generate_daily/", views.challenges_generate_daily),
    path("score_response/", views.mission_score_response),
    path("generate_pair/", views.challenges_generate_pair),
    path("agent_quote/", agent_quote_today),
    path("leaderboard/", views.leaderboard_list),
    path("leaderboard/sync/", views.leaderboard_sync),
    path("referral/create/", views.referral_create),
    path("referral/redeem/", views.referral_redeem),
    path("referral/status/", views.referral_status),
    path("referral/claim/", views.referral_claim),
    path("admin_tasks/active/", views.admin_tasks_active),
    path("admin_tasks/submit/", views.admin_task_submit),
    path("admin_tasks/claim_points/", views.admin_task_claim_points),
]
