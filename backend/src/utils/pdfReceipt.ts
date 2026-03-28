import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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
  page.drawRectangle({ x: 0, y: height - 10, width, height: 10, color: brandRed });

  // --- 2. Brand Section ---
  currentY -= 40;
  page.drawText('MUSCLE TIME', { x: 50, y: currentY, size: 28, font: boldFont, color: brandRed });
  page.drawText('E-RECEIPT', { x: 50, y: currentY - 20, size: 10, font: boldFont, color: mediumGrey });
  
  // Receipt Metadata (Top Right)
  page.drawText('RECEIPT NO:', { x: width - 180, y: currentY, size: 9, font: boldFont, color: mediumGrey });
  page.drawText(`#${data.memberId}-${new Date().getTime().toString().slice(-6)}`, { x: width - 100, y: currentY, size: 9, font: regularFont, color: textColor });
  
  page.drawText('DATE:', { x: width - 180, y: currentY - 15, size: 9, font: boldFont, color: mediumGrey });
  page.drawText(data.date, { x: width - 100, y: currentY - 15, size: 9, font: regularFont, color: textColor });
  
  page.drawText('INVOICE TYPE:', { x: width - 180, y: currentY - 30, size: 9, font: boldFont, color: mediumGrey });
  page.drawText(data.invoiceType, { x: width - 100, y: currentY - 30, size: 9, font: boldFont, color: brandRed });

  // --- 3. Client & Branch Box ---
  currentY -= 80;
  page.drawRectangle({ x: 50, y: currentY - 60, width: width - 100, height: 70, color: lightGrey, borderColor: borderColor, borderWidth: 1 });
  
  let boxY = currentY - 15;
  // Left Column
  page.drawText('BILLED TO:', { x: 70, y: boxY, size: 9, font: boldFont, color: brandRed });
  page.drawText(data.name.toUpperCase(), { x: 70, y: boxY - 15, size: 12, font: boldFont, color: darkGrey });
  page.drawText(`+91 ${data.mobile}`, { x: 70, y: boxY - 30, size: 9, font: regularFont, color: mediumGrey });
  page.drawText(data.email, { x: 70, y: boxY - 42, size: 8, font: regularFont, color: mediumGrey });

  // Right Column
  page.drawText('BRANCH DETAILS:', { x: 350, y: boxY, size: 9, font: boldFont, color: brandRed });
  page.drawText(data.branch || 'MuscleTime Gym', { x: 350, y: boxY - 15, size: 10, font: boldFont, color: darkGrey });
  page.drawText(data.city || 'Pune, India', { x: 350, y: boxY - 30, size: 9, font: regularFont, color: mediumGrey });

  // --- 4. Main Service Table ---
  currentY -= 100;
  
  // Table Header
  page.drawRectangle({ x: 50, y: currentY - 5, width: width - 100, height: 30, color: darkGrey });
  const tableY = currentY + 7;
  page.drawText('PLAN DETAILS & DESCRIPTION', { x: 70, y: tableY, size: 10, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('PERIOD', { x: 320, y: tableY, size: 10, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText('SUBTOTAL', { x: 480, y: tableY, size: 10, font: boldFont, color: rgb(1, 1, 1) });

  currentY -= 30;
  // Table Row
  page.drawText(data.planName, { x: 70, y: currentY - 10, size: 11, font: boldFont, color: darkGrey });
  page.drawText(`${data.startDate} to ${data.endDate}`, { x: 320, y: currentY - 10, size: 10, font: regularFont, color: textColor });
  page.drawText(`Rs. ${data.price}`, { x: 480, y: currentY - 10, size: 11, font: boldFont, color: darkGrey });
  
  currentY -= 30;
  page.drawLine({ start: { x: 50, y: currentY }, end: { x: width - 50, y: currentY }, thickness: 1, color: borderColor });

  // --- 5. Summary/Payment Section ---
  currentY -= 40;
  const summaryX = width - 220;
  
  const drawLine = (label: string, value: string, fontVal = regularFont, colorVal = textColor, sizeVal = 10) => {
    page.drawText(label, { x: summaryX, y: currentY, size: sizeVal, font: boldFont, color: mediumGrey });
    
    // Manual Right Alignment calculation
    const valWidth = fontVal.widthOfTextAtSize(value, sizeVal);
    page.drawText(value, { x: width - 50 - valWidth, y: currentY, size: sizeVal, font: fontVal, color: colorVal });
    currentY -= 20;
  };

  drawLine('PACKAGE PRICE:', `Rs. ${data.price}`);
  drawLine('DISCOUNT:', `- Rs. ${data.discount}`, regularFont, rgb(0.8, 0, 0));
  
  currentY -= 5;
  page.drawLine({ start: { x: summaryX, y: currentY + 15 }, end: { x: width - 50, y: currentY + 15 }, thickness: 1, color: borderColor });
  
  // Total Highlights
  page.drawRectangle({ x: summaryX - 10, y: currentY - 5, width: 180, height: 30, color: lightGrey });
  page.drawText('TOTAL PAYABLE:', { x: summaryX, y: currentY + 8, size: 11, font: boldFont, color: darkGrey });
  page.drawText(`Rs. ${data.totalPayment}`, { x: width - 60, y: currentY + 8, size: 12, font: boldFont, color: brandRed });
  
  currentY -= 40;
  page.drawText('AMOUNT PAID:', { x: summaryX, y: currentY, size: 11, font: boldFont, color: mediumGrey });
  page.drawText(`Rs. ${data.paidPrice}`, { x: width - 60, y: currentY, size: 13, font: boldFont, color: rgb(0.1, 0.5, 0.1) });
  
  if (data.balanceAmount > 0) {
    currentY -= 25;
    page.drawText('BALANCE DUE:', { x: summaryX, y: currentY, size: 10, font: boldFont, color: mediumGrey });
    page.drawText(`Rs. ${data.balanceAmount}`, { x: width - 60, y: currentY, size: 11, font: boldFont, color: brandRed });
  }

  // --- 6. Footer Section ---
  const footerY = 120;
  page.drawLine({ start: { x: 50, y: footerY }, end: { x: width - 50, y: footerY }, thickness: 1, color: borderColor });
  
  page.drawText('PAYMENT METHOD:', { x: 50, y: footerY - 25, size: 9, font: boldFont, color: mediumGrey });
  page.drawText(data.paymentMode.toUpperCase(), { x: 150, y: footerY - 25, size: 9, font: boldFont, color: darkGrey });
  
  page.drawText('PROCESSED BY:', { x: 50, y: footerY - 40, size: 9, font: boldFont, color: mediumGrey });
  page.drawText(data.responsibleLog.toUpperCase(), { x: 150, y: footerY - 40, size: 9, font: regularFont, color: darkGrey });

  // Thank You Message
  page.drawText('THANK YOU FOR YOUR BUSINESS!', { x: width / 2 - 100, y: 60, size: 12, font: boldFont, color: brandRed });
  page.drawText('This is a computer generated document. No signature is required.', { x: width / 2 - 140, y: 40, size: 8, font: regularFont, color: mediumGrey });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
