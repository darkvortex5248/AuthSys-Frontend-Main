"""Static audit: enumerate every route and its transaction posture.

Parses router modules with `ast` (no imports, no DB needed) and reports, for
each mutating endpoint, whether it commits its work.
"""
from __future__ import annotations

import ast
import pathlib
import sys

ROUTERS = pathlib.Path(__file__).resolve().parent.parent / "routers"
MUTATING = {"post", "put", "patch", "delete"}


def decorator_info(dec: ast.expr) -> tuple[str | None, str | None, str | None]:
    """Return (kind, http_method, path) for a decorator node."""
    if isinstance(dec, ast.Name):
        return dec.id, None, None
    if isinstance(dec, ast.Attribute):
        return dec.attr, None, None
    if isinstance(dec, ast.Call):
        func = dec.func
        if isinstance(func, ast.Attribute) and isinstance(func.value, ast.Name):
            if func.value.id == "router":
                path = None
                if dec.args and isinstance(dec.args[0], ast.Constant):
                    path = dec.args[0].value
                return "route", func.attr.lower(), path
            return func.attr, None, None
        if isinstance(func, ast.Name):
            return func.id, None, None
    return None, None, None


class BodyScan(ast.NodeVisitor):
    """Collect mutation / commit signals from a function body."""

    def __init__(self) -> None:
        self.commits = 0
        self.rollbacks = 0
        self.adds = 0
        self.deletes = 0
        self.write_sql = 0
        self.attr_writes = 0
        self.calls_service = 0
        self.nested_funcs: list[str] = []

    def visit_Call(self, node: ast.Call) -> None:
        f = node.func
        if isinstance(f, ast.Attribute):
            name = f.attr
            base = f.value.id if isinstance(f.value, ast.Name) else ""
            if name == "commit":
                self.commits += 1
            elif name == "rollback":
                self.rollbacks += 1
            elif name in ("add", "add_all") and base.startswith("db"):
                self.adds += 1
            elif name == "delete" and base.startswith("db"):
                self.deletes += 1
            elif name == "execute" and base.startswith("db"):
                if node.args and _is_write_stmt(node.args[0]):
                    self.write_sql += 1
        self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign) -> None:
        for tgt in node.targets:
            if isinstance(tgt, ast.Attribute) and isinstance(tgt.value, ast.Name):
                if tgt.value.id not in ("self", "request", "response", "settings"):
                    self.attr_writes += 1
        self.generic_visit(node)


_WRITE_TOKENS = ("update", "delete", "insert")


def _is_write_stmt(node: ast.expr) -> bool:
    """True if the expression looks like an UPDATE/DELETE/INSERT statement."""
    if isinstance(node, ast.Call):
        f = node.func
        fname = f.id if isinstance(f, ast.Name) else (f.attr if isinstance(f, ast.Attribute) else "")
        if fname in _WRITE_TOKENS:
            return True
        if fname == "text" and node.args and isinstance(node.args[0], ast.Constant):
            sql = str(node.args[0].value).lstrip().lower()
            return sql.startswith(_WRITE_TOKENS)
        # update(...).where(...).values(...) chains
        if isinstance(f, ast.Attribute):
            return _is_write_stmt(f.value)
    return False


def scan_module(path: pathlib.Path) -> list[dict]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    rows: list[dict] = []

    for node in ast.walk(tree):
        if not isinstance(node, (ast.AsyncFunctionDef, ast.FunctionDef)):
            continue

        method = route_path = None
        decorators: list[str] = []
        for dec in node.decorator_list:
            kind, http, rpath = decorator_info(dec)
            if kind == "route":
                method, route_path = http, rpath
            elif kind:
                decorators.append(kind)

        if method is None:
            continue

        scan = BodyScan()
        for stmt in node.body:
            scan.visit(stmt)

        mutates = bool(
            scan.adds or scan.deletes or scan.write_sql or scan.attr_writes
        )
        rows.append(
            {
                "file": path.name,
                "func": node.name,
                "method": (method or "?").upper(),
                "path": route_path or "",
                "line": node.lineno,
                "decorated": "db_transaction" in decorators,
                "commits": scan.commits,
                "rollbacks": scan.rollbacks,
                "mutates": mutates,
                "adds": scan.adds,
                "deletes": scan.deletes,
                "write_sql": scan.write_sql,
                "attr_writes": scan.attr_writes,
            }
        )
    return rows


def main() -> int:
    rows: list[dict] = []
    for path in sorted(ROUTERS.glob("*.py")):
        if path.name == "__init__.py":
            continue
        try:
            rows.extend(scan_module(path))
        except SyntaxError as exc:
            print(f"!! SYNTAX ERROR {path.name}: {exc}")

    total = len(rows)
    mutating = [r for r in rows if r["method"].lower() in MUTATING or r["mutates"]]
    unsafe = [
        r for r in mutating
        if r["mutates"] and not r["decorated"] and r["commits"] == 0
    ]
    double = [r for r in mutating if r["decorated"] and r["commits"] > 0]
    readonly_decorated = [
        r for r in rows
        if r["decorated"] and not r["mutates"] and r["method"].lower() not in MUTATING
    ]

    print("=" * 78)
    print(f"ROUTE AUDIT — {total} routes across {len(list(ROUTERS.glob('*.py')))} modules")
    print("=" * 78)
    print(f"  mutating routes ............ {len(mutating)}")
    print(f"  UNSAFE (write, no commit) .. {len(unsafe)}")
    print(f"  double-commit risk ......... {len(double)}")
    print(f"  decorated but read-only .... {len(readonly_decorated)}")
    print()

    print("-" * 78)
    print("CRITICAL — mutates the DB but has NO @db_transaction and NO commit()")
    print("-" * 78)
    by_file: dict[str, list[dict]] = {}
    for r in unsafe:
        by_file.setdefault(r["file"], []).append(r)
    for fname in sorted(by_file):
        print(f"\n  {fname}")
        for r in sorted(by_file[fname], key=lambda x: x["line"]):
            sig = []
            if r["adds"]:
                sig.append(f"add×{r['adds']}")
            if r["deletes"]:
                sig.append(f"del×{r['deletes']}")
            if r["write_sql"]:
                sig.append(f"sql×{r['write_sql']}")
            if r["attr_writes"]:
                sig.append(f"attr×{r['attr_writes']}")
            print(
                f"    L{r['line']:<5} {r['method']:<6} {r['path'] or '/':<38} "
                f"{r['func']:<34} [{', '.join(sig)}]"
            )

    print()
    print("-" * 78)
    print("DOUBLE COMMIT — @db_transaction AND explicit commit() in body")
    print("-" * 78)
    for r in sorted(double, key=lambda x: (x["file"], x["line"])):
        print(
            f"  {r['file']:<32} L{r['line']:<5} {r['method']:<6} "
            f"{r['func']:<34} commits={r['commits']}"
        )

    print()
    print("-" * 78)
    print("PER-FILE SUMMARY")
    print("-" * 78)
    files: dict[str, dict[str, int]] = {}
    for r in rows:
        f = files.setdefault(
            r["file"], {"routes": 0, "mutating": 0, "decorated": 0, "unsafe": 0}
        )
        f["routes"] += 1
        if r["mutates"] or r["method"].lower() in MUTATING:
            f["mutating"] += 1
        if r["decorated"]:
            f["decorated"] += 1
        if r["mutates"] and not r["decorated"] and r["commits"] == 0:
            f["unsafe"] += 1
    print(f"  {'file':<34} {'routes':>7} {'mut':>6} {'deco':>6} {'UNSAFE':>7}")
    for fname in sorted(files, key=lambda k: -files[k]["unsafe"]):
        s = files[fname]
        flag = "  <<<" if s["unsafe"] else ""
        print(
            f"  {fname:<34} {s['routes']:>7} {s['mutating']:>6} "
            f"{s['decorated']:>6} {s['unsafe']:>7}{flag}"
        )

    return 0


if __name__ == "__main__":
    sys.exit(main())
