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
const followup_routes_1 = __importDefault(require("./routes/followup.routes")); // ✅ ADD THIS
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const activityLog_routes_1 = __importDefault(require("./routes/activityLog.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
// Connect to MongoDB
(0, db_1.default)();
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
// Health check - FIRST
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});
// Root route - SECOND
app.get('/', (req, res) => {
    res.json({
        message: 'MuscleTime ERP API',
        status: 'running',
        endpoints: {
            health: '/health',
            auth: '/api/auth',
            dashboard: '/api/dashboard',
            members: '/api/members',
            employees: '/api/employees',
            branches: '/api/branches',
            masters: '/api/masters',
            enquiries: '/api/enquiries',
            followups: '/api/followups' // ✅ ADD THIS
        }
    });
});
// API Routes - LAST
app.use('/api/auth', auth_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
app.use('/api/members', member_routes_1.default);
app.use('/api/employees', employee_routes_1.default);
app.use('/api/branches', branch_routes_1.default);
app.use('/api/masters', masters_routes_1.default);
app.use('/api/enquiries', enquiry_routes_1.default);
app.use('/api/followups', followup_routes_1.default); // ✅ ADD THIS
app.use('/api/upload', upload_routes_1.default);
app.use('/api/activity-logs', activityLog_routes_1.default);
exports.default = app;
