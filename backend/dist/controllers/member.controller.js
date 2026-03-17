"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMember = exports.updateMember = exports.getMemberById = exports.getAllMembers = exports.createMember = void 0;
const Member_1 = __importDefault(require("../models/Member"));
const Plan_1 = __importDefault(require("../models/Plan"));
const Branch_1 = __importDefault(require("../models/Branch"));
const ActivityLog_1 = __importDefault(require("../models/ActivityLog"));
const Employee_1 = __importDefault(require("../models/Employee"));
const mongoose_1 = __importDefault(require("mongoose"));
const mailer_1 = require("../utils/mailer");
// Create new member
const createMember = async (req, res) => {
    try {
        console.log('=== CREATE MEMBER STARTED ===');
        console.log('📥 Raw request body:', JSON.stringify(req.body, null, 2));
        // ✅ Trim all string fields
        const trimmedData = { ...req.body };
        Object.keys(trimmedData).forEach(key => {
            if (typeof trimmedData[key] === 'string') {
                trimmedData[key] = trimmedData[key].trim();
            }
        });
        // ✅ Validate branch
        if (!mongoose_1.default.Types.ObjectId.isValid(trimmedData.branch)) {
            res.status(400).json({ success: false, message: 'Invalid branch ID format' });
            return;
        }
        const branchExists = await Branch_1.default.findById(trimmedData.branch);
        if (!branchExists) {
            res.status(400).json({ success: false, message: 'Branch not found' });
            return;
        }
        // ✅ Validate plan
        if (!mongoose_1.default.Types.ObjectId.isValid(trimmedData.plan)) {
            res.status(400).json({ success: false, message: 'Invalid plan ID format' });
            return;
        }
        const planExists = await Plan_1.default.findById(trimmedData.plan);
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
            }
            else if (unit.includes('year')) {
                endDate.setFullYear(endDate.getFullYear() + value);
            }
            else if (unit.includes('day')) {
                endDate.setDate(endDate.getDate() + value);
            }
        }
        else {
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
        const member = new Member_1.default(memberData);
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
        let attachments = [];
        let receiptBuffer = null;
        try {
            const user = await Employee_1.default.findById(req.user?.id);
            receiptBuffer = (0, mailer_1.generateDocxBuffer)({
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
        }
        catch (docxErr) {
            console.error('❌ Failed to generate DOCX attachment:', docxErr);
        }
        const emailSent = await (0, mailer_1.sendEmail)(trimmedData.email, 'Welcome to MuscleTime - Your Membership Credentials', htmlMessage, attachments);
        // ✅ Create activity log
        try {
            const user = await Employee_1.default.findById(req.user?.id);
            await ActivityLog_1.default.create({
                action: 'member_converted',
                performedBy: req.user?.id,
                performedByName: user?.name || 'Unknown',
                targetType: 'Member',
                targetId: member._id,
                targetName: trimmedData.name,
                details: `Enquiry converted to Member (${member.memberId}) for ${trimmedData.name}`
            });
        }
        catch (logError) {
            console.error('Failed to create activity log:', logError);
        }
        const populatedMember = await Member_1.default.findById(member._id)
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
    }
    catch (error) {
        console.error('❌ Error creating member:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create member'
        });
    }
};
exports.createMember = createMember;
// Get all members
const getAllMembers = async (req, res) => {
    try {
        // Support selfOnly filter for viewOnlySelfCreated permission
        const filter = {};
        if (req.query.selfOnly === 'true' && req.user?.id) {
            filter.convertedBy = req.user.id;
        }
        const members = await Member_1.default.find(filter)
            .populate('branch', 'name city')
            .populate('plan', 'planName duration price')
            .populate('convertedBy', 'name')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: members });
    }
    catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch members' });
    }
};
exports.getAllMembers = getAllMembers;
// Rest of your controller functions remain the same...
const getMemberById = async (req, res) => {
    try {
        const member = await Member_1.default.findById(req.params.id)
            .populate('branch', 'name city')
            .populate('plan', 'planName duration price')
            .populate('convertedBy', 'name');
        if (!member) {
            res.status(404).json({ success: false, message: 'Member not found' });
            return;
        }
        res.json({ success: true, data: member });
    }
    catch (error) {
        console.error('Error fetching member:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch member' });
    }
};
exports.getMemberById = getMemberById;
const updateMember = async (req, res) => {
    try {
        // ✅ Fetch old member before update to track changes
        const oldMember = await Member_1.default.findById(req.params.id).lean();
        const member = await Member_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('branch', 'name city')
            .populate('plan', 'planName duration price');
        if (!member) {
            res.status(404).json({ success: false, message: 'Member not found' });
            return;
        }
        // ✅ Log member update with field-level changes
        try {
            const user = await Employee_1.default.findById(req.user?.id);
            const skipFields = ['_id', '__v', 'createdAt', 'updatedAt', 'memberId', 'convertedBy', 'enquiryId'];
            const changes = [];
            if (oldMember) {
                Object.keys(req.body).forEach((key) => {
                    if (skipFields.includes(key))
                        return;
                    const oldVal = oldMember[key]?.toString?.() || '';
                    const newVal = req.body[key]?.toString?.() || '';
                    if (oldVal !== newVal) {
                        changes.push(`${key}: "${oldVal || '-'}" → "${newVal || '-'}"`);
                    }
                });
            }
            const changeStr = changes.length > 0 ? changes.join(', ') : 'No field changes detected';
            await ActivityLog_1.default.create({
                action: 'member_updated',
                performedBy: req.user?.id,
                performedByName: user?.name || 'Unknown',
                targetType: 'Member',
                targetId: member._id,
                targetName: member.name || 'Unknown',
                details: `Member "${member.name}" (${member.memberId}) updated by ${user?.name || 'Unknown'} — ${changeStr}`
            });
        }
        catch (logError) {
            console.error('Failed to create activity log:', logError);
        }
        // ✅ Detect Renewal and Send Receipt
        // Using math (payment difference) instead of just date string comparison for higher reliability
        const oldPayment = oldMember?.paymentReceived || 0;
        const newPayment = req.body.paymentReceived || 0;
        const freshPayment = newPayment - oldPayment;
        // Also check if membership end date was actually provided/changed
        const isNewEndDateProvided = !!req.body.membershipEndDate;
        let receiptBuffer = null;
        let receiptFilename = null;
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
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">${member.plan?.planName || 'N/A'}</td>
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
            let attachments = [];
            try {
                const user = await Employee_1.default.findById(req.user?.id);
                receiptBuffer = (0, mailer_1.generateDocxBuffer)({
                    name: member.name,
                    email: member.email,
                    mobile: member.mobileNumber,
                    planName: member.plan?.planName || 'N/A',
                    packageDetail: member.plan?.planName || 'N/A',
                    price: member.plan?.price || 0,
                    packagePrice: member.plan?.price || 0,
                    startDate: new Date(member.membershipStartDate).toLocaleDateString('en-IN'),
                    endDate: new Date(member.membershipEndDate).toLocaleDateString('en-IN'),
                    memberId: member.memberId,
                    branch: member.branch?.name || 'N/A',
                    city: member.branch?.city || 'N/A',
                    date: new Date().toLocaleDateString('en-IN'),
                    dateTime: new Date().toLocaleString('en-IN'),
                    dateOfInvoice: new Date().toLocaleDateString('en-IN'),
                    responsibleLog: user?.name || 'Reception',
                    invoiceType: isRenewal ? 'Renewal' : 'Partial Payment',
                    paidPrice: freshPayment,
                    balanceAmount: member.paymentRemaining,
                    totalPayment: member.totalAmount || member.plan?.price || 0,
                    discount: member.discountAmount || 0,
                    paymentMode: req.body.paymentMode || 'UPI'
                });
                receiptFilename = `${member.name}_MTF_Reseat.docx`;
                attachments.push({
                    filename: receiptFilename,
                    content: receiptBuffer
                });
            }
            catch (docxErr) {
                console.error('❌ Failed to generate DOCX attachment:', docxErr);
            }
            try {
                await (0, mailer_1.sendEmail)(member.email, emailSubject, receiptHtml, attachments);
                console.log(`✅ Payment receipt emailed to ${member.email} with DOCX attachment`);
            }
            catch (err) {
                console.error('❌ Failed to send payment receipt:', err);
            }
        }
        res.json({
            success: true,
            data: member,
            receiptBuffer: receiptBuffer ? receiptBuffer.toString('base64') : null,
            receiptFilename: receiptFilename || null
        });
    }
    catch (error) {
        console.error('Error updating member:', error);
        res.status(500).json({ success: false, message: 'Failed to update member' });
    }
};
exports.updateMember = updateMember;
const deleteMember = async (req, res) => {
    try {
        const member = await Member_1.default.findByIdAndDelete(req.params.id);
        if (!member) {
            res.status(404).json({ success: false, message: 'Member not found' });
            return;
        }
        res.json({ success: true, message: 'Member deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting member:', error);
        res.status(500).json({ success: false, message: 'Failed to delete member' });
    }
};
exports.deleteMember = deleteMember;
