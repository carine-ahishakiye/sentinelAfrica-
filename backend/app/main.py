from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import predict, resilience, recommend, live  # include live router
from app import cache  # background data cache


@asynccontextmanager
async def lifespan(app: FastAPI):
    cache.start()  # launch background refresh thread (computes payload every 5 min)
    yield


app = FastAPI(title="AfricaResilience API", version="1.0.0", lifespan=lifespan)

# Allow frontend (Vite dev server) to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routers
app.include_router(predict.router, prefix="/api/predict", tags=["predict"])
app.include_router(resilience.router, prefix="/api/resilience", tags=["resilience"])
app.include_router(recommend.router, prefix="/api/recommend", tags=["recommend"])

# WebSocket router for live streaming
app.include_router(live.router, tags=["live"])

@app.get("/")
def root():
    return {"message": "AfricaResilience API is running", "version": "1.0.0"}

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "AfricaResilience"}