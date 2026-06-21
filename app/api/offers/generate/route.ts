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
  return `${symbols[currency] || '$'}${amount.toLocaleString()}`;
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

    // 🔥 VALIDATION: Only allow offer generation if candidate is HIRED
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

    // Generate Offer Letter PDF
    const offerLetterDoc = await PDFDocument.create();
    const offerPage = offerLetterDoc.addPage([612, 792]);
    const { height } = offerPage.getSize();
    const font = await offerLetterDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await offerLetterDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;
    const lineHeight = 20;

    // Company Logo / Header
    offerPage.drawText('ROVE', {
      x: 50,
      y,
      size: 28,
      font: boldFont,
      color: rgb(0, 0.2, 0.6),
    });
    y -= 10;
    offerPage.drawText('Offer Letter', {
      x: 50,
      y,
      size: 16,
      font: boldFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 30;

    // Date
    offerPage.drawText(`Date: ${formattedDate}`, {
      x: 50,
      y,
      size: 11,
      font,
    });
    y -= 25;

    // Candidate Name
    offerPage.drawText(`Dear ${candidate.name},`, {
      x: 50,
      y,
      size: 12,
      font: boldFont,
    });
    y -= 25;

    // Body
    const bodyText = [
      `We are delighted to offer you the position of ${roleTitle} at ROVE. We were`,
      `impressed by your skills and experience, and we believe you will be a valuable`,
      `addition to our team.`,
      '',
      `Position Details:`,
      `• Role: ${roleTitle}`,
      `• Location: ${location}`,
      `• Start Date: ${formattedStartDate}`,
      `• Reporting Manager: ${reportingManager}`,
      '',
      `Compensation:`,
      `• Annual Salary: ${formattedSalary} per year`,
      '',
      `We look forward to having you on board and are confident that you will`,
      `contribute significantly to the success of our company.`,
      '',
      `Please sign below to accept this offer.`,
      '',
    ];

    for (const line of bodyText) {
      if (line === '') {
        y -= 10;
        continue;
      }
      const isBold = line.startsWith('•') || line.startsWith('Position Details:') || line.startsWith('Compensation:');
      const textFont = isBold ? boldFont : font;
      offerPage.drawText(line, {
        x: 50,
        y,
        size: 11,
        font: textFont,
      });
      y -= lineHeight;
    }

    // Signature Section
    y -= 20;
    offerPage.drawText('Accepted by:', {
      x: 50,
      y,
      size: 12,
      font: boldFont,
    });
    y -= 30;
    offerPage.drawLine({
      start: { x: 50, y },
      end: { x: 250, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    y -= 10;
    offerPage.drawText('Signature', {
      x: 50,
      y,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 25;
    offerPage.drawLine({
      start: { x: 300, y },
      end: { x: 500, y },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    y -= 10;
    offerPage.drawText('Date', {
      x: 300,
      y,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Save Offer Letter to Vercel Blob
    const offerLetterBytes = await offerLetterDoc.save();
    const offerLetterBuffer = Buffer.from(offerLetterBytes);
    const offerLetterFileName = `offer_${uuidv4()}.pdf`;
    const offerBlob = await put(`offers/${offerLetterFileName}`, offerLetterBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const offerLetterUrl = offerBlob.url;

    // Generate NDA PDF
    const ndaDoc = await PDFDocument.create();
    const ndaPage = ndaDoc.addPage([612, 792]);
    const { height: ndaHeight } = ndaPage.getSize();
    const ndaFont = await ndaDoc.embedFont(StandardFonts.Helvetica);
    const ndaBoldFont = await ndaDoc.embedFont(StandardFonts.HelveticaBold);

    let ndaY = ndaHeight - 50;

    // Header
    ndaPage.drawText('ROVE', {
      x: 50,
      y: ndaY,
      size: 28,
      font: ndaBoldFont,
      color: rgb(0, 0.2, 0.6),
    });
    ndaY -= 10;
    ndaPage.drawText('Non-Disclosure Agreement', {
      x: 50,
      y: ndaY,
      size: 16,
      font: ndaBoldFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    ndaY -= 30;

    // NDA Body
    const ndaBody = [
      `This Non-Disclosure Agreement ("Agreement") is entered into on ${formattedDate}`,
      `between ROVE ("Company") and ${candidate.name} ("Employee").`,
      '',
      '1. CONFIDENTIAL INFORMATION',
      `   The Employee acknowledges that during the course of employment, they may`,
      `   have access to confidential information including but not limited to trade`,
      `   secrets, business plans, financial data, and proprietary technology.`,
      '',
      '2. OBLIGATIONS',
      `   The Employee agrees to:`,
      `   • Maintain all confidential information in strict confidence.`,
      `   • Not disclose confidential information to third parties without consent.`,
      `   • Use confidential information only for Company-related purposes.`,
      `   • Return all confidential materials upon request.`,
      '',
      '3. DURATION',
      `   This Agreement remains in effect during employment and for 5 years after`,
      `   termination of employment.`,
      '',
      '4. EXCEPTIONS',
      `   This Agreement does not apply to information that:`,
      `   • Is or becomes publicly available`,
      `   • Was known prior to employment`,
      `   • Is independently developed without using confidential information`,
      '',
      '5. GOVERNING LAW',
      `   This Agreement shall be governed by the laws of the State of California.`,
      '',
      `IN WITNESS WHEREOF, the parties have executed this Agreement as of the date`,
      `first written above.`,
      '',
    ];

    for (const line of ndaBody) {
      if (line === '') {
        ndaY -= 10;
        continue;
      }
      const isBold = line.includes('1.') || line.includes('2.') || line.includes('3.') || 
                     line.includes('4.') || line.includes('5.') || line.includes('6.');
      const textFont = isBold ? ndaBoldFont : ndaFont;
      ndaPage.drawText(line, {
        x: 50,
        y: ndaY,
        size: 10,
        font: textFont,
      });
      ndaY -= 18;
    }

    // Signatures
    ndaY -= 20;
    ndaPage.drawText('COMPANY:', {
      x: 50,
      y: ndaY,
      size: 11,
      font: ndaBoldFont,
    });
    ndaY -= 25;
    ndaPage.drawLine({
      start: { x: 50, y: ndaY },
      end: { x: 250, y: ndaY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    ndaY -= 10;
    ndaPage.drawText('Authorized Signature', {
      x: 50,
      y: ndaY,
      size: 9,
      font: ndaFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    ndaY -= 30;
    ndaPage.drawText('EMPLOYEE:', {
      x: 50,
      y: ndaY,
      size: 11,
      font: ndaBoldFont,
    });
    ndaY -= 25;
    ndaPage.drawLine({
      start: { x: 50, y: ndaY },
      end: { x: 250, y: ndaY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    ndaY -= 10;
    ndaPage.drawText('Employee Signature', {
      x: 50,
      y: ndaY,
      size: 9,
      font: ndaFont,
      color: rgb(0.4, 0.4, 0.4),
    });
    ndaY -= 25;
    ndaPage.drawText(`Date: __________________`, {
      x: 50,
      y: ndaY,
      size: 10,
      font: ndaFont,
    });

    // Save NDA to Vercel Blob
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

    // Update candidate status
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