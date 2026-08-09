import io
import json
import fitz
import pytesseract
from PIL import Image
from langchain_ollama import OllamaLLM
from datetime import datetime
import re

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
llm = OllamaLLM(model="llama3.2")

def extract_text_from_invoice(contents: bytes, filename: str) -> str:
    """Extract text from PDF or image invoice."""
    try:
        if filename.lower().endswith(".pdf"):
            pdf_doc = fitz.open(stream=contents, filetype="pdf")
            text = ""
            for page in pdf_doc:
                text += page.get_text()
            pdf_doc.close()
            if text.strip():
                return text
            # If PDF has no text, try OCR on first page
            pdf_doc = fitz.open(stream=contents, filetype="pdf")
            page = pdf_doc[0]
            pix = page.get_pixmap()
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            return pytesseract.image_to_string(img)
        else:
            # Image file
            image = Image.open(io.BytesIO(contents))
            if image.mode != "RGB":
                image = image.convert("RGB")
            return pytesseract.image_to_string(image, config="--psm 6")
    except Exception as e:
        raise ValueError(f"Could not extract text: {str(e)}")

def parse_invoice_with_llm(raw_text: str) -> dict:
    """Use LLM to extract structured invoice data."""
    prompt = f"""You are an expert invoice parser. Extract all information from this invoice text.

INVOICE TEXT:
{raw_text[:3000]}

Return a JSON object with EXACTLY these fields (use null if not found):
{{
  "invoice_number": "string or null",
  "invoice_date": "string or null",
  "due_date": "string or null",
  "vendor_name": "string or null",
  "vendor_address": "string or null",
  "vendor_email": "string or null",
  "vendor_phone": "string or null",
  "client_name": "string or null",
  "client_address": "string or null",
  "line_items": [
    {{
      "description": "string",
      "quantity": number or null,
      "unit_price": number or null,
      "total": number or null
    }}
  ],
  "subtotal": number or null,
  "tax_rate": number or null,
  "tax_amount": number or null,
  "discount": number or null,
  "total_amount": number or null,
  "currency": "string or null",
  "payment_terms": "string or null",
  "notes": "string or null"
}}

Return ONLY the JSON. No explanation. No markdown."""

    result = llm.invoke(prompt)

    # Clean JSON
    try:
        # Remove markdown if present
        result = result.strip()
        if result.startswith("```"):
            result = re.sub(r"```json\n?|```\n?", "", result).strip()
        return json.loads(result)
    except:
        # Return basic structure if parsing fails
        return {
            "invoice_number": None,
            "invoice_date": None,
            "due_date": None,
            "vendor_name": None,
            "vendor_address": None,
            "vendor_email": None,
            "vendor_phone": None,
            "client_name": None,
            "client_address": None,
            "line_items": [],
            "subtotal": None,
            "tax_rate": None,
            "tax_amount": None,
            "discount": None,
            "total_amount": None,
            "currency": None,
            "payment_terms": None,
            "notes": None,
            "raw_text": raw_text[:500]
        }

def generate_invoice_summary(data: dict) -> str:
    """Generate a human-readable summary."""
    lines = []
    if data.get("vendor_name"):
        lines.append(f"Vendor: {data['vendor_name']}")
    if data.get("invoice_number"):
        lines.append(f"Invoice #: {data['invoice_number']}")
    if data.get("invoice_date"):
        lines.append(f"Date: {data['invoice_date']}")
    if data.get("due_date"):
        lines.append(f"Due: {data['due_date']}")
    if data.get("total_amount"):
        currency = data.get("currency", "$")
        lines.append(f"Total: {currency}{data['total_amount']}")
    if data.get("line_items"):
        lines.append(f"Items: {len(data['line_items'])} line items")
    return " · ".join(lines) if lines else "Invoice processed"

def process_invoice(contents: bytes, filename: str, username: str) -> dict:
    """Main invoice processing pipeline."""
    raw_text = extract_text_from_invoice(contents, filename)
    if not raw_text.strip():
        raise ValueError("No text found in invoice.")

    invoice_data = parse_invoice_with_llm(raw_text)
    summary = generate_invoice_summary(invoice_data)

    return {
        "filename": filename,
        "processed_by": username,
        "processed_at": datetime.now().strftime("%B %d, %Y %H:%M"),
        "summary": summary,
        "invoice_data": invoice_data,
        "raw_text_preview": raw_text[:300]
    }