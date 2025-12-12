
import { create } from 'xmlbuilder2';
import { PrismaClient } from '@prisma/client';

export class XmlService {

    private formatPhoneNumber(value: string | null | undefined): string {
        if (!value) return '';
        const phoneNumber = value.replace(/[^\d]/g, '');
        const phoneNumberLength = phoneNumber.length;
        if (phoneNumberLength < 4) return phoneNumber;
        if (phoneNumberLength < 7) {
            return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
        }
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }

    private getPaymentLabel(code: number, days: number, deposit: number, lang: string = 'fr'): string {
        if (lang === 'fr') {
            switch (code) {
                case 1: return "Paiement à la commande";
                case 2: return `${deposit}% à la commande, le solde avant expédition`;
                case 3: return `${deposit}% à la commande le solde ${days} jours net après date de facturation`;
                case 4: return `net ${days} jours avec ${deposit}% d'escompte si paiement reçu par VIREMENT BANCAIRE chez DRC avant ${days} jours`;
                case 5: return `net ${days} jours après date de facturation`;
                case 6: return "A déterminer";
                default: return "";
            }
        } else {
            switch (code) {
                case 1: return "Payment upon confirmation of order";
                case 2: return `${deposit}% deposit on confirmation of order, balance before delivery`;
                case 3: return `${deposit}% deposit on confirmation of order, balance net ${days} days after date of invoice`;
                case 4: return `net ${days} days and ${deposit}% discount if payment by WIRE TRANSFER is received before`;
                case 5: return `net ${days} days of date of invoice`;
                case 6: return "Terms to be confirmed";
                default: return "";
            }
        }
    }

    async generateQuoteXml(quote: any, rep?: any): Promise<string> {
        try {
            // Based on "que-22712D6E8E48F13685258D59005E8500.xml"

            // 1. Fetch Dynamic Settings
            const prisma = new PrismaClient(); // Or inject if possible
            const settings = await prisma.setting.findMany();
            const config: Record<string, string> = {};
            settings.forEach((s: any) => config[s.key] = s.value);

            await prisma.$disconnect();

            // 2. Determine Environment
            const isProduction = process.env.RAILWAY_ENVIRONMENT === 'production' || process.env.NODE_ENV === 'production';

            // 3. Select target path for the meta 'cible' attribute
            // New config key 'path.cible' overrides everything (useful when you want the Windows path even in LOCAL mode)
            const targetBase = config['path.cible']
                ? config['path.cible']
                : isProduction
                    ? (config['path.prod.excel'] || 'F:\\Demo\\Echange')
                    : (config['path.local.excel'] || '/Volumes/nxerp');

            // Use targetBase to build the full path for the Excel file
            const excelTargetBase = targetBase;

            // Default model is on H: (as per user sample), independent of target drive
            const modelPath = config['path.prod.model'] || 'H:\\Modeles\\Directe\\Modele de cotation defaut.xlsx';






            // Document
            const doc = create({ version: '1.0' });

            // Add comment
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;

            // Format: Génération par DRC le DD-MM-YYYY HH:mm
            const day = now.getDate().toString().padStart(2, '0');
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const year = now.getFullYear();

            doc.com(`Génération par DRC le ${day}-${month}-${year} ${timeStr}`);
            doc.com(`Génération par DRC le ${day}-${month}-${year} ${timeStr}`);
            // Removed Environment comment to match legacy format perfectly


            // Root Element
            const root = doc.ele('generation').att('type', 'Soumission');

            // Meta
            // Helper to safe name (Allow accents? No, strict match to syncController to ensure compatibility)
            // SyncController uses: .replace(/[^a-zA-Z0-9-]/g, '_')
            // This replaces spaces, accents, and special chars with underscores.
            const safeName = (str: string | undefined) => (str || '').replace(/[^a-zA-Z0-9-]/g, '_');
            const clientName = safeName(quote.client?.name);
            const materialName = safeName(quote.material?.name);
            const projectName = safeName(quote.project?.name);

            const parts = [
                safeName(quote.reference), // Ensure reference is safe
                clientName,
                projectName,
                materialName
            ].filter(p => p && p.trim() !== '');

            const targetFilename = `${parts.join('_')}.xlsx`;

            // Construct target full path
            // Determine separator based on the target path format (not just environment)
            // If the configured path has backslashes or looks like "X:", force Windows style
            const isTargetWindows = excelTargetBase.includes('\\') || /^[a-zA-Z]:/.test(excelTargetBase);
            const sep = isTargetWindows ? '\\' : '/';

            // Build path and normalize it (replace / with \ if windows)
            let rawPath = `${excelTargetBase}${sep}${quote.project?.name || 'Projet'}${sep}${targetFilename}`;
            if (isTargetWindows) {
                rawPath = rawPath.replace(/\//g, '\\');
            }
            const targetPath = rawPath;

            root.ele('meta')
                .att('cible', targetPath)
                .att('Langue', 'fr')
                .att('action', 'emcot')
                .att('modele', modelPath)
                .att('appCode', '03')
                .att('journal', '')
                .att('socLangue', 'fr')
                .att('codeModule', '01')
                .att('definition', 'C:\\Travail\\XML\\CLAUTOMATEEMISSIONCOTATION.xml')
                .att('codeApplication', '03')
                .ele('resultat').att('flag', '').up();

            // Client
            const client = root.ele('client')
                .att('nom', quote.client?.name || '')
                .att('pays', 'CA')
                .att('ville', quote.client?.addresses?.[0]?.city || '')
                .att('langue', 'fr')
                .att('region', quote.client?.addresses?.[0]?.state ? `CA-${quote.client.addresses[0].state}` : 'CA-QC')
                .att('adresse1', quote.client?.addresses?.[0]?.line1 || '')
                .att('codepostal', quote.client?.addresses?.[0]?.zipCode || '')
                .att('abbreviation', '');

            const contacts = client.ele('contacts');
            if (quote.client?.contacts && quote.client.contacts.length > 0) {
                const c = quote.client.contacts[0];
                contacts.ele('contact')
                    .att('cel', this.formatPhoneNumber(c.mobile))
                    .att('fax', this.formatPhoneNumber(c.fax || quote.client?.fax))
                    .att('nom', c.lastName || c.name || '')
                    .att('tel', this.formatPhoneNumber(c.phone))
                    .att('mail', c.email || '')
                    .att('prenom', c.firstName || '')
                    .up();
            }

            // Representant
            if (rep) {
                root.ele('representant')
                    .att('cel', this.formatPhoneNumber(rep.mobile || rep.phone))
                    .att('fax', this.formatPhoneNumber(rep.fax))
                    .att('nom', rep.lastName || '')
                    .att('tel', this.formatPhoneNumber(rep.phone))
                    .att('mail', rep.email || '')
                    .att('prenom', rep.firstName || '')
                    .up();
            } else {
                root.ele('representant')
                    .att('cel', '')
                    .att('fax', '')
                    .att('nom', 'System')
                    .att('tel', '')
                    .att('mail', 'admin@granitedrc.com')
                    .att('prenom', 'Admin')
                    .up();
            }

            const pt = quote.client?.paymentTerm;
            const daysVal = (quote.client?.paymentDays && quote.client.paymentDays > 0) ? quote.client.paymentDays : (pt?.days || 0);
            const depositVal = (quote.client?.depositPercentage && quote.client.depositPercentage > 0) ? quote.client.depositPercentage : (pt?.depositPercentage || 0);
            const lang = quote.client?.language || 'fr';

            // Infer code
            let codeVal = pt?.code || 6;
            if (codeVal === 6) {
                if (daysVal > 0 && depositVal > 0) {
                    codeVal = 3;
                } else if (daysVal > 0 && depositVal === 0) {
                    codeVal = 5;
                } else if (daysVal === 0 && depositVal > 0) {
                    codeVal = 2;
                }
            }

            const accompteStr = (depositVal > 0) ? (depositVal / 100).toString().replace('.', ',').replace(/^0,/, ',') : '0';

            // Devis
            const devis = root.ele('devis')
                .att('UC', quote.currency || 'CAD')
                .att('nom', quote.project?.name || 'Projet')
                .att('Mesure', 'an')
                .att('TxSemi', ',4')
                .att('devise', quote.currency || 'CAD')
                .att('numero', quote.reference || '')
                .att('CratePU', '8')
                .att('Accompte', accompteStr)
                .att('Escompte', ',05')
                .att('Incoterm', quote.incoterm || 'Ex Works')
                .att('Paiement', daysVal.toString())
                .att('delaiNbr', '4')
                .att('emetteur', 'Thomas Leguen')
                .att('valideur', '')
                .att('IncotermS', '')
                .att('Complexite', 'Spécifique')
                .att('TauxChange', quote.exchangeRate ? quote.exchangeRate.toString() : '1')
                .att('optPalette', '0')
                .att('IncotermInd', 'EXW')
                .att('DureValidite', '30')
                .att('DelaiEscompte', '30')
                .att('ConditionPaiement', this.getPaymentLabel(codeVal, daysVal, depositVal, lang))
                .att('ConditionPaiementInd', codeVal.toString())
                .att('ConditionPaiementSaisie', '');

            const d = quote.dateIssued ? new Date(quote.dateIssued) : new Date();
            const emissionDay = d.getDate().toString().padStart(2, '0');
            const emissionMonth = (d.getMonth() + 1).toString().padStart(2, '0');
            const emissionYear = d.getFullYear();
            devis.att('dateEmission', `${emissionDay}-${emissionMonth}-${emissionYear}`);

            devis.ele('LOADING')
                .att('nom', 'GRANITE DRC RAP')
                .att('pays', 'CA')
                .att('ville', 'Rivière-à-Pierre')
                .att('region', 'CA-QC')
                .att('adresse1', '475 Avenue Delisle')
                .att('regiondsp', 'Quebec')
                .att('codepostal', 'G0A3A0')
                .att('paysTraduit', 'Canada')
                .att('abbreviation', '')
                .up();

            const externe = devis.ele('externe').att('devise', '');

            // Determine target number of lines
            // Priority: Project Config > Existing Items count > 0
            const targetCount = quote.project?.numberOfLines || quote.items?.length || 0;

            // We loop targetCount times
            for (let i = 0; i < targetCount; i++) {
                // Use existing item data if available.
                // IF NOT, use the FIRST item as a template (Clone) to avoid zero-values.
                // If no items exist at all, use empty object.
                const templateItem = (quote.items && quote.items.length > 0) ? quote.items[0] : {};
                const item = (quote.items && quote.items[i]) ? quote.items[i] : templateItem;

                // Match User's "Working" XML: Do NOT send explicit lines if we want the Automation to generate them from 'quantite'.
                // User sample has <externe devise=''/> (Empty).
                /* 
                const defaultDesc = item.description || quote.material?.name || `Item ${i + 1}`;
                externe.ele('ligne')
                    .att('ID', '') // Force empty ID to ensure Automation treats it as a new calculation request
                    .att('Type', '')
                    .att('No', 'L' + (i + 1).toString())
                    .att('Ref', defaultDesc)
                    .att('TAG', (quote.items && quote.items[i]) ? item.tag : (i + 1).toString()) // Auto-increment tag for new lines
                    .att('GRANITE', item.material || quote.material?.name || '')
                    .att('QTY', item.quantity?.toString() || '1') // Default to 1
                    .att('Item', defaultDesc)
                    .att('Longeur', item.length?.toString().replace('.', ',') || '96') // Default to 96
                    .att('Largeur', item.width?.toString().replace('.', ',') || '24') // Default to 24
                    .att('Epaisseur', item.thickness?.toString().replace('.', ',') || '7') // Default to 7
                    .att('Description', defaultDesc)
                    .att('Poid_Tot', (item.totalWeight || 0).toFixed(2).replace('.', ','))
                    .att('Prix_unitaire_interne', (item.unitPriceCad || item.unitPrice || 0).toFixed(2).replace('.', ','))
                    .att('Prix_unitaire_externe', (item.unitPriceUsd || item.unitPrice || 0).toFixed(2).replace('.', ','))
                    .att('Unité', item.unit ? '/ ' + item.unit : '/ ea')
                    .att('Prix_interne', (item.totalPriceCad || item.totalPrice || 0).toFixed(2).replace('.', ','))
                    .att('Prix_externe', (item.totalPriceUsd || item.totalPrice || 0).toFixed(2).replace('.', ','))
                    .up();
                */
            }

            // Pierre
            const wasteVal = quote.material?.wasteFactor || 4;
            const perteStr = (wasteVal / 100).toString().replace('.', ',').replace(/^0,/, ',');

            devis.ele('pierre')
                .att('Poid', quote.material?.density?.toString() || '165')
                .att('prix', quote.material?.purchasePrice?.toString() || '0')
                .att('perte', perteStr)
                .att('unite', (quote.material?.unit === 'Metric' || quote.material?.unit === 'm2') ? 'm3' : 'pi3')
                .att('devise', quote.currency || 'CAD')
                .att('couleur', quote.material?.name || 'Standard')
                .att('qualite', quote.material?.quality || 'S')
                .att('quantite', (quote.project?.numberOfLines || quote.items?.length || 0).toString())
                .att('unitePoid', 'lbs')
                .up();

            // Fournisseurs
            root.ele('Fournisseurs').up();

            const xml = doc.end({ prettyPrint: false });
            return xml.replace(/"/g, "'");

        } catch (e: any) {
            console.error("CRASH IN XML SERVICE (generateQuoteXml):", e);
            throw e;
        }
    }

    // --- REINTEGRATION ---

    async generateReintegrationXml(targetExcelPath: string): Promise<string> {
        try {
            // Document
            const doc = create({ version: '1.0' });

            // Add comment
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;
            const day = now.getDate().toString().padStart(2, '0');
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const year = now.getFullYear();

            doc.com(`Génération par DRC le ${day}-${month}-${year} ${timeStr}`);

            // Root Element
            const root = doc.ele('generation').att('type', 'Soumission');

            // Logic for Reintegration:
            // action = 'reintegrer'
            // modele = TARGET EXCEL (self)
            // cible = TARGET EXCEL (self)
            // definition = CLAUTOMATEREINTEGRER.xml

            root.ele('meta')
                .att('cible', targetExcelPath) // F:\...\File.xlsx
                .att('Langue', 'fr') // Assuming FR
                .att('action', 'reintegrer')
                .att('modele', targetExcelPath) // SAME AS CIBLE
                .att('appCode', '03')
                .att('journal', '')
                .att('socLangue', 'fr')
                .att('codeModule', '01')
                .att('definition', 'C:\\Travail\\XML\\CLAUTOMATEREINTEGRER.xml')
                .att('codeApplication', '03')
                .ele('resultat').att('flag', '').up();

            // Minimal Structure: <devis><externe/></devis>
            const devis = root.ele('devis');
            devis.ele('externe');

            const xml = doc.end({ prettyPrint: false });
            return xml.replace(/"/g, "'");

        } catch (e: any) {
            console.error("Error generating Reintegration XML:", e);
            throw e;
        }
    }

    parseExcelReturnXml(xmlContent: string): any[] {
        try {
            // Strategy B: Robust Regex Parsing (Bypasses xmlbuilder2 structure issues)
            const lines: any[] = [];

            console.log(`[DEBUG_XML] Raw Content Length: ${xmlContent.length}`);
            console.log(`[DEBUG_XML] Raw Content Preview (First 500): ${xmlContent.substring(0, 500)}`);

            // Regex to find ANY <ligne ...> opening tag. We don't care how it closes.
            // We capture everything until the closing > of the opening tag.
            // Note: This assumes attributes don't contain > (which they shouldn't in valid XML, they use &gt;)
            const lineRegex = /<ligne\s+([^>]+)>/gi;
            let match;

            while ((match = lineRegex.exec(xmlContent)) !== null) {
                const attributesStr = match[1];
                const attributes: any = {};

                // Parse attributes: key="value" or key='value'
                const attrRegex = /([a-zA-Z0-9_\-\.]+)\s*=\s*(["'])(.*?)\2/g;
                let attrMatch;
                while ((attrMatch = attrRegex.exec(attributesStr)) !== null) {
                    attributes[attrMatch[1]] = attrMatch[3]; // key = value
                }
                lines.push(attributes);
            }

            console.log(`[DEBUG_XML] Regex found ${lines.length} lines.`);

            if (lines.length === 0) return [];

            const mappedItems = lines.map((l: any) => {
                const parseFloatComma = (val: string | undefined): number => {
                    if (!val) return 0;
                    return parseFloat(val.toString().replace(',', '.'));
                };

                const getVar = (...keys: string[]) => {
                    for (const k of keys) {
                        const v = l[k];
                        if (v !== undefined && v !== null && v !== '') return v;
                    }
                    return undefined;
                };

                let desc = getVar('Description');
                // ... rest of mapping logic remains similar but uses l[key] directly
                const itemLabel = getVar('Item');
                console.log(`[DEBUG_XML_DESC] Tag: ${getVar('TAG')}, Desc: "${desc}", Item: "${itemLabel}"`);
                // Removed 'A renseigner' check as per user request.
                // Only fallback if description is strictly empty/null.
                if (!desc || desc.trim() === '') {
                    if (itemLabel) desc = itemLabel;
                }

                let unitVal = getVar('Unité', 'Unit') || '';
                // ... (Continue mapping)
                unitVal = unitVal.replace(/\/ \/ /g, '').replace(/\//g, '').trim();

                // TAG Normalization: Handle "014-1" -> "1"
                let rawTag = getVar('TAG', 'Tag', 'Ref Tag', 'No') || '';

                // User requested to preserve the full Tag (e.g. AA-01)
                // Removed regex splitting logic.
                let normalizedTag = rawTag;

                return {
                    tag: normalizedTag, // Use raw tag directly
                    originalTag: rawTag,
                    material: getVar('GRANITE', 'Granite') || '',
                    description: desc || '',
                    quantity: parseFloatComma(getVar('QTY', 'Qty')),
                    unit: unitVal,
                    length: parseFloatComma(getVar('Longeur', 'Length')),
                    width: parseFloatComma(getVar('Largeur', 'Width', 'Width/Deep')),
                    thickness: parseFloatComma(getVar('Epaisseur', 'Thickness', 'Thick/Height', 'Thick')),
                    netLength: parseFloatComma(getVar('Long.net', 'Total Length Net')),
                    netArea: parseFloatComma(getVar('Surface_net', 'Total Area Net')),
                    netVolume: parseFloatComma(getVar('Vol_Tot', 'Total Volume Net')),
                    totalWeight: parseFloatComma(getVar('Poid_Tot', 'Tot. Weight')),
                    unitPriceCad: parseFloatComma(getVar('Prix_unitaire_interne', 'Unit Price CAD$')),
                    unitPrice: parseFloatComma(getVar('Prix_unitaire_externe', 'Unit Price USD$')),
                    totalPriceCad: (() => {
                        const raw = getVar('Prix_interne', 'Total CDN$');
                        const parsed = parseFloatComma(raw);
                        console.log(`[DEBUG_PRICE] Raw Prix_interne: "${raw}", Parsed: ${parsed}`);
                        return parsed;
                    })(),
                    totalPrice: parseFloatComma(getVar('Prix_externe', 'Total USD$')),
                    stoneValue: parseFloatComma(getVar('valeurPierre')),
                    primarySawingCost: parseFloatComma(getVar('scPrimaire')),
                    secondarySawingCost: parseFloatComma(getVar('scSecondaire')),
                    profilingCost: parseFloatComma(getVar('profilage')),
                    finishingCost: parseFloatComma(getVar('Finition')),
                    anchoringCost: parseFloatComma(getVar('Ancrage')),
                    unitTime: parseFloatComma(getVar('tempsUnitaire')),
                    totalTime: parseFloatComma(getVar('tempsTotal'))
                };
            });

            const uniqueItems = new Map<string, any>();

            // First pass: Collect all items
            const allItems = mappedItems;
            console.log(`[DEBUG_XML] Total parsed items: ${allItems.length}`);

            allItems.forEach((item: any) => {
                const tag = item.tag;
                console.log(`[DEBUG_XML] Item Tag: "${tag}" (Original: "${item.originalTag}"), Price: ${item.totalPriceCad}`);

                if (!tag) return;

                const existing = uniqueItems.get(tag);

                if (!existing) {
                    console.log(`[DEBUG_XML] New Item (Set): ${tag}`);
                    uniqueItems.set(tag, item);
                } else {
                    // Smart Merge Logic
                    const currentPrice = (item.totalPriceCad || 0) + (item.totalPrice || 0);
                    const existingPrice = (existing.totalPriceCad || 0) + (existing.totalPrice || 0);

                    const currentVolume = (item.netVolume || 0) + (item.netArea || 0);
                    const existingVolume = (existing.netVolume || 0) + (existing.netArea || 0);

                    console.log(`[DEBUG_XML] Conflict for ${tag}: Existing($${existingPrice}) vs Current($${currentPrice})`);

                    let winner = existing;
                    let loser = item;
                    let isCurrentBetter = false;

                    if (currentPrice > existingPrice) {
                        isCurrentBetter = true;
                    } else if (currentPrice === existingPrice && currentVolume > existingVolume) {
                        isCurrentBetter = true;
                    }

                    if (isCurrentBetter) {
                        console.log(`[DEBUG_XML] -> Current is better (Price/Vol)`);
                        winner = item;
                        loser = existing;
                    } else {
                        console.log(`[DEBUG_XML] -> Existing is better or equal`);
                    }

                    // Cleaning Winner Data (Sanitize "step" or empty fields using Loser data)
                    const isInvalidDesc = (d: string) => {
                        if (!d) return true;
                        const lower = d.toLowerCase();
                        return lower === 'step' || lower.includes('renseigner');
                    };

                    if (isInvalidDesc(winner.description) && !isInvalidDesc(loser.description)) {
                        console.log(`[DEBUG_XML] Fix Description (Merge): "${winner.description}" -> "${loser.description}"`);
                        winner.description = loser.description;
                    }

                    if ((!winner.material || winner.material === 'step') && loser.material) {
                        winner.material = loser.material;
                    }
                    // Add other fields to preserve if needed (Ref, etc?)

                    uniqueItems.set(tag, winner);
                }
            });

            // Second Pass: Final Cleanup for invalid descriptions (if no merge happened or merge failed)
            uniqueItems.forEach((item) => {
                const isInvalidDesc = (d: string) => {
                    if (!d) return true;
                    const lower = d.toLowerCase();
                    return lower === 'step';
                };

                if (isInvalidDesc(item.description)) {
                    if (item.material && item.material !== 'step') {
                        console.log(`[DEBUG_XML] Fix Description (Fallback): "${item.description}" -> "${item.material}"`);
                        item.description = item.material;
                    }
                }
            });

            const finalItems = Array.from(uniqueItems.values());
            console.log(`[DEBUG_XML] Final items count: ${finalItems.length}`);
            return finalItems;

        } catch (error: any) {
            console.error("Error parsing XML:", error);
            try {
                const doc = create(xmlContent);
                const obj = doc.end({ format: 'object' });
                console.log("Parsed Object Structure:", JSON.stringify(obj, null, 2));
            } catch (e) {
                console.log("Could not even re-parse for debug logging.");
            }
            throw new Error(`Failed to parse XML file compatibility: ${error.message}`);
        }
    }
}
