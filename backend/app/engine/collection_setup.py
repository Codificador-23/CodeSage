import os
from qdrant_client import QdrantClient
from qdrant_client.http import models

def setup_collection(client: QdrantClient, collection_name: str = "code_sage"):
    existing = [c.name for c in client.get_collections().collections]

    if collection_name not in existing:
        client.create_collection(
            collection_name=collection_name,
            vectors_config={
                "dense": models.VectorParams(
                    size=384,
                    distance=models.Distance.COSINE
                )
            },
            sparse_vectors_config={
                "sparse": models.SparseVectorParams(
                    index=models.SparseIndexParams(on_disk=False)
                )
            }
        )
        print(f"Created Qdrant collection: {collection_name}")

    # Create payload index on repo_url for filtering
    client.create_payload_index(
        collection_name=collection_name,
        field_name="repo_url",
        field_schema=models.PayloadSchemaType.KEYWORD
    )
    print("Payload index on repo_url ready.")