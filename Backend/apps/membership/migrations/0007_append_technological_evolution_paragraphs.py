# Generated manually — extends membership article body copy.

from django.db import migrations

SLUG = "understanding-the-technological-evolution-that-shaped-our-modern-society"
MARKER = "The twentieth century layered electricity"


def append_paragraphs(apps, schema_editor):
    Article = apps.get_model("membership", "Article")
    a = Article.objects.filter(slug=SLUG).only("id", "content").first()
    if not a:
        return
    body = (a.content or "").strip()
    if MARKER in body:
        return
    addition = (
        "\n\nThe twentieth century layered electricity, mass production, and computing onto the steam-age foundations. "
        "Assembly lines, aviation, telecommunications, and early mainframes did not replace older systems overnight—they "
        "rewired how organizations coordinated people, capital, and risk. That cumulative shift is why small policy "
        "decisions and adoption choices today still echo decisions made in prior industrial waves.\n\n"
        "Looking ahead, connectivity, automation, and artificial intelligence extend the same arc: tools that compress "
        "distance and speed up feedback. The disciplined operator treats them as force multipliers, not substitutes for "
        "judgment—grounding leverage in ethics, verification, and long-term resilience so societies inherit capability "
        "rather than fragility."
    )
    a.content = body + addition
    a.save(update_fields=["content"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("membership", "0006_keyword_usage_progression"),
    ]

    operations = [
        migrations.RunPython(append_paragraphs, noop_reverse),
    ]
