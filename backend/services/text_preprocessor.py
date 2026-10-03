import re
from typing import Dict

# Dictionary of technical terms that need symbol protection before special character removal
PROTECTED_TERMS: Dict[str, str] = {
    r"\bc\+\+(?!\+)": "__cplusplus__",
    r"\bc\#": "__csharp__",
    r"(?:^|(?<=\s|[.,;(/]))\.net\b": "__dotnet__",
    r"\bnode\.js\b": "__nodejs__",
    r"\breact\.js\b": "__reactjs__",
    r"\bvue\.js\b": "__vuejs__",
    r"\bnext\.js\b": "__nextjs__",
    r"\bci\/cd\b": "__cicd__",
    r"\bpl\/sql\b": "__plsql__",
    r"\btcp\/ip\b": "__tcpip__",
}

REVERSE_PROTECTED: Dict[str, str] = {
    "__cplusplus__": "c++",
    "__csharp__": "c#",
    "__dotnet__": ".net",
    "__nodejs__": "node.js",
    "__reactjs__": "react.js",
    "__vuejs__": "vue.js",
    "__nextjs__": "next.js",
    "__cicd__": "ci/cd",
    "__plsql__": "pl/sql",
    "__tcpip__": "tcp/ip",
}


def clean_and_preprocess(raw_text: str) -> str:
    """
    Cleans and standardizes raw text using deterministic rule-based transformations.
    Strictly rule-based and string-processing only: NO ML or embeddings.

    Steps:
    1. Lowercase text.
    2. Protect critical technical symbols (c++, c#, .net, etc.).
    3. Normalize years of experience pattern like "2+ years" -> "2 years".
    4. Remove unnecessary special characters while keeping letters, digits, and spaces.
    5. Restore protected technical symbols.
    6. Normalize whitespace and remove duplicate spaces.
    """
    if not raw_text or not isinstance(raw_text, str):
        return ""

    # 1. Lowercase
    text = raw_text.lower()

    # 2. Protect technical terms with special characters
    for pattern, placeholder in PROTECTED_TERMS.items():
        text = re.sub(pattern, placeholder, text)

    # 3. Handle patterns like "2+ years" -> "2 years"
    text = re.sub(r'(\d+)\s*\+\s*(years?|yrs?)', r'\1 \2', text)

    # 4. Remove unnecessary special characters (preserve alphanumeric, underscores, hyphens, and placeholders)
    # Punctuation like commas, periods, exclamation, quotes, brackets get replaced by spaces
    text = re.sub(r'[^\w\s\-\+\#\.]', ' ', text)

    # Clean stray symbols not part of technical words
    # Replace standalone periods, hyphens, pluses that aren't inside placeholders
    text = re.sub(r'(?<![a-zA-Z0-9])[\.\-\+](?![a-zA-Z0-9])', ' ', text)

    # 5. Restore protected technical symbols
    for placeholder, original in REVERSE_PROTECTED.items():
        text = text.replace(placeholder, original)

    # 6. Normalize whitespace and remove multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()

    return text
