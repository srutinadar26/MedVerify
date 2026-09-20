from sentence_transformers import CrossEncoder


MODEL_NAME = "cross-encoder/nli-deberta-v3-base"


def main():

    print("Loading NLI model...")

    model = CrossEncoder(MODEL_NAME)

    claim = "Drinking bleach can cure COVID-19."

    evidence = (
        "Household bleach can be used for wiping surfaces "
        "and contaminated equipment. It is used as a disinfectant."
    )

    print("\nClaim:")
    print(claim)

    print("\nEvidence:")
    print(evidence)

    scores = model.predict(
        [(evidence, claim)]
    )[0]

    labels = [
        "CONTRADICTION",
        "ENTAILMENT",
        "NEUTRAL"
    ]

    predicted_index = scores.argmax()

    print("\n================================")
    print("NLI Result")
    print("================================")

    print(
        f"Prediction: {labels[predicted_index]}"
    )

    print("\nScores:")

    for label, score in zip(labels, scores):
        print(
            f"{label}: {score:.4f}"
        )


if __name__ == "__main__":
    main()