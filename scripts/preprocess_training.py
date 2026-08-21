import os
import json
import re
import pandas as pd
from tqdm import tqdm


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RAW_TRAINING = os.path.join(
    BASE_DIR,
    "datasets",
    "raw",
    "training"
)
  
PROCESSED_DIR = os.path.join(
    BASE_DIR,
    "datasets",
    "processed"
)

os.makedirs(PROCESSED_DIR, exist_ok=True)


# ============================================================
# TEXT CLEANING
# ============================================================

def clean_text(text):

    if pd.isna(text):
        return ""

    text = str(text)

    # Remove HTML
    text = re.sub(r"<[^>]+>", " ", text)

    # Remove URLs
    text = re.sub(
        r"https?://\S+|www\.\S+",
        " ",
        text
    )

    # Replace multiple whitespace
    text = re.sub(
        r"\s+",
        " ",
        text
    )

    return text.strip()


# ============================================================
# HEALTHSTORY
# ============================================================

def process_healthstory():

    folder = os.path.join(
        RAW_TRAINING,
        "HealthStory"
    )

    records = []

    print("\nProcessing HealthStory...")

    files = []

    for root, _, filenames in os.walk(folder):

        for filename in filenames:

            if filename.lower().endswith(".json"):
                files.append(
                    os.path.join(root, filename)
                )

    for path in tqdm(files):

        try:

            with open(
                path,
                "r",
                encoding="utf-8"
            ) as f:

                data = json.load(f)

        except Exception:

            continue

        title = clean_text(
            data.get("title", "")
        )

        text = clean_text(
            data.get("text", "")
        )

        url = data.get(
            "url",
            ""
        )

        source = data.get(
            "source",
            ""
        )

        # Keep HealthStory UNLABELLED
        # because these JSON files do not
        # contain reliable fake/real labels.

        if len(text) < 20:

            continue

        records.append({

            "id":
                os.path.basename(path),

            "title":
                title,

            "text":
                text,

            "source":
                source,

            "url":
                url,

            "label":
                None,

            "dataset":
                "HealthStory"

        })

    return records


# ============================================================
# HEALTHRELEASE
# ============================================================

def process_healthrelease():

    folder = os.path.join(
        RAW_TRAINING,
        "HealthRelease"
    )

    records = []

    print("\nProcessing HealthRelease...")

    files = []

    for root, _, filenames in os.walk(folder):

        for filename in filenames:

            if filename.lower().endswith(".json"):

                files.append(
                    os.path.join(
                        root,
                        filename
                    )
                )

    for path in tqdm(files):

        try:

            with open(
                path,
                "r",
                encoding="utf-8"
            ) as f:

                data = json.load(f)

        except Exception:

            continue

        title = clean_text(
            data.get("title", "")
        )

        text = clean_text(
            data.get("text", "")
        )

        url = data.get(
            "url",
            ""
        )

        source = data.get(
            "source",
            ""
        )

        if len(text) < 20:

            continue

        records.append({

            "id":
                os.path.basename(path),

            "title":
                title,

            "text":
                text,

            "source":
                source,

            "url":
                url,

            "label":
                None,

            "dataset":
                "HealthRelease"

        })

    return records


# ============================================================
# COAID
# ============================================================

def process_coaid():

    folder = os.path.join(
        RAW_TRAINING,
        "CoAID"
    )

    records = []

    print("\nProcessing CoAID...")

    files = []

    for root, _, filenames in os.walk(folder):

        for filename in filenames:

            if filename.lower().endswith(".csv"):

                files.append(
                    os.path.join(
                        root,
                        filename
                    )
                )

    for path in tqdm(files):

        filename = os.path.basename(path).lower()

        # ----------------------------------------------------
        # Determine label from filename
        # ----------------------------------------------------

        if "fake" in filename:

            label = 0

        elif "real" in filename:

            label = 1

        else:

            continue

        try:

            df = pd.read_csv(
                path
            )

        except Exception as e:

            print(
                f"\nError reading {path}: {e}"
            )

            continue

        # Normalize column names

        df.columns = [

            str(column)
            .strip()
            .lower()

            for column in df.columns

        ]

        # ----------------------------------------------------
        # PROCESS CLAIM FILES
        # ----------------------------------------------------

        if filename.startswith("claim"):

            for index, row in df.iterrows():

                title = clean_text(
                    row.get(
                        "title",
                        ""
                    )
                )

                url = row.get(
                    "news_url",
                    ""
                )

                if not title:

                    continue

                records.append({

                    "id":
                        f"CoAID_{os.path.basename(path)}_{index}",

                    "title":
                        title,

                    "text":
                        title,

                    "source":
                        "CoAID",

                    "url":
                        url,

                    "label":
                        label,

                    "dataset":
                        "CoAID"

                })

        # ----------------------------------------------------
        # PROCESS NEWS FILES
        # ----------------------------------------------------

        elif filename.startswith("news"):

            for index, row in df.iterrows():

                title = clean_text(
                    row.get(
                        "title",
                        ""
                    )
                )

                content = clean_text(
                    row.get(
                        "content",
                        ""
                    )
                )

                newstitle = clean_text(
                    row.get(
                        "newstitle",
                        ""
                    )
                )

                abstract = clean_text(
                    row.get(
                        "abstract",
                        ""
                    )
                )

                url = row.get(
                    "news_url",
                    ""
                )

                # ------------------------------------------------
                # Prefer full article content
                # ------------------------------------------------

                if len(content) >= 20:

                    text = content

                elif len(abstract) >= 20:

                    text = abstract

                elif len(newstitle) >= 20:

                    text = newstitle

                elif len(title) >= 20:

                    text = title

                else:

                    continue

                records.append({

                    "id":
                        f"CoAID_{os.path.basename(path)}_{index}",

                    "title":
                        title,

                    "text":
                        text,

                    "source":
                        "CoAID",

                    "url":
                        url,

                    "label":
                        label,

                    "dataset":
                        "CoAID"

                })

    return records


# ============================================================
# MAIN
# ============================================================

print("=" * 60)

print(
    "MEDIVERIFY TRAINING DATA PREPROCESSING"
)

print("=" * 60)


# ============================================================
# PROCESS DATASETS
# ============================================================

healthstory_records = process_healthstory()

healthrelease_records = process_healthrelease()

coaid_records = process_coaid()


# ============================================================
# COMBINE
# ============================================================

all_records = (

    healthstory_records
    +
    healthrelease_records
    +
    coaid_records

)

df = pd.DataFrame(
    all_records
)


print(
    "\nTotal records before cleaning:",
    len(df)
)


# ============================================================
# REMOVE EMPTY TEXT
# ============================================================

df["text"] = df["text"].fillna("")

df = df[
    df["text"].str.len() >= 20
]


# ============================================================
# REMOVE DUPLICATES
# ============================================================

before_duplicates = len(df)

df = df.drop_duplicates(
    subset=["text"]
)

duplicates_removed = (
    before_duplicates
    - len(df)
)


# ============================================================
# RESET INDEX
# ============================================================

df = df.reset_index(
    drop=True
)


print(
    "Duplicates removed:",
    duplicates_removed
)

print(
    "Records after cleaning:",
    len(df)
)


# ============================================================
# SAVE ALL PROCESSED DATA
# ============================================================

training_file = os.path.join(

    PROCESSED_DIR,

    "training_data.csv"

)

df.to_csv(

    training_file,

    index=False

)


# ============================================================
# SAVE LABELLED DATA
# ============================================================

labelled_df = df[
    df["label"].notna()
].copy()


labelled_file = os.path.join(

    PROCESSED_DIR,

    "labelled_data.csv"

)


labelled_df.to_csv(

    labelled_file,

    index=False

)


# ============================================================
# SAVE UNLABELLED DATA
# ============================================================

unlabelled_df = df[
    df["label"].isna()
].copy()


unlabelled_file = os.path.join(

    PROCESSED_DIR,

    "unlabelled_medical_news.csv"

)


unlabelled_df.to_csv(

    unlabelled_file,

    index=False

)


# ============================================================
# DATASET REPORT
# ============================================================

dataset_report = (

    df
    .groupby(
        "dataset"
    )
    .size()
    .reset_index(
        name="records"
    )

)


dataset_report.to_csv(

    os.path.join(

        PROCESSED_DIR,

        "dataset_report.csv"

    ),

    index=False

)


# ============================================================
# LABEL REPORT
# ============================================================

label_report = (

    df
    .groupby(
        ["dataset", "label"],
        dropna=False
    )
    .size()
    .reset_index(
        name="records"
    )

)


label_report.to_csv(

    os.path.join(

        PROCESSED_DIR,

        "label_report.csv"

    ),

    index=False

)


# ============================================================
# FINAL REPORT
# ============================================================

print("\n" + "=" * 60)

print(
    "DATASET DISTRIBUTION"
)

print("=" * 60)

print(
    dataset_report
)


print("\n" + "=" * 60)

print(
    "LABEL DISTRIBUTION"
)

print("=" * 60)

print(
    label_report
)


print("\n" + "=" * 60)

print(
    "LABEL MEANING"
)

print("=" * 60)

print(
    "0 = Fake"
)

print(
    "1 = Real"
)

print(
    "NaN = Unlabelled"
)


print("\n" + "=" * 60)

print(
    "FILES CREATED"
)

print("=" * 60)

print(
    training_file
)

print(
    labelled_file
)

print(
    unlabelled_file
)

print(
    "\nPREPROCESSING COMPLETED"
)

print("=" * 60)