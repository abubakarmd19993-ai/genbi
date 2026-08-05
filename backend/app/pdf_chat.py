import io
import fitz  # pymupdf
import numpy as np
from langchain_ollama import OllamaLLM, OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
import chromadb
from datetime import datetime

llm = OllamaLLM(model="llama3.2")
embeddings = OllamaEmbeddings(model="nomic-embed-text")

def extract_pdf_text(contents: bytes) -> str:
    """Extract text from PDF using PyMuPDF."""
    try:
        pdf_doc = fitz.open(stream=contents, filetype="pdf")
        full_text = ""
        for page_num in range(len(pdf_doc)):
            page = pdf_doc[page_num]
            text = page.get_text()
            if text.strip():
                full_text += f"\n[Page {page_num + 1}]\n{text}"
        pdf_doc.close()
        if not full_text.strip():
            raise ValueError("No text found in PDF. The PDF may be scanned/image-based.")
        return full_text
    except Exception as e:
        raise ValueError(f"Could not extract text from PDF: {str(e)}")

def ingest_pdf(contents: bytes, filename: str, file_id: str) -> int:
    """Chunk and embed PDF content into ChromaDB."""
    text = extract_pdf_text(contents)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    chunks = splitter.split_text(text)

    docs = [
        Document(
            page_content=chunk,
            metadata={"source": filename, "file_id": file_id, "chunk": i}
        )
        for i, chunk in enumerate(chunks)
    ]

    collection_name = f"pdf_{file_id[:20].replace('-', '_')}"

    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory="./chroma_db"
    )
    vectorstore.add_documents(docs)

    return len(docs)

def query_pdf(question: str, file_id: str) -> dict:
    """Query PDF using RAG."""
    collection_name = f"pdf_{file_id[:20].replace('-', '_')}"

    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory="./chroma_db"
    )

    # Retrieve relevant chunks
    retriever = vectorstore.as_retriever(search_kwargs={"k": 4})
    relevant_docs = retriever.invoke(question)
    context = "\n\n".join([doc.page_content for doc in relevant_docs])

    prompt = f"""You are an expert document analyst. Answer the question based on the PDF content below.

PDF CONTENT:
{context}

QUESTION: {question}

Provide a clear, accurate, and detailed answer based only on the PDF content above.
If the answer is not in the PDF, say "This information is not found in the PDF."
"""

    answer = llm.invoke(prompt)

    return {
        "question": question,
        "answer": answer,
        "context_chunks": len(relevant_docs),
        "sources": [doc.metadata.get("source", "") for doc in relevant_docs]
    }

def get_pdf_summary(contents: bytes, filename: str) -> dict:
    """Generate a quick summary of the PDF."""
    text = extract_pdf_text(contents)

    # Truncate for LLM
    sample = text[:4000] if len(text) > 4000 else text

    prompt = f"""Analyze this PDF document and provide:

1. DOCUMENT TYPE (report, research paper, invoice, manual, etc.)
2. MAIN TOPIC (2-3 sentences)
3. KEY POINTS (5 bullet points)
4. DOCUMENT STATS

PDF Content:
{sample}

Be concise and professional."""

    summary = llm.invoke(prompt)

    # Count pages
    pdf_doc = fitz.open(stream=contents, filetype="pdf")
    page_count = len(pdf_doc)
    pdf_doc.close()

    return {
        "filename": filename,
        "pages": page_count,
        "characters": len(text),
        "words": len(text.split()),
        "summary": summary
    }