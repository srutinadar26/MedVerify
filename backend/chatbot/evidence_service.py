import requests
import xml.etree.ElementTree as ET


PUBMED_SEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
PUBMED_FETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"


def search_pubmed(query, max_results=3):

    # Improve natural-language questions for PubMed
    search_query = query

    question_words = [
        "what causes",
        "what is",
        "what are",
        "how does",
        "how do",
        "can",
        "does",
        "is",
        "are"
    ]

    for word in question_words:
        search_query = search_query.replace(word, "")

    search_query = search_query.replace("?", "").strip()

    search_params = {
        "db": "pubmed",
        "term": search_query,
        "retmax": max_results,
        "retmode": "json",
    }

    search_response = requests.get(
        PUBMED_SEARCH_URL,
        params=search_params,
        timeout=10
    )

    search_response.raise_for_status()

    pmids = search_response.json()["esearchresult"]["idlist"]

    if not pmids:
        return []

    fetch_params = {
        "db": "pubmed",
        "id": ",".join(pmids),
        "retmode": "xml",
    }

    fetch_response = requests.get(
        PUBMED_FETCH_URL,
        params=fetch_params,
        timeout=10
    )

    fetch_response.raise_for_status()

    root = ET.fromstring(fetch_response.text)

    results = []

    for article in root.findall(".//PubmedArticle"):

        title_element = article.find(".//ArticleTitle")
        abstract_elements = article.findall(".//AbstractText")
        pmid_element = article.find(".//PMID")

        title = (
            "".join(title_element.itertext())
            if title_element is not None
            else "No title available"
        )

        if abstract_elements:
            abstract = " ".join(
                "".join(element.itertext())
                for element in abstract_elements
            )
        else:
            abstract = "No abstract available"

        pmid = (
            pmid_element.text
            if pmid_element is not None
            else ""
        )

        results.append({
            "title": title,
            "abstract": abstract,
            "pmid": pmid,
            "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
        })

    return results