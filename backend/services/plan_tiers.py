"""Map subscription plan names to dashboard tier levels."""

from __future__ import annotations


def tier_from_plan_name(plan_name: str) -> str:
    n = (plan_name or "").lower().strip()
    if "enterprise" in n:
        return "enterprise"
    if "seller" in n:
        return "seller"
    if "developer" in n or n == "dev":
        return "developer"
    if "free" in n:
        return "free"
    if "tester" in n or "test" in n:
        return "tester"
    return n or "tester"


def tier_level(tier: str) -> int:
    levels = {
        "free": 0,
        "tester": 1,
        "developer": 2,
        "seller": 3,
        "enterprise": 4,
        "pro": 4,
    }
    return levels.get((tier or "tester").lower().strip(), 1)
