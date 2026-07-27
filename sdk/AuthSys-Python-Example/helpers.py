"""
AuthSys Python SDK - Helper functions

Platform-specific utilities for HWID, hashing, and other helpers.
"""

import hashlib
import os
import platform
import subprocess
import uuid


def get_hwid() -> str:
    """Get a unique hardware identifier for the current machine."""
    try:
        if platform.system() == "Windows":
            result = subprocess.run(
                ["wmic", "csproduct", "get", "uuid"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            lines = result.stdout.strip().split("\n")
            if len(lines) > 1:
                return lines[1].strip()
        elif platform.system() == "Linux":
            if os.path.exists("/etc/machine-id"):
                with open("/etc/machine-id", "r") as f:
                    return f.read().strip()
            if os.path.exists("/proc/sys/kernel/random/boot_id"):
                with open("/proc/sys/kernel/random/boot_id", "r") as f:
                    return f.read().strip()
        elif platform.system() == "Darwin":
            result = subprocess.run(
                ["ioreg", "-rd1", "-c", "IOPlatformExpertDevice"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            parts = result.stdout.split('"')
            if len(parts) > 3:
                return parts[3]
    except Exception:
        pass
    return "UNKNOWN_HWID"


def hash_string(input_str: str) -> str:
    """Hash a string using SHA-256."""
    return hashlib.sha256(input_str.encode()).hexdigest()


def generate_guid() -> str:
    """Generate a random GUID."""
    return str(uuid.uuid4())


def is_windows() -> bool:
    """Check if running on Windows."""
    return platform.system() == "Windows"


def is_linux() -> bool:
    """Check if running on Linux."""
    return platform.system() == "Linux"


def is_macos() -> bool:
    """Check if running on macOS."""
    return platform.system() == "Darwin"
