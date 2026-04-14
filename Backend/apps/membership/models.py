from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class ArticleKeywordDataset(models.Model):
    """
    Admin-uploaded source for AI-generated membership article seeds.
    Upload CSV, Word (.docx), or PDF. If the file has category/keyword columns or lines, those are
    used. Otherwise the full document text is read and OpenAI extracts keyword seeds automatically
    (requires OPENAI_API_KEY). Legacy .doc not supported—use .docx or CSV.
    """

    name = models.CharField(max_length=200)
    csv_file = models.FileField(
        upload_to="membership/keyword_datasets/",
        help_text="CSV, Word (.docx), or PDF. Structured sheets parse directly; prose PDFs/DOCX get automatic keyword extraction via OpenAI.",
    )
    rows = models.JSONField(
        default=list,
        blank=True,
        help_text="Filled automatically when the file is saved.",
    )
    csv_file = models.FileField(
        upload_to="membership/keyword_datasets/",
        help_text="CSV, Word (.docx), or PDF. Each row: category, keyword. Legacy .doc not supported.",
    )
    rows = models.JSONField(
        default=list,
        blank=True,
        help_text="Filled automatically when the file is saved.",
    )
    is_active = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self) -> str:
        return self.name


class Article(models.Model):
    title = models.CharField(max_length=500)
    slug = models.SlugField(max_length=500, unique=True, db_index=True)
    description = models.TextField(blank=True)
    content = models.TextField(blank=True)
    source_url = models.URLField(max_length=2048, blank=True)
    thumbnail = models.URLField(max_length=2048, blank=True)
    published_at = models.DateTimeField(default=timezone.now, db_index=True)
    tags = models.JSONField(default=list, blank=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    pdf_file = models.FileField(
        upload_to="membership/pdfs/",
        blank=True,
        null=True,
        help_text="Optional stored PDF for members (search uses title/description/content; seed can append PDF text extract).",
    )

    class Meta:
        ordering = ["-published_at", "-id"]

    def __str__(self) -> str:
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)[:495] or "article"
            slug = base
            n = 2
            while Article.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                suffix = f"-{n}"
                slug = f"{base[: 495 - len(suffix)]}{suffix}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)


class Video(models.Model):
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    video_url = models.URLField(max_length=2048)
    thumbnail = models.URLField(max_length=2048, blank=True)
    duration = models.CharField(max_length=32, blank=True, help_text='Display e.g. "12:34" or "1:02:05"')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self) -> str:
        return self.title
