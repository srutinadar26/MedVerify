import pandas as pd
from pathlib import Path

# CoAID raw dataset location
BASE_DIR = Path("datasets/raw/training/CoAID/CoAID")

# Output location
OUTPUT_DIR = Path("datasets/processed")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def load_claims():
    data = []

    for folder in BASE_DIR.iterdir():
        if not folder.is_dir():
            continue

        real_file = folder / "ClaimRealCOVID-19.csv"
        fake_file = folder / "ClaimFakeCOVID-19.csv"

        if real_file.exists():
            df = pd.read_csv(real_file)
            df["text"] = df["title"]
            df["label"] = 1
            df["type"] = "claim"
            data.append(df[["text", "label", "type"]])

        if fake_file.exists():
            df = pd.read_csv(fake_file)
            df["text"] = df["title"]
            df["label"] = 0
            df["type"] = "claim"
            data.append(df[["text", "label", "type"]])

    return pd.concat(data, ignore_index=True)


def load_news():
    data = []

    for folder in BASE_DIR.iterdir():
        if not folder.is_dir():
            continue

        real_file = folder / "NewsRealCOVID-19.csv"
        fake_file = folder / "NewsFakeCOVID-19.csv"

        if real_file.exists():
            df = pd.read_csv(real_file)
            df["text"] = df["content"].fillna(df["title"])
            df["label"] = 1
            df["type"] = "news"
            data.append(df[["text", "label", "type"]])

        if fake_file.exists():
            df = pd.read_csv(fake_file)
            df["text"] = df["content"].fillna(df["title"])
            df["label"] = 0
            df["type"] = "news"
            data.append(df[["text", "label", "type"]])

    return pd.concat(data, ignore_index=True)


# Load data
claims = load_claims()
news = load_news()

# Combine claims and news
dataset = pd.concat([claims, news], ignore_index=True)

# Remove empty text
dataset["text"] = dataset["text"].fillna("").astype(str).str.strip()
dataset = dataset[dataset["text"] != ""]

# Remove duplicate text
dataset = dataset.drop_duplicates(subset=["text"])

# Shuffle
dataset = dataset.sample(frac=1, random_state=42).reset_index(drop=True)

# Save
output_file = OUTPUT_DIR / "coaid_combined.csv"
dataset.to_csv(output_file, index=False)

print("\nDataset created successfully!")
print(f"Total samples: {len(dataset)}")
print(f"Claims: {(dataset['type'] == 'claim').sum()}")
print(f"News: {(dataset['type'] == 'news').sum()}")
print("\nClass distribution:")
print(dataset["label"].value_counts())
print(f"\nSaved to: {output_file}")