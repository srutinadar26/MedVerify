import pandas as pd
from pathlib import Path

INPUT_FILE = Path(
    "datasets/processed/knowledge_chunks_cleaned.csv"
)

OUTPUT_FILE = Path(
    "datasets/processed/knowledge_chunks_final.csv"
)

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200


def split_text(text):
    text = str(text).strip()

    if len(text) <= CHUNK_SIZE:
        return [text]

    chunks = []

    start = 0

    while start < len(text):

        end = start + CHUNK_SIZE

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        start += CHUNK_SIZE - CHUNK_OVERLAP

    return chunks


print("Loading cleaned knowledge base...")

df = pd.read_csv(
    INPUT_FILE,
    low_memory=False
)

print("Input records:", len(df))

records = []

for _, row in df.iterrows():

    chunks = split_text(row["text"])

    for chunk_number, chunk in enumerate(chunks, start=1):

        records.append({
            "chunk_id": f"{row['chunk_id']}_{chunk_number}",
            "source": row["source"],
            "category": row["category"],
            "document": row["document"],
            "page": row["page"],
            "row": row["row"],
            "sheet": row["sheet"],
            "identifier": row["identifier"],
            "title": row["title"],
            "url": row["url"],
            "text": chunk
        })


final_df = pd.DataFrame(records)

final_df.to_csv(
    OUTPUT_FILE,
    index=False
)

print("\n======================================")
print("Semantic chunking completed!")
print("======================================")

print("\nOriginal records:", len(df))
print("Final chunks:", len(final_df))

print("\nAverage chunk length:")
print(round(final_df["text"].str.len().mean(), 2))

print("\nMaximum chunk length:")
print(final_df["text"].str.len().max())

print("\nSaved to:")
print(OUTPUT_FILE)