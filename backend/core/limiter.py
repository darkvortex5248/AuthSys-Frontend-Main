from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def get_client_ip(request: Request) -> str:
    """Get the real client IP, parsing X-Forwarded-For behind proxies."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    return get_remote_address(request)


limiter = Limiter(key_func=get_client_ip)
