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
