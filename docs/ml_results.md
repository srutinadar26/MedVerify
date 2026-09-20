# MediVerify AI - ML/DL Results

## 1. Dataset

The classification pipeline uses medical misinformation data from the CoAID dataset.

The processed dataset was divided into:

- Training: 3,192 samples
- Validation: 684 samples
- Test: 684 samples

The test set contains:

- Real: 555
- Fake: 129

The test set was kept separate from model training.

---

## 2. Models Evaluated

Three models were evaluated:

1. Logistic Regression with TF-IDF
2. Linear SVM with TF-IDF
3. DistilBERT

---

## 3. Model Performance

| Model | Test Accuracy | Macro F1 |
|---|---:|---:|
| Logistic Regression | 91.67% | 0.87 |
| Linear SVM | 92.69% | 0.88 |
| DistilBERT | 95.91% | 0.93 |

DistilBERT was selected as the primary classification model because it achieved the highest test accuracy and macro F1 score among the evaluated models.

---

## 4. DistilBERT Test Results

Test accuracy:

95.91%

Macro F1:

0.93

Confusion matrix:

| | Predicted Fake | Predicted Real |
|---|---:|---:|
| Actual Fake | 114 | 15 |
| Actual Real | 13 | 542 |

Therefore:

- True negatives: 114
- False positives: 15
- False negatives: 13
- True positives: 542

---

## 5. Error Analysis

Error analysis identified:

- 15 false positives
- 13 false negatives

Some false positives included misinformation-style claims involving alcohol, COVID-19, vaccines, and unsupported medical claims.

Several false negatives were news headlines, fact-checking articles, social-media-related text, or other content that did not resemble straightforward medical claims.

This indicates that the classifier can be affected by wording and by the type of content being classified.

---

## 6. Robustness Testing

Additional manually constructed claims were tested after training.

Examples included:

- Clearly supported medical claims
- Clearly false medical claims
- Potentially misleading claims
- Reworded versions of claims

The model successfully classified several straightforward examples but showed changes in confidence when the wording of a claim was changed.

This demonstrates that model confidence should not be treated as proof of medical truth.

---

## 7. Important Limitation

The DistilBERT model is a classification model.

It does not independently verify claims against authoritative medical sources.

For example, a model may produce a high-confidence prediction even when a claim requires external evidence to determine whether it is medically supported.

Therefore, the classifier is treated as an initial prediction component rather than the final medical verification mechanism.

---

## 8. Planned Evidence Verification

The next stage of MediVerify will introduce a Retrieval-Augmented Generation (RAG) pipeline using trusted sources such as:

- WHO
- PubMed
- ICMR

The RAG system will retrieve relevant evidence and provide it to the verification layer.

The final system is intended to produce:

- TRUE
- FALSE
- MISLEADING

along with an explanation and supporting source references.

The RAG layer is intended to reduce the dependence on the classifier's prediction alone and provide source-backed verification.