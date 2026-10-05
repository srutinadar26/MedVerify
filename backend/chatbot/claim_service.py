from openai import OpenAI
from django.conf import settings


client = OpenAI(api_key=settings.OPENAI_API_KEY)


def classify_claim(claim, evidence):

    evidence_text = "\n\n".join(
        [
            f"Title: {item['title']}\n"
            f"Abstract: {item['abstract']}"
            for item in evidence
        ]
    )

    instructions = """
You are MediVerify AI, a medical misinformation analysis system.

Analyze the user's medical claim using ONLY the evidence provided.

Classify the claim as exactly one of:

TRUE
FALSE
MISLEADING
INSUFFICIENT_EVIDENCE

Rules:
- TRUE means the evidence supports the claim.
- FALSE means the evidence contradicts the claim.
- MISLEADING means the claim contains some truth but gives an incorrect or incomplete impression.
- INSUFFICIENT_EVIDENCE means the provided evidence is not enough to determine the claim.
- Do not diagnose the user.
- Do not prescribe medicines or dosages.
- Do not invent evidence or sources.
- Explain the reasoning in simple language.

Return the result in this format:

VERDICT: <one label>

EXPLANATION: <short explanation>
"""

    response = client.responses.create(
        model="gpt-6-luna",
        instructions=instructions,
        input=f"""
MEDICAL CLAIM:
{claim}

EVIDENCE:
{evidence_text}
"""
    )

    return response.output_text