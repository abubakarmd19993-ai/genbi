import os

files = [
    "backend/app/business_consultant.py",
    "backend/app/dashboard.py",
    "backend/app/data_cleaning.py",
    "backend/app/doc_chat.py",
    "backend/app/industry_intelligence.py",
    "backend/app/insights.py",
    "backend/app/invoice_reader.py",
    "backend/app/meeting_notes.py",
    "backend/app/pdf_chat.py",
    "backend/app/pdf_report.py",
    "backend/app/rag.py",
    "backend/app/recommendations.py",
    "backend/app/resume_parser.py",
    "backend/app/root_cause.py",
    "backend/app/sql_generator.py",
    "backend/app/youtube_notes.py",
    "backend/app/pdf_translator.py",
]

groq_import = "from backend.app.groq_client import chat as groq_chat\n"

for filepath in files:
    if not os.path.exists(filepath):
        print(f"SKIP: {filepath}")
        continue

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Replace imports
    content = content.replace(
        "from langchain_ollama import OllamaLLM, OllamaEmbeddings",
        groq_import
    )
    content = content.replace(
        "from langchain_ollama import OllamaLLM",
        groq_import
    )

    # Remove llm = OllamaLLM lines
    lines = content.split("\n")
    new_lines = []
    for line in lines:
        if "llm = OllamaLLM" in line:
            continue
        # Replace llm.invoke(prompt) with groq_chat(prompt)
        line = line.replace("llm.invoke(", "groq_chat(")
        new_lines.append(line)

    content = "\n".join(new_lines)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"FIXED: {filepath}")

print("\nAll done!")