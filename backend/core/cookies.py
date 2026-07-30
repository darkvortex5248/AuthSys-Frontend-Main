from __future__ import annotations

import json

from fastapi import Request


def is_secure_request(request: Request) -> bool:
    if request.url.scheme == "https":
        return True

    forwarded_proto = request.headers.get("x-forwarded-proto", "")
    if forwarded_proto.split(",", 1)[0].strip().lower() == "https":
        return True

    forwarded_ssl = request.headers.get("x-forwarded-ssl", "").strip().lower()
    if forwarded_ssl == "on":
        return True

    cf_visitor = request.headers.get("cf-visitor")
    if cf_visitor:
        try:
            return json.loads(cf_visitor).get("scheme") == "https"
        except json.JSONDecodeError:
            return False

    return False
