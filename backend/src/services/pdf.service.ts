import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import type { IGeneratedAssessment } from '../models/generated-assessment.model';

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

interface DrawContext {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  fontRegular: PDFFont;
  fontBold: PDFFont;
  fontItalic: PDFFont;
  pageNumber: number;
}

function addPage(ctx: DrawContext): void {
  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.y = PAGE_HEIGHT - MARGIN;
  ctx.pageNumber++;

  // Page number footer
  const text = `Page ${ctx.pageNumber}`;
  const width = ctx.fontRegular.widthOfTextAtSize(text, 9);
  ctx.page.drawText(text, {
    x: (PAGE_WIDTH - width) / 2,
    y: 25,
    size: 9,
    font: ctx.fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });
}

function ensureSpace(ctx: DrawContext, needed: number): void {
  if (ctx.y - needed < MARGIN + 30) {
    addPage(ctx);
  }
}

function drawCenteredText(
  ctx: DrawContext,
  text: string,
  font: PDFFont,
  size: number,
  color = rgb(0, 0, 0)
): void {
  const width = font.widthOfTextAtSize(text, size);
  ctx.page.drawText(text, {
    x: (PAGE_WIDTH - width) / 2,
    y: ctx.y,
    size,
    font,
    color,
  });
  ctx.y -= size + 4;
}

function drawText(
  ctx: DrawContext,
  text: string,
  font: PDFFont,
  size: number,
  x: number = MARGIN,
  color = rgb(0, 0, 0)
): void {
  ctx.page.drawText(text, { x, y: ctx.y, size, font, color });
  ctx.y -= size + 4;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, size);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawWrappedText(
  ctx: DrawContext,
  text: string,
  font: PDFFont,
  size: number,
  x: number = MARGIN,
  maxWidth: number = CONTENT_WIDTH
): void {
  const lines = wrapText(text, font, size, maxWidth);
  for (const line of lines) {
    ensureSpace(ctx, size + 6);
    ctx.page.drawText(line, { x, y: ctx.y, size, font, color: rgb(0, 0, 0) });
    ctx.y -= size + 4;
  }
}

function drawLine(ctx: DrawContext): void {
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_WIDTH - MARGIN, y: ctx.y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  ctx.y -= 10;
}

export async function generatePDF(assessment: IGeneratedAssessment): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const fontItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const ctx: DrawContext = {
    doc,
    page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    y: PAGE_HEIGHT - MARGIN,
    fontRegular,
    fontBold,
    fontItalic,
    pageNumber: 1,
  };

  // Page 1 footer
  const footerText = `Page 1`;
  const footerWidth = fontRegular.widthOfTextAtSize(footerText, 9);
  ctx.page.drawText(footerText, {
    x: (PAGE_WIDTH - footerWidth) / 2,
    y: 25,
    size: 9,
    font: fontRegular,
    color: rgb(0.5, 0.5, 0.5),
  });

  // ─── Header ───
  drawCenteredText(ctx, assessment.instituteName || 'Delhi Public School, Sector-4, Bokaro', fontBold, 16);
  ctx.y -= 2;
  drawCenteredText(ctx, `Subject: ${assessment.subject}`, fontRegular, 12);
  drawCenteredText(ctx, `Class: ${assessment.className || '5th'}`, fontRegular, 12);
  ctx.y -= 8;

  // Time & Marks row
  drawText(ctx, `Time Allowed: ${assessment.duration || '45 minutes'}`, fontRegular, 10);
  const maxMarksText = `Maximum Marks: ${assessment.maxMarks}`;
  const maxMarksWidth = fontRegular.widthOfTextAtSize(maxMarksText, 10);
  ctx.y += 14; // go back up to same line
  ctx.page.drawText(maxMarksText, {
    x: PAGE_WIDTH - MARGIN - maxMarksWidth,
    y: ctx.y,
    size: 10,
    font: fontRegular,
  });
  ctx.y -= 18;

  drawLine(ctx);
  ctx.y -= 4;

  // General instructions
  drawText(ctx, 'All questions are compulsory unless stated otherwise.', fontItalic, 10);
  ctx.y -= 8;

  // Student info fields
  drawText(ctx, 'Name: ____________________', fontRegular, 10);
  drawText(ctx, 'Roll Number: ______________', fontRegular, 10);
  drawText(ctx, `Class: ${assessment.className || '5th'}  Section: ________`, fontRegular, 10);
  ctx.y -= 12;

  drawLine(ctx);
  ctx.y -= 8;

  // ─── Sections ───
  for (const section of assessment.sections) {
    ensureSpace(ctx, 40);
    drawCenteredText(ctx, section.title, fontBold, 14);
    ctx.y -= 2;
    drawCenteredText(ctx, section.instruction, fontItalic, 10, rgb(0.3, 0.3, 0.3));
    ctx.y -= 8;

    for (const q of section.questions) {
      ensureSpace(ctx, 30);
      const prefix = `${q.questionNumber}. `;
      const diffTag = `[${q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}]`;
      const marksTag = `[${q.marks} Mark${q.marks > 1 ? 's' : ''}]`;
      const fullText = `${prefix}${diffTag} ${q.question} ${marksTag}`;

      drawWrappedText(ctx, fullText, fontRegular, 10, MARGIN, CONTENT_WIDTH);
      ctx.y -= 4;
    }

    ctx.y -= 8;
  }

  // End of paper
  ensureSpace(ctx, 20);
  drawCenteredText(ctx, 'End of Question Paper', fontBold, 11);
  ctx.y -= 16;

  // ─── Answer Key ───
  if (assessment.answerKey && assessment.answerKey.length > 0) {
    drawLine(ctx);
    ctx.y -= 4;
    ensureSpace(ctx, 30);
    drawCenteredText(ctx, 'Answer Key:', fontBold, 13);
    ctx.y -= 6;

    for (const ak of assessment.answerKey) {
      ensureSpace(ctx, 24);
      drawWrappedText(ctx, `${ak.questionNumber}. ${ak.answer}`, fontRegular, 9, MARGIN, CONTENT_WIDTH);
      ctx.y -= 2;
    }
  }

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}
