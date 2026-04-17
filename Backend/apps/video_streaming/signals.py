from django.db import transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from apps.video_streaming.models import StreamVideo
from apps.video_streaming.transcode_policy import inline_stream_transcode_enabled


@receiver(pre_save, sender=StreamVideo)
def _stream_video_remember_original_name(sender, instance: StreamVideo, **kwargs) -> None:
    if instance.pk:
        try:
            prev = StreamVideo.objects.only("original_video").get(pk=instance.pk)
            instance._pre_save_original_video_name = prev.original_video.name or ""
        except StreamVideo.DoesNotExist:
            instance._pre_save_original_video_name = ""
    else:
        instance._pre_save_original_video_name = ""


@receiver(post_save, sender=StreamVideo)
def _stream_video_enqueue_transcode(sender, instance: StreamVideo, created: bool, **kwargs) -> None:
    if kwargs.get("raw"):
        return
    if not instance.original_video or not instance.original_video.name:
        return
    prev = getattr(instance, "_pre_save_original_video_name", "")
    if not created and instance.original_video.name == prev:
        return
    from apps.video_streaming.tasks import process_stream_video_to_hls

    def _trigger(vid: int) -> None:
        # Local dev: run inline when DEBUG / eager / STREAM_SYNC_TRANSCODE_ON_PLAYBACK.
        if inline_stream_transcode_enabled():
            process_stream_video_to_hls(vid)
            return
        process_stream_video_to_hls.delay(vid)

    # Inline mode: run on save so admin sees ready status without a worker.
    # Otherwise defer until commit so the file row + storage are consistent before queueing.
    if inline_stream_transcode_enabled():
        _trigger(instance.pk)
    else:
        transaction.on_commit(lambda vid=instance.pk: _trigger(vid))
