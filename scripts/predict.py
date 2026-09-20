import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

MODEL_PATH = "models/distilbert_medverify"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)

model.eval()

claim = input("\nEnter a medical claim: ")

inputs = tokenizer(
    claim,
    padding=True,
    truncation=True,
    max_length=128,
    return_tensors="pt"
)

with torch.no_grad():
    outputs = model(**inputs)

probabilities = torch.softmax(outputs.logits, dim=1)[0]

fake_probability = probabilities[0].item()
real_probability = probabilities[1].item()

prediction = torch.argmax(probabilities).item()

if prediction == 1:
    label = "TRUE"
    confidence = real_probability
else:
    label = "FALSE"
    confidence = fake_probability

print("\nPrediction:", label)
print("Confidence:", round(confidence * 100, 2), "%")

print("\nClass probabilities:")
print("FALSE:", round(fake_probability * 100, 2), "%")
print("TRUE :", round(real_probability * 100, 2), "%")