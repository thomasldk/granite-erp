import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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
import productionRoutes from './routes/productionRoutes'; // Added
import productionSiteRoutes from './routes/productionSiteRoutes'; // Added
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

// Removed: app.use('/api/quotes', soumissionRoutes); // Using 'soumission' routes for quotes logic (based on Code Edit snippet)

app.get('/', (req: Request, res: Response) => {
    res.send('Granite DRC ERP API is running');
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running on port ${port} - API Ready`);
    });
}

export default app;
