"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = void 0;
const cron = __importStar(require("node-cron"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class BackupService {
    constructor() {
        this.task = null;
        // Ensure initialized
    }
    startAutomatedBackup() {
        // Run immediately on startup
        console.log('🚀 Triggering initial backup on startup...');
        this.performBackupToDisk();
        // Run every hour at minute 0
        this.task = cron.schedule('0 * * * *', () => __awaiter(this, void 0, void 0, function* () {
            console.log('⏰ Starting automated backup...');
            yield this.performBackupToDisk();
        }));
        console.log('✅ Automated Backup Scheduler Started (Hourly)');
    }
    stop() {
        if (this.task) {
            this.task.stop();
            console.log('🛑 Automated Backup Scheduler Stopped');
        }
    }
    performBackupToDisk() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const backupData = yield this.generateBackupJson();
                // Determine path: ~/Documents/1Granite DRC/nouvelle erp 2025/sauvegardes
                // We use os.homedir() to be safe and cross-platform compatible if username changes
                const backupDir = path.join(os.homedir(), 'Documents', '1Granite DRC', 'nouvelle erp 2025', 'sauvegardes');
                if (!fs.existsSync(backupDir)) {
                    fs.mkdirSync(backupDir, { recursive: true });
                }
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `backup-auto-${timestamp}.json`;
                const filePath = path.join(backupDir, filename);
                fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
                console.log(`💾 Backup saved to: ${filePath}`);
            }
            catch (error) {
                console.error('❌ Automated backup failed:', error);
            }
        });
    }
    generateBackupJson() {
        return __awaiter(this, void 0, void 0, function* () {
            // Fetch all data from all models
            // We use Promise.all for parallelism, but be mindful of connection limits if dataset is huge.
            // For this ERP size, it's fine.
            const [materials, thirdParties, paymentTerms, contacts, addresses, projectLocations, projects, quotes, quoteItems, settings, representatives, contactTypes, languages, productionSites, currencies] = yield Promise.all([
                prisma.material.findMany(),
                prisma.thirdParty.findMany({ include: { contacts: true, addresses: true } }), // Deep dump for context if needed, but separate tables are safer for pure restore
                prisma.paymentTerm.findMany(),
                prisma.contact.findMany(),
                prisma.address.findMany(),
                prisma.projectLocation.findMany(),
                prisma.project.findMany(),
                prisma.quote.findMany(),
                prisma.quoteItem.findMany(),
                prisma.setting.findMany(),
                prisma.representative.findMany(),
                prisma.contactType.findMany(),
                prisma.language.findMany(),
                prisma.productionSite.findMany(),
                prisma.currency.findMany(),
            ]);
            return {
                metadata: {
                    timestamp: new Date().toISOString(),
                    version: '1.0',
                    appName: 'Granite DRC ERP'
                },
                data: {
                    materials,
                    thirdParties,
                    paymentTerms,
                    contacts,
                    addresses,
                    projectLocations,
                    projects,
                    quotes,
                    quoteItems,
                    settings,
                    representatives,
                    contactTypes,
                    languages,
                    productionSites,
                    currencies
                }
            };
        });
    }
}
exports.BackupService = BackupService;
