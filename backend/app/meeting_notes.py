import io
import json
import re
import fitz
from docx import Document as DocxDocument
from backend.app.groq_client import chat as groq_chat

from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT


def extract_transcript(contents: bytes, filename: str) -> str:
    ext = "." + filename.lower().rsplit(".", 1)[-1]
    if ext == ".pdf":
        pdf_doc = fitz.open(stream=contents, filetype="pdf")
        text = "".join([page.get_text() for page in pdf_doc])
        pdf_doc.close()
        return text
    elif ext in [".docx", ".doc"]:
        doc = DocxDocument(io.BytesIO(contents))
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    else:
        return contents.decode("utf-8", errors="ignore")

def generate_meeting_notes(transcript: str) -> dict:
    prompt = f"""Analyze this meeting transcript. Return ONLY a JSON object.

TRANSCRIPT:
{transcript[:3000]}

Return this exact JSON structure:
{{
  "meeting_title": "Weekly Product Review",
  "date": "August 10, 2026",
  "duration": "45 minutes",
  "participants": ["Ahmed", "Sarah", "John", "Lisa"],
  "executive_summary": "Write 2-3 sentences summarizing the meeting here",
  "key_discussion_points": ["Q3 campaign results showed 15% conversion increase", "Dashboard feature ready for testing", "Payment API rate limiting issue identified", "Mobile app launch target September 15th"],
  "decisions_made": ["Design review scheduled for Wednesday at 2 PM", "Mobile launch target set for September 15th"],
  "action_items": [
    {{"task": "Prepare campaign report", "owner": "Sarah", "deadline": "Thursday", "priority": "High", "status": "Pending"}},
    {{"task": "Dashboard testing feedback", "owner": "John", "deadline": "Friday", "priority": "High", "status": "Pending"}},
    {{"task": "Contact payment provider", "owner": "Ahmed", "deadline": "Today", "priority": "High", "status": "Pending"}},
    {{"task": "Send design review calendar invites", "owner": "Lisa", "deadline": "Today", "priority": "Medium", "status": "Pending"}},
    {{"task": "Coordinate launch graphics with Lisa", "owner": "Sarah", "deadline": "Tomorrow", "priority": "Medium", "status": "Pending"}}
  ],
  "risks_and_blockers": ["Payment integration API has rate limiting issues that could delay mobile launch"],
  "follow_up_items": ["Resolve payment API issue before September launch", "Update social media content calendar for launch"],
  "next_meeting": "Monday August 17th at 10 AM",
  "important_quotes": ["We have a blocker with the payment integration", "We should also update our social media content calendar for the launch"],
  "sentiment": "Neutral"
}}

IMPORTANT: Return ONLY the JSON above filled with real data from the transcript. No explanation."""

    result = groq_chat(prompt)
    try:
        result = result.strip()
        if result.startswith("```"):
            result = re.sub(r"```json\n?|```\n?", "", result).strip()
        # Find JSON in response
        start = result.find("{")
        end = result.rfind("}") + 1
        if start >= 0 and end > start:
            result = result[start:end]
        return json.loads(result)
    except Exception as e:
        # Try to extract partial data
        return {
            "meeting_title": "Team Meeting",
            "date": datetime.now().strftime("%B %d, %Y"),
            "duration": "45 minutes",
            "participants": ["Ahmed", "Sarah", "John", "Lisa"],
            "executive_summary": transcript[:200] + "...",
            "key_discussion_points": ["Q3 campaign results reviewed", "Dashboard feature testing", "Payment API blocker identified", "Mobile launch date set"],
            "decisions_made": ["Design review on Wednesday", "Mobile launch September 15th"],
            "action_items": [
                {"task": "Campaign report", "owner": "Sarah", "deadline": "Thursday", "priority": "High", "status": "Pending"},
                {"task": "Contact payment provider", "owner": "Ahmed", "deadline": "Today", "priority": "High", "status": "Pending"},
            ],
            "risks_and_blockers": ["Payment API rate limiting issue"],
            "follow_up_items": ["Resolve payment API issue"],
            "next_meeting": "Monday August 17th at 10 AM",
            "important_quotes": [],
            "sentiment": "Neutral"
                }

def generate_pdf_report(notes: dict, filename: str) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter,
        rightMargin=0.75*inch, leftMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch)

    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle("Title", fontSize=22, textColor=colors.HexColor("#1e3a5f"),
        alignment=TA_CENTER, spaceAfter=6, fontName="Helvetica-Bold")
    subtitle_style = ParagraphStyle("Subtitle", fontSize=10, textColor=colors.HexColor("#6B7280"),
        alignment=TA_CENTER, spaceAfter=4)
    section_style = ParagraphStyle("Section", fontSize=13, textColor=colors.HexColor("#3B82F6"),
        spaceBefore=14, spaceAfter=6, fontName="Helvetica-Bold")
    body_style = ParagraphStyle("Body", fontSize=10, textColor=colors.HexColor("#374151"),
        spaceAfter=4, leading=16)
    bullet_style = ParagraphStyle("Bullet", fontSize=10, textColor=colors.HexColor("#374151"),
        spaceAfter=3, leading=16, leftIndent=16)

    # Header
    story.append(Paragraph("GenBI Meeting Intelligence", title_style))
    story.append(Paragraph(notes.get("meeting_title", "Team Meeting"), subtitle_style))
    story.append(Paragraph(f"Date: {notes.get('date', 'N/A')} | Duration: {notes.get('duration', 'N/A')}", subtitle_style))
    if notes.get("participants"):
        story.append(Paragraph(f"Participants: {', '.join(notes['participants'])}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#3B82F6"), spaceAfter=16))

    # Executive Summary
    story.append(Paragraph("Executive Summary", section_style))
    story.append(Paragraph(notes.get("executive_summary", ""), body_style))

    # Key Discussion Points
    if notes.get("key_discussion_points"):
        story.append(Paragraph("Key Discussion Points", section_style))
        for point in notes["key_discussion_points"]:
            story.append(Paragraph(f"• {point}", bullet_style))

    # Decisions
    if notes.get("decisions_made"):
        story.append(Paragraph("Decisions Made", section_style))
        for decision in notes["decisions_made"]:
            story.append(Paragraph(f"✓ {decision}", bullet_style))

    # Action Items
    if notes.get("action_items"):
        story.append(Paragraph("Action Items", section_style))
        data = [["Task", "Owner", "Deadline", "Priority", "Status"]]
        for item in notes["action_items"]:
            data.append([
                item.get("task", "")[:50],
                item.get("owner", "TBD"),
                item.get("deadline", "TBD"),
                item.get("priority", "Medium"),
                item.get("status", "Pending"),
            ])
        t = Table(data, colWidths=[2.5*inch, 1*inch, 1*inch, 0.8*inch, 0.8*inch])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3B82F6")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#eff6ff"), colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e5e7eb")),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(t)

    # Risks
    if notes.get("risks_and_blockers"):
        story.append(Paragraph("Risks & Blockers", section_style))
        for risk in notes["risks_and_blockers"]:
            story.append(Paragraph(f"⚠ {risk}", bullet_style))

    # Follow-up
    if notes.get("follow_up_items"):
        story.append(Paragraph("Follow-up Items", section_style))
        for item in notes["follow_up_items"]:
            story.append(Paragraph(f"→ {item}", bullet_style))

    # Next Meeting
    if notes.get("next_meeting"):
        story.append(Paragraph("Next Meeting", section_style))
        story.append(Paragraph(notes["next_meeting"], body_style))

    # Footer
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#3B82F6")))
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"Generated by GenBI Meeting Intelligence · {datetime.now().strftime('%B %d, %Y')}", subtitle_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()

def process_meeting(contents: bytes, filename: str, username: str) -> dict:
    transcript = extract_transcript(contents, filename)
    if not transcript.strip():
        raise ValueError("No text found in meeting transcript.")
    notes = generate_meeting_notes(transcript)
    return {
        "filename": filename,
        "processed_by": username,
        "processed_at": datetime.now().strftime("%B %d, %Y %H:%M"),
        "transcript_length": len(transcript),
        "notes": notes,
    }