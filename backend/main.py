import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import ingest, chat, repos
from app.db.postgres import PostgresDB
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CodeSage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = PostgresDB()

@app.on_event("startup")
async def startup_event():
    await db.init_db()

@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "healthy"}


app.include_router(ingest.router, prefix="/api/ingest", tags=["ingest"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(repos.router, prefix="/api", tags=["repos"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
