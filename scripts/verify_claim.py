import re
import os
import pandas as pd
import numpy as np
import torch

from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import SentenceTransformer, CrossEncoder
import faiss


# ============================================================
# CONFIGURATION
# ============================================================

CLASSIFIER_MODEL = "models/distilbert_medverify"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
NLI_MODEL = "cross-encoder/nli-deberta-v3-base"

FAISS_INDEX = "models/rag/knowledge.index"
METADATA_FILE = "models/rag/metadata.csv"

TOP_K = 20

# Minimum FAISS similarity for evidence to be considered
SIMILARITY_THRESHOLD = 0.50

# NLI threshold
NLI_STRONG_THRESHOLD = 0.55

# Minimum useful evidence length
MIN_EVIDENCE_LENGTH = 120

# Maximum evidence displayed
MAX_DISPLAY_EVIDENCE = 5


# ============================================================
# LOAD MODELS
# ============================================================

print("\nLoading MedVerify models...")

# ----------------------------
# DistilBERT classifier
# ----------------------------

classifier_tokenizer = AutoTokenizer.from_pretrained(
    CLASSIFIER_MODEL
)

classifier_model = AutoModelForSequenceClassification.from_pretrained(
    CLASSIFIER_MODEL
)

classifier_model.eval()


# ----------------------------
# Sentence Transformer
# ----------------------------

embedding_model = SentenceTransformer(
    EMBEDDING_MODEL
)


# ----------------------------
# NLI model
# ----------------------------

nli_model = CrossEncoder(
    NLI_MODEL,
    num_labels=3
)


# ----------------------------
# FAISS
# ----------------------------

faiss_index = faiss.read_index(
    FAISS_INDEX
)

metadata = pd.read_csv(
    METADATA_FILE
)


print("All models loaded successfully.")


# ============================================================
# MEDICAL VOCABULARY
# ============================================================

MEDICAL_TERMS = {
    "disease",
    "diseases",
    "illness",
    "infection",
    "infectious",
    "virus",
    "viral",
    "bacteria",
    "bacterial",
    "cancer",
    "tumor",
    "tumour",
    "diabetes",
    "covid",
    "covid-19",
    "coronavirus",
    "vaccine",
    "vaccines",
    "vaccination",
    "vaccinated",
    "medicine",
    "medicines",
    "drug",
    "drugs",
    "treatment",
    "treat",
    "cure",
    "cures",
    "cured",
    "therapy",
    "therapies",
    "symptom",
    "symptoms",
    "doctor",
    "doctors",
    "patient",
    "patients",
    "hospital",
    "hospitals",
    "medical",
    "health",
    "healthy",
    "healthcare",
    "clinical",
    "clinically",
    "diagnosis",
    "diagnose",
    "diagnosed",
    "antibiotic",
    "antibiotics",
    "antiviral",
    "antivirals",
    "bleach",
    "insulin",
    "blood",
    "heart",
    "cardiac",
    "lung",
    "lungs",
    "kidney",
    "kidneys",
    "liver",
    "brain",
    "pregnancy",
    "pregnant",
    "obesity",
    "cholesterol",
    "blood pressure",
    "hypertension",
    "immunity",
    "immune",
    "immunization",
    "immunisation",
    "prevention",
    "prevent",
    "protect",
    "protection",
}


# ============================================================
# TEXT HELPERS
# ============================================================

def normalize_text(text):
    """
    Normalize text for comparison.
    """
    if text is None:
        return ""

    text = str(text)

    text = text.lower()

    text = text.replace("–", "-")
    text = text.replace("—", "-")

    text = re.sub(r"\s+", " ", text)

    return text.strip()


def word_count(text):
    """
    Return approximate word count.
    """
    return len(
        re.findall(r"\b\w+\b", str(text))
    )


def contains_medical_term(text):
    """
    Check whether text contains at least one
    medical-related term.
    """

    text = normalize_text(text)

    for term in MEDICAL_TERMS:

        pattern = r"\b" + re.escape(term) + r"\b"

        if re.search(pattern, text):
            return True

    return False


def is_code_or_sql(text):
    """
    Detect obvious programming / SQL input.
    """

    text = normalize_text(text)

    sql_patterns = [
        r"\bselect\b.+\bfrom\b",
        r"\binsert\b.+\binto\b",
        r"\bupdate\b.+\bset\b",
        r"\bdelete\b.+\bfrom\b",
        r"\bcreate\b.+\btable\b",
        r"\balter\b.+\btable\b",
        r"\bdrop\b.+\btable\b",
    ]

    programming_patterns = [
        r"\bdef\s+\w+\s*\(",
        r"\bfunction\s+\w+\s*\(",
        r"\bconsole\.log\s*\(",
        r"\bimport\s+\w+",
        r"\bfrom\s+\w+\s+import\b",
        r"\bpublic\s+static\s+void\s+main\b",
    ]

    for pattern in sql_patterns + programming_patterns:

        if re.search(pattern, text):
            return True

    return False


def is_medical_input(text):
    """
    Determine whether the input is sufficiently medical.
    """

    text = normalize_text(text)

    if not text:
        return False

    if is_code_or_sql(text):
        return False

    return contains_medical_term(text)


def is_medical_question(text):
    """
    Detect questions that are clearly medical.
    """

    text = normalize_text(text)

    question_words = [
        "can",
        "does",
        "do",
        "is",
        "are",
        "will",
        "should",
        "could",
        "how",
        "what",
        "why",
    ]

    has_question_mark = "?" in text

    starts_with_question_word = any(
        text.startswith(word + " ")
        for word in question_words
    )

    return has_question_mark and (
        starts_with_question_word
        or contains_medical_term(text)
    )


# ============================================================
# CLASSIFICATION
# ============================================================

def classify_claim(claim):
    """
    Classify claim using trained DistilBERT model.

    Label:
        0 = FALSE
        1 = TRUE
    """

    inputs = classifier_tokenizer(
        claim,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=128
    )

    with torch.no_grad():

        outputs = classifier_model(
            **inputs
        )

    probabilities = torch.softmax(
        outputs.logits,
        dim=1
    )[0]

    predicted_class = int(
        torch.argmax(probabilities).item()
    )

    false_probability = float(
        probabilities[0].item()
    )

    true_probability = float(
        probabilities[1].item()
    )

    if predicted_class == 1:
        label = "TRUE"
        confidence = true_probability
    else:
        label = "FALSE"
        confidence = false_probability

    return {
        "label": label,
        "confidence": confidence,
        "false_probability": false_probability,
        "true_probability": true_probability
    }


# ============================================================
# FAISS RETRIEVAL
# ============================================================

def retrieve_evidence(claim, top_k=TOP_K):
    """
    Retrieve semantically similar evidence from FAISS.
    """

    claim_embedding = embedding_model.encode(
        [claim],
        normalize_embeddings=True
    )

    claim_embedding = np.asarray(
        claim_embedding,
        dtype="float32"
    )

    similarities, indices = faiss_index.search(
        claim_embedding,
        top_k
    )

    results = []

    for similarity, index in zip(
        similarities[0],
        indices[0]
    ):

        if index < 0:
            continue

        if index >= len(metadata):
            continue

        row = metadata.iloc[index]

        evidence_text = str(
            row.get("text", "")
        ).strip()

        if not evidence_text:
            continue

        result = {
            "similarity": float(similarity),
            "text": evidence_text,
            "source": str(row.get("source", "")),
            "category": str(row.get("category", "")),
            "document": str(row.get("document", "")),
            "page": row.get("page", ""),
            "row": row.get("row", ""),
            "sheet": row.get("sheet", ""),
            "identifier": str(
                row.get("identifier", "")
            ),
            "title": str(
                row.get("title", "")
            ),
            "url": str(
                row.get("url", "")
            ),
        }

        results.append(result)

    return results


# ============================================================
# CONCEPT EXTRACTION
# ============================================================

def get_concept_terms(text):
    """
    Extract important medical concepts from a claim/evidence.
    """

    text = normalize_text(text)

    concepts = set()

    # Vaccines
    if re.search(
        r"\b(vaccine|vaccines|vaccination|vaccinated|immunization|immunisation)\b",
        text
    ):
        concepts.add("vaccine")

    # Infection
    if re.search(
        r"\b(infection|infectious|infected|disease|diseases)\b",
        text
    ):
        concepts.add("infection")

    # Cancer
    if re.search(
        r"\b(cancer|tumou?r|oncology)\b",
        text
    ):
        concepts.add("cancer")

    # Bleach
    if re.search(
        r"\b(bleach|sodium hypochlorite)\b",
        text
    ):
        concepts.add("bleach")

    # COVID
    if re.search(
        r"\b(covid|covid-19|coronavirus|sars-cov-2)\b",
        text
    ):
        concepts.add("covid")

    # Surface cleaning
    if re.search(
        r"\b(surface|surfaces|cleaning|clean|disinfect|disinfection|wipe|wiping|spill|spills)\b",
        text
    ):
        concepts.add("surface_cleaning")

    # Drinking / ingestion
    if re.search(
        r"\b(drink|drinking|ingest|ingestion|swallow|swallowing|consume|consuming|oral)\b",
        text
    ):
        concepts.add("drinking")

    # Cure
    if re.search(
        r"\b(cure|cures|cured|curing|treat|treatment|treats|eliminate)\b",
        text
    ):
        concepts.add("cure")

    # Prevention / protection
    if re.search(
        r"\b(prevent|prevention|protect|protection|protects|reduce risk|reduces risk)\b",
        text
    ):
        concepts.add("prevention")

    return concepts


# ============================================================
# EVIDENCE RELATIONSHIP
# ============================================================

def detect_evidence_relationship(claim, evidence):
    """
    Detect the practical relationship between a claim
    and a retrieved evidence passage.

    Possible values:
        SUPPORTS
        CONTRADICTS
        RELATED
    """

    claim_concepts = get_concept_terms(
        claim
    )

    evidence_concepts = get_concept_terms(
        evidence
    )

    # --------------------------------------------------------
    # BLEACH CONTRADICTION
    # --------------------------------------------------------

    claim_is_bleach_ingestion = (
        "bleach" in claim_concepts
        and "drinking" in claim_concepts
        and "cure" in claim_concepts
    )

    evidence_is_surface_use = (
        "bleach" in evidence_concepts
        and "surface_cleaning" in evidence_concepts
    )

    evidence_is_not_ingestion = (
        "drinking" not in evidence_concepts
    )

    if (
        claim_is_bleach_ingestion
        and evidence_is_surface_use
        and evidence_is_not_ingestion
    ):
        return "CONTRADICTS"

    # --------------------------------------------------------
    # VACCINE SUPPORT
    # --------------------------------------------------------

    claim_is_vaccine_prevention = (
        "vaccine" in claim_concepts
        and (
            "infection" in claim_concepts
            or "prevention" in claim_concepts
        )
    )

    evidence_is_vaccine_prevention = (
        "vaccine" in evidence_concepts
        and (
            "infection" in evidence_concepts
            or "prevention" in evidence_concepts
        )
    )

    if (
        claim_is_vaccine_prevention
        and evidence_is_vaccine_prevention
    ):
        return "SUPPORTS"

    # --------------------------------------------------------
    # GENERIC CONCEPT OVERLAP
    # --------------------------------------------------------

    overlap = (
        claim_concepts
        .intersection(evidence_concepts)
    )

    if len(overlap) >= 2:
        return "RELATED"

    return "RELATED"


# ============================================================
# REFERENCE / METADATA FILTERS
# ============================================================

def looks_like_reference_list(text):
    """
    Remove passages that are mainly lists of references,
    citations, or bibliography entries.
    """

    text = str(text)

    lower = normalize_text(text)

    reference_patterns = [
        r"\bdoi\b",
        r"\bpmid\b",
        r"\bpmc\d+\b",
        r"\bissn\b",
        r"\bvol\.\b",
        r"\bvolume\b",
        r"\bissue\b",
        r"\bpp\.\b",
        r"\bpages?\s+\d+",
        r"\bavailable at\b",
        r"\baccessed\b",
    ]

    score = 0

    for pattern in reference_patterns:

        if re.search(pattern, lower):
            score += 1

    # Lots of DOI-like URLs are usually bibliography
    if lower.count("doi.org") >= 1:
        score += 2

    if lower.count("http") >= 2:
        score += 1

    return score >= 3


def looks_like_metadata(text):
    """
    Detect obvious metadata-only records.
    """

    text = normalize_text(text)

    metadata_patterns = [
        r"^references?$",
        r"^bibliography$",
        r"^contents?$",
        r"^table of contents$",
        r"^appendix$",
        r"^acknowledgements?$",
        r"^author information$",
    ]

    for pattern in metadata_patterns:

        if re.fullmatch(pattern, text):
            return True

    return False


def is_useful_evidence(item):
    """
    Check whether a retrieved passage is useful enough
    for evidence analysis.
    """

    text = str(
        item.get("text", "")
    ).strip()

    if len(text) < MIN_EVIDENCE_LENGTH:
        return False

    if word_count(text) < 20:
        return False

    if looks_like_reference_list(text):
        return False

    if looks_like_metadata(text):
        return False

    return True


# ============================================================
# NLI ANALYSIS
# ============================================================

def run_nli(claim, evidence):
    """
    Run Natural Language Inference.

    CrossEncoder model labels:
        0 = contradiction
        1 = entailment
        2 = neutral
    """

    scores = nli_model.predict(
        [(claim, evidence)]
    )

    scores = np.asarray(
        scores
    ).reshape(-1)

    # The model normally returns logits.
    probabilities = torch.softmax(
        torch.tensor(scores),
        dim=0
    ).numpy()

    contradiction = float(
        probabilities[0]
    )

    entailment = float(
        probabilities[1]
    )

    neutral = float(
        probabilities[2]
    )

    max_index = int(
        np.argmax(probabilities)
    )

    if max_index == 0:
        nli_label = "CONTRADICTION"

    elif max_index == 1:
        nli_label = "ENTAILMENT"

    else:
        nli_label = "NEUTRAL"

    return {
        "nli_label": nli_label,
        "contradiction": contradiction,
        "entailment": entailment,
        "neutral": neutral
    }


# ============================================================
# EVIDENCE ANALYSIS
# ============================================================

def analyze_evidence(claim, retrieved):
    """
    Analyze retrieved evidence using:

    1. Evidence quality filtering
    2. NLI
    3. Concept relationship detection
    4. Similarity

    Returns analyzed evidence.
    """

    analyzed = []

    for item in retrieved:

        similarity = float(
            item.get("similarity", 0)
        )

        # Ignore weak semantic matches
        if similarity < SIMILARITY_THRESHOLD:
            continue

        if not is_useful_evidence(item):
            continue

        evidence_text = str(
            item.get("text", "")
        ).strip()

        # NLI
        nli_result = run_nli(
            claim,
            evidence_text
        )

        # Relationship
        relationship = detect_evidence_relationship(
            claim,
            evidence_text
        )

        contradiction_score = (
            nli_result["contradiction"]
        )

        entailment_score = (
            nli_result["entailment"]
        )

        neutral_score = (
            nli_result["neutral"]
        )

        # ----------------------------------------------------
        # STRONG SUPPORT
        # ----------------------------------------------------

        nli_support = (
            entailment_score >= NLI_STRONG_THRESHOLD
        )

        relationship_support = (
            relationship == "SUPPORTS"
        )

        strong_support = (
            nli_support
            and relationship_support
        )

        # ----------------------------------------------------
        # STRONG CONTRADICTION
        # ----------------------------------------------------

        nli_contradiction = (
            contradiction_score
            >= NLI_STRONG_THRESHOLD
        )

        relationship_contradiction = (
            relationship == "CONTRADICTS"
        )

        strong_contradiction = (
            nli_contradiction
            or relationship_contradiction
        )

        # ----------------------------------------------------
        # EVIDENCE QUALITY
        # ----------------------------------------------------

        if strong_support or strong_contradiction:

            evidence_quality = "STRONG"

        elif (
            relationship in [
                "SUPPORTS",
                "CONTRADICTS"
            ]
            and similarity >= 0.55
        ):

            evidence_quality = "GOOD"

        elif similarity >= 0.60:

            evidence_quality = "MODERATE"

        else:

            evidence_quality = "WEAK"

        analyzed_item = item.copy()

        analyzed_item.update({
            "nli_label": nli_result["nli_label"],
            "contradiction": contradiction_score,
            "entailment": entailment_score,
            "neutral": neutral_score,
            "relationship": relationship,
            "strong_support": strong_support,
            "strong_contradiction": strong_contradiction,
            "evidence_quality": evidence_quality
        })

        analyzed.append(
            analyzed_item
        )

    return analyzed


# ============================================================
# REMOVE DUPLICATE / WEAK STRONG EVIDENCE
# ============================================================

def select_best_evidence(analyzed):
    """
    Remove duplicate evidence and rank the useful evidence.
    """

    unique = []

    seen = set()

    for item in analyzed:

        text = normalize_text(
            item.get("text", "")
        )

        # First 250 characters provide a useful
        # duplicate signature
        signature = text[:250]

        if signature in seen:
            continue

        seen.add(signature)

        unique.append(item)

    # Rank:
    #
    # 1. Strong contradiction/support
    # 2. Relationship
    # 3. Similarity
    #

    def ranking_score(item):

        strong_bonus = 0

        if item.get("strong_contradiction"):
            strong_bonus += 100

        if item.get("strong_support"):
            strong_bonus += 90

        relationship_bonus = 0

        if item.get("relationship") == "CONTRADICTS":
            relationship_bonus = 20

        elif item.get("relationship") == "SUPPORTS":
            relationship_bonus = 15

        return (
            strong_bonus
            + relationship_bonus
            + float(
                item.get("similarity", 0)
            ) * 10
        )

    unique.sort(
        key=ranking_score,
        reverse=True
    )

    return unique


# ============================================================
# FINAL VERDICT
# ============================================================

def determine_verdict(
    classifier_result,
    evidence
):
    """
    Determine final verdict.

    Priority:

    1. Strong contradictory evidence
    2. Strong supporting evidence
    3. Classifier result when evidence is insufficient

    Final labels:
        TRUE
        FALSE
        INSUFFICIENT EVIDENCE
    """

    strong_contradictions = [
        item
        for item in evidence
        if item.get(
            "strong_contradiction",
            False
        )
    ]

    strong_supports = [
        item
        for item in evidence
        if item.get(
            "strong_support",
            False
        )
    ]

    # --------------------------------------------------------
    # Strong contradiction
    # --------------------------------------------------------

    if strong_contradictions:

        return {
            "verdict": "FALSE",
            "reason": (
                "Retrieved evidence contains strong "
                "contradictory evidence."
            ),
            "evidence_type": "CONTRADICTS"
        }

    # --------------------------------------------------------
    # Strong support
    # --------------------------------------------------------

    if strong_supports:

        return {
            "verdict": "TRUE",
            "reason": (
                "Retrieved evidence contains strong "
                "supporting evidence."
            ),
            "evidence_type": "SUPPORTS"
        }

    # --------------------------------------------------------
    # No sufficiently strong evidence
    # --------------------------------------------------------

    return {
        "verdict": "INSUFFICIENT EVIDENCE",
        "reason": (
            "The retrieved sources are related to the claim "
            "but do not provide sufficiently strong evidence "
            "to verify it."
        ),
        "evidence_type": "RELATED"
    }


# ============================================================
# DISPLAY EVIDENCE
# ============================================================

def display_evidence(evidence):
    """
    Display the best retrieved evidence.
    """

    if not evidence:

        print(
            "\nNo sufficiently useful evidence "
            "was found."
        )

        return

    print(
        "\n========== EVIDENCE =========="
    )

    shown = 0

    for i, item in enumerate(
        evidence,
        start=1
    ):

        if shown >= MAX_DISPLAY_EVIDENCE:
            break

        print(
            f"\nEvidence {i}"
        )

        print(
            f"Similarity: "
            f"{item.get('similarity', 0):.4f}"
        )

        print(
            f"Relationship: "
            f"{item.get('relationship', 'UNKNOWN')}"
        )

        print(
            f"NLI: "
            f"{item.get('nli_label', 'UNKNOWN')}"
        )

        print(
            f"Entailment: "
            f"{item.get('entailment', 0) * 100:.2f}%"
        )

        print(
            f"Contradiction: "
            f"{item.get('contradiction', 0) * 100:.2f}%"
        )

        print(
            f"Neutral: "
            f"{item.get('neutral', 0) * 100:.2f}%"
        )

        print(
            f"Evidence quality: "
            f"{item.get('evidence_quality', 'UNKNOWN')}"
        )

        print(
            f"Source: "
            f"{item.get('source', 'Unknown')}"
        )

        print(
            f"Category: "
            f"{item.get('category', 'Unknown')}"
        )

        print(
            f"Document: "
            f"{item.get('document', 'Unknown')}"
        )

        page = item.get(
            "page",
            ""
        )

        if (
            str(page).strip()
            and str(page).lower() != "nan"
        ):

            print(
                f"Page: {page}"
            )

        title = item.get(
            "title",
            ""
        )

        if (
            str(title).strip()
            and str(title).lower() != "nan"
        ):

            print(
                f"Title: {title}"
            )

        identifier = item.get(
            "identifier",
            ""
        )

        if (
            str(identifier).strip()
            and str(identifier).lower() != "nan"
        ):

            print(
                f"Identifier: {identifier}"
            )

        url = item.get(
            "url",
            ""
        )

        if (
            str(url).strip()
            and str(url).lower() != "nan"
        ):

            print(
                f"URL: {url}"
            )

        evidence_text = item.get(
            "text",
            ""
        )

        print(
            "\nEvidence text:"
        )

        print(
            evidence_text[:1000]
        )

        print(
            "-" * 70
        )

        shown += 1


# ============================================================
# MAIN VERIFICATION PIPELINE
# ============================================================

def verify_claim(claim):
    """
    Complete MedVerify pipeline.
    """

    print(
        "\n"
        + "=" * 70
    )

    print(
        "MEDVERIFY AI"
    )

    print(
        "=" * 70
    )

    print(
        f"\nClaim:\n{claim}"
    )

    # --------------------------------------------------------
    # INPUT VALIDATION
    # --------------------------------------------------------

    if not claim.strip():

        print(
            "\nPlease enter a claim."
        )

        return

    if is_code_or_sql(claim):

        print(
            "\nRejected: this looks like "
            "SQL/programming code, not a medical claim."
        )

        return

    if not is_medical_input(claim):

        print(
            "\nRejected: the input does not contain "
            "enough medical context."
        )

        return

    # --------------------------------------------------------
    # STEP 1: CLASSIFICATION
    # --------------------------------------------------------

    print(
        "\n[1/4] Running DistilBERT classification..."
    )

    classifier_result = classify_claim(
        claim
    )

    print(
        f"\nInitial AI classification: "
        f"{classifier_result['label']}"
    )

    print(
        f"Classifier confidence: "
        f"{classifier_result['confidence'] * 100:.2f}%"
    )

    print(
        "\nImportant: classifier confidence is "
        "not medical truth probability."
    )

    # --------------------------------------------------------
    # STEP 2: RETRIEVAL
    # --------------------------------------------------------

    print(
        "\n[2/4] Retrieving evidence from "
        "WHO / ICMR / PubMed..."
    )

    retrieved = retrieve_evidence(
        claim,
        TOP_K
    )

    print(
        f"Retrieved: {len(retrieved)} passages"
    )

    # --------------------------------------------------------
    # STEP 3: EVIDENCE ANALYSIS
    # --------------------------------------------------------

    print(
        "\n[3/4] Analyzing evidence..."
    )

    analyzed = analyze_evidence(
        claim,
        retrieved
    )

    print(
        f"Useful evidence candidates: "
        f"{len(analyzed)}"
    )

    # --------------------------------------------------------
    # STEP 4: RANKING
    # --------------------------------------------------------

    print(
        "\n[4/4] Ranking evidence and "
        "determining final verdict..."
    )

    best_evidence = select_best_evidence(
        analyzed
    )

    verdict_result = determine_verdict(
        classifier_result,
        best_evidence
    )

    # --------------------------------------------------------
    # FINAL RESULT
    # --------------------------------------------------------

    print(
        "\n"
        + "=" * 70
    )

    print(
        "FINAL VERDICT"
    )

    print(
        "=" * 70
    )

    print(
        f"\n{verdict_result['verdict']}"
    )

    print(
        f"\nReason:"
    )

    print(
        verdict_result["reason"]
    )

    print(
        f"\nEvidence relationship:"
    )

    print(
        verdict_result["evidence_type"]
    )

    # --------------------------------------------------------
    # DISPLAY EVIDENCE
    # --------------------------------------------------------

    display_evidence(
        best_evidence
    )

    print(
        "\n"
        + "=" * 70
    )


# ============================================================
# INTERACTIVE LOOP
# ============================================================

def main():

    print(
        "\n"
        + "=" * 70
    )

    print(
        "MEDVERIFY AI - MEDICAL CLAIM VERIFICATION"
    )

    print(
        "=" * 70
    )

    print(
        "\nEnter a medical claim."
    )

    print(
        "Type 'exit' to stop."
    )

    while True:

        try:

            claim = input(
                "\nEnter claim: "
            ).strip()

        except KeyboardInterrupt:

            print(
                "\n\nExiting MedVerify..."
            )

            break

        except EOFError:

            print(
                "\n\nExiting MedVerify..."
            )

            break

        if claim.lower() == "exit":

            print(
                "\nExiting MedVerify..."
            )

            break

        verify_claim(
            claim
        )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    main()