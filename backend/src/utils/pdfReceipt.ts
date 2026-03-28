import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export interface ReceiptData {
  name: string;
  email: string;
  mobile: string;
  planName: string;
  packageDetail: string;
  price: number;
  packagePrice: number;
  startDate: string;
  endDate: string;
  memberId: string;
  branch?: string;
  city?: string;
  date: string;
  dateTime: string;
  dateOfInvoice: string;
  responsibleLog: string;
  invoiceType: string;
  paidPrice: number;
  balanceAmount: number;
  totalPayment: number;
  discount: number;
  discountPercentage?: number;
  taxPercentage?: number;
  taxAmount?: number;
  paymentMode: string;
}

/**
 * Generates a professional receipt PDF buffer using pdf-lib.
 * This approach is 100% serverless-compatible and browser-free.
 */
export const generateReceiptPdfBuffer = async (data: ReceiptData): Promise<Buffer> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Custom Color Palette: Sleek Luxury Red/Dark Grey
  const brandRed = rgb(0.85, 0.1, 0.1); 
  const darkGrey = rgb(0.15, 0.15, 0.15);
  const mediumGrey = rgb(0.4, 0.4, 0.4);
  const lightGrey = rgb(0.96, 0.96, 0.96);
  const borderColor = rgb(0.9, 0.9, 0.9);
  const textColor = rgb(0.2, 0.2, 0.2);

  let currentY = height - 40;

  // --- 1. Top Decorative Header ---
  page.drawRectangle({ x: 0, y: height - 10, width: width, height: 10, color: brandRed });

  // --- 2. Logo & Brand ---
  // Lowered significantly (30% more) to prevent any cutting at top of A4
  currentY -= 90; 
  try {
    const logoPaths = [
      path.join(__dirname, '../assets/muscle_time.jpeg'),
      path.join(__dirname, '../../src/assets/muscle_time.jpeg'),
      'src/assets/muscle_time.jpeg'
    ];

    let logoBuffer;
    for (const p of logoPaths) {
      if (fs.existsSync(p)) {
        logoBuffer = fs.readFileSync(p);
        break;
      }
    }

    if (logoBuffer) {
      const logoImage = await pdfDoc.embedJpg(logoBuffer);
      const logoDims = logoImage.scale(0.08); // Smaller scale to fit within page margins
      page.drawImage(logoImage, {
        x: 50,
        y: currentY,
        width: logoDims.width,
        height: logoDims.height,
      });
      // Move "MUSCLE TIME" text relative to logo
      page.drawText('MUSCLE TIME', { x: 50 + logoDims.width + 15, y: currentY + logoDims.height / 2 + 5, size: 24, font: boldFont, color: brandRed });
      page.drawText('PAYMENT RECEIPT', { x: 50 + logoDims.width + 15, y: currentY + logoDims.height / 2 - 15, size: 10, font: boldFont, color: mediumGrey });
    } else {
      // Fallback if logo not found
      page.drawText('MUSCLE TIME', { x: 50, y: currentY + 10, size: 28, font: boldFont, color: brandRed });
      page.drawText('E-RECEIPT', { x: 50, y: currentY - 10, size: 10, font: boldFont, color: mediumGrey });
    }
  } catch (err) {
    console.error('Failed to embed logo:', err);
    page.drawText('MUSCLE TIME', { x: 50, y: currentY + 10, size: 28, font: boldFont, color: brandRed });
  }

  // Right Top Info (Date & Type only)
  let metadataY = height - 60;
  page.drawText('DATE:', { x: width - 200, y: metadataY, size: 9, font: boldFont, color: mediumGrey });
  page.drawText(data.date, { x: width - 120, y: metadataY, size: 9, font: regularFont, color: textColor });
  
  page.drawText('INVOICE TYPE:', { x: width - 200, y: metadataY - 18, size: 9, font: boldFont, color: mediumGrey });
  page.drawText(data.invoiceType.toUpperCase(), { x: width - 120, y: metadataY - 18, size: 9, font: boldFont, color: brandRed });

  // --- 3. Client & Branch Section ---
  currentY -= 60; // More gap from logo area
  page.drawRectangle({ x: 50, y: currentY - 80, width: width - 100, height: 85, color: lightGrey, borderColor: borderColor, borderWidth: 1 });
  
  let boxY = currentY - 15;
  // Client Info
  page.drawText('BILLED TO:', { x: 70, y: boxY, size: 9, font: boldFont, color: brandRed });
  page.drawText(data.name.toUpperCase(), { x: 70, y: boxY - 20, size: 14, font: boldFont, color: darkGrey });
  page.drawText(`+91 ${data.mobile}`, { x: 70, y: boxY - 38, size: 10, font: regularFont, color: mediumGrey });
  page.drawText(data.email, { x: 70, y: boxY - 54, size: 9, font: regularFont, color: mediumGrey });

  // Branch Info
  page.drawText('BRANCH:', { x: 350, y: boxY, size: 9, font: boldFont, color: brandRed });
  page.drawText(data.branch || 'MuscleTime Gym', { x: 350, y: boxY - 20, size: 11, font: boldFont, color: darkGrey });
  page.drawText(data.city || 'Center', { x: 350, y: boxY - 38, size: 10, font: regularFont, color: mediumGrey });

  // --- 4. Main Service Table ---
  currentY -= 130; // Increased spacing
  
  // Table Header
  page.drawRectangle({ x: 50, y: currentY, width: width - 100, height: 30, color: darkGrey });
  const tableHeaderY = currentY + 10;
  page.drawText('PACKAGE DESCRIPTION', { x: 70, y: tableHeaderY, size: 10, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('PERIOD', { x: 320, y: tableHeaderY, size: 10, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('SUBTOTAL', { x: 480, y: tableHeaderY, size: 10, font: boldFont, color: rgb(1, 1, 1) });

  // Table Data Row
  currentY -= 35;
  page.drawText(data.planName, { x: 70, y: currentY - 10, size: 11, font: boldFont, color: darkGrey });
  page.drawText(`${data.startDate} to ${data.endDate}`, { x: 320, y: currentY - 10, size: 10, font: regularFont, color: textColor });
  
  const subtotalStr = `Rs. ${data.price}`;
  const subtotalWidth = boldFont.widthOfTextAtSize(subtotalStr, 11);
  page.drawText(subtotalStr, { x: width - 50 - subtotalWidth, y: currentY - 10, size: 11, font: boldFont, color: darkGrey });
  
  currentY -= 45; // More vertical air before summary
  page.drawLine({ start: { x: 50, y: currentY }, end: { x: width - 50, y: currentY }, thickness: 1, color: borderColor });

  // --- 5. Summary/Payment Section ---
  currentY -= 40; 
  const summaryX = width - 260; // Pull left to prevent overlap
  const rightBoundary = width - 60;
  
  const drawSummaryLine = (label: string, value: string, fontVal = regularFont, colorVal = textColor, sizeVal = 10, labelFont = boldFont) => {
    page.drawText(label, { x: summaryX, y: currentY, size: sizeVal, font: labelFont, color: mediumGrey });
    const valWidth = fontVal.widthOfTextAtSize(value, sizeVal);
    page.drawText(value, { x: rightBoundary - valWidth, y: currentY, size: sizeVal, font: fontVal, color: colorVal });
    currentY -= 22; // Gap between lines
  };

  drawSummaryLine('PACKAGE PRICE:', `Rs. ${data.price}`);

  // Dynamic Discount Line
  if (data.discount > 0) {
    const dPercent = data.discountPercentage || 0;
    const dLabel = dPercent > 0 ? `DISCOUNT (${dPercent}%):` : 'DISCOUNT:';
    drawSummaryLine(dLabel, `- Rs. ${data.discount}`, regularFont, rgb(0.8, 0, 0));
    
    // Subtotal after discount
    const subAfterDiscount = data.price - data.discount;
    drawSummaryLine('SUBTOTAL:', `Rs. ${subAfterDiscount}`, boldFont, darkGrey, 9);
    currentY -= 5;
  }

  // Dynamic Tax Line
  const taxAmt = data.taxAmount || 0;
  if (taxAmt > 0) {
    const tPercent = data.taxPercentage || 0;
    const tLabel = tPercent > 0 ? `TAX (${tPercent}%):` : 'TAX:';
    drawSummaryLine(tLabel, `+ Rs. ${taxAmt}`, regularFont, darkGrey);
  }

  const invoiceTotal = data.price - data.discount + taxAmt;
  
  currentY -= 5;
  page.drawLine({ start: { x: summaryX, y: currentY + 15 }, end: { x: width - 50, y: currentY + 15 }, thickness: 1, color: borderColor });
  
  // Total Highlights box
  page.drawRectangle({ x: summaryX - 10, y: currentY - 8, width: 220, height: 35, color: lightGrey });
  drawSummaryLine('TOTAL PAYABLE:', `Rs. ${invoiceTotal}`, boldFont, brandRed, 12, boldFont);
  
  currentY -= 15;
  drawSummaryLine('AMOUNT PAID:', `Rs. ${data.paidPrice}`, boldFont, rgb(0.1, 0.5, 0.1), 13);
  
  const actualBalance = data.balanceAmount;
  if (actualBalance > 0) {
    drawSummaryLine('REMAINING BALANCE:', `Rs. ${actualBalance}`, boldFont, brandRed, 11);
  }

  // --- 6. Footer Section ---
  const footerY = 150;
  page.drawLine({ start: { x: 50, y: footerY }, end: { x: width - 50, y: footerY }, thickness: 1, color: borderColor });
  
  page.drawText('PAYMENT METHOD:', { x: 50, y: footerY - 30, size: 9, font: boldFont, color: mediumGrey });
  page.drawText(data.paymentMode.toUpperCase(), { x: 160, y: footerY - 30, size: 9, font: boldFont, color: darkGrey });
  
  page.drawText('PROCESSED BY:', { x: 50, y: footerY - 50, size: 9, font: boldFont, color: mediumGrey });
  page.drawText(data.responsibleLog.toUpperCase(), { x: 160, y: footerY - 50, size: 9, font: regularFont, color: darkGrey });

  // Centered Thank You Message
  const thanksText = 'THANK YOU FOR YOUR BUSINESS!';
  const thanksWidth = boldFont.widthOfTextAtSize(thanksText, 12);
  page.drawText(thanksText, { x: (width - thanksWidth) / 2, y: 55, size: 12, font: boldFont, color: brandRed });
  
  const pText = 'This is a computer generated document. No signature is required.';
  const pWidth = regularFont.widthOfTextAtSize(pText, 8);
  page.drawText(pText, { x: (width - pWidth) / 2, y: 38, size: 8, font: regularFont, color: mediumGrey });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
