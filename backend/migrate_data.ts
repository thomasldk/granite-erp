
import sqlite3 from 'sqlite3';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();
const sqlitePath = path.resolve(__dirname, 'dev.db.bak'); // Use Backup file if possible, or dev.db

// Since dev.db is in use or we want to be safe, let's assume 'dev.db' at root of backend
const DB_PATH = path.join(__dirname, 'prisma', 'dev.db');
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY);

function query(sql: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        db.all(sql, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function migrate() {
    console.log(`Starting Data Migration...`);
    console.log(`Source: ${DB_PATH}`);
    console.log(`Target: PostgreSQL (Railway)`);

    try {
        // 1. CLEAN TARGET DB (Order matters for FKs)
        console.log('Cleaning target database...');
        await prisma.quoteItem.deleteMany();
        await prisma.quote.deleteMany();
        await prisma.project.deleteMany();
        await prisma.projectLocation.deleteMany(); // Added
        await prisma.contact.deleteMany();
        await prisma.address.deleteMany();
        await prisma.thirdParty.deleteMany();
        await prisma.systemConfig.deleteMany();

        // Clear Auxiliary Tables to force re-import with correct data
        await prisma.paymentTerm.deleteMany();
        await prisma.incoterm.deleteMany();
        await prisma.productionSite.deleteMany();
        await prisma.maintenanceSite.deleteMany();
        await prisma.representative.deleteMany();
        await prisma.contactType.deleteMany();
        // Don't delete Material as it might be large/seeded? Actually, better to clean and re-import if we are mapping.
        // Assuming user wants 100% sync from SQLite.
        // But let's leave Material merge logic as is (it checks existing).
        // Actually, if we want to be clean:
        // await prisma.material.deleteMany(); // Maybe dangerous if Seed had critical info not in SQLite? 
        // Let's stick to the ones we know were problematic.

        // 2. MIGRATE MATERIALS (Preserve Seed, Add Missing)
        console.log('Migrating Materials...');
        const sourceMaterials = await query('SELECT * FROM Material');
        const existingMats = await prisma.material.findMany();
        const existingNames = new Set(existingMats.map(m => m.name));

        for (const r of sourceMaterials) {
            if (!existingNames.has(r.name)) {
                await prisma.material.create({
                    data: {
                        // id: r.id, // Don't force ID, let UUID generate to avoid conflicts (mapped later)
                        name: r.name,
                        category: r.category,
                        type: r.type,
                        purchasePrice: r.purchasePrice,
                        sellingPrice: r.sellingPrice,
                        unit: r.unit,
                        // ... map other fields if they exist in SQLite result
                    }
                }).catch(e => console.warn(`Skipped Material ${r.name}: ${e.message}`));
                existingNames.add(r.name); // Avoid dupes in loop
            }
        }

        // 3. MIGRATE SYSTEM CONFIG
        console.log('Migrating System Config...');
        const configs = await query('SELECT * FROM SystemConfig');
        for (const r of configs) {
            await prisma.systemConfig.create({
                data: {
                    key: r.key || "GLOBAL",
                    defaultSemiStandardRate: r.defaultSemiStandardRate,
                    defaultSalesCurrency: r.defaultSalesCurrency,
                    // Map other config fields...
                    taxRateTPS: r.taxRateTPS,
                    taxRateTVQ: r.taxRateTVQ,
                    taxRateTVH: r.taxRateTVH
                }
            }).catch(e => console.warn(`Skipped Config: ${e.message}`));
        }

        // 2. MIGRATE STATIC (Merge or Skip)
        console.log('Migrating ThirdParties (Clients/Suppliers)...');
        const parties = await query('SELECT * FROM ThirdParty');
        for (const r of parties) {
            await prisma.thirdParty.create({
                data: {
                    id: r.id,
                    type: r.type,
                    name: r.name,
                    email: r.email,
                    phone: r.phone,
                    website: r.web || r.website || null, // Map web -> website
                    // Dropped: tps, tvq (Not in schema)
                    // paymentTermId: r.paymentTermId, // Skipped to avoid Seed Mismatch
                    // incotermId: r.incotermId // Skipped to avoid Seed Mismatch
                }
            }).catch(e => console.warn(`Skipped ThirdParty ${r.id}: ${e.message}`));
        }

        console.log('Migrating Addresses...');
        const addresses = await query('SELECT * FROM Address');
        for (const r of addresses) {
            await prisma.address.create({
                data: {
                    id: r.id,
                    type: r.type || 'Billing', // Default if missing
                    line1: r.street || r.line1 || '',
                    line2: r.line2 || null, // If exists in source
                    city: r.city,
                    state: r.province || r.state || '',
                    zipCode: r.postalCode || r.zipCode || '',
                    country: r.country,
                    thirdPartyId: r.thirdPartyId
                }
            }).catch(e => console.warn(`Skipped Address ${r.id}: ${e.message}`));
        }
        // --- HELPERS ---
        const getMap = async (table: string, prismaModel: any) => {
            console.log(`Mapping ${table}...`);
            const source = await query(`SELECT * FROM ${table}`);
            const dest = await prismaModel.findMany();
            const map = new Map<string, string>(); // OldID -> NewID
            const destNames = new Map<string, string>(); // Name -> NewID
            dest.forEach((r: any) => destNames.set(r.name || r.code, r.id));

            for (const r of source) {
                const key = r.name || r.code;
                let newId: string | undefined = destNames.get(key);
                if (!newId) {
                    try {
                        const data: any = {};

                        // Common fields
                        if (table !== 'PaymentTerm') {
                            data.name = r.name || r.code;
                        }

                        if (r.code) data.code = r.code;
                        if (r.description) data.description = r.description;
                        if (r.days !== undefined) data.days = r.days;
                        if (r.type) data.type = r.type;
                        if (r.xmlCode) data.xmlCode = r.xmlCode;

                        // Incoterm special case: xmlCode is required
                        if (table === 'Incoterm' && !data.xmlCode) data.xmlCode = (data.name || '').substring(0, 3).toUpperCase();

                        // PaymentTerm special case
                        if (table === 'PaymentTerm') {
                            // Source has label_en, label_fr, code
                            data.label_en = r.label_en || r.name || 'Term';
                            data.label_fr = r.label_fr || r.name || 'Term';
                            if (r.code !== undefined) data.code = parseInt(r.code);
                            else data.code = Math.floor(Math.random() * 10000) + 100;

                            if (r.days !== undefined) data.days = r.days;
                            if (r.depositPercentage !== undefined) data.depositPercentage = r.depositPercentage;
                            if (r.discountPercentage !== undefined) data.discountPercentage = r.discountPercentage;
                            if (r.discountDays !== undefined) data.discountDays = r.discountDays;
                            if (r.requiresText !== undefined) data.requiresText = Boolean(r.requiresText);
                        }

                        const created = await prismaModel.create({ data });
                        newId = created.id;
                        if (newId) destNames.set(key, newId);
                        console.log(`Created missing ${table}: ${key}`);
                    } catch (e: any) {
                        console.warn(`Could not create ${table} ${key}, trying minimal... Error: ${e.message}`);
                        // Minimal fallback
                        try {
                            const fallback: any = {};
                            if (table !== 'PaymentTerm') fallback.name = r.name || r.code;
                            // For PaymentTerm fallback
                            if (table === 'PaymentTerm') {
                                fallback.label_en = r.label_en || r.name || 'Fallback';
                                fallback.label_fr = r.label_fr || r.name || 'Fallback';
                                fallback.code = r.code ? parseInt(r.code) : Math.floor(Math.random() * 100000) + 900;
                            }

                            const created = await prismaModel.create({ data: fallback });
                            newId = created.id;
                            if (newId) destNames.set(key, newId);
                        } catch (e2: any) {
                            console.warn(`Failed to create ${table} ${key}: ${e2.message}`);
                        }
                    }
                }
                if (newId) map.set(r.id, newId);
            }
            return map;
        };

        // 3. MAP/MIGRATE AUXILIARY TABLES
        const incotermMap = await getMap('Incoterm', prisma.incoterm);
        const paymentTermMap = await getMap('PaymentTerm', prisma.paymentTerm);
        // Production & Maintenance Sites
        const prodSiteMap = await getMap('ProductionSite', prisma.productionSite);
        const maintSiteMap = await getMap('MaintenanceSite', prisma.maintenanceSite);

        // 3x. MIGRATE CONTACT TYPES
        console.log('Migrating Contact Types...');
        try {
            const types = await query('SELECT * FROM ContactType');
            for (const t of types) {
                // Check if exists
                const exists = await prisma.contactType.findFirst({
                    where: { name: t.name, category: t.category }
                });
                if (!exists) {
                    await prisma.contactType.create({
                        data: {
                            name: t.name,
                            category: t.category
                        }
                    });
                    console.log(`Migrated ContactType: ${t.name} (${t.category})`);
                }
            }
        } catch (e: any) {
            console.warn(`Could not migrate ContactTypes from source (maybe table missing?): ${e.message}`);
            // Fallback to ensuring defaults if source migration fails or is empty
            const requiredTypes = [
                { name: 'Principal', category: 'Client' },
                { name: 'Comptabilité', category: 'Client' },
                { name: 'Principal', category: 'Supplier' },
                { name: 'Logistique', category: 'Supplier' }
            ];
            for (const t of requiredTypes) {
                const exists = await prisma.contactType.findFirst({ where: { name: t.name, category: t.category } });
                if (!exists) {
                    await prisma.contactType.create({ data: { name: t.name, category: t.category } });
                    console.log(`Created Default ContactType: ${t.name} (${t.category})`);
                }
            }
        }

        // 3a. MIGRATE REPRESENTATIVES
        console.log('Migrating Representatives...');
        const reps = await query('SELECT * FROM Representative');
        for (const r of reps) {
            const exists = await prisma.representative.findUnique({ where: { id: r.id } });
            if (!exists) {
                await prisma.representative.create({
                    data: {
                        id: r.id,
                        firstName: r.firstName,
                        lastName: r.lastName,
                        email: r.email,
                        phone: r.phone,
                        mobile: r.mobile,
                        fax: r.fax,
                        active: r.active ? Boolean(r.active) : true
                    }
                }).catch(e => console.warn(`Skipped Rep ${r.id}: ${e.message}`));
            }
        }

        // 3b. PREPARE PROJECT LOCATIONS from Addresses (if Project table used addressId)
        console.log('Preparing Project Locations...');
        const addressMap = new Map<string, string>(); // AddressID -> LocationID
        const addressesForLoc = await query('SELECT * FROM Address');

        // If ProjectLocation exists in Source, use it. But user said "missing", implying they expect it.
        // Let's assume we create ProjectLocation from Addresses referenced by Projects.
        // But first, let's just migrate ThirdParties using the maps.

        console.log('Migrating ThirdParties (Clients/Suppliers)...');
        // Fix shadowing: use 'sourceParties'
        const sourceParties = await query('SELECT * FROM ThirdParty');
        for (const r of sourceParties) {
            await prisma.thirdParty.create({
                data: {
                    id: r.id,
                    type: r.type,
                    name: r.name,
                    email: r.email,
                    phone: r.phone,
                    website: r.web || r.website || null,
                    paymentTermId: r.paymentTermId ? paymentTermMap.get(r.paymentTermId) : undefined,
                    incotermId: r.incotermId ? incotermMap.get(r.incotermId) : undefined
                }
            }).catch(e => console.warn(`Skipped ThirdParty ${r.id}: ${e.message}`));
        }

        console.log('Migrating Contacts...');
        const contacts = await query('SELECT * FROM Contact');
        for (const r of contacts) {
            await prisma.contact.create({
                data: {
                    id: r.id,
                    firstName: r.firstName,
                    lastName: r.lastName,
                    email: r.email,
                    phone: r.phone,
                    role: r.role,
                    // Connect using ID to satisfy relation requirement if necessary, 
                    // but providing thirdPartyId directly usually works for createMany/create unchecked.
                    // If strict mode:
                    thirdParty: { connect: { id: r.thirdPartyId } }
                }
            }).catch(e => console.warn(`Skipped Contact ${r.id}: ${e.message}`));
        }

        console.log('Migrating Projects & Locations...');
        const projects = await query('SELECT * FROM Project');
        for (const r of projects) {
            let locationId = undefined;
            // If project had addressId, convert to ProjectLocation
            if (r.addressId) {
                // Find address details in SQLite
                const addr = addressesForLoc.find((a: any) => a.id === r.addressId);
                if (addr) {
                    const locName = `${addr.city} - ${addr.street || addr.line1}`;
                    // Find or Create ProjectLocation
                    let loc = await prisma.projectLocation.findUnique({ where: { name: locName } });
                    if (!loc) {
                        try {
                            loc = await prisma.projectLocation.create({ data: { name: locName } });
                        } catch (e) {
                            // If dup name race condition or other
                            loc = await prisma.projectLocation.findUnique({ where: { name: locName } });
                        }
                    }
                    if (loc) locationId = loc.id;
                }
            }

            await prisma.project.create({
                data: {
                    id: r.id,
                    name: r.name,
                    reference: r.reference,
                    // Dropped: scope
                    status: r.status,
                    // clientId is not in scalar fields of CreateInput, use relation:
                    client: r.clientId ? { connect: { id: r.clientId } } : undefined,
                    location: locationId ? { connect: { id: locationId } } : undefined,
                    // addressId: r.addressId, // DROPPED: Project uses locationId (ProjectLocation), not Address.
                    // contactId: r.contactId,
                    numberOfLines: r.numberOfLines
                }
            }).catch(e => console.warn(`Skipped Project ${r.id}: ${e.message}`));
        }

        console.log('Migrating Materials (Mapping)...');
        // 1. Get Old Materials
        // Fix shadowing
        const matSource = await query('SELECT * FROM Material');
        const oldMatMap = new Map<string, string>(); // ID -> Name
        matSource.forEach((m: any) => oldMatMap.set(m.id, m.name));

        // 2. Get New Materials (Seeded)
        const newMaterials = await prisma.material.findMany();
        const newMatMap = new Map<string, string>(); // Name -> ID
        newMaterials.forEach(m => newMatMap.set(m.name, m.id));

        console.log(`Mapped ${matSource.length} materials.`);

        console.log('Migrating Quotes...');
        const quotes = await query('SELECT * FROM Quote');
        for (const r of quotes) {
            const createdAt = new Date(r.createdAt);
            const updatedAt = new Date(r.updatedAt);

            // Handle potentially null foreign keys
            const projectId = r.projectId;
            const thirdPartyId = r.clientId || r.thirdPartyId; // Source might be mixed

            // Resolve Material ID
            let newMaterialId = undefined;
            if (r.materialId) {
                const matName = oldMatMap.get(r.materialId);
                if (matName) {
                    newMaterialId = newMatMap.get(matName);
                }
            }

            await prisma.quote.create({
                data: {
                    id: r.id,
                    reference: r.reference,
                    version: r.revision || r.version || 1, // Map revision -> version
                    status: r.status,
                    syncStatus: r.syncStatus,
                    totalAmount: r.total || 0, // total -> totalAmount
                    validUntil: r.validityDate ? new Date(r.validityDate) : null,
                    project: { connect: { id: projectId } },
                    client: { connect: { id: thirdPartyId } },
                    // Use NEW Material ID
                    material: newMaterialId ? { connect: { id: newMaterialId } } : undefined,
                    // Dropped: finishid, thicknessId (Use QuoteItem instead)
                    paymentTerm: r.paymentTermId ? { connect: { id: paymentTermMap.get(r.paymentTermId) } } : undefined,
                    incotermRef: r.incotermId ? { connect: { id: incotermMap.get(r.incotermId) } } : undefined,
                    representative: r.representativeId ? { connect: { id: r.representativeId } } : undefined,
                    // productionSite?
                    excelFilePath: r.excelFilePath,
                    createdAt: createdAt,
                    updatedAt: updatedAt
                }
            }).catch(e => console.warn(`Skipped Quote ${r.id}: ${e.message}`));
        }

        console.log('Migrating QuoteItems...');
        const items = await query('SELECT * FROM QuoteItem');
        for (const r of items) {
            await prisma.quoteItem.create({
                data: {
                    id: r.id,
                    quote: { connect: { id: r.quoteId } },
                    material: r.material || 'N/A',
                    description: r.description,
                    quantity: r.quantity,
                    unitPrice: r.unitPrice,
                    totalPrice: r.totalAmount || r.totalPrice,
                    // Map Prod Site if exists
                    productionSite: r.productionSiteId ? { connect: { id: prodSiteMap.get(r.productionSiteId) } } : undefined
                }
            }).catch(e => console.warn(`Skipped Item ${r.id}: ${e.message}`));
        }

        console.log('--- Migration Complete ---');

    } catch (e) {
        console.error('Migration Failed:', e);
    } finally {
        db.close();
        await prisma.$disconnect();
    }
}

migrate();
