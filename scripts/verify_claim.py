import pandas as pd
import numpy as np
import faiss

from sentence_transformers import SentenceTransformer
from transformers import pipeline


MODEL_PATH = "models/distilbert_medverify"
INDEX_FILE = "models/rag/knowledge.index"
METADATA_FILE = "models/rag/metadata.csv"

TOP_K = 5


def classify_claim(claim):
    classifier = pipeline(
        "text-classification",
        model=MODEL_PATH,
        tokenizer=MODEL_PATH,
        top_k=None
    )

    results = classifier(claim)[0]

    probabilities = {}

    for item in results:
        if item["label"] == "LABEL_0":
            probabilities["FALSE"] = item["score"]

        elif item["label"] == "LABEL_1":
            probabilities["TRUE"] = item["score"]

    prediction = max(
        probabilities,
        key=probabilities.get
    )

    return prediction, probabilities


def retrieve_evidence(claim):
    print("\nLoading embedding model...")

    embedding_model = SentenceTransformer(
        "all-MiniLM-L6-v2"
    )

    print("Loading FAISS index...")

    index = faiss.read_index(INDEX_FILE)

    print("Loading metadata...")

    metadata = pd.read_csv(METADATA_FILE)

    claim_embedding = embedding_model.encode(
        [claim],
        normalize_embeddings=True
    )

    claim_embedding = np.asarray(
        claim_embedding,
        dtype="float32"
    )

    similarities, indices = index.search(
        claim_embedding,
        TOP_K
    )

    evidence = []

    for score, index_position in zip(
        similarities[0],
        indices[0]
    ):
        row = metadata.iloc[index_position].copy()

        row["similarity"] = float(score)

        evidence.append(row)

    return evidence


def display_evidence(evidence):

    print("\n================================")
    print("Retrieved Evidence")
    print("================================")

    for number, row in enumerate(
        evidence,
        start=1
    ):

        print(f"\n--- Evidence {number} ---")

        print(
            f"Similarity: "
            f"{row['similarity']:.4f}"
        )

        print(
            f"Source: {row.get('source', '')}"
        )

        print(
            f"Category: {row.get('category', '')}"
        )

        print(
            f"Document: {row.get('document', '')}"
        )

        if pd.notna(row.get("page", None)):
            print(
                f"Page: {row['page']}"
            )

        if pd.notna(row.get("title", None)):
            print(
                f"Title: {row['title']}"
            )

        if pd.notna(row.get("url", None)):
            print(
                f"URL: {row['url']}"
            )

        print(
            f"\nEvidence:\n{row.get('text', '')}"
        )


def main():

    claim = input(
        "\nEnter a medical claim: "
    ).strip()

    if not claim:
        print("Claim cannot be empty.")
        return

    print("\n================================")
    print("Initial AI Classification")
    print("================================")

    prediction, probabilities = classify_claim(
        claim
    )

    print(f"Prediction: {prediction}")

    for label, probability in probabilities.items():

        print(
            f"{label}: "
            f"{probability * 100:.2f}%"
        )

    evidence = retrieve_evidence(
        claim
    )

    display_evidence(
        evidence
    )

    print("\n================================")
    print("Evidence Verification")
    print("================================")

    print(
        "\nFinal evidence-based verdict: "
        "NOT IMPLEMENTED YET"
    )

    print(
        "\nThe retrieved evidence above will "
        "be analyzed in the next step."
    )


if __name__ == "__main__":
    main()