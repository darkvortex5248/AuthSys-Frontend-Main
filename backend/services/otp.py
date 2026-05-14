import redis
import random
import string
from core.config import settings

# Initialize Redis client
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

class OTPService:
    @staticmethod
    def generate_otp(length: int = 6) -> str:
        return ''.join(random.choices(string.digits, k=length))

    @staticmethod
    def store_otp(email: str, otp: str, purpose: str, expire_seconds: int = 600):
        """
        purpose: 'verification' or 'password_reset'
        """
        key = f"otp:{purpose}:{email}"
        redis_client.setex(key, expire_seconds, otp)

    @staticmethod
    def verify_otp(email: str, otp: str, purpose: str) -> bool:
        key = f"otp:{purpose}:{email}"
        stored_otp = redis_client.get(key)
        if stored_otp and stored_otp == otp:
            redis_client.delete(key)
            return True
        return False
