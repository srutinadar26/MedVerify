import os
import pandas as pd
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer


INPUT_FILE = "datasets/processed/rag_chunks.csv"
INDEX_FILE = "models/rag/knowledge.index"
METADATA_FILE = "models/rag/metadata.csv"

BATCH_SIZE = 128

def main():
    print("Loading embedding model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    os.makedirs("models/rag", exist_ok=True)

    # Read first row to get the embedding dimension
    test_embedding = model.encode(
        ["test"],
        normalize_embeddings=True
    )

    dimension = test_embedding.shape[1]

    # FAISS index using cosine similarity
    # Since embeddings are normalized, inner product = cosine similarity
    index = faiss.IndexFlatIP(dimension)

    metadata_first = True
    total_chunks = 0

    print("Starting full knowledge-base indexing...")
    print("This may take a while on CPU.")

    for chunk_df in pd.read_csv(INPUT_FILE, chunksize=BATCH_SIZE):

        texts = chunk_df["text"].fillna("").tolist()

        embeddings = model.encode(
            texts,
            batch_size=32,
            normalize_embeddings=True,
            show_progress_bar=False
        )

        embeddings = np.asarray(embeddings, dtype="float32")

        index.add(embeddings)

        # Save metadata in the same order as FAISS vectors
        chunk_df.to_csv(
            METADATA_FILE,
            mode="w" if metadata_first else "a",
            header=metadata_first,
            index=False
        )

        metadata_first = False

        total_chunks += len(chunk_df)

        print(f"Processed: {total_chunks:,} chunks")

    print("\nIndexing complete!")
    print(f"Total vectors: {index.ntotal:,}")
    print(f"Embedding dimension: {dimension}")

    faiss.write_index(index, INDEX_FILE)

    print(f"\nFAISS index saved to:")
    print(INDEX_FILE)

    print(f"\nMetadata saved to:")
    print(METADATA_FILE)


if __name__ == "__main__":
    main()