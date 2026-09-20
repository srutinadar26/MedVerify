import joblib

# Load saved model and vectorizer
model = joblib.load("models/linear_svm.pkl")
vectorizer = joblib.load("models/tfidf_vectorizer.pkl")

# New medical claim
claim = input("Enter a medical claim: ")

# Convert claim to TF-IDF
claim_tfidf = vectorizer.transform([claim])

# Predict
prediction = model.predict(claim_tfidf)[0]

# Show result
if prediction == 1:
    print("\nPrediction: TRUE")
else:
    print("\nPrediction: FALSE")