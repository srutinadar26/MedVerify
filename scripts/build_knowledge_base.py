import pandas as pd
import pymupdf
from pathlib import Path


KNOWLEDGE_DIR = Path("datasets/knowledge")
OUTPUT_DIR = Path("datasets/processed")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = OUTPUT_DIR / "knowledge_chunks.csv"


records = []


def add_record(
    source,
    category,
    document,
    text,
    page=None,
    row=None,
    sheet=None,
    identifier=None,
    title=None,
    url=None
):
    text = str(text).strip()

    if not text:
        return

    records.append({
        "source": source,
        "category": category,
        "document": document,
        "page": page,
        "row": row,
        "sheet": sheet,
        "identifier": identifier,
        "title": title,
        "url": url,
        "text": text
    })


def process_pdf(file_path, source, category):
    print(f"Processing PDF: {file_path.name}")

    try:
        document = pymupdf.open(str(file_path))

        for page_number, page in enumerate(document, start=1):
            text = page.get_text().strip()

            if text:
                add_record(
                    source=source,
                    category=category,
                    document=file_path.name,
                    page=page_number,
                    text=text
                )

        document.close()

    except Exception as e:
        print(f"SKIPPED: {file_path.name}")
        print(f"Reason: {e}")

def process_pubmed(file_path):
    print(f"Processing PubMed: {file_path.name}")

    df = pd.read_csv(file_path)

    for _, row in df.iterrows():

        title = str(row.get("AKE_pubmed_title", ""))
        abstract = str(row.get("AKE_abstract", ""))
        pubmed_id = str(row.get("AKE_pubmed_id", ""))

        text = f"{title}\n\n{abstract}"

        add_record(
            source="PubMed",
            category="research",
            document=file_path.name,
            identifier=pubmed_id,
            title=title,
            text=text
        )


def process_xlsx(file_path, source, category):
    print(f"Processing XLSX: {file_path.name}")

    excel = pd.ExcelFile(file_path)

    for sheet_name in excel.sheet_names:

        df = pd.read_excel(
            file_path,
            sheet_name=sheet_name
        )

        for row_number, row in df.iterrows():

            values = []

            for column in df.columns:
                value = row[column]

                if pd.notna(value):
                    values.append(str(value))

            text = " | ".join(values)

            add_record(
                source=source,
                category=category,
                document=file_path.name,
                sheet=sheet_name,
                row=row_number + 2,
                text=text
            )


# --------------------------------------------------
# ICMR PDFs
# --------------------------------------------------

icmr_dir = KNOWLEDGE_DIR / "ICMR" / "ICMR Dataset"

for file_path in icmr_dir.glob("*.pdf"):
    process_pdf(
        file_path,
        source="ICMR",
        category="guideline"
    )


# --------------------------------------------------
# WHO PDFs
# --------------------------------------------------

who_documents_dir = KNOWLEDGE_DIR / "WHO" / "who documents"

for category_dir in who_documents_dir.iterdir():

    if not category_dir.is_dir():
        continue

    category = category_dir.name

    for file_path in category_dir.glob("*.pdf"):
        process_pdf(
            file_path,
            source="WHO",
            category=category
        )


# --------------------------------------------------
# WHO XLSX
# --------------------------------------------------

for file_path in who_documents_dir.rglob("*.xlsx"):
    process_xlsx(
        file_path,
        source="WHO",
        category="drug_listing"
    )


# --------------------------------------------------
# PubMed
# --------------------------------------------------

pubmed_dir = KNOWLEDGE_DIR / "PubMed"

for file_path in pubmed_dir.glob("*.csv"):
    process_pubmed(file_path)


# --------------------------------------------------
# Create dataframe
# --------------------------------------------------

knowledge_df = pd.DataFrame(records)

knowledge_df = knowledge_df.drop_duplicates(
    subset=["source", "document", "page", "row", "sheet", "text"]
)

knowledge_df = knowledge_df.reset_index(drop=True)

knowledge_df.to_csv(
    OUTPUT_FILE,
    index=False
)


print("\n====================================")
print("Knowledge base extraction completed!")
print("====================================")

print("\nTotal records:", len(knowledge_df))

print("\nRecords by source:")
print(knowledge_df["source"].value_counts())

print("\nRecords by category:")
print(knowledge_df["category"].value_counts())

print("\nSaved to:")
print(OUTPUT_FILE)