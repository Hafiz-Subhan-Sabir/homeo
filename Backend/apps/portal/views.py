from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, status, views
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.portal.models import Mission, Note, Reminder, SocialLink, UserPlanPurchase
from apps.video_streaming.models import StreamPlaylistPurchase
from apps.portal.permissions import DeckPermission, IsAuthenticatedStrict, SocialLinkPermission
from apps.portal.serializers import (
    MissionSerializer,
    NoteSerializer,
    ReminderSerializer,
    SocialLinkSerializer,
    SyndicateTokenObtainPairSerializer,
    UserMeSerializer,
)


@method_decorator(csrf_exempt, name="dispatch")
class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = SyndicateTokenObtainPairSerializer


@method_decorator(csrf_exempt, name="dispatch")
class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class LogoutView(views.APIView):
    """
    JWT is stateless: client discards tokens. Optional: pass refresh in body to blacklist
    if simplejwt blacklist is enabled later.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(views.APIView):
    permission_classes = [IsAuthenticatedStrict]

    def get(self, request):
        return Response(UserMeSerializer(request.user).data)


class BillingPurchasesView(views.APIView):
    """
    Unified billing rows: stream playlist checkouts + plan bundles (Money Mastery / King).
    Shape matches StreamPlaylistPurchaseHistorySerializer for dashboard Settings.
    """

    permission_classes = [IsAuthenticatedStrict]

    def get(self, request):
        user = request.user
        rows: list[dict] = []
        for p in (
            StreamPlaylistPurchase.objects.filter(user=user)
            .select_related("playlist")
            .order_by("-paid_at", "-id")
        ):
            pl = p.playlist
            rows.append(
                {
                    "id": p.id,
                    "playlist_id": p.playlist_id,
                    "playlist_title": pl.title if pl is not None else f"Playlist #{p.playlist_id}",
                    "status": p.status,
                    "amount_paid": str(p.amount_paid),
                    "currency": (p.currency or "gbp").lower(),
                    "paid_at": p.paid_at.isoformat() if p.paid_at else None,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                    "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                }
            )
        for pp in UserPlanPurchase.objects.filter(user=user).order_by("-paid_at", "-id"):
            rows.append(
                {
                    "id": -pp.id,
                    "playlist_id": 0,
                    "playlist_title": pp.product_title,
                    "status": pp.status,
                    "amount_paid": str(pp.amount_paid),
                    "currency": (pp.currency or "gbp").lower(),
                    "paid_at": pp.paid_at.isoformat() if pp.paid_at else None,
                    "created_at": pp.created_at.isoformat() if pp.created_at else None,
                    "updated_at": pp.updated_at.isoformat() if pp.updated_at else None,
                }
            )

        def sort_key(r: dict) -> str:
            return r.get("paid_at") or r.get("created_at") or ""

        rows.sort(key=sort_key, reverse=True)
        return Response(rows)


class SocialLinkListCreateView(generics.ListCreateAPIView):
    serializer_class = SocialLinkSerializer
    permission_classes = [IsAuthenticatedStrict, SocialLinkPermission]

    def get_queryset(self):
        qs = SocialLink.objects.all()
        user = self.request.user
        from apps.portal.rbac import user_has_permission

        if user_has_permission(user, "social.links.manage_all"):
            return qs.order_by("-updated_at")
        return qs.filter(user=user).order_by("-updated_at")


class SocialLinkDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SocialLinkSerializer
    permission_classes = [IsAuthenticatedStrict, SocialLinkPermission]
    lookup_field = "pk"

    def get_queryset(self):
        user = self.request.user
        from apps.portal.rbac import user_has_permission

        if user_has_permission(user, "social.links.manage_all"):
            return SocialLink.objects.all()
        return SocialLink.objects.filter(user=user)


class MissionListCreateView(generics.ListCreateAPIView):
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticatedStrict, DeckPermission]

    def get_queryset(self):
        return Mission.objects.filter(user=self.request.user).order_by("-target_at")


class MissionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticatedStrict, DeckPermission]

    def get_queryset(self):
        return Mission.objects.filter(user=self.request.user)


class ReminderListCreateView(generics.ListCreateAPIView):
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticatedStrict, DeckPermission]

    def get_queryset(self):
        return Reminder.objects.filter(user=self.request.user).order_by("-date", "-time")


class ReminderDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticatedStrict, DeckPermission]

    def get_queryset(self):
        return Reminder.objects.filter(user=self.request.user)


class NoteListCreateView(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticatedStrict, DeckPermission]

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user).order_by("-created_at")


class NoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticatedStrict, DeckPermission]

    def get_queryset(self):
        return Note.objects.filter(user=self.request.user)
