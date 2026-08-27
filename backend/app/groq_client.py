import os
from groq import Groq

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def chat(prompt: str, system: str = "You are a helpful AI assistant.") -> str:
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
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
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
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