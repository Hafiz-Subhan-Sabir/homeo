import mimetypes
from pathlib import Path

import boto3
from botocore.config import Config as BotoConfig
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


def _iter_files(root: Path):
    for path in sorted(root.rglob("*")):
        if path.is_file():
            yield path


def _content_type(path: Path) -> str:
    if path.suffix.lower() == ".m3u8":
        return "application/vnd.apple.mpegurl"
    if path.suffix.lower() == ".ts":
        return "video/mp2t"
    guessed, _ = mimetypes.guess_type(str(path))
    return guessed or "application/octet-stream"


class Command(BaseCommand):
    help = (
        "Upload local assets to S3-compatible bucket. "
        "Useful before/after Railway deploy to seed media/public files."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--include-media",
            action="store_true",
            help="Upload Backend/media/** to bucket prefix media/.",
        )
        parser.add_argument(
            "--include-public",
            action="store_true",
            help="Upload Frontend-Dashboard/public/** to bucket prefix public/.",
        )
        parser.add_argument(
            "--public-dir",
            default="../Frontend-Dashboard/public",
            help="Public directory path relative to Backend (default: ../Frontend-Dashboard/public).",
        )
        parser.add_argument(
            "--media-prefix",
            default="media",
            help="Bucket key prefix for media files (default: media).",
        )
        parser.add_argument(
            "--public-prefix",
            default="public",
            help="Bucket key prefix for public files (default: public).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show planned uploads without sending files.",
        )

    def handle(self, *args, **options):
        if not getattr(settings, "USE_S3_OBJECT_STORAGE", False):
            raise CommandError("S3 object storage is not enabled. Set USE_S3_OBJECT_STORAGE=true and bucket credentials.")

        endpoint = (getattr(settings, "AWS_S3_ENDPOINT_URL", None) or "").strip() or None
        bucket = (getattr(settings, "AWS_STORAGE_BUCKET_NAME", None) or "").strip()
        access = (getattr(settings, "AWS_ACCESS_KEY_ID", None) or "").strip()
        secret = (getattr(settings, "AWS_SECRET_ACCESS_KEY", None) or "").strip()
        region = (getattr(settings, "AWS_S3_REGION_NAME", None) or "us-east-1").strip()
        if not (bucket and access and secret):
            raise CommandError("Bucket credentials are missing in settings/env.")

        include_media = bool(options["include_media"])
        include_public = bool(options["include_public"])
        if not include_media and not include_public:
            raise CommandError("Nothing selected. Use --include-media and/or --include-public.")

        client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            region_name=region,
            aws_access_key_id=access,
            aws_secret_access_key=secret,
            config=BotoConfig(retries={"max_attempts": 8, "mode": "adaptive"}),
        )

        base_dir = Path(settings.BASE_DIR).resolve()
        upload_sets: list[tuple[Path, str]] = []
        if include_media:
            upload_sets.append((Path(settings.MEDIA_ROOT).resolve(), options["media_prefix"].strip().strip("/") or "media"))
        if include_public:
            public_dir = (base_dir / options["public_dir"]).resolve()
            upload_sets.append((public_dir, options["public_prefix"].strip().strip("/") or "public"))

        total = 0
        for local_root, prefix in upload_sets:
            if not local_root.exists():
                self.stdout.write(self.style.WARNING(f"Skip missing directory: {local_root}"))
                continue
            self.stdout.write(f"Scanning {local_root} -> s3://{bucket}/{prefix}/")
            for path in _iter_files(local_root):
                rel = path.relative_to(local_root).as_posix()
                key = f"{prefix}/{rel}"
                total += 1
                if options["dry_run"]:
                    self.stdout.write(f"[dry-run] upload {path} -> s3://{bucket}/{key}")
                    continue
                client.upload_file(
                    str(path),
                    bucket,
                    key,
                    ExtraArgs={"ContentType": _content_type(path)},
                )
                self.stdout.write(f"uploaded: s3://{bucket}/{key}")

        self.stdout.write(self.style.SUCCESS(f"Done. Processed {total} file(s)."))
