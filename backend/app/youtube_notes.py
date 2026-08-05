import io
import re
import subprocess
import json
from langchain_ollama import OllamaLLM
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from datetime import datetime

llm = OllamaLLM(model="llama3.2")

def extract_video_id(url: str) -> str:
    patterns = [
        r"(?:v=|\/)([0-9A-Za-z_-]{11}).*",
        r"(?:youtu\.be\/)([0-9A-Za-z_-]{11})",
        r"(?:embed\/)([0-9A-Za-z_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError("Invalid YouTube URL.")

def get_transcript_ytdlp(video_url: str) -> str:
    """Get transcript using yt-dlp."""
    try:
        cmd = [
            "yt-dlp",
            "--write-auto-sub",
            "--sub-lang", "en",
            "--sub-format", "json3",
            "--skip-download",
            "--print", "%(subtitles)s %(automatic_captions)s",
            video_url
        ]

        # Try getting subtitles info
        result = subprocess.run(
            ["yt-dlp", "--write-auto-sub", "--sub-lang", "en",
             "--sub-format", "vtt", "--skip-download",
             "-o", "%(id)s", "--print-to-file", "url",
             "/dev/null", video_url],
            capture_output=True, text=True, timeout=30
        )

        # Alternative: get transcript via yt-dlp dump JSON
        result2 = subprocess.run(
            ["yt-dlp", "--dump-json", "--no-playlist", video_url],
            capture_output=True, text=True, timeout=30
        )

        if result2.returncode == 0:
            data = json.loads(result2.stdout)
            # Try to get description as fallback
            description = data.get("description", "")
            title = data.get("title", "")
            uploader = data.get("uploader", "")
            duration = data.get("duration_string", "")
            tags = ", ".join(data.get("tags", [])[:10])
            chapters = data.get("chapters", [])

            chapter_text = ""
            if chapters:
                chapter_text = "\n\nChapters:\n" + "\n".join(
                    [f"- {c.get('title', '')} ({c.get('start_time', 0):.0f}s)"
                     for c in chapters]
                )

            transcript = f"""Video Title: {title}
Channel: {uploader}
Duration: {duration}
Tags: {tags}
{chapter_text}

Description:
{description[:3000]}"""

            return transcript
        else:
            raise ValueError("Could not fetch video information.")

    except subprocess.TimeoutExpired:
        raise ValueError("Request timed out. Please try again.")
    except Exception as e:
        raise ValueError(f"Could not get video info: {str(e)}")

def generate_notes(transcript: str, video_url: str) -> dict:
    max_chars = 3000
    if len(transcript) > max_chars:
        transcript_sample = transcript[:max_chars] + "..."
    else:
        transcript_sample = transcript

    notes_prompt = f"""You are an expert academic note-taker. Create comprehensive study notes from this YouTube video information.

VIDEO INFORMATION:
{transcript_sample}

Generate DETAILED study notes with these EXACT sections:

## 📚 TOPIC OVERVIEW
Write 3-4 sentences summarizing what this video is about.

## 🎯 KEY CONCEPTS
List 8-10 key concepts. For each:
- **Concept Name**: Brief explanation (1-2 sentences)

## 📝 DETAILED NOTES
Write detailed notes organized by topic. Cover all major points.
Use bullet points for clarity.

## 💡 IMPORTANT DEFINITIONS
List 5-8 important terms/definitions.

## ⚡ QUICK REVISION POINTS
List 10 quick bullet points for fast revision.

## ❓ IMPORTANT QUESTIONS & ANSWERS
Generate 15 important questions with detailed answers.
Format: Q1: [question]
A1: [answer]

## 🔑 KEY TAKEAWAYS
List 5 main takeaways.

Be thorough, educational, and well-organized."""

    notes = llm.invoke(notes_prompt)
    return {"notes": notes, "transcript_length": len(transcript)}

def create_pdf(notes_content: str, video_url: str, username: str) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        rightMargin=0.75*inch, leftMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch
    )

    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle("Title",
        fontSize=24, textColor=colors.HexColor("#3B82F6"),
        alignment=TA_CENTER, spaceAfter=6, fontName="Helvetica-Bold")
    subtitle_style = ParagraphStyle("Subtitle",
        fontSize=11, textColor=colors.HexColor("#6B7280"),
        alignment=TA_CENTER, spaceAfter=4)
    heading_style = ParagraphStyle("Heading",
        fontSize=13, textColor=colors.HexColor("#1e3a5f"),
        spaceBefore=14, spaceAfter=6, fontName="Helvetica-Bold")
    body_style = ParagraphStyle("Body",
        fontSize=10, textColor=colors.HexColor("#374151"),
        spaceAfter=4, leading=15)
    qa_q_style = ParagraphStyle("QQ",
        fontSize=10, textColor=colors.HexColor("#1e3a5f"),
        spaceAfter=2, leading=14, fontName="Helvetica-Bold")
    qa_a_style = ParagraphStyle("QA",
        fontSize=10, textColor=colors.HexColor("#374151"),
        spaceAfter=8, leading=14)

    story.append(Paragraph("GenBI Study Notes", title_style))
    story.append(Paragraph("AI-Generated from YouTube", subtitle_style))
    story.append(Paragraph(f"Generated by: {username} | {datetime.now().strftime('%B %d, %Y')}", subtitle_style))
    story.append(Paragraph(f"Source: {video_url[:80]}{'...' if len(video_url) > 80 else ''}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#3B82F6"), spaceAfter=16))
    story.append(Spacer(1, 8))

    lines = notes_content.split("\n")
    in_qa = False

    for line in lines:
        line = line.strip()
        if not line:
            story.append(Spacer(1, 4))
            continue
        if line.startswith("## "):
            heading_text = line.replace("## ", "").strip()
            heading_text = heading_text.encode('ascii', 'ignore').decode('ascii')
            story.append(HRFlowable(width="100%", thickness=0.5,
                color=colors.HexColor("#e5e7eb"), spaceBefore=8, spaceAfter=4))
            story.append(Paragraph(heading_text, heading_style))
            in_qa = "QUESTION" in heading_text.upper()
        elif in_qa and re.match(r'^Q\d+:', line):
            clean = line.encode('ascii', 'ignore').decode('ascii')