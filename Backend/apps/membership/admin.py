from django import forms
from django.contrib import admin, messages
from django.core.files.uploadedfile import UploadedFile

from apps.membership.keyword_dataset import KeywordDatasetParseError, parse_keyword_dataset_bytes
from apps.membership.models import Article, ArticleKeywordDataset, KeywordUsageStat, MembershipGenerationState, Video


class ArticleKeywordDatasetForm(forms.ModelForm):
    class Meta:
        model = ArticleKeywordDataset
        fields = "__all__"

    def clean_csv_file(self):
        f = self.cleaned_data.get("csv_file")
        if not f:
            return f
        if isinstance(f, UploadedFile):
            raw = f.read()
            f.seek(0)
            name = getattr(f, "name", "") or ""
            try:
                rows = parse_keyword_dataset_bytes(raw, filename=name)
            except KeywordDatasetParseError as exc:
                raise forms.ValidationError(str(exc)) from exc
            if not rows:
                raise forms.ValidationError(
                    "No keywords could be parsed or extracted. Check the file has enough text, "
                    "or use CSV / two-column Word tables (category, keyword)."
                )
            self.parsed_keyword_rows = rows
        return f


@admin.register(ArticleKeywordDataset)
class ArticleKeywordDatasetAdmin(admin.ModelAdmin):
    form = ArticleKeywordDatasetForm
    list_display = ("name", "is_active", "row_count", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name",)
    exclude = ("rows",)
    readonly_fields = ("created_at", "rows_preview")

    @admin.display(description="Rows")
    def row_count(self, obj: ArticleKeywordDataset) -> int:
        return len(obj.rows) if isinstance(obj.rows, list) else 0

    def rows_preview(self, obj: ArticleKeywordDataset) -> str:
        if not getattr(obj, "pk", None):
            return "Save the dataset once with a file to preview parsed rows."
        if not obj.rows:
            return "-"
        import json

        return json.dumps(obj.rows[:8], ensure_ascii=False, indent=2) + (
            f"\n... ({len(obj.rows)} total)" if len(obj.rows) > 8 else ""
        )

    def save_model(self, request, obj: ArticleKeywordDataset, form, change) -> None:
        super().save_model(request, obj, form, change)
        rows: list | None = getattr(form, "parsed_keyword_rows", None)
        if rows is None and obj.csv_file:
            try:
                obj.csv_file.open("rb")
                raw = obj.csv_file.read()
            finally:
                obj.csv_file.close()
            try:
                rows = parse_keyword_dataset_bytes(raw, filename=obj.csv_file.name)
            except KeywordDatasetParseError as exc:
                self.message_user(request, str(exc), level=messages.ERROR)
                rows = []
        if rows is not None:
            ArticleKeywordDataset.objects.filter(pk=obj.pk).update(rows=rows)
            obj.rows = rows
            if rows and (not change or "csv_file" in form.changed_data):
                self.message_user(request, f"Keyword dataset saved with {len(rows)} seeds.", messages.SUCCESS)
        if obj.is_active:
            ArticleKeywordDataset.objects.exclude(pk=obj.pk).update(is_active=False)


@admin.register(KeywordUsageStat)
class KeywordUsageStatAdmin(admin.ModelAdmin):
    list_display = ("keyword", "category", "usage_count", "last_used_at", "dataset")
    list_filter = ("category",)
    search_fields = ("keyword", "fingerprint")
    readonly_fields = ("fingerprint",)


@admin.register(MembershipGenerationState)
class MembershipGenerationStateAdmin(admin.ModelAdmin):
    list_display = ("id", "updated_at")
    readonly_fields = ("id", "updated_at")


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "is_featured", "has_pdf", "published_at", "created_at")
    list_filter = ("is_featured",)
    search_fields = ("title", "slug", "description")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("created_at",)

    @admin.display(boolean=True)
    def has_pdf(self, obj: Article) -> bool:
        return bool(obj.pdf_file)


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ("title", "duration", "created_at")
    search_fields = ("title", "description")
