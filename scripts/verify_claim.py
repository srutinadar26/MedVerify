import faiss
import numpy as np
import pandas as pd
from transformers import pipeline
from sentence_transformers import SentenceTransformer, CrossEncoder


# ==============================
# Configuration
# ==============================

CLASSIFIER_MODEL = "models/distilbert_medverify"

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
NLI_MODEL = "cross-encoder/nli-deberta-v3-base"

INDEX_FILE = "models/rag/knowledge.index"
METADATA_FILE = "models/rag/metadata.csv"

TOP_K = 5


# ==============================
# Load models
# ==============================

print("Loading classification model...")

classifier = pipeline(
    "text-classification",
    model=CLASSIFIER_MODEL,
    tokenizer=CLASSIFIER_MODEL,
    top_k=None
)

print("Loading embedding model...")

embedding_model = SentenceTransformer(
    EMBEDDING_MODEL
)

print("Loading NLI model...")

nli_model = CrossEncoder(
    NLI_MODEL
)

print("Loading FAISS index...")

index = faiss.read_index(
    INDEX_FILE
)

metadata = pd.read_csv(
    METADATA_FILE
)


# ==============================
# Classification
# ==============================

def classify_claim(claim):

    results = classifier(claim)[0]

    probabilities = {}

    for result in results:

        label = result["label"]
        score = float(result["score"])

        if label == "LABEL_0":
            probabilities["FALSE"] = score

        elif label == "LABEL_1":
            probabilities["TRUE"] = score

    predicted_label = max(
        probabilities,
        key=probabilities.get
    )

    return predicted_label, probabilities


# ==============================
# Retrieve evidence
# ==============================

def retrieve_evidence(claim):

    query_embedding = embedding_model.encode(
        [claim],
        normalize_embeddings=True
    )

    scores, indices = index.search(
        np.array(query_embedding),
        TOP_K
    )

    evidence_items = []

    for score, idx in zip(
        scores[0],
        indices[0]
    ):

        row = metadata.iloc[idx]

        evidence_items.append({
            "similarity": float(score),
            "source": str(row["source"]),
            "category": str(row["category"]),
            "document": str(row["document"]),
            "page": row["page"],
            "url": str(row["url"]),
            "text": str(row["text"])
        })

    return evidence_items


# ==============================
# Softmax
# ==============================

def softmax(scores):

    scores = np.array(
        scores,
        dtype=float
    )

    exp_scores = np.exp(
        scores - np.max(scores)
    )

    return exp_scores / exp_scores.sum()


# ==============================
# NLI analysis
# ==============================

def analyze_evidence(claim, evidence_items):

    labels = [
        "CONTRADICTION",
        "ENTAILMENT",
        "NEUTRAL"
    ]

    analyzed = []

    for item in evidence_items:

        nli_scores = nli_model.predict(
            [(item["text"], claim)]
        )[0]

        probabilities = softmax(
            nli_scores
        )

        predicted_index = int(
            np.argmax(probabilities)
        )

        item["nli_label"] = labels[
            predicted_index
        ]

        item["contradiction_score"] = float(
            probabilities[0]
        )

        item["entailment_score"] = float(
            probabilities[1]
        )

        item["neutral_score"] = float(
            probabilities[2]
        )

        analyzed.append(item)

    return analyzed


# ==============================
# Evidence-based verdict
# ==============================

def determine_verdict(
    classifier_label,
    classifier_probabilities,
    evidence_items
):

    strong_contradictions = []
    strong_entailments = []

    for item in evidence_items:

        similarity = item["similarity"]

        contradiction = item[
            "contradiction_score"
        ]

        entailment = item[
            "entailment_score"
        ]

        # Only consider evidence that
        # is reasonably relevant.
        if similarity < 0.45:
            continue

        if contradiction >= 0.80:
            strong_contradictions.append(
                item
            )

        if entailment >= 0.80:
            strong_entailments.append(
                item
            )

    # Strong contradiction
    if (
        strong_contradictions
        and not strong_entailments
    ):
        return "FALSE"

    # Strong supporting evidence
    if (
        strong_entailments
        and not strong_contradictions
    ):
        return "TRUE"

    # Conflicting or insufficient evidence
    return "MISLEADING"


# ==============================
# Display
# ==============================

def display_results(
    claim,
    classifier_label,
    probabilities,
    evidence_items,
    final_verdict
):

    print("\n================================")
    print("MEDVERIFY AI")
    print("================================")

    print("\nClaim:")
    print(claim)

    print("\n--------------------------------")
    print("Initial AI Classification")
    print("--------------------------------")

    print(
        f"Prediction: {classifier_label}"
    )

    print(
        f"FALSE: "
        f"{probabilities.get('FALSE', 0):.2%}"
    )

    print(
        f"TRUE: "
        f"{probabilities.get('TRUE', 0):.2%}"
    )

    print("\n--------------------------------")
    print("Evidence Analysis")
    print("--------------------------------")

    for number, item in enumerate(
        evidence_items,
        start=1
    ):

        print(
            f"\nEvidence #{number}"
        )

        print(
            f"Similarity: "
            f"{item['similarity']:.4f}"
        )

        print(
            f"NLI: "
            f"{item['nli_label']}"
        )

        print(
            f"Contradiction: "
            f"{item['contradiction_score']:.2%}"
        )

        print(
            f"Entailment: "
            f"{item['entailment_score']:.2%}"
        )

        print(
            f"Neutral: "
            f"{item['neutral_score']:.2%}"
        )

        print(
            f"Source: "
            f"{item['source']}"
        )

        print(
            f"Document: "
            f"{item['document']}"
        )

        print(
            f"Page: "
            f"{item['page']}"
        )

        print(
            "\nEvidence:"
        )

        print(
            item["text"][:700]
        )

    print("\n================================")
    print("FINAL VERDICT")
    print("================================")

    print(
        f"Evidence-based verdict: "
        f"{final_verdict}"
    )


# ==============================
# Main
# ==============================

def main():

    claim = input(
        "\nEnter a medical claim: "
    ).strip()

    if not claim:
        print("No claim entered.")
        return

    classifier_label, probabilities = (
        classify_claim(claim)
    )

    evidence_items = retrieve_evidence(
        claim
    )

    evidence_items = analyze_evidence(
        claim,
        evidence_items
    )

    final_verdict = determine_verdict(
        classifier_label,
        probabilities,
        evidence_items
    )

    display_results(
        claim,
        classifier_label,
        probabilities,
        evidence_items,
        final_verdict
    )


if __name__ == "__main__":
    main()