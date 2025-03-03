from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth
from config.settings import (
    API_TITLE, 
    API_DESCRIPTION, 
    API_VERSION, 
    API_PREFIX, 
    ALLOWED_ORIGINS,
    DEBUG
)

app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
    debug=DEBUG
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["Authentication"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Supabase Auth API",
        "documentation": "/docs",
        "version": API_VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=DEBUG)