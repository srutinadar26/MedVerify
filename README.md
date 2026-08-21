# 🩺 MedVerify AI

### AI-Powered Medical Misinformation Detection & Evidence Verification

> **MedVerify AI** is an intelligent medical claim verification system designed to detect potentially misleading or false medical information and provide evidence-backed explanations using trusted medical knowledge sources.

[![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python)](https://www.python.org/)
[![Machine Learning](https://img.shields.io/badge/Machine%20Learning-Scikit--Learn-orange)](https://scikit-learn.org/)
[![NLP](https://img.shields.io/badge/NLP-Medical%20Text-purple)](https://en.wikipedia.org/wiki/Natural_language_processing)
[![Status](https://img.shields.io/badge/Status-In%20Development-yellow)]()
[![License](https://img.shields.io/badge/License-MIT-green)]()

---

## 🧠 Overview

Medical misinformation spreads rapidly through social media, websites, and messaging platforms. A claim can appear convincing while being scientifically inaccurate, misleading, or unsupported by evidence.

**MedVerify AI** bridges this gap using:

- Natural Language Processing
- Retrieval-Augmented Generation (RAG)
- Evidence matching against trusted medical sources
- Explainable, cited verdicts

The system takes a medical claim and determines its credibility by comparing it against a dynamic knowledge base built from trusted medical literature.

---
## Deployment - Frontend
https://med-verify-iota.vercel.app/

---

## 🚨 Problem Statement

| Challenge | Limitation |
|---|---|
| 🔎 Manual verification | Time-consuming |
| 📚 Medical literature | Difficult for non-experts to interpret |
| 🌐 Online misinformation | Spreads faster than manual verification |
| 🤖 Black-box prediction | Doesn't explain *why* a claim was classified |
| 🔗 Lack of citations | Users cannot verify the evidence themselves |

> **How can we automatically analyze a medical claim, determine its credibility, retrieve supporting evidence, and explain the result to a user?**

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📝 Text verification | Paste a claim, get a verdict with evidence |
| 🔗 URL verification | Extracts article text and verifies embedded claims |
| 📷 Image / OCR input | Verifies claims from screenshots, posters, social posts |
| 🌍 Multilingual support | Detects and translates non-English claims |
| 🔬 Evidence-based output | Verdict + confidence + reasoning + citations, not a bare label |

---

## 🔄 End-to-End Pipeline

```text
   Text / URL / Image
           │
           ▼
     Preprocessing            (cleaning · OCR · translation · segmentation)
           │
           ▼
     Claim Extraction
           │
           ▼
   Embedding Generation
           │
           ▼
┌─────────────────────────┐
│      RAG RETRIEVAL      │   → fetches relevant evidence from
│  PubMed · WHO · ICMR    │      the medical knowledge base
└────────────┬────────────┘
             ▼
      Evidence Ranking
             │
             ▼
     Verification Model      →  🟢 Supported  🔴 Refuted  🟡 Uncertain
             │
             ▼
       Explainability
             │
             ▼
     Verdict + Citations
```

---

## 📥 Input Processing

| Modality | Pipeline |
|---|---|
| **Text** | Claim → Normalization → Claim extraction → Verification |
| **URL** | Webpage extraction → Article text → Segmentation → Claim extraction → Verification |
| **Image** | OCR → Text extraction → Cleaning → Claim extraction → Verification |

---

## 📚 Dataset & Knowledge Sources

| Dataset / Source | Purpose | Format |
|---|---|---|
| PubMed | Medical literature / evidence | CSV |
| HealthStory | Health-related claims | JSON |
| HealthRelease | Health claims and articles | JSON |
| CoAID | COVID-19 misinformation | Dataset |
| FakeHealth | Health misinformation | Dataset |
| ICMR | Trusted medical information | PDF |

**Trusted knowledge sources:** PubMed · WHO · ICMR · other verified medical literature

> ℹ️ Large raw datasets are excluded from the repository where they exceed GitHub's file-size limits.

---

## 🧹 Data Preprocessing

```text
Raw Dataset → Inspection → Missing Value Analysis → Duplicate Detection
            → Text Cleaning → Normalization → Tokenization → Processed Dataset
```

**Goals:** remove irrelevant information · handle missing values · remove duplicates · normalize text · prepare clean training/evaluation data

---

## 📊 Exploratory Data Analysis

Current analysis includes dataset size, class distribution, missing-value analysis, text-length analysis, and distribution visualizations.

> 📌 EDA visualizations will be added to this section as the project progresses.

---

## 🔎 Evidence & Citation Layer

Instead of `Claim → AI → Answer`, MedVerify aims for:

```text
Claim → Retrieve relevant evidence → Rank evidence → Compare claim with evidence
      → Generate verdict → Attach source citations
```

Each result should ideally contain:

```text
┌─────────────────────────────┐
│ VERDICT: Supported          │
│ Confidence: High            │
│                             │
│ Explanation:                │
│ Evidence from trusted       │
│ medical literature supports │
│ the claim.                  │
│                             │
│ Sources:                    │
│ • PubMed article            │
│ • WHO source                │
│ • ICMR document             │
└─────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Tools |
|---|---|
| AI / ML | Python, Pandas, NumPy, Scikit-learn, NLP libraries, embedding models |
| Data & Knowledge | PubMed, WHO, ICMR, health misinformation datasets |
| Backend | Python (REST API), evidence retrieval services |
| Frontend | React, HTML, CSS, JavaScript |
| Tooling | Git, GitHub, VS Code, Jupyter Notebook |

---

## 📁 Project Structure

```text
MedVerify/
├── datasets/          # knowledge, processed data, embeddings
├── notebooks/         # data inspection & EDA
├── scripts/           # preprocessing & training scripts
├── backend/           # API & verification services
├── frontend/          # UI
├── outputs/figures/   # generated plots
├── .gitignore
├── README.md
└── requirements.txt
```

---

## 🧪 Evaluation

| Category | Metrics |
|---|---|
| Classification | Accuracy, Precision, Recall, F1-score, Confusion Matrix |
| Retrieval | Precision@K, Recall@K, Mean Reciprocal Rank |
| System-level | Response latency, citation accuracy, robustness |

---

## 🔐 Responsible AI

MedVerify is intended as an **information verification and research-support system**, not a replacement for qualified medical professionals. It should not be used to diagnose conditions, replace medical advice, or guide emergency decisions.

---

## 🚀 Future Scope

· Voice-based verification 
· Expanded multilingual support 
· Mobile app · Real-time web verification 
· Larger medical knowledge graph 
· Automatic citation generation 
· Confidence calibration 
· Human expert feedback loop 
· Cloud deployment

---

## ⚙️ Installation

```bash
git clone https://github.com/srutinadar26/MedVerify.git
cd MedVerify
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

---

<p align="center">

### 🩺 MedVerify AI

**Evidence. Verification. Transparency.**

</p>
