"""
claim_service.py
================
Local ML-based claim classification.

Multi-tier classification architecture:
1. DistilBERT deep learning classifier (primary if trained/available)
2. Scikit-learn TF-IDF + Logistic Regression model (trained, fast, 91.2% accuracy)
3. Keyword-heuristic fallback (safety net)
"""

import os
import sys
import re
import joblib

# ─── Lazy model singletons ────────────────────────────────────────────────────

_distilbert_model     = None
_distilbert_tokenizer = None
_distilbert_checked   = False

_sklearn_model        = None
_sklearn_vectorizer   = None
_sklearn_checked      = False


def _get_project_root():
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.dirname(backend_dir)


def _load_distilbert():
    """Load DistilBERT classifier once and cache it."""
    global _distilbert_model, _distilbert_tokenizer, _distilbert_checked

    if _distilbert_checked:
        return _distilbert_model, _distilbert_tokenizer

    _distilbert_checked = True
    project_root = _get_project_root()
    model_path   = os.path.join(project_root, "models", "distilbert_medverify")

    if not os.path.isdir(model_path):
        return None, None

    try:
        from transformers import AutoTokenizer, AutoModelForSequenceClassification

        _distilbert_tokenizer = AutoTokenizer.from_pretrained(model_path)
        _distilbert_model     = AutoModelForSequenceClassification.from_pretrained(model_path)
        _distilbert_model.eval()
        return _distilbert_model, _distilbert_tokenizer
    except Exception as e:
        print(f"[claim_service] Could not load DistilBERT: {e}", file=sys.stderr)
        return None, None


def _load_sklearn_classifier():
    """Load trained TF-IDF vectorizer + Logistic Regression model."""
    global _sklearn_model, _sklearn_vectorizer, _sklearn_checked

    if _sklearn_checked:
        return _sklearn_model, _sklearn_vectorizer

    _sklearn_checked = True
    project_root = _get_project_root()
    model_path   = os.path.join(project_root, "models", "logistic_regression.pkl")
    vec_path     = os.path.join(project_root, "models", "tfidf_vectorizer.pkl")

    if not (os.path.isfile(model_path) and os.path.isfile(vec_path)):
        return None, None

    try:
        _sklearn_model      = joblib.load(model_path)
        _sklearn_vectorizer = joblib.load(vec_path)
        return _sklearn_model, _sklearn_vectorizer
    except Exception as e:
        print(f"[claim_service] Could not load sklearn models: {e}", file=sys.stderr)
        return None, None


# ─── Keyword heuristic fallback ──────────────────────────────────────────────

_MISINFORMATION_SIGNALS = [
    r"\bcures?\b.{0,40}\bcancer\b",
    r"\bdrinking\b.{0,30}\bbleach\b",
    r"\bvaccines?\b.{0,40}\bautism\b",
    r"\blemon\b.{0,20}\bcures?\b",
    r"\bmiracle\s+cure\b",
    r"\binstantly\b.{0,30}\bcures?\b",
    r"\bburns?\s+fat\s+instantly\b",
]

_REAL_SIGNALS = [
    r"\b(study|studies|research|trial|evidence|peer.reviewed)\b",
    r"\b(who|cdc|nih|icmr|pubmed)\b",
    r"\brecommend[s]?\b",
    r"\beffective\b.{0,30}\b(treatment|vaccine|therapy)\b",
    r"\bregular\s+exercise\b",
]


def _heuristic_classify(text):
    """Rule-based fallback when ML models are unavailable."""
    text_lower = text.lower()

    misinformation_hits = sum(
        1 for p in _MISINFORMATION_SIGNALS if re.search(p, text_lower)
    )
    real_hits = sum(
        1 for p in _REAL_SIGNALS if re.search(p, text_lower)
    )

    if misinformation_hits > real_hits:
        prob = min(0.60 + misinformation_hits * 0.10, 0.90)
        return {
            "label": "FALSE",
            "confidence": prob,
            "false_probability": prob,
            "true_probability":  round(1.0 - prob, 4),
            "model": "heuristic",
        }

    prob = min(0.60 + real_hits * 0.10, 0.90)
    return {
        "label": "TRUE",
        "confidence": prob,
        "false_probability": round(1.0 - prob, 4),
        "true_probability":  prob,
        "model": "heuristic",
    }


# ─── Public API ───────────────────────────────────────────────────────────────

def classify_claim(claim: str, evidence=None) -> dict:
    """
    Classify a medical claim using the best available model.

    Parameters
    ----------
    claim    : str  – the raw claim text
    evidence : list – optional evidence list (for API compatibility)

    Returns
    -------
    dict with keys:
        label            – "TRUE" | "FALSE"
        confidence       – float [0, 1]
        false_probability – float [0, 1]
        true_probability  – float [0, 1]
        model            – "distilbert" | "logistic_regression" | "heuristic"
    """
    if not claim or not claim.strip():
        return {
            "label": "FALSE",
            "confidence": 0.50,
            "false_probability": 0.50,
            "true_probability": 0.50,
            "model": "heuristic",
        }

    claim_cleaned = claim.strip()

    # 1. Tier 1: DistilBERT Deep Learning Model
    distil_model, distil_tok = _load_distilbert()
    if distil_model is not None and distil_tok is not None:
        try:
            import torch

            inputs = distil_tok(
                claim_cleaned,
                return_tensors="pt",
                truncation=True,
                padding=True,
                max_length=128,
            )

            with torch.no_grad():
                outputs = distil_model(**inputs)

            probs = torch.softmax(outputs.logits, dim=1)[0]
            predicted_class = int(torch.argmax(probs).item())
            false_prob = float(probs[0].item())
            true_prob  = float(probs[1].item())

            label      = "TRUE" if predicted_class == 1 else "FALSE"
            confidence = true_prob if predicted_class == 1 else false_prob

            return {
                "label": label,
                "confidence": round(confidence, 4),
                "false_probability": round(false_prob, 4),
                "true_probability": round(true_prob, 4),
                "model": "distilbert",
            }
        except Exception as e:
            print(f"[claim_service] DistilBERT error: {e}", file=sys.stderr)

    # 2. Tier 2: TF-IDF + Logistic Regression Model (91.2% Test Accuracy)
    lr_model, vec = _load_sklearn_classifier()
    if lr_model is not None and vec is not None:
        try:
            features = vec.transform([claim_cleaned])
            probs = lr_model.predict_proba(features)[0]
            false_prob = float(probs[0])
            true_prob  = float(probs[1])

            predicted_class = int(probs.argmax())
            label = "TRUE" if predicted_class == 1 else "FALSE"
            confidence = true_prob if predicted_class == 1 else false_prob

            return {
                "label": label,
                "confidence": round(confidence, 4),
                "false_probability": round(false_prob, 4),
                "true_probability": round(true_prob, 4),
                "model": "logistic_regression",
            }
        except Exception as e:
            print(f"[claim_service] Sklearn classifier error: {e}", file=sys.stderr)

    # 3. Tier 3: Heuristic fallback
    return _heuristic_classify(claim_cleaned)