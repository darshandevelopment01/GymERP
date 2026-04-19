import { Request, Response } from 'express';
import Member from '../models/Member';
import Plan from '../models/Plan';
import Branch from '../models/Branch';
import ActivityLog from '../models/ActivityLog';
import Employee from '../models/Employee';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { sendEmail, generateDocxBuffer, generateReceiptPdfBuffer } from '../utils/mailer';
import path from 'path';
import { getUserBranchFilter } from '../middleware/auth.middleware';

// Helper to capitalize first letter of each name part
const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper to format Invoice No based on Image 1 (S/serial/fiscal_year)
const formatInvoiceNo = (memberId: string): string => {
  try {
    const parts = memberId.split('-');
    if (parts.length < 3) return `S/${memberId}`;
    
    const serial = parts[2].replace(/^0+/, ''); // Remove leading zeros
    const date = new Date();
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth() + 1; // 1-12

    let startYear, endYear;
    if (currentMonth >= 4) {
      startYear = currentYear;
      endYear = currentYear + 1;
    } else {
      startYear = currentYear - 1;
      endYear = currentYear;
    }

    const fiscalYear = `${String(startYear).slice(-2)}-${String(endYear).slice(-2)}`;
    return `S/${serial}/${fiscalYear}`;
  } catch (err) {
    return `S/${memberId}`;
  }
};

// Create new member
export const createMember = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('=== CREATE MEMBER STARTED ===');
    console.log('📥 Raw request body:', JSON.stringify(req.body, null, 2));

    // ✅ Trim all string fields
    const trimmedData: any = { ...req.body };
    Object.keys(trimmedData).forEach(key => {
      if (typeof trimmedData[key] === 'string') {
        trimmedData[key] = trimmedData[key].trim();
      }
    });

    // ✅ Validate branch
    if (!mongoose.Types.ObjectId.isValid(trimmedData.branch)) {
      res.status(400).json({ success: false, message: 'Invalid branch ID format' });
      return;
    }

    const branchExists = await Branch.findById(trimmedData.branch);
    if (!branchExists) {
      res.status(400).json({ success: false, message: 'Branch not found' });
      return;
    }

    // ✅ Validate plan
    if (!mongoose.Types.ObjectId.isValid(trimmedData.plan)) {
      res.status(400).json({ success: false, message: 'Invalid plan ID format' });
      return;
    }

    const planExists = await Plan.findById(trimmedData.plan);
    if (!planExists) {
      res.status(400).json({ success: false, message: 'Plan not found' });
      return;
    }

    // ✅ Calculate membership end date based on plan duration
    const startDate = new Date(trimmedData.membershipStartDate || Date.now());
    const endDate = new Date(startDate);

    // Parse plan duration (e.g., "3 Months", "1 Year")
    const durationMatch = planExists.duration.match(/(\d+)\s*(Month|Year|Day)/i);
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();

      if (unit.includes('month')) {
        endDate.setMonth(endDate.getMonth() + value);
        endDate.setDate(endDate.getDate() - 1);
      } else if (unit.includes('year')) {
        endDate.setFullYear(endDate.getFullYear() + value);
        endDate.setDate(endDate.getDate() - 1);
      } else if (unit.includes('day')) {
        endDate.setDate(endDate.getDate() + value - 1);
      }
    } else {
      // Default to 1 year if parsing fails
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // ✅ Calculate payment remaining
    const paymentRemaining = Math.max(0, (trimmedData.totalAmount || planExists.price) - (trimmedData.paymentReceived || 0));

    const memberData = {
      ...trimmedData,
      membershipEndDate: endDate,
      paymentRemaining: paymentRemaining,
      convertedBy: req.user?.id || null
    };

    console.log('📝 Final member data:', JSON.stringify(memberData, null, 2));

    const member = new Member(memberData);

    // ✅ Track initial payment in payments history
    if (trimmedData.paymentReceived > 0) {
      member.payments.push({
        amount: trimmedData.paymentReceived,
        paymentDate: new Date(),
        paymentMode: trimmedData.paymentMode || 'Cash',
        recordedBy: (req.user?.id as any) || null,
        note: 'Initial payment for membership creation'
      });
    }

    await member.save();

    // Generate credentials for email notification
    const generatedPassword = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit random number

    // ✅ Send Email to Member
    console.log(`\n================================`);
    console.log(`📧 DISPATCHING EMAIL TO NEW MEMBER`);
    console.log(`To: ${trimmedData.email}`);
    console.log(`================================\n`);

    const htmlMessage = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #6366f1; text-align: center;">Welcome to Muscle Time Fitness!</h2>
        <p>Hello <strong>${toTitleCase(trimmedData.name)}</strong>,</p>
        <p>Your gym membership has been successfully created. Please use the following credentials to log in to our <strong>Mobile Application</strong>:</p>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #6366f1;">
          <p style="margin: 0 0 10px 0;"><strong>Username:</strong> ${trimmedData.email} (or ${trimmedData.mobileNumber})</p>
          <p style="margin: 0;"><strong>Password:</strong> <span style="font-family: monospace; font-size: 1.1em; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${generatedPassword}</span></p>
        </div>

        <p style="background: #fffbeb; color: #92400e; padding: 10px; border-radius: 6px; font-size: 0.9rem;">
          <strong>⚠️ Note:</strong> These credentials are for <u>Mobile App Access only</u>. Web login is currently restricted to administrators.
        </p>

        <p>We have also attached your <strong>Membership Details (MTF Reseat)</strong> to this email for your records.</p>
        
        <p>Best regards,<br/>Team Muscle Time Fitness</p>
      </div>
    `;

    console.log('📄 Receipt PDF generation starting...');
    console.log('📄 Receipt Input Data:', JSON.stringify({
      name: trimmedData.name, email: trimmedData.email,
      planName: planExists.planName, price: planExists.price,
      paymentReceived: trimmedData.paymentReceived
    }));
    // 📄 Prepare PDF Attachment
    let attachments: any[] = [];
    let receiptBuffer: Buffer | null = null;
    let receiptErrorMsg: string | null = null;
    try {
      const employee = await Employee.findById(req.user?.id);

      receiptBuffer = await generateReceiptPdfBuffer({
        name: trimmedData.name,
        email: trimmedData.email,
        mobile: trimmedData.mobileNumber,
        planName: planExists.planName,
        packageDetail: planExists.planName,
        price: planExists.price,
        packagePrice: planExists.price,
        startDate: startDate.toLocaleDateString('en-IN'),
        endDate: endDate.toLocaleDateString('en-IN'),
        memberId: member.memberId,
        invoiceNo: formatInvoiceNo(member.memberId),
        branch: branchExists?.name || 'N/A',
        branchAddress: branchExists?.address || 'N/A',
        city: branchExists?.city || 'N/A',
        state: branchExists?.state || 'N/A',
        zipCode: branchExists?.zipCode || 'N/A',
        date: new Date().toLocaleDateString('en-IN'),
        dateTime: new Date().toLocaleString('en-IN'),
        dateOfInvoice: new Date().toLocaleDateString('en-IN'),
        responsibleLog: employee?.name || 'Reception',
        invoiceType: 'New Booking',
        paidPrice: trimmedData.paymentReceived || 0,
        balanceAmount: paymentRemaining,
        totalPayment: trimmedData.totalAmount || planExists.price,
        discount: trimmedData.discountAmount || 0,
        discountPercentage: trimmedData.discountPercentage || 0,
        taxPercentage: trimmedData.taxPercentage || 0,
        taxAmount: trimmedData.taxAmount || 0,
        paymentMode: trimmedData.paymentMode || 'UPI',
        nextPaymentDate: member.nextPaymentDate ? new Date(member.nextPaymentDate).toLocaleDateString('en-IN') : undefined
      });

      console.log(`✅ PDF Receipt generated: ${receiptBuffer.length} bytes`);

      attachments.push({
        filename: `${trimmedData.name}_MTF_Reseat.pdf`,
        content: receiptBuffer,
        contentType: 'application/pdf'
      });
    } catch (docxErr: any) {
      console.error('❌ Failed to generate Receipt PDF:', docxErr);
      receiptErrorMsg = docxErr?.message || 'Unknown PDF generation error';
    }

    // 📧 Send email (awaiting to ensure Vercel doesn't kill the function before sending)
    const emailSent = await sendEmail(
      trimmedData.email,
      'Welcome to Muscle Time Fitness - Your Membership Credentials',
      htmlMessage,
      attachments
    );

    console.log(`📡 Email Status for ${trimmedData.email}: ${emailSent ? 'Sent' : 'Failed'}`);

    // ✅ Create activity log
    try {
      const user = await Employee.findById(req.user?.id);
      await ActivityLog.create({
        action: 'member_converted',
        performedBy: req.user?.id,
        performedByName: user?.name || 'Unknown',
        targetType: 'Member',
        targetId: member._id,
        targetName: trimmedData.name,
        details: `Enquiry converted to Member (${member.memberId}) for ${trimmedData.name}`
      });
    } catch (logError) {
      console.error('Failed to create activity log:', logError);
    }

    const populatedMember = await Member.findById(member._id)
      .populate('branch', 'name city address state zipCode')
      .populate('plan', 'planName duration price');

    console.log('✅ Member created:', populatedMember?.memberId);

    res.status(201).json({
      success: true,
      data: populatedMember,
      receiptBuffer: receiptBuffer ? receiptBuffer.toString('base64') : null,
      receiptFilename: receiptBuffer ? `${trimmedData.name}_MTF_Reseat.pdf` : null,
      message: 'Member created successfully!' + 
        (emailSent ? ' Credentials & Receipt emailed.' : ' (⚠️ Email failed to send, check logs)') +
        (receiptErrorMsg ? ` \n⚠️ Receipt Generation Error: ${receiptErrorMsg}` : '')
    });
  } catch (error: any) {
    console.error('❌ Error creating member:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create member'
    });
  }
};

// Get all members
export const getAllMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    // ✅ AUTO-EXPIRE: Mark active members as expired if membershipEndDate has passed
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const autoExpiredResult = await Member.updateMany({
      status: 'active',
      membershipEndDate: { $lt: today, $ne: null }
    }, { status: 'expired' });

    if (autoExpiredResult.modifiedCount > 0) {
      console.log(`📉 Auto-marked ${autoExpiredResult.modifiedCount} members as EXPIRED`);
    }

    // Support selfOnly filter for viewOnlySelfCreated permission
    const filter: any = {};
    if (req.query.selfOnly === 'true' && req.user?.id) {
      filter.convertedBy = req.user.id;
    }

    // ✅ Branch scoping: employees only see their branch's members
    const branchFilter = await getUserBranchFilter(req);
    Object.assign(filter, branchFilter);

    const members = await Member.find(filter)
      .populate('branch', 'name city address state zipCode')
      .populate('plan', 'planName duration price')
      .populate('convertedBy', 'name')
      .populate({ path: 'enquiryId', populate: { path: 'createdBy', select: 'name' } })
      .populate('history.plan', 'planName duration price')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: members });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch members' });
  }
};

export const getMemberById = async (req: Request, res: Response): Promise<void> => {
  try {
    // ✅ AUTO-EXPIRE: Mark active members as expired if membershipEndDate has passed
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const autoExpiredResult = await Member.updateMany({
      status: 'active',
      membershipEndDate: { $lt: today, $ne: null }
    }, { status: 'expired' });

    if (autoExpiredResult.modifiedCount > 0) {
      console.log(`📉 Auto-marked ${autoExpiredResult.modifiedCount} members as EXPIRED (during fetch by ID)`);
    }

    const member = await Member.findById(req.params.id)
      .populate('branch', 'name city address state zipCode')
      .populate('plan', 'planName duration price')
      .populate('convertedBy', 'name')
      .populate({ path: 'enquiryId', populate: { path: 'createdBy', select: 'name' } })
      .populate('history.plan', 'planName duration price');

    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found' });
      return;
    }

    res.json({ success: true, data: member });
  } catch (error) {
    console.error('Error fetching member:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch member' });
  }
};

export const updateMember = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Find member and capture old state for history/receipt logic
    const member = await Member.findById(req.params.id);
    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found' });
      return;
    }

    // Capture old values BEFORE updating for comparison and history archiving
    const oldState = JSON.parse(JSON.stringify(member));
    const oldEndDate = oldState.membershipEndDate ? new Date(oldState.membershipEndDate).toISOString() : null;
    const oldPaymentTotal = oldState.paymentReceived || 0;
    const oldPaymentRemaining = oldState.paymentRemaining || 0;

    // 2. Prepare new values
    const newEndDate = req.body.membershipEndDate ? new Date(req.body.membershipEndDate).toISOString() : null;
    
    // Support two types of updates:
    // 1. "additionalPayment" approach (from Add Payment modal) - source of truth delta
    // 2. "paymentReceived" approach (from Renewal/Full Update) - source of truth total
    let freshPaymentAmount = 0;
    
    if (req.body.additionalPayment !== undefined) {
      // Add Payment Flow: trust the amount being added
      freshPaymentAmount = Number(req.body.additionalPayment) || 0;
      member.paymentReceived = (member.paymentReceived || 0) + freshPaymentAmount;
      member.paymentRemaining = Math.max(0, (member.paymentRemaining || 0) - freshPaymentAmount);
    } else if (req.body.paymentReceived !== undefined) {
      // Renewal/Full Update Flow: trust the total received sent from frontend
      const newPaymentTotal = Number(req.body.paymentReceived) || 0;
      freshPaymentAmount = newPaymentTotal - oldPaymentTotal;
    }

    // ✅ RENEWAL ARCHIVING
    if (newEndDate && oldEndDate && oldEndDate !== newEndDate) {
      console.log(`📦 ARCHIVING HISTORY: Member ${member.memberId} is being renewed.`);
      if (!Array.isArray(member.history)) member.history = [];
      member.history.push({
        plan: member.plan,
        membershipStartDate: member.membershipStartDate,
        membershipEndDate: member.membershipEndDate,
        planAmount: member.planAmount || 0,
        discountPercentage: member.discountPercentage || 0,
        discountAmount: member.discountAmount || 0,
        taxPercentage: member.taxPercentage || 0,
        taxAmount: member.taxAmount || 0,
        totalAmount: member.totalAmount || 0,
        paymentReceived: member.paymentReceived || 0,
        paymentRemaining: member.paymentRemaining || 0,
        status: member.status,
        recordedAt: new Date()
      });
    }

    // ✅ PAYMENT TRACKING
    if (freshPaymentAmount > 0) {
      const pMode = req.body.paymentMode || 'UPI';
      console.log(`💰 RECORDING PAYMENT: ₹${freshPaymentAmount} (${pMode}) for ${member.name}`);
      if (!Array.isArray(member.payments)) member.payments = [];
      member.payments.push({
        amount: freshPaymentAmount,
        paymentDate: new Date(),
        paymentMode: pMode,
        recordedBy: (req.user?.id as any) || null,
        note: req.body.paymentNote || (newEndDate && oldEndDate !== newEndDate ? 'Renewal payment' : 'Additional payment')
      });
    }

    // 3. Apply updates to the document
    const updateFields = { ...req.body };
    delete updateFields.history; // Don't let user overwrite history/payments arrays directly
    delete updateFields.payments;
    delete updateFields.paymentMode; // Used for tracking only, not a top-level field
    delete updateFields.paymentNote;
    delete updateFields.additionalPayment; // Internal helper
    
    // If we're in "additionalPayment" flow, don't let stale frontend totals overwrite our computed DB values
    if (req.body.additionalPayment !== undefined) {
      delete updateFields.paymentReceived;
      delete updateFields.paymentRemaining;
    }
    
    Object.assign(member, updateFields);
    await member.save();

    // 4. Send Receipt if Payment detected
    let receiptBuffer: Buffer | null = null;
    let receiptFilename: string | null = null;
    let receiptErrorMsg: string | null = null;

    if (freshPaymentAmount > 0) {
      console.log(`💰 DISPATCHING RECEIPT for ₹${freshPaymentAmount}`);
      const isRenewal = !!req.body.membershipEndDate && oldEndDate !== newEndDate;
      const receiptTitle = isRenewal ? 'Membership Renewal' : 'Partial Payment';
      
      try {
          console.log('📄 Receipt PDF generation starting (Update/Payment)...');
          const employee = await Employee.findById(req.user?.id);
          const populatedForEmail = await Member.findById(member._id)
            .populate('branch', 'name city address state zipCode')
            .populate('plan', 'planName duration price');

          receiptBuffer = await generateReceiptPdfBuffer({
            name: member.name,
            email: member.email,
            mobile: member.mobileNumber,
            planName: (populatedForEmail?.plan as any)?.planName || 'N/A',
            packageDetail: (populatedForEmail?.plan as any)?.planName || 'N/A',
            price: (populatedForEmail?.plan as any)?.price || 0,
            packagePrice: (populatedForEmail?.plan as any)?.price || 0,
            startDate: member.membershipStartDate ? new Date(member.membershipStartDate).toLocaleDateString('en-IN') : 'N/A',
            endDate: member.membershipEndDate ? new Date(member.membershipEndDate).toLocaleDateString('en-IN') : 'N/A',
            memberId: member.memberId,
            invoiceNo: formatInvoiceNo(member.memberId),
            branch: (populatedForEmail?.branch as any)?.name || 'N/A',
            branchAddress: (populatedForEmail?.branch as any)?.address || 'N/A',
            city: (populatedForEmail?.branch as any)?.city || 'N/A',
            state: (populatedForEmail?.branch as any)?.state || 'N/A',
            zipCode: (populatedForEmail?.branch as any)?.zipCode || 'N/A',
            date: new Date().toLocaleDateString('en-IN'),
            dateTime: new Date().toLocaleString('en-IN'),
            dateOfInvoice: new Date().toLocaleDateString('en-IN'),
            responsibleLog: employee?.name || 'Reception',
            invoiceType: isRenewal ? 'Renewal' : 'Partial Payment',
            paidPrice: freshPaymentAmount,
            previousRemaining: oldPaymentRemaining,
            balanceAmount: member.paymentRemaining,
            totalPayment: member.totalAmount || (populatedForEmail?.plan as any)?.price || 0,
            discount: member.discountAmount || 0,
            discountPercentage: member.discountPercentage || 0,
            taxPercentage: member.taxPercentage || 0,
            taxAmount: member.taxAmount || 0,
            paymentMode: req.body.paymentMode || 'UPI',
            nextPaymentDate: member.nextPaymentDate ? new Date(member.nextPaymentDate).toLocaleDateString('en-IN') : undefined
          });

          console.log(`✅ PDF Receipt generated (Update): ${receiptBuffer.length} bytes`);
          receiptFilename = `${member.name}_MTF_Reseat.pdf`;

          // 📧 Send receipt (awaiting to ensure Vercel doesn't kill it)
          const receiptEmailSent = await sendEmail(
            member.email,
            `Payment Receipt - ${receiptTitle} (${member.memberId})`,
            `<p>Dear ${toTitleCase(member.name)}, your payment of Rs. ${freshPaymentAmount} has been received.</p>`,
            [{ filename: receiptFilename, content: receiptBuffer, contentType: 'application/pdf' }]
          );

          console.log(`📡 Receipt Email Status for ${member.email}: ${receiptEmailSent ? 'Sent' : 'Failed'}`);
      } catch (err: any) {
          console.error('❌ Failed to send payment receipt:', err);
          receiptErrorMsg = err.message;
      }
    }

    // 5. Activity Logging
    try {
      const user = await Employee.findById(req.user?.id);
      await ActivityLog.create({
        action: 'member_updated',
        performedBy: req.user?.id,
        performedByName: user?.name || 'Unknown',
        targetType: 'Member',
        targetId: member._id,
        targetName: member.name,
        details: `Member updated. Payments recorded: ${freshPaymentAmount > 0 ? 'Yes' : 'No'}. Renewal: ${oldEndDate !== newEndDate ? 'Yes' : 'No'}.`
      });
    } catch (logError) {
      console.error('Failed to create activity log:', logError);
    }

    // 6. Return response
    const populatedMember = await Member.findById(member._id)
      .populate('branch', 'name city address state zipCode')
      .populate('plan', 'planName duration price')
      .populate('history.plan', 'planName duration price');

    res.json({
      success: true,
      data: populatedMember,
      receiptBuffer: receiptBuffer ? receiptBuffer.toString('base64') : null,
      receiptFilename: receiptFilename || null,
      message: receiptErrorMsg ? `Update successful, but Receipt Error: ${receiptErrorMsg}` : 'Update successful!'
    });

  } catch (error: any) {
    console.error('Update member error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update member' });
  }
};

export const getMemberPaymentReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, paymentIndex } = req.params;
    const index = parseInt(paymentIndex as string, 10);

    const member = await Member.findById(id)
      .populate('branch', 'name city address state zipCode')
      .populate('plan', 'planName duration price')
      .populate('history.plan', 'planName duration price');

    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found' });
      return;
    }

    const payment = member.payments[index];
    if (!payment) {
      res.status(404).json({ success: false, message: 'Payment record not found' });
      return;
    }

    // Get the plan info at the time of this payment if possible, or use current
    // For historical payments, we ideally want the plan it belonged to.
    // For now, we use the current plan as a fallback.
    const planInfo = (member.plan as any);
    const employee = await Employee.findById(payment.recordedBy || req.user?.id);

    // Find which plan cycle this payment belongs to
    const pTime = new Date(payment.paymentDate).getTime();
    let targetCycleIdx = -1;
    if (member.history && member.history.length > 0) {
      for (let j = 0; j < member.history.length; j++) {
        if (pTime <= new Date(member.history[j].recordedAt).getTime()) {
          targetCycleIdx = j;
          break;
        }
      }
    }

    // Determine the true total amount for THIS cycle
    const cycleTotal = targetCycleIdx === -1 
      ? (member.totalAmount || planInfo?.price || 0)
      : ((member.history[targetCycleIdx] as any).totalAmount || (member.history[targetCycleIdx] as any).planAmount || 0);

    // Sum ONLY the payments that belong to THIS cycle up to this index
    let cumulativePaid = 0;
    for (let i = 0; i <= index; i++) {
      const iterTime = new Date(member.payments[i].paymentDate).getTime();
      let iterCycleIdx = -1;
      if (member.history && member.history.length > 0) {
        for (let j = 0; j < member.history.length; j++) {
          if (iterTime <= new Date(member.history[j].recordedAt).getTime()) {
            iterCycleIdx = j;
            break;
          }
        }
      }
      if (iterCycleIdx === targetCycleIdx) {
        cumulativePaid += (member.payments[i].amount || 0);
      }
    }

    const balanceAfterPayment = Math.max(0, cycleTotal - cumulativePaid);
    const previousRemaining = balanceAfterPayment + payment.amount;

    const receiptBuffer = await generateReceiptPdfBuffer({
      name: member.name,
      email: member.email,
      mobile: member.mobileNumber,
      planName: planInfo?.planName || 'Gym Membership',
      packageDetail: planInfo?.planName || 'Gym Membership',
      price: cycleTotal,
      packagePrice: cycleTotal,
      startDate: member.membershipStartDate ? new Date(member.membershipStartDate).toLocaleDateString('en-IN') : 'N/A',
      endDate: member.membershipEndDate ? new Date(member.membershipEndDate).toLocaleDateString('en-IN') : 'N/A',
      memberId: member.memberId,
      invoiceNo: formatInvoiceNo(member.memberId),
      branch: (member.branch as any)?.name || 'N/A',
      branchAddress: (member.branch as any)?.address || 'N/A',
      city: (member.branch as any)?.city || 'N/A',
      state: (member.branch as any)?.state || 'N/A',
      zipCode: (member.branch as any)?.zipCode || 'N/A',
      date: new Date(payment.paymentDate).toLocaleDateString('en-IN'),
      dateTime: new Date(payment.paymentDate).toLocaleString('en-IN'),
      dateOfInvoice: new Date(payment.paymentDate).toLocaleDateString('en-IN'),
      responsibleLog: employee?.name || 'Reception',
      invoiceType: 'Payment Receipt',
      paidPrice: payment.amount,
      previousRemaining: previousRemaining,
      balanceAmount: balanceAfterPayment,
      totalPayment: cycleTotal,
      discount: 0,
      paymentMode: payment.paymentMode || 'UPI',
      nextPaymentDate: member.nextPaymentDate ? new Date(member.nextPaymentDate).toLocaleDateString('en-IN') : undefined
    });

    res.json({
      success: true,
      receiptBuffer: receiptBuffer.toString('base64'),
      receiptFilename: `${member.name}_Receipt_${index + 1}.pdf`
    });

  } catch (error: any) {
    console.error('Error generating historical receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to generate receipt' });
  }
};

export const deleteMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);

    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found' });
      return;
    }

    res.json({ success: true, message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ success: false, message: 'Failed to delete member' });
  }
};

// Get member history
export const getMemberHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await Member.findById(req.params.id)
      .select('memberId name history payments plan membershipStartDate membershipEndDate totalAmount paymentReceived paymentRemaining status')
      .populate('history.plan', 'planName duration price')
      .populate('plan', 'planName duration price')
      .populate('payments.recordedBy', 'name');

    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        memberId: member.memberId,
        name: member.name,
        currentPlan: {
          plan: member.plan,
          startDate: member.membershipStartDate,
          endDate: member.membershipEndDate,
          totalAmount: member.totalAmount,
          paymentReceived: member.paymentReceived,
          paymentRemaining: member.paymentRemaining,
          status: member.status
        },
        planHistory: member.history,
        paymentHistory: member.payments
      }
    });
  } catch (error) {
    console.error('Error fetching member history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch member history' });
  }
};
