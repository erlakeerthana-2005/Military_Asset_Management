"""Compatibility helpers to mimic a subset of `psycopg2.extras`.

This implements a minimal `RealDictCursor` wrapper that converts rows
returned from a psycopg cursor into dictionaries. It's intentionally small
— only what this project needs to avoid import errors during deployment.
"""
from __future__ import annotations

from typing import Any, Iterable


class RealDictCursor:
    """Wrap a psycopg cursor so that fetchone()/fetchall() return dicts.

    Usage (shim):
        cur = conn.cursor()
        cur = RealDictCursor(cur)
        cur.execute(...)
        row = cur.fetchone()  # returns dict or None
    """
    def __init__(self, cur: Any):
        self._cur = cur

    def execute(self, *args, **kwargs):
        return self._cur.execute(*args, **kwargs)

    def fetchone(self):
        row = self._cur.fetchone()
        if row is None:
            return None
        try:
            return dict(row)
        except Exception:
            # Fallback: if row is sequence, map by index to keys like col0
            try:
                return {f'col{i}': v for i, v in enumerate(row)}
            except Exception:
                return row

    def fetchall(self) -> Iterable[dict]:
        rows = self._cur.fetchall()
        out = []
        for r in rows:
            try:
                out.append(dict(r))
            except Exception:
                try:
                    out.append({f'col{i}': v for i, v in enumerate(r)})
                except Exception:
                    out.append(r)
        return out

    def close(self):
        return self._cur.close()

    # Provide attribute passthrough (e.g., rowcount)
    def __getattr__(self, name: str):
        return getattr(self._cur, name)
