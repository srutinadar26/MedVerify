"""
services.py
===========
Medical chatbot response generator.

Replaces the broken OpenAI dependency (which used "gpt-6-luna",
a non-existent model) with a local knowledge-base responder.

The knowledge base mirrors the frontend chatbot entries so that
the backend can independently serve the same answers (and the
frontend can remove its internal client-side chatbot logic if desired).
"""

import re


# ─── Knowledge base ──────────────────────────────────────────────────────────

_KNOWLEDGE = [
    # Vaccines
    {
        "keys": ["vaccine", "vaccination", "vaccinated", "immunization"],
        "reply": (
            "Vaccines are among the most well-studied medical interventions. "
            "Multiple large-scale studies have found no link between vaccines "
            "and autism. Follow your country's immunization schedule "
            "(ICMR in India / WHO globally). "
            "Source: WHO, ICMR, Cochrane Reviews."
        ),
    },
    # COVID
    {
        "keys": ["covid", "coronavirus", "sars-cov-2"],
        "reply": (
            "For current COVID-19 guidance follow WHO (who.int) and ICMR "
            "(icmr.gov.in). Vaccination, ventilation, and hand hygiene remain "
            "the most evidence-supported preventive measures."
        ),
    },
    # Vitamin C / colds
    {
        "keys": ["vitamin c", "cold", "flu"],
        "reply": (
            "Vitamin C does not prevent the common cold in the general "
            "population. Regular supplementation may slightly shorten duration "
            "in some groups. "
            "Source: Cochrane Review (Hemilä & Chalker, 2013)."
        ),
    },
    # Turmeric / cancer
    {
        "keys": ["turmeric", "curcumin"],
        "reply": (
            "Turmeric has mild anti-inflammatory properties in laboratory "
            "studies, but there is no reliable clinical evidence that it cures "
            "cancer or other major diseases. Do not replace prescribed treatment."
        ),
    },
    # Garlic
    {
        "keys": ["garlic"],
        "reply": (
            "Garlic has some antimicrobial properties in lab studies. "
            "Evidence that it prevents cancer or serious infections in humans "
            "is weak. It can interact with blood thinners."
        ),
    },
    # Green tea / fat
    {
        "keys": ["green tea", "fat burn"],
        "reply": (
            "Green tea may slightly boost metabolism, but it does not 'burn fat "
            "instantly.' Sustainable weight loss requires diet and exercise."
        ),
    },
    # Water / 8 glasses
    {
        "keys": ["8 glasses", "water intake", "drink water"],
        "reply": (
            "The '8 glasses a day' rule is not universally supported. "
            "Water needs vary by person, activity level, and climate. "
            "Thirst and pale-yellow urine are better guides."
        ),
    },
    # Alkaline water
    {
        "keys": ["alkaline", "ph water"],
        "reply": (
            "Alkaline water has no proven health benefits over normal water. "
            "The body tightly regulates blood pH — food and water cannot "
            "significantly change it."
        ),
    },
    # Detox
    {
        "keys": ["detox", "cleanse"],
        "reply": (
            "Your liver and kidneys already detoxify your body continuously. "
            "'Detox teas' and commercial cleanses have no proven benefit and "
            "some can be harmful."
        ),
    },
    # Homeopathy
    {
        "keys": ["homeopathy"],
        "reply": (
            "Systematic reviews (including Australia's NHMRC) find no reliable "
            "evidence that homeopathy works beyond placebo. "
            "Consult a qualified doctor for evidence-based treatment."
        ),
    },
    # Cancer cure
    {
        "keys": ["cancer cure", "cure cancer"],
        "reply": (
            "There is no single 'cure for cancer.' Treatment depends on type, "
            "stage, and patient. Beware of any claim of a universal cancer cure "
            "— it is almost always misleading or false."
        ),
    },
    # Antibiotics
    {
        "keys": ["antibiotic", "antibiotics"],
        "reply": (
            "Antibiotics only work on bacterial infections — not viruses like "
            "colds or flu. Always complete the prescribed course. "
            "Misuse leads to antibiotic resistance."
        ),
    },
    # Lemon / diabetes
    {
        "keys": ["lemon", "diabetes"],
        "reply": (
            "Evidence from PubMed and WHO does NOT support lemon water as a "
            "cure for diabetes. Hydration helps general health, but diabetes "
            "requires medical management, diet, and prescribed medication."
        ),
    },
    # Blood pressure
    {
        "keys": ["blood pressure", "hypertension"],
        "reply": (
            "Normal blood pressure is around 120/80 mmHg. "
            "Above 140/90 consistently = hypertension. "
            "Lifestyle changes (diet, exercise) + medication if prescribed. "
            "Get checked regularly."
        ),
    },
    # Blood sugar
    {
        "keys": ["blood sugar", "diabetes"],
        "reply": (
            "Fasting blood sugar: 70–100 mg/dL = normal; "
            "100–125 = prediabetes; 126+ = diabetes (confirmed twice). "
            "Get an HbA1c test for a 3-month picture."
        ),
    },
    # Autism
    {
        "keys": ["autism"],
        "reply": (
            "Autism is a neurodevelopmental condition with genetic and "
            "environmental factors. It is NOT caused by vaccines. "
            "Early support and therapy improve outcomes."
        ),
    },
    # Pregnancy
    {
        "keys": ["pregnancy", "pregnant"],
        "reply": (
            "For any pregnancy-related question — especially pain, bleeding, "
            "reduced fetal movement, or swelling — contact your gynaecologist "
            "or go to the nearest hospital immediately."
        ),
    },
    # Paracetamol
    {
        "keys": ["paracetamol", "acetaminophen"],
        "reply": (
            "Paracetamol dose for adults: 500–1000 mg every 4–6 hours, "
            "maximum 4 g/day. Overdose is dangerous — go to hospital "
            "immediately if you suspect one."
        ),
    },
    # Ibuprofen
    {
        "keys": ["ibuprofen"],
        "reply": (
            "Ibuprofen: 200–400 mg every 4–6 hours with food, max 1200 mg/day "
            "OTC. Avoid with stomach ulcers, kidney disease, or in late "
            "pregnancy."
        ),
    },
    # Mental health
    {
        "keys": ["mental health", "depression", "anxiety"],
        "reply": (
            "Depression is a real, treatable medical condition. "
            "Therapy and/or medication are effective. "
            "If you have thoughts of self-harm, call the "
            "Suicide & Crisis Helpline (India): 9152987821 or "
            "iCall: 9152987821."
        ),
    },
    # Sleep
    {
        "keys": ["sleep", "insomnia"],
        "reply": (
            "Adults need 7–9 hours of sleep per night. "
            "Consistent schedule, no screens 1 hour before bed, and a cool "
            "dark room help. Persistent insomnia → see a doctor."
        ),
    },
    # Bleach
    {
        "keys": ["bleach"],
        "reply": (
            "Drinking bleach is extremely dangerous and can be fatal. "
            "Bleach is a surface disinfectant ONLY. "
            "It should NEVER be ingested. "
            "Call Poison Control immediately if someone has ingested bleach."
        ),
    },
]


def _normalize(text: str) -> str:
    return text.lower().strip()


def _find_reply(question: str):
    q = _normalize(question)
    # Sort by longest key match first (more specific)
    for entry in sorted(_KNOWLEDGE, key=lambda e: -max(len(k) for k in e["keys"])):
        for key in entry["keys"]:
            if key in q:
                return entry["reply"]
    return None


_GENERIC_FALLBACK = (
    "I don't have a specific verified answer for that question yet.\n\n"
    "Here's what I recommend:\n"
    "• Check trusted sources: PubMed (pubmed.ncbi.nlm.nih.gov), "
    "WHO (who.int), ICMR (icmr.gov.in), or NHS (nhs.uk).\n"
    "• Be sceptical of viral social-media health tips.\n"
    "• For personal medical concerns, consult a qualified doctor.\n\n"
    "⚠️ If this is an emergency (chest pain, breathing trouble, severe "
    "bleeding, or thoughts of self-harm), call 108 or 112 in India right now."
)


def get_chatbot_response(question: str, language: str = "English") -> str:
    """
    Generate a local chatbot response.

    Parameters
    ----------
    question : str  – user's question
    language : str  – requested language (currently only English is supported
                       without a translation layer)

    Returns
    -------
    str – response text
    """
    if not question or not question.strip():
        return _GENERIC_FALLBACK

    reply = _find_reply(question)
    if reply:
        if language and language.lower() != "english":
            # Translation not implemented — note this honestly
            reply += (
                f"\n\n(Note: Full {language} translation is not yet available. "
                "Response shown in English.)"
            )
        return reply

    return _GENERIC_FALLBACK