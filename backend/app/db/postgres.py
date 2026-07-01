import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

class PostgresDB:
    def __init__(self):
        self.url = os.getenv("DATABASE_URL")

    async def get_connection(self):
        return await asyncpg.connect(self.url)

    async def init_db(self):
        """
        Initializes the database schemas.
        """
        conn = await self.get_connection()
        try:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS repos (
                    repo_url TEXT PRIMARY KEY,
                    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    file_count INTEGER,
                    chunk_count INTEGER,
                    languages TEXT[]
                );
            """)
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS chunks (
                    chunk_id UUID PRIMARY KEY,
                    repo_url TEXT REFERENCES repos(repo_url),
                    file_path TEXT NOT NULL,
                    start_line INTEGER,
                    end_line INTEGER,
                    chunk_type TEXT,
                    language TEXT
                );
            """)
            print("PostgreSQL tables initialized.")
        finally:
            await conn.close()

    async def add_repo(self, repo_url: str, file_count: int, chunk_count: int, languages: list):
        conn = await self.get_connection()
        try:
            await conn.execute(
                """
                INSERT INTO repos (repo_url, file_count, chunk_count, languages)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (repo_url) DO UPDATE SET 
                    indexed_at = CURRENT_TIMESTAMP,
                    file_count = $2,
                    chunk_count = $3,
                    languages = $4
                """,
                repo_url, file_count, chunk_count, languages
            )
        finally:
            await conn.close()

    async def add_chunks(self, chunks: list):
        conn = await self.get_connection()
        try:
            # Batch insert
            await conn.executemany(
                """
                INSERT INTO chunks (chunk_id, repo_url, file_path, start_line, end_line, chunk_type, language)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                """,
                [(c['chunk_id'], c['repo_url'], c['file_path'], c['start_line'], c['end_line'], c['chunk_type'], c['language']) for c in chunks]
            )
        finally:
            await conn.close()