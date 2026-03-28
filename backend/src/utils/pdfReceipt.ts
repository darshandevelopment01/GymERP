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
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
  const { width, height } = page.getSize();
  
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const mainColor = rgb(0.145, 0.388, 0.922); // #2563eb
  const textColor = rgb(0.2, 0.2, 0.2);
  const secondaryColor = rgb(0.4, 0.4, 0.4);
  const borderColor = rgb(0.9, 0.9, 0.9);
  
  let y = height - 50;

  // Header Section
  page.drawText('MUSCLE TIME ERP', { x: 50, y, size: 24, font: boldFont, color: mainColor });
  y -= 25;
  page.drawText('PAYMENT RECEIPT', { x: 50, y, size: 14, font: regularFont, color: secondaryColor });
  
  // Member ID & Date
  page.drawText(`Member ID: ${data.memberId}`, { x: width - 200, y: height - 50, size: 10, font: boldFont, color: textColor });
  page.drawText(`Date: ${data.date}`, { x: width - 200, y: height - 65, size: 10, font: regularFont, color: secondaryColor });
  
  y -= 45;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 30;

  // Member Information
  page.drawText('MEMBER INFORMATION', { x: 50, y, size: 12, font: boldFont, color: mainColor });
  y -= 25;
  
  const drawField = (label: string, value: string, xPos: number, yPos: number) => {
    page.drawText(label, { x: xPos, y: yPos, size: 10, font: boldFont, color: secondaryColor });
    page.drawText(value || 'N/A', { x: xPos + 100, y: yPos, size: 10, font: regularFont, color: textColor });
  };

  drawField('Name:', data.name, 50, y);
  drawField('Branch:', data.branch || 'N/A', 300, y);
  y -= 20;
  drawField('Mobile:', data.mobile, 50, y);
  drawField('City:', data.city || 'N/A', 300, y);
  y -= 20;
  drawField('Email:', data.email, 50, y);
  y -= 40;

  // Plan Details
  page.drawText('PLAN & MEMBERSHIP DETAILS', { x: 50, y, size: 12, font: boldFont, color: mainColor });
  y -= 25;
  
  // Table Header
  page.drawRectangle({ x: 50, y: y - 10, width: width - 100, height: 25, color: rgb(0.97, 0.98, 1) });
  page.drawText('PLAN NAME / DESCRIPTION', { x: 60, y, size: 10, font: boldFont, color: mainColor });
  page.drawText('DURATION', { x: 300, y, size: 10, font: boldFont, color: mainColor });
  page.drawText('AMOUNT', { x: 450, y, size: 10, font: boldFont, color: mainColor });
  y -= 35;

  // Table Content
  page.drawText(data.planName, { x: 60, y, size: 10, font: regularFont, color: textColor });
  page.drawText(`${data.startDate} to ${data.endDate}`, { x: 300, y, size: 10, font: regularFont, color: textColor });
  page.drawText(`₹${data.totalPayment}`, { x: 450, y, size: 10, font: regularFont, color: textColor });
  y -= 20;
  
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 40;

  // Payment Breakdown
  const summaryX = width - 250;
  
  const drawSummaryLine = (label: string, value: string, isTotal = false) => {
    const fontSize = isTotal ? 12 : 10;
    const font = isTotal ? boldFont : regularFont;
    page.drawText(label, { x: summaryX, y, size: fontSize, font: font, color: textColor });
    page.drawText(value, { x: summaryX + 120, y, size: fontSize, font: font, color: textColor });
    y -= 20;
  };

  drawSummaryLine('Base Amount:', `₹${data.price}`);
  drawSummaryLine('Discount:', `- ₹${data.discount}`);
  
  page.drawLine({ start: { x: summaryX, y: y + 5 }, end: { x: width - 50, y: y + 5 }, thickness: 1, color: borderColor });
  drawSummaryLine('Total Amount:', `₹${data.totalPayment}`, true);
  y -= 5;
  
  page.drawRectangle({ x: summaryX - 5, y: y - 5, width: 200, height: 30, color: rgb(0.95, 1, 0.95) });
  page.drawText('PAID AMOUNT:', { x: summaryX, y, size: 12, font: boldFont, color: rgb(0.1, 0.5, 0.1) });
  page.drawText(`₹${data.paidPrice}`, { x: summaryX + 120, y, size: 12, font: boldFont, color: rgb(0.1, 0.5, 0.1) });
  y -= 30;
  
  if (data.balanceAmount > 0) {
    page.drawText('BALANCE DUE:', { x: summaryX, y, size: 10, font: boldFont, color: rgb(0.8, 0.1, 0.1) });
    page.drawText(`₹${data.balanceAmount}`, { x: summaryX + 120, y, size: 10, font: boldFont, color: rgb(0.8, 0.1, 0.1) });
    y -= 20;
  }

  // Footer & Metatdata
  y = 150;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: borderColor });
  y -= 30;
  
  drawField('Payment Mode:', data.paymentMode, 50, y);
  drawField('Invoice Type:', data.invoiceType, 300, y);
  y -= 20;
  drawField('Processed By:', data.responsibleLog, 50, y);
  drawField('Time:', data.dateTime, 300, y);
  
  y = 50;
  const footerText = 'This is a computer-generated receipt. No signature is required.';
  const textWidth = regularFont.widthOfTextAtSize(footerText, 8);
  page.drawText(footerText, { x: (width - textWidth) / 2, y, size: 8, font: regularFont, color: secondaryColor });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
