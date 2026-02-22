"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./config/db"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const member_routes_1 = __importDefault(require("./routes/member.routes"));
const employee_routes_1 = __importDefault(require("./routes/employee.routes"));
const branch_routes_1 = __importDefault(require("./routes/branch.routes"));
const masters_routes_1 = __importDefault(require("./routes/masters.routes"));
const enquiry_routes_1 = __importDefault(require("./routes/enquiry.routes"));
const followup_routes_1 = __importDefault(require("./routes/followup.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const activityLog_routes_1 = __importDefault(require("./routes/activityLog.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: '*',
    credentials: true
}));
app.use(express_1.default.json());
// Debug middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
// Health check - doesn't need DB
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});
// Root route - doesn't need DB
app.get('/', (req, res) => {
    res.json({
        message: 'MuscleTime ERP API',
        status: 'running',
    });
});
// ✅ DB Connection Middleware - runs BEFORE all API routes
// This ensures MongoDB is connected before any DB query is attempted
app.use(async (req, res, next) => {
    try {
        await (0, db_1.default)();
        next();
    }
    catch (error) {
        console.error('DB Connection failed:', error.message);
        res.status(503).json({
            message: 'Database connection failed. Please try again.',
            error: error.message
        });
    }
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/members', member_routes_1.default);
app.use('/api/employees', employee_routes_1.default);
app.use('/api/branches', branch_routes_1.default);
app.use('/api/masters', masters_routes_1.default);
app.use('/api/enquiries', enquiry_routes_1.default);
app.use('/api/followups', followup_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
app.use('/api/activity-logs', activityLog_routes_1.default);
exports.default = app;
