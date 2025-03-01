import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

# Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Frontend URL for CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# API settings
API_PREFIX = "/api"
DEBUG = os.getenv("DEBUG", "False").lower() in ("true", "1", "t")
API_TITLE = "Supabase Auth API"
API_DESCRIPTION = "API for Supabase Authentication Demo"
API_VERSION = "0.1.0"

# CORS settings
ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:8000",
]

# Application settings
PROJECT_NAME = "supabase-auth-demo"