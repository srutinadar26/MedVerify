import pandas as pd
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer
)

# -----------------------------
# 1. Load datasets
# -----------------------------

train_df = pd.read_csv("datasets/processed/train.csv")
validation_df = pd.read_csv("datasets/processed/validation.csv")

print("Training samples:", len(train_df))
print("Validation samples:", len(validation_df))


# -----------------------------
# 2. Prepare datasets
# -----------------------------

train_df = train_df[["text", "label"]]
validation_df = validation_df[["text", "label"]]

train_dataset = Dataset.from_pandas(train_df)
validation_dataset = Dataset.from_pandas(validation_df)


# -----------------------------
# 3. Load tokenizer
# -----------------------------

tokenizer = AutoTokenizer.from_pretrained(
    "distilbert-base-uncased"
)


# -----------------------------
# 4. Tokenize text
# -----------------------------

def tokenize_function(examples):
    return tokenizer(
        examples["text"],
        padding="max_length",
        truncation=True,
        max_length=128
    )


train_dataset = train_dataset.map(
    tokenize_function,
    batched=True
)

validation_dataset = validation_dataset.map(
    tokenize_function,
    batched=True
)


# -----------------------------
# 5. Load DistilBERT model
# -----------------------------

model = AutoModelForSequenceClassification.from_pretrained(
    "distilbert-base-uncased",
    num_labels=2
)


# -----------------------------
# 6. Training configuration
# -----------------------------

training_args = TrainingArguments(
    output_dir="./models/distilbert_results",
    num_train_epochs=1,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    eval_strategy="epoch",
    save_strategy="epoch",
    logging_steps=50,
    report_to="none"
)


# -----------------------------
# 7. Create Trainer
# -----------------------------

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=validation_dataset
)


# -----------------------------
# 8. Start training
# -----------------------------

print("\nStarting DistilBERT training...\n")

trainer.train()


# -----------------------------
# 9. Save trained model
# -----------------------------

trainer.save_model("models/distilbert_medverify")
tokenizer.save_pretrained("models/distilbert_medverify")

print("\nDistilBERT training completed!")
print("Model saved to: models/distilbert_medverify")