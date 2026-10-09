"""
claim_validator.py
==================
Centralized validation and domain-relevance engine for MedVerify AI.

Pipeline States (used in reason_code / error_code):
  INVALID_INPUT         – malformed, empty, or unsupported input
  NON_MEDICAL_CONTENT   – valid content unrelated to medicine or health
  UNREADABLE_CONTENT    – image text / webpage content cannot be reliably extracted
  NO_CHECKABLE_CLAIM    – medical content exists but no meaningful assertion can be verified
  READY_FOR_VERIFICATION – valid medical claim ready for evidence assessment
  VERIFICATION_UNAVAILABLE – verification could not complete (service/system failure)

These are PIPELINE STATES, not medical truth verdicts.
Keep them separate from SUPPORTED, REFUTED, and UNCERTAIN.

Validates:
1. Syntax and linguistic quality (rejects gibberish, keyboard mashing, numbers, emojis)
2. Medical domain relevance (multi-layered ontology and health claim patterns)
3. Claim vs Question / Casual Request classification
4. URL safety, SSRF protection (including redirect-time IP check), article extraction
5. Image format, size, OCR text extraction with preprocessing, and medical relevance
"""

import re
import ipaddress
import socket
import urllib.parse
from typing import Dict, Any, Optional

import requests

try:
    import pytesseract
except ImportError:
    pytesseract = None

try:
    import pymupdf
except ImportError:
    pymupdf = None


# ─── 1. COMPREHENSIVE MEDICAL VOCABULARY & STEMS ──────────────────────────────

MEDICAL_ONTOLOGY = {
    # Conditions, Diseases & Pathologies
    "diabetes", "diabetic", "cancer", "carcinoma", "tumor", "tumour", "oncology",
    "hypertension", "hypotension", "stroke", "infarction", "cardiovascular", "cardiac",
    "arrhythmia", "atherosclerosis", "cholesterol", "covid", "covid-19", "coronavirus",
    "sars-cov-2", "influenza", "flu", "pneumonia", "asthma", "bronchitis", "copd",
    "tuberculosis", "hepatitis", "cirrhosis", "hiv", "aids", "malaria", "dengue",
    "cholera", "typhoid", "sepsis", "infection", "infectious", "bacterial", "viral",
    "fungal", "parasitic", "alzheimer", "dementia", "parkinson", "epilepsy", "seizure",
    "multiple sclerosis", "arthritis", "rheumatoid", "osteoarthritis", "osteoporosis",
    "depression", "anxiety", "bipolar", "schizophrenia", "autism", "adhd", "neuropathy",
    "eczema", "psoriasis", "dermatitis", "ulcer", "gastritis", "colitis", "crohn",
    "anemia", "leukemia", "lymphoma", "melanoma", "glaucoma", "cataract", "migraine",
    "obesity", "metabolic syndrome", "insomnia", "apnea", "fever", "pyrexia",
    "constipation", "diarrhea", "diarrhoea",

    # Symptoms & Clinical Signs
    "symptom", "symptoms", "pain", "fatigue", "nausea", "vomiting",
    "cough", "coughing", "dyspnea", "shortness of breath",
    "wheezing", "rash", "edema", "swelling", "inflammation", "inflammatory",
    "dizziness", "vertigo", "syncope", "fainting", "headache", "chest pain",
    "hypoglycemia", "hyperglycemia", "palpitation", "chills", "congestion",

    # Anatomy, Organ Systems & Physiology
    "heart", "cardio", "lung", "pulmonary", "kidney", "renal", "liver", "hepatic",
    "brain", "cerebral", "stomach", "gastric", "gut", "intestinal", "colon",
    "pancreas", "pancreatic", "thyroid", "adrenal", "vascular", "vein", "artery",
    "blood", "blood pressure", "blood sugar", "glucose", "insulin", "hemoglobin",
    "immune", "immunity", "immunization", "antibody", "antibodies", "antigen",
    "t-cell", "b-cell", "lymph", "hormone", "hormones", "dna", "rna", "gene",
    "genetic", "mutation", "cellular", "tissue", "organ", "bone", "joint",

    # Interventions, Pharmacology, Treatments & Healthcare
    "medicine", "medication", "drug", "drugs", "pharmaceutical", "antibiotic",
    "antibiotics", "antiviral", "antivirals", "antifungal", "vaccine", "vaccines",
    "vaccination", "vaccinated", "immunize", "immunized", "dose", "dosage",
    "therapy", "therapies", "therapeutic", "chemotherapy", "radiation", "surgery",
    "surgical", "treatment", "treatments", "treat", "cure", "cures", "curing",
    "heal", "healing", "remedy", "remedies", "prescription", "otc", "over-the-counter",
    "paracetamol", "acetaminophen", "ibuprofen", "aspirin", "statin", "metformin",
    "steroid", "corticosteroid", "antibacterial", "antiseptic", "disinfectant",
    "clinical", "trial", "trials", "placebo", "doctor", "physician", "hospital",
    "patient", "healthcare", "pediatric", "geriatric", "diagnosis", "diagnostic",
    "prognosis", "screening", "biopsy", "mri", "ct scan", "x-ray", "ultrasound",

    # Nutrition & Lifestyle when linked to Health
    "diet", "nutrition", "nutrient", "vitamin", "vitamins", "vitamin c", "vitamin d",
    "vitamin b", "mineral", "supplement", "supplements", "antioxidant", "fasting",
    "exercise", "physical activity", "cardio workout", "metabolism", "hydration",
    "calorie", "protein", "carbohydrate", "fatty acid", "omega-3", "turmeric",
    "curcumin", "ginger", "garlic", "green tea", "lemon water", "apple cider vinegar",
    "herbal", "homeopathy", "ayurveda", "naturopathy", "detox", "cleanse",

    # Public Health & Authoritative Bodies
    "who", "world health organization", "cdc", "icmr", "nih", "fda", "nhs",
    "cochrane", "pubmed", "epidemic", "pandemic", "morbidity", "mortality",
    "transmission", "prevent", "prevention", "preventative", "preventive",
}

# Misinformation & health-claim predicate patterns
HEALTH_CLAIM_PATTERNS = [
    r"\bcures?\b",
    r"\bheals?\b",
    r"\bprevents?\b",
    r"\btreats?\b",
    r"\bcauses?\b",
    r"\bleads?\s+to\b",
    r"\breduces?\s+risk\b",
    r"\bincreases?\s+risk\b",
    r"\bburns?\s+fat\b",
    r"\bboosts?\s+immunit\w*\b",
    r"\bmiracle\s+(cure|remedy|treatment)\b",
    r"\binstant(ly)?\s+cures?\b",
    r"\beffective\s+against\b",
    r"\bprotects?\s+against\b",
    r"\bsafe\s+and\s+effective\b",
    r"\blinked\s+to\b",
    r"\bassociated\s+with\b",
    r"\bfights?\s+off\b",
]

# Assertion structure patterns (claim must have a verb/predicate)
ASSERTION_INDICATORS = [
    r"\b(is|are|was|were|can|cannot|could|will|would|may|might|should|has|have|had)\b",
    r"\b(causes?|prevents?|cures?|treats?|reduces?|increases?|lowers?|raises?|helps?|improves?|damages?|worsens?)\b",
    r"\b(effective|harmful|safe|dangerous|toxic|good|bad|proven|linked|associated)\b",
]

# Obvious non-medical domain keywords to immediately reject
NON_MEDICAL_KEYWORDS = {
    "python", "javascript", "react", "django", "html", "css", "sql", "git",
    "programming", "software", "code", "coding", "algorithm", "compiler",
    "cricket", "football", "soccer", "basketball", "tennis", "ipl", "fifa",
    "movie", "cinema", "actor", "actress", "hollywood", "bollywood", "netflix",
    "bitcoin", "crypto", "stock market", "nasdaq", "forex", "trading",
    "joke", "recipe", "pizza", "burger", "fashion", "dress",
    "weather", "sunny", "rainy", "cloudy", "forecast",
    "politics", "election", "president", "minister", "parliament", "democrat", "republican",
    "mathematics", "physics", "chemistry", "history", "geography",
}

# Non-medical statement detection: definite non-medical topics with no health linkage
NON_MEDICAL_TOPIC_PATTERNS = [
    r"^the\s+sky\s+is\b",
    r"^(the\s+)?(sun|moon|stars?|planet|earth|ocean|sea|mountain|river)\s+(is|are|shines|rises|sets)\b",
    r"^(today|tomorrow|yesterday)\s+(is|will\s+be|was)\s+(a\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|holiday|weekend)\b",
    r"^\d+\s*(plus|\+|minus|-|times|\*|divided\s+by|=)\s*\d+\b",
    r"^(my\s+)?(cat|dog|pet|parrot|bird|fish)\s+(is|are|has|loves?)\b",
    r"^(i\s+)?(love|like|hate|enjoy|prefer)\s+(music|movies?|food|pizza|cricket|sports?|games?)\b",
    r"^(the\s+)?(capital\s+of|president\s+of|prime\s+minister\s+of|population\s+of)\b",
]

# Gibberish keyboard-mashing sub-patterns
KEYBOARD_MASH_PATTERNS = [
    r"^[asdfghjkl]{3,}$",
    r"^[qwertyuiop]{3,}$",
    r"^[zxcvbnm]{3,}$",
    r"^(.)\\1{2,}$",          # repeated char: aaaa, xxx, 1111
    r"^[0-9\W_]+$",          # no alphabetic letters at all
]

# Navigation chrome & menu text
NAV_CHROME_TERMS = {
    "menu", "navigation", "nav", "skip to main content", "skip to content",
    "login", "log in", "sign in", "sign up", "register", "my account", "account",
    "cart", "checkout", "shopping cart", "contact us", "about us",
    "privacy policy", "terms of service", "terms of use", "cookie policy",
    "all rights reserved", "copyright", "sitemap", "site map", "footer",
    "header", "breadcrumbs", "home page", "search this site", "subscribe",
    "newsletter", "categories", "back to top", "find a doctor",
}


# ─── 2. TEXT VALIDATION ───────────────────────────────────────────────────────

def validate_claim_text(text: Optional[str]) -> Dict[str, Any]:
    """
    Validates user text submission.

    Returns a dict with:
      valid         : bool
      clean_text    : str (on success)
      input_type    : "text"
      medical_relevance : bool
      claim_type    : str (on success)
      reason_code   : pipeline state string (on failure)
      message       : human-readable explanation (on failure)
    """
    if text is None:
        return {
            "valid": False,
            "input_type": "text",
            "medical_relevance": False,
            "reason_code": "INVALID_INPUT",
            "message": "Please enter a claim to verify.",
        }

    cleaned = text.strip()

    # A. Empty / too short
    if len(cleaned) == 0:
        return {
            "valid": False,
            "input_type": "text",
            "medical_relevance": False,
            "reason_code": "INVALID_INPUT",
            "message": "Please enter a meaningful medical or health-related claim.",
        }

    if len(cleaned) < 4:
        return {
            "valid": False,
            "input_type": "text",
            "medical_relevance": False,
            "reason_code": "INVALID_INPUT",
            "message": "Please enter a meaningful medical or health-related claim (at least a few words).",
        }

    lower_text = cleaned.lower()

    # B. Punctuation, symbols, emojis, or numbers only — no real alphabetic words
    words = re.findall(r"\b[a-zA-Z]{2,}\b", lower_text)
    if not words:
        return {
            "valid": False,
            "input_type": "text",
            "medical_relevance": False,
            "reason_code": "INVALID_INPUT",
            "message": "Please enter a meaningful medical or health-related claim using words.",
        }

    # C. Repeated characters and keyboard mashing
    clean_alpha = re.sub(r"[^a-zA-Z]", "", lower_text)
    for pat in KEYBOARD_MASH_PATTERNS:
        if re.match(pat, clean_alpha):
            return {
                "valid": False,
                "input_type": "text",
                "medical_relevance": False,
                "reason_code": "INVALID_INPUT",
                "message": "Input appears to be random characters. Please enter a meaningful medical or health-related claim.",
            }

    # D. Common non-claim trivial greetings / casual phrases
    greeting_patterns = [
        r"^(hi|hello|hey|greetings|howdy|welcome)(\b.*)?$",
        r"^good\s+(morning|afternoon|evening|night|day)(\b.*)?$",
        r"^how\s+are\s+you(\b.*)?$",
        r"^what('s|\s+is)\s+up(\b.*)?$",
        r"^who\s+are\s+you(\b.*)?$",
        r"^(tell\s+me\s+a\s+joke|make\s+me\s+laugh|say\s+something\s+funny)\b",
        r"^why\s+did\s+the\s+.*cross\s+the\s+road\b",
        r"^knock\s+knock\b",
        r"^(testing|test|test\s+123|abc|xyz|qwerty|asdf)$",
    ]
    if any(re.match(gp, lower_text) for gp in greeting_patterns):
        return {
            "valid": False,
            "input_type": "text",
            "medical_relevance": False,
            "reason_code": "NON_MEDICAL_CONTENT",
            "message": "This appears to be a greeting or casual phrase. Please enter a medical or health-related claim to verify.",
        }

    # E. Website navigation chrome & menu text detection
    nav_hits = [term for term in NAV_CHROME_TERMS if term in lower_text]
    if nav_hits:
        has_claim_verb = any(re.search(pat, lower_text) for pat in HEALTH_CLAIM_PATTERNS)
        strong_chrome = any(term in lower_text for term in [
            "skip to main content", "privacy policy", "terms of service", "all rights reserved",
        ])
        if not has_claim_verb or len(nav_hits) >= 2 or strong_chrome:
            return {
                "valid": False,
                "input_type": "text",
                "medical_relevance": False,
                "reason_code": "NON_MEDICAL_CONTENT",
                "message": "This input appears to be website navigation text or menu items rather than a verifiable medical claim.",
            }

    # F. Detect obvious non-medical topic patterns (definite non-medical statements)
    for pat in NON_MEDICAL_TOPIC_PATTERNS:
        if re.match(pat, lower_text):
            return {
                "valid": False,
                "input_type": "text",
                "medical_relevance": False,
                "reason_code": "NON_MEDICAL_CONTENT",
                "message": "This doesn't appear to be a medical or health-related claim. Please enter a medical claim for verification.",
            }

    # G. Detect obvious non-medical domain keywords (programming, sports, cinema, etc.)
    for nm_kw in NON_MEDICAL_KEYWORDS:
        if re.search(r"\b" + re.escape(nm_kw) + r"\b", lower_text):
            # Only reject if there is no overriding medical context
            med_hits = [m for m in MEDICAL_ONTOLOGY if re.search(r"\b" + re.escape(m) + r"\b", lower_text)]
            if not med_hits:
                return {
                    "valid": False,
                    "input_type": "text",
                    "medical_relevance": False,
                    "reason_code": "NON_MEDICAL_CONTENT",
                    "message": "This doesn't appear to be a medical or health-related claim.",
                }

    # H. Check for Question vs Declarative Claim
    info_seeking_patterns = [
        r"^what\s+(is|are)\s+(the\s+)?(symptom|symptoms|cause|causes|sign|signs|treatment|treatments)\b",
        r"^what\s+(is|are)\b",
        r"^how\s+(do|does|can|to)\b",
        r"^tell\s+me\s+about\b",
        r"^explain\b",
    ]
    for q_pat in info_seeking_patterns:
        if re.search(q_pat, lower_text):
            return {
                "valid": False,
                "input_type": "text",
                "medical_relevance": True,
                "reason_code": "NO_CHECKABLE_CLAIM",
                "message": "This appears to be a medical question rather than a specific claim. Please enter a medical claim you want to verify (e.g., 'Vitamin C prevents colds').",
            }

    # I. Medical Domain Relevance Check
    matched_medical_terms = [
        term for term in MEDICAL_ONTOLOGY
        if re.search(r"\b" + re.escape(term) + r"\b", lower_text)
    ]

    has_health_predicate = any(re.search(pat, lower_text) for pat in HEALTH_CLAIM_PATTERNS)

    # If no medical terms and no health predicate — this is not medical
    if not matched_medical_terms and not has_health_predicate:
        return {
            "valid": False,
            "input_type": "text",
            "medical_relevance": False,
            "reason_code": "NON_MEDICAL_CONTENT",
            "message": "This doesn't appear to be a medical or health-related claim. Please enter a health claim for verification.",
        }

    # J. Check for meaningful assertion structure
    has_assertion_structure = (
        any(re.search(pat, lower_text) for pat in ASSERTION_INDICATORS)
        or has_health_predicate
    )

    # Single vague medical term(s) with no assertion
    if len(words) <= 2 and matched_medical_terms and not has_assertion_structure:
        return {
            "valid": False,
            "input_type": "text",
            "medical_relevance": True,
            "reason_code": "NO_CHECKABLE_CLAIM",
            "message": f"'{cleaned}' is a medical topic, not a verifiable claim. Please provide a full assertion "
                       f"(e.g., '{cleaned.capitalize()} can be treated with antibiotics').",
        }

    # Medical terms without any assertion structure (keyword list, not a claim)
    if not has_assertion_structure and len(words) >= 3:
        return {
            "valid": False,
            "input_type": "text",
            "medical_relevance": True,
            "reason_code": "NO_CHECKABLE_CLAIM",
            "message": "Please enter a complete medical claim describing a verifiable assertion (e.g., 'Aspirin reduces fever').",
        }

    # K. Minimum word count
    if len(words) < 3:
        return {
            "valid": False,
            "input_type": "text",
            "medical_relevance": True,
            "reason_code": "NO_CHECKABLE_CLAIM",
            "message": "Please enter a complete claim (at least 3 words) describing a medical assertion to verify.",
        }

    # Determine claim type
    claim_type = "Medical Assertion"

    individual_status_patterns = [
        r"\b(i have|i've got|he has|she has|my [a-zA-Z]+ has)\b\s+([a-zA-Z\s]+)?",
        r"\b(my|his|her)\b\s+(blood pressure|sugar|heart rate|cholesterol)\s+(is|was|has been)\b",
        r"\b(diagnosed with|suffering from)\b",
        r"^[a-zA-Z]+ has (diabetes|cancer|covid|hypertension|asthma)\b",
    ]
    if any(re.search(pat, lower_text) for pat in individual_status_patterns):
        claim_type = "INDIVIDUAL_MEDICAL_STATUS"
    elif any(t in matched_medical_terms for t in ["cure", "cures", "treat", "treatment", "paracetamol", "antibiotic", "statin"]):
        claim_type = "Treatment / Medication Claim"
    elif any(t in matched_medical_terms for t in ["prevent", "prevention", "vaccine", "vaccines", "vaccination", "immunity"]):
        claim_type = "Prevention / Vaccine Claim"
    elif any(t in matched_medical_terms for t in ["diet", "food", "tea", "water", "garlic", "lemon", "sugar", "fat"]):
        claim_type = "Nutrition & Lifestyle Claim"
    elif any(t in matched_medical_terms for t in ["cancer", "diabetes", "hypertension", "covid", "heart"]):
        claim_type = "Disease & Pathology Claim"

    return {
        "valid": True,
        "clean_text": cleaned,
        "input_type": "text",
        "medical_relevance": True,
        "claim_type": claim_type,
        "matched_terms": matched_medical_terms[:5],
        "reason_code": "READY_FOR_VERIFICATION",
        "message": None,
    }


# ─── 3. URL VALIDATION & EXTRACTION ───────────────────────────────────────────

BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),   # Link-local / AWS metadata
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]

# Blocked hostnames
BLOCKED_HOSTNAMES = {
    "localhost", "127.0.0.1", "0.0.0.0", "::1",
    "metadata.google.internal",  # GCP metadata
    "169.254.169.254",           # AWS metadata
}


def _is_blocked_host(hostname: str) -> bool:
    """Return True if hostname resolves to a private/loopback network."""
    if hostname.lower() in BLOCKED_HOSTNAMES:
        return True
    try:
        ip_obj = ipaddress.ip_address(hostname)
        return any(ip_obj in net for net in BLOCKED_IP_NETWORKS)
    except ValueError:
        pass  # Not a raw IP; try DNS resolution
    try:
        resolved_ip = socket.gethostbyname(hostname)
        ip_obj = ipaddress.ip_address(resolved_ip)
        return any(ip_obj in net for net in BLOCKED_IP_NETWORKS)
    except Exception:
        pass
    return False


def validate_url_syntax(url_str: Optional[str]) -> Dict[str, Any]:
    """Checks URL syntax, protocol, and SSRF restrictions."""
    if not url_str or not url_str.strip():
        return {
            "valid": False,
            "reason_code": "INVALID_INPUT",
            "message": "Please enter a valid webpage URL.",
        }

    raw = url_str.strip()

    # Prepend https:// if user entered plain domain like www.who.int
    if not raw.startswith("http://") and not raw.startswith("https://"):
        if re.match(r"^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$", raw):
            raw = "https://" + raw
        else:
            return {
                "valid": False,
                "reason_code": "INVALID_INPUT",
                "message": "Invalid URL. Please enter a valid webpage URL (e.g., https://example.com/article).",
            }

    try:
        parsed = urllib.parse.urlparse(raw)
    except Exception:
        return {
            "valid": False,
            "reason_code": "INVALID_INPUT",
            "message": "Invalid URL structure.",
        }

    if parsed.scheme not in ("http", "https"):
        return {
            "valid": False,
            "reason_code": "INVALID_INPUT",
            "message": "Only HTTP and HTTPS URLs are supported.",
        }

    hostname = (parsed.hostname or "").lower()
    if not hostname or "." not in hostname:
        return {
            "valid": False,
            "reason_code": "INVALID_INPUT",
            "message": "Please provide a valid webpage hostname (e.g., who.int).",
        }

    # SSRF Protection: Disallow localhost, loopback, and private networks
    if _is_blocked_host(hostname):
        return {
            "valid": False,
            "reason_code": "INVALID_INPUT",
            "message": "Access to local or private network addresses is prohibited for security reasons.",
        }

    return {
        "valid": True,
        "clean_url": raw,
        "hostname": hostname,
    }


def _validate_redirect_url(redirect_url: str) -> bool:
    """Validate a redirect destination doesn't lead to a private network."""
    try:
        parsed = urllib.parse.urlparse(redirect_url)
        hostname = (parsed.hostname or "").lower()
        if not hostname:
            return False
        if parsed.scheme not in ("http", "https"):
            return False
        return not _is_blocked_host(hostname)
    except Exception:
        return False


def extract_and_validate_url(url_str: str) -> Dict[str, Any]:
    """
    Fetches URL content safely, extracts title and main text,
    and validates medical domain relevance.

    Returns one of:
      INVALID_INPUT          – bad URL syntax or SSRF target
      NON_MEDICAL_CONTENT    – URL accessible but content is not health-related
      UNREADABLE_CONTENT     – page accessible but content cannot be extracted
      NO_CHECKABLE_CLAIM     – medical content found but no verifiable assertion identified
      READY_FOR_VERIFICATION – claim extracted, pipeline may proceed
    """
    url_check = validate_url_syntax(url_str)
    if not url_check["valid"]:
        return url_check

    clean_url = url_check["clean_url"]
    hostname = url_check["hostname"]

    # Reject known non-medical aggregators (root/home/search pages)
    known_general_domains = {
        "youtube.com", "m.youtube.com", "espn.com", "amazon.com", "amazon.in",
        "instagram.com", "facebook.com", "x.com", "twitter.com", "reddit.com",
        "github.com", "netflix.com", "ebay.com", "linkedin.com",
    }
    if any(hostname == d or hostname.endswith("." + d) for d in known_general_domains):
        path = urllib.parse.urlparse(clean_url).path.strip("/")
        if not path or path in ("watch", "search", "trending"):
            return {
                "valid": False,
                "reason_code": "NON_MEDICAL_CONTENT",
                "message": (
                    f"This website ({hostname}) does not appear to contain medical or "
                    "health-related information. Please provide a URL with a medical or health claim."
                ),
            }

    try:
        headers = {
            "User-Agent": (
                "MedVerify-AI-Bot/1.0 (+https://medverify.ai; Medical Fact Checking Engine)"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }

        # Use a session to track and validate redirects
        session = requests.Session()

        def check_redirect(resp, *args, **kwargs):
            if resp.is_redirect:
                next_url = resp.headers.get("Location", "")
                if next_url and not _validate_redirect_url(next_url):
                    raise ValueError(f"Unsafe redirect to: {next_url}")

        session.hooks["response"].append(check_redirect)

        resp = session.get(
            clean_url,
            headers=headers,
            timeout=10,
            stream=True,
            allow_redirects=True,
            max_redirects=5,
        )

        # Update clean_url to the final resolved URL after redirects
        final_url = resp.url

        if resp.status_code >= 400:
            return {
                "valid": False,
                "reason_code": "UNREADABLE_CONTENT",
                "message": (
                    f"Could not reach webpage (HTTP status {resp.status_code}). "
                    "Please check the link or try a different source."
                ),
            }

        # Content-type safety check
        content_type = resp.headers.get("Content-Type", "").lower()
        if not any(ct in content_type for ct in ("text/html", "application/xhtml", "text/plain")):
            return {
                "valid": False,
                "reason_code": "UNREADABLE_CONTENT",
                "message": (
                    "This URL does not point to a readable webpage "
                    f"(content type: {content_type or 'unknown'}). "
                    "Please provide a URL to an HTML article."
                ),
            }

        # Read at most 3 MB
        content_bytes = resp.raw.read(3 * 1024 * 1024)
        html_text = content_bytes.decode(resp.encoding or "utf-8", errors="replace")

    except ValueError as redirect_err:
        return {
            "valid": False,
            "reason_code": "INVALID_INPUT",
            "message": f"Unsafe redirect detected: {str(redirect_err)}",
        }
    except requests.exceptions.Timeout:
        return {
            "valid": False,
            "reason_code": "UNREADABLE_CONTENT",
            "message": "Webpage request timed out. Please try a different source or enter the text directly.",
        }
    except requests.exceptions.TooManyRedirects:
        return {
            "valid": False,
            "reason_code": "UNREADABLE_CONTENT",
            "message": "Too many redirects. Please check the link or try a different source.",
        }
    except Exception as e:
        return {
            "valid": False,
            "reason_code": "UNREADABLE_CONTENT",
            "message": f"Unable to fetch URL: {str(e)}",
        }

    # ── Extract text from HTML ──
    title = ""
    paragraphs = []
    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html_text, "html.parser")

        # Strip navigation chrome, scripts, styles
        for s in soup(["script", "style", "nav", "footer", "header", "aside", "noscript", "form"]):
            s.decompose()

        if soup.title and soup.title.string:
            title = soup.title.string.strip()

        # Also look for Open Graph / meta title
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            title = og_title["content"].strip() or title

        # Gather meaningful text from body paragraphs and headings
        for tag in soup.find_all(["p", "h1", "h2", "h3", "h4", "li"]):
            text = tag.get_text(separator=" ").strip()
            if len(text) > 30:
                paragraphs.append(text)

    except Exception:
        # Regex fallback
        m_title = re.search(r"<title>(.*?)</title>", html_text, re.IGNORECASE | re.DOTALL)
        if m_title:
            title = m_title.group(1).strip()
        body_clean = re.sub(
            r"<(script|style|nav|footer)[^>]*>.*?</\1>",
            " ", html_text, flags=re.DOTALL | re.IGNORECASE
        )
        p_matches = re.findall(r"<p[^>]*>(.*?)</p>", body_clean, flags=re.DOTALL | re.IGNORECASE)
        for p in p_matches:
            c = re.sub(r"<[^>]+>", " ", p).strip()
            if len(c) > 30:
                paragraphs.append(c)

    full_extracted = " ".join(([title] if title else []) + paragraphs[:20])
    full_extracted = re.sub(r"\s+", " ", full_extracted).strip()

    if len(full_extracted) < 80:
        return {
            "valid": False,
            "reason_code": "UNREADABLE_CONTENT",
            "message": (
                "We couldn't extract meaningful readable content from this webpage. "
                "This may be a JavaScript-rendered page or a paywall-protected article. "
                "Please paste the claim text directly."
            ),
        }

    # ── Medical Relevance Check ──
    lower_content = full_extracted.lower()
    med_hits = [
        m for m in MEDICAL_ONTOLOGY
        if re.search(r"\b" + re.escape(m) + r"\b", lower_content)
    ]
    has_health_pred = any(re.search(pat, lower_content) for pat in HEALTH_CLAIM_PATTERNS)

    if not med_hits and not has_health_pred:
        return {
            "valid": False,
            "reason_code": "NON_MEDICAL_CONTENT",
            "message": (
                "This webpage does not appear to contain medical or health-related information. "
                "Please provide a URL containing a medical or health claim."
            ),
        }

    # ── Extract candidate medical claim(s) from text ──
    # Split into sentences and find the best checkable assertion
    sentences = re.split(r"(?<=[.!?])\s+", full_extracted)
    candidate_claim = ""
    best_score = 0

    for s in sentences:
        s_stripped = s.strip()
        if len(s_stripped.split()) < 4:
            continue
        s_lower = s_stripped.lower()

        # Score based on medical terms + assertion indicators
        med_score = sum(
            1 for m in med_hits if re.search(r"\b" + re.escape(m) + r"\b", s_lower)
        )
        assertion_score = sum(
            1 for pat in ASSERTION_INDICATORS if re.search(pat, s_lower)
        )
        pred_score = sum(
            1 for pat in HEALTH_CLAIM_PATTERNS if re.search(pat, s_lower)
        )
        total_score = med_score * 2 + assertion_score + pred_score * 3

        if total_score > best_score and len(s_stripped) <= 500:
            best_score = total_score
            candidate_claim = s_stripped

    # Fallback to title if no good sentence found
    if not candidate_claim and title and len(title) > 15:
        candidate_claim = title

    # Fallback to truncated extracted text
    if not candidate_claim:
        candidate_claim = full_extracted[:250].strip()

    # Check if candidate has assertion structure
    has_assertion = (
        any(re.search(pat, candidate_claim.lower()) for pat in ASSERTION_INDICATORS)
        or any(re.search(pat, candidate_claim.lower()) for pat in HEALTH_CLAIM_PATTERNS)
    )

    if not has_assertion:
        # Medical content exists but we can't identify a checkable claim
        return {
            "valid": False,
            "reason_code": "NO_CHECKABLE_CLAIM",
            "message": (
                "This webpage contains medical information but we could not identify a specific, "
                "checkable medical claim. Please paste the specific claim you want verified."
            ),
            "title": title or clean_url,
            "extracted_text": full_extracted[:500],
            "medical_relevance": True,
        }

    return {
        "valid": True,
        "reason_code": "READY_FOR_VERIFICATION",
        "clean_url": final_url or clean_url,
        "input_type": "url",
        "title": title or clean_url,
        "claim": candidate_claim[:400],
        "extracted_text": full_extracted[:2500],
        "medical_relevance": True,
    }


# ─── 4. IMAGE VALIDATION & OCR ────────────────────────────────────────────────

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def _preprocess_image_for_ocr(pil_img):
    """
    Apply preprocessing to improve OCR accuracy:
    - Correct orientation (EXIF)
    - Convert to grayscale for better contrast
    - Resize if too small
    - Enhance contrast
    """
    try:
        from PIL import ImageOps, ImageEnhance, ExifTags

        # Auto-rotate based on EXIF
        try:
            exif = pil_img.getexif()
            orientation_key = next(
                (k for k, v in ExifTags.TAGS.items() if v == "Orientation"), None
            )
            if orientation_key and exif:
                orientation = exif.get(orientation_key)
                rotation_map = {3: 180, 6: 270, 8: 90}
                if orientation in rotation_map:
                    pil_img = pil_img.rotate(rotation_map[orientation], expand=True)
        except Exception:
            pass

        # Convert to RGB if needed
        if pil_img.mode not in ("RGB", "L"):
            pil_img = pil_img.convert("RGB")

        # Resize if too small (minimum 800px on longest dimension for OCR quality)
        w, h = pil_img.size
        min_dim = 800
        if max(w, h) < min_dim:
            scale = min_dim / max(w, h)
            new_w, new_h = int(w * scale), int(h * scale)
            try:
                from PIL.Image import LANCZOS
                pil_img = pil_img.resize((new_w, new_h), LANCZOS)
            except ImportError:
                pil_img = pil_img.resize((new_w, new_h))

        # Convert to grayscale for OCR
        gray_img = pil_img.convert("L")

        # Enhance contrast
        enhancer = ImageEnhance.Contrast(gray_img)
        gray_img = enhancer.enhance(1.5)

        return gray_img
    except Exception:
        # Return original if preprocessing fails
        return pil_img


def _extract_ocr_text(pil_img) -> str:
    """
    Extract text from a PIL image using Tesseract (primary) or PyMuPDF (fallback).
    Returns raw extracted string.
    """
    extracted = ""

    # Primary: Tesseract
    tess = pytesseract
    if tess is None:
        try:
            import pytesseract as tess
        except ImportError:
            tess = None

    if tess is not None:
        try:
            config_psm3 = "--psm 3 --oem 3"
            config_psm11 = "--psm 11 --oem 3"
            try:
                text_psm3 = tess.image_to_string(pil_img, config=config_psm3)
                text_psm11 = tess.image_to_string(pil_img, config=config_psm11)
                extracted = text_psm3 if len(text_psm3) >= len(text_psm11) else text_psm11
            except (TypeError, Exception):
                try:
                    extracted = tess.image_to_string(pil_img)
                except Exception:
                    pass
        except Exception:
            try:
                extracted = tess.image_to_string(pil_img)
            except Exception:
                pass

    if not extracted.strip():
        # Fallback: PyMuPDF (fitz)
        pdf_mod = pymupdf
        if pdf_mod is None:
            try:
                import pymupdf as pdf_mod
            except ImportError:
                pdf_mod = None

        if pdf_mod is not None:
            try:
                import io
                img_bytes = io.BytesIO()
                pil_img.save(img_bytes, format="PNG")
                img_bytes.seek(0)
                doc = pdf_mod.open(stream=img_bytes.read(), filetype="png")
                for page in doc:
                    extracted += page.get_text() + "\n"
            except Exception:
                pass

    # Normalize whitespace per line while preserving newlines
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in extracted.splitlines()]
    return "\n".join(line for line in lines if line).strip()


def _extract_claims_from_ocr_text(ocr_text: str, med_hits: list) -> list:
    """
    Extract candidate medical claims from OCR text.
    Handles:
    - Regular sentences
    - Bullet points and numbered lists
    - Headings followed by descriptions
    - Infographic-style short statements
    """
    candidates = []

    # Strategy 1: Split on sentence boundaries
    sentences = re.split(r"(?<=[.!?])\s+", ocr_text)
    for s in sentences:
        s = s.strip()
        if len(s.split()) < 3:
            continue
        s_lower = s.lower()
        has_med = any(re.search(r"\b" + re.escape(m) + r"\b", s_lower) for m in med_hits)
        has_assertion = (
            any(re.search(pat, s_lower) for pat in ASSERTION_INDICATORS)
            or any(re.search(pat, s_lower) for pat in HEALTH_CLAIM_PATTERNS)
        )
        if has_med and has_assertion:
            candidates.append(s)

    # Strategy 2: Split on newlines (bullet points, numbered items, headings)
    lines = [l.strip() for l in re.split(r"[\n\r]+", ocr_text)]
    for line in lines:
        # Strip bullet markers
        line_clean = re.sub(r"^[\u2022\u2023\u25E6\u2043\-\*\d+\.\)]+\s*", "", line).strip()
        if len(line_clean.split()) < 3 or len(line_clean) > 300:
            continue
        line_lower = line_clean.lower()
        has_med = any(re.search(r"\b" + re.escape(m) + r"\b", line_lower) for m in med_hits)
        has_assertion = (
            any(re.search(pat, line_lower) for pat in ASSERTION_INDICATORS)
            or any(re.search(pat, line_lower) for pat in HEALTH_CLAIM_PATTERNS)
        )
        if has_med and has_assertion and line_clean not in candidates:
            candidates.append(line_clean)

    return candidates


def extract_and_validate_image(image_file) -> Dict[str, Any]:
    """
    Validates uploaded image, performs OCR text extraction with preprocessing,
    and checks medical relevance.

    Returns one of:
      INVALID_INPUT          – file missing, wrong format, or too large
      UNREADABLE_CONTENT     – OCR produced insufficient readable text
      NON_MEDICAL_CONTENT    – extracted text is not health-related
      NO_CHECKABLE_CLAIM     – medical content found but no verifiable assertion
      READY_FOR_VERIFICATION – valid claim(s) extracted
    """
    if not image_file:
        return {
            "valid": False,
            "reason_code": "INVALID_INPUT",
            "message": "Please select an image file to upload.",
        }

    # Content type & extension check
    content_type = getattr(image_file, "content_type", "")
    filename = getattr(image_file, "name", "uploaded_image").lower()

    valid_ext = any(filename.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"])
    if not valid_ext and content_type not in ALLOWED_IMAGE_TYPES:
        return {
            "valid": False,
            "reason_code": "INVALID_INPUT",
            "message": "Unsupported image format. Please upload a JPG, PNG, or WEBP image.",
        }

    # File size check
    size = getattr(image_file, "size", 0)
    if size > MAX_IMAGE_SIZE_BYTES:
        return {
            "valid": False,
            "reason_code": "INVALID_INPUT",
            "message": "Image exceeds the maximum allowed size of 10 MB.",
        }

    # Read bytes
    try:
        if hasattr(image_file, "read"):
            image_bytes = image_file.read()
            if hasattr(image_file, "seek"):
                image_file.seek(0)
        else:
            image_bytes = bytes(image_file)
    except Exception as e:
        return {
            "valid": False,
            "reason_code": "INVALID_INPUT",
            "message": f"Unable to read image data: {str(e)}",
        }

    # Validate actual image content (not just extension/MIME type)
    try:
        import io
        from PIL import Image as PILImage
        pil_img = PILImage.open(io.BytesIO(image_bytes))
        pil_img.verify()  # Check for corruption
        # Re-open after verify (verify closes the image)
        pil_img = PILImage.open(io.BytesIO(image_bytes))
    except Exception as e:
        return {
            "valid": False,
            "reason_code": "INVALID_INPUT",
            "message": f"The uploaded file is not a valid image or is corrupted: {str(e)}",
        }

    # Preprocess image for better OCR results
    try:
        preprocessed = _preprocess_image_for_ocr(pil_img)
    except Exception:
        preprocessed = pil_img

    # Perform OCR
    extracted_text = _extract_ocr_text(preprocessed)

    # Also try on the original if preprocessing gave fewer words
    if preprocessed is not pil_img:
        original_text = _extract_ocr_text(pil_img)
        if len(re.findall(r"\b[a-zA-Z]{2,}\b", original_text)) > len(
            re.findall(r"\b[a-zA-Z]{2,}\b", extracted_text)
        ):
            extracted_text = original_text

    # Readability check
    words = re.findall(r"\b[a-zA-Z]{2,}\b", extracted_text)
    if len(words) < 5:
        return {
            "valid": False,
            "reason_code": "UNREADABLE_CONTENT",
            "message": (
                "Unable to extract sufficient readable text from this image. "
                "Please upload a clearer image with visible text, or enter the claim directly."
            ),
        }

    # Medical domain relevance check
    lower_ocr = extracted_text.lower()
    med_hits = [
        m for m in MEDICAL_ONTOLOGY
        if re.search(r"\b" + re.escape(m) + r"\b", lower_ocr)
    ]
    has_health_pred = any(re.search(pat, lower_ocr) for pat in HEALTH_CLAIM_PATTERNS)

    if not med_hits and not has_health_pred:
        return {
            "valid": False,
            "reason_code": "NON_MEDICAL_CONTENT",
            "message": (
                "No medical or health-related information was detected in this image. "
                "Please upload an image containing medical text, such as an infographic, "
                "medical article screenshot, or health claim."
            ),
        }

    # Extract candidate claims from OCR text
    candidate_claims = _extract_claims_from_ocr_text(extracted_text, med_hits)

    if not candidate_claims:
        # Medical content but no checkable assertion found
        # Check if any text at all forms a sensible medical fragment
        medical_fragment = ""
        for line in re.split(r"[\n\r]+", extracted_text):
            line = line.strip()
            if any(re.search(r"\b" + re.escape(m) + r"\b", line.lower()) for m in med_hits):
                if len(line.split()) >= 3:
                    medical_fragment = line
                    break

        if medical_fragment:
            # Use the fragment as context but flag no checkable claim
            return {
                "valid": False,
                "reason_code": "NO_CHECKABLE_CLAIM",
                "message": (
                    "This image contains medical information but no specific verifiable claim "
                    "could be identified. If the image contains health claims, they may be in "
                    "a format not recognized by the OCR engine. Please enter the specific claim directly."
                ),
                "extracted_text": extracted_text[:500],
                "medical_fragment": medical_fragment,
                "medical_relevance": True,
            }

        return {
            "valid": False,
            "reason_code": "NO_CHECKABLE_CLAIM",
            "message": (
                "Medical terms were detected but no verifiable medical claim could be extracted. "
                "Please enter the specific claim directly."
            ),
            "extracted_text": extracted_text[:500],
            "medical_relevance": True,
        }

    # Use the best candidate claim (first one with highest relevance score)
    primary_claim = candidate_claims[0]

    return {
        "valid": True,
        "reason_code": "READY_FOR_VERIFICATION",
        "input_type": "image",
        "claim": primary_claim[:400],
        "all_claims": candidate_claims[:5],  # Up to 5 candidates for multi-claim processing
        "extracted_text": extracted_text[:1000],
        "medical_relevance": True,
        "ocr_word_count": len(words),
    }
