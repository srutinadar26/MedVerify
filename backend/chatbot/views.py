from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .services import get_chatbot_response
from .evidence_service import search_pubmed
from .claim_service import classify_claim
from .models import ChatMessage, EvidenceSource


@api_view(["POST"])
def chat(request):

    question = request.data.get("question")
    language = request.data.get("language", "English")

    if not question:
        return Response(
            {"error": "Question is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # 1. Retrieve medical evidence
        evidence = search_pubmed(
            query=question,
            max_results=3
        )

        # 2. Classify the claim using the evidence
        verdict_result = classify_claim(
            claim=question,
            evidence=evidence
        )

        # 3. Generate the chatbot response
        answer = get_chatbot_response(
            question=question,
            language=language
        )

        # 4. Save the conversation
        ChatMessage.objects.create(
            question=question,
            answer=answer,
            language=language
        )

        # 5. Save evidence sources
        for item in evidence:
            EvidenceSource.objects.create(
                title=item["title"],
                source_name="PubMed",
                url=item["url"],
                evidence_text=item["abstract"]
            )

        # 6. Prepare sources for the response
        sources = [
            {
                "title": item["title"],
                "source_name": "PubMed",
                "pmid": item["pmid"],
                "url": item["url"]
            }
            for item in evidence
        ]

        # 7. Return the complete response
        return Response({
            "question": question,
            "language": language,
            "answer": answer,
            "verdict": verdict_result,
            "sources": sources
        })

    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
