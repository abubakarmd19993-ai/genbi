import io
import json
import re
import fitz
from langchain_ollama import OllamaLLM
from datetime import datetime
 
llm = OllamaLLM(model="llama3.2")
 
def extract_text_from_resume(contents: bytes, filename: str) -> str:
    """Extract text from PDF, DOCX or text resume."""
    try:
        if filename.lower().endswith(".pdf"):
            pdf_doc = fitz.open(stream=contents, filetype="pdf")
            text = ""
            for page in pdf_doc:
                text += page.get_text()
            pdf_doc.close()
            return text
        elif filename.lower().endswith(".docx"):
            import docx
            doc = docx.Document(io.BytesIO(contents))
            text = "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
            return text
        else:
            return contents.decode("utf-8", errors="ignore")
    except Exception as e:
        raise ValueError(f"Could not extract text: {str(e)}")
 
def parse_resume_with_llm(raw_text: str) -> dict:
    """Use LLM to extract structured resume data."""
    prompt = f"""You are an expert HR resume parser. Extract all information from this resume.
 
RESUME TEXT:
{raw_text[:4000]}
 
Return a JSON object with EXACTLY these fields (use null if not found):
{{
  "full_name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "linkedin": "string or null",
  "github": "string or null",
  "summary": "string or null",
  "total_experience_years": number or null,
  "current_role": "string or null",
  "current_company": "string or null",
  "domain": "string (Data Science/Web Development/AI ML/Analytics/Finance/Marketing/Other)",
  "seniority": "string (Fresher/Junior/Mid/Senior/Lead)",
  "skills": ["list of all skills"],
  "technical_skills": ["list of technical skills only"],
  "soft_skills": ["list of soft skills only"],
  "education": [
    {{
      "degree": "string",
      "institution": "string",
      "year": "string or null",
      "grade": "string or null"
    }}
  ],
  "experience": [
    {{
      "role": "string",
      "company": "string",
      "duration": "string",
      "description": "string or null"
    }}
  ],
  "projects": [
    {{
      "name": "string",
      "description": "string",
      "technologies": ["list"]
    }}
  ],
  "certifications": ["list"],
  "languages": ["list"],
  "achievements": ["list"]
}}
 
Return ONLY the JSON. No explanation. No markdown."""
 
    result = llm.invoke(prompt)
    try:
        result = result.strip()
        if result.startswith("```"):
            result = re.sub(r"```json\n?|```\n?", "", result).strip()
        return json.loads(result)
    except:
        return {
            "full_name": None, "email": None, "phone": None,
            "location": None, "linkedin": None, "github": None,
            "summary": None, "total_experience_years": None,
            "current_role": None, "current_company": None,
            "domain": "Other", "seniority": "Fresher",
            "skills": [], "technical_skills": [], "soft_skills": [],
            "education": [], "experience": [], "projects": [],
            "certifications": [], "languages": [], "achievements": [],
        }
 
def calculate_ats_score(data: dict) -> dict:
    """Calculate ATS compatibility score."""
    score = 0
    feedback = []
    improvements = []
 
    # Contact info (20 pts)
    if data.get("full_name"): score += 5
    else: improvements.append("Add your full name")
    if data.get("email"): score += 5
    else: improvements.append("Add email address")
    if data.get("phone"): score += 5
    else: improvements.append("Add phone number")
    if data.get("linkedin"): score += 5
    else: improvements.append("Add LinkedIn profile URL")
 
    # Summary (10 pts)
    if data.get("summary"):
        score += 10
        feedback.append("Professional summary present")
    else:
        improvements.append("Add a professional summary")
 
    # Skills (20 pts)
    skills = data.get("skills", []) + data.get("technical_skills", [])
    if len(skills) >= 10: score += 20; feedback.append(f"Strong skills section ({len(skills)} skills)")
    elif len(skills) >= 5: score += 10; improvements.append("Add more skills")
    else: improvements.append("Add technical skills section")
 
    # Experience (25 pts)
    exp = data.get("experience", [])
    if len(exp) >= 3: score += 25; feedback.append(f"Good work experience ({len(exp)} roles)")
    elif len(exp) >= 1: score += 12; improvements.append("Add more work experience details")
    else: improvements.append("Add work experience")
 
    # Education (15 pts)
    if data.get("education"):
        score += 15; feedback.append("Education section present")
    else:
        improvements.append("Add education details")
 
    # Projects (10 pts)
    projects = data.get("projects", [])
    if len(projects) >= 2: score += 10; feedback.append(f"{len(projects)} projects listed")
    elif len(projects) >= 1: score += 5
    else: improvements.append("Add portfolio projects")
 
    level = "Excellent" if score >= 80 else "Good" if score >= 60 else "Average" if score >= 40 else "Needs Work"
    color = "#22c55e" if score >= 80 else "#3B82F6" if score >= 60 else "#fbbf24" if score >= 40 else "#ef4444"
 
    return {
        "score": score,
        "level": level,
        "color": color,
        "feedback": feedback,
        "improvements": improvements,
    }
 
def process_resume(contents: bytes, filename: str, username: str) -> dict:
    """Main resume processing pipeline."""
    raw_text = extract_text_from_resume(contents, filename)
    if not raw_text.strip():
        raise ValueError("No text found in resume.")
 
    resume_data = parse_resume_with_llm(raw_text)
    ats_score = calculate_ats_score(resume_data)
 
    return {
        "filename": filename,
        "processed_by": username,
        "processed_at": datetime.now().strftime("%B %d, %Y %H:%M"),
        "resume_data": resume_data,
        "ats_score": ats_score,
        "raw_text_preview": raw_text[:5000]
    }
 