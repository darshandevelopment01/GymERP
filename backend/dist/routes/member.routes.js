"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const member_controller_1 = require("../controllers/member.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes use authMiddleware
router.get('/', auth_middleware_1.authMiddleware, member_controller_1.getAllMembers);
router.get('/:id', auth_middleware_1.authMiddleware, member_controller_1.getMemberById);
router.post('/', auth_middleware_1.authMiddleware, member_controller_1.createMember);
router.put('/:id', auth_middleware_1.authMiddleware, member_controller_1.updateMember);
router.delete('/:id', auth_middleware_1.authMiddleware, member_controller_1.deleteMember);
exports.default = router;
