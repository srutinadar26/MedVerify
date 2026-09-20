import faiss
import pandas as pd
from sentence_transformers import SentenceTransformer

INDEX_FILE = "models/rag/knowledge.index"
METADATA_FILE = "models/rag/metadata.csv"

MODEL_NAME = "all-MiniLM-L6-v2"

print("Loading embedding model...")
model = SentenceTransformer(MODEL_NAME)

print("Loading FAISS index...")
index = faiss.read_index(INDEX_FILE)

print("Loading metadata...")
metadata = pd.read_csv(
    METADATA_FILE,
    low_memory=False
)

print("FAISS vectors:", index.ntotal)
print("Metadata rows:", len(metadata))

claim = input("\nEnter a medical claim: ")

# Convert claim into embedding
query_embedding = model.encode(
    [claim],
    normalize_embeddings=True
)

# Retrieve top 5 results
scores, indices = index.search(
    query_embedding,
    5
)

print("\n================================")
print("Retrieved Evidence")
print("================================")

for rank, (score, index_id) in enumerate(
    zip(scores[0], indices[0]),
    start=1
):

    result = metadata.iloc[index_id]

    print(f"\n--- Result {rank} ---")

    print("Similarity:", round(float(score), 4))

    print("Source:", result["source"])

    print("Category:", result["category"])

    print("Document:", result["document"])

    if pd.notna(result["page"]):
        print("Page:", result["page"])

    if pd.notna(result["title"]):
        print("Title:", result["title"])

    if pd.notna(result["url"]):
        print("URL:", result["url"])

    print("\nEvidence:")
    print(result["text"][:1000])