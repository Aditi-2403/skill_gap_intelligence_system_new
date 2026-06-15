import logging
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr
from urllib.parse import urlencode

from ..core.config import get_settings


logger = logging.getLogger("skillsync.email")
settings = get_settings()


def _smtp_ready() -> bool:
    placeholder_values = {"", "PASTE_GMAIL_APP_PASSWORD_HERE", "your-16-character-gmail-app-password"}
    return (
        bool(settings.smtp_host)
        and bool(settings.smtp_from_email)
        and (
            not settings.smtp_username
            or settings.smtp_password.strip() not in placeholder_values
        )
    )


def _verification_page_url(email: str) -> str | None:
    if not settings.frontend_base_url:
        return None
    return f"{settings.frontend_base_url}/verify-email?{urlencode({'email': email})}"


def _reset_page_url(email: str) -> str | None:
    if not settings.frontend_base_url:
        return None
    return f"{settings.frontend_base_url}/reset-password?{urlencode({'email': email})}"


def _send_email(to_email: str, subject: str, body: str) -> bool:
    if not _smtp_ready():
        logger.warning("SMTP is not configured. Email to %s with subject %r was not sent.", to_email, subject)
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = formataddr((settings.smtp_from_name, settings.smtp_from_email))
    message["To"] = to_email
    message.set_content(body)

    try:
        if settings.smtp_use_ssl:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, context=context, timeout=20) as server:
                if settings.smtp_username:
                    server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(message)
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as server:
                if settings.smtp_use_tls:
                    server.starttls(context=ssl.create_default_context())
                if settings.smtp_username:
                    server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(message)
    except Exception:
        logger.exception("Failed to send email to %s.", to_email)
        return False

    return True


def send_verification_email(to_email: str, full_name: str, otp: str) -> bool:
    link = _verification_page_url(to_email)
    link_text = f"\nVerification page: {link}\n" if link else ""
    body = (
        f"Hi {full_name},\n\n"
        "Welcome to SkillSync. Use this one-time code to verify your email address:\n\n"
        f"{otp}\n\n"
        "This code expires soon. If you did not create a SkillSync account, you can ignore this email."
        f"{link_text}\n"
        "SkillSync Team"
    )
    sent = _send_email(to_email=to_email, subject="Verify your SkillSync email", body=body)
    if not sent:
        logger.warning("Development verification OTP for %s: %s", to_email, otp)
    return sent


def send_password_reset_email(to_email: str, full_name: str, otp: str) -> bool:
    link = _reset_page_url(to_email)
    link_text = f"\nReset page: {link}\n" if link else ""
    body = (
        f"Hi {full_name},\n\n"
        "Use this one-time code to reset your SkillSync password:\n\n"
        f"{otp}\n\n"
        "This code expires soon. If you did not request a password reset, you can ignore this email."
        f"{link_text}\n"
        "SkillSync Team"
    )
    sent = _send_email(to_email=to_email, subject="Reset your SkillSync password", body=body)
    if not sent:
        logger.warning("Development password reset OTP for %s: %s", to_email, otp)
    return sent
