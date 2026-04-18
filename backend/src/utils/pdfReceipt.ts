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
  previousRemaining?: number;
  invoiceNo?: string;
  branchAddress?: string;
  state?: string;
  zipCode?: string;
}

/**
 * Utility to convert numbers to words (limited range for receipts)
 */
const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const scales = ['', 'Thousand', 'Lakh', 'Crore'];

  const helper = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + helper(n % 100) : '');
    return '';
  };

  // Indian numbering system logic (simplified for common receipt values)
  if (num < 1000) return helper(num);
  
  let res = '';
  // Thousands
  if (num >= 1000 && num < 100000) {
    res = helper(Math.floor(num / 1000)) + ' Thousand';
    const rem = num % 1000;
    if (rem > 0) res += ' ' + helper(rem);
  } else if (num >= 100000) {
    // Very basic fallback for larger numbers
    return num.toLocaleString('en-IN');
  }

  return res.trim();
};

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
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  
  // Design system colors based on Image 1
  const brandRed = rgb(0.85, 0.1, 0.1); 
  const pureBlack = rgb(0, 0, 0);
  const darkGrey = rgb(0.2, 0.2, 0.2);
  const mediumGrey = rgb(0.4, 0.4, 0.4);
  const dividerGrey = rgb(0.9, 0.9, 0.9);
  const lightBg = rgb(0.98, 0.98, 0.98);

  let currentY = height - 10;

  // 1. Top Decorative Red Bar
  page.drawRectangle({ x: 0, y: height - 5, width: width, height: 5, color: brandRed });
  currentY -= 30;

  // 2. Title "Tax Invoice"
  const titleText = 'Tax Invoice';
  const titleWidth = boldFont.widthOfTextAtSize(titleText, 16);
  page.drawText(titleText, { x: (width - titleWidth) / 2, y: currentY, size: 16, font: boldFont, color: pureBlack });
  currentY -= 40;

  // 3. Logo and Header Info
  let logoY = currentY - 50;
  try {
    const logoPaths = [
      path.join(__dirname, '../assets/logo.png'),
      path.join(__dirname, '../../src/assets/logo.png'),
      'src/assets/logo.png'
    ];
    let logoBuffer;
    for (const p of logoPaths) {
      if (fs.existsSync(p)) {
        logoBuffer = fs.readFileSync(p);
        break;
      }
    }
    if (logoBuffer) {
      const logoImage = await pdfDoc.embedPng(logoBuffer);
      const logoDims = logoImage.scale(0.12);
      page.drawImage(logoImage, {
        x: 50,
        y: logoY,
        width: logoDims.width,
        height: logoDims.height,
      });
      // Brand name below logo (left) - REMOVED AS PER REQUEST
      // page.drawText('Muscle Time Fitness', { x: 50, y: logoY - 15, size: 11, font: boldFont, color: brandRed });
    }
  } catch (err) {
    console.error('Logo error:', err);
    page.drawText(data.branch || 'GYM', { x: 50, y: logoY + 10, size: 28, font: boldFont, color: brandRed });
  }

  // Gym Address Info (Right of logo, centered context)
  const gymAddress = [
    `${data.branch || ''}`,
    data.branchAddress,
    data.city ? `${data.city}, ${data.state || ''} ${data.zipCode}` : "India"
  ];
  let addressY = currentY;
  gymAddress.forEach((line, i) => {
    const lineSize = i === 0 ? 11 : 9;
    const lineFont = i === 0 ? boldFont : italicFont;
    const lineWidth = lineFont.widthOfTextAtSize(line, lineSize);
    page.drawText(line, { x: width - 50 - lineWidth, y: addressY, size: lineSize, font: lineFont, color: pureBlack });
    addressY -= 14;
  });

  currentY -= 100;

  // 4. Customer Info and Invoice Details Blocks
  page.drawLine({ start: { x: 50, y: currentY }, end: { x: width - 50, y: currentY }, thickness: 0.5, color: dividerGrey, dashArray: [2, 2] });
  currentY -= 20;

  // Left side: Customer Info
  let leftX = 50;
  let infoY = currentY;
  const drawLabelValue = (label: string, value: string, x: number, y: number) => {
    page.drawText(`${label} : `, { x, y, size: 10, font: boldFont, color: pureBlack });
    const labelWidth = boldFont.widthOfTextAtSize(`${label} : `, 10);
    page.drawText(value, { x: x + labelWidth, y, size: 10, font: regularFont, color: darkGrey });
  };

  drawLabelValue('Customer Name', data.name, leftX, infoY); infoY -= 18;
  drawLabelValue('Email', data.email, leftX, infoY); infoY -= 18;
  drawLabelValue('Mobile', data.mobile, leftX, infoY); infoY -= 18;
  drawLabelValue('Membership ID', data.memberId, leftX, infoY); infoY -= 18;
  drawLabelValue('Place of Supply', 'Maharashtra', leftX, infoY);

  // Right side: Invoice Details
  let rightX = width - 220;
  infoY = currentY;
  drawLabelValue('Invoice Type', data.invoiceType, rightX, infoY); infoY -= 18;
  drawLabelValue('Invoice No.', data.invoiceNo || 'N/A', rightX, infoY); infoY -= 18;
  drawLabelValue('Date of Invoice', data.date, rightX, infoY); infoY -= 18;
  drawLabelValue('Sales Rep', data.responsibleLog || 'Reception', rightX, infoY);

  currentY -= 110;

  // 5. SERVICE FEE Bar
  page.drawRectangle({ x: 50, y: currentY, width: width - 100, height: 25, color: lightBg });
  page.drawText('SERVICE FEE', { x: width - 150, y: currentY + 8, size: 10, font: boldFont, color: darkGrey });
  currentY -= 35;

  // 6. Plan Details Row
  const planLineText = `${data.planName.toUpperCase()}, Date :${data.startDate} To ${data.endDate}`;
  page.drawText(planLineText, { x: 55, y: currentY, size: 11, font: boldFont, color: pureBlack });
  
  const baseFeeText = `Base Fee : Rs. ${data.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const baseFeeWidth = boldFont.widthOfTextAtSize(baseFeeText, 11);
  page.drawText(baseFeeText, { x: width - 50 - baseFeeWidth, y: currentY, size: 11, font: boldFont, color: pureBlack });
  
  currentY -= 20;
  page.drawLine({ start: { x: 50, y: currentY }, end: { x: width - 50, y: currentY }, thickness: 0.5, color: dividerGrey });
  currentY -= 30;

  // 7. Financial Summary Block
  const summaryBlockX = width - 260;
  const summaryBoxWidth = 210;
  const drawSummaryRow = (label: string, value: string, isBold = false, y: number) => {
    const font = isBold ? boldFont : regularFont;
    page.drawText(label, { x: summaryBlockX + 5, y, size: 10, font: boldFont, color: pureBlack });
    const valWidth = font.widthOfTextAtSize(value, 10);
    page.drawText(value, { x: width - 55 - valWidth, y, size: 10, font, color: pureBlack });
  };

  drawSummaryRow('Total Due', `Rs. ${data.totalPayment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, true, currentY);
  currentY -= 25;
  
  drawSummaryRow(`Paid (${data.date})`, `Rs. ${data.paidPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, true, currentY);
  currentY -= 30;

  // Mode of Payment Box
  page.drawRectangle({ x: summaryBlockX + 10, y: currentY - 5, width: 150, height: 25, color: lightBg, borderColor: dividerGrey, borderWidth: 0.5 });
  page.drawText(`Mode of Payment : ${data.paidPrice}(${data.paymentMode})`, { x: summaryBlockX + 15, y: currentY + 5, size: 9, font: boldFont, color: pureBlack });
  currentY -= 40;

  // Amount in words
  page.drawText('Paid Amount in Words :', { x: summaryBlockX + 5, y: currentY, size: 9, font: boldFont, color: pureBlack });
  currentY -= 18;
  const words = numberToWords(data.paidPrice);
  const wordsWidth = boldFont.widthOfTextAtSize(words, 10);
  page.drawText(words, { x: width - 50 - wordsWidth, y: currentY, size: 10, font: boldFont, color: darkGrey });
  
  currentY -= 15;
  page.drawLine({ start: { x: 50, y: currentY }, end: { x: width - 50, y: currentY }, thickness: 0.5, color: dividerGrey });
  currentY -= 25;

  // 8. Terms and Conditions
  const tcTitle = 'TERMS AND CONDITIONS';
  const tcTitleWidth = boldFont.widthOfTextAtSize(tcTitle, 11);
  page.drawText(tcTitle, { x: (width - tcTitleWidth) / 2, y: currentY, size: 11, font: boldFont, color: pureBlack });
  currentY -= 20;

  const terms = [
    "Gym Terms & Conditions -",
    "1. Membership is non-transferable and non-refundable.",
    "2. Fees must be paid on time to continue access.",
    "3. Members must follow gym rules and staff instructions.",
    "4. Proper gym attire and clean shoes are required.",
    "5. Use equipment responsibly; report any damage immediately.",
    "6. The gym is not responsible for lost or stolen items.",
    "7. Misconduct or unsafe behavior may result in membership cancellation.",
    "8. Members exercise at their own risk."
  ];

  terms.forEach((term, i) => {
    page.drawText(term, { x: 55, y: currentY, size: 9, font: i === 0 ? boldFont : regularFont, color: pureBlack });
    currentY -= 14;
  });

  currentY -= 40;

  // 9. Signatures
  page.drawText('Signature of member', { x: 55, y: currentY, size: 10, font: boldFont, color: darkGrey });
  page.drawText(`For ${data.branch || 'Gym'}`, { x: width - 180, y: currentY, size: 10, font: boldFont, color: darkGrey });
  currentY -= 30;
  page.drawText(data.name, { x: 55, y: currentY, size: 10, font: boldFont, color: pureBlack });
  page.drawText('Authorised Signatory', { x: width - 165, y: currentY, size: 10, font: boldFont, color: pureBlack });
  currentY -= 15;
  page.drawText(data.date, { x: 55, y: currentY, size: 10, font: boldFont, color: pureBlack });
  
  currentY -= 25;

  // 10. Footer Section
  const footerText = `If you have any questions about this bill, please contact Mail : muscletimehelp@gmail.com, Phone : 9511811811`;
  const ftWidth = regularFont.widthOfTextAtSize(footerText, 8);
  page.drawText(footerText, { x: (width - ftWidth) / 2, y: currentY, size: 8, font: regularFont, color: pureBlack });
  currentY -= 25;

  // Centered Thank You Message
  const thanksText = 'THANK YOU FOR YOUR BUSINESS! www.muscletime.co.in';
  const thanksWidth = boldFont.widthOfTextAtSize(thanksText, 12);
  page.drawRectangle({ x: 50, y: currentY - 5, width: width - 100, height: 25, color: dividerGrey, opacity: 0.5 });
  page.drawText(thanksText, { x: (width - thanksWidth) / 2, y: currentY + 5, size: 12, font: boldFont, color: darkGrey });
  currentY -= 30;
  
  const disclaimerText = 'This is a computer generated invoice. No signature is required.';
  const discWidth = boldFont.widthOfTextAtSize(disclaimerText, 9);
  page.drawText(disclaimerText, { x: (width - discWidth) / 2, y: currentY, size: 9, font: boldFont, color: pureBlack });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
