from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
import pandas as pd
import io

# Initialize embedding model and LLM
embeddings = OllamaEmbeddings(model="nomic-embed-text")
llm = OllamaLLM(model="llama3.2")

# ChromaDB storage path
CHROMA_PATH = "chroma_db"

def dataframe_to_documents(df: pd.DataFrame, filename: str):
    """Convert each row of a DataFrame into a LangChain Document."""
    docs = []
    for i, row in df.iterrows():
        content = "\n".join([f"{col}: {row[col]}" for col in df.columns])
        docs.append(Document(
            page_content=content,
            metadata={"source": filename, "row": i}
        ))
    return docs

def get_vectorstore(collection_name: str):
    """Get or create a ChromaDB collection."""
    return Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=CHROMA_PATH
    )

async def ingest_file(contents: bytes, filename: str, file_id: str):
    """Chunk a file and store embeddings in ChromaDB."""
    if filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(contents))
    else:
        df = pd.read_excel(io.BytesIO(contents))

    # Convert rows to documents
    docs = dataframe_to_documents(df, filename)

    # Split into chunks
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_documents(docs)

    # Store in ChromaDB
    vectorstore = get_vectorstore(file_id)
    vectorstore.add_documents(chunks)

    return len(chunks)

async def query_file(question: str, file_id: str):
    """Retrieve relevant chunks and generate an answer."""
    vectorstore = get_vectorstore(file_id)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

    # Get relevant chunks
    relevant_docs = retriever.invoke(question)
    context = "\n\n".join([doc.page_content for doc in relevant_docs])

    # Build prompt
    prompt = f"""You are a data analyst assistant. Use the following data to answer the question.

Data:
{context}

Question: {question}

Answer:"""

    # Generate answer
    answer = llm.invoke(prompt)
    return {"answer": answer, "context": context}