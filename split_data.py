import pandas as pd
from sklearn.model_selection import StratifiedGroupKFold
import os

BASE = "datasets/processed"

df = pd.read_csv(f"{BASE}/labelled_data.csv")

# Make sure every record has a grouping key.
# Same URL = same group.
# Missing URL = use unique ID as its own group.
df["group"] = df["url"].fillna(df["id"])

print("Total labelled records:", len(df))
print("Label distribution:")
print(df["label"].value_counts())

# --------------------------------------------------
# STEP 1: Create approximately 7 equal groups
# --------------------------------------------------

sgkf = StratifiedGroupKFold(
    n_splits=7,
    shuffle=True,
    random_state=42
)

folds = []

X = df["text"]
y = df["label"]
groups = df["group"]

for _, (_, test_idx) in enumerate(sgkf.split(X, y, groups)):
    folds.append(test_idx)

# --------------------------------------------------
# STEP 2: Use one fold as TEST
# --------------------------------------------------

test_idx = folds[0]

remaining_idx = []
for i in range(1, 7):
    remaining_idx.extend(folds[i])

# --------------------------------------------------
# STEP 3: From remaining 6 folds, use one as VALIDATION
# --------------------------------------------------

validation_idx = folds[1]

train_idx = []
for i in range(2, 7):
    train_idx.extend(folds[i])

train = df.iloc[train_idx].copy()
validation = df.iloc[validation_idx].copy()
test = df.iloc[test_idx].copy()

# Remove helper column
for data in [train, validation, test]:
    data.drop(columns=["group"], inplace=True)

# Save
train.to_csv(f"{BASE}/train_data.csv", index=False)
validation.to_csv(f"{BASE}/validation_data.csv", index=False)
test.to_csv(f"{BASE}/test_data.csv", index=False)

print("\nNEW SPLIT")
print("--------------------")
print("Train:", len(train))
print("Validation:", len(validation))
print("Test:", len(test))
print("Total:", len(train) + len(validation) + len(test))

print("\nLabel distribution")
print("\nTRAIN")
print(train["label"].value_counts())

print("\nVALIDATION")
print(validation["label"].value_counts())

print("\nTEST")
print(test["label"].value_counts())

# --------------------------------------------------
# URL overlap validation
# --------------------------------------------------

train_urls = set(train["url"].dropna())
val_urls = set(validation["url"].dropna())
test_urls = set(test["url"].dropna())

print("\nURL OVERLAP")
print("--------------------")
print("Train-Val:", len(train_urls & val_urls))
print("Train-Test:", len(train_urls & test_urls))
print("Val-Test:", len(val_urls & test_urls))

# --------------------------------------------------
# Record overlap validation
# --------------------------------------------------

print("\nTEXT OVERLAP")
print("--------------------")
print("Train-Val:", len(set(train["text"]) & set(validation["text"])))
print("Train-Test:", len(set(train["text"]) & set(test["text"])))
print("Val-Test:", len(set(validation["text"]) & set(test["text"])))