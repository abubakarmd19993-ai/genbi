import io
import fitz
from backend.app.groq_client import translate_text as groq_translate
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime


SUPPORTED_LANGUAGES = {
    "hindi": "Hindi",
    "arabic": "Arabic",
    "telugu": "Telugu",
    "urdu": "Urdu",
    "french": "French",
    "german": "German",
    "spanish": "Spanish",
    "chinese": "Chinese",
    "japanese": "Japanese",
    "korean": "Korean",
    "tamil": "Tamil",
    "marathi": "Marathi",
    "kannada": "Kannada",
    "malayalam": "Malayalam",
    "odia": "Odia",
    "punjabi": "Punjabi",
    "bengali": "Bengali",
    "gujarati": "Gujarati",
    "assamese": "Assamese",
    "sanskrit": "Sanskrit",
    "konkani": "Konkani",
    "tulu": "Tulu",
    "portuguese": "Portuguese",
    "italian": "Italian",
    "russian": "Russian",
    "turkish": "Turkish",
    "dutch": "Dutch",
}
def extract_pdf_text(contents: bytes) -> tuple:
    try:
        pdf_doc = fitz.open(stream=contents, filetype="pdf")
        pages_text = []
        for page_num in range(len(pdf_doc)):
            page = pdf_doc[page_num]
            text = page.get_text()
            if text.strip():
                pages_text.append({
                    "page": page_num + 1,
                    "text": text
                })
        pdf_doc.close()
        if not pages_text:
            raise ValueError("No text found in PDF.")
        return pages_text, len(pages_text)
    except Exception as e:
        raise ValueError(f"Could not extract PDF text: {str(e)}")

def translate_text(text: str, target_language: str) -> str:
    language_name = SUPPORTED_LANGUAGES.get(target_language.lower(), target_language)
    try:
        return groq_translate(text, language_name)
    except Exception as e:
        return f"Translation error: {str(e)}"
    language_name = SUPPORTED_LANGUAGES.get(target_language.lower(), target_language)
    prompt = f"""You are a professional translator. Translate this English text to {language_name}.

Rules:
- Return ONLY the translated text
- Keep numbers and dates as they are
- Do not add any explanation or notes

English text to translate:
{text[:2500]}

{language_name} translation:"""

    result = groq_chat(prompt)

    # If translation fails return original
    if not result or len(result.strip()) < 10:
        return text

    return result

def create_translated_pdf(
    pages_text: list,
    target_language: str,
    original_filename: str,
    username: str
) -> bytes:
    language_name = SUPPORTED_LANGUAGES.get(target_language.lower(), target_language)
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        rightMargin=0.75*inch, leftMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch
    )

    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle("Title",
        fontSize=20, textColor=colors.HexColor("#3B82F6"),
        alignment=TA_CENTER, spaceAfter=6, fontName="Helvetica-Bold")
    subtitle_style = ParagraphStyle("Subtitle",
        fontSize=10, textColor=colors.HexColor("#6B7280"),
        alignment=TA_CENTER, spaceAfter=4)
    heading_style = ParagraphStyle("Heading",
        fontSize=13, textColor=colors.HexColor("#1e3a5f"),
        spaceBefore=14, spaceAfter=6, fontName="Helvetica-Bold")
    body_style = ParagraphStyle("Body",
        fontSize=10, textColor=colors.HexColor("#374151"),
        spaceAfter=5, leading=16)

    # Header
    story.append(Paragraph("GenBI PDF Translator", title_style))
    story.append(Paragraph(f"Translated to: {language_name}", subtitle_style))
    story.append(Paragraph(
        f"Original: {original_filename} | By: {username} | {datetime.now().strftime('%B %d, %Y')}",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=2,
        color=colors.HexColor("#3B82F6"), spaceAfter=16))
    story.append(Spacer(1, 8))

    # Translate each page
    for page_data in pages_text:
        story.append(Paragraph(f"--- Page {page_data['page']} ---", heading_style))

        translated = translate_text(page_data["text"], target_language)

        for line in translated.split("\n"):
            line = line.strip()
            if not line:
                story.append(Spacer(1, 4))
                continue
            try:
                # Try to add paragraph - handle encoding
                clean = line.encode("latin-1", "replace").decode("latin-1")
                story.append(Paragraph(clean, body_style))
            except Exception:
                try:
                    story.append(Paragraph(line.encode("ascii", "ignore").decode("ascii"), body_style))
                except:
                    pass

        story.append(HRFlowable(width="100%", thickness=0.5,
            color=colors.HexColor("#e5e7eb"), spaceBefore=8, spaceAfter=8))

    # Footer
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=1,
        color=colors.HexColor("#3B82F6")))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        f"Translated by GenBI AI | Original: {original_filename}",
        subtitle_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()

def translate_pdf(
    contents: bytes,
    filename: str,
    target_language: str,
    username: str
) -> tuple:
    pages_text, page_count = extract_pdf_text(contents)
    pdf_bytes = create_translated_pdf(
        pages_text, target_language, filename, username
    )
    return pdf_bytes, page_count