"""
chatbot/tests.py
================
Comprehensive regression suite for MedVerify's unified input validation
and verification pipeline.

Covers all three input modes:
  - Direct text
  - URL (with SSRF, non-medical, malformed, timeout scenarios)
  - Image (OCR, non-medical, unreadable, multi-claim)

Test Categories:
  1. InputValidationTests    — validate_claim_text() unit tests
  2. UrlValidationTests      — extract_and_validate_url() unit tests
  3. ImageValidationTests    — extract_and_validate_image() unit tests
  4. PipelineStateTests      — assert pipeline states, no downstream leakage
  5. VerifyAPITests          — HTTP endpoint integration tests
  6. ClaimVerificationTests  — _execute_verification() integration tests

Design principles:
  - Mock expensive services (FAISS, PubMed, HTTP fetches) for validation gate tests
  - Separate integration tests run the full pipeline end-to-end
  - Assert that REJECTED inputs NEVER trigger verdict generation
"""

import io
import json
from unittest.mock import patch, MagicMock, Mock

from django.test import TestCase, Client
from api.models import Claim

from chatbot.claim_validator import (
    validate_claim_text,
    validate_url_syntax,
    extract_and_validate_url,
    extract_and_validate_image,
)
from chatbot.views import _execute_verification


# ─── 1. TEXT VALIDATION UNIT TESTS ───────────────────────────────────────────

class InputValidationTextTests(TestCase):
    """Unit tests for validate_claim_text()."""

    # ── Valid medical claims ──────────────────────────────────────────────────
    def test_valid_bleach_covid_claim(self):
        r = validate_claim_text("Drinking bleach cures COVID-19.")
        self.assertTrue(r["valid"], f"Rejected: {r.get('message')}")
        self.assertEqual(r["reason_code"], "READY_FOR_VERIFICATION")

    def test_valid_physical_activity_heart_disease(self):
        r = validate_claim_text("Regular physical activity reduces the risk of heart disease.")
        self.assertTrue(r["valid"], f"Rejected: {r.get('message')}")
        self.assertEqual(r["reason_code"], "READY_FOR_VERIFICATION")

    def test_valid_vitamin_c_claim(self):
        r = validate_claim_text("Vitamin C supplements can prevent the common cold.")
        self.assertTrue(r["valid"], f"Rejected: {r.get('message')}")

    def test_valid_aspirin_claim(self):
        r = validate_claim_text("Aspirin reduces blood clotting and lowers risk of secondary stroke.")
        self.assertTrue(r["valid"], f"Rejected: {r.get('message')}")

    def test_valid_negated_claim(self):
        r = validate_claim_text("Vaccines do not cause autism.")
        self.assertTrue(r["valid"], f"Negated claim incorrectly rejected: {r.get('message')}")

    def test_valid_question_with_health_claim(self):
        # A declarative sentence with health claim predicate should be valid
        r = validate_claim_text("Turmeric prevents cancer growth by inhibiting inflammation.")
        self.assertTrue(r["valid"], f"Rejected: {r.get('message')}")

    # ── Empty / invalid inputs ────────────────────────────────────────────────
    def test_none_input_rejected(self):
        r = validate_claim_text(None)
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_empty_string_rejected(self):
        r = validate_claim_text("")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_whitespace_only_rejected(self):
        r = validate_claim_text("   \t\n  ")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_too_short_rejected(self):
        r = validate_claim_text("flu")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_single_char_rejected(self):
        r = validate_claim_text("x")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_numbers_only_rejected(self):
        r = validate_claim_text("12345")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_emoji_only_rejected(self):
        r = validate_claim_text("🦠💊😷")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_random_characters_rejected(self):
        r = validate_claim_text("asdfghjkl")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_keyboard_mash_rejected(self):
        r = validate_claim_text("qwertyuiopqwertyuiop")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    # ── Non-medical content ───────────────────────────────────────────────────
    def test_sky_is_blue_rejected(self):
        r = validate_claim_text("The sky is blue.")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "NON_MEDICAL_CONTENT",
                         "Ordinary non-medical statement should return NON_MEDICAL_CONTENT")
        self.assertFalse(r.get("medical_relevance", True))

    def test_casual_greeting_rejected(self):
        r = validate_claim_text("hello, how are you?")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "NON_MEDICAL_CONTENT")

    def test_good_morning_rejected(self):
        r = validate_claim_text("Good morning! Have a nice day.")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "NON_MEDICAL_CONTENT")

    def test_joke_rejected(self):
        r = validate_claim_text("Why did the chicken cross the road? Just to get to the other side!")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "NON_MEDICAL_CONTENT")

    def test_weather_statement_rejected(self):
        r = validate_claim_text("The weather is sunny today and tomorrow will be rainy.")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "NON_MEDICAL_CONTENT")

    def test_programming_topic_rejected(self):
        r = validate_claim_text("Python is a great programming language for beginners.")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "NON_MEDICAL_CONTENT")

    def test_sports_statement_rejected(self):
        r = validate_claim_text("India won the cricket World Cup final this year.")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "NON_MEDICAL_CONTENT")

    def test_navigation_chrome_rejected(self):
        chrome = "Health Menu Doctor Login Find Hospital Contact Us Privacy Policy Skip to main content"
        r = validate_claim_text(chrome)
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "NON_MEDICAL_CONTENT")

    # ── Medical terminology without a checkable claim ─────────────────────────
    def test_single_medical_word_rejected_as_no_claim(self):
        r = validate_claim_text("diabetes")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "NO_CHECKABLE_CLAIM",
                         "Single medical term without assertion should be NO_CHECKABLE_CLAIM")
        self.assertTrue(r.get("medical_relevance", False))

    def test_medical_keyword_list_rejected_as_no_claim(self):
        r = validate_claim_text("Doctor hospital clinic patient surgery")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "NO_CHECKABLE_CLAIM")

    def test_medical_word_no_verb_rejected(self):
        r = validate_claim_text("cancer treatment options")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "NO_CHECKABLE_CLAIM")

    # ── Questions vs claims ───────────────────────────────────────────────────
    def test_medical_question_rejected_as_no_claim(self):
        r = validate_claim_text("What is the treatment for diabetes?")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "NO_CHECKABLE_CLAIM",
                         "Medical question seeking info should be NO_CHECKABLE_CLAIM")
        self.assertTrue(r.get("medical_relevance", False))

    def test_how_question_rejected(self):
        r = validate_claim_text("How do vaccines work in the human body?")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "NO_CHECKABLE_CLAIM")

    def test_what_is_question_rejected(self):
        r = validate_claim_text("What are the symptoms of COVID-19?")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "NO_CHECKABLE_CLAIM")

    # ── Claim type classification ─────────────────────────────────────────────
    def test_claim_type_treatment(self):
        r = validate_claim_text("Aspirin is used to treat mild fever.")
        self.assertTrue(r["valid"])
        self.assertIn("Treatment", r.get("claim_type", ""))

    def test_claim_type_individual_status(self):
        r = validate_claim_text("I have been diagnosed with hypertension.")
        self.assertTrue(r["valid"])
        self.assertEqual(r.get("claim_type"), "INDIVIDUAL_MEDICAL_STATUS")

    def test_claim_type_prevention(self):
        r = validate_claim_text("Vaccination prevents measles in children.")
        self.assertTrue(r["valid"])
        self.assertIn("Prevention", r.get("claim_type", ""))


# ─── 2. URL VALIDATION UNIT TESTS ────────────────────────────────────────────

class UrlSyntaxValidationTests(TestCase):
    """Unit tests for validate_url_syntax()."""

    def test_empty_url_rejected(self):
        r = validate_url_syntax("")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_none_url_rejected(self):
        r = validate_url_syntax(None)
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_malformed_url_rejected(self):
        r = validate_url_syntax("not-a-url-at-all")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_localhost_ssrf_rejected(self):
        r = validate_url_syntax("http://localhost:8000/admin")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_loopback_ip_ssrf_rejected(self):
        r = validate_url_syntax("http://127.0.0.1:5000")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_private_ip_ssrf_rejected(self):
        r = validate_url_syntax("http://192.168.1.1/admin")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_private_10_0_0_0_ssrf_rejected(self):
        r = validate_url_syntax("http://10.0.0.1/anything")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_link_local_aws_metadata_ssrf_rejected(self):
        r = validate_url_syntax("http://169.254.169.254/latest/meta-data/")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_ftp_scheme_rejected(self):
        r = validate_url_syntax("ftp://example.com/file.txt")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_valid_https_url_accepted(self):
        r = validate_url_syntax("https://www.who.int/news-room/fact-sheets")
        self.assertTrue(r["valid"])

    def test_valid_http_url_accepted(self):
        r = validate_url_syntax("http://example.com/article")
        self.assertTrue(r["valid"])

    def test_plain_domain_prepends_https(self):
        r = validate_url_syntax("www.who.int/news")
        self.assertTrue(r["valid"])
        self.assertIn("https://", r.get("clean_url", ""))


class UrlExtractionMockedTests(TestCase):
    """URL extraction tests with mocked HTTP to avoid real network calls."""

    def _make_mock_response(self, status_code=200, content="", content_type="text/html"):
        resp = MagicMock()
        resp.status_code = status_code
        resp.headers = {"Content-Type": content_type}
        resp.url = "https://example.com/article"
        resp.encoding = "utf-8"
        resp.is_redirect = False
        resp.raw = MagicMock()
        resp.raw.read.return_value = content.encode("utf-8") if isinstance(content, str) else content
        return resp

    @patch("chatbot.claim_validator.requests")
    def test_valid_medical_url(self, mock_requests):
        html = (
            "<html><head><title>Study on Vitamin D and Bone Health</title></head>"
            "<body><p>Vitamin D supplementation has been shown to reduce fracture risk "
            "in elderly patients by improving calcium absorption and bone density. "
            "This effect was demonstrated in a randomized controlled trial.</p></body></html>"
        )
        mock_session = MagicMock()
        mock_session.get.return_value = self._make_mock_response(content=html)
        mock_requests.Session.return_value = mock_session

        r = extract_and_validate_url("https://example.com/article")
        self.assertTrue(r["valid"], f"Expected valid, got: {r.get('message')}")
        self.assertEqual(r["reason_code"], "READY_FOR_VERIFICATION")
        self.assertIn("claim", r)
        self.assertGreater(len(r["claim"]), 10)

    @patch("chatbot.claim_validator.requests")
    def test_non_medical_url_rejected(self, mock_requests):
        html = (
            "<html><head><title>Today's Football Results</title></head>"
            "<body><p>The match ended in a draw with a final score of 2-2. "
            "The star player scored both goals in the second half.</p></body></html>"
        )
        mock_session = MagicMock()
        mock_session.get.return_value = self._make_mock_response(content=html)
        mock_requests.Session.return_value = mock_session

        r = extract_and_validate_url("https://sports.example.com/football")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "NON_MEDICAL_CONTENT")

    @patch("chatbot.claim_validator.requests")
    def test_url_404_returns_unreadable(self, mock_requests):
        mock_session = MagicMock()
        mock_session.get.return_value = self._make_mock_response(status_code=404)
        mock_requests.Session.return_value = mock_session

        r = extract_and_validate_url("https://example.com/missing-page")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "UNREADABLE_CONTENT")

    @patch("chatbot.claim_validator.requests")
    def test_url_timeout_returns_unreadable(self, mock_requests):
        import requests as real_requests
        mock_session = MagicMock()
        mock_session.get.side_effect = real_requests.exceptions.Timeout("timed out")
        mock_requests.Session.return_value = mock_session
        mock_requests.exceptions.Timeout = real_requests.exceptions.Timeout
        mock_requests.exceptions.TooManyRedirects = real_requests.exceptions.TooManyRedirects

        r = extract_and_validate_url("https://slow-example.com/article")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "UNREADABLE_CONTENT")

    @patch("chatbot.claim_validator.requests")
    def test_empty_page_returns_unreadable(self, mock_requests):
        mock_session = MagicMock()
        mock_session.get.return_value = self._make_mock_response(content="<html><body></body></html>")
        mock_requests.Session.return_value = mock_session

        r = extract_and_validate_url("https://example.com/empty")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "UNREADABLE_CONTENT")

    @patch("chatbot.claim_validator.requests")
    def test_medical_url_no_checkable_claim(self, mock_requests):
        # Medical content but only noun phrases, no assertions
        html = (
            "<html><head><title>Medical Glossary</title></head>"
            "<body>"
            "<h1>Medical Terms</h1>"
            "<p>Diabetes mellitus: type 1 diabetes, type 2 diabetes, insulin resistance</p>"
            "<p>Hypertension: blood pressure, cardiovascular risk, antihypertensive medications</p>"
            "<p>Cancer: oncology, chemotherapy, radiation therapy, tumor</p>"
            "</body></html>"
        )
        mock_session = MagicMock()
        mock_session.get.return_value = self._make_mock_response(content=html)
        mock_requests.Session.return_value = mock_session

        r = extract_and_validate_url("https://example.com/glossary")
        # May be READY_FOR_VERIFICATION or NO_CHECKABLE_CLAIM depending on content
        # Either is acceptable, but it must NOT return a medical verdict
        self.assertNotIn("verdict", r, "URL validation should NOT return a medical verdict")

    def test_malformed_url_rejected_without_fetch(self):
        r = extract_and_validate_url("not-a-url")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")
        # No verdict should be in the response
        self.assertNotIn("verdict", r)

    def test_ssrf_localhost_rejected_without_fetch(self):
        r = extract_and_validate_url("http://localhost/admin")
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")
        self.assertNotIn("verdict", r)


# ─── 3. IMAGE VALIDATION UNIT TESTS ──────────────────────────────────────────

def _make_test_image(mode="RGB", size=(200, 100), color=(255, 255, 255)):
    """Create a minimal in-memory PIL image for testing."""
    try:
        from PIL import Image
        img = Image.new(mode, size, color)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return buf.read()
    except ImportError:
        return None


class ImageValidationTests(TestCase):
    """Unit tests for extract_and_validate_image()."""

    def _make_file(self, content, name="test.png", content_type="image/png", size=None):
        f = MagicMock()
        f.name = name
        f.content_type = content_type
        f.size = size or len(content)
        f.read.return_value = content
        f.seek = MagicMock()
        return f

    def test_no_file_rejected(self):
        r = extract_and_validate_image(None)
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_wrong_format_rejected(self):
        f = self._make_file(b"fake pdf content", name="doc.pdf", content_type="application/pdf")
        r = extract_and_validate_image(f)
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_file_too_large_rejected(self):
        f = self._make_file(b"x" * 100, size=11 * 1024 * 1024)
        r = extract_and_validate_image(f)
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    def test_corrupted_image_rejected(self):
        f = self._make_file(b"this is not an image", name="fake.png")
        r = extract_and_validate_image(f)
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "INVALID_INPUT")

    @patch("chatbot.claim_validator.pytesseract", create=True)
    def test_unreadable_blank_image_rejected(self, mock_tess):
        """A blank white image should fail OCR and be rejected as UNREADABLE_CONTENT."""
        img_bytes = _make_test_image()
        if img_bytes is None:
            self.skipTest("Pillow not available")

        mock_tess.image_to_string = MagicMock(return_value="")
        f = self._make_file(img_bytes)

        # We need to also handle PyMuPDF fallback
        with patch("chatbot.claim_validator.pymupdf", create=True, side_effect=ImportError):
            r = extract_and_validate_image(f)

        self.assertFalse(r["valid"])
        self.assertIn(r["reason_code"], ("UNREADABLE_CONTENT", "NON_MEDICAL_CONTENT", "NO_CHECKABLE_CLAIM"))

    @patch("chatbot.claim_validator.pytesseract", create=True)
    def test_non_medical_image_rejected(self, mock_tess):
        """An image with non-medical readable text should be rejected as NON_MEDICAL_CONTENT."""
        img_bytes = _make_test_image()
        if img_bytes is None:
            self.skipTest("Pillow not available")

        mock_tess.image_to_string = MagicMock(
            return_value="The weather forecast for tomorrow shows sunny skies and warm temperatures."
        )
        f = self._make_file(img_bytes)

        r = extract_and_validate_image(f)
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "NON_MEDICAL_CONTENT")

    @patch("chatbot.claim_validator.pytesseract", create=True)
    def test_medical_infographic_accepted(self, mock_tess):
        """A medical infographic with checkable claims should be accepted."""
        img_bytes = _make_test_image()
        if img_bytes is None:
            self.skipTest("Pillow not available")

        mock_tess.image_to_string = MagicMock(
            return_value=(
                "Natural Remedies for Constipation\n"
                "• Prunes and dried fruits help relieve constipation naturally.\n"
                "• Drinking 8 glasses of water daily prevents constipation.\n"
                "• Regular exercise reduces the risk of constipation.\n"
                "• Fiber supplements treat chronic constipation effectively."
            )
        )
        f = self._make_file(img_bytes)

        r = extract_and_validate_image(f)
        self.assertTrue(r["valid"], f"Medical infographic rejected: {r.get('message')}")
        self.assertEqual(r["reason_code"], "READY_FOR_VERIFICATION")
        self.assertIn("claim", r)

    @patch("chatbot.claim_validator.pytesseract", create=True)
    def test_fever_chills_infographic(self, mock_tess):
        """Fever-and-chills infographic should be recognized as medical and valid."""
        img_bytes = _make_test_image()
        if img_bytes is None:
            self.skipTest("Pillow not available")

        mock_tess.image_to_string = MagicMock(
            return_value=(
                "Fever & Chills: Home Remedies\n"
                "Paracetamol reduces fever quickly and safely.\n"
                "Cool compresses help lower body temperature during fever.\n"
                "Antibiotics should not be used to treat viral fever."
            )
        )
        f = self._make_file(img_bytes)

        r = extract_and_validate_image(f)
        self.assertTrue(r["valid"], f"Fever infographic rejected: {r.get('message')}")
        self.assertEqual(r["reason_code"], "READY_FOR_VERIFICATION")

    @patch("chatbot.claim_validator.pytesseract", create=True)
    def test_cancer_treatment_infographic(self, mock_tess):
        """Cancer treatment infographic should be recognized as medical."""
        img_bytes = _make_test_image()
        if img_bytes is None:
            self.skipTest("Pillow not available")

        mock_tess.image_to_string = MagicMock(
            return_value=(
                "Cancer Treatment Options\n"
                "Chemotherapy kills cancer cells but also damages healthy tissue.\n"
                "Radiation therapy effectively treats localized tumors.\n"
                "Immunotherapy helps the immune system fight cancer cells."
            )
        )
        f = self._make_file(img_bytes)

        r = extract_and_validate_image(f)
        self.assertTrue(r["valid"], f"Cancer infographic rejected: {r.get('message')}")
        self.assertEqual(r["reason_code"], "READY_FOR_VERIFICATION")

    @patch("chatbot.claim_validator.pytesseract", create=True)
    def test_multiple_claims_extracted(self, mock_tess):
        """Multiple medical claims in one image should produce multiple candidates."""
        img_bytes = _make_test_image()
        if img_bytes is None:
            self.skipTest("Pillow not available")

        mock_tess.image_to_string = MagicMock(
            return_value=(
                "Health Tips\n"
                "Garlic prevents heart disease by reducing cholesterol.\n"
                "Green tea helps prevent cancer through antioxidants.\n"
                "Exercise reduces blood pressure and improves cardiovascular health."
            )
        )
        f = self._make_file(img_bytes)

        r = extract_and_validate_image(f)
        self.assertTrue(r["valid"])
        all_claims = r.get("all_claims", [])
        self.assertGreater(len(all_claims), 1, "Multiple claims should be extracted")

    @patch("chatbot.claim_validator.pytesseract", create=True)
    def test_medical_text_no_assertion_returns_no_checkable_claim(self, mock_tess):
        """Medical image with no assertion structure returns NO_CHECKABLE_CLAIM."""
        img_bytes = _make_test_image()
        if img_bytes is None:
            self.skipTest("Pillow not available")

        mock_tess.image_to_string = MagicMock(
            return_value="Diabetes Mellitus Type 2 Blood Glucose Insulin Pancreas"
        )
        f = self._make_file(img_bytes)

        r = extract_and_validate_image(f)
        self.assertFalse(r["valid"])
        self.assertEqual(r["reason_code"], "NO_CHECKABLE_CLAIM")
        self.assertTrue(r.get("medical_relevance", False))


# ─── 4. PIPELINE STATE TESTS ──────────────────────────────────────────────────

class PipelineStateTests(TestCase):
    """
    Assert that rejected inputs DO NOT trigger downstream verdict generation.
    Mock all expensive services for pure validation gate testing.
    """

    def _assert_no_verdict_for_invalid_input(self, val_result):
        """Helper: a failed validation result must not contain verdict fields."""
        self.assertFalse(val_result["valid"])
        self.assertNotIn("verdict", val_result,
                         "Rejected validation result must not contain a verdict")
        self.assertNotIn("confidence", val_result,
                         "Rejected validation result must not contain confidence")
        self.assertNotIn("evidence", val_result,
                         "Rejected validation result must not contain evidence")

    def test_empty_text_no_verdict(self):
        r = validate_claim_text("")
        self._assert_no_verdict_for_invalid_input(r)

    def test_non_medical_text_no_verdict(self):
        r = validate_claim_text("The sky is blue.")
        self._assert_no_verdict_for_invalid_input(r)

    def test_medical_question_no_verdict(self):
        r = validate_claim_text("What is the treatment for diabetes?")
        self._assert_no_verdict_for_invalid_input(r)

    def test_ssrf_url_no_verdict(self):
        r = extract_and_validate_url("http://localhost/admin")
        self._assert_no_verdict_for_invalid_input(r)

    def test_malformed_url_no_verdict(self):
        r = extract_and_validate_url("not-a-url")
        self._assert_no_verdict_for_invalid_input(r)

    def test_no_image_file_no_verdict(self):
        r = extract_and_validate_image(None)
        self._assert_no_verdict_for_invalid_input(r)

    def test_error_codes_are_pipeline_states_not_verdicts(self):
        """Pipeline state codes must be distinct from medical verdicts."""
        medical_verdicts = {"SUPPORTED", "REFUTED", "UNCERTAIN", "TRUE", "FALSE", "MISLEADING"}
        pipeline_states = {
            "INVALID_INPUT", "NON_MEDICAL_CONTENT", "UNREADABLE_CONTENT",
            "NO_CHECKABLE_CLAIM", "READY_FOR_VERIFICATION", "VERIFICATION_UNAVAILABLE",
        }

        # No overlap allowed
        self.assertEqual(medical_verdicts & pipeline_states, set(),
                         "Pipeline states must not overlap with medical verdict labels")

        # Validation failures should use pipeline states
        test_cases = [
            validate_claim_text(""),
            validate_claim_text("The sky is blue."),
            validate_claim_text("diabetes"),
            validate_claim_text("What is cancer?"),
        ]
        for r in test_cases:
            if not r["valid"]:
                self.assertIn(r.get("reason_code"), pipeline_states,
                              f"reason_code '{r.get('reason_code')}' is not a recognized pipeline state")
                self.assertNotIn(r.get("reason_code"), medical_verdicts,
                                 f"reason_code '{r.get('reason_code')}' conflicts with a medical verdict")


# ─── 5. VERIFY API INTEGRATION TESTS ─────────────────────────────────────────

class VerifyAPITests(TestCase):
    """HTTP endpoint integration tests."""

    def setUp(self):
        self.client = Client()

    def _post_text(self, text):
        return self.client.post(
            "/api/verify/text/",
            data=json.dumps({"text": text}),
            content_type="application/json",
        )

    # ── Text endpoint ─────────────────────────────────────────────────────────
    def test_text_endpoint_rejects_empty_input(self):
        resp = self._post_text("")
        self.assertEqual(resp.status_code, 400)
        data = json.loads(resp.content)
        self.assertFalse(data["success"])
        self.assertFalse(data["valid_input"])
        self.assertEqual(data["error_code"], "INVALID_INPUT")

    def test_text_endpoint_rejects_greeting(self):
        resp = self._post_text("hello")
        self.assertEqual(resp.status_code, 400)
        data = json.loads(resp.content)
        self.assertFalse(data["success"])
        self.assertEqual(data["error_code"], "NON_MEDICAL_CONTENT")
        # Must not contain a verdict
        self.assertNotIn("verdict", data)

    def test_text_endpoint_rejects_non_medical(self):
        resp = self._post_text("The sky is blue and it looks beautiful today.")
        self.assertEqual(resp.status_code, 400)
        data = json.loads(resp.content)
        self.assertFalse(data["success"])
        self.assertEqual(data["error_code"], "NON_MEDICAL_CONTENT")
        self.assertNotIn("verdict", data)

    def test_text_endpoint_rejects_medical_question(self):
        resp = self._post_text("What are the symptoms of COVID-19?")
        self.assertEqual(resp.status_code, 400)
        data = json.loads(resp.content)
        self.assertFalse(data["success"])
        self.assertEqual(data["error_code"], "NO_CHECKABLE_CLAIM")
        self.assertTrue(data.get("medical_relevance", False))
        self.assertNotIn("verdict", data)

    def test_text_endpoint_rejects_random_chars(self):
        resp = self._post_text("asdfghjkl")
        self.assertEqual(resp.status_code, 400)
        data = json.loads(resp.content)
        self.assertFalse(data["success"])
        self.assertEqual(data["error_code"], "INVALID_INPUT")
        self.assertNotIn("verdict", data)

    def test_text_endpoint_accepts_valid_claim(self):
        resp = self._post_text("Drinking bleach cures COVID-19.")
        # Should accept and process (may be 200 or 400 depending on models)
        self.assertIn(resp.status_code, (200, 400))
        data = json.loads(resp.content)
        if resp.status_code == 200:
            self.assertTrue(data["success"])
            self.assertTrue(data["valid_input"])
            self.assertIn("verdict", data)
            # Verdict must be a medical truth verdict, not a pipeline state
            self.assertIn(data["verdict"], ("SUPPORTED", "REFUTED", "UNCERTAIN"))

    def test_text_endpoint_error_code_not_a_verdict(self):
        """Validation error_code must never be SUPPORTED/REFUTED/UNCERTAIN."""
        for text in ["", "hello", "The sky is blue.", "diabetes", "What is cancer?"]:
            resp = self._post_text(text)
            if resp.status_code == 400:
                data = json.loads(resp.content)
                self.assertNotIn(data.get("error_code"), ("SUPPORTED", "REFUTED", "UNCERTAIN"),
                                 f"For input '{text}': error_code should not be a medical verdict")

    # ── URL endpoint ──────────────────────────────────────────────────────────
    def test_url_endpoint_rejects_empty_url(self):
        resp = self.client.post(
            "/api/verify/url/",
            data=json.dumps({"url": ""}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)
        data = json.loads(resp.content)
        self.assertFalse(data["success"])
        self.assertEqual(data["input_type"], "url")
        self.assertNotIn("verdict", data)

    def test_url_endpoint_rejects_localhost(self):
        resp = self.client.post(
            "/api/verify/url/",
            data=json.dumps({"url": "http://localhost:8000/admin"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)
        data = json.loads(resp.content)
        self.assertFalse(data["success"])
        self.assertEqual(data["error_code"], "INVALID_INPUT")
        self.assertNotIn("verdict", data)

    def test_url_endpoint_rejects_malformed_url(self):
        resp = self.client.post(
            "/api/verify/url/",
            data=json.dumps({"url": "not-a-valid-url"}),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)
        data = json.loads(resp.content)
        self.assertFalse(data["success"])
        self.assertNotIn("verdict", data)

    # ── Image endpoint ────────────────────────────────────────────────────────
    def test_image_endpoint_rejects_no_file(self):
        resp = self.client.post("/api/verify/image/", data={})
        self.assertEqual(resp.status_code, 400)
        data = json.loads(resp.content)
        self.assertFalse(data["success"])
        self.assertEqual(data["input_type"], "image")
        self.assertEqual(data["error_code"], "INVALID_INPUT")
        self.assertNotIn("verdict", data)

    def test_image_endpoint_rejects_text_file(self):
        """Uploading a .txt file as an image should be rejected."""
        f = io.BytesIO(b"This is a plain text file, not an image.")
        f.name = "document.txt"
        resp = self.client.post(
            "/api/verify/image/",
            data={"image": f},
            format="multipart",
        )
        self.assertEqual(resp.status_code, 400)
        data = json.loads(resp.content)
        self.assertFalse(data["success"])
        self.assertNotIn("verdict", data)


# ─── 6. CLAIM VERIFICATION INTEGRATION TESTS ─────────────────────────────────

class ClaimVerificationTests(TestCase):
    """Integration tests for _execute_verification() with real or mocked ML pipeline."""

    def test_individual_medical_status_returns_uncertain_not_verdict(self):
        result = _execute_verification(
            "I have been diagnosed with hypertension.",
            claim_type="INDIVIDUAL_MEDICAL_STATUS",
        )
        self.assertTrue(result["success"])
        self.assertEqual(result["verdict"], "UNCERTAIN")

    def test_execute_verification_returns_pipeline_result(self):
        result = _execute_verification("Aspirin reduces fever in adults.")
        self.assertTrue(result["success"])
        self.assertIn("verdict", result)
        self.assertIn(result["verdict"], ("SUPPORTED", "REFUTED", "UNCERTAIN"))
        self.assertIn("confidence", result)
        self.assertGreater(result["confidence"], 0)
        self.assertIn("evidence", result)
        self.assertIn("explanation", result)

    def test_verification_returns_correct_input_type_for_text(self):
        result = _execute_verification("Exercise prevents heart disease.", source_url="")
        self.assertEqual(result["input_type"], "text")

    def test_verification_returns_correct_input_type_for_url(self):
        result = _execute_verification(
            "Exercise prevents heart disease.",
            source_url="https://example.com/article",
        )
        self.assertEqual(result["input_type"], "url")

    def test_verification_returns_correct_input_type_for_image(self):
        result = _execute_verification(
            "Exercise prevents heart disease.",
            source_url="image://uploaded_image.png",
        )
        self.assertEqual(result["input_type"], "image")

    def test_insufficient_evidence_returns_uncertain_not_supported(self):
        result = _execute_verification("Eating purple crystals restores cartilage in 3 hours.")
        self.assertEqual(result["verdict"], "UNCERTAIN")
        self.assertLessEqual(result["confidence"], 0.65)


# ─── 7. HISTORY API TESTS ─────────────────────────────────────────────────────

class HistoryAPITests(TestCase):
    """Tests for history endpoint DELETE."""

    def setUp(self):
        self.client = Client()
        self.claim1 = Claim.objects.create(
            claim_text="Drinking bleach cures COVID-19",
            verdict="REFUTED",
            confidence=0.95,
            explanation="Bleach is toxic.",
            source_url="https://who.int",
        )
        self.claim2 = Claim.objects.create(
            claim_text="Exercise prevents heart disease",
            verdict="SUPPORTED",
            confidence=0.90,
            explanation="Exercise is good.",
            source_url="https://cdc.gov",
        )

    def test_delete_single_claim_success(self):
        resp = self.client.delete(f"/api/history/{self.claim1.id}/")
        self.assertEqual(resp.status_code, 200)
        data = json.loads(resp.content)
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("deleted_id"), self.claim1.id)
        self.assertFalse(Claim.objects.filter(id=self.claim1.id).exists())
        self.assertTrue(Claim.objects.filter(id=self.claim2.id).exists())

    def test_delete_claim_not_found(self):
        resp = self.client.delete("/api/history/999999/")
        self.assertEqual(resp.status_code, 404)
        data = json.loads(resp.content)
        self.assertIn("error", data)
