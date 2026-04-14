import random
import uuid

from django.db.models import Q
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from django.utils import timezone
from rest_framework import generics, status, views
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.membership.keyword_dataset import VALID_CATEGORIES, dataset_category_counts, normalize_category
from apps.membership.models import Article, ArticleKeywordDataset, Video
from apps.membership.permissions import MembershipPublicReadOrAuthenticated
from apps.membership.redis_index import cache_get_merged_ids, cache_set_merged_ids, search_article_ids, tokenize
from apps.membership.serializers import ArticleSerializer, VideoSerializer
from apps.portal.permissions import IsAuthenticatedStrict


class MembershipPagination(PageNumberPagination):
    page_size = 150
    page_size_query_param = "page_size"
    max_page_size = 150


def _ordered_qs(qs, sort: str):
    if sort == "oldest":
        return qs.order_by("published_at", "id")
    return qs.order_by("-published_at", "-id")


def _merge_search_pks(qs, q: str, cache_params: str) -> tuple[set[int], str]:
    q = (q or "").strip()
    if not q:
        return set(qs.values_list("pk", flat=True)), "database"

    cached = cache_get_merged_ids(cache_params)
    if cached is not None:
        return set(cached), "redis_cache"

    db_q = Q(title__icontains=q) | Q(description__icontains=q) | Q(content__icontains=q)
    db_ids = set(qs.filter(db_q).values_list("pk", flat=True))
    redis_ids = search_article_ids(q)

    if redis_ids is None:
        merged = db_ids
        src = "database"
    else:
        merged = redis_ids | db_ids
        if db_ids and not redis_ids:
            src = "database"
        elif redis_ids and not db_ids:
            src = "redis"
        else:
            src = "mixed"

    cache_set_merged_ids(cache_params, list(merged))
    return merged, src


def build_article_queryset(request) -> tuple:
    qs = Article.objects.all()
    sort = (request.query_params.get("sort") or "newest").lower()
    if sort not in ("newest", "oldest"):
        sort = "newest"
    date_from = (request.query_params.get("date_from") or "").strip()
    date_to = (request.query_params.get("date_to") or "").strip()
    q = (request.query_params.get("q") or "").strip()
    search_in = (request.query_params.get("search_in") or "all").strip().lower()
    if search_in not in {"all", "title"}:
        search_in = "all"
    d_from = parse_date(date_from) if date_from else None
    d_to = parse_date(date_to) if date_to else None
    if d_from:
        qs = qs.filter(published_at__date__gte=d_from)
    if d_to:
        qs = qs.filter(published_at__date__lte=d_to)

    meta = None
    if q:
        if search_in == "title":
            qs = qs.filter(title__icontains=q)
            meta = {"search_source": "database_title", "tokens": list(tokenize(q))}
        else:
            cache_params = f"q={q}&date_from={date_from}&date_to={date_to}"
            merged, src = _merge_search_pks(qs, q, cache_params)
            meta = {"search_source": src, "tokens": list(tokenize(q))}
            if not merged:
                qs = qs.none()
            else:
                qs = qs.filter(pk__in=merged)

    qs = _ordered_qs(qs, sort)
    return qs, meta


class ArticleListView(generics.ListAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [MembershipPublicReadOrAuthenticated]
    pagination_class = MembershipPagination

    def get_queryset(self):
        qs, self._membership_search_meta = build_article_queryset(self.request)
        return qs

    def list(self, request, *args, **kwargs):
        self._membership_search_meta = None
        response = super().list(request, *args, **kwargs)
        meta = getattr(self, "_membership_search_meta", None)
        if meta and isinstance(response.data, dict):
            response.data["search_source"] = meta["search_source"]
            response.data["tokens"] = meta["tokens"]
        return response


class ArticleDetailView(generics.RetrieveAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [MembershipPublicReadOrAuthenticated]
    lookup_field = "slug"
    queryset = Article.objects.all()


class VideoListView(generics.ListAPIView):
    serializer_class = VideoSerializer
    permission_classes = [MembershipPublicReadOrAuthenticated]
    pagination_class = MembershipPagination

    def get_queryset(self):
        return Video.objects.all().order_by("-created_at", "-id")


class MembershipSearchView(generics.ListAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [MembershipPublicReadOrAuthenticated]
    pagination_class = MembershipPagination

    def get_queryset(self):
        qs, self._membership_search_meta = build_article_queryset(self.request)
        return qs

    def list(self, request, *args, **kwargs):
        self._membership_search_meta = None
        response = super().list(request, *args, **kwargs)
        q = (request.query_params.get("q") or "").strip()
        if isinstance(response.data, dict):
            if q:
                meta = getattr(self, "_membership_search_meta", None) or {"search_source": "database", "tokens": []}
                response.data["search_source"] = meta["search_source"]
                response.data["tokens"] = meta["tokens"]
            else:
                response.data["search_source"] = "database"
                response.data["tokens"] = []
        return response


class ArticleTagsView(views.APIView):
    permission_classes = [MembershipPublicReadOrAuthenticated]

    def get(self, request):
        tags: set[str] = set()
        for row in Article.objects.values_list("tags", flat=True):
            if isinstance(row, list):
                tags.update(str(t) for t in row if t)
        return Response(sorted(tags))


class ArticlePdfView(APIView):
    permission_classes = [IsAuthenticatedStrict]

    def get(self, request, pk: int):
        article = get_object_or_404(Article, pk=pk)
        if not article.pdf_file:
            raise Http404()
        try:
            fh = article.pdf_file.open("rb")
        except Exception:
            raise Http404()
        name = article.pdf_file.name.rsplit("/", 1)[-1]
        resp = FileResponse(fh, content_type="application/pdf")
        resp["Content-Disposition"] = f'inline; filename="{name}"'
        return resp


class MembershipGeneratedArticleMetaView(APIView):
    permission_classes = [MembershipPublicReadOrAuthenticated]

    def get(self, request):
        ds = ArticleKeywordDataset.objects.filter(is_active=True).first()
        if not ds:
            return Response({"active": False, "categories": {}, "total": 0})
        rows = ds.rows if isinstance(ds.rows, list) else []
        counts = dataset_category_counts(rows)
        return Response({"active": True, "categories": counts, "total": len(rows)})


class MembershipGeneratedArticleView(APIView):
    permission_classes = [MembershipPublicReadOrAuthenticated]

    def post(self, request):
        today = timezone.localdate()
        existing_today = (
            Article.objects.filter(tags__contains=["operator-brief"], published_at__date=today)
            .order_by("-published_at", "-id")
            .first()
        )
        if existing_today:
            return Response(
                {
                    "detail": "Daily generation limit reached (1 article per day).",
                    "already_generated_today": True,
                    "article_id": existing_today.id,
                    "article_slug": existing_today.slug,
                },
                status=status.HTTP_200_OK,
            )

        ds = ArticleKeywordDataset.objects.filter(is_active=True).first()
        if not ds or not isinstance(ds.rows, list) or not ds.rows:
            return Response(
                {"detail": "No active keyword dataset. Upload a CSV in Django admin and mark it active."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        cat_req = (request.data.get("category") or "all").strip().lower()
        if cat_req not in {"all", *VALID_CATEGORIES}:
            return Response({"detail": "Invalid category. Use all, business, money, power, grooming, or others."}, status=400)

        rows = [r for r in ds.rows if isinstance(r, dict) and str(r.get("keyword") or "").strip()]
        if cat_req != "all":
            rows = [r for r in rows if normalize_category(str(r.get("category") or "")) == cat_req]
        if not rows:
            return Response({"detail": "No keywords for that category in the active dataset."}, status=400)

        row = random.choice(rows)
        keyword = str(row.get("keyword") or "").strip()
        category = normalize_category(str(row.get("category") or cat_req))

        avoid_in = request.data.get("avoid_titles")
        avoid: list[str] = []
        if isinstance(avoid_in, list):
            avoid = [str(x).strip() for x in avoid_in if str(x).strip()][:40]

        seed = uuid.uuid4().hex[:14]
        try:
            from api.services.openai_client import generate_membership_article

            body = generate_membership_article(
                keyword=keyword,
                category=category,
                avoid_titles=avoid,
                creative_seed=seed,
            )
        except RuntimeError as e:
            msg = str(e)
            if "OPENAI_API_KEY" in msg:
                return Response(
                    {"detail": "Article generation is not configured (OPENAI_API_KEY missing)."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            return Response({"detail": msg or "Generation failed."}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as e:
            return Response({"detail": str(e) or "Generation failed."}, status=status.HTTP_502_BAD_GATEWAY)

        body["keyword_used"] = keyword
        body["category_used"] = category

        key_points = [str(x).strip() for x in (body.get("key_points") or []) if str(x).strip()]
        paragraphs = [str(x).strip() for x in (body.get("paragraphs") or []) if str(x).strip()]
        desc_parts = key_points[:2] if key_points else paragraphs[:1]
        description = " ".join(desc_parts)[:900] if desc_parts else ""

        content_lines = [
            f"Seed: {keyword} - {category}",
            "",
            "Key points",
            "",
        ]
        for kp in key_points:
            content_lines.append(f"- {kp}")
        content_lines.extend(["", ""])
        content_lines.extend(paragraphs)
        content = "\n".join(content_lines).strip()

        tags = ["operator-brief", category]
        article = Article(
            title=str(body.get("title") or "Operator brief")[:500],
            description=description,
            content=content,
            tags=tags,
            source_url="",
            thumbnail="",
            is_featured=False,
        )
        article.save()
        body["article_id"] = article.id
        body["article_slug"] = article.slug

        return Response(body)
