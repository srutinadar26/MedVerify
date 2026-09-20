import pandas as pd
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification


# =========================
# Load test data
# =========================

test = pd.read_csv("datasets/processed/test.csv")

texts = test["text"].fillna("").tolist()
true_labels = test["label"].tolist()


# =========================
# Load DistilBERT
# =========================

MODEL_PATH = "models/distilbert_medverify"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)

model.eval()


# =========================
# Generate predictions
# =========================

predictions = []

for i in range(0, len(texts), 8):

    batch_texts = texts[i:i + 8]

    inputs = tokenizer(
        batch_texts,
        padding=True,
        truncation=True,
        max_length=128,
        return_tensors="pt"
    )

    with torch.no_grad():
        outputs = model(**inputs)

    batch_predictions = torch.argmax(
        outputs.logits,
        dim=1
    ).tolist()

    predictions.extend(batch_predictions)


# =========================
# Create error dataframe
# =========================

results = pd.DataFrame({
    "text": texts,
    "actual": true_labels,
    "predicted": predictions
})


# =========================
# False Positives
# Actual = FALSE
# Predicted = TRUE
# =========================

false_positives = results[
    (results["actual"] == 0) &
    (results["predicted"] == 1)
]

print("\nFalse Positives")
print("================")
print("Count:", len(false_positives))

for i, row in false_positives.head(10).iterrows():
    print("\nClaim:")
    print(row["text"][:500])


# =========================
# False Negatives
# Actual = TRUE
# Predicted = FALSE
# =========================

false_negatives = results[
    (results["actual"] == 1) &
    (results["predicted"] == 0)
]

print("\n\nFalse Negatives")
print("================")
print("Count:", len(false_negatives))

for i, row in false_negatives.head(10).iterrows():
    print("\nClaim:")
    print(row["text"][:500])


# =========================
# Save errors
# =========================

false_positives.to_csv(
    "models/false_positives.csv",
    index=False
)

false_negatives.to_csv(
    "models/false_negatives.csv",
    index=False
)

print("\nError analysis completed.")

print("False positives saved to:")
print("models/false_positives.csv")

print("False negatives saved to:")
print("models/false_negatives.csv")