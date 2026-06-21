import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Candidate from '@/lib/models/Candidate';
import OfferDocument from '@/lib/models/OfferDocument';
import TimelineEvent from '@/lib/models/TimelineEvent';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Helper to format currency
const formatCurrency = (amount: number, currency: string) => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
  };
  const symbol = symbols[currency] || '$';
  if (amount >= 1000) {
    const formatted = amount.toLocaleString('en-US', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${symbol}${formatted}`;
  }
  return `${symbol}${amount.toLocaleString()}`;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { candidateId, roleTitle, salaryAmount, salaryCurrency, startDate, reportingManager, location } = await request.json();

    // Validate
    if (!candidateId || !roleTitle || !salaryAmount || !startDate || !reportingManager || !location) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Get candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      );
    }

    // VALIDATION: Only allow offer generation if candidate is HIRED
    if (candidate.status !== 'Hired') {
      return NextResponse.json(
        { error: `Cannot generate offer. Candidate status is "${candidate.status}". Offer can only be generated for hired candidates.` },
        { status: 400 }
      );
    }

    // Check if offer already exists
    const existingOffer = await OfferDocument.findOne({ candidateId });
    if (existingOffer) {
      return NextResponse.json(
        { error: 'Offer already generated for this candidate' },
        { status: 400 }
      );
    }

    const today = new Date();
    const startDateObj = new Date(startDate);
    const formattedDate = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedStartDate = startDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedSalary = formatCurrency(salaryAmount, salaryCurrency);

    // ============================================
    // GENERATE OFFER LETTER PDF
    // ============================================
    const offerLetterDoc = await PDFDocument.create();
    const offerPage = offerLetterDoc.addPage([612, 792]);
    const { height } = offerPage.getSize();
    const font = await offerLetterDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await offerLetterDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await offerLetterDoc.embedFont(StandardFonts.HelveticaOblique);

    let y = height - 50;

    // === HEADER ===
    // Company Logo
    offerPage.drawText('ROVE', {
      x: 50,
      y,
      size: 32,
      font: boldFont,
      color: rgb(0.05, 0.1, 0.3),
    });
    
    offerPage.drawText('Driving Innovation Forward', {
      x: 50,
      y: y - 18,
      size: 10,
      font: italicFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Decorative line
    offerPage.drawLine({
      start: { x: 50, y: y - 28 },
      end: { x: 200, y: y - 28 },
      thickness: 2,
      color: rgb(0.05, 0.1, 0.3),
    });

    // Badge
    const badgeX = 450;
    const badgeY = y - 5;
    offerPage.drawRectangle({
      x: badgeX,
      y: badgeY - 22,
      width: 110,
      height: 30,
      color: rgb(0.78, 0.66, 0.15),
    });
    offerPage.drawText('OFFER LETTER', {
      x: badgeX + 10,
      y: badgeY - 12,
      size: 12,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    y -= 55;

    // === DATE ===
    offerPage.drawText(`Date: ${formattedDate}`, {
      x: 450,
      y,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 35;

    // === GREETING ===
    offerPage.drawText(`Dear ${candidate.name},`, {
      x: 50,
      y,
      size: 14,
      font: boldFont,
      color: rgb(0.05, 0.1, 0.3),
    });
    y -= 25;

    // === INTRODUCTION ===
    const introText = [
      `We are delighted to offer you the position of ${roleTitle} at ROVE.`,
      `Your exceptional skills, experience, and passion for innovation align`,
      `perfectly with our vision. We are confident that you will make a`,
      `significant contribution to our growing team.`
    ];

    for (const line of introText) {
      offerPage.drawText(line, {
        x: 50,
        y,
        size: 11,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= 20;
    }
    y -= 10;

    // === POSITION DETAILS SECTION ===
    // Section header with background
    const sectionX = 50;
    const sectionY = y;
    offerPage.drawRectangle({
      x: sectionX,
      y: sectionY - 22,
      width: 512,
      height: 24,
      color: rgb(0.95, 0.97, 0.99),
    });
    offerPage.drawText('POSITION DETAILS', {
      x: sectionX + 10,
      y: sectionY - 16,
      size: 11,
      font: boldFont,
      color: rgb(0.05, 0.1, 0.3),
    });
    y -= 30;

    // Details with proper alignment
    const details = [
      { label: 'Role Title', value: roleTitle },
      { label: 'Location', value: location },
      { label: 'Start Date', value: formattedStartDate },
      { label: 'Reporting Manager', value: reportingManager },
    ];

    for (const detail of details) {
      offerPage.drawText(`${detail.label}:`, {
        x: 60,
        y,
        size: 10,
        font: boldFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      offerPage.drawText(detail.value, {
        x: 200,
        y,
        size: 10,
        font,
        color: rgb(0.05, 0.1, 0.3),
      });
      y -= 18;
    }
    y -= 10;

    // === COMPENSATION SECTION ===
    offerPage.drawRectangle({
      x: sectionX,
      y: y - 22,
      width: 512,
      height: 24,
      color: rgb(0.95, 0.97, 0.99),
    });
    offerPage.drawText('COMPENSATION', {
      x: sectionX + 10,
      y: y - 16,
      size: 11,
      font: boldFont,
      color: rgb(0.05, 0.1, 0.3),
    });
    y -= 30;

    offerPage.drawText(`Annual Salary:`, {
      x: 60,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    offerPage.drawText(`${formattedSalary} per year`, {
      x: 200,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0.05, 0.5, 0.1),
    });
    y -= 20;

    // === BENEFITS SECTION ===
    offerPage.drawRectangle({
      x: sectionX,
      y: y - 22,
      width: 512,
      height: 24,
      color: rgb(0.95, 0.97, 0.99),
    });
    offerPage.drawText('BENEFITS & PERKS', {
      x: sectionX + 10,
      y: y - 16,
      size: 11,
      font: boldFont,
      color: rgb(0.05, 0.1, 0.3),
    });
    y -= 30;

    const benefits = [
      '• Comprehensive health, dental, and vision insurance',
      '• 401(k) retirement plan with company matching (up to 4%)',
      '• Flexible work arrangements and remote options',
      '• Professional development and learning budget ($2,500/year)',
      '• Generous paid time off (20 days + holidays)',
    ];

    for (const benefit of benefits) {
      offerPage.drawText(benefit, {
        x: 60,
        y,
        size: 10,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= 17;
    }
    y -= 10;

    // === CLOSING ===
    const closingText = [
      `We look forward to welcoming you to the ROVE team and are excited about`,
      `the journey ahead. Please sign below to formally accept this offer.`
    ];

    for (const line of closingText) {
      offerPage.drawText(line, {
        x: 50,
        y,
        size: 11,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= 20;
    }
    y -= 10;

    // === SIGNATURE SECTION ===
    offerPage.drawText('Accepted by:', {
      x: 50,
      y,
      size: 12,
      font: boldFont,
      color: rgb(0.05, 0.1, 0.3),
    });
    y -= 25;

    // Signature lines
    offerPage.drawLine({
      start: { x: 50, y: y },
      end: { x: 250, y },
      thickness: 1,
      color: rgb(0.1, 0.1, 0.1),
    });
    y -= 8;
    offerPage.drawText('Signature', {
      x: 50,
      y,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    const line2X = 300;
    const line2Y = y + 8;
    offerPage.drawLine({
      start: { x: line2X, y: line2Y },
      end: { x: 500, y: line2Y },
      thickness: 1,
      color: rgb(0.1, 0.1, 0.1),
    });
    offerPage.drawText('Date', {
      x: line2X,
      y,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // === FOOTER ===
    offerPage.drawLine({
      start: { x: 50, y: 50 },
      end: { x: 562, y: 50 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    offerPage.drawText(
      'This offer letter is confidential and subject to the terms and conditions of employment at ROVE.',
      {
        x: 50,
        y: 35,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
      }
    );

    // Save Offer Letter
    const offerLetterBytes = await offerLetterDoc.save();
    const offerLetterBuffer = Buffer.from(offerLetterBytes);
    const offerLetterFileName = `offer_${uuidv4()}.pdf`;
    const offerBlob = await put(`offers/${offerLetterFileName}`, offerLetterBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const offerLetterUrl = offerBlob.url;

    // ============================================
    // GENERATE NDA PDF
    // ============================================
    const ndaDoc = await PDFDocument.create();
    const ndaPage = ndaDoc.addPage([612, 792]);
    const { height: ndaHeight } = ndaPage.getSize();
    const ndaFont = await ndaDoc.embedFont(StandardFonts.Helvetica);
    const ndaBoldFont = await ndaDoc.embedFont(StandardFonts.HelveticaBold);
    const ndaItalicFont = await ndaDoc.embedFont(StandardFonts.HelveticaOblique);

    let ndaY = ndaHeight - 50;

    // === HEADER ===
    ndaPage.drawText('ROVE', {
      x: 50,
      y: ndaY,
      size: 28,
      font: ndaBoldFont,
      color: rgb(0.05, 0.1, 0.3),
    });
    ndaY -= 15;

    ndaPage.drawLine({
      start: { x: 50, y: ndaY },
      end: { x: 200, y: ndaY },
      thickness: 2,
      color: rgb(0.05, 0.1, 0.3),
    });
    ndaY -= 5;

    ndaPage.drawText('NON-DISCLOSURE AGREEMENT', {
      x: 50,
      y: ndaY,
      size: 16,
      font: ndaBoldFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    ndaY -= 10;

    // Confidential badge
    const badgeX2 = 450;
    const badgeY2 = ndaY + 15;
    ndaPage.drawRectangle({
      x: badgeX2,
      y: badgeY2 - 18,
      width: 110,
      height: 26,
      color: rgb(0.8, 0.1, 0.1),
    });
    ndaPage.drawText('CONFIDENTIAL', {
      x: badgeX2 + 12,
      y: badgeY2 - 10,
      size: 11,
      font: ndaBoldFont,
      color: rgb(1, 1, 1),
    });
    ndaY -= 30;

    // === EFFECTIVE DATE ===
    ndaPage.drawText(`Effective Date: ${formattedDate}`, {
      x: 400,
      y: ndaY,
      size: 10,
      font: ndaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    ndaY -= 25;

    // === INTRODUCTION ===
    const ndaIntro = [
      `This Non-Disclosure Agreement ("Agreement") is entered into on ${formattedDate}`,
      `between ROVE ("Company") and ${candidate.name} ("Employee").`,
    ];

    for (const line of ndaIntro) {
      ndaPage.drawText(line, {
        x: 50,
        y: ndaY,
        size: 11,
        font: ndaFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      ndaY -= 20;
    }
    ndaY -= 10;

    // === SECTION 1 ===
    ndaPage.drawText('1. CONFIDENTIAL INFORMATION', {
      x: 50,
      y: ndaY,
      size: 12,
      font: ndaBoldFont,
      color: rgb(0.05, 0.1, 0.3),
    });
    ndaY -= 20;

    const section1Text = [
      `The Employee acknowledges that during the course of employment, they may`,
      `have access to confidential and proprietary information, including but`,
      `not limited to:`
    ];

    for (const line of section1Text) {
      ndaPage.drawText(line, {
        x: 60,
        y: ndaY,
        size: 10,
        font: ndaFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      ndaY -= 17;
    }

    const section1Bullets = [
      `• Trade secrets and proprietary technology`,
      `• Business plans and financial data`,
      `• Customer information and contracts`,
      `• Product designs and development strategies`,
      `• Marketing and sales strategies`,
    ];

    for (const bullet of section1Bullets) {
      ndaPage.drawText(bullet, {
        x: 70,
        y: ndaY,
        size: 10,
        font: ndaFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      ndaY -= 17;
    }
    ndaY -= 10;

    // === SECTION 2 ===
    ndaPage.drawText('2. OBLIGATIONS OF THE EMPLOYEE', {
      x: 50,
      y: ndaY,
      size: 12,
      font: ndaBoldFont,
      color: rgb(0.05, 0.1, 0.3),
    });
    ndaY -= 20;

    ndaPage.drawText('The Employee agrees to:', {
      x: 60,
      y: ndaY,
      size: 10,
      font: ndaFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    ndaY -= 17;

    const section2Bullets = [
      `• Maintain strict confidentiality of all Company information`,
      `• Not disclose confidential information to third parties without consent`,
      `• Use confidential information solely for Company-related purposes`,
      `• Return all confidential materials and documents upon request`,
      `• Protect confidential information with the same care as their own`,
    ];

    for (const bullet of section2Bullets) {
      ndaPage.drawText(bullet, {
        x: 70,
        y: ndaY,
        size: 10,
        font: ndaFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      ndaY -= 17;
    }
    ndaY -= 10;

    // === SECTION 3 ===
    ndaPage.drawText('3. DURATION', {
      x: 50,
      y: ndaY,
      size: 12,
      font: ndaBoldFont,
      color: rgb(0.05, 0.1, 0.3),
    });
    ndaY -= 20;

    ndaPage.drawText(
      `This Agreement shall remain in full force and effect during the Employee's`,
      {
        x: 60,
        y: ndaY,
        size: 10,
        font: ndaFont,
        color: rgb(0.1, 0.1, 0.1),
      }
    );
    ndaY -= 17;
    ndaPage.drawText(
      `employment with the Company and for a period of 5 years following the`,
      {
        x: 60,
        y: ndaY,
        size: 10,
        font: ndaFont,
        color: rgb(0.1, 0.1, 0.1),
      }
    );
    ndaY -= 17;
    ndaPage.drawText(
      `termination of employment, regardless of the reason for termination.`,
      {
        x: 60,
        y: ndaY,
        size: 10,
        font: ndaFont,
        color: rgb(0.1, 0.1, 0.1),
      }
    );
    ndaY -= 20;

    // === SECTION 4 ===
    ndaPage.drawText('4. EXCEPTIONS', {
      x: 50,
      y: ndaY,
      size: 12,
      font: ndaBoldFont,
      color: rgb(0.05, 0.1, 0.3),
    });
    ndaY -= 20;

    ndaPage.drawText('This Agreement does not apply to information that:', {
      x: 60,
      y: ndaY,
      size: 10,
      font: ndaFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    ndaY -= 17;

    const section4Bullets = [
      `• Is or becomes publicly available through no fault of the Employee`,
      `• Was known to the Employee prior to employment`,
      `• Is independently developed without using confidential information`,
      `• Is required to be disclosed by law or court order`,
    ];

    for (const bullet of section4Bullets) {
      ndaPage.drawText(bullet, {
        x: 70,
        y: ndaY,
        size: 10,
        font: ndaFont,
        color: rgb(0.1, 0.1, 0.1),
      });
      ndaY -= 17;
    }
    ndaY -= 10;

    // === SECTION 5 ===
    ndaPage.drawText('5. GOVERNING LAW', {
      x: 50,
      y: ndaY,
      size: 12,
      font: ndaBoldFont,
      color: rgb(0.05, 0.1, 0.3),
    });
    ndaY -= 20;

    ndaPage.drawText(
      `This Agreement shall be governed by and construed in accordance with the`,
      {
        x: 60,
        y: ndaY,
        size: 10,
        font: ndaFont,
        color: rgb(0.1, 0.1, 0.1),
      }
    );
    ndaY -= 17;
    ndaPage.drawText(
      `laws of the State of California, without regard to conflict of law principles.`,
      {
        x: 60,
        y: ndaY,
        size: 10,
        font: ndaFont,
        color: rgb(0.1, 0.1, 0.1),
      }
    );
    ndaY -= 25;

    // === CLOSING ===
    ndaPage.drawText(
      `IN WITNESS WHEREOF, the parties have executed this Agreement as of the`,
      {
        x: 50,
        y: ndaY,
        size: 10,
        font: ndaFont,
        color: rgb(0.1, 0.1, 0.1),
      }
    );
    ndaY -= 17;
    ndaPage.drawText(
      `date first written above.`,
      {
        x: 50,
        y: ndaY,
        size: 10,
        font: ndaFont,
        color: rgb(0.1, 0.1, 0.1),
      }
    );
    ndaY -= 30;

    // === SIGNATURE SECTION ===
    // Company Signature
    ndaPage.drawText('COMPANY:', {
      x: 50,
      y: ndaY,
      size: 11,
      font: ndaBoldFont,
      color: rgb(0.05, 0.1, 0.3),
    });
    ndaY -= 20;

    ndaPage.drawLine({
      start: { x: 50, y: ndaY },
      end: { x: 250, y: ndaY },
      thickness: 1,
      color: rgb(0.1, 0.1, 0.1),
    });
    ndaY -= 8;
    ndaPage.drawText('Authorized Signature', {
      x: 50,
      y: ndaY,
      size: 9,
      font: ndaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    const dateLineX = 300;
    const dateLineY = ndaY + 8;
    ndaPage.drawLine({
      start: { x: dateLineX, y: dateLineY },
      end: { x: 500, y: dateLineY },
      thickness: 1,
      color: rgb(0.1, 0.1, 0.1),
    });
    ndaPage.drawText('Date', {
      x: dateLineX,
      y: ndaY,
      size: 9,
      font: ndaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    ndaY -= 40;

    // Employee Signature
    ndaPage.drawText('EMPLOYEE:', {
      x: 50,
      y: ndaY,
      size: 11,
      font: ndaBoldFont,
      color: rgb(0.05, 0.1, 0.3),
    });
    ndaY -= 20;

    ndaPage.drawLine({
      start: { x: 50, y: ndaY },
      end: { x: 250, y: ndaY },
      thickness: 1,
      color: rgb(0.1, 0.1, 0.1),
    });
    ndaY -= 8;
    ndaPage.drawText('Employee Signature', {
      x: 50,
      y: ndaY,
      size: 9,
      font: ndaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    const dateLineX2 = 300;
    const dateLineY2 = ndaY + 8;
    ndaPage.drawLine({
      start: { x: dateLineX2, y: dateLineY2 },
      end: { x: 500, y: dateLineY2 },
      thickness: 1,
      color: rgb(0.1, 0.1, 0.1),
    });
    ndaPage.drawText('Date', {
      x: dateLineX2,
      y: ndaY,
      size: 9,
      font: ndaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // === FOOTER ===
    ndaPage.drawLine({
      start: { x: 50, y: 50 },
      end: { x: 562, y: 50 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    ndaPage.drawText(
      'This document contains confidential and proprietary information of ROVE.',
      {
        x: 50,
        y: 35,
        size: 8,
        font: ndaFont,
        color: rgb(0.5, 0.5, 0.5),
      }
    );
    ndaPage.drawText(
      'Unauthorized use or disclosure is strictly prohibited.',
      {
        x: 50,
        y: 22,
        size: 8,
        font: ndaFont,
        color: rgb(0.5, 0.5, 0.5),
      }
    );

    // Save NDA
    const ndaBytes = await ndaDoc.save();
    const ndaBuffer = Buffer.from(ndaBytes);
    const ndaFileName = `nda_${uuidv4()}.pdf`;
    const ndaBlob = await put(`offers/${ndaFileName}`, ndaBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const ndaUrl = ndaBlob.url;

    // Save to database
    const offerDocument = await OfferDocument.create({
      candidateId,
      roleTitle,
      salary: {
        amount: salaryAmount,
        currency: salaryCurrency,
      },
      startDate: new Date(startDate),
      reportingManager,
      location,
      offerLetterUrl,
      ndaUrl,
    });

    // Update candidate status to "Offer Sent"
    candidate.status = 'Offer Sent';
    candidate.updatedAt = new Date();
    await candidate.save();

    // Create timeline event
    await TimelineEvent.create({
      candidateId: candidate._id,
      type: 'OFFER_SENT',
      description: `Offer letter and NDA generated for ${candidate.name}`,
      metadata: {
        roleTitle,
        salary: formattedSalary,
        startDate: formattedStartDate,
        reportingManager,
        location,
        offerLetterUrl,
        ndaUrl,
      },
    });

    return NextResponse.json({
      message: 'Offer documents generated successfully',
      offerDocument,
      candidate: {
        id: candidate._id,
        name: candidate.name,
        status: candidate.status,
      },
      files: {
        offerLetter: offerLetterUrl,
        nda: ndaUrl,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating offer:', error);
    return NextResponse.json(
      { error: 'Failed to generate offer documents: ' + (error as Error).message },
      { status: 500 }
    );
  }
}