import pandas as pd
import faiss
from sentence_transformers import SentenceTransformer
from pathlib import Path

INPUT_FILE = "datasets/processed/knowledge_chunks_final.csv"

OUTPUT_DIR = Path("models/rag")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

INDEX_FILE = OUTPUT_DIR / "knowledge.index"
METADATA_FILE = OUTPUT_DIR / "metadata.csv"

MODEL_NAME = "all-MiniLM-L6-v2"

BATCH_SIZE = 32

print("Loading embedding model...")

model = SentenceTransformer(MODEL_NAME)

print("Loading knowledge chunks...")

df = pd.read_csv(
    INPUT_FILE,
    low_memory=False
)

print("Total chunks:", len(df))

# -----------------------------------------
# TEST MODE
# -----------------------------------------

df = df.head(1000).copy()

print("Testing with:", len(df), "chunks")

# -----------------------------------------
# Generate embeddings
# -----------------------------------------

embeddings = []

for start in range(0, len(df), BATCH_SIZE):

    end = min(start + BATCH_SIZE, len(df))

    batch = df["text"].iloc[start:end].tolist()

    batch_embeddings = model.encode(
        batch,
        show_progress_bar=False,
        normalize_embeddings=True
    )

    embeddings.append(batch_embeddings)

    print(
        f"Processed {end}/{len(df)} chunks"
    )

# Combine batches

embeddings = __import__("numpy").vstack(embeddings)

print("\nEmbedding shape:", embeddings.shape)

# -----------------------------------------
# Create FAISS index
# -----------------------------------------

dimension = embeddings.shape[1]

index = faiss.IndexFlatIP(dimension)

index.add(embeddings)

print("FAISS vectors:", index.ntotal)

# -----------------------------------------
# Save index
# -----------------------------------------

faiss.write_index(
    index,
    str(INDEX_FILE)
)

# -----------------------------------------
# Save metadata
# -----------------------------------------

df.to_csv(
    METADATA_FILE,
    index=False
)

print("\n================================")
print("FAISS test index created!")
print("================================")

print("Index:", INDEX_FILE)
print("Metadata:", METADATA_FILE)