"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoExpireFollowUps = exports.getFollowUpStats = exports.getFollowUpsByEnquiry = exports.getFollowUpsByMember = exports.deleteFollowUp = exports.updateFollowUp = exports.createFollowUp = exports.getFollowUpById = exports.getAllFollowUps = void 0;
const FollowUp_js_1 = __importDefault(require("../models/FollowUp.js"));
const getAllFollowUps = async (req, res) => {
    try {
        const followups = await FollowUp_js_1.default.find()
            .populate('member', 'name memberId email mobileNumber')
            .populate('enquiry', 'name enquiryId email mobileNumber')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            data: followups
        });
    }
    catch (error) {
        console.error('Error fetching follow-ups:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching follow-ups',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getAllFollowUps = getAllFollowUps;
const getFollowUpById = async (req, res) => {
    try {
        const followup = await FollowUp_js_1.default.findById(req.params.id)
            .populate('member', 'name memberId email mobileNumber')
            .populate('enquiry', 'name enquiryId email mobileNumber')
            .populate('createdBy', 'name email');
        if (!followup) {
            res.status(404).json({
                success: false,
                message: 'Follow-up not found'
            });
            return;
        }
        res.json({
            success: true,
            data: followup
        });
    }
    catch (error) {
        console.error('Error fetching follow-up:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching follow-up',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getFollowUpById = getFollowUpById;
const createFollowUp = async (req, res) => {
    try {
        const followup = await FollowUp_js_1.default.create(req.body);
        const populatedFollowUp = await FollowUp_js_1.default.findById(followup._id)
            .populate('member', 'name memberId email mobileNumber')
            .populate('enquiry', 'name enquiryId email mobileNumber')
            .populate('createdBy', 'name email');
        res.status(201).json({
            success: true,
            data: populatedFollowUp,
            message: 'Follow-up created successfully'
        });
    }
    catch (error) {
        console.error('Error creating follow-up:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating follow-up',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createFollowUp = createFollowUp;
const updateFollowUp = async (req, res) => {
    try {
        const followup = await FollowUp_js_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('member', 'name memberId email mobileNumber')
            .populate('enquiry', 'name enquiryId email mobileNumber')
            .populate('createdBy', 'name email');
        if (!followup) {
            res.status(404).json({
                success: false,
                message: 'Follow-up not found'
            });
            return;
        }
        res.json({
            success: true,
            data: followup,
            message: 'Follow-up updated successfully'
        });
    }
    catch (error) {
        console.error('Error updating follow-up:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating follow-up',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.updateFollowUp = updateFollowUp;
const deleteFollowUp = async (req, res) => {
    try {
        const followup = await FollowUp_js_1.default.findByIdAndDelete(req.params.id);
        if (!followup) {
            res.status(404).json({
                success: false,
                message: 'Follow-up not found'
            });
            return;
        }
        res.json({
            success: true,
            message: 'Follow-up deleted successfully',
            data: followup
        });
    }
    catch (error) {
        console.error('Error deleting follow-up:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting follow-up',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.deleteFollowUp = deleteFollowUp;
// Get follow-ups by member
const getFollowUpsByMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const followups = await FollowUp_js_1.default.find({ member: memberId })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            data: followups
        });
    }
    catch (error) {
        console.error('Error fetching member follow-ups:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching member follow-ups',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getFollowUpsByMember = getFollowUpsByMember;
// Get follow-ups by enquiry
const getFollowUpsByEnquiry = async (req, res) => {
    try {
        const { enquiryId } = req.params;
        const followups = await FollowUp_js_1.default.find({ enquiry: enquiryId })
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.json({
            success: true,
            data: followups
        });
    }
    catch (error) {
        console.error('Error fetching enquiry follow-ups:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching enquiry follow-ups',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getFollowUpsByEnquiry = getFollowUpsByEnquiry;
// Get follow-up statistics
const getFollowUpStats = async (req, res) => {
    try {
        const total = await FollowUp_js_1.default.countDocuments();
        const pending = await FollowUp_js_1.default.countDocuments({ status: 'pending' });
        const completed = await FollowUp_js_1.default.countDocuments({ status: 'completed' });
        const expired = await FollowUp_js_1.default.countDocuments({ status: 'expired' });
        // Get today's follow-ups
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todayFollowUps = await FollowUp_js_1.default.countDocuments({
            followUpDate: {
                $gte: today,
                $lt: tomorrow
            },
            status: 'pending'
        });
        res.json({
            success: true,
            data: {
                total,
                pending,
                completed,
                expired,
                todayFollowUps
            }
        });
    }
    catch (error) {
        console.error('Error fetching follow-up stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching follow-up statistics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.getFollowUpStats = getFollowUpStats;
// Auto-expire past follow-ups (can be called by a cron job)
const autoExpireFollowUps = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const result = await FollowUp_js_1.default.updateMany({
            followUpDate: { $lt: today },
            status: 'pending'
        }, {
            $set: { status: 'expired' }
        });
        res.json({
            success: true,
            message: 'Follow-ups auto-expired successfully',
            data: {
                modifiedCount: result.modifiedCount
            }
        });
    }
    catch (error) {
        console.error('Error auto-expiring follow-ups:', error);
        res.status(500).json({
            success: false,
            message: 'Error auto-expiring follow-ups',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.autoExpireFollowUps = autoExpireFollowUps;
