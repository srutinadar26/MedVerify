"""
claim_validator.py
==================
Centralized validation and domain-relevance engine for MedVerify AI.

Validates:
1. Syntax and linguistic quality (rejects gibberish, keyboard mashing, numbers, emojis)
2. Medical domain relevance (multi-layered ontology and health claim patterns)
3. Claim vs Question / Casual Request classification
4. URL safety, SSRF protection, article extraction, and medical relevance
5. Image format, size, OCR text extraction, and medical relevance
"""

import re
import ipaddress
import urllib.parse
from typing import Dict, Any, Tuple, Optional


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

    # Symptoms & Clinical Signs
    "symptom", "symptoms", "pain", "fatigue", "nausea", "vomiting", "diarrhea",
    "diarrhoea", "constipation", "cough", "coughing", "dyspnea", "shortness of breath",
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

# Obvious non-medical domain keywords to immediately reject
NON_MEDICAL_KEYWORDS = {
    "python", "javascript", "react", "django", "html", "css", "sql", "git",
    "programming", "software", "code", "coding", "algorithm", "compiler",
    "cricket", "football", "soccer", "basketball", "tennis", "ipl", "fifa",
    "movie", "cinema", "actor", "actress", "hollywood", "bollywood", "netflix",
    "bitcoin", "crypto", "stock market", "nasdaq", "forex", "trading",
    "joke", "weather", "recipe", "pizza", "burger", "fashion", "dress",
}

# Gibberish keyboard-mashing sub-patterns
KEYBOARD_MASH_PATTERNS = [
    r"^[asdfghjkl]{3,}$",
    r"^[qwertyuiop]{3,}$",
    r"^[zxcvbnm]{3,}$",
    r"^(.)\1{2,}$",          # repeated char: aaaa, xxx, 1111
    r"^[0-9\W_]+$",          # no alphabetic letters at all
]


# ─── 2. TEXT VALIDATION ───────────────────────────────────────────────────────

def validate_claim_text(text: Optional[str]) -> Dict[str, Any]:
    """
    Validates user text submission.
    Returns:
      {
        "valid": bool,
        "clean_text": str,
        "input_type": "text",
        "medical_relevance": bool,
        "claim_type": str,
        "reason_code": Optional[str],
        "message": Optional[str]
      }
    """
    if text is None:
        return {
            "valid": False,
            "input_type": "text",
            "medical_relevance": False,
            "reason_code": "EMPTY_INPUT",
            "message": "Please enter a claim to verify.",
        }

    cleaned = text.strip()

    # A. Length check
    if len(cleaned) == 0:
        return {
            "valid": False,
            "input_type": "text",
            "medical_relevance": False,
            "reason_code": "EMPTY_INPUT",
            "message": "Please enter a meaningful medical or health-related claim.",
        }

    if len(cleaned) < 4:
        return {
            "valid": False,
            "input_type": "text",
            "medical_relevance": False,
            "reason_code": "TOO_SHORT",
            "message": "Please enter a meaningful medical or health-related claim.",
        }

    lower_text = cleaned.lower()

    # B. Punctuation, symbols, emojis, or numbers only
    words = re.findall(r"\b[a-zA-Z]{2,}\b", lower_text)
    if not words:
        return {
            "valid": False,
            "input_type": "text",
            "medical_relevance": False,
            "reason_code": "NO_WORDS",
            "message": "Please enter a meaningful medical or health-related claim.",
        }

    # C. Repeated characters and keyboard mashing
    clean_alpha = re.sub(r"[^a-zA-Z]", "", lower_text)
    for pat in KEYBOARD_MASH_PATTERNS:
        if re.match(pat, clean_alpha):
            return {
                "valid": False,
                "input_type": "text",
                "medical_relevance": False,
                "reason_code": "GIBBERISH_INPUT",
                "message": "Please enter a meaningful medical or health-related claim.",
            }

    # Common non-claim trivial greetings / casual phrases / jokes
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
            "reason_code": "CASUAL_GREETING",
            "message": "Please enter a meaningful medical or health-related claim.",
        }

    # Website navigation chrome & menu text detection
    NAV_CHROME_TERMS = {
        "menu", "navigation", "nav", "skip to main content", "skip to content",
        "login", "log in", "sign in", "sign up", "register", "my account", "account",
        "cart", "checkout", "shopping cart", "contact us", "about us",
        "privacy policy", "terms of service", "terms of use", "cookie policy",
        "all rights reserved", "copyright", "sitemap", "site map", "footer",
        "header", "breadcrumbs", "home page", "search this site", "subscribe",
        "newsletter", "categories", "back to top", "find a doctor",
    }
    nav_hits = [term for term in NAV_CHROME_TERMS if term in lower_text]
    if nav_hits:
        # If navigation chrome phrases are present, check if there is an actual declarative claim
        has_claim_verb = any(re.search(pat, lower_text) for pat in HEALTH_CLAIM_PATTERNS)
        # Ratio of nav keywords or clear chrome pattern
        if not has_claim_verb or len(nav_hits) >= 2 or any(term in lower_text for term in ["skip to main content", "privacy policy", "terms of service", "all rights reserved"]):
            return {
                "valid": False,
                "input_type": "text",
                "medical_relevance": False,
                "reason_code": "WEBSITE_NAVIGATION",
                "message": "This input appears to be website navigation text or menu items rather than a verifiable medical claim.",
            }

    # D. Detect obvious non-medical topics (programming, sports, cinema, weather, etc.)
    for nm_kw in NON_MEDICAL_KEYWORDS:
        if re.search(r"\b" + re.escape(nm_kw) + r"\b", lower_text):
            # Check if there is also an overarching medical context; if not, reject
            med_hits = [m for m in MEDICAL_ONTOLOGY if re.search(r"\b" + re.escape(m) + r"\b", lower_text)]
            if not med_hits:
                return {
                    "valid": False,
                    "input_type": "text",
                    "medical_relevance": False,
                    "reason_code": "NON_MEDICAL_TOPIC",
                    "message": "This doesn't appear to be a medical or health-related claim.",
                }

    # E. Check for Question vs Declarative Claim
    question_starters = [
        "what", "when", "where", "which", "who", "whom", "whose",
        "why", "how", "can you", "could you", "tell me", "explain",
    ]
    is_question = "?" in cleaned or any(lower_text.startswith(q + " ") for q in question_starters)
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
                "reason_code": "QUESTION_INPUT",
                "message": "This appears to be a medical question rather than a specific claim. Please enter a medical claim you want to verify.",
            }

    # F. Medical Domain Relevance Check
    matched_medical_terms = []
    for term in MEDICAL_ONTOLOGY:
        if re.search(r"\b" + re.escape(term) + r"\b", lower_text):
            matched_medical_terms.append(term)

    has_health_predicate = any(re.search(pat, lower_text) for pat in HEALTH_CLAIM_PATTERNS)

    # If single vague medical word like "diabetes" or "cancer"
    if len(words) <= 2 and len(matched_medical_terms) > 0 and not has_health_predicate:
        return {
            "valid": False,
            "input_type": "text",
            "medical_relevance": True,
            "reason_code": "VAGUE_MEDICAL_TERM",
            "message": f"Single topic '{cleaned}' entered. Please provide a full claim (e.g., '{cleaned.capitalize()} can be cured by diet').",
        }

    # Minimum threshold: must contain at least one medical concept, OR a health claim pattern combined with biological/health context
    if not matched_medical_terms:
        # Check if it has a health claim pattern (e.g., "miracle cure", "burns fat instantly")
        if not has_health_predicate:
            return {
                "valid": False,
                "input_type": "text",
                "medical_relevance": False,
                "reason_code": "NON_MEDICAL_INPUT",
                "message": "This doesn't appear to be a medical or health-related claim.",
            }

    # Check for meaningful assertion structure: reject mere lists of medical keywords without assertion
    # E.g., "Doctor hospital clinic patient surgery" has medical words but no verb/claim
    assertion_indicators = [
        r"\b(is|are|was|were|can|cannot|could|will|would|may|might|should|has|have|had)\b",
        r"\b(causes?|prevents?|cures?|treats?|reduces?|increases?|lowers?|raises?|helps?|improves?|damages?|worsens?)\b",
        r"\b(effective|harmful|safe|dangerous|toxic|good|bad|proven|effective|linked|associated)\b",
    ]
    has_assertion_structure = any(re.search(pat, lower_text) for pat in assertion_indicators) or has_health_predicate
    if not has_assertion_structure and len(words) >= 3:
        return {
            "valid": False,
            "input_type": "text",
            "medical_relevance": False,
            "reason_code": "NO_VERIFIABLE_ASSERTION",
            "message": "Please enter a complete medical claim describing a verifiable assertion.",
        }

    # Minimum word count for a verifiable proposition (at least 3 words)
    if len(words) < 3:
        return {
            "valid": False,
            "input_type": "text",
            "medical_relevance": True,
            "reason_code": "TOO_FEW_WORDS",
            "message": "Please enter a complete claim (at least 3 words) describing an assertion to verify.",
        }

    # Determine claim type
    claim_type = "Medical Assertion"
    
    # Check for individual medical status
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
        "reason_code": None,
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


def validate_url_syntax(url_str: Optional[str]) -> Dict[str, Any]:
    """Checks URL syntax, protocol, and SSRF restrictions."""
    if not url_str or not url_str.strip():
        return {
            "valid": False,
            "reason_code": "EMPTY_URL",
            "message": "Please enter a valid webpage URL.",
        }

    raw = url_str.strip()

    # Prepend http:// if user entered plain domain like www.who.int
    if not raw.startswith("http://") and not raw.startswith("https://"):
        if re.match(r"^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(/.*)?$", raw):
            raw = "https://" + raw
        else:
            return {
                "valid": False,
                "reason_code": "INVALID_URL",
                "message": "Invalid URL. Please enter a valid webpage URL (e.g., https://example.com/article).",
            }

    try:
        parsed = urllib.parse.urlparse(raw)
    except Exception:
        return {
            "valid": False,
            "reason_code": "INVALID_URL",
            "message": "Invalid URL structure.",
        }

    if parsed.scheme not in ("http", "https"):
        return {
            "valid": False,
            "reason_code": "UNSUPPORTED_PROTOCOL",
            "message": "Only HTTP and HTTPS URLs are supported.",
        }

    hostname = (parsed.hostname or "").lower()
    if not hostname or "." not in hostname:
        return {
            "valid": False,
            "reason_code": "INVALID_HOSTNAME",
            "message": "Please provide a valid webpage hostname (e.g., who.int).",
        }

    # SSRF Protection: Disallow localhost & loopback
    if hostname in ("localhost", "127.0.0.1", "0.0.0.0", "::1"):
        return {
            "valid": False,
            "reason_code": "SSRF_BLOCKED",
            "message": "Access to local or private network addresses is prohibited.",
        }

    # Check if hostname is an IP in a reserved range
    try:
        ip_obj = ipaddress.ip_address(hostname)
        for net in BLOCKED_IP_NETWORKS:
            if ip_obj in net:
                return {
                    "valid": False,
                    "reason_code": "SSRF_BLOCKED",
                    "message": "Access to private IP networks is prohibited.",
                }
    except ValueError:
        pass  # Hostname is a domain name, not a raw IP

    return {
        "valid": True,
        "clean_url": raw,
        "hostname": hostname,
    }


def extract_and_validate_url(url_str: str) -> Dict[str, Any]:
    """
    Fetches URL content safely, extracts title and main text,
    and validates medical domain relevance.
    """
    url_check = validate_url_syntax(url_str)
    if not url_check["valid"]:
        return url_check

    clean_url = url_check["clean_url"]
    hostname = url_check["hostname"]

    # Reject known non-medical aggregators if direct home/search without article
    known_general_domains = {
        "youtube.com", "m.youtube.com", "espn.com", "amazon.com", "amazon.in",
        "instagram.com", "facebook.com", "x.com", "twitter.com", "reddit.com",
        "github.com", "netflix.com", "ebay.com", "linkedin.com",
    }
    if any(hostname == d or hostname.endswith("." + d) for d in known_general_domains):
        # If it's the root or a search/watch page on general sites
        path = urllib.parse.urlparse(clean_url).path.strip("/")
        if not path or path in ("watch", "search", "trending"):
            return {
                "valid": False,
                "reason_code": "NON_MEDICAL_URL",
                "message": f"This website ({hostname}) does not appear to contain medical or health-related information. Please provide a URL containing a medical or health claim.",
            }

    try:
        import requests
        headers = {
            "User-Agent": "MedVerify-AI-Bot/1.0 (+https://medverify.ai; Medical Fact Checking Engine)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        resp = requests.get(clean_url, headers=headers, timeout=8, stream=True)
        if resp.status_code >= 400:
            return {
                "valid": False,
                "reason_code": "HTTP_ERROR",
                "message": f"Could not reach webpage (HTTP status {resp.status_code}). Please check the link.",
            }

        # Check content length / read at most 3MB
        content_bytes = resp.raw.read(3 * 1024 * 1024)
        html_text = content_bytes.decode(resp.encoding or "utf-8", errors="replace")

    except requests.exceptions.Timeout:
        return {
            "valid": False,
            "reason_code": "TIMEOUT",
            "message": "Webpage request timed out. Please try a different source or enter the text directly.",
        }
    except Exception as e:
        return {
            "valid": False,
            "reason_code": "FETCH_ERROR",
            "message": f"Unable to fetch URL: {str(e)}",
        }

    # Extract text from HTML
    title = ""
    paragraphs = []
    try:
        # Use simple and fast BeautifulSoup if available, else regex
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(html_text, "html.parser")

        # Strip scripts, styles, nav, footer, header, aside
        for s in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
            s.decompose()

        if soup.title and soup.title.string:
            title = soup.title.string.strip()

        # Gather meaningful text
        for p in soup.find_all(["p", "h1", "h2", "h3"]):
            text = p.get_text().strip()
            if len(text) > 30:
                paragraphs.append(text)
    except Exception:
        # Regex fallback
        m_title = re.search(r"<title>(.*?)</title>", html_text, re.IGNORECASE | re.DOTALL)
        if m_title:
            title = m_title.group(1).strip()
        body_clean = re.sub(r"<(script|style|nav|footer)[^>]*>.*?</\1>", " ", html_text, flags=re.DOTALL | re.IGNORECASE)
        p_matches = re.findall(r"<p[^>]*>(.*?)</p>", body_clean, flags=re.DOTALL | re.IGNORECASE)
        for p in p_matches:
            c = re.sub(r"<[^>]+>", " ", p).strip()
            if len(c) > 30:
                paragraphs.append(c)

    full_extracted = " ".join(([title] if title else []) + paragraphs[:12])
    full_extracted = re.sub(r"\s+", " ", full_extracted).strip()

    if len(full_extracted) < 80:
        return {
            "valid": False,
            "reason_code": "INSUFFICIENT_CONTENT",
            "message": "We couldn't extract meaningful readable content from this webpage. Please paste the claim text directly.",
        }

    # Validate Medical Relevance of extracted content
    lower_content = full_extracted.lower()
    med_hits = [m for m in MEDICAL_ONTOLOGY if re.search(r"\b" + re.escape(m) + r"\b", lower_content)]

    if len(med_hits) < 1:
        return {
            "valid": False,
            "reason_code": "NON_MEDICAL_URL",
            "message": "This webpage does not appear to contain medical or health-related information. Please provide a URL containing a medical or health claim.",
        }

    # Extract the primary medical claim sentence from the article
    sentences = re.split(r"(?<=[.!?])\s+", full_extracted)
    candidate_claim = ""
    for s in sentences:
        s_lower = s.lower()
        if any(re.search(r"\b" + re.escape(m) + r"\b", s_lower) for m in med_hits) and len(s.split()) >= 4:
            candidate_claim = s.strip()
            break

    if not candidate_claim:
        candidate_claim = (title if len(title) > 20 else full_extracted[:200]).strip()

    return {
        "valid": True,
        "clean_url": clean_url,
        "input_type": "url",
        "title": title or clean_url,
        "claim": candidate_claim[:400],
        "extracted_text": full_extracted[:2500],
        "medical_relevance": True,
    }


# ─── 4. IMAGE VALIDATION & OCR ────────────────────────────────────────────────

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def extract_and_validate_image(image_file) -> Dict[str, Any]:
    """Validates uploaded image, performs OCR text extraction, and checks medical relevance."""
    if not image_file:
        return {
            "valid": False,
            "reason_code": "NO_FILE",
            "message": "Please select an image file to upload.",
        }

    # Content type & extension check
    content_type = getattr(image_file, "content_type", "")
    filename = getattr(image_file, "name", "uploaded_image").lower()

    valid_ext = any(filename.endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"])
    if not valid_ext and content_type not in ALLOWED_IMAGE_TYPES:
        return {
            "valid": False,
            "reason_code": "UNSUPPORTED_FORMAT",
            "message": "Unsupported image format. Please upload a JPG, PNG, or WEBP image.",
        }

    # File size check
    size = getattr(image_file, "size", 0)
    if size > MAX_IMAGE_SIZE_BYTES:
        return {
            "valid": False,
            "reason_code": "FILE_TOO_LARGE",
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
            "reason_code": "READ_ERROR",
            "message": f"Unable to read image data: {str(e)}",
        }

    extracted_text = ""

    # Attempt OCR using PyMuPDF (fitz) or PyTesseract
    try:
        import pytesseract
        from PIL import Image
        import io
        pil_img = Image.open(io.BytesIO(image_bytes))
        extracted_text = pytesseract.image_to_string(pil_img)
    except Exception:
        # Fallback to PyMuPDF
        try:
            import pymupdf
            doc = pymupdf.open(stream=image_bytes, filetype="png")
            for page in doc:
                extracted_text += page.get_text() + "\n"
        except Exception:
            pass

    extracted_text = re.sub(r"\s+", " ", extracted_text).strip()

    # If OCR produced no readable words or meaningless short text
    words = re.findall(r"\b[a-zA-Z]{2,}\b", extracted_text)
    if len(words) < 3:
        return {
            "valid": False,
            "reason_code": "IMAGE_OCR_FAILURE",
            "message": "Unable to detect a meaningful medical claim in this image. Please upload a clearer image containing medical or health-related information.",
        }

    # Check medical domain relevance on OCR text
    lower_ocr = extracted_text.lower()
    med_hits = [m for m in MEDICAL_ONTOLOGY if re.search(r"\b" + re.escape(m) + r"\b", lower_ocr)]

    if not med_hits and not any(re.search(pat, lower_ocr) for pat in HEALTH_CLAIM_PATTERNS):
        return {
            "valid": False,
            "reason_code": "NON_MEDICAL_IMAGE",
            "message": "Image rejected. No meaningful medical or health-related information was detected in this image.",
        }

    # Extract the main medical claim sentence from OCR text
    sentences = re.split(r"(?<=[.!?])\s+", extracted_text)
    candidate_claim = ""
    for s in sentences:
        if any(re.search(r"\b" + re.escape(m) + r"\b", s.lower()) for m in med_hits):
            candidate_claim = s.strip()
            break

    if not candidate_claim:
        candidate_claim = extracted_text[:250].strip()

    return {
        "valid": True,
        "input_type": "image",
        "claim": candidate_claim,
        "extracted_text": extracted_text[:1000],
        "medical_relevance": True,
    }
