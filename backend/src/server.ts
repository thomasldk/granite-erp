import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 5006; // forced port to avoid env conflict

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

// Routes
import thirdPartyRoutes from './routes/thirdPartyRoutes';
import soumissionRoutes from './routes/soumissionRoutes';
import representativeRoutes from './routes/representativeRoutes';
import contactTypeRoutes from './routes/contactTypeRoutes';
import settingsRoutes from './routes/settingsRoutes';
import quoteRoutes from './routes/quoteRoutes';
import projectLocationRoutes from './routes/projectLocationRoutes'; // Added
import materialRoutes from './routes/materialRoutes';
import paymentTermRoutes from './routes/paymentTermRoutes'; // Added
import uploadRoutes from './routes/uploadRoutes'; // Added
import syncRoutes from './routes/syncRoutes'; // Added
import productionRoutes from './routes/productionRoutes'; // Added
import productionSiteRoutes from './routes/productionSiteRoutes'; // Added
import maintenanceSiteRoutes from './routes/maintenanceSiteRoutes'; // Added
import incotermRoutes from './routes/incotermRoutes'; // Added
import systemConfigRoutes from './routes/systemConfigRoutes'; // Added V8
import path from 'path'; // Added for static serving

app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // Serve uploads statically

app.use('/api/third-parties', thirdPartyRoutes);
app.use('/api/representatives', representativeRoutes);
app.use('/api/contact-types', contactTypeRoutes); // Reordered based on Code Edit snippet
app.use('/api/settings', settingsRoutes); // Reordered based on Code Edit snippet
app.use('/api/quotes', quoteRoutes); // Reordered based on Code Edit snippet
app.use('/api/soumissions', soumissionRoutes); // Projects // Modified comment and reordered based on Code Edit snippet
app.use('/api/project-locations', projectLocationRoutes); // Added
app.use('/api/materials', materialRoutes); // Added for Materials management
app.use('/api/payment-terms', paymentTermRoutes); // Added for Payment Terms
app.use('/api/upload', uploadRoutes); // Added upload route
app.use('/api/production', productionRoutes); // Added production route
app.use('/api/production-sites', productionSiteRoutes); // Added production sites route
app.use('/api/maintenance-sites', maintenanceSiteRoutes); // Added maintenance sites route
app.use('/api/incoterms', incotermRoutes); // Added
app.use('/api/system-config', systemConfigRoutes); // Added V8

app.use('/api/sync', syncRoutes); // Added Sync Agent Routes

// Removed: app.use('/api/quotes', soumissionRoutes); // Using 'soumission' routes for quotes logic (based on Code Edit snippet)

app.get('/', (req: Request, res: Response) => {
    res.send('Granite DRC ERP API is running');
});


import { BackupService } from './services/BackupService';

if (require.main === module) {
    process.on('uncaughtException', (error) => {
        console.error('🔥 UNCAUGHT EXCEPTION:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('🔥 UNHANDLED REJECTION:', reason);
    });

    console.log('--- SERVER V3 DEBUG START ---');
    const backupService = new BackupService();

    const server = app.listen(port, '0.0.0.0', () => {
        console.log(`\n\n🚨 SERVER RESTART V2 CHECK - IF YOU SEE THIS, SERVER.TS IS UPDATED 🚨`);
        console.log(`Server running on port ${port} - API Ready (Bound to 0.0.0.0)`);

        // Start Backup Service
        console.log("🚀 Server Ready. Backup scheduling disabled for debugging.");
        // console.log("🚀 Triggering initial backup on startup...");
        // backupService.startAutomatedBackup();
    });

    server.on('error', (e: any) => {
        if (e.code === 'EADDRINUSE') {
            console.error(`❌ PORT ${port} IS BUSY. Please close the other process.`);
            process.exit(1);
        } else {
            console.error('❌ SERVER ERROR:', e);
        }
    });

    // Graceful Shutdown
    const shutdown = (signal: string) => {
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

export default app;
