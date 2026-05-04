import html
import json
import random
import re
import secrets
from datetime import timedelta
from decimal import Decimal
from urllib.parse import urlsplit

import stripe
from django.conf import settings
from rest_framework.authtoken.models import Token
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from apps.affiliate_tracking.views import ensure_affiliate_profile_for_existing_user, referral_ids_payload
from apps.courses.models import Course, CourseEnrollment
from apps.portal.models import UserDashboardEntitlement, UserPlanPurchase
from apps.video_streaming.models import StreamPlaylist, StreamPlaylistPurchase
from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication

from .models import LoginOTP, PendingSignup, ReturningCheckout, SignupOTP
from .syndicate_otp_mailer import build_syndicate_otp_email_html, send_syndicate_otp_html_email


def _canonical_user_for_email(email: str) -> User | None:
  """Oldest user row for this email (handles legacy duplicate User rows)."""
  e = (email or "").strip().lower()
  if not e:
    return None
  return User.objects.filter(email=e).order_by("pk").first()


def _json_error(message: str, status: int = 400) -> JsonResponse:
  return JsonResponse({"error": message}, status=status)


def _authenticate_jwt_user(request):
  try:
    auth = JWTAuthentication()
    drf_request = Request(request)
    result = auth.authenticate(drf_request)
    if result:
      return result[0]
  except Exception:
    return None
  return None


def _authenticate_checkout_user(request):
  """Bearer JWT or `Authorization: Token <key>` — matches dashboard sessions so plan upgrades work from the shell."""
  u = _authenticate_jwt_user(request)
  if u is not None:
    return u
  header = (request.META.get("HTTP_AUTHORIZATION") or "").strip()
  parts = header.split()
  if len(parts) == 2 and parts[0].lower() == "token":
    key = parts[1].strip()
    if key:
      try:
        tok = Token.objects.select_related("user").get(key=key)
        return tok.user
      except Token.DoesNotExist:
        return None
  return None


def _parse_pence_from_amount_payload(raw) -> int | None:
  if raw is None:
    return None
  s = re.sub(r"[^0-9.]", "", str(raw).strip())
  if not s:
    return None
  try:
    v = float(s)
    return int(max(50, round(v * 100)))
  except ValueError:
    return None


def _apply_purchased_plan(user: User, plan: str) -> None:
  plan = (plan or "").strip().lower()
  if plan not in ("bundle", "king", "pawn", "knight"):
    return
  ent, _ = UserDashboardEntitlement.objects.get_or_create(user=user)
  if plan == "bundle":
    ent.access_tier = UserDashboardEntitlement.AccessTier.MONEY_MASTERY
    ent.save(update_fields=["access_tier", "updated_at"])
    for course in Course.objects.filter(is_published=True):
      CourseEnrollment.objects.get_or_create(user=user, course=course)
    return
  if plan == "king":
    ent.access_tier = UserDashboardEntitlement.AccessTier.KING
    ent.save(update_fields=["access_tier", "updated_at"])
    return
  if plan in ("pawn", "knight"):
    ent.access_tier = UserDashboardEntitlement.AccessTier.NONE
    ent.save(update_fields=["access_tier", "updated_at"])


def _record_user_plan_purchase(user: User, session, plan_sel: str, paid_amount: float, paid_currency: str) -> None:
  """Persist plan checkout for dashboard billing history (Money Mastery, King, etc.)."""
  plan_sel = (plan_sel or "").strip().lower()
  if plan_sel not in ("bundle", "king", "pawn", "knight"):
    return
  sid = str(getattr(session, "id", "") or "").strip()
  if not sid:
    return
  titles = {
    "bundle": "Money Mastery (lifetime bundle)",
    "king": "The King",
    "pawn": "Pawn",
    "knight": "Knight",
  }
  try:
    amt = Decimal(str(paid_amount))
  except Exception:
    amt = Decimal("0.00")
  cur = (paid_currency or "gbp").strip().lower()[:8] or "gbp"
  UserPlanPurchase.objects.update_or_create(
    stripe_checkout_session_id=sid,
    defaults={
      "user": user,
      "plan_slug": plan_sel,
      "product_title": titles.get(plan_sel, plan_sel),
      "amount_paid": amt,
      "currency": cur,
      "status": UserPlanPurchase.Status.PAID,
      "paid_at": timezone.now(),
    },
  )


def _read_payload(request):
  try:
    return json.loads(request.body.decode("utf-8"))
  except json.JSONDecodeError:
    return None


def _generate_otp() -> str:
  return f"{random.randint(0, 999999):06d}"


def _send_login_otp_email(email: str, otp_code: str, username: str) -> None:
  expires_minutes = getattr(settings, "OTP_EXPIRES_MINUTES", 10)
  safe_name = html.escape(username)
  html_body = build_syndicate_otp_email_html(
    header_badge="Neural Access Node",
    greeting_line=f'Operator <span style="color:#fef3c7;">{safe_name}</span>,',
    intro_paragraph="Authentication handshake initiated. Use this access code to complete login.",
    otp_box_label="One-time Code",
    otp_code=otp_code,
    expires_minutes=expires_minutes,
    ignore_line="If you did not request this login, you can safely ignore this email.",
  )
  send_syndicate_otp_html_email(email, "Your Syndicate login verification code", html_body)


def _send_signup_otp_email(email: str, otp_code: str) -> None:
  expires_minutes = getattr(settings, "OTP_EXPIRES_MINUTES", 10)
  html_body = build_syndicate_otp_email_html(
    header_badge="Identity Provisioning",
    greeting_line="Welcome, operator.",
    intro_paragraph="Identity verification is required before network access is granted.",
    otp_box_label="Verification Code",
    otp_code=otp_code,
    expires_minutes=expires_minutes,
    ignore_line="If you did not request this signup, you can safely ignore this email.",
  )
  send_syndicate_otp_html_email(email, "Your Syndicate signup verification code", html_body)


def _unique_pending_username() -> str:
  for _ in range(32):
    candidate = f"syn_{secrets.token_hex(10)}"
    if not User.objects.filter(username=candidate).exists():
      return candidate
  return f"syn_{secrets.token_hex(16)}"


def _create_and_email_login_otp(email: str):
  """Create LoginOTP and send email. Returns None on success, or JsonResponse error."""
  user_by_email = _canonical_user_for_email(email)
  if user_by_email is None:
    return _json_error("No account found for this email.", status=404)

  otp_code = _generate_otp()
  expires_at = timezone.now() + timedelta(
    minutes=getattr(settings, "OTP_EXPIRES_MINUTES", 10)
  )
  LoginOTP.objects.update_or_create(
    email=email,
    defaults={"otp_code": otp_code, "otp_expires_at": expires_at},
  )

  try:
    _send_login_otp_email(email=email, otp_code=otp_code, username=user_by_email.username)
  except Exception:
    if settings.DEBUG:
      print(f"[DEV OTP FALLBACK] login {email}: {otp_code}")
      return None
    return _json_error("Failed to send login OTP email.", status=500)

  return None


@csrf_exempt
@require_POST
def signup_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  email = str(payload.get("email", "")).strip().lower()
  if not email:
    return _json_error("Email is required.")
  try:
    validate_email(email)
  except ValidationError:
    return _json_error("Enter a valid email address.")

  if User.objects.filter(email=email).exists():
    return _json_error("Email already registered. Please log in.", status=400)

  pending, created = PendingSignup.objects.get_or_create(
    email=email,
    defaults={
      "username": _unique_pending_username(),
      "password_hash": make_password(secrets.token_urlsafe(48)),
      "is_paid": False,
      "stripe_checkout_session_id": "",
    },
  )
  if not created and pending.is_paid:
    return _json_error("This email is already registered. Please log in instead.")

  if not created and not pending.is_paid:
    pending.stripe_checkout_session_id = ""
    pending.save(update_fields=["stripe_checkout_session_id", "updated_at"])

  SignupOTP.objects.filter(email=email).delete()
  LoginOTP.objects.filter(email=email).delete()

  return JsonResponse(
    {
      "message": "Signup started. Continue to checkout.",
      "email": email,
      "signup_token": str(pending.token),
    },
    status=200,
  )


@csrf_exempt
@require_POST
def verify_signup_otp_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  email = str(payload.get("email", "")).strip().lower()
  otp = str(payload.get("otp", "")).strip()

  if not email or not otp:
    return _json_error("Email and OTP are required.")
  if len(otp) != 6 or not otp.isdigit():
    return _json_error("OTP must be a 6-digit code.")

  try:
    pending_signup = PendingSignup.objects.get(email=email)
  except PendingSignup.DoesNotExist:
    return _json_error("No pending signup for this email.", status=404)

  if pending_signup.is_paid:
    return _json_error("Checkout already completed for this email.", status=400)

  try:
    signup_otp = SignupOTP.objects.get(email=email)
  except SignupOTP.DoesNotExist:
    return _json_error("Verification not requested for this email.", status=404)

  if signup_otp.otp_expires_at < timezone.now():
    signup_otp.delete()
    return _json_error("Verification code expired. Please sign up again.", status=400)

  if signup_otp.otp_code != otp:
    return _json_error("Invalid verification code.", status=400)

  signup_otp.delete()

  if User.objects.filter(username=pending_signup.username).exists():
    pending_signup.username = _unique_pending_username()
    pending_signup.save(update_fields=["username", "updated_at"])
  if User.objects.filter(email=pending_signup.email).exists():
    pending_signup.delete()
    return _json_error("Email already registered. Please log in.", status=400)

  user = User(
    username=pending_signup.username,
    email=pending_signup.email,
    password=pending_signup.password_hash,
  )
  user.save()
  pending_signup.is_paid = True
  pending_signup.save(update_fields=["is_paid", "updated_at"])

  auth_token, _ = Token.objects.get_or_create(user=user)
  af_profile = ensure_affiliate_profile_for_existing_user(user)

  return JsonResponse(
    {
      "message": "Signup verified successfully.",
      "email": email,
      "token": auth_token.key,
      "redirect_url": getattr(settings, "POST_LOGIN_REDIRECT_URL", "http://localhost:3000/"),
      "user": {"id": user.id, "username": user.username, "email": user.email},
      "referral_ids": referral_ids_payload(af_profile),
    },
    status=200,
  )


@csrf_exempt
@require_POST
def create_checkout_session_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  signup_token = str(payload.get("signup_token", "")).strip()
  checkout_user = _authenticate_checkout_user(request) if not signup_token else None
  if not signup_token and checkout_user is None:
    return _json_error("Signup token is required.")

  if checkout_user is not None:
    checkout_email = (checkout_user.email or "").strip()
    if not checkout_email:
      return _json_error("Your account has no email on file; add one before checkout.", status=400)
    metadata = {
      "checkout_kind": "logged_in",
      "user_id": str(checkout_user.pk),
      "email": checkout_email,
    }
    selected_playlist = None
    selected_playlist_id_raw = str(payload.get("playlist_id", "")).strip()
    if selected_playlist_id_raw:
      if not selected_playlist_id_raw.isdigit():
        return _json_error("Invalid playlist ID.")
      selected_playlist = StreamPlaylist.objects.filter(
        id=int(selected_playlist_id_raw),
        is_published=True,
        is_coming_soon=False,
      ).first()
      if selected_playlist is None:
        return _json_error("Playlist not found.", status=404)
      if selected_playlist.price <= 0:
        return _json_error("Playlist price must be greater than 0.", status=400)
      metadata["playlist_id"] = str(selected_playlist.id)
    plan_raw = str(payload.get("selected_plan", "")).strip().lower()
    if plan_raw:
      metadata["selected_plan"] = plan_raw
    meta_affiliate_id = str(payload.get("affiliate_id", "")).strip()
    meta_visitor_id = str(payload.get("visitor_id", "")).strip()
    if meta_affiliate_id:
      metadata["affiliate_id"] = meta_affiliate_id
    if meta_visitor_id:
      metadata["visitor_id"] = meta_visitor_id
    if not settings.STRIPE_SECRET_KEY:
      return _json_error(
        "Stripe is not configured. Add STRIPE_SECRET_KEY in backend .env.",
        status=500,
      )
    stripe.api_key = settings.STRIPE_SECRET_KEY
    frontend_base = settings.FRONTEND_BASE_URL.rstrip("/")
    requested_base = str(payload.get("return_base_url", "")).strip()
    if requested_base:
      parsed = urlsplit(requested_base)
      if parsed.scheme in ("http", "https") and bool(parsed.netloc):
        frontend_base = f"{parsed.scheme}://{parsed.netloc}"
    unit_amount = (
      int(max(50, round(float(selected_playlist.price) * 100)))
      if selected_playlist is not None
      else (_parse_pence_from_amount_payload(payload.get("selected_amount")) or settings.CHECKOUT_AMOUNT_PENCE)
    )
    product_name = (
      f"{selected_playlist.title} playlist access"
      if selected_playlist is not None
      else (
        "Money Mastery — lifetime bundle"
        if plan_raw == "bundle"
        else ("The King membership" if plan_raw == "king" else "The Syndicate — checkout")
      )
    )

    def _session_create_logged_in(pm_types: list[str]):
      return stripe.checkout.Session.create(
        mode="payment",
        customer_email=checkout_email,
        payment_method_types=pm_types,
        line_items=[
          {
            "price_data": {
              "currency": "gbp",
              "product_data": {"name": product_name},
              "unit_amount": unit_amount,
            },
            "quantity": 1,
          }
        ],
        success_url=f"{frontend_base}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{frontend_base}/login",
        custom_text={
          "submit": {"message": "The Syndicate — secure checkout"},
        },
        metadata=metadata,
      )

    pm_list = list(settings.STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES)
    try:
      session = _session_create_logged_in(pm_list)
    except stripe.error.InvalidRequestError as exc:
      err_txt = str(exc).lower()
      match = re.search(r"payment method type provided:\s*([a-z0-9_]+)\s+is invalid", err_txt)
      bad_type = match.group(1) if match else ""
      pm_retry = [t for t in pm_list if t != bad_type] if bad_type else [t for t in pm_list if t not in ("pay_by_bank",)]
      if not pm_retry:
        pm_retry = ["card"]
      try:
        session = _session_create_logged_in(pm_retry)
      except stripe.error.StripeError as exc2:
        msg = getattr(exc2, "user_message", None) or str(exc2) or "Stripe could not start checkout."
        return _json_error(msg, status=400)
    except stripe.error.StripeError as exc:
      msg = getattr(exc, "user_message", None) or str(exc) or "Stripe could not start checkout."
      return _json_error(msg, status=400)
    except Exception:
      return _json_error("Unable to create checkout session.", status=500)

    return JsonResponse(
      {
        "checkout_url": session.url,
        "session_id": session.id,
      },
      status=200,
    )

  pending_signup = PendingSignup.objects.filter(token=signup_token).first()
  returning = None
  if pending_signup is None:
    try:
      returning = ReturningCheckout.objects.get(token=signup_token)
    except ReturningCheckout.DoesNotExist:
      return _json_error("Checkout link not found.", status=404)

  if pending_signup is not None:
    if pending_signup.is_paid:
      return _json_error("Checkout already completed for this account.", status=400)
    checkout_email = pending_signup.email
    metadata = {
      "signup_token": str(pending_signup.token),
      "email": checkout_email,
      "checkout_kind": "new_signup",
    }
  else:
    if not User.objects.filter(email=returning.email).exists():
      return _json_error("No account found for this checkout link.", status=404)
    checkout_email = returning.email
    metadata = {
      "returning_token": str(returning.token),
      "email": checkout_email,
      "checkout_kind": "returning",
    }

  plan_payload = str(payload.get("selected_plan", "")).strip().lower()
  if plan_payload:
    metadata["selected_plan"] = plan_payload

  selected_playlist = None
  selected_playlist_id_raw = str(payload.get("playlist_id", "")).strip()
  if selected_playlist_id_raw:
    if not selected_playlist_id_raw.isdigit():
      return _json_error("Invalid playlist ID.")
    selected_playlist = StreamPlaylist.objects.filter(
      id=int(selected_playlist_id_raw),
      is_published=True,
      is_coming_soon=False,
    ).first()
    if selected_playlist is None:
      return _json_error("Playlist not found.", status=404)
    if selected_playlist.price <= 0:
      return _json_error("Playlist price must be greater than 0.", status=400)
    metadata["playlist_id"] = str(selected_playlist.id)

  # Carry affiliate attribution through Stripe metadata so checkout success can
  # reliably restore tracking even if browser local storage is unavailable.
  meta_affiliate_id = str(payload.get("affiliate_id", "")).strip()
  meta_visitor_id = str(payload.get("visitor_id", "")).strip()
  if meta_affiliate_id:
    metadata["affiliate_id"] = meta_affiliate_id
  if meta_visitor_id:
    metadata["visitor_id"] = meta_visitor_id

  if not settings.STRIPE_SECRET_KEY:
    return _json_error(
      "Stripe is not configured. Add STRIPE_SECRET_KEY in backend .env.",
      status=500,
    )

  stripe.api_key = settings.STRIPE_SECRET_KEY
  frontend_base = settings.FRONTEND_BASE_URL.rstrip("/")
  requested_base = str(payload.get("return_base_url", "")).strip()
  if requested_base:
    parsed = urlsplit(requested_base)
    if parsed.scheme in ("http", "https") and bool(parsed.netloc):
      frontend_base = f"{parsed.scheme}://{parsed.netloc}"

  unit_amount = (
    int(max(50, round(float(selected_playlist.price) * 100)))
    if selected_playlist is not None
    else settings.CHECKOUT_AMOUNT_PENCE
  )
  product_name = (
    f"{selected_playlist.title} playlist access"
    if selected_playlist is not None
    else "The Syndicate Membership Checkout"
  )

  def _session_create(pm_types: list[str]):
    return stripe.checkout.Session.create(
      mode="payment",
      customer_email=checkout_email,
      payment_method_types=pm_types,
      line_items=[
        {
          "price_data": {
            "currency": "gbp",
            "product_data": {"name": product_name},
            "unit_amount": unit_amount,
          },
          "quantity": 1,
        }
      ],
      success_url=f"{frontend_base}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
      cancel_url=f"{frontend_base}/signup",
      custom_text={
        "submit": {"message": "The Syndicate — secure checkout"},
      },
      metadata=metadata,
    )

  pm_list = list(settings.STRIPE_CHECKOUT_PAYMENT_METHOD_TYPES)
  try:
    session = _session_create(pm_list)
  except stripe.error.InvalidRequestError as exc:
    err_txt = str(exc).lower()
    match = re.search(r"payment method type provided:\s*([a-z0-9_]+)\s+is invalid", err_txt)
    bad_type = match.group(1) if match else ""
    pm_retry = [t for t in pm_list if t != bad_type] if bad_type else [t for t in pm_list if t not in ("pay_by_bank",)]
    if not pm_retry:
      pm_retry = ["card"]
    try:
      session = _session_create(pm_retry)
    except stripe.error.StripeError as exc2:
      msg = getattr(exc2, "user_message", None) or str(exc2) or "Stripe could not start checkout."
      return _json_error(msg, status=400)
  except stripe.error.StripeError as exc:
    msg = getattr(exc, "user_message", None) or str(exc) or "Stripe could not start checkout."
    return _json_error(msg, status=400)
  except Exception:
    return _json_error("Unable to create checkout session.", status=500)
  
  if pending_signup is not None:
    pending_signup.stripe_checkout_session_id = session.id
    pending_signup.save(update_fields=["stripe_checkout_session_id", "updated_at"])
  else:
    returning.stripe_checkout_session_id = session.id
    returning.save(update_fields=["stripe_checkout_session_id", "updated_at"])

  return JsonResponse(
    {
      "checkout_url": session.url,
      "session_id": session.id,
    },
    status=200,
  )


@csrf_exempt
@require_POST
def checkout_success_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  session_id = str(payload.get("session_id", "")).strip()
  if not session_id:
    return _json_error("Session ID is required.")

  stripe.api_key = settings.STRIPE_SECRET_KEY
  try:
    session = stripe.checkout.Session.retrieve(session_id)
  except Exception:
    return _json_error("Invalid checkout session.", status=400)

  if session.payment_status != "paid":
    return _json_error("Payment not completed.", status=400)
  paid_currency = str(getattr(session, "currency", "gbp") or "gbp").lower()
  paid_minor_total = int(getattr(session, "amount_total", 0) or 0)
  paid_amount = round(paid_minor_total / 100, 2)

  def _session_metadata_dict(session_obj) -> dict:
    raw = getattr(session_obj, "metadata", None)
    if not raw:
      return {}
    if isinstance(raw, dict):
      return dict(raw)
    try:
      to_dict = getattr(raw, "to_dict_recursive", None)
      if callable(to_dict):
        data = to_dict()
        return data if isinstance(data, dict) else {}
    except Exception:
      pass
    data_attr = getattr(raw, "_data", None)
    if isinstance(data_attr, dict):
      return dict(data_attr)
    result = {}
    for k in (
      "playlist_id",
      "checkout_kind",
      "user_id",
      "email",
      "signup_token",
      "returning_token",
      "affiliate_id",
      "visitor_id",
      "selected_plan",
      "selected_billing",
      "selected_amount",
    ):
      try:
        v = raw[k]  # StripeObject supports key indexing.
      except Exception:
        continue
      if v is None:
        continue
      result[str(k)] = str(v)
    return result

  pending_signup = PendingSignup.objects.filter(
    stripe_checkout_session_id=session.id,
  ).first()
  session_meta = _session_metadata_dict(session)
  if pending_signup is not None:
    existing_user = User.objects.filter(email=pending_signup.email).first()
    if existing_user is not None:
      user = existing_user
    else:
      username = pending_signup.username
      if User.objects.filter(username=username).exists():
        username = _unique_pending_username()
        pending_signup.username = username
        pending_signup.save(update_fields=["username", "updated_at"])
      user = User(
        username=username,
        email=pending_signup.email,
        password=pending_signup.password_hash,
      )
      user.save()
    pending_signup.is_paid = True
    pending_signup.save(update_fields=["is_paid", "updated_at"])
    playlist_id = str(session_meta.get("playlist_id", "")).strip()
    if playlist_id.isdigit():
      playlist = StreamPlaylist.objects.filter(id=int(playlist_id)).first()
      if playlist is not None:
        purchase, _ = StreamPlaylistPurchase.objects.get_or_create(
          user=user,
          playlist=playlist,
          defaults={
            "status": StreamPlaylistPurchase.Status.PAID,
            "stripe_session_id": session.id,
            "stripe_checkout_session_id": session.id,
            "amount_paid": playlist.price,
            "currency": "gbp",
            "paid_at": timezone.now(),
          },
        )
        purchase.status = StreamPlaylistPurchase.Status.PAID
        purchase.stripe_session_id = session.id
        purchase.stripe_checkout_session_id = session.id
        purchase.amount_paid = playlist.price
        purchase.currency = "gbp"
        purchase.paid_at = timezone.now()
        purchase.save(update_fields=["status", "stripe_checkout_session_id", "amount_paid", "currency", "paid_at", "updated_at"])
    plan_sel = str(session_meta.get("selected_plan", "")).strip().lower()
    if plan_sel:
      _apply_purchased_plan(user, plan_sel)
      _record_user_plan_purchase(user, session, plan_sel, paid_amount, paid_currency)
    auth_token, _ = Token.objects.get_or_create(user=user)
    af_profile = ensure_affiliate_profile_for_existing_user(user)

    return JsonResponse(
      {
        "message": "Payment successful.",
        "email": user.email,
        "token": auth_token.key,
        "redirect_url": getattr(settings, "POST_LOGIN_REDIRECT_URL", "http://localhost:3000/"),
        "user": {"id": user.id, "username": user.username, "email": user.email},
        "referral_ids": referral_ids_payload(af_profile),
        "amount_paid": paid_amount,
        "currency": paid_currency,
        "affiliate_attribution": {
          "affiliate_id": str(session_meta.get("affiliate_id", "")).strip(),
          "visitor_id": str(session_meta.get("visitor_id", "")).strip(),
        },
      },
      status=200,
    )

  returning = ReturningCheckout.objects.filter(
    stripe_checkout_session_id=session.id,
  ).first()
  if returning is not None:
    user = _canonical_user_for_email(returning.email)
    if user is None:
      return _json_error("No account found for this checkout email.", status=404)
    playlist_id = str(session_meta.get("playlist_id", "")).strip()
    if playlist_id.isdigit():
      playlist = StreamPlaylist.objects.filter(id=int(playlist_id)).first()
      if playlist is not None:
        purchase, _ = StreamPlaylistPurchase.objects.get_or_create(
          user=user,
          playlist=playlist,
          defaults={
            "status": StreamPlaylistPurchase.Status.PAID,
            "stripe_session_id": session.id,
            "stripe_checkout_session_id": session.id,
            "amount_paid": playlist.price,
            "currency": "gbp",
            "paid_at": timezone.now(),
          },
        )
        purchase.status = StreamPlaylistPurchase.Status.PAID
        purchase.stripe_session_id = session.id
        purchase.stripe_checkout_session_id = session.id
        purchase.amount_paid = playlist.price
        purchase.currency = "gbp"
        purchase.paid_at = timezone.now()
        purchase.save(update_fields=["status", "stripe_checkout_session_id", "amount_paid", "currency", "paid_at", "updated_at"])
    plan_sel = str(session_meta.get("selected_plan", "")).strip().lower()
    if plan_sel:
      _apply_purchased_plan(user, plan_sel)
      _record_user_plan_purchase(user, session, plan_sel, paid_amount, paid_currency)
    auth_token, _ = Token.objects.get_or_create(user=user)
    af_profile = ensure_affiliate_profile_for_existing_user(user)
    return JsonResponse(
      {
        "message": "Payment successful. Thank you for your purchase.",
        "email": returning.email,
        "token": auth_token.key,
        "redirect_url": getattr(settings, "POST_LOGIN_REDIRECT_URL", "http://localhost:3000/"),
        "user": {"id": user.id, "username": user.username, "email": user.email},
        "referral_ids": referral_ids_payload(af_profile),
        "amount_paid": paid_amount,
        "currency": paid_currency,
        "affiliate_attribution": {
          "affiliate_id": str(session_meta.get("affiliate_id", "")).strip(),
          "visitor_id": str(session_meta.get("visitor_id", "")).strip(),
        },
      },
      status=200,
    )

  uid_raw = str(session_meta.get("user_id", "")).strip()
  checkout_kind = str(session_meta.get("checkout_kind", "")).strip().lower()
  if uid_raw.isdigit() and checkout_kind == "logged_in":
    try:
      user = User.objects.get(pk=int(uid_raw))
    except User.DoesNotExist:
      return _json_error("Account not found for this payment.", status=404)
    playlist_id = str(session_meta.get("playlist_id", "")).strip()
    if playlist_id.isdigit():
      playlist = StreamPlaylist.objects.filter(id=int(playlist_id)).first()
      if playlist is not None:
        purchase, _ = StreamPlaylistPurchase.objects.get_or_create(
          user=user,
          playlist=playlist,
          defaults={
            "status": StreamPlaylistPurchase.Status.PAID,
            "stripe_session_id": session.id,
            "stripe_checkout_session_id": session.id,
            "amount_paid": playlist.price,
            "currency": "gbp",
            "paid_at": timezone.now(),
          },
        )
        purchase.status = StreamPlaylistPurchase.Status.PAID
        purchase.stripe_session_id = session.id
        purchase.stripe_checkout_session_id = session.id
        purchase.amount_paid = playlist.price
        purchase.currency = "gbp"
        purchase.paid_at = timezone.now()
        purchase.save(update_fields=["status", "stripe_checkout_session_id", "amount_paid", "currency", "paid_at", "updated_at"])
    plan_sel = str(session_meta.get("selected_plan", "")).strip().lower()
    if plan_sel:
      _apply_purchased_plan(user, plan_sel)
      _record_user_plan_purchase(user, session, plan_sel, paid_amount, paid_currency)
    auth_token, _ = Token.objects.get_or_create(user=user)
    af_profile = ensure_affiliate_profile_for_existing_user(user)
    return JsonResponse(
      {
        "message": "Payment successful.",
        "email": user.email,
        "token": auth_token.key,
        "redirect_url": getattr(settings, "POST_LOGIN_REDIRECT_URL", "http://localhost:3000/"),
        "user": {"id": user.id, "username": user.username, "email": user.email},
        "referral_ids": referral_ids_payload(af_profile),
        "amount_paid": paid_amount,
        "currency": paid_currency,
        "affiliate_attribution": {
          "affiliate_id": str(session_meta.get("affiliate_id", "")).strip(),
          "visitor_id": str(session_meta.get("visitor_id", "")).strip(),
        },
      },
      status=200,
    )

  return _json_error("Checkout record not found for this payment.", status=404)


@csrf_exempt
@require_POST
def login_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  email = str(payload.get("email", "")).strip().lower()
  if not email:
    return _json_error("Email is required.")
  try:
    validate_email(email)
  except ValidationError:
    return _json_error("Enter a valid email address.")

  if _canonical_user_for_email(email) is None:
    return JsonResponse(
      {
        "error": "No account found for this email. Please sign up first.",
        "code": "SIGNUP_REQUIRED",
      },
      status=404,
    )

  login_err = _create_and_email_login_otp(email)
  if login_err is not None:
    return login_err

  return JsonResponse(
    {
      "message": "Login OTP sent to your email.",
      "email": email,
      "otp_required": True,
    },
  )


@csrf_exempt
@require_POST
def verify_login_otp_view(request):
  payload = _read_payload(request)
  if payload is None:
    return _json_error("Invalid JSON payload.")

  email = str(payload.get("email", "")).strip().lower()
  otp = str(payload.get("otp", "")).strip()

  if not email or not otp:
    return _json_error("Email and OTP are required.")
  if len(otp) != 6 or not otp.isdigit():
    return _json_error("OTP must be a 6-digit code.")

  user = _canonical_user_for_email(email)
  if user is None:
    return _json_error("Invalid email.", status=401)

  try:
    login_otp = LoginOTP.objects.get(email=email)
  except LoginOTP.DoesNotExist:
    return _json_error("OTP not requested for this email.", status=404)

  if login_otp.otp_expires_at < timezone.now():
    login_otp.delete()
    return _json_error("OTP expired. Please login again.", status=400)

  if login_otp.otp_code != otp:
    return _json_error("Invalid OTP code.", status=400)

  login_otp.delete()
  auth_token, _ = Token.objects.get_or_create(user=user)
  af_profile = ensure_affiliate_profile_for_existing_user(user)
  return JsonResponse(
    {
      "message": "Login verified successfully.",
      "token": auth_token.key,
      "redirect_url": getattr(settings, "POST_LOGIN_REDIRECT_URL", "http://localhost:3000/"),
      "user": {"id": user.id, "username": user.username, "email": user.email},
      "referral_ids": referral_ids_payload(af_profile),
    },
    status=200,
  )
