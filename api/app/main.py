from fastapi import FastAPI
from app.routes import health

app = FastAPI(title="quickrec")

app.include_router(health.router)
