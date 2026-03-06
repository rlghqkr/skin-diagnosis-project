from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, routine, product, product_effect, skin, tracking


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

# CORS - keep existing origins + config-based origins
cors_origins = list(
    set(
        settings.CORS_ORIGINS
        + [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://skin-diagnosis-project.pages.dev",
            "https://nia-skin-api-1040477836656.asia-northeast3.run.app",
        ]
    )
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(routine.router)
app.include_router(product.router)
app.include_router(skin.router)
app.include_router(tracking.router)
app.include_router(product_effect.router)


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}


# ---------------------------------------------------------------------------
# Legacy AI endpoints (/analyze, /predict, /recommend) remain in
# tool/api_server.py which loads ML models (PyTorch, MediaPipe).
# In production, these run as a separate service or are mounted here
# only when ENABLE_AI_ENDPOINTS=true and model checkpoints are available.
# ---------------------------------------------------------------------------
try:
    import os

    if os.environ.get("ENABLE_AI_ENDPOINTS", "").lower() in ("1", "true"):
        from tool.api_server import app as _legacy_app  # noqa: F401

        app.mount("/legacy", _legacy_app)
except ImportError:
    pass
