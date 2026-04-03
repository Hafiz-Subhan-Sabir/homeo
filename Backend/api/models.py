from django.db import models


class UploadedDocument(models.Model):
    """Uploaded document; text in DB. stored_path is inline/... when no file is kept on disk (Railway)."""

    original_name = models.CharField(max_length=512)
    stored_path = models.CharField(max_length=1024)
    content_hash = models.CharField(max_length=64, db_index=True)
    text_extracted = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.original_name


class MindsetKnowledge(models.Model):
    """
    Structured output from the ingest agent (OpenAI): mindsets with patterns, habits, benefits,
    plus themes and anti_patterns. Challenge generation reads this JSON, not the source file.
    """

    source = models.OneToOneField(
        UploadedDocument,
        on_delete=models.CASCADE,
        related_name="mindset",
    )
    payload = models.JSONField()
    updated_at = models.DateTimeField(auto_now=True)
    model_used = models.CharField(max_length=64, blank=True)

    def __str__(self) -> str:
        return f"MindsetKnowledge({self.source_id})"
