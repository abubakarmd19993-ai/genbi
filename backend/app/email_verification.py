import os
import hashlib
import secrets
from datetime import datetime, timedelta
from fastapi import HTTPException
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from dotenv import load_dotenv

load_dotenv()

# Email config
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
EXPIRE_MINUTES = int(os.getenv("EMAIL_VERIFICATION_EXPIRE_MINUTES", 1440))

def generate_token() -> tuple:
    """Generate secure token and its hash."""
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token, token_hash

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

async def send_verification_email(email: str, username: str, token: str):
    """Send professional GenBI verification email."""
    verify_url = f"{FRONTEND_URL}/verify-email/{token}"
    
    html = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your GenBI Account</title>
</head>
<body style="margin:0;padding:0;background:#020617;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#020617;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0B1120,#111827);border:1px solid rgba(59,130,246,0.2);border-radius:20px;overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f,#3B82F6);padding:32px 40px;text-align:center;">
              <h1 style="color:white;font-size:28px;font-weight:800;margin:0;letter-spacing:-0.5px;">GenBI AI</h1>
              <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:6px 0 0 0;letter-spacing:0.15em;">AI POWERED · DATA DRIVEN · BUSINESS INTELLIGENCE</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              
              <!-- Icon -->
              <div style="text-align:center;margin-bottom:28px;">
                <div style="display:inline-block;width:64px;height:64px;background:rgba(59,130,246,0.15);border:2px solid rgba(59,130,246,0.3);border-radius:50%;text-align:center;line-height:64px;font-size:28px;">✉</div>
              </div>

              <h2 style="color:#FFFFFF;font-size:22px;font-weight:700;margin:0 0 12px 0;text-align:center;">Verify Your Email Address</h2>
              <p style="color:#9CA3AF;font-size:14px;line-height:1.7;margin:0 0 28px 0;text-align:center;">
                Hi <strong style="color:#E5E7EB;">{username}</strong>, welcome to GenBI AI!<br>
                Please verify your email address to activate your account and access all AI features.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin:28px 0;">
                <a href="{verify_url}" style="display:inline-block;background:linear-gradient(135deg,#1e3a5f,#3B82F6);color:white;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.02em;box-shadow:0 4px 20px rgba(59,130,246,0.4);">
                  ✓ Verify My Email →
                </a>
              </div>

              <!-- Info -->
              <div style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.15);border-radius:12px;padding:16px 20px;margin:24px 0;">
                <p style="color:#60A5FA;font-size:12px;font-weight:600;margin:0 0 8px 0;">SECURITY INFORMATION</p>
                <p style="color:#9CA3AF;font-size:12px;margin:0 0 4px 0;">⏱ This link expires in <strong style="color:#E5E7EB;">24 hours</strong></p>
                <p style="color:#9CA3AF;font-size:12px;margin:0 0 4px 0;">🔒 Single-use link — expires after one click</p>
                <p style="color:#9CA3AF;font-size:12px;margin:0;">🛡 If you did not create this account, ignore this email</p>
              </div>

              <!-- Link fallback -->
              <p style="color:#6B7280;font-size:11px;margin:20px 0 0 0;text-align:center;">
                If the button doesn't work, copy and paste this link:<br>
                <a href="{verify_url}" style="color:#3B82F6;word-break:break-all;">{verify_url}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:rgba(0,0,0,0.3);padding:20px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="color:#4B5563;font-size:11px;margin:0;">
                © 2026 GenBI AI · AI Powered Business Intelligence<br>
                This email was sent to {email}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    message = MessageSchema(
        subject="✓ Verify Your GenBI Account",
        recipients=[email],
        body=html,
        subtype="html",
    )
    fm = FastMail(conf)
    await fm.send_message(message)

async def create_verification_token(user_id: str, db) -> str:
    """Create and store verification token."""
    # Delete old tokens
    await db.email_verifications.delete_many({"user_id": user_id})
    
    token, token_hash = generate_token()
    expires_at = datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)
    
    await db.email_verifications.insert_one({
        "user_id": user_id,
        "token_hash": token_hash,
        "expires_at": expires_at,
        "used": False,
        "created_at": datetime.utcnow(),
    })
    return token

async def verify_email_token(token: str, db) -> dict:
    """Verify email token and activate account."""
    token_hash = hash_token(token)
    
    record = await db.email_verifications.find_one({"token_hash": token_hash})
    
    if not record:
        raise HTTPException(status_code=400, detail="invalid_token")
    
    if record["used"]:
        raise HTTPException(status_code=400, detail="token_used")
    
    if datetime.utcnow() > record["expires_at"]:
        raise HTTPException(status_code=400, detail="token_expired")
    
    # Mark token as used
    await db.email_verifications.update_one(
        {"token_hash": token_hash},
        {"$set": {"used": True}}
    )
    
    # Activate user
    await db.users.update_one(
        {"username": record["user_id"]},
        {"$set": {
            "email_verified": True,
            "email_verified_at": datetime.utcnow().isoformat(),
        }}
    )
    
    return {"message": "email_verified", "username": record["user_id"]}

async def resend_verification(username: str, db) -> dict:
    """Resend verification email with rate limiting."""
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("email_verified"):
        raise HTTPException(status_code=400, detail="already_verified")
    
    if not user.get("email"):
        raise HTTPException(status_code=400, detail="No email address found")
    
    # Rate limiting — 1 email per 2 minutes
    existing = await db.email_verifications.find_one({"user_id": username})
    if existing:
        created = existing.get("created_at", datetime.utcnow())
        if (datetime.utcnow() - created).seconds < 120:
            wait = 120 - (datetime.utcnow() - created).seconds
            raise HTTPException(status_code=429, detail=f"rate_limit:{wait}")
    
    token = await create_verification_token(username, db)
    await send_verification_email(user["email"], username, token)
    return {"message": "verification_sent"}