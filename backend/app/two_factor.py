import pyotp
import qrcode
import io
import base64
from datetime import datetime
from fastapi import HTTPException

APP_NAME = "GenBI AI"

def generate_totp_secret() -> str:
    """Generate a new TOTP secret."""
    return pyotp.random_base32()

def get_totp_uri(secret: str, username: str) -> str:
    """Get the TOTP URI for QR code."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=username, issuer_name=APP_NAME)

def verify_totp_code(secret: str, code: str) -> bool:
    """Verify a TOTP code."""
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)

def generate_qr_code(uri: str) -> str:
    """Generate QR code as base64 image."""
    qr = qrcode.QRCode(version=1, box_size=8, border=4)
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#3B82F6", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode()

async def setup_2fa(username: str, db) -> dict:
    """Setup 2FA for user — generate secret and QR code."""
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.get("two_fa_enabled"):
        raise HTTPException(status_code=400, detail="2FA already enabled")

    secret = generate_totp_secret()
    uri = get_totp_uri(secret, username)
    qr_code = generate_qr_code(uri)

    # Store secret temporarily (not enabled yet)
    await db.users.update_one(
        {"username": username},
        {"$set": {"two_fa_secret_temp": secret}}
    )

    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_code}",
        "uri": uri,
        "message": "Scan the QR code with Google Authenticator then verify with a code.",
    }

async def verify_and_enable_2fa(username: str, code: str, db) -> dict:
    """Verify TOTP code and enable 2FA."""
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    secret = user.get("two_fa_secret_temp")
    if not secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated")

    if not verify_totp_code(secret, code):
        raise HTTPException(status_code=400, detail="Invalid code. Please try again.")

    # Enable 2FA
    await db.users.update_one(
        {"username": username},
        {
            "$set": {
                "two_fa_enabled": True,
                "two_fa_secret": secret,
                "two_fa_enabled_at": datetime.utcnow().isoformat(),
            },
            "$unset": {"two_fa_secret_temp": ""}
        }
    )
    return {"message": "2FA enabled successfully!", "two_fa_enabled": True}

async def disable_2fa(username: str, code: str, db) -> dict:
    """Disable 2FA after verifying code."""
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.get("two_fa_enabled"):
        raise HTTPException(status_code=400, detail="2FA is not enabled")

    secret = user.get("two_fa_secret")
    if not verify_totp_code(secret, code):
        raise HTTPException(status_code=400, detail="Invalid code")

    await db.users.update_one(
        {"username": username},
        {
            "$set": {"two_fa_enabled": False},
            "$unset": {"two_fa_secret": "", "two_fa_enabled_at": ""}
        }
    )
    return {"message": "2FA disabled successfully", "two_fa_enabled": False}

async def verify_2fa_login(username: str, code: str, db) -> bool:
    """Verify 2FA code during login."""
    user = await db.users.find_one({"username": username})
    if not user or not user.get("two_fa_enabled"):
        return True  # 2FA not enabled, skip
    secret = user.get("two_fa_secret")
    return verify_totp_code(secret, code)

async def get_2fa_status(username: str, db) -> dict:
    """Get 2FA status for user."""
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "two_fa_enabled": user.get("two_fa_enabled", False),
        "enabled_at": user.get("two_fa_enabled_at"),
    }