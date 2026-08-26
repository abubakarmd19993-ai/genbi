from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from backend.app.groq_client import chat as groq_chat
from sentence_transformers import SentenceTransformer
from langchain.embeddings.base import Embeddings
import pandas as pd
import io
import os

class LocalEmbeddings(Embeddings):
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def embed_documents(self, texts):
        return self.model.encode(texts).tolist()

    def embed_query(self, text):
        return self.model.encode([text])[0].tolist()

embeddings = LocalEmbeddings()

CHROMA_PATH = "./chroma_db"

def get_vectorstore(file_id: str):
    return Chroma(
        collection_name=f"file_{file_id}",
        embedding_function=embeddings,
        persist_directory=CHROMA_PATH,
    )

async def ingest_file(contents: bytes, filename: str, file_id: str) -> int:
    try:
        if filename.endswith(".csv"):
            try:
                df = pd.read_csv(io.BytesIO(contents))
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")
        else:
            df = pd.read_excel(io.BytesIO(contents))

        text = df.to_string(index=False)
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = splitter.create_documents([text])
        vectorstore = get_vectorstore(file_id)
        vectorstore.add_documents(chunks)
        return len(chunks)
    except Exception as e:
        print(f"Ingest error: {e}")
        return 0

async def query_file(question: str, file_id: str) -> dict:
    try:
        vectorstore = get_vectorstore(file_id)
        docs = vectorstore.similarity_search(question, k=4)
        context = "\n".join([doc.page_content for doc in docs])
        prompt = f"""You are a data analyst. Answer the question based on this data:

{context}

Question: {question}

Give a clear, concise answer with specific numbers where available."""
        answer = groq_chat(prompt)
        return {"answer": answer, "context": context}
    except Exception as e:
        return {"answer": f"Error: {str(e)}", "context": ""}