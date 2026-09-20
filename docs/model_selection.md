# Model Selection

## Models Evaluated

Three classification approaches were evaluated on the held-out test dataset:

1. Logistic Regression with TF-IDF
2. Linear SVM with TF-IDF
3. DistilBERT

## Results

| Model | Test Accuracy | Macro F1 |
|---|---:|---:|
| Logistic Regression | 91.67% | 0.87 |
| Linear SVM | 92.69% | 0.88 |
| DistilBERT | 95.91% | 0.93 |

## Selected Model

DistilBERT is selected as the primary classification model for MediVerify AI.

The selection is based on its performance on the held-out test dataset, where it achieved 95.91% accuracy and a macro F1 score of 0.93.

Logistic Regression and Linear SVM are retained as baseline models for comparison.

## Important Limitation

These results represent performance on the current held-out test dataset of 684 samples.

They should not be interpreted as guaranteed real-world accuracy. The dataset contains 555 real samples and 129 fake samples, so accuracy is considered together with F1 scores and class-specific performance.