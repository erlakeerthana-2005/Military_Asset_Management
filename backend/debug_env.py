import sys
import os
print("Executable:", sys.executable)
print("Path:", sys.path)
try:
    import flask
    print("Flask file:", flask.__file__)
except ImportError as e:
    print("ImportError:", e)
sys.stdout.flush()
