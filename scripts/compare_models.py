import pandas as pd
import joblib
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from sklearn.metrics import accuracy_score, f1_score


# =========================
# Load test data
# =========================

test = pd.read_csv("datasets/processed/test.csv")

texts = test["text"].fillna("").tolist()
labels = test["label"].tolist()


# =========================
# Logistic Regression
# =========================

vectorizer = joblib.load("models/tfidf_vectorizer.pkl")
logistic_model = joblib.load("models/logistic_regression.pkl")

X_test = vectorizer.transform(texts)

logistic_predictions = logistic_model.predict(X_test)

logistic_accuracy = accuracy_score(labels, logistic_predictions)
logistic_f1 = f1_score(labels, logistic_predictions, average="macro")


# =========================
# Linear SVM
# =========================

svm_model = joblib.load("models/linear_svm.pkl")

svm_predictions = svm_model.predict(X_test)

svm_accuracy = accuracy_score(labels, svm_predictions)
svm_f1 = f1_score(labels, svm_predictions, average="macro")


# =========================
# DistilBERT
# =========================

model_path = "models/distilbert_medverify"

tokenizer = AutoTokenizer.from_pretrained(model_path)
bert_model = AutoModelForSequenceClassification.from_pretrained(model_path)

bert_model.eval()

bert_predictions = []

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

        outputs = bert_model(**inputs)

    predictions = torch.argmax(
        outputs.logits,
        dim=1
    ).tolist()

    bert_predictions.extend(predictions)


bert_accuracy = accuracy_score(labels, bert_predictions)
bert_f1 = f1_score(labels, bert_predictions, average="macro")


# =========================
# Comparison
# =========================

results = {
    "Model": [
        "Logistic Regression",
        "Linear SVM",
        "DistilBERT"
    ],
    "Accuracy (%)": [
        round(logistic_accuracy * 100, 2),
        round(svm_accuracy * 100, 2),
        round(bert_accuracy * 100, 2)
    ],
    "Macro F1": [
        round(logistic_f1, 2),
        round(svm_f1, 2),
        round(bert_f1, 2)
    ]
}

df = pd.DataFrame(results)

print("\nModel Comparison")
print("================")
print(df.to_string(index=False))

df.to_csv(
    "models/model_comparison.csv",
    index=False
)

print("\nComparison saved to:")
print("models/model_comparison.csv")