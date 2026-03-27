"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemberHistory = exports.deleteMember = exports.updateMember = exports.getMemberById = exports.getAllMembers = exports.createMember = void 0;
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
                endDate.setDate(endDate.getDate() - 1);
            }
            else if (unit.includes('year')) {
                endDate.setFullYear(endDate.getFullYear() + value);
                endDate.setDate(endDate.getDate() - 1);
            }
            else if (unit.includes('day')) {
                endDate.setDate(endDate.getDate() + value - 1);
            }
        }
        else {
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
        const member = new Member_1.default(memberData);
        // ✅ Track initial payment in payments history
        if (trimmedData.paymentReceived > 0) {
            member.payments.push({
                amount: trimmedData.paymentReceived,
                paymentDate: new Date(),
                paymentMode: trimmedData.paymentMode || 'Cash',
                recordedBy: req.user?.id || null,
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
        <h2 style="color: #6366f1; text-align: center;">Welcome to MuscleTime!</h2>
        <p>Hello <strong>${trimmedData.name}</strong>,</p>
        <p>Your gym membership has been successfully created. Please use the following credentials to log in to our <strong>Mobile Application</strong>:</p>
        
        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #6366f1;">
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
        let receiptErrorMsg = null;
        try {
            const user = await Employee_1.default.findById(req.user?.id);
            receiptBuffer = await (0, mailer_1.generateReceiptPdfBuffer)({
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
                filename: `${trimmedData.name}_MTF_Reseat.pdf`,
                content: receiptBuffer,
                contentType: 'application/pdf'
            });
        }
        catch (docxErr) {
            console.error('❌ Failed to generate DOCX attachment:', docxErr);
            receiptErrorMsg = docxErr?.message || 'Unknown template error';
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
            receiptFilename: receiptBuffer ? `${trimmedData.name}_MTF_Reseat.pdf` : null,
            message: (emailSent
                ? 'Member created successfully! Credentials emailed.'
                : 'Member created successfully! (⚠️ Email failed to send)') +
                (receiptErrorMsg ? ` \n⚠️ Receipt Error: ${receiptErrorMsg}` : '')
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
            .populate('history.plan', 'planName duration price')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: members });
    }
    catch (error) {
        console.error('Error fetching members:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch members' });
    }
};
exports.getAllMembers = getAllMembers;
const getMemberById = async (req, res) => {
    try {
        const member = await Member_1.default.findById(req.params.id)
            .populate('branch', 'name city')
            .populate('plan', 'planName duration price')
            .populate('convertedBy', 'name')
            .populate('history.plan', 'planName duration price');
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
        // 1. Find member and capture old state for history/receipt logic
        const member = await Member_1.default.findById(req.params.id);
        if (!member) {
            res.status(404).json({ success: false, message: 'Member not found' });
            return;
        }
        // Capture old values BEFORE updating for comparison and history archiving
        const oldState = JSON.parse(JSON.stringify(member));
        const oldEndDate = oldState.membershipEndDate ? new Date(oldState.membershipEndDate).toISOString() : null;
        const oldPaymentTotal = oldState.paymentReceived || 0;
        // 2. Prepare new values
        const newEndDate = req.body.membershipEndDate ? new Date(req.body.membershipEndDate).toISOString() : null;
        const newPaymentTotal = req.body.paymentReceived || 0;
        const freshPaymentAmount = newPaymentTotal - oldPaymentTotal;
        // ✅ RENEWAL ARCHIVING
        if (newEndDate && oldEndDate && oldEndDate !== newEndDate) {
            console.log(`📦 ARCHIVING HISTORY: Member ${member.memberId} is being renewed.`);
            if (!Array.isArray(member.history))
                member.history = [];
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
            console.log(`💰 RECORDING PAYMENT: ₹${freshPaymentAmount} for ${member.name}`);
            if (!Array.isArray(member.payments))
                member.payments = [];
            member.payments.push({
                amount: freshPaymentAmount,
                paymentDate: new Date(),
                paymentMode: req.body.paymentMode || 'UPI',
                recordedBy: req.user?.id || null,
                note: req.body.paymentNote || (newEndDate && oldEndDate !== newEndDate ? 'Renewal payment' : 'Additional payment')
            });
        }
        // 3. Apply updates to the document
        const updateFields = { ...req.body };
        delete updateFields.history; // Don't let user overwrite history/payments arrays directly
        delete updateFields.payments;
        Object.assign(member, updateFields);
        await member.save();
        // 4. Send Receipt if Payment detected
        let receiptBuffer = null;
        let receiptFilename = null;
        let receiptErrorMsg = null;
        if (freshPaymentAmount > 0) {
            console.log(`💰 DISPATCHING RECEIPT for ₹${freshPaymentAmount}`);
            const isRenewal = !!req.body.membershipEndDate && oldEndDate !== newEndDate;
            const receiptTitle = isRenewal ? 'Membership Renewal' : 'Partial Payment';
            try {
                const user = await Employee_1.default.findById(req.user?.id);
                const populatedForEmail = await Member_1.default.findById(member._id)
                    .populate('branch', 'name city')
                    .populate('plan', 'planName duration price');
                receiptBuffer = await (0, mailer_1.generateReceiptPdfBuffer)({
                    name: member.name,
                    email: member.email,
                    mobile: member.mobileNumber,
                    planName: populatedForEmail?.plan?.planName || 'N/A',
                    packageDetail: populatedForEmail?.plan?.planName || 'N/A',
                    price: populatedForEmail?.plan?.price || 0,
                    packagePrice: populatedForEmail?.plan?.price || 0,
                    startDate: member.membershipStartDate ? new Date(member.membershipStartDate).toLocaleDateString('en-IN') : 'N/A',
                    endDate: member.membershipEndDate ? new Date(member.membershipEndDate).toLocaleDateString('en-IN') : 'N/A',
                    memberId: member.memberId,
                    branch: populatedForEmail?.branch?.name || 'N/A',
                    city: populatedForEmail?.branch?.city || 'N/A',
                    date: new Date().toLocaleDateString('en-IN'),
                    dateTime: new Date().toLocaleString('en-IN'),
                    dateOfInvoice: new Date().toLocaleDateString('en-IN'),
                    responsibleLog: user?.name || 'Reception',
                    invoiceType: isRenewal ? 'Renewal' : 'Partial Payment',
                    paidPrice: freshPaymentAmount,
                    balanceAmount: member.paymentRemaining,
                    totalPayment: member.totalAmount || populatedForEmail?.plan?.price || 0,
                    discount: member.discountAmount || 0,
                    paymentMode: req.body.paymentMode || 'UPI'
                });
                receiptFilename = `${member.name}_MTF_Reseat.pdf`;
                await (0, mailer_1.sendEmail)(member.email, `Payment Receipt - ${receiptTitle} (${member.memberId})`, `<p>Dear ${member.name}, your payment of ₹${freshPaymentAmount} has been received.</p>`, [{ filename: receiptFilename, content: receiptBuffer, contentType: 'application/pdf' }]);
            }
            catch (err) {
                console.error('❌ Failed to send payment receipt:', err);
                receiptErrorMsg = err.message;
            }
        }
        // 5. Activity Logging
        try {
            const user = await Employee_1.default.findById(req.user?.id);
            await ActivityLog_1.default.create({
                action: 'member_updated',
                performedBy: req.user?.id,
                performedByName: user?.name || 'Unknown',
                targetType: 'Member',
                targetId: member._id,
                targetName: member.name,
                details: `Member updated. Payments recorded: ${freshPaymentAmount > 0 ? 'Yes' : 'No'}. Renewal: ${oldEndDate !== newEndDate ? 'Yes' : 'No'}.`
            });
        }
        catch (logError) {
            console.error('Failed to create activity log:', logError);
        }
        // 6. Return response
        const populatedMember = await Member_1.default.findById(member._id)
            .populate('branch', 'name city')
            .populate('plan', 'planName duration price')
            .populate('history.plan', 'planName duration price');
        res.json({
            success: true,
            data: populatedMember,
            receiptBuffer: receiptBuffer ? receiptBuffer.toString('base64') : null,
            receiptFilename: receiptFilename || null,
            message: receiptErrorMsg ? `Update successful, but Receipt Error: ${receiptErrorMsg}` : undefined
        });
    }
    catch (error) {
        console.error('Error updating member:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update member' });
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
// Get member history
const getMemberHistory = async (req, res) => {
    try {
        const member = await Member_1.default.findById(req.params.id)
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
    }
    catch (error) {
        console.error('Error fetching member history:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch member history' });
    }
};
exports.getMemberHistory = getMemberHistory;
