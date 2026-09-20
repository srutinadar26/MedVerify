import faiss
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer, CrossEncoder


INDEX_FILE = "models/rag/knowledge.index"
METADATA_FILE = "models/rag/metadata.csv"

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
NLI_MODEL = "cross-encoder/nli-deberta-v3-base"

TOP_K = 5


def main():

    claim = "Drinking bleach can cure COVID-19."

    print("Loading embedding model...")
    embedding_model = SentenceTransformer(EMBEDDING_MODEL)

    print("Loading NLI model...")
    nli_model = CrossEncoder(NLI_MODEL)

    print("Loading FAISS index...")
    index = faiss.read_index(INDEX_FILE)

    metadata = pd.read_csv(METADATA_FILE)

    # Convert claim into embedding
    query_embedding = embedding_model.encode(
        [claim],
        normalize_embeddings=True
    )

    # Retrieve top K evidence
    scores, indices = index.search(
        np.array(query_embedding),
        TOP_K
    )

    labels = [
        "CONTRADICTION",
        "ENTAILMENT",
        "NEUTRAL"
    ]

    print("\n================================")
    print("RAG + NLI VERIFICATION")
    print("================================")

    print(f"\nClaim:")
    print(claim)

    for rank, (score, idx) in enumerate(
        zip(scores[0], indices[0]),
        start=1
    ):

        row = metadata.iloc[idx]

        evidence = str(row["text"])

        nli_scores = nli_model.predict(
            [(evidence, claim)]
        )[0]

        predicted_index = nli_scores.argmax()

        prediction = labels[predicted_index]

        print("\n--------------------------------")
        print(f"Evidence #{rank}")
        print("--------------------------------")

        print(f"Similarity: {score:.4f}")
        print(f"NLI: {prediction}")

        print(
            f"Contradiction: {nli_scores[0]:.4f}"
        )
        print(
            f"Entailment: {nli_scores[1]:.4f}"
        )
        print(
            f"Neutral: {nli_scores[2]:.4f}"
        )

        print(f"\nSource: {row['source']}")
        print(f"Category: {row['category']}")
        print(f"Document: {row['document']}")
        print(f"Page: {row['page']}")

        print("\nEvidence:")
        print(evidence[:1000])


if __name__ == "__main__":
    main()