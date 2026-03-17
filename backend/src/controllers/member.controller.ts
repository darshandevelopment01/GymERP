import { Request, Response } from 'express';
import Member from '../models/Member';
import Plan from '../models/Plan';
import Branch from '../models/Branch';
import ActivityLog from '../models/ActivityLog';
import Employee from '../models/Employee';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { sendEmail, generateDocxBuffer } from '../utils/mailer';
import path from 'path';

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
      } else if (unit.includes('year')) {
        endDate.setFullYear(endDate.getFullYear() + value);
      } else if (unit.includes('day')) {
        endDate.setDate(endDate.getDate() + value);
      }
    } else {
      // Default to 1 year if parsing fails
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // ✅ Calculate payment remaining
    const paymentRemaining = Math.max(0, planExists.price - (trimmedData.paymentReceived || 0));

    const memberData = {
      ...trimmedData,
      membershipEndDate: endDate,
      paymentRemaining: paymentRemaining,
      convertedBy: req.user?.id || null
    };

    console.log('📝 Final member data:', JSON.stringify(memberData, null, 2));

    const member = new Member(memberData);
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
        <h2 style="color: #6366f1; text-align: center;">Welcome to MuscleTime!</h2>
        <p>Hello <strong>${trimmedData.name}</strong>,</p>
        <p>Your gym membership has been successfully created. Please use the following credentials to log in to our <strong>Mobile Application</strong>:</p>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #6366f1;">
          <p style="margin: 0 0 10px 0;"><strong>Username:</strong> ${trimmedData.email} (or ${trimmedData.mobileNumber})</p>
          <p style="margin: 0;"><strong>Password:</strong> <span style="font-family: monospace; font-size: 1.1em; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${generatedPassword}</span></p>
        </div>

        <p style="background: #fffbeb; color: #92400e; padding: 10px; border-radius: 6px; font-size: 0.9rem;">
          <strong>⚠️ Note:</strong> These credentials are for <u>Mobile App Access only</u>. Web login is currently restricted to administrators.
        </p>

        <p>We have also attached your <strong>Membership Details (MTF Reseat)</strong> to this email for your records.</p>
        
        <p>Best regards,<br/>Team MuscleTime</p>
      </div>
    `;

    // 📄 Prepare DOCX Attachment
    let attachments: any[] = [];
    let receiptBuffer: Buffer | null = null;
    try {
      const user = await Employee.findById(req.user?.id);

      receiptBuffer = generateDocxBuffer({
        name: trimmedData.name,
        email: trimmedData.email,
        mobile: trimmedData.mobileNumber,
        planName: planExists.planName,
        packageDetail: planExists.planName,
        price: planExists.price,
        packagePrice: planExists.price,
        startDate: new Date(trimmedData.membershipStartDate).toLocaleDateString('en-IN'),
        endDate: endDate.toLocaleDateString('en-IN'),
        memberId: member.memberId,
        branch: branchExists?.name || 'N/A',
        city: branchExists?.city || 'N/A',
        date: new Date().toLocaleDateString('en-IN'),
        dateTime: new Date().toLocaleString('en-IN'),
        dateOfInvoice: new Date().toLocaleDateString('en-IN'),
        responsibleLog: user?.name || 'Reception',
        invoiceType: 'New Booking',
        paidPrice: trimmedData.paymentReceived || 0,
        balanceAmount: paymentRemaining,
        totalPayment: trimmedData.totalAmount || planExists.price,
        discount: trimmedData.discountAmount || 0,
        paymentMode: trimmedData.paymentMode || 'UPI'
      });

      attachments.push({
        filename: `${trimmedData.name}_MTF_Reseat.docx`,
        content: receiptBuffer
      });
    } catch (docxErr) {
      console.error('❌ Failed to generate DOCX attachment:', docxErr);
    }

    const emailSent = await sendEmail(
      trimmedData.email,
      'Welcome to MuscleTime - Your Membership Credentials',
      htmlMessage,
      attachments
    );

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
      .populate('branch', 'name city')
      .populate('plan', 'planName duration price');

    console.log('✅ Member created:', populatedMember?.memberId);

    res.status(201).json({
      success: true,
      data: populatedMember,
      receiptBuffer: receiptBuffer ? receiptBuffer.toString('base64') : null,
      receiptFilename: receiptBuffer ? `${trimmedData.name}_MTF_Reseat.docx` : null,
      message: emailSent
        ? 'Member created successfully! Credentials emailed.'
        : 'Member created successfully! (⚠️ Email failed to send)'
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
    // Support selfOnly filter for viewOnlySelfCreated permission
    const filter: any = {};
    if (req.query.selfOnly === 'true' && req.user?.id) {
      filter.convertedBy = req.user.id;
    }

    const members = await Member.find(filter)
      .populate('branch', 'name city')
      .populate('plan', 'planName duration price')
      .populate('convertedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: members });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch members' });
  }
};

// Rest of your controller functions remain the same...
export const getMemberById = async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await Member.findById(req.params.id)
      .populate('branch', 'name city')
      .populate('plan', 'planName duration price')
      .populate('convertedBy', 'name');

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
    // ✅ Fetch old member before update to track changes
    const oldMember: any = await Member.findById(req.params.id).lean();

    const member = await Member.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('branch', 'name city')
      .populate('plan', 'planName duration price');

    if (!member) {
      res.status(404).json({ success: false, message: 'Member not found' });
      return;
    }

    // ✅ Log member update with field-level changes
    try {
      const user = await Employee.findById(req.user?.id);
      const skipFields = ['_id', '__v', 'createdAt', 'updatedAt', 'memberId', 'convertedBy', 'enquiryId'];
      const changes: string[] = [];

      if (oldMember) {
        Object.keys(req.body).forEach((key: string) => {
          if (skipFields.includes(key)) return;
          const oldVal = oldMember[key]?.toString?.() || '';
          const newVal = req.body[key]?.toString?.() || '';
          if (oldVal !== newVal) {
            changes.push(`${key}: "${oldVal || '-'}" → "${newVal || '-'}"`);
          }
        });
      }

      const changeStr = changes.length > 0 ? changes.join(', ') : 'No field changes detected';

      await ActivityLog.create({
        action: 'member_updated',
        performedBy: req.user?.id,
        performedByName: user?.name || 'Unknown',
        targetType: 'Member',
        targetId: member._id,
        targetName: member.name || 'Unknown',
        details: `Member "${member.name}" (${member.memberId}) updated by ${user?.name || 'Unknown'} — ${changeStr}`
      });
    } catch (logError) {
      console.error('Failed to create activity log:', logError);
    }

    // ✅ Detect Renewal and Send Receipt
    // Using math (payment difference) instead of just date string comparison for higher reliability
    const oldPayment = oldMember?.paymentReceived || 0;
    const newPayment = req.body.paymentReceived || 0;
    const freshPayment = newPayment - oldPayment;

    // Also check if membership end date was actually provided/changed
    const isNewEndDateProvided = !!req.body.membershipEndDate;

    let receiptBuffer: Buffer | null = null;
    let receiptFilename: string | null = null;

    if (freshPayment > 0) {
      console.log(`💰 PAYMENT DETECTED for member: ${member.name}. Amount: ₹${freshPayment}`);

      const isRenewal = isNewEndDateProvided;
      const receiptTitle = isRenewal ? 'Membership Renewal' : 'Partial Payment';
      const emailSubject = isRenewal
        ? `Payment Receipt - Membership Renewal (${member.memberId})`
        : `Payment Receipt - Additional Payment (${member.memberId})`;

      const receiptHtml = `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #6366f1; padding: 0; border-radius: 12px; overflow: hidden;">
          <div style="background: #6366f1; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Payment Receipt</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">${receiptTitle} Successful</p>
          </div>
          
          <div style="padding: 30px;">
            <p>Dear <strong>${member.name}</strong>,</p>
            <p>Thank you for your payment to MuscleTime. Your transaction has been successfully processed.</p>
            
            <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Receipt Date:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">${new Date().toLocaleDateString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Member ID:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">${member.memberId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Plan:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">${(member.plan as any)?.planName || 'N/A'}</td>
                </tr>
                <tr style="border-top: 1px solid #e2e8f0;">
                  <td style="padding: 15px 0 8px 0; color: #64748b; font-size: 1.1em;">Amount Received:</td>
                  <td style="padding: 15px 0 8px 0; text-align: right; font-size: 1.5em; font-weight: bold; color: #10b981;">₹${freshPayment}</td>
                </tr>
                ${isRenewal ? `
                <tr>
                  <td style="padding: 0 0 8px 0; color: #64748b;">New Expiry Date:</td>
                  <td style="padding: 0 0 8px 0; text-align: right; font-weight: bold; color: #ef4444;">${new Date(member.membershipEndDate).toLocaleDateString('en-IN')}</td>
                </tr>
                ` : `
                <tr>
                  <td style="padding: 0 0 8px 0; color: #64748b;">Remaining Balance:</td>
                  <td style="padding: 0 0 8px 0; text-align: right; font-weight: bold; color: #ef4444;">₹${member.paymentRemaining}</td>
                </tr>
                `}
              </table>
            </div>
            
            <p style="text-align: center; color: #64748b; font-size: 0.9rem;">
              Please keep this receipt for your records. See you at the gym!
            </p>
          </div>
          
          <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 0.8rem; color: #94a3b8;">
            © ${new Date().getFullYear()} MuscleTime ERP. All rights reserved.
          </div>
        </div>
      `;

      // 📄 Prepare DOCX Attachment
      let attachments: any[] = [];
      try {
        const user = await Employee.findById(req.user?.id);

        receiptBuffer = generateDocxBuffer({
          name: member.name,
          email: member.email,
          mobile: member.mobileNumber,
          planName: (member.plan as any)?.planName || 'N/A',
          packageDetail: (member.plan as any)?.planName || 'N/A',
          price: (member.plan as any)?.price || 0,
          packagePrice: (member.plan as any)?.price || 0,
          startDate: new Date(member.membershipStartDate).toLocaleDateString('en-IN'),
          endDate: new Date(member.membershipEndDate).toLocaleDateString('en-IN'),
          memberId: member.memberId,
          branch: (member.branch as any)?.name || 'N/A',
          city: (member.branch as any)?.city || 'N/A',
          date: new Date().toLocaleDateString('en-IN'),
          dateTime: new Date().toLocaleString('en-IN'),
          dateOfInvoice: new Date().toLocaleDateString('en-IN'),
          responsibleLog: user?.name || 'Reception',
          invoiceType: isRenewal ? 'Renewal' : 'Partial Payment',
          paidPrice: freshPayment,
          balanceAmount: member.paymentRemaining,
          totalPayment: (member as any).totalAmount || (member.plan as any)?.price || 0,
          discount: (member as any).discountAmount || 0,
          paymentMode: req.body.paymentMode || 'UPI'
        });

        receiptFilename = `${member.name}_MTF_Reseat.docx`;

        attachments.push({
          filename: receiptFilename,
          content: receiptBuffer
        });
      } catch (docxErr) {
        console.error('❌ Failed to generate DOCX attachment:', docxErr);
      }

      try {
        await sendEmail(
          member.email,
          emailSubject,
          receiptHtml,
          attachments
        );
        console.log(`✅ Payment receipt emailed to ${member.email} with DOCX attachment`);
      } catch (err) {
        console.error('❌ Failed to send payment receipt:', err);
      }
    }

    res.json({
      success: true,
      data: member,
      receiptBuffer: receiptBuffer ? receiptBuffer.toString('base64') : null,
      receiptFilename: receiptFilename || null
    });
  } catch (error) {
    console.error('Error updating member:', error);
    res.status(500).json({ success: false, message: 'Failed to update member' });
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
