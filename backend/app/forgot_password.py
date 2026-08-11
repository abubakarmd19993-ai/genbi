import os
import hashlib
import secrets
from datetime import datetime, timedelta
from fastapi import HTTPException
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from dotenv import load_dotenv

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("SMTP_USERNAME"),
    MAIL_PASSWORD=os.getenv("SMTP_PASSWORD"),
    MAIL_FROM=os.getenv("SMTP_FROM_EMAIL"),
    MAIL_PORT=int(os.getenv("SMTP_PORT", 587)),
    MAIL_SERVER=os.getenv("SMTP_HOST"),
    MAIL_FROM_NAME="GenBI AI",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
EXPIRE_MINUTES = 30

def generate_token() -> tuple:
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token, token_hash

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

async def send_reset_email(email: str, username: str, token: str):
    reset_url = f"{FRONTEND_URL}/reset-password/{token}"
    html = f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#020617;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0B1120,#111827);border:1px solid rgba(59,130,246,0.2);border-radius:20px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f,#3B82F6);padding:32px 40px;text-align:center;">
            <h1 style="color:white;font-size:28px;font-weight:800;margin:0;">GenBI AI</h1>
            <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0 0;letter-spacing:0.15em;">AI POWERED · DATA DRIVEN · BUSINESS INTELLIGENCE</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <div style="text-align:center;margin-bottom:28px;">
              <div style="display:inline-block;width:64px;height:64px;background:rgba(59,130,246,0.15);border:2px solid rgba(59,130,246,0.3);border-radius:50%;text-align:center;line-height:64px;font-size:28px;">🔑</div>
            </div>
            <h2 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:0 0 12px 0;text-align:center;">Reset Your Password</h2>
            <p style="color:#9CA3AF;font-size:14px;line-height:1.7;margin:0 0 28px 0;text-align:center;">
              Hi <strong style="color:#E5E7EB;">{username}</strong>,<br>
              We received a request to reset your GenBI password.<br>
              Click the button below to create a new password.
            </p>
            <div style="text-align:center;margin:28px 0;">
              <a href="{reset_url}" style="display:inline-block;background:linear-gradient(135deg,#1e3a5f,#3B82F6);color:white;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;font-weight:700;box-shadow:0 4px 20px rgba(59,130,246,0.4);">
                🔑 Reset My Password →
              </a>
            </div>
            <div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.15);border-radius:12px;padding:16px 20px;margin:24px 0;">
              <p style="color:#60A5FA;font-size:12px;font-weight:600;margin:0 0 8px 0;">SECURITY INFORMATION</p>
              <p style="color:#9CA3AF;font-size:12px;margin:0 0 4px 0;">⏱ This link expires in <strong style="color:#E5E7EB;">30 minutes</strong></p>
              <p style="color:#9CA3AF;font-size:12px;margin:0 0 4px 0;">🔒 Single-use link — expires after one click</p>
              <p style="color:#9CA3AF;font-size:12px;margin:0;">🛡 If you did not request this, ignore this email safely</p>
            </div>
            <p style="color:#6B7280;font-size:11px;margin:20px 0 0 0;text-align:center;">
              If the button doesn't work, copy and paste:<br>
              <a href="{reset_url}" style="color:#3B82F6;word-break:break-all;">{reset_url}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:rgba(0,0,0,0.3);padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="color:#4B5563;font-size:11px;margin:0;">© 2026 GenBI AI · This email was sent to {email}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    message = MessageSchema(
        subject="🔑 Reset Your GenBI Password",
        recipients=[email],
        body=html,
        subtype="html",
    )
    fm = FastMail(conf)
    await fm.send_message(message)

async def forgot_password(email: str, db) -> dict:
    """Send reset email — no email enumeration."""
    user = await db.users.find_one({"email": email})

    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If that email exists, a reset link has been sent."}

    username = user["username"]

    # Rate limiting — 1 email per 2 minutes
    existing = await db.password_resets.find_one({"username": username})
    if existing:
        created = existing.get("created_at", datetime.utcnow())
        diff = (datetime.utcnow() - created).seconds
        if diff < 120:
            wait = 120 - diff
            raise HTTPException(status_code=429, detail=f"rate_limit:{wait}")

    # Delete old tokens
    await db.password_resets.delete_many({"username": username})

    # Create new token
    token, token_hash = generate_token()
    expires_at = datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)

    await db.password_resets.insert_one({
        "username": username,
        "email": email,
        "token_hash": token_hash,
        "expires_at": expires_at,
        "used": False,
        "created_at": datetime.utcnow(),
    })

    await send_reset_email(email, username, token)
    return {"message": "If that email exists, a reset link has been sent."}

async def verify_reset_token(token: str, db) -> dict:
    """Verify reset token is valid."""
    token_hash = hash_token(token)
    record = await db.password_resets.find_one({"token_hash": token_hash})

    if not record:
        raise HTTPException(status_code=400, detail="invalid_token")
    if record["used"]:
        raise HTTPException(status_code=400, detail="token_used")
    if datetime.utcnow() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="token_expired")

    return {"valid": True, "username": record["username"]}

async def reset_password(token: str, new_password: str, db) -> dict:
    """Reset password with token."""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    token_hash = hash_token(token)
    record = await db.password_resets.find_one({"token_hash": token_hash})

    if not record:
        raise HTTPException(status_code=400, detail="invalid_token")
    if record["used"]:
        raise HTTPException(status_code=400, detail="token_used")
    if datetime.utcnow() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="token_expired")

    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Mark token as used
    await db.password_resets.update_one(
        {"token_hash": token_hash},
        {"$set": {"used": True}}
    )

    # Update password
    hashed = pwd_context.hash(new_password)
    await db.users.update_one(
        {"username": record["username"]},
        {"$set": {
            "password": hashed,
            "password_reset_at": datetime.utcnow().isoformat(),
        }}
    )

    return {"message": "password_reset_success"}