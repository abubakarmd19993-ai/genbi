import os
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def chat(prompt: str, system: str = "You are a helpful AI assistant.", model: str = "llama-3.3-70b-versatile") -> str:
    """Send a prompt to Groq and get a response."""
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2048,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"AI Error: {str(e)}"

def translate_text(text: str, target_language: str) -> str:
    """Translate text to target language using Groq."""
    try:
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": f"You are a professional translator. Translate the following text to {target_language}. Return only the translated text, nothing else."},
                {"role": "user", "content": text}
            ],
            max_tokens=4096,
            temperature=0.3,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Translation Error: {str(e)}"