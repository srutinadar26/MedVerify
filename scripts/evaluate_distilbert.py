import pandas as pd
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# Load test dataset
test = pd.read_csv("datasets/processed/test.csv")

texts = test["text"].fillna("").tolist()
true_labels = test["label"].tolist()

# Load trained DistilBERT
model_path = "models/distilbert_medverify"

tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForSequenceClassification.from_pretrained(model_path)

model.eval()

predictions = []

print("Evaluating DistilBERT...")
print("Test samples:", len(texts))

# Predict one batch at a time
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

# Results
accuracy = accuracy_score(true_labels, predictions)

print("\nDistilBERT Test Results")
print("-----------------------")
print("Accuracy:", accuracy)
print("Accuracy (%):", round(accuracy * 100, 2), "%")

print("\nClassification Report")
print("---------------------")
print(classification_report(true_labels, predictions))

print("\nConfusion Matrix")
print("----------------")
print(confusion_matrix(true_labels, predictions))