"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const enquiry_controller_1 = require("../controllers/enquiry.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// Stats route should come BEFORE /:id route
router.get('/stats/summary', enquiry_controller_1.getEnquiryStats);
router.get('/', enquiry_controller_1.getAllEnquiries);
router.get('/:id', enquiry_controller_1.getEnquiryById);
router.post('/', auth_middleware_1.authMiddleware, enquiry_controller_1.createEnquiry);
router.put('/:id', auth_middleware_1.authMiddleware, enquiry_controller_1.updateEnquiry);
router.delete('/:id', enquiry_controller_1.deleteEnquiry);
exports.default = router;
