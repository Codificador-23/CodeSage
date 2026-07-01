from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.models.schemas import IngestRequest, IngestResponse
from app.engine.cloner import CodeCloner
from app.engine.parser import CodeParser
from app.engine.embedder import CodeEmbedder
from app.db.postgres import PostgresDB
from fastembed import SparseTextEmbedding
from qdrant_client import QdrantClient
from qdrant_client.http import models
import uuid
import os

router = APIRouter()
cloner = CodeCloner()
parser = CodeParser()
embedder = CodeEmbedder()
db = PostgresDB()
sparse_model = SparseTextEmbedding(model_name="Qdrant/bm25")

# Module-level dictionary to track progress per repo_url
ingestion_status = {}

@router.post("/", response_model=IngestResponse)
async def ingest_repo(request: IngestRequest, background_tasks: BackgroundTasks):
    # Initialize status
    ingestion_status[request.repo_url] = {
        "status": "cloning",
        "progress": 10,
        "message": "Cloning repository..."
    }
    background_tasks.add_task(process_ingestion, request.repo_url)
    return IngestResponse(
        status="ingestion_started",
        repo_url=request.repo_url,
        files_processed=0,
        chunks_indexed=0,
        languages_detected=[]
    )

@router.get("/status/{repo_url:path}")
async def get_ingestion_status(repo_url: str):
    return ingestion_status.get(repo_url, {"status": "unknown"})

async def process_ingestion(repo_url: str):
    try:
        # 1. Clone
        ingestion_status[repo_url] = {
            "status": "cloning",
            "progress": 15,
            "message": "Cloning repository codebase..."
        }
        path = cloner.clone_repo(repo_url)

        # 2. Parse
        ingestion_status[repo_url] = {
            "status": "parsing",
            "progress": 25,
            "message": "Parsing codebase structure..."
        }
        chunks = parser.parse_directory(path, repo_url)

        # 3. Embed — dense
        ingestion_status[repo_url] = {
            "status": "embedding",
            "progress": 50,
            "message": f"Embedding {len(chunks)} chunks using SentenceTransformers..."
        }
        contents = [chunk["content"] for chunk in chunks]
        dense_embeddings = embedder.embed_chunks(contents)

        # 4. Embed — sparse
        sparse_embeddings = list(sparse_model.embed(contents))

        # 5. Build Qdrant points
        points = []
        for i, chunk in enumerate(chunks):
            cid = str(uuid.uuid4())
            chunk["chunk_id"] = cid
            sparse = sparse_embeddings[i]
            points.append(
                models.PointStruct(
                    id=cid,
                    vector={
                        "dense": dense_embeddings[i],
                        "sparse": models.SparseVector(
                            indices=sparse.indices.tolist(),
                            values=sparse.values.tolist()
                        )
                    },
                    payload=chunk
                )
            )

        # 6. Upsert to Qdrant in batches
        ingestion_status[repo_url] = {
            "status": "upserting",
            "progress": 75,
            "message": "Storing vectors in Qdrant database collection..."
        }
        qdrant = QdrantClient(
            url=os.getenv("QDRANT_URL"),
            api_key=os.getenv("QDRANT_API_KEY")
        )

        # Ensure collection exists with both dense and sparse vectors
        existing = [c.name for c in qdrant.get_collections().collections]
        if "code_sage" not in existing:
            qdrant.create_collection(
                collection_name="code_sage",
                vectors_config={
                    "dense": models.VectorParams(size=384, distance=models.Distance.COSINE)
                },
                sparse_vectors_config={
                    "sparse": models.SparseVectorParams(
                        index=models.SparseIndexParams(on_disk=False)
                    )
                }
            )
            print("Created Qdrant collection: code_sage")
        
        # Create payload index on repo_url for filtering
        qdrant.create_payload_index(
            collection_name="code_sage",
            field_name="repo_url",
            field_schema=models.PayloadSchemaType.KEYWORD
        )

        batch_size = 100
        for i in range(0, len(points), batch_size):
            batch = points[i:i + batch_size]
            qdrant.upsert(collection_name="code_sage", points=batch)
            print(f"Upserted batch {i//batch_size + 1}/{(len(points) + batch_size - 1)//batch_size}")
        
        # 7. Save metadata to Postgres
        languages = list(set([c["language"] for c in chunks]))
        await db.add_repo(
            repo_url,
            len(set([c["file_path"] for c in chunks])),
            len(chunks),
            languages
        )
        await db.add_chunks(chunks)

        # 8. Cleanup
        cloner.cleanup(path)
        
        print(f"Successfully indexed {repo_url}")
        
        # Mark as done
        ingestion_status[repo_url] = {
            "status": "done",
            "progress": 100,
            "message": "Indexing complete"
        }

    except Exception as e:
        print(f"Ingestion error: {str(e)}")
        ingestion_status[repo_url] = {
            "status": "error",
            "progress": 0,
            "message": str(e)
        }
