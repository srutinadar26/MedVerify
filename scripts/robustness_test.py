import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification


MODEL_PATH = "models/distilbert_medverify"

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)

model.eval()


test_claims = [
    # Clearly supported
    "Regular physical activity can improve cardiovascular health.",

    # Clearly false
    "Drinking bleach can cure COVID-19.",

    # Potentially misleading
    "Natural remedies can completely replace cancer treatment.",

    # Another false claim
    "Vaccines cause every vaccinated person to develop the disease.",

    # Reworded supported claim
    "Exercise regularly to help maintain a healthy heart.",

    # Potentially misleading
    "Ayurvedic medicines can cure cancer without conventional treatment."
]


print("\nMediVerify Robustness Test")
print("==========================")

for claim in test_claims:

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

    prediction = torch.argmax(probabilities).item()

    false_probability = probabilities[0].item()
    true_probability = probabilities[1].item()

    if prediction == 1:
        label = "TRUE"
        confidence = true_probability
    else:
        label = "FALSE"
        confidence = false_probability

    print("\nClaim:")
    print(claim)

    print("Prediction:", label)
    print("Confidence:", round(confidence * 100, 2), "%")

    print(
        "FALSE:",
        round(false_probability * 100, 2),
        "%",
        "| TRUE:",
        round(true_probability * 100, 2),
        "%"
    )