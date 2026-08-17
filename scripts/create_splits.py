import os
import pandas as pd

from sklearn.model_selection import train_test_split


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

INPUT_FILE = os.path.join(
    BASE_DIR,
    "datasets",
    "processed",
    "labelled_data.csv"
)

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "datasets",
    "processed"
)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("MEDIVERIFY CLASSIFIER DATA SPLITTING")
print("=" * 60)

df = pd.read_csv(INPUT_FILE)

print("\nTotal labelled records:", len(df))

print("\nOriginal label distribution:")
print(df["label"].value_counts())


# ============================================================
# REMOVE INVALID RECORDS
# ============================================================

df = df.dropna(subset=["text", "label"])

df["text"] = df["text"].astype(str)

df = df[df["text"].str.len() > 20]

print("\nRecords after validation:", len(df))


# ============================================================
# FIRST SPLIT
# 70% TRAIN
# 30% TEMPORARY
# ============================================================

train_df, temp_df = train_test_split(
    df,
    test_size=0.30,
    random_state=42,
    stratify=df["label"]
)


# ============================================================
# SECOND SPLIT
# TEMPORARY → 15% VALIDATION + 15% TEST
# ============================================================

validation_df, test_df = train_test_split(
    temp_df,
    test_size=0.50,
    random_state=42,
    stratify=temp_df["label"]
)


# ============================================================
# SAVE
# ============================================================

train_path = os.path.join(
    OUTPUT_DIR,
    "train_data.csv"
)

validation_path = os.path.join(
    OUTPUT_DIR,
    "validation_data.csv"
)

test_path = os.path.join(
    OUTPUT_DIR,
    "test_data.csv"
)


train_df.to_csv(train_path, index=False)
validation_df.to_csv(validation_path, index=False)
test_df.to_csv(test_path, index=False)


# ============================================================
# REPORT
# ============================================================

print("\n" + "=" * 60)
print("SPLIT COMPLETE")
print("=" * 60)

print("\nDataset sizes:")

print("Training:   ", len(train_df))
print("Validation: ", len(validation_df))
print("Testing:    ", len(test_df))


print("\nTraining labels:")
print(train_df["label"].value_counts())


print("\nValidation labels:")
print(validation_df["label"].value_counts())


print("\nTesting labels:")
print(test_df["label"].value_counts())


print("\nFiles created:")

print(train_path)
print(validation_path)
print(test_path)

print("\n" + "=" * 60)