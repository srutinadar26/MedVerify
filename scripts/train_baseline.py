import joblib
import pandas as pd
from sklearn.svm import LinearSVC
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix


# Load datasets
train = pd.read_csv("datasets/processed/train.csv")
validation = pd.read_csv("datasets/processed/validation.csv")
test = pd.read_csv("datasets/processed/test.csv")


# Input and target
X_train = train["text"].fillna("")
y_train = train["label"]

X_val = validation["text"].fillna("")
y_val = validation["label"]

X_test = test["text"].fillna("")
y_test = test["label"]


# Convert text into TF-IDF features
vectorizer = TfidfVectorizer(
    max_features=10000,
    stop_words="english"
)

X_train_tfidf = vectorizer.fit_transform(X_train)
X_val_tfidf = vectorizer.transform(X_val)
X_test_tfidf = vectorizer.transform(X_test)


# Train Logistic Regression
model = LogisticRegression(
    max_iter=1000,
    class_weight="balanced"
)

model.fit(X_train_tfidf, y_train)


# Validation performance
val_predictions = model.predict(X_val_tfidf)

print("\nValidation Results")
print("------------------")
print("Accuracy:", accuracy_score(y_val, val_predictions))
print(classification_report(y_val, val_predictions))


# Test performance
test_predictions = model.predict(X_test_tfidf)

print("\nTest Results")
print("------------")
print("Accuracy:", f"{accuracy_score(y_test, test_predictions) * 100:.2f}%")
print(classification_report(y_test, test_predictions))

cm = confusion_matrix(y_test, test_predictions)

print("\nConfusion Matrix")
print("----------------")
print(cm)

# Save model and vectorizer
joblib.dump(model, "models/logistic_regression.pkl")
joblib.dump(vectorizer, "models/tfidf_vectorizer.pkl")

print("\nModel and vectorizer saved successfully!")

# Train Linear SVM
svm_model = LinearSVC(
    class_weight="balanced"
)

svm_model.fit(X_train_tfidf, y_train)

# Test SVM
svm_predictions = svm_model.predict(X_test_tfidf)

print("\nLinear SVM Results")
print("------------------")
print("Accuracy:", accuracy_score(y_test, svm_predictions))
print(classification_report(y_test, svm_predictions))

print("\nSVM Confusion Matrix")
print("--------------------")
print(confusion_matrix(y_test, svm_predictions))
# Save Linear SVM model
joblib.dump(svm_model, "models/linear_svm.pkl")

print("\nLinear SVM model saved successfully!")