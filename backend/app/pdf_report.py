import pandas as pd
import numpy as np
import io
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Circle
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.lineplots import LinePlot
from reportlab.graphics import renderPDF
from reportlab.graphics.widgets.markers import makeMarker
from backend.app.groq_client import chat as groq_chat

from datetime import datetime


COLORS_HEX = [
    colors.HexColor("#f78166"),
    colors.HexColor("#bc8cff"),
    colors.HexColor("#58a6ff"),
    colors.HexColor("#3fb950"),
    colors.HexColor("#ffa657"),
    colors.HexColor("#ff7b72"),
    colors.HexColor("#79c0ff"),
    colors.HexColor("#d2a8ff"),
]

def make_bar_chart(data, labels, title, width=450, height=200):
    """Create a bar chart drawing."""
    drawing = Drawing(width, height)

    bc = VerticalBarChart()
    bc.x = 50
    bc.y = 30
    bc.width = width - 70
    bc.height = height - 60
    bc.data = [data]
    bc.categoryAxis.categoryNames = [str(l)[:10] for l in labels]
    bc.categoryAxis.labels.angle = 30
    bc.categoryAxis.labels.fontSize = 8
    bc.categoryAxis.labels.dy = -10
    bc.valueAxis.labels.fontSize = 8
    bc.bars[0].fillColor = colors.HexColor("#f78166")
    bc.bars[0].strokeColor = colors.HexColor("#e06b52")

    title_str = String(width/2, height - 15, title,
                      fontSize=11, fillColor=colors.HexColor("#1f2937"),
                      textAnchor="middle", fontName="Helvetica-Bold")

    drawing.add(bc)
    drawing.add(title_str)
    return drawing

def make_pie_chart(data, labels, title, width=350, height=220):
    """Create a pie chart drawing."""
    drawing = Drawing(width, height)

    pie = Pie()
    pie.x = 80
    pie.y = 30
    pie.width = 140
    pie.height = 140
    pie.data = data
    pie.labels = [str(l)[:12] for l in labels]
    pie.sideLabels = True
    pie.simpleLabels = False
    pie.labelRadius = 1.2

    for i, color in enumerate(COLORS_HEX[:len(data)]):
        pie.slices[i].fillColor = color
        pie.slices[i].strokeColor = colors.white
        pie.slices[i].strokeWidth = 1

    title_str = String(width/2, height - 10, title,
                      fontSize=11, fillColor=colors.HexColor("#1f2937"),
                      textAnchor="middle", fontName="Helvetica-Bold")

    drawing.add(pie)
    drawing.add(title_str)
    return drawing

def make_line_chart(x_data, y_data, title, width=450, height=200):
    """Create a line chart drawing."""
    drawing = Drawing(width, height)

    lp = LinePlot()
    lp.x = 50
    lp.y = 30
    lp.width = width - 70
    lp.height = height - 60
    lp.data = [list(zip(range(len(y_data)), y_data))]
    lp.lines[0].strokeColor = colors.HexColor("#f78166")
    lp.lines[0].strokeWidth = 2
    lp.lines[0].symbol = makeMarker("Circle")
    lp.lines[0].symbol.size = 4
    lp.lines[0].symbol.fillColor = colors.HexColor("#f78166")
    lp.xValueAxis.labels.fontSize = 8
    lp.yValueAxis.labels.fontSize = 8

    title_str = String(width/2, height - 15, title,
                      fontSize=11, fillColor=colors.HexColor("#1f2937"),
                      textAnchor="middle", fontName="Helvetica-Bold")

    drawing.add(lp)
    drawing.add(title_str)
    return drawing

def make_heatmap(df, cat_col, num_cols, title, width=450, height=200):
    """Create a simple heatmap drawing."""
    drawing = Drawing(width, height)

    categories = df[cat_col].unique()[:6]
    cols = num_cols[:4]
    cell_w = min((width - 120) / len(cols), 80)
    cell_h = min((height - 60) / len(categories), 30)

    # Max value for normalization
    max_val = max([df[df[cat_col] == cat][col].sum()
                   for cat in categories for col in cols
                   if col in df.columns] or [1])

    for i, cat in enumerate(categories):
        label = String(5, height - 45 - i * cell_h,
                      str(cat)[:12], fontSize=7,
                      fillColor=colors.HexColor("#374151"))
        drawing.add(label)

        for j, col in enumerate(cols):
            if col in df.columns:
                val = df[df[cat_col] == cat][col].sum()
                intensity = min(val / max_val, 1.0)
                r = int(247 - intensity * 100)
                g = int(129 - intensity * 80)
                b = int(102 - intensity * 60)
                cell_color = colors.Color(r/255, g/255, b/255)

                rect = Rect(120 + j * cell_w, height - 50 - i * cell_h,
                           cell_w - 2, cell_h - 2,
                           fillColor=cell_color,
                           strokeColor=colors.white,
                           strokeWidth=1)
                drawing.add(rect)

                val_str = String(120 + j * cell_w + cell_w/2,
                                height - 50 - i * cell_h + cell_h/3,
                                f"{val:,.0f}", fontSize=6,
                                fillColor=colors.white if intensity > 0.5 else colors.HexColor("#374151"),
                                textAnchor="middle")
                drawing.add(val_str)

    for j, col in enumerate(cols):
        col_label = String(120 + j * cell_w + cell_w/2,
                          height - 25, str(col)[:10],
                          fontSize=7, textAnchor="middle",
                          fillColor=colors.HexColor("#374151"),
                          fontName="Helvetica-Bold")
        drawing.add(col_label)

    title_str = String(width/2, height - 10, title,
                      fontSize=11, fillColor=colors.HexColor("#1f2937"),
                      textAnchor="middle", fontName="Helvetica-Bold")
    drawing.add(title_str)

    return drawing

def generate_pdf_report(contents: bytes, filename: str, username: str) -> bytes:
    """Generate a professional executive PDF report with charts."""

    try:
        df = pd.read_csv(io.BytesIO(contents))
    except UnicodeDecodeError:
        df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")

    if filename.endswith(".xlsx"):
        df = pd.read_excel(io.BytesIO(contents))

    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    text_cols = df.select_dtypes(include="object").columns.tolist()

    # AI Summary
    stats = {col: round(float(df[col].sum()), 2) for col in numeric_cols[:3]}
    category_info = {}
    for col in text_cols[:2]:
        if df[col].nunique() < 10:
            category_info[col] = df[col].value_counts().head(3).to_dict()

    prompt = f"""You are a senior business analyst. Generate a professional executive report for:
File: {filename}, Records: {len(df)}, Columns: {list(df.columns)}
Key Metrics: {stats}, Categories: {category_info}

Write:
1. Executive Summary (3-4 sentences)
2. Key Findings (4 bullet points with numbers)
3. Business Recommendations (3 bullet points)
4. Conclusion (2 sentences)

Use professional business language. Be specific with numbers."""

    ai_content = groq_chat(prompt)

    # Build PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        rightMargin=0.75*inch, leftMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch
    )

    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle("CT", parent=styles["Title"],
        fontSize=26, textColor=colors.HexColor("#f78166"),
        spaceAfter=4, alignment=TA_CENTER, fontName="Helvetica-Bold")
    subtitle_style = ParagraphStyle("CS", parent=styles["Normal"],
        fontSize=10, textColor=colors.HexColor("#6b7280"),
        alignment=TA_CENTER, spaceAfter=16)
    heading_style = ParagraphStyle("CH", parent=styles["Heading1"],
        fontSize=13, textColor=colors.HexColor("#1f2937"),
        spaceBefore=20, spaceAfter=8, fontName="Helvetica-Bold")
    body_style = ParagraphStyle("CB", parent=styles["Normal"],
        fontSize=10, textColor=colors.HexColor("#374151"),
        spaceAfter=6, leading=16, alignment=TA_LEFT)
    chart_caption = ParagraphStyle("CC", parent=styles["Normal"],
        fontSize=9, textColor=colors.HexColor("#6b7280"),
        alignment=TA_CENTER, spaceAfter=16, italics=True)

    # ── HEADER ──
    story.append(Paragraph("🔮 GenBI", title_style))
    story.append(Paragraph("Executive Business Intelligence Report", subtitle_style))
    story.append(Paragraph(
        f"Prepared by: <b>{username}</b> &nbsp;|&nbsp; Date: <b>{datetime.now().strftime('%B %d, %Y')}</b> &nbsp;|&nbsp; File: <b>{filename}</b>",
        subtitle_style))
    story.append(HRFlowable(width="100%", thickness=2,
        color=colors.HexColor("#f78166"), spaceAfter=16))

    # ── DATASET OVERVIEW ──
    story.append(Paragraph("1. Dataset Overview", heading_style))
    overview_data = [
        ["Metric", "Value"],
        ["File Name", filename],
        ["Total Records", f"{len(df):,}"],
        ["Total Columns", str(len(df.columns))],
        ["Numeric Columns", ", ".join(numeric_cols[:4]) or "None"],
        ["Text Columns", ", ".join(text_cols[:4]) or "None"],
        ["Report Date", datetime.now().strftime("%B %d, %Y")],
        ["Prepared By", username],
    ]
    ov_table = Table(overview_data, colWidths=[2.5*inch, 4.5*inch])
    ov_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#f78166")),
        ("TEXTCOLOR", (0,0), (-1,0), colors.white),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE", (0,0), (-1,-1), 10),
        ("ROWBACKGROUNDS", (0,1), (-1,-1),
            [colors.HexColor("#fff7f6"), colors.white]),
        ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#e5e7eb")),
        ("PADDING", (0,0), (-1,-1), 8),
        ("FONTNAME", (0,1), (0,-1), "Helvetica-Bold"),
    ]))
    story.append(ov_table)
    story.append(Spacer(1, 16))

    # ── KEY STATISTICS ──
    if numeric_cols:
        story.append(Paragraph("2. Key Statistics", heading_style))
        stat_data = [["Column", "Total", "Average", "Min", "Max", "Std Dev"]]
        for col in numeric_cols[:5]:
            stat_data.append([
                col.title(),
                f"{df[col].sum():,.2f}",
                f"{df[col].mean():,.2f}",
                f"{df[col].min():,.2f}",
                f"{df[col].max():,.2f}",
                f"{df[col].std():,.2f}",
            ])
        st_table = Table(stat_data,
            colWidths=[1.4*inch,1.2*inch,1.2*inch,1*inch,1*inch,1.2*inch])
        st_table.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#bc8cff")),
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE", (0,0), (-1,-1), 9),
            ("ROWBACKGROUNDS", (0,1), (-1,-1),
                [colors.HexColor("#faf5ff"), colors.white]),
            ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#e5e7eb")),
            ("PADDING", (0,0), (-1,-1), 6),
            ("ALIGN", (1,0), (-1,-1), "RIGHT"),
        ]))
        story.append(st_table)
        story.append(Spacer(1, 20))

    # ── BAR CHART ──
    if text_cols and numeric_cols:
        cat_col = text_cols[0]
        num_col = numeric_cols[0]
        if df[cat_col].nunique() <= 15:
            story.append(Paragraph("3. Visual Analysis", heading_style))

            bar_data = df.groupby(cat_col)[num_col].sum().sort_values(
                ascending=False).head(8)
            bar_chart = make_bar_chart(
                list(bar_data.values),
                list(bar_data.index),
                f"{num_col.title()} by {cat_col.title()}"
            )
            story.append(bar_chart)
            story.append(Paragraph(
                f"Figure 1: {num_col.title()} distribution across {cat_col.title()} categories",
                chart_caption))

            # ── PIE CHART ──
            pie_data = df.groupby(cat_col)[num_col].sum().head(6)
            pie_chart = make_pie_chart(
                list(pie_data.values),
                list(pie_data.index),
                f"{num_col.title()} Share by {cat_col.title()}"
            )
            story.append(pie_chart)
            story.append(Paragraph(
                f"Figure 2: {num_col.title()} percentage share by {cat_col.title()}",
                chart_caption))

    # ── LINE CHART ──
    if numeric_cols:
        num_col = numeric_cols[0]
        line_chart = make_line_chart(
            list(range(min(len(df), 20))),
            list(df[num_col].values[:20]),
            f"{num_col.title()} Trend"
        )
        story.append(line_chart)
        story.append(Paragraph(
            f"Figure 3: {num_col.title()} trend across records",
            chart_caption))

    # ── HEATMAP ──
    if text_cols and len(numeric_cols) >= 2:
        cat_col = text_cols[0]
        if df[cat_col].nunique() <= 8:
            heatmap = make_heatmap(
                df, cat_col, numeric_cols[:4],
                f"Performance Heatmap by {cat_col.title()}"
            )
            story.append(heatmap)
            story.append(Paragraph(
                f"Figure 4: Performance heatmap across {cat_col.title()} categories",
                chart_caption))

    # ── CATEGORY BREAKDOWN TABLE ──
    if text_cols and numeric_cols:
        cat_col = text_cols[0]
        num_col = numeric_cols[0]
        if df[cat_col].nunique() <= 15:
            story.append(Paragraph("4. Category Breakdown", heading_style))
            breakdown = df.groupby(cat_col)[num_col].agg(
                ["sum","mean","count"]).reset_index()
            breakdown = breakdown.sort_values("sum", ascending=False).head(10)

            # Add percentage column
            total = breakdown["sum"].sum()
            cat_data = [[cat_col.title(),
                        f"Total {num_col.title()}",
                        f"Avg {num_col.title()}",
                        "Count", "Share %"]]
            for _, row in breakdown.iterrows():
                pct = (row["sum"] / total * 100) if total > 0 else 0
                cat_data.append([
                    str(row[cat_col]),
                    f"{row['sum']:,.2f}",
                    f"{row['mean']:,.2f}",
                    f"{int(row['count']):,}",
                    f"{pct:.1f}%",
                ])
            cat_table = Table(cat_data,
                colWidths=[1.8*inch,1.5*inch,1.5*inch,0.8*inch,0.9*inch])
            cat_table.setStyle(TableStyle([
                ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#58a6ff")),
                ("TEXTCOLOR", (0,0), (-1,0), colors.white),
                ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
                ("FONTSIZE", (0,0), (-1,-1), 9),
                ("ROWBACKGROUNDS", (0,1), (-1,-1),
                    [colors.HexColor("#eff6ff"), colors.white]),
                ("GRID", (0,0), (-1,-1), 0.5, colors.HexColor("#e5e7eb")),
                ("PADDING", (0,0), (-1,-1), 6),
                ("ALIGN", (1,0), (-1,-1), "RIGHT"),
            ]))
            story.append(cat_table)
            story.append(Spacer(1, 20))

    # ── AI EXECUTIVE ANALYSIS ──
    story.append(HRFlowable(width="100%", thickness=1,
        color=colors.HexColor("#e5e7eb")))
    story.append(Paragraph("5. AI Executive Analysis", heading_style))
    for line in ai_content.split("\n"):
        if line.strip():
            story.append(Paragraph(line.strip(), body_style))
    story.append(Spacer(1, 20))

    # ── FOOTER ──
    story.append(HRFlowable(width="100%", thickness=2,
        color=colors.HexColor("#f78166")))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Generated by <b>GenBI</b> — AI-Powered Business Intelligence Platform &nbsp;|&nbsp; <b>Confidential</b>",
        subtitle_style))
    story.append(Paragraph(
        f"© {datetime.now().year} GenBI. All rights reserved.",
        subtitle_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()