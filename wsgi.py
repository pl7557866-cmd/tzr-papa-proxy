# wsgi.py - generic WSGI entry point
import os
from app import app as application

# Database path can be supplied by the deployment environment.
os.environ.setdefault("DB_PATH", os.environ.get("DB_PATH", "proxy_hack.db"))
