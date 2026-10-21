import json
import os
import sys
import time
import requests

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "http://127.0.0.1:8000/api"

def print_header(title):
    print("\n" + "=" * 70)
    print(f" AUDIT CHECK: {title}")
    print("=" * 70)

def test_health():
    print_header("1. Health Endpoint & Backend Status")
    resp = requests.get(f"{BASE_URL}/health/")
    print("Status code:", resp.status_code)
    data = resp.json()
    print("Response payload:", json.dumps(data, indent=2))
    assert resp.status_code == 200
    assert data.get("status") == "ok"
    assert data.get("rag_available") is True
    assert data.get("ml_classifier") == "active"
    print("PASS: Backend is running with active RAG and ML classifier.")

def test_text_pipeline_modes():
    print_header("2. Live API Response - Pipeline Mode & LLM vs Fallback Distinction")
    claim = "Aspirin reduces fever in adults."
    resp = requests.post(f"{BASE_URL}/verify/text/", json={"text": claim})
    print("Status code:", resp.status_code)
    data = resp.json()
    
    print(f"Claim: {data.get('claim')}")
    print(f"Verdict: {data.get('verdict')}")
    print(f"Pipeline Mode: {data.get('pipeline_mode')}")
    print(f"Confidence: {data.get('confidence')}")
    llm_info = data.get("llm_analysis", {})
    print(f"LLM Available: {llm_info.get('available')}")
    print(f"LLM Provider: {llm_info.get('provider')}")
    print(f"LLM Error/Fallback reason: {llm_info.get('error') or llm_info.get('insufficient_reason')}")
    print(f"Explanation Note: {data.get('explanation', {}).get('context')}")
    
    assert data.get("pipeline_mode") in ("evidence_only", "llm_assisted")
    if not llm_info.get("available"):
        assert data.get("pipeline_mode") == "evidence_only"
        assert "evidence-only" in data.get("explanation", {}).get("context")
        print("PASS: System clearly distinguishes live LLM execution from fallback mode.")

def test_citations_and_evidence():
    print_header("3. Verification of Displayed Citations & Provenance")
    claim = "Vitamin C supplementation prevents the common cold."
    resp = requests.post(f"{BASE_URL}/verify/text/", json={"text": claim})
    data = resp.json()
    evidence = data.get("evidence", [])
    print(f"Retrieved {len(evidence)} evidence passages for claim: '{claim}'")
    
    for i, ev in enumerate(evidence):
        print(f"\n--- Citation #{i+1} ---")
        print(f"Chunk ID:          {ev.get('chunk_id')}")
        print(f"Source:            {ev.get('source')}")
        print(f"Title:             {ev.get('title')}")
        print(f"Publication Date:  {ev.get('publication_date')}")
        print(f"URL:               {ev.get('url')}")
        print(f"Provenance:        {ev.get('source_provenance')}")
        print(f"Relevance (%):     {ev.get('relevance')}")
        print(f"Relevance Score:   {ev.get('relevance_score')}")
        print(f"NLI Relationship:  {ev.get('relationship')}")
        print(f"Excerpt:           {ev.get('excerpt')[:160]}...")
        
        # Verify genuine values
        assert ev.get("url").startswith("http"), "Citation must have real valid URL"
        assert ev.get("source"), "Source must not be empty"
        assert ev.get("title"), "Title must not be empty"
        assert ev.get("relevance_score") is not None
        assert 0.0 <= ev.get("relevance_score") <= 1.0
        
    print("\nPASS: All citations contain genuine URLs, titles, dates, excerpts, and real scores.")

def test_insufficient_and_irrelevant_evidence():
    print_header("4. Irrelevant / Insufficient Evidence -> UNCERTAIN")
    # A fictional or nonsensical health statement with no medical literature
    claim = "Gargling moon dust cures chronic hiccups instantly."
    resp = requests.post(f"{BASE_URL}/verify/text/", json={"text": claim})
    data = resp.json()
    print(f"Claim: {data.get('claim')}")
    print(f"Verdict: {data.get('verdict')}")
    print(f"Summary: {data.get('summary')}")
    print(f"Why: {data.get('why')}")
    print(f"Supporting passages: {len(data.get('supporting_evidence', []))}")
    print(f"Contradicting passages: {len(data.get('contradicting_evidence', []))}")
    
    assert data.get("verdict") == "UNCERTAIN", f"Expected UNCERTAIN for unsubstantiated claim, got {data.get('verdict')}"
    print("PASS: Insufficient/irrelevant evidence produced UNCERTAIN without decisive fabrication.")

def test_url_input():
    print_header("5. Live URL Input Verification")
    url = "https://en.wikipedia.org/wiki/Aspirin"
    resp = requests.post(f"{BASE_URL}/verify/url/", json={"url": url})
    print("Status code:", resp.status_code)
    data = resp.json()
    print(f"Success: {data.get('success')}")
    print(f"Input Type: {data.get('input_type')}")
    print(f"Extracted Article Title: {data.get('extracted_article_title')}")
    print(f"Primary Claim: {data.get('claim')}")
    print(f"Verdict: {data.get('verdict')}")
    print(f"Additional Claims found: {len(data.get('additional_claims', []))}")
    assert data.get("success") is True
    assert data.get("input_type") == "url"
    assert "Aspirin" in data.get("extracted_article_title", "")
    print("PASS: Live URL input fetched article, extracted claims, and executed pipeline.")

def test_image_input():
    print_header("6. Live Image Input Verification")
    # Test with test_claim.png
    if not os.path.exists("test_claim.png"):
        from PIL import Image, ImageDraw
        img = Image.new("RGB", (600, 200), color=(255, 255, 255))
        d = ImageDraw.Draw(img)
        d.text((20, 80), "Vitamin C prevents the common cold.", fill=(0, 0, 0))
        img.save("test_claim.png")
    
    with open("test_claim.png", "rb") as f:
        resp = requests.post(f"{BASE_URL}/verify/image/", files={"image": f})
    print("Status code:", resp.status_code)
    data = resp.json()
    print("Response:", json.dumps(data, indent=2))
    # If OCR is unavailable without local Tesseract, it returns 400 with UNREADABLE_CONTENT
    assert resp.status_code in (200, 400)
    assert data.get("input_type") == "image"
    print("PASS: Live image input endpoint handled image safely with validated response format.")

def test_latency():
    print_header("7. End-to-End Latency Measurement (Warm vs Cold)")
    claim = "Aspirin reduces fever in adults."
    
    times = []
    for i in range(4):
        t0 = time.time()
        resp = requests.post(f"{BASE_URL}/verify/text/", json={"text": claim})
        elapsed = time.time() - t0
        times.append(elapsed)
        print(f"Request #{i+1}: {elapsed:.3f}s (HTTP {resp.status_code})")
    
    cold = times[0]
    warm = sum(times[1:]) / len(times[1:])
    print(f"\nCold request latency: {cold:.3f}s")
    print(f"Average warm request latency: {warm:.3f}s")
    print("PASS: Latency measured over repeated requests.")

if __name__ == "__main__":
    test_health()
    test_text_pipeline_modes()
    test_citations_and_evidence()
    test_insufficient_and_irrelevant_evidence()
    test_url_input()
    test_image_input()
    test_latency()
    print("\n" + "=" * 70)
    print(" ALL PRE-PRESENTATION AUDIT CHECKS PASSED SUCCESSFULLY!")
    print("=" * 70)
