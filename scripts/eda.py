import os
import pandas as pd
import matplotlib.pyplot as plt


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

PROCESSED_DIR = os.path.join(
    BASE_DIR,
    "datasets",
    "processed"
)

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "outputs",
    "eda"
)

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("MEDIVERIFY EXPLORATORY DATA ANALYSIS")
print("=" * 60)

train = pd.read_csv(
    os.path.join(PROCESSED_DIR, "train_data.csv")
)

validation = pd.read_csv(
    os.path.join(PROCESSED_DIR, "validation_data.csv")
)

test = pd.read_csv(
    os.path.join(PROCESSED_DIR, "test_data.csv")
)

print("\nDatasets loaded successfully.")

print("\nTraining:", train.shape)
print("Validation:", validation.shape)
print("Testing:", test.shape)


# ============================================================
# COMBINE FOR OVERALL ANALYSIS
# ============================================================

df = pd.concat(
    [train, validation, test],
    ignore_index=True
)


# ============================================================
# BASIC INFORMATION
# ============================================================

print("\n" + "=" * 60)
print("BASIC INFORMATION")
print("=" * 60)

print("\nTotal records:", len(df))

print("\nColumns:")
print(df.columns.tolist())

print("\nMissing values:")
print(df.isnull().sum())


# ============================================================
# LABEL DISTRIBUTION
# ============================================================

print("\n" + "=" * 60)
print("LABEL DISTRIBUTION")
print("=" * 60)

label_counts = df["label"].value_counts()

print(label_counts)

print("\nLabel percentages:")

label_percentages = (
    df["label"]
    .value_counts(normalize=True)
    .mul(100)
    .round(2)
)

print(label_percentages)


# ============================================================
# LABEL PIE CHART
# ============================================================

plt.figure(figsize=(7, 7))

plt.pie(
    label_counts,
    labels=["Real", "Fake"],
    autopct="%1.1f%%"
)

plt.title("Real vs Fake Claims")

plt.savefig(
    os.path.join(
        OUTPUT_DIR,
        "label_distribution.png"
    ),
    dpi=300,
    bbox_inches="tight"
)

plt.show()


# ============================================================
# TEXT LENGTH
# ============================================================

df["text_length"] = df["text"].astype(str).str.len()

print("\n" + "=" * 60)
print("TEXT LENGTH ANALYSIS")
print("=" * 60)

print("\nText length statistics:")

print(
    df["text_length"].describe()
)


# ============================================================
# TEXT LENGTH BY LABEL
# ============================================================

print("\nAverage text length by label:")

print(
    df.groupby("label")["text_length"]
    .mean()
    .round(2)
)


# ============================================================
# TEXT LENGTH HISTOGRAM
# ============================================================

plt.figure(figsize=(10, 6))

plt.hist(
    df["text_length"],
    bins=50
)

plt.xlabel("Text Length")
plt.ylabel("Number of Records")
plt.title("Distribution of Text Length")

plt.savefig(
    os.path.join(
        OUTPUT_DIR,
        "text_length_distribution.png"
    ),
    dpi=300,
    bbox_inches="tight"
)

plt.show()


# ============================================================
# DATASET DISTRIBUTION
# ============================================================

print("\n" + "=" * 60)
print("DATASET DISTRIBUTION")
print("=" * 60)

dataset_counts = df["dataset"].value_counts()

print(dataset_counts)


# ============================================================
# DATASET BAR CHART
# ============================================================

plt.figure(figsize=(8, 6))

dataset_counts.plot(
    kind="bar"
)

plt.xlabel("Dataset")
plt.ylabel("Number of Records")
plt.title("Records by Dataset")

plt.xticks(rotation=0)

plt.savefig(
    os.path.join(
        OUTPUT_DIR,
        "dataset_distribution.png"
    ),
    dpi=300,
    bbox_inches="tight"
)

plt.show()


# ============================================================
# DUPLICATE ANALYSIS
# ============================================================

print("\n" + "=" * 60)
print("DUPLICATE ANALYSIS")
print("=" * 60)

duplicates = df["text"].duplicated().sum()

print(
    "Duplicate text records:",
    duplicates
)


# ============================================================
# SAVE EDA SUMMARY
# ============================================================

summary = {
    "total_records": len(df),
    "real_records": int((df["label"] == 1).sum()),
    "fake_records": int((df["label"] == 0).sum()),
    "duplicate_records": int(duplicates),
    "average_text_length": round(
        df["text_length"].mean(),
        2
    ),
    "median_text_length": round(
        df["text_length"].median(),
        2
    )
}

summary_df = pd.DataFrame(
    [summary]
)

summary_df.to_csv(
    os.path.join(
        OUTPUT_DIR,
        "eda_summary.csv"
    ),
    index=False
)


# ============================================================
# COMPLETE
# ============================================================

print("\n" + "=" * 60)
print("EDA COMPLETED")
print("=" * 60)

print("\nFiles created in:")

print(OUTPUT_DIR)