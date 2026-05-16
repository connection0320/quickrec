import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.routes import health
from app.services.embedder import get_embedder

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_: FastAPI):
    get_embedder()
    yield


app = FastAPI(title="quickrec", lifespan=lifespan)

app.include_router(health.router)
