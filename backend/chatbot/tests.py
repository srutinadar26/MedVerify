import json
from django.test import TestCase, Client
from api.models import Claim
from chatbot.claim_validator import validate_claim_text
from chatbot.views import _execute_verification


class InputValidationTests(TestCase):
    """Regression tests for input validation (greetings, chrome, non-medical, too short)."""

    def test_short_claim_rejected(self):
        result = validate_claim_text("flu")
        self.assertFalse(result["valid"])
        self.assertEqual(result["reason_code"], "TOO_SHORT")

    def test_casual_greeting_rejected(self):
        result = validate_claim_text("hello, how are you?")
        self.assertFalse(result["valid"])
        self.assertEqual(result["reason_code"], "CASUAL_GREETING")

    def test_joke_rejected(self):
        result = validate_claim_text("Why did the chicken cross the road? Just to get to the other side!")
        self.assertFalse(result["valid"])
        self.assertEqual(result["reason_code"], "CASUAL_GREETING")

    def test_non_medical_statement_rejected(self):
        result = validate_claim_text("The weather is sunny today and tomorrow will be rainy.")
        self.assertFalse(result["valid"])
        self.assertEqual(result["reason_code"], "NON_MEDICAL_TOPIC")

    def test_navigation_chrome_rejected(self):
        chrome = "Health Menu Doctor Login Find Hospital Contact Us Privacy Policy Skip to main content"
        result = validate_claim_text(chrome)
        self.assertFalse(result["valid"])
        self.assertEqual(result["reason_code"], "WEBSITE_NAVIGATION")

    def test_valid_medical_claims_accepted(self):
        claims = [
            "Drinking bleach cures COVID-19.",
            "Regular physical activity reduces the risk of heart disease.",
            "Vitamin C supplements can prevent the common cold.",
            "Aspirin reduces blood clotting and lowers risk of secondary stroke.",
        ]
        for c in claims:
            res = validate_claim_text(c)
            self.assertTrue(res["valid"], f"Claim was unexpectedly rejected: {c} - {res.get('message')}")


class HistoryAPITests(TestCase):
    """Tests for history deletion endpoint (DELETE /api/history/<id>/)."""

    def setUp(self):
        self.client = Client()
        self.claim1 = Claim.objects.create(
            claim_text="Drinking bleach cures COVID-19",
            verdict="FALSE",
            confidence=0.95,
            explanation="Bleach is toxic.",
            source_url="https://who.int"
        )
        self.claim2 = Claim.objects.create(
            claim_text="Exercise prevents heart disease",
            verdict="TRUE",
            confidence=0.90,
            explanation="Exercise is good.",
            source_url="https://cdc.gov"
        )

    def test_delete_single_claim_success(self):
        response = self.client.delete(f"/api/history/{self.claim1.id}/")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("deleted_id"), self.claim1.id)

        # Verify claim1 deleted, claim2 persists
        self.assertFalse(Claim.objects.filter(id=self.claim1.id).exists())
        self.assertTrue(Claim.objects.filter(id=self.claim2.id).exists())

    def test_delete_claim_not_found(self):
        response = self.client.delete("/api/history/999999/")
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.content)
        self.assertFalse(data.get("success"))
        self.assertIn("error", data)


class ClaimVerificationPipelineTests(TestCase):
    """Integration tests for the verification pipeline and benchmark claims."""

    def setUp(self):
        self.client = Client()

    def test_verify_api_rejects_invalid_input(self):
        response = self.client.post(
            "/api/verify/text/",
            data=json.dumps({"text": "hello"}),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.content)
        self.assertFalse(data.get("success"))
        self.assertFalse(data.get("valid_input"))
        self.assertEqual(data.get("error_code"), "CASUAL_GREETING")

    def test_bleach_covid_claim_refuted(self):
        claim_text = "Drinking bleach cures COVID-19."
        result = _execute_verification(claim_text)
        self.assertEqual(result["verdict"], "REFUTED")
        self.assertEqual(result["legacy_verdict"], "FALSE")
        self.assertGreaterEqual(result["confidence"], 0.75)
        # Verify evidence contains contradicting sources
        contradicting = [e for e in result["evidence"] if e.get("nli_label") == "CONTRADICTION"]
        self.assertGreater(len(contradicting), 0, "Expected at least one contradicting evidence item")

    def test_physical_activity_heart_disease_supported(self):
        claim_text = "Regular physical activity reduces the risk of heart disease."
        result = _execute_verification(claim_text)
        self.assertEqual(result["verdict"], "SUPPORTED")
        self.assertEqual(result["legacy_verdict"], "TRUE")
        self.assertGreaterEqual(result["confidence"], 0.75)
        # Verify evidence contains supporting sources
        supporting = [e for e in result["evidence"] if e.get("nli_label") == "ENTAILMENT"]
        self.assertGreater(len(supporting), 0, "Expected at least one supporting evidence item")

    def test_vitamin_c_common_cold_prevention_refuted(self):
        claim_text = "Vitamin C supplements can prevent the common cold."
        result = _execute_verification(claim_text)
        # Regular supplementation does not prevent colds in the general population
        self.assertIn(result["verdict"], ["REFUTED", "UNCERTAIN"])
        if result["verdict"] == "REFUTED":
            self.assertEqual(result["legacy_verdict"], "FALSE")
        # Evidence should note difference between prevention and duration reduction
        evidence_texts = " ".join([e.get("excerpt", "") for e in result["evidence"]]) + " " + result.get("summary", "")
        self.assertTrue(
            "incidence" in evidence_texts.lower() or "prevent" in evidence_texts.lower() or "duration" in evidence_texts.lower() or "cold" in evidence_texts.lower()
        )

    def test_insufficient_evidence_uncertain(self):
        claim_text = "Eating purple crystals restores cartilage in 3 hours."
        result = _execute_verification(claim_text)
        self.assertEqual(result["verdict"], "UNCERTAIN")
        self.assertEqual(result["legacy_verdict"], "MISLEADING")
        self.assertLessEqual(result["confidence"], 0.6)
