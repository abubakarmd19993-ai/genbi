from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import pandas as pd
import io

# Initialize embedding model and LLM
embeddings = OllamaEmbeddings(model="nomic-embed-text")

# ChromaDB storage path
CHROMA_PATH = "chroma_db"

# Configurable RAG settings
TOP_K = 4
MAX_CONTEXT_CHARS = 3000
MAX_ROWS_RETURNED = 500
MAX_EMBED_ROWS = 200

def read_dataframe(contents: bytes, filename: str) -> pd.DataFrame:
    if filename.endswith(".csv"):
        try:
            return pd.read_csv(io.BytesIO(contents))
        except UnicodeDecodeError:
            return pd.read_csv(io.BytesIO(contents), encoding="latin-1")
    else:
        return pd.read_excel(io.BytesIO(contents))

def generate_smart_summary(df: pd.DataFrame, filename: str) -> str:
    """Generate a compact summary instead of embedding all rows."""
    rows, cols = df.shape
    summary = f"Dataset: {filename}\n"
    summary += f"Total rows: {rows}, Columns: {cols}\n"
    summary += f"Columns: {', '.join(df.columns.tolist())}\n\n"

    # Numeric stats
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    if numeric_cols:
        summary += "Numeric Statistics:\n"
        for col in numeric_cols[:8]:
            try:
                summary += f"  {col}: min={df[col].min():.2f}, max={df[col].max():.2f}, mean={df[col].mean():.2f}, sum={df[col].sum():.2f}\n"
            except Exception:
                pass

    # Categorical summaries
    cat_cols = df.select_dtypes(include="object").columns.tolist()
    if cat_cols:
        summary += "\nTop Categories:\n"
        for col in cat_cols[:5]:
            try:
                top = df[col].value_counts().head(5).to_dict()
                summary += f"  {col}: {top}\n"
            except Exception:
                pass

    # Sample rows
    summary += f"\nSample Data (first 5 rows):\n"
    summary += df.head(5).to_string(index=False)

    return summary[:MAX_CONTEXT_CHARS * 2]

def dataframe_to_smart_documents(df: pd.DataFrame, filename: str) -> list:
    """Convert DataFrame to smart documents — NOT row by row."""
    docs = []

    # Document 1: Full dataset summary
    summary = generate_smart_summary(df, filename)
    docs.append(Document(
        page_content=summary,
        metadata={"source": filename, "type": "summary"}
    ))

    # Document 2: Column descriptions
    col_desc = f"Dataset columns in {filename}:\n"
    for col in df.columns:
        dtype = str(df[col].dtype)
        missing = df[col].isnull().sum()
        unique = df[col].nunique()
        col_desc += f"- {col} ({dtype}): {unique} unique values, {missing} missing\n"
    docs.append(Document(
        page_content=col_desc,
        metadata={"source": filename, "type": "columns"}
    ))

    # Document 3-N: Only sample rows (NOT all rows!)
    sample_size = min(MAX_EMBED_ROWS, len(df))
    sample_df = df.sample(n=sample_size, random_state=42) if len(df) > sample_size else df

    # Group rows into chunks of 10
    chunk_size = 10
    for i in range(0, len(sample_df), chunk_size):
        chunk = sample_df.iloc[i:i+chunk_size]
        content = f"Data rows {i+1} to {i+len(chunk)}:\n"
        content += chunk.to_string(index=False)
        docs.append(Document(
            page_content=content,
            metadata={"source": filename, "type": "data", "chunk": i}
        ))

    return docs

def get_vectorstore(collection_name: str):
    return Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=CHROMA_PATH
    )

async def ingest_file(contents: bytes, filename: str, file_id: str):
    """Smart ingestion — embeds summaries and samples NOT all rows."""
    df = read_dataframe(contents, filename)

    # Use smart documents instead of row-by-row
    docs = dataframe_to_smart_documents(df, filename)

    # Split into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    chunks = splitter.split_documents(docs)

    # Store in ChromaDB
    vectorstore = get_vectorstore(file_id)
    vectorstore.add_documents(chunks)

    return len(chunks)

async def query_file(question: str, file_id: str):
    """Retrieve relevant chunks and generate answer — optimized."""
    vectorstore = get_vectorstore(file_id)
    retriever = vectorstore.as_retriever(
        search_kwargs={"k": TOP_K}
    )

    # Get relevant chunks
    relevant_docs = retriever.invoke(question)

    # Limit context size
    context_parts = []
    total_chars = 0
    for doc in relevant_docs:
        if total_chars + len(doc.page_content) > MAX_CONTEXT_CHARS:
            break
        context_parts.append(doc.page_content)
        total_chars += len(doc.page_content)

    context = "\n\n".join(context_parts)

    # Build optimized prompt
    prompt = f"""You are a data analyst. Answer based on the dataset information below.

Dataset Context:
{context}

Question: {question}

Provide a clear, accurate answer based only on the data above. If you cannot answer from the data, say so.
Answer:"""

    answer = groq_chat(prompt)
    return {
        "answer": answer,
        "context": context[:500],
        "chunks_used": len(context_parts)
    }