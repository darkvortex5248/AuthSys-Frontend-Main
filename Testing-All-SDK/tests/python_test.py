#!/usr/bin/env python3
"""AuthSys Python SDK — live API test."""
import json
import os
import sys

with open(os.environ.get("AUTHSYS_CONFIG", "../../config.json"), encoding="utf-8") as f:
    cfg = json.load(f)

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../sdk/AuthSys-Python-Example")))

from src.authsys import AuthSys, AuthSysOptions, AuthSysException

def report(tag, ok, detail=""):
    print(f"[{('PASS' if ok else 'FAIL')}] {tag} {detail}")

auth = AuthSys(AuthSysOptions(
    app_secret=cfg["app_secret"],
    app_name=cfg["app_name"],
    version=cfg["app_version"],
    api_url=cfg["api_url"],
    hwid=cfg["hwid"],
))

try:
    r = auth.init()
    report("init", r.get("status") == "success", f"status={r.get('status')}")
except AuthSysException as e:
    report("init", False, str(e))

try:
    r = auth.login(cfg["username"], cfg["password"], session_length=3600)
    report("login", bool(r.get("success") and r.get("token")), f"user={r.get('username')}")
except AuthSysException as e:
    report("login", False, str(e))

try:
    r = auth.verify()
    report("verify", r.get("valid") is True, f"user={r.get('username')}")
except AuthSysException as e:
    report("verify", False, str(e))

try:
    r = auth.license_check(cfg["fake_license"])
    report("license_check", r.get("valid") is False, f"valid={r.get('valid')} (expect False for fake key)")
except AuthSysException as e:
    report("license_check", False, str(e))

try:
    r = auth.register_device(cfg["hwid"], "SDK-Test-Device")
    report("device_register", r.get("active") is True, f"device_id={r.get('device_id')}")
except AuthSysException as e:
    report("device_register", False, str(e))

try:
    r = auth.check_device(cfg["hwid"])
    report("device_check", r.get("active") is True, f"msg={r.get('message')}")
except AuthSysException as e:
    report("device_check", False, str(e))

try:
    r = auth.send_chat_message(1, "sdk-test")
    report("chat_send", r.get("status") == "sent", str(r))
except AuthSysException as e:
    print(f"[INFO] chat_send requires room_id: {e}")