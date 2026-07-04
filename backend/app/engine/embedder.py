from typing import List, Tuple
from sentence_transformers import SentenceTransformer
import torch

class CodeEmbedder:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None

    @property
    def model(self):
        if self._model is None:
            device = "cuda" if torch.cuda.is_available() else "cpu"
            self._model = SentenceTransformer(self.model_name, device=device)
        return self._model

    def embed_all(self, chunks: List[dict]) -> List[Tuple[dict, List[float]]]:
        """
        Batch embeds chunks and returns (chunk, embedding) tuples.
        """
        texts = [c['content'] for c in chunks]
        embeddings = self.model.encode(texts, batch_size=32, show_progress_bar=False)
        return list(zip(chunks, embeddings.tolist()))

    def embed_query(self, query: str) -> List[float]:
        return self.model.encode(query, show_progress_bar=False).tolist()

    def embed_chunks(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(texts, batch_size=32, show_progress_bar=False)
        return embeddings.tolist()