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
const User_1 = __importDefault(require("../models/User"));
const mongoose_1 = __importDefault(require("mongoose"));
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
        // ✅ Create activity log
        try {
            const user = await User_1.default.findById(req.user?.id);
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
            message: 'Member created successfully'
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
        const members = await Member_1.default.find()
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
            const user = await User_1.default.findById(req.user?.id);
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
        res.json({ success: true, data: member });
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
