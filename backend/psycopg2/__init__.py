"""Minimal shim package to satisfy imports of `psycopg2` by proxying to `psycopg`.

This allows code (or third-party modules) that still do `import psycopg2`
to work by using psycopg (psycopg3) under the hood. It's a temporary shim
to avoid C-extension import errors while we ensure all code and requirements
use psycopg3.
"""
from __future__ import annotations

import psycopg as _psycopg
from importlib import import_module

# Expose a connect() function that maps to psycopg.connect
def connect(*args, **kwargs):
    return _psycopg.connect(*args, **kwargs)

# Common names some code expects from psycopg2
Binary = _psycopg.Binary if hasattr(_psycopg, 'Binary') else None

# Lazy import for extras submodule
def _get_extras():
    return import_module('psycopg2.extras')

__all__ = ['connect', 'Binary', 'extras']

# Provide a simple attribute proxy for `extras`
class _ExtrasProxy:
    def __getattr__(self, name):
        return getattr(_get_extras(), name)

extras = _ExtrasProxy()
