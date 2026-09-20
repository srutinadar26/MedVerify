import pandas as pd
import os


INPUT_FILE = "datasets/processed/knowledge_chunks_final.csv"
OUTPUT_FILE = "datasets/processed/rag_chunks.csv"

TARGET_PER_SOURCE = 10000


def main():

    print("Loading knowledge chunks...")

    df = pd.read_csv(INPUT_FILE)

    print(f"Total chunks available: {len(df):,}")

    # Keep only useful medical knowledge categories
    selected = df[
        (
            (df["source"] == "WHO") &
            (df["category"].isin(["factsheets", "medical guidelines"]))
        )
        |
        (
            (df["source"] == "ICMR") &
            (df["category"].isin(["guideline", "medical guidelines"]))
        )
        |
        (
            (df["source"] == "PubMed") &
            (df["category"] == "research")
        )
    ].copy()

    print(f"Relevant chunks: {len(selected):,}")

    # Sample a manageable number from each source
    selected_parts = []

    for source in ["WHO", "ICMR", "PubMed"]:

        source_df = selected[selected["source"] == source]

        if len(source_df) > TARGET_PER_SOURCE:
            source_df = source_df.sample(
                n=TARGET_PER_SOURCE,
                random_state=42
            )

        selected_parts.append(source_df)

        print(
            f"{source}: {len(source_df):,} chunks selected"
        )

    final_df = pd.concat(
        selected_parts,
        ignore_index=True
    )

    # Shuffle final dataset
    final_df = final_df.sample(
        frac=1,
        random_state=42
    ).reset_index(drop=True)

    os.makedirs(
        os.path.dirname(OUTPUT_FILE),
        exist_ok=True
    )

    final_df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("\nRAG dataset created!")
    print(f"Total chunks: {len(final_df):,}")
    print(f"Saved to: {OUTPUT_FILE}")

    print("\nSource distribution:")
    print(final_df["source"].value_counts())


if __name__ == "__main__":
    main()