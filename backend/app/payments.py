import razorpay
import os
from datetime import datetime
from fastapi import HTTPException

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

PLANS = {
    "pro": {
        "name": "GenBI Pro",
        "amount": 99900,  # ₹999 in paise
        "currency": "INR",
        "description": "GenBI Pro Plan - Monthly",
    },
    "enterprise": {
        "name": "GenBI Enterprise",
        "amount": 499900,  # ₹4999 in paise
        "currency": "INR",
        "description": "GenBI Enterprise Plan - Monthly",
    }
}

def get_razorpay_client():
    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

async def create_order(plan: str, username: str, db) -> dict:
    """Create Razorpay order."""
    if plan not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")

    plan_info = PLANS[plan]
    client = get_razorpay_client()

    try:
        order = client.order.create({
            "amount": plan_info["amount"],
            "currency": plan_info["currency"],
            "notes": {
                "username": username,
                "plan": plan,
            }
        })

        # Save order to MongoDB
        await db.orders.insert_one({
            "order_id": order["id"],
            "username": username,
            "plan": plan,
            "amount": plan_info["amount"],
            "currency": plan_info["currency"],
            "status": "created",
            "created_at": datetime.utcnow().isoformat(),
        })

        return {
            "order_id": order["id"],
            "amount": plan_info["amount"],
            "currency": plan_info["currency"],
            "key": RAZORPAY_KEY_ID,
            "name": "GenBI AI",
            "description": plan_info["description"],
            "plan": plan,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def verify_payment(order_id: str, payment_id: str, signature: str, username: str, db) -> dict:
    """Verify Razorpay payment signature."""
    client = get_razorpay_client()

    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature,
        })

        # Update order status
        await db.orders.update_one(
            {"order_id": order_id},
            {"$set": {
                "status": "paid",
                "payment_id": payment_id,
                "paid_at": datetime.utcnow().isoformat(),
            }}
        )

        # Get plan from order
        order = await db.orders.find_one({"order_id": order_id})
        plan = order.get("plan", "pro")

        # Update user plan
        await db.users.update_one(
            {"username": username},
            {"$set": {
                "plan": plan,
                "plan_activated_at": datetime.utcnow().isoformat(),
            }}
        )

        return {
            "success": True,
            "message": f"Payment successful! {plan.capitalize()} plan activated.",
            "plan": plan,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail="Payment verification failed")

async def get_user_plan(username: str, db) -> dict:
    """Get user's current plan."""
    user = await db.users.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "username": username,
        "plan": user.get("plan", "free"),
        "plan_activated_at": user.get("plan_activated_at"),
    }