import { create } from 'xmlbuilder2';
import { parseStringPromise } from 'xml2js';
import fs from 'fs';
import path from 'path';

export class XmlService {
    private fmtPhone(v: any): string {
        if (!v) return '';
        const d = v.replace(/[^\d]/g, '');
        if (d.length < 10) return v;
        return `+1_(${d.slice(0, 3)})_${d.slice(3, 6)}-${d.slice(6)}`;
    }

    private getMesureCode(val: string): string {
        if (!val) return 'an';
        if (val.toLowerCase().includes('imp')) return 'an';
        if (val.toLowerCase().includes('met')) return 'm';
        return 'an';
    }

    private formatDecimal(val: number | null | undefined): string {
        if (val === null || val === undefined) return '';
        let s = val.toString().replace('.', ',');
        if (s.startsWith('0,')) return s.substring(1); // "0,3" -> ",3"
        return s;
    }

    private generatePaymentTermLabel(code: number, days: number, deposit: number, lang: string = 'fr', discountPercent: number = 0, discountDays: number = 0): string {
        if (lang === 'fr') {
            switch (code) {
                case 1: return `net ${days} jours`;
                case 2: return "COD";
                case 3: return "Comptant";
                case 4: return `${deposit}% à la commande, solde à la livraison`;
                case 5: return `net ${days} jours après date de facturation`;
                case 6: return "A déterminer";
                case 7: return "Saisie manuelle";
                case 8: return `${deposit}% à la commande et ${discountPercent}% de remise sur le solde si paiement reçu sous ${discountDays} jours terme ${days} jours`;
                default: return "";
            }
        } else {
            switch (code) {
                case 1: return `net ${days} days`;
                case 2: return "COD";
                case 3: return "Cash";
                case 4: return `${deposit}% deposit on confirmation of order, balance on delivery`;
                case 5: return `net ${days} days from date of invoice`;
                case 6: return "To be determined";
                case 7: return "Manual entry";
                case 8: return `${deposit}% deposit on confirmation of order and ${discountPercent}% discount on balance if payment received before ${discountDays} days from date of invoice`;
                default: return "";
            }
        }
    }

    async generateQuoteXml(quote: any, rep?: any, revisionData?: any): Promise<string> {
        try {
            console.log('🚨 XML GEN V7 (INCOTERM DYNAMIC) ');
            console.log('--- DEBUG DATA ---');
            console.log('Quote ID:', quote.id);
            if (revisionData) console.log('REVISION MODE DETECTED:', revisionData);

            // ... (keeping debug logs)

            const doc = create({ version: '1.0' });
            const now = new Date();
            const dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}`;
            const dateEmission = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;

            doc.com(`Génération par DRC le ${dateStr}`);

            const root = doc.ele('generation').att('type', 'Soumission');

            let meta = root.ele('meta');

            // Default Values (EMCOT)
            // Excel Storage Path (Treasury Location for Automate)
            const excelTargetBase = 'F:\\nxerp';
            const safe = (s: any) => (s || '').replace(/[^a-zA-Z0-9-]/g, '_');
            const filename = `${safe(quote.reference)}_${safe(quote.client?.name)}_${safe(quote.project?.name)}_${safe(quote.material?.name)}.xlsx`;
            // Target: F:\nxerp\ProjectName\Filename.xlsx
            const defaultFullPath = `${excelTargetBase}\\${quote.project?.name || 'Projet'}\\${filename}`;

            if (revisionData) {
                // REVISION MODE
                meta.att('cible', revisionData.cible)
                    .att('Langue', quote.client?.language || 'fr')
                    .att('action', 'reviser')
                    .att('modele', revisionData.cible) // Modele = Cible for Revision
                    .att('appCode', '03').att('journal', '').att('socLangue', quote.client?.language || 'fr').att('codeModule', '01')
                    .att('definition', 'C:\\Travail\\XML\\CLAUTOMATEREVISION.xml')
                    .att('ancienNom', revisionData.ancienNom)
                    .att('nouveauNom', revisionData.nouveauNom)
                    .att('ancienCouleur', revisionData.ancienCouleur)
                    .att('nouveauCouleur', revisionData.nouveauCouleur)
                    .att('ancienQualite', revisionData.ancienQualite || '')
                    .att('nouvelleQualite', revisionData.nouvelleQualite || '') // Corrected to 'nouvelle'
                    .att('codeApplication', '03'); // Ensure this matches sample

            } else {
                // STANDARD MODE (EMCOT)
                meta.att('cible', defaultFullPath)
                    .att('Langue', quote.client?.language || 'fr')
                    .att('action', 'emcot')
                    .att('modele', 'H:\\Modeles\\Directe\\Modele de cotation defaut.xlsx')
                    .att('definition', 'C:\\Travail\\XML\\CLAUTOMATEEMISSIONCOTATION.xml')
                    .att('appCode', '03').att('journal', '').att('socLangue', quote.client?.language || 'fr').att('codeModule', '01').att('codeApplication', '03');
            }

            meta.ele('resultat').att('flag', '').up();

            const cli = root.ele('client')
                .att('nom', quote.client?.name || '')
                .att('pays', 'CA')
                .att('ville', quote.client?.addresses?.[0]?.city || '')
                .att('langue', 'fr')
                .att('region', 'CA-QC')
                .att('adresse1', quote.client?.addresses?.[0]?.line1 || '')
                .att('codepostal', quote.client?.addresses?.[0]?.zipCode || '');

            const contacts = cli.ele('contacts');
            const targetContact = quote.contact || (quote.client?.contacts && quote.client.contacts[0]);
            if (targetContact) {
                contacts.ele('contact')
                    .att('cel', this.fmtPhone(targetContact.mobile))
                    .att('fax', '')
                    .att('nom', targetContact.lastName || '')
                    .att('tel', this.fmtPhone(targetContact.phone))
                    .att('mail', targetContact.email || '')
                    .att('prenom', targetContact.firstName || '').up();
            }

            if (rep) {
                root.ele('representant')
                    .att('cel', this.fmtPhone(rep.mobile || rep.phone))
                    .att('fax', '')
                    .att('nom', rep.lastName || '')
                    .att('tel', this.fmtPhone(rep.phone))
                    .att('mail', rep.email || '')
                    .att('prenom', rep.firstName || '').up();
            } else {
                root.ele('representant')
                    .att('cel', '').att('fax', '').att('nom', 'System').att('tel', '').att('mail', 'admin@granitedrc.com').att('prenom', 'Admin').up();
            }

            // --- INCOTERM LOGIC V7 ---
            let valIncoterm = 'Ex-Works';
            let valIncotermS = ' ';
            let valIncotermInd = 'EXW';

            if (quote.incotermRef) {
                valIncotermInd = quote.incotermRef.xmlCode || 'EXW';

                if (quote.incotermRef.requiresText) {
                    // Code 3 (Manual) logic
                    valIncoterm = 'Saisie';
                    valIncotermS = quote.incotermCustomText || ' ';
                } else {
                    // Standard logic (EXW, FOB)
                    valIncoterm = quote.incotermRef.name || 'Ex-Works';
                    valIncotermS = ' ';
                }
            } else {
                // FALLBACK to Legacy String if no relation
                // Try to guess from string
                const leg = (quote.incoterm || '').toUpperCase();
                if (leg.includes('FOB')) { valIncoterm = 'FOB'; valIncotermInd = 'FOB'; }
            }

            const mesureCode = this.getMesureCode(quote.project?.measurementSystem || quote.client?.unitSystem);

            const devis = root.ele('devis')
                .att('UC', 'CAD')
                .att('nom', quote.project?.name || 'Projet')
                .att('Mesure', mesureCode)
                .att('TxSemi', this.formatDecimal(quote.semiStandardRate || 0.4))
                .att('devise', quote.salesCurrency || quote.currency || 'CAD')
                .att('numero', quote.reference || '')
                .att('CratePU', this.formatDecimal(quote.palletPrice || 50))
                .att('Accompte', this.formatDecimal((quote.depositPercentage ?? 30) / 100)) // V8
                .att('Escompte', this.formatDecimal((quote.discountPercentage ?? 0) / 100)) // V8
                .att('Incoterm', valIncoterm)
                .att('IncotermS', valIncotermS)
                .att('IncotermInd', valIncotermInd)
                .att('Paiement', (quote.paymentDays ?? 30).toString()) // V8
                .att('delaiNbr', (quote.estimatedWeeks || '3').toString())
                .att('emetteur', 'Thomas Leguen') // TODO: Dynamic User
                .att('valideur', '')
                .att('Complexite', 'Spécifique')
                .att('TauxChange', this.formatDecimal(quote.exchangeRate || 1)) // V8
                .att('optPalette', quote.palletRequired ? '1' : '0')
                .att('DureValidite', (quote.validityDuration ?? 30).toString())
                .att('dateEmission', dateEmission)
                .att('DelaiEscompte', (quote.discountDays ?? 0).toString()) // V8
                .att('ConditionPaiement', ((quote.client?.language === 'en' ? quote.paymentTerm?.label_en : quote.paymentTerm?.label_fr) || this.generatePaymentTermLabel(
                    quote.paymentTerm?.code || 1,
                    quote.paymentDays ?? 30,
                    quote.depositPercentage ?? 0,
                    quote.client?.language || 'fr',
                    quote.discountPercentage ?? 0,
                    quote.discountDays ?? 0
                )))
                .att('ConditionPaiementInd', quote.paymentTerm?.code?.toString() || '1') // V8 Code
                .att('ConditionPaiementSaisie', quote.paymentCustomText || ''); // V8

            devis.ele('LOADING').att('nom', 'GRANITE DRC RAP').att('pays', 'CA').att('ville', 'Rivière-à-Pierre').att('region', 'CA-QC').att('adresse1', '475 Avenue Delisle').att('codepostal', 'G0A3A0').up();
            devis.ele('externe').att('devise', '').up();

            const qty = quote.project?.numberOfLines || 4;

            devis.ele('pierre')
                .att('Poid', '175')
                .att('prix', (quote.material?.purchasePrice || 750).toString())
                .att('perte', ',4')
                .att('unite', quote.material?.unit || 'm3')
                .att('devise', quote.currency || 'CAD')
                .att('couleur', quote.material?.name || 'Ash')
                .att('qualite', quote.material?.quality || 'S')
                .att('quantite', qty.toString())
                .att('unitePoid', 'lbs').up();

            root.ele('Fournisseurs').up();

            const xml = doc.end({ prettyPrint: false });
            return xml.replace(/"/g, "'");

        } catch (e) { console.error(e); throw e; }
    }

    async generateReintegrationXml(p: string): Promise<string> {
        // Validation: Ensure P points to F:\nxerp (Excel)
        // XML is essentially a wrapper.
        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('generation', { type: 'Soumission' });

        root.ele('meta')
            .att('cible', p)
            .att('Langue', 'en')
            .att('action', 'reintegrer')
            .att('modele', p) // Modele is the same file
            .att('appCode', '03')
            .att('journal', '')
            .att('socLangue', 'en')
            .att('codeModule', '01')
            .att('definition', 'C:\\Travail\\XML\\CLAUTOMATEREINTEGRER.xml')
            .att('codeApplication', '03')
            .ele('resultat', { flag: '' });

        const devis = root.ele('devis');
        devis.ele('externe');

        return root.end({ prettyPrint: true, headless: false });
    }

    // Helper to format Country to 2 chars
    private formatCountry(str: string | undefined | null): string {
        if (!str) return '';
        const normalized = str.trim().toUpperCase();
        if (normalized === 'CANADA') return 'CA';
        if (normalized === 'USA' || normalized === 'UNITED STATES' || normalized === 'ETATS-UNIS') return 'US';
        return normalized.length === 2 ? normalized : normalized.substring(0, 2);
    }

    // Helper to format Province/State to 2 chars
    private formatProvince(str: string | undefined | null): string {
        if (!str) return '';
        const normalized = str.trim().toUpperCase();
        if (normalized === 'QUEBEC') return 'QC';
        if (normalized === 'ONTARIO') return 'ON';
        if (normalized === 'NEW BRUNSWICK' || normalized === 'NOUVEAU-BRUNSWICK') return 'NB';
        return normalized.length === 2 ? normalized : normalized.substring(0, 2);
    }

    async generateDuplicateXml(quote: any, sourcePath: string, targetPath: string, originalReference: string): Promise<string> {
        // "Recopier": Manual String Construction

        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
        const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ':');

        const materialName = quote.material?.name || '';
        const client = quote.client || {};
        const contact = quote.contact || {};

        const escape = (str: string | undefined | null) => (str || '').replace(/'/g, "&apos;");
        const dateEmission = new Date(quote.createdAt).toLocaleDateString("fr-FR", { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');

        // XML String Construction (Compact Loop-Safe)
        let xml = `<?xml version='1.0'?>\n`;
        // User requested compact format (line 1, line 2, line 3=content)

        xml += `<!--Génération par DRC le ${dateStr} ${timeStr}-->\n`;
        xml += `<generation type='Soumission'>`;

        xml += `<meta`;
        xml += ` cible='${escape(targetPath)}'`;
        xml += ` Langue='${(client.language && client.language.toLowerCase().startsWith('en')) ? 'en' : 'fr'}'`;
        xml += ` action='recopier'`;
        xml += ` modele='${escape(sourcePath)}'`;
        xml += ` appCode='03'`;
        xml += ` journal=''`;
        xml += ` ancienNom='${escape(originalReference)}'`;
        xml += ` socLangue='en'`;
        xml += ` codeModule='01'`;
        xml += ` definition='C:\\Travail\\XML\\CLAUTOMATERECOPIER.xml'`;
        xml += ` nouveauNom='${escape(quote.reference)}'`;
        xml += ` ancienCouleur='${escape(materialName)}'`;
        xml += ` ancienQualite='${escape(quote.material?.quality || '')}'`;
        xml += ` nouveauCouleur='${escape(materialName)}'`;
        xml += ` codeApplication='03'`;
        xml += ` nouvelleQualite='${escape(quote.material?.quality || '')}'>`;
        xml += `<resultat flag=''/></meta>`;

        const tel = contact.phone || client.phone || '';
        const email = contact.email || client.email || '';
        const address = client.addresses && client.addresses.length > 0 ? client.addresses[0] : {};
        const provinceCode = this.formatProvince(address.state || client.province || '');
        const countryCode = this.formatCountry(address.country || client.country || 'Canada');

        xml += `<client nom='${escape(client.name)}' pays='${escape(countryCode)}' ville='${escape(client.city || address.city)}' langue='${(client.language && client.language.toLowerCase().startsWith('en')) ? 'en' : 'fr'}' region='${escape(provinceCode)}' adresse1='${escape(client.address || address.line1)}' codepostal='${escape(client.postalCode || address.zipCode)}' abbreviation=''><contacts><contact cel='' fax='' nom='${escape(contact.lastName)}' tel='${escape(tel)}' mail='${escape(email)}' prenom='${escape(contact.firstName)}'/></contacts></client>`;

        xml += `<representant cel='+1_(514)_651-4296' fax='+1' nom='Ares' tel='+1_514-651-4296' mail='sares@granitedrc.com' prenom='Sophie'/>`;

        xml += `<devis UC='CAD' Mesure='an' devise='USD' Accompte=',3' Escompte=',03' Incoterm='Entry' Paiement='30' delaiNbr='3' emetteur='Thomas Leguen' IncotermS='FOB Harwich, MA' TauxChange='1' IncotermInd='3' DureValidite='30' dateEmission='${dateEmission}' DelaiEscompte='15' ConditionPaiement='net X days and % discount if payment received before 30 days from date of invoice' ConditionPaiementInd='4' ConditionPaiementSaisie=''>`;
        xml += `<LOADING nom='GRANITE DRC RAP' pays='CA' ville='Rivière-à-Pierre' region='CA-QC' adresse1='475 Avenue Delisle' regiondsp='Quebec' codepostal='G0A3A0' paysTraduit='Canada' abbreviation=''/>`;
        const matUnit = (quote.material?.unit === 'sqft') ? 'pi3' : (quote.material?.unit === 'm2' ? 'm3' : (quote.material?.unit || 'm3'));
        xml += `<pierre Poid='0' prix='${quote.material?.purchasePrice || 0}' perte='0' unite='${matUnit}' couleur='${escape(materialName)}' qualite='${escape(quote.material?.quality || '')}' quantite='${quote.project?.numberOfLines || 0}' unitePoid='lbs'/><externe devise=''/>`;
        xml += `</devis>`;

        xml += `<Fournisseurs/>`;
        xml += `</generation>`;

        return xml;
    }
    parseExcelReturnXml(xmlContent: string): any[] {
        try {
            console.log('[XmlService] Parsing Return XML...');
            const doc = create(xmlContent);
            const obj = doc.toObject() as any;

            const devis = obj?.generation?.devis;
            if (devis) {
                console.log(`[DEBUG] Devis Keys: ${Object.keys(devis).join(', ')}`);
                if (devis.externe) console.log(`[DEBUG] Devis.externe Keys: ${Object.keys(devis.externe).join(', ')}`);
                if (devis.Externe) console.log(`[DEBUG] Devis.Externe Keys: ${Object.keys(devis.Externe).join(', ')}`);
            }
            if (!devis) {
                console.warn('[XmlService] No <devis> tag found in XML.');
                return [];
            }

            // Target <externe><ligne> or <externe><Ligne>
            let lignes = devis.externe?.ligne || devis.externe?.Ligne;

            // Fallback to <pierre> if <ligne> not found (legacy/robustness)
            if (!lignes) {
                if (devis.externe) {
                    console.log(`[XmlService] <externe> keys: ${Object.keys(devis.externe).join(', ')}`);
                }
                console.log('[XmlService] No <externe><ligne> found. Check <pierre>...');
                lignes = devis.pierre;
            }

            if (!lignes) {
                console.warn('[XmlService] No lines found (checked <externe><ligne> and <pierre>).');
                if (devis) console.log(`[XmlService] Devis keys: ${Object.keys(devis).join(', ')}`);
                return [];
            }

            if (!Array.isArray(lignes)) {
                lignes = [lignes];
            }

            const items: any[] = [];
            const parseNum = (val: any) => {
                if (!val) return 0;
                if (typeof val === 'string') return parseFloat(val.replace(',', '.').replace(/[^0-9.-]/g, ''));
                return Number(val);
            };

            lignes.forEach((p: any, index: number) => {
                if (index === 0) console.log(`[XmlService] Line[0] Keys: ${Object.keys(p).join(', ')}`);

                // Helper to get attribute case-insensitive (handle @ prefix or direct)
                const getAtt = (k: string) => p[`@${k}`] || p[`@${k.toLowerCase()}`] || p[`@${k.toUpperCase()}`] || p[k] || p[k.toLowerCase()] || p[k.toUpperCase()];

                // Mapping based on "16:20" XML
                const item = {
                    tag: getAtt('TAG') || getAtt('tag') || getAtt('No') || 'Ligne',
                    description: getAtt('Description') || getAtt('nom') || 'Item',
                    material: getAtt('GRANITE') || getAtt('couleur') || 'N/A',
                    quantity: parseNum(getAtt('QTY') || getAtt('quantite') || 1),
                    unit: getAtt('Unité') || getAtt('unite') || 'ea',

                    length: parseNum(getAtt('Longeur') || getAtt('longueur')),
                    width: parseNum(getAtt('Largeur') || getAtt('largeur')),
                    thickness: parseNum(getAtt('Epaisseur') || getAtt('epaisseur')),

                    netLength: parseNum(getAtt('Long.net') || getAtt('netLength')),
                    netArea: parseNum(getAtt('Surface_net') || getAtt('surface')),
                    netVolume: parseNum(getAtt('Vol_Tot') || getAtt('volume')),
                    totalWeight: parseNum(getAtt('Poid_Tot') || getAtt('poid')),

                    // Pricing
                    unitPrice: parseNum(getAtt('Prix_unitaire_externe') || getAtt('prix')),
                    totalPrice: parseNum(getAtt('Prix_externe') || getAtt('total')),

                    // Internal Pricing (from XML)
                    unitPriceInternal: parseNum(getAtt('Prix_unitaire_interne')),
                    totalPriceInternal: parseNum(getAtt('Prix_interne')),

                    stoneValue: parseNum(getAtt('valeurPierre')),

                    // Manufacturing Costs
                    primarySawingCost: parseNum(getAtt('scPrimaire')),
                    secondarySawingCost: parseNum(getAtt('scSecondaire')),
                    profilingCost: parseNum(getAtt('profilage')),
                    finishingCost: parseNum(getAtt('Finition')),
                    anchoringCost: parseNum(getAtt('Ancrage')),

                    // Time
                    unitTime: parseNum(getAtt('tempsUnitaire')),
                    totalTime: parseNum(getAtt('tempsTotal'))
                };

                items.push(item);
            });

            if (items.length > 0) {
                const i = items[0];
                console.log(`[XmlService] CHECK -> Item 1: MATERIAL='${i.material}', ScP=${i.primarySawingCost}, ScS=${i.secondarySawingCost}, UnitTime=${i.unitTime}, PriceInt=${i.unitPriceInternal}, TotalInt=${i.totalPriceInternal}`);
            }
            console.log(`[XmlService] Successfully parsed ${items.length} items.`);
            return items;

        } catch (e) {
            console.error('[XmlService] Parsing Error:', e);
            return [];
        }
    }
}
