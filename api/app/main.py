import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routes import health, upload, recommend, collections
from app.services.embedder import get_embedder

logging.basicConfig(level=logging.INFO)

STATIC_DIR = "app/static"


@asynccontextmanager
async def lifespan(_: FastAPI):
    get_embedder()
    yield


app = FastAPI(title="quickrec", lifespan=lifespan)

app.include_router(health.router)
app.include_router(upload.router)
app.include_router(recommend.router)
app.include_router(collections.router)

app.mount("/assets", StaticFiles(directory=f"{STATIC_DIR}/assets"), name="assets")
app.mount("/examples", StaticFiles(directory="examples"), name="examples")


@app.get("/", include_in_schema=False)
def root():
    return FileResponse(f"{STATIC_DIR}/index.html")
