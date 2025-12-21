"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = 5006; // forced port to avoid env conflict
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});
// Routes
const thirdPartyRoutes_1 = __importDefault(require("./routes/thirdPartyRoutes"));
const soumissionRoutes_1 = __importDefault(require("./routes/soumissionRoutes"));
const representativeRoutes_1 = __importDefault(require("./routes/representativeRoutes"));
const contactTypeRoutes_1 = __importDefault(require("./routes/contactTypeRoutes"));
const settingsRoutes_1 = __importDefault(require("./routes/settingsRoutes"));
const quoteRoutes_1 = __importDefault(require("./routes/quoteRoutes"));
const projectLocationRoutes_1 = __importDefault(require("./routes/projectLocationRoutes")); // Added
const materialRoutes_1 = __importDefault(require("./routes/materialRoutes"));
const paymentTermRoutes_1 = __importDefault(require("./routes/paymentTermRoutes")); // Added
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes")); // Added
const syncRoutes_1 = __importDefault(require("./routes/syncRoutes")); // Added
const productionRoutes_1 = __importDefault(require("./routes/productionRoutes")); // Added
const productionSiteRoutes_1 = __importDefault(require("./routes/productionSiteRoutes")); // Added
const maintenanceSiteRoutes_1 = __importDefault(require("./routes/maintenanceSiteRoutes")); // Added
const incotermRoutes_1 = __importDefault(require("./routes/incotermRoutes")); // Added
const systemConfigRoutes_1 = __importDefault(require("./routes/systemConfigRoutes")); // Added V8
const path_1 = __importDefault(require("path")); // Added for static serving
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads'))); // Serve uploads statically
app.use('/api/third-parties', thirdPartyRoutes_1.default);
app.use('/api/representatives', representativeRoutes_1.default);
app.use('/api/contact-types', contactTypeRoutes_1.default); // Reordered based on Code Edit snippet
app.use('/api/settings', settingsRoutes_1.default); // Reordered based on Code Edit snippet
app.use('/api/quotes', quoteRoutes_1.default); // Reordered based on Code Edit snippet
app.use('/api/soumissions', soumissionRoutes_1.default); // Projects // Modified comment and reordered based on Code Edit snippet
app.use('/api/project-locations', projectLocationRoutes_1.default); // Added
app.use('/api/materials', materialRoutes_1.default); // Added for Materials management
app.use('/api/payment-terms', paymentTermRoutes_1.default); // Added for Payment Terms
app.use('/api/upload', uploadRoutes_1.default); // Added upload route
app.use('/api/production', productionRoutes_1.default); // Added production route
app.use('/api/production-sites', productionSiteRoutes_1.default); // Added production sites route
app.use('/api/maintenance-sites', maintenanceSiteRoutes_1.default); // Added maintenance sites route
app.use('/api/incoterms', incotermRoutes_1.default); // Added
app.use('/api/system-config', systemConfigRoutes_1.default); // Added V8
app.use('/api/sync', syncRoutes_1.default); // Added Sync Agent Routes
// Removed: app.use('/api/quotes', soumissionRoutes); // Using 'soumission' routes for quotes logic (based on Code Edit snippet)
app.get('/', (req, res) => {
    res.send('Granite DRC ERP API is running');
});
const BackupService_1 = require("./services/BackupService");
if (require.main === module) {
    console.log('--- SERVER V3 DEBUG START ---'); // Debug 
    const backupService = new BackupService_1.BackupService();
    const server = app.listen(port, '0.0.0.0', () => {
        console.log(`\n\n🚨 SERVER RESTART V2 CHECK - IF YOU SEE THIS, SERVER.TS IS UPDATED 🚨`);
        console.log(`Server running on port ${port} - API Ready (Bound to 0.0.0.0)`);
        // Start Backup Service
        console.log("🚀 Triggering initial backup on startup...");
        backupService.startAutomatedBackup();
    });
    // Graceful Shutdown
    const shutdown = (signal) => {
        console.log(`Received ${signal}. Closing server...`);
        // Stop Backup Service
        backupService.stop();
        // Force close any existing connections
        if (server.closeAllConnections) {
            server.closeAllConnections();
        }
        server.close(() => {
            console.log('Server closed. Port released.');
            process.exit(0);
        });
        // Fail-safe if close takes too long
        setTimeout(() => {
            console.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000);
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    // Handle nodemon restart specifically
    process.once('SIGUSR2', () => {
        if (server.closeAllConnections) {
            server.closeAllConnections();
        }
        server.close(() => {
            process.kill(process.pid, 'SIGUSR2');
        });
    });
}
exports.default = app;
