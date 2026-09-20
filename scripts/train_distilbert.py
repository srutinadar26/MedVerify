import pandas as pd
from transformers import AutoTokenizer


# Load training data
train = pd.read_csv("datasets/processed/train.csv")

# Load DistilBERT tokenizer
tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")

# Test tokenization
sample_text = train["text"].iloc[0]

tokens = tokenizer(
    sample_text,
    truncation=True,
    padding="max_length",
    max_length=128
)

print("Original text:")
print(sample_text[:200])

print("\nTokenized input:")
print(tokens["input_ids"][:20])

print("\nAttention mask:")
print(tokens["attention_mask"][:20])

print("\nTokenizer is working successfully!")