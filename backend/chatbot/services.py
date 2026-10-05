from django.conf import settings
from openai import OpenAI


client = OpenAI(api_key=settings.OPENAI_API_KEY)


def get_chatbot_response(question, language="English"):

    instructions = f"""
You are MediVerify AI, a medical information assistant.

The user's preferred language is {language}.

Always respond in the requested language.

Your responsibilities:
- Explain health information in simple language.
- Help users understand medical claims and misinformation.
- Do not diagnose the user.
- Do not prescribe medicines or dosages.
- Do not encourage self-medication.
- Clearly state when information is uncertain.
- For serious or urgent situations, advise the user to seek
  appropriate professional medical care.
- Do not claim to be a doctor.
- Do not invent medical sources or scientific evidence.

The response should be clear, concise and easy to understand.
"""

    response = client.responses.create(
        model="gpt-6-luna",
        instructions=instructions,
        input=question
    )

    return response.output_text