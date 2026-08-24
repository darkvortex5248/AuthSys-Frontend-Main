#!/usr/bin/env python3
"""
AuthSys — Testing All SDK

Runs every testable language SDK against the configured AuthSys backend,
parses [PASS]/[FAIL] markers from each test run, and writes a unified report.

Usage:
    python runner.py
"""

import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CONFIG = ROOT / "config.json"
REPORT = ROOT / "sdk-test-report.md"

TESTS: list[dict] = [
    {
        "name": "Python",
        "sdk": "AuthSys-Python-Example",
        "cmd": [sys.executable, str(ROOT / "tests" / "python_test.py")],
    },
    {
        "name": "JavaScript",
        "sdk": "AuthSys-JS-Example",
        "cmd": ["node", str(ROOT / "tests" / "js_test.js")],
    },
    {
        "name": "TypeScript",
        "sdk": "AuthSys-TS-Example",
        "cmd": ["npx.cmd", "--yes", "tsx", str(ROOT / "tests" / "ts_test.ts")],
    },
    {
        "name": "C# (.NET)",
        "sdk": "AuthSys-CSHARP-Example",
        "cmd": ["dotnet", "run", "--project", str(ROOT / "tests" / "csharp" / "CSharpTest.csproj"), "--no-launch-profile"],
    },
]


def run_test(test: dict) -> dict:
    env = os.environ.copy()
    env["AUTHSYS_CONFIG"] = str(CONFIG)
    try:
        proc = subprocess.run(
            test["cmd"],
            capture_output=True,
            text=True,
            timeout=240,
            env=env,
            cwd=test.get("cwd"),
        )
        output = (proc.stdout or "") + ("\n" + proc.stderr if proc.stderr else "")
    except subprocess.TimeoutExpired:
        return {"name": test["name"], "pass": [], "fail": ["timeout"], "info": [], "rc": -1, "output": ""}
    except FileNotFoundError as e:
        return {"name": test["name"], "pass": [], "fail": [f"runtime not found: {e}"], "info": [], "rc": -1, "output": ""}

    passed = [ln for ln in output.splitlines() if "[PASS]" in ln]
    failed = [ln for ln in output.splitlines() if "[FAIL]" in ln]
    info = [ln for ln in output.splitlines() if "[INFO]" in ln]
    return {
        "name": test["name"],
        "pass": passed,
        "fail": failed,
        "info": info,
        "rc": proc.returncode,
        "output": output,
    }


def main() -> int:
    with open(CONFIG, encoding="utf-8") as f:
        config = json.load(f)

    print(f"AuthSys SDK Testing Harness")
    print(f"Target API : {config['api_url']}")
    print(f"App secret : {config['app_secret']}")
    print(f"Test user  : {config['username']}")
    print("-" * 72)

    results = [run_test(t) for t in TESTS]

    lines = [
        "# AuthSys SDK Test Report",
        "",
        f"Generated: {__import__('datetime').datetime.now().isoformat(timespec='seconds')}",
        "",
        f"- Target API: `{config['api_url']}`",
        f"- App secret: `{config['app_secret']}`",
        f"- Test user: `{config['username']}`",
        "",
        "## Results",
        "",
        "| SDK | Result | Run |",
        "|-----|--------|-----|",
    ]
    for r in results:
        ok = not r["fail"] and r["rc"] == 0
        status = "✅ PASS" if ok and r["pass"] else ("⚠️ PARTIAL" if r["pass"] and r["fail"] else "❌ FAIL")
        lines.append(f"| {r['name']} | {status} | exit={r['rc']} |")

    lines += ["", "## Detailed Output", ""]
    for r in results:
        lines.append(f"### {r['name']}")
        lines.append("")
        for p in r["pass"]:
            lines.append(f"- ✅ `{p}`")
        for f_ in r["fail"]:
            lines.append(f"- ❌ `{f_}`")
        for i in r["info"]:
            lines.append(f"- ℹ️ `{i}`")
        if not (r["pass"] or r["fail"] or r["info"]):
            lines.append("- (no markers found)")
        lines.append("")
        lines.append("<details><summary>raw output</summary>")
        lines.append("")
        lines.append("```")
        lines.append(r["output"][:4000])
        lines.append("```")
        lines.append("</details>")
        lines.append("")

    REPORT.write_text("\n".join(lines), encoding="utf-8")

    total_pass = sum(len(r["pass"]) for r in results)
    total_fail = sum(len(r["fail"]) for r in results)
    print("-" * 72)
    print(f"Total PASS markers : {total_pass}")
    print(f"Total FAIL markers : {total_fail}")
    print(f"Report written to   : {REPORT}")
    return 0 if total_fail == 0 else 1


if __name__ == "__main__":
    sys.exit(main())