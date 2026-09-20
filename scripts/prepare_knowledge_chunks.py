import pandas as pd
from pathlib import Path

INPUT_FILE = Path("datasets/processed/knowledge_chunks.csv")
OUTPUT_FILE = Path("datasets/processed/knowledge_chunks_cleaned.csv")

print("Loading knowledge base...")

df = pd.read_csv(INPUT_FILE, low_memory=False)

print("Original records:", len(df))

# --------------------------------------------------
# 1. Remove empty text
# --------------------------------------------------

df["text"] = df["text"].fillna("").astype(str).str.strip()

df = df[df["text"] != ""]

# --------------------------------------------------
# 2. Remove extremely short records
# --------------------------------------------------

df["text_length"] = df["text"].str.len()

before_short_filter = len(df)

df = df[df["text_length"] >= 100]

print(
    "Removed short records:",
    before_short_filter - len(df)
)

# --------------------------------------------------
# 3. Create citation URLs for PubMed / PMC
# --------------------------------------------------

def create_url(row):

    source = row["source"]
    identifier = str(row["identifier"])

    if source == "PubMed":
        if identifier.startswith("PMC"):
            return (
                "https://pmc.ncbi.nlm.nih.gov/articles/"
                + identifier
                + "/"
            )

    return row["url"]


df["url"] = df.apply(create_url, axis=1)

# --------------------------------------------------
# 4. Create unique chunk IDs
# --------------------------------------------------

df = df.reset_index(drop=True)

df["chunk_id"] = [
    f"CHUNK_{i:07d}"
    for i in range(len(df))
]

# --------------------------------------------------
# 5. Keep useful metadata
# --------------------------------------------------

df = df[
    [
        "chunk_id",
        "source",
        "category",
        "document",
        "page",
        "row",
        "sheet",
        "identifier",
        "title",
        "url",
        "text"
    ]
]

# --------------------------------------------------
# 6. Save
# --------------------------------------------------

df.to_csv(
    OUTPUT_FILE,
    index=False
)

print("\n======================================")
print("Knowledge base cleaning completed!")
print("======================================")

print("\nFinal records:", len(df))

print("\nRecords by source:")
print(df["source"].value_counts())

print("\nRecords by category:")
print(df["category"].value_counts())

print("\nMissing URLs:")
print(df["url"].isna().sum())

print("\nSaved to:")
print(OUTPUT_FILE)