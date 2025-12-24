import { create } from 'xmlbuilder2';
import { parseStringPromise } from 'xml2js';
import fs from 'fs';
import path from 'path';

export class XmlService {
    private fmtPhone(v: any): string {
        if (!v) return '';
        let d = v.replace(/[^\d]/g, '');
        // Fix: If number starts with 1 and has 11 digits (e.g., 1514...), strip leading 1
        if (d.length === 11 && d.startsWith('1')) {
            d = d.substring(1);
        }
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
            const dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const dateEmission = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;

            doc.com(`Génération par DRC le ${dateStr}`);

            const root = doc.ele('generation').att('type', 'Soumission');

            let meta = root.ele('meta');

            // Default Values (EMCOT)
            // Excel Storage Path (Treasury Location for Automate)
            // Excel Storage Path (Treasury Location for Automate)
            const excelTargetBase = 'f:\\nxerp';
            const safe = (s: any) => (s || '').replace(/[^a-zA-Z0-9-]/g, '_');

            // FILENAME LOGIC: Restored Full Format per User Request (Required for PDF)
            // Format: Ref_Client_Project_Material
            const filename = `${safe(quote.reference)}_${safe(quote.client?.name)}_${safe(quote.project?.name)}_${safe(quote.material?.name)}.xlsx`;

            // Target: f:\nxerp\ProjectName\Ref_Client_Project_Materiaux.xlsx
            const defaultFullPath = `${excelTargetBase}\\${quote.project?.name || 'Projet'}\\${filename}`;

            // Inject Quote ID for Agent Download (Source = Original ID if Revision)
            // REMOVED PER USER MAPPING (Agent parses filename or uses other logic if needed)
            // const downloadQuoteId = revisionData?.sourceQuoteId || quote.id;
            // meta.att('quoteId', downloadQuoteId);


            if (revisionData) {
                // REVISION MODE - STRICT ORDER PER USER REQUEST
                meta.att('cible', revisionData.cible)
                    .att('Langue', quote.client?.language || 'fr')
                    .att('action', 'reviser')
                    .att('modele', revisionData.cible) // Modele = Cible for Revision
                    .att('appCode', '03')
                    .att('journal', '')
                    .att('ancienNom', revisionData.ancienNom) // Position 1
                    .att('socLangue', quote.client?.language || 'fr')
                    .att('codeModule', '01')
                    .att('definition', 'C:\\Travail\\XML\\CLAUTOMATEREVISION.xml')
                    .att('nouveauNom', revisionData.nouveauNom)
                    .att('ancienCouleur', revisionData.ancienCouleur)
                    .att('ancienQualite', revisionData.ancienQualite || '')
                    .att('nouveauCouleur', revisionData.nouveauCouleur)
                    .att('codeApplication', '03')
                    .att('nouvelleQualite', revisionData.nouvelleQualite || ''); // Added at end or per specific need? User list ended at nouveauCouleur but xml has quality
            } else {
                // STANDARD MODE (EMCOT)
                meta.att('cible', defaultFullPath)
                    .att('Langue', quote.client?.language || 'fr')
                    .att('action', 'emcot')
                    .att('modele', 'H:\\Modeles\\Directe\\Modele de cotation defaut.xlsx')
                    .att('appCode', '03')
                    .att('journal', '')
                    .att('socLangue', quote.client?.language || 'fr')
                    .att('codeModule', '01')
                    .att('definition', 'C:\\Travail\\XML\\CLAUTOMATEEMISSIONCOTATION.xml') // Moved here
                    .att('codeApplication', '03');
            }

            meta.ele('resultat').att('flag', '').up();

            const cli = root.ele('client')
                .att('nom', quote.client?.name || '')
                .att('pays', 'CA')
                .att('ville', quote.client?.addresses?.[0]?.city || '')
                .att('langue', quote.client?.language || 'fr') // FIXED: Client Language
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

            // --- INCOTERM LOGIC V8 (Data Priority) ---
            // STRICT MAPPING: Name -> Incoterm, Code -> IncotermInd, Custom -> IncotermS

            // 1. Determine Name
            let incotermName = quote.incotermRef?.name || quote.incoterm || 'Ex-Works';

            // 2. Determine Code (Ind)
            let incotermCode = quote.incotermRef?.xmlCode;

            // Fallback for Code if missing from Ref (e.g. legacy data)
            if (!incotermCode) {
                const upperName = incotermName.toUpperCase();
                if (upperName.includes('FOB')) incotermCode = '2';
                else if (upperName.includes('EX-WORK') || upperName.includes('EX WORK')) incotermCode = '1';
                else if (upperName.includes('SAISIE')) incotermCode = '3';
                else incotermCode = '1'; // Default Safety
            }

            // 3. Determine Custom Text (S)
            // Rule: If Code 3 (Saisie), use Custom Text.
            //       If Code 1 or 2, use the Incoterm Name as the "corresponding value".
            const incotermCustom = (quote.incotermCustomText && quote.incotermCustomText.trim() !== '')
                ? quote.incotermCustomText
                : '';

            const valIncoterm = incotermName;
            const valIncotermInd = incotermCode;

            let valIncotermS = '';

            // Logic confirmed by User:
            // 1 (Ex-Work) -> IncotermS = "Ex-Work"
            // 2 (FOB) -> IncotermS = "FOB"
            // 3 (Saisie) -> IncotermS = Custom Text

            if (incotermCode === '3' || incotermName.toLowerCase().includes('saisie')) {
                valIncotermS = incotermCustom;
            } else if (incotermCode === '1') {
                valIncotermS = 'Ex-Work';
            } else if (incotermCode === '2') {
                valIncotermS = 'FOB';
            } else {
                // If unknown code but mapped to 1/2 by fallback, use Name as safety
                valIncotermS = incotermName;
            }

            const mesureCode = this.getMesureCode(quote.project?.measurementSystem || quote.client?.unitSystem);

            const devis = root.ele('devis')
                .att('UC', 'CAD')
                .att('nom', quote.project?.name || 'Projet')
                .att('Mesure', mesureCode)
                .att('TxSemi', this.formatDecimal(quote.semiStandardRate || 0))
                .att('devise', quote.salesCurrency || quote.currency || '')
                .att('numero', quote.reference || '')
                .att('CratePU', this.formatDecimal(quote.palletPrice || 0))
                .att('Accompte', this.formatDecimal((quote.depositPercentage ?? 0) / 100))
                .att('Escompte', this.formatDecimal((quote.discountPercentage ?? 0) / 100))
                .att('Incoterm', valIncoterm)
                .att('IncotermS', valIncotermS)
                .att('IncotermInd', valIncotermInd)
                .att('Paiement', (quote.paymentDays ?? 0).toString())
                .att('delaiNbr', (quote.estimatedWeeks || quote.project?.estimatedWeeks || '').toString())
                .att('emetteur', rep ? `${rep.firstName} ${rep.lastName}` : (quote.representative?.firstName ? `${quote.representative.firstName} ${quote.representative.lastName}` : ''))
                .att('valideur', '')
                .att('Complexite', 'Spécifique')
                .att('TauxChange', this.formatDecimal(quote.exchangeRate || 1))
                .att('optPalette', quote.palletRequired ? '1' : '0')
                .att('DureValidite', (quote.validityDuration ?? 0).toString())
                .att('dateEmission', dateEmission)
                .att('DelaiEscompte', (quote.discountDays ?? 0).toString());

            console.log(`[XML DEBUG] Payment Logic - CustomText: '${quote.paymentCustomText}', TermCode: ${quote.paymentTerm?.code}`);

            devis.att('ConditionPaiement', (quote.paymentCustomText && quote.paymentCustomText.trim() !== '') ? quote.paymentCustomText : ((quote.client?.language === 'en' ? quote.paymentTerm?.label_en : quote.paymentTerm?.label_fr) || this.generatePaymentTermLabel(
                quote.paymentTerm?.code || 0,
                quote.paymentDays ?? 0,
                quote.depositPercentage ?? 0,
                quote.client?.language || 'fr',
                quote.discountPercentage ?? 0,
                quote.discountDays ?? 0
            ) || ''))
                // FIX: Priority = Local Code > 3. (If Mode 7 is selected, we want '7', even if text is present)
                .att('ConditionPaiementInd', quote.paymentTerm?.code?.toString() || ((quote.paymentCustomText && quote.paymentCustomText.trim() !== '') ? '3' : ''))
                .att('ConditionPaiementSaisie', quote.paymentCustomText || '');

            devis.ele('LOADING').att('nom', 'GRANITE DRC RAP').att('pays', 'CA').att('ville', 'Rivière-à-Pierre').att('region', 'CA-QC').att('adresse1', '475 Avenue Delisle').att('codepostal', 'G0A3A0').up();
            devis.ele('externe').att('devise', '').up();

            const qty = quote.project?.numberOfLines || 0;
            const matUnit = (quote.material?.unit === 'sqft') ? 'pi3' : (quote.material?.unit === 'm2' ? 'm3' : (quote.material?.unit || ''));

            devis.ele('pierre')
                .att('Poid', '175')
                .att('prix', (quote.material?.purchasePrice || 0).toString())
                .att('perte', ',4')
                .att('unite', matUnit)
                .att('devise', quote.currency || '')
                .att('couleur', quote.material?.name || '')
                .att('qualite', quote.material?.quality || '')
                .att('quantite', qty.toString())
                .att('unitePoid', 'lbs').up();

            root.ele('Fournisseurs').up();

            const xml = doc.end({ prettyPrint: false });
            // FIX: Replace content single quotes with typographic quotes to avoid breaking parser
            // Then convert attribute double quotes to single quotes
            return xml.replace(/'/g, '’').replace(/"/g, "'");


        } catch (e) { console.error(e); throw e; }
    }

    async generatePdfXml(quote: any, projectPath: string, filename: string): Promise<string> {
        // PDF GENERATION RAK
        console.log('📄 GENERATING PDF RAK for:', filename);

        const doc = create({ version: '1.0' });
        const now = new Date();
        const dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        doc.com(`Génération par DRC le ${dateStr}`);
        const root = doc.ele('generation').att('type', 'Soumission');

        // modele: Source file for the Agent to copy FROM. 
        // Agent logic: copies 'modele' -> to 'dirpdf'
        // So 'modele' must point to the existing file in the Project folder.
        // FIX: Force Windows Backslashes (Mac uses / by default with path.join)
        const fullSourcePath = path.join(projectPath, filename).replace(/\//g, '\\');

        // cible: The destination in the Project Folder (Standard storage)
        const ciblePath = `${projectPath}\\${filename}`.replace(/\//g, '\\');

        // Language
        const lang = (quote.client?.language && quote.client.language.toLowerCase().startsWith('en')) ? 'en' : 'fr';

        // dirpdf: The temporary working folder where Agent copies the source (F:\nxerppdf)
        // User requested trailing backslash: 'F:\nxerppdf\'
        // dirpdf: The temporary working folder where Agent copies the source (F:\nxerppdf)
        const dirPdf = 'F:\\nxerppdf\\';

        // Meta Construction
        const meta = root.ele('meta')
            .att('cible', ciblePath)
            .att('print', '')
            .att('Langue', lang)
            .att('action', 'devispdf')
            .att('dirpdf', dirPdf)
            .att('modele', fullSourcePath) // Use fullSourcePath here
            .att('appCode', '03')
            .att('journal', '')
            .att('socLangue', lang)
            .att('codeModule', '01')
            .att('definition', 'C:\\Travail\\XML\\CLAUTOMATEDEVISxml')
            .att('codeApplication', '03');

        meta.ele('resultat').att('flag', '').up();

        root.ele('devis').ele('externe').up().up();

        const xml = doc.end({ prettyPrint: false });
        // Sanitize quotes as usual
        return xml.replace(/'/g, '’').replace(/"/g, "'");
    }

    async generateReintegrationXml(p: string, quoteId: string): Promise<string> {
        // Validation: Ensure P points to F:\nxerp (Excel)
        // XML is essentially a wrapper.
        const root = create({ version: '1.0', encoding: 'UTF-8' })
            .ele('generation', { type: 'Soumission' });

        root.ele('meta')
            .att('cible', p)
            .att('Langue', 'en')
            .att('action', 'reintegrer')
            .att('quoteId', quoteId) // INJECTED ID FOR AGENT
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

        const xml = root.end({ prettyPrint: true, headless: false });
        // FIX: Enforce single quotes for attributes and sanitize content quotes
        return xml.replace(/'/g, '’').replace(/"/g, "'");
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

        const escape = (str: string | undefined | null) => (str || '').replace(/'/g, "’");
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
        const safe = (s: any) => (s || '').replace(/[^a-zA-Z0-9-]/g, '_');
        // FULL FORMAT: Ref_Client_Project_Material
        const fullNewName = `${safe(quote.reference)}_${safe(client.name)}_${safe(quote.project?.name)}_${safe(materialName)}`;

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

        // Dynamic Representative
        let repTag = `<representant cel='' fax='' nom='System' tel='' mail='admin@granitedrc.com' prenom='Admin'/>`;
        const r = quote.representative;
        if (r) {
            repTag = `<representant cel='${this.fmtPhone(r.mobile)}' fax='' nom='${escape(r.lastName)}' tel='${this.fmtPhone(r.phone)}' mail='${escape(r.email)}' prenom='${escape(r.firstName)}'/>`;
        } else if (client.repName) {
            repTag = `<representant cel='' fax='' nom='${escape(client.repName)}' tel='' mail='' prenom=''/>`;
        }
        xml += repTag;

        // Dynamic Incoterm V8 Logic
        let valIncoterm = 'Ex-Works';
        let valIncotermS = ' ';
        let valIncotermInd = 'EXW';
        if (quote.incotermCustomText && quote.incotermCustomText.trim() !== '') {
            valIncoterm = 'Saisie';
            valIncotermS = quote.incotermCustomText;
            valIncotermInd = quote.incotermRef?.xmlCode || '3';
        } else if (quote.incotermRef) {
            valIncoterm = quote.incotermRef.name || 'Ex-Works';
            valIncotermInd = quote.incotermRef.xmlCode || 'EXW';
            valIncotermS = ' ';
            if (quote.incotermRef.requiresText) valIncoterm = 'Saisie';
        }

        // Dynamic Payment Terms
        const payLabel = (client.language === 'en' ? quote.paymentTerm?.label_en : quote.paymentTerm?.label_fr) ||
            this.generatePaymentTermLabel(quote.paymentTerm?.code || 0, quote.paymentDays ?? 0, quote.depositPercentage ?? 0, client.language || 'fr', quote.discountPercentage ?? 0, quote.discountDays ?? 0);

        xml += `<devis nom='${escape(quote.project?.name)}' numero='${escape(quote.reference)}' UC='CAD' Mesure='an' devise='${escape(quote.salesCurrency || quote.currency || '')}' Accompte='${this.formatDecimal((quote.depositPercentage ?? 0) / 100)}' Escompte='${this.formatDecimal((quote.discountPercentage ?? 0) / 100)}' Incoterm='${escape(valIncoterm)}' Paiement='${(quote.paymentDays ?? 0)}' delaiNbr='${quote.estimatedWeeks || ''}' emetteur='${r ? escape(r.firstName + ' ' + r.lastName) : ''}' IncotermS='${escape(valIncotermS)}' TauxChange='${this.formatDecimal(quote.exchangeRate || 1)}' IncotermInd='${escape(valIncotermInd)}' DureValidite='${(quote.validityDuration || 30)}' dateEmission='${dateEmission}' DelaiEscompte='${(quote.discountDays ?? 0)}' ConditionPaiement='${escape(payLabel)}' ConditionPaiementInd='${quote.paymentTerm?.code || ''}' ConditionPaiementSaisie='${escape(quote.paymentCustomText || '')}'>`;
        xml += `<LOADING nom='GRANITE DRC RAP' pays='CA' ville='Rivière-à-Pierre' region='CA-QC' adresse1='475 Avenue Delisle' regiondsp='Quebec' codepostal='G0A3A0' paysTraduit='Canada' abbreviation=''/>`;
        const matUnit = (quote.material?.unit === 'sqft') ? 'pi3' : (quote.material?.unit === 'm2' ? 'm3' : (quote.material?.unit || 'm3'));
        xml += `<pierre Poid='0' prix='${quote.material?.purchasePrice || 0}' perte='0' unite='${matUnit}' couleur='${escape(materialName)}' qualite='${escape(quote.material?.quality || '')}' quantite='${quote.project?.numberOfLines || 0}' unitePoid='lbs'/><externe devise=''/>`;
        xml += `</devis>`;

        xml += `<Fournisseurs/>`;
        xml += `</generation>`;

        return xml;
    }
    parseExcelReturnXml(xmlContent: string): any {
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

                // Robust case-insensitive attribute getter
                const getAtt = (target: string) => {
                    const keys = Object.keys(p);
                    const key = keys.find(k => k.toLowerCase().replace('@', '') === target.toLowerCase());
                    return key ? p[key] : undefined;
                };

                // Mapping based on "16:20" XML
                // TAG: XML has TAG="001-1", Code previously missed it? Now scanning keys.
                const rawTag = getAtt('TAG');
                const rawNo = getAtt('No');
                if (index === 0) {
                    console.log(`[XmlService] DEBUG TAG -> RawTAG: '${rawTag}', RawNo: '${rawNo}'`);
                    console.log(`[XmlService] DEBUG ITEM KEYS: ${Object.keys(p).join(', ')}`);
                    // Helper debug
                    const v = (k: string) => `${k}=${getAtt(k)}`;
                    console.log(`[XmlService] VALUES: ${v('Longeur')}, ${v('Largeur')}, ${v('Epaisseur')}, ${v('quantite')}, ${v('prix')}, ${v('Total')}`);
                }

                const tag = rawTag || rawNo || 'Ligne';

                // New Fields Mapping (User Request)
                const lineNo = getAtt('No') || getAtt('NL');
                const refReference = getAtt('Ref') || getAtt('REF') || getAtt('Reference') || getAtt('Reference_client'); // Found in keys: @Ref
                const product = getAtt('Item') || getAtt('PDT') || getAtt('Produit') || getAtt('step');

                if (index === 0) {
                    console.log(`[XmlService] DEBUG NEW FIELDS -> lineNo: '${lineNo}', ref: '${refReference}', product: '${product}'`);
                    console.log(`[XmlService] DEBUG ALL KEYS: ${Object.keys(p).join(', ')}`);
                }

                // Description: XML has Description="A renseigner". Now scanning 'description' matches 'Description'.
                const description = getAtt('description') || getAtt('nom') || getAtt('Nom') || getAtt('couleur') || getAtt('No') || 'Item';

                // STRICT MAPPING: Dimensions (Brut vs Net)
                const length = parseNum(getAtt('Longeur') || getAtt('length'));
                const width = parseNum(getAtt('Largeur') || getAtt('width'));
                const thickness = parseNum(getAtt('Epaisseur') || getAtt('thickness'));

                const netLength = parseNum(getAtt('Long.net') || getAtt('Longeur_net') || getAtt('NetLength'));
                const netArea = parseNum(getAtt('Surface_net') || getAtt('NetArea'));
                const netVolume = parseNum(getAtt('Vol_Tot') || getAtt('Volume_net') || getAtt('NetVolume'));
                const totalWeight = parseNum(getAtt('Poid_Tot') || getAtt('Poids') || getAtt('Weight'));

                // STRICT MAPPING: Quantities
                const qty = parseNum(getAtt('QTY') || getAtt('quantite') || getAtt('qte'));

                // DEBUG: Inspect Raw Price Values (Critical for debug)
                const rawPriceInt = p['@Prix_unitaire_interne'] || p['Prix_unitaire_interne'];
                if (index === 0) {
                    console.log(`[XmlService] DEBUG RAW PRICE INTERNE: '${rawPriceInt}' (Type: ${typeof rawPriceInt})`);
                    console.log(`[XmlService] DEBUG RAW Keys Check: @Prix_unitaire_interne=${p['@Prix_unitaire_interne']}, @scPrimaire=${p['@scPrimaire']}`);
                }

                // STRICT MAPPING: Pricing (USD / Externe is Default)
                // 'Prix_unitaire_externe' is the explicit column. 'Prix' is fallback.
                const unitPrice = parseNum(getAtt('Prix_unitaire_externe') || getAtt('PU_Externe') || getAtt('Prix'));
                let total = parseNum(getAtt('Prix_externe') || getAtt('Total_Externe') || getAtt('Total'));

                // STRICT MAPPING: Pricing (CAD / Interne)
                const unitPriceCad = parseNum(getAtt('Prix_unitaire_interne') || getAtt('PU_Interne') || getAtt('Prix_CAD'));
                const totalPriceCad = parseNum(getAtt('Prix_interne') || getAtt('Total_Interne') || getAtt('Total_CAD'));

                // STRICT MAPPING: Detailed Costs
                const stoneValue = parseNum(getAtt('valeurPierre') || getAtt('Valeur_pierre'));
                const primarySawingCost = parseNum(getAtt('scPrimaire') || getAtt('Cout_sciage_primaire'));
                const secondarySawingCost = parseNum(getAtt('scSecondaire') || getAtt('Cout_sciage_secondaire'));
                const profilingCost = parseNum(getAtt('Cout_profilage'));
                const finishingCost = parseNum(getAtt('Cout_finition'));
                const anchoringCost = parseNum(getAtt('Cout_ancrage'));

                // Fallback: Compute total if missing
                if (total === 0 && qty > 0 && unitPrice > 0) {
                    total = qty * unitPrice;
                }

                // Fuzzy Match Helper: Normalize keys to Uppercase Alphanumeric (e.g. "Long." -> "LONG", "Unit Price" -> "UNITPRICE")
                const getFuzzyAtt = (targets: string[]) => {
                    const normalizedKeys = Object.keys(p).reduce((acc, k) => {
                        acc[k.toUpperCase().replace(/[^A-Z0-9]/g, '')] = k;
                        return acc;
                    }, {} as any);

                    for (const t of targets) {
                        const normT = t.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        // Priority 1: Exact Fuzzy Match
                        if (normalizedKeys[normT]) return p[normalizedKeys[normT]];
                    }
                    // Priority 2: Standard getAtt fallback for non-normalized logic (e.g. existing logic)
                    for (const t of targets) {
                        const val = getAtt(t);
                        if (val !== undefined) return val;
                    }
                    return undefined;
                };

                const item = {
                    tag: tag,
                    no: lineNo,
                    ref: refReference,
                    product: product, // 'Item' or 'PDT'

                    description: description,
                    // XML uses 'GRANITE' for Material
                    material: getAtt('GRANITE') || getAtt('material') || getAtt('materiau') || 'N/A',

                    // Dimensions (Strict from user XML)
                    length: parseNum(getAtt('Longeur')),
                    width: parseNum(getAtt('Largeur')),
                    thickness: parseNum(getAtt('Epaisseur')),

                    // Net Dimensions (Strict from user XML)
                    netLength: parseNum(getAtt('Long.net')),
                    netArea: parseNum(getAtt('Surface_net')),
                    netVolume: parseNum(getAtt('Vol_Tot')),
                    totalWeight: parseNum(getAtt('Poid_Tot')),

                    quantity: parseNum(getAtt('QTY') || getAtt('quantite')),

                    // Pricing (USD / Externe)
                    unitPrice: parseNum(getAtt('Prix_unitaire_externe')),
                    totalPrice: parseNum(getAtt('Prix_externe')),

                    // Pricing (CAD / Interne) -> Mapped to 'unitPriceCad' in controller
                    unitPriceCad: parseNum(getAtt('Prix_unitaire_interne')),
                    totalPriceCad: parseNum(getAtt('Prix_interne')),

                    // Detailed Costs (Strict from user XML)
                    stoneValue: parseNum(getAtt('valeurPierre')),
                    primarySawingCost: parseNum(getAtt('scPrimaire')),
                    secondarySawingCost: parseNum(getAtt('scSecondaire')),
                    profilingCost: parseNum(getAtt('profilage')),
                    finishingCost: parseNum(getAtt('Finition')),
                    anchoringCost: parseNum(getAtt('Ancrage')),

                    // Time (Legacy/Optional)
                    unitTime: parseNum(getAtt('tempsUnitaire')),
                    totalTime: parseNum(getAtt('tempsTotal'))
                };

                items.push(item);
            });

            if (items.length > 0) {
                const i = items[0];
                console.log(`[XmlService] CHECK -> Item 1: MATERIAL='${i.material}', ScP=${i.primarySawingCost}, ScS=${i.secondarySawingCost}, UnitTime=${i.unitTime}, PriceInt=${i.unitPriceInternal}, TotalInt=${i.totalPriceInternal}`);
            }

            // EXTRACT METADATA (Source of Truth for Filename)
            const metaObj = obj?.generation?.meta;
            let metadata: any = {};
            if (metaObj) {
                // xmlbuilder2 often prefixes attributes with @ in toObject()
                metadata = {
                    cible: metaObj['@cible'] || metaObj['cible']
                };
                console.log(`[XmlService] Parsed Metadata:`, metadata);
            }

            console.log(`[XmlService] Successfully parsed ${items.length} items and metadata.`);
            return { items, metadata };

        } catch (e) {
            console.error('[XmlService] Parsing Error:', e);
            return { items: [], metadata: {} };
        }
    }

    async generatePalletLabelXml(data: {
        pallet: any,
        wo: any,
        printerName: string,
        user: any
    }): Promise<string> {
        // Construct XML String Manually for Full Control (like generateDuplicateXml)
        // Format: PrintSkill (Zebra Label)

        const { pallet, wo, printerName, user } = data;
        const quote = wo.quote;
        const project = quote.project;
        const client = quote.client;
        const now = new Date();

        // Safe helpers
        const escape = (str: string | undefined | null) => (str || '').replace(/'/g, "’").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        const formatDec = (val: number | null | undefined) => (val === null || val === undefined) ? '' : val.toString().replace('.', ',');
        const formatMetricSys = (sys: string | undefined) => (sys === 'Metric') ? 'm' : 'an'; // 'an' seems to be imperial/default based on previous code

        const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
        const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ':');
        const dateIso = now.toISOString().split('T')[0]; // YYYY-MM-DD

        // Helper function for Item Weight (Duped from frontend logic roughly)
        const calcWeight = (qItem: any, qty: number) => {
            const lbsFt3 = 175.24;
            let vol = 0;
            const isImp = (project.measureSystem === 'Imperial') || (!project.measureSystem);
            if (isImp) {
                vol = (qItem.length * qItem.width * qItem.thickness) / 1728;
            } else {
                vol = (qItem.length / 304.8) * (qItem.width / 304.8) * (qItem.thickness / 304.8);
            }
            return vol * lbsFt3 * qty;
        };

        // TOTAL WEIGHT CALCULATION
        let calculatedTotalWeight = 0;
        pallet.items.forEach((pItem: any) => {
            const qItem = wo.quote.items.find((i: any) => i.id === pItem.quoteItemId);
            if (qItem) calculatedTotalWeight += calcWeight(qItem, pItem.quantity);
        });

        // BUILD XML
        let xml = `<?xml version='1.0'?>\n`;
        xml += `<!--Génération par DRC le ${dateStr} ${timeStr}-->\n`;
        xml += `<generation type='Etiquette'>\n`;

        // --- META ---
        xml += `<meta cible='F:\\FP\\${(client.name || '').toUpperCase()}\\${(client.name || '').toUpperCase()}-${wo.reference}-${pallet.number}.xlsx'\n`;
        xml += `print='${escape(printerName)}'\n`;
        xml += `Langue='${(client.language && client.language.toLowerCase().startsWith('en')) ? 'en' : 'fr'}'\n`;
        xml += `action='PrintSkill'\n`;
        xml += `modele='H:\\Modeles\\Directe\\Modèle bon de palette.xlsx'\n`;
        xml += `appCode='03'\n`;
        xml += `journal=''\n`;
        xml += `socLangue='${(client.language && client.language.toLowerCase().startsWith('en')) ? 'en' : 'fr'}'\n`;
        xml += `codeModule='07'\n`;
        xml += `definition='C:\\Travail\\XML\\CLAUTOMATEPALETTE.xml'\n`;
        xml += `codeApplication='03'>\n`;
        xml += `<resultat flag=''/>\n`;
        xml += `</meta>`;

        // --- CLIENT & PALLET HEADER ---
        xml += `<client Langue='${(client.language && client.language.toLowerCase().startsWith('en')) ? 'en' : 'fr'}'\n`;
        xml += `nomClient='${escape((client.name || '').toUpperCase())}'/>\n`;

        const palletNum = `${wo.clientPO || 'NO-PO'}/line3/${pallet.number.toString().padStart(3, '0')}`;

        xml += `<Palette Poids='${formatDec(calculatedTotalWeight)}'\n`;
        xml += `BCNumero='${escape(wo.clientPO || '')}' BTNumero='${escape(wo.reference)}'\n`;
        xml += `Palettenumero='${escape(palletNum)}'\n`;
        xml += `dateFermeture='${dateIso}'\n`; // YYYY-MM-DD
        xml += `PaletteValideur='${escape(user.firstName + ' ' + user.lastName)}'>\n`;

        xml += `<lignes>\n`;

        for (const pItem of pallet.items) {
            const qItem = wo.quote.items.find((i: any) => i.id === pItem.quoteItemId);
            if (!qItem) continue;

            const w = calcWeight(qItem, pItem.quantity);
            const measureSys = (project.measureSystem === 'Imperial' || !project.measureSystem) ? 'an' : 'm';
            const matName = qItem.material?.name || qItem.material || 'N/A';

            // Each PalletItem -> One <ligne> tag
            xml += `<ligne QTÉ='${formatDec(pItem.quantity)}'\n`;
            xml += `TAG='${escape(qItem.tag || '')}'\n`;
            xml += `ITEM='${escape(qItem.refReference || qItem.product || qItem.description)}'\n`;
            xml += `Poids='${formatDec(w)}'\n`;
            xml += `GRANITE='${escape(matName)}'\n`;
            xml += `Largeur='${formatDec(qItem.width)}'\n`;
            xml += `Longeur='${formatDec(qItem.length)}'\n`;
            xml += `uLargeur='${measureSys}'\n`;
            xml += `uLongeur='${measureSys}'\n`;
            xml += `Epaisseur='${formatDec(qItem.thickness)}'\n`;
            xml += `uEpaisseur='${measureSys}'/>\n`;
        }

        xml += `</lignes></Palette></generation>`;

        return xml;
    }

    async generatePalletLabelPdfXml(quote: any, client: any, filename: string): Promise<string> {
        // PDF GENERATION FOR LABEL (Submitted Model)
        // Structure based on User Image "Fonction PDF"
        // <generation type='Soumission'><meta action='devispdf' ...>

        const doc = create({ version: '1.0' });
        const now = new Date();
        const dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        doc.com(`Génération par DRC le ${dateStr}`);
        const root = doc.ele('generation').att('type', 'Soumission');

        // Paths based on User Annotation:
        // cible: "ecrire meta cible='F:\FP\nome du client\fichier excel de l'étiquette'"
        // modele: "ecrire modele='F:\nxerp\nomdu projet\nom du fichier' " 
        // dirpdf: "F:\nxerp\pdf\"

        const safe = (s: any) => (s || '').replace(/[^a-zA-Z0-9-]/g, '_');
        const clientNameUpper = (client.name || '').toUpperCase();
        const projectName = quote.project?.name || 'Projet';

        // NOTE: User annotation says "nomdu projet\nom du fichier" for modele.
        // Assuming 'filename' passed is just the name (e.g. FP25-003931.xlsx).

        // Cible (Label Excel Location?) 
        const ciblePath = `F:\\FP\\${clientNameUpper}\\${filename}`;

        // Modele (Source Excel for PDF?) - User said "F:\nxerp\nomdu projet..."
        // If the Label Print generated it in F:\FP, maybe this path is where the PDF Engine expects it?
        // Or maybe User assumes it's copied there? 
        // Let's follow annotation strictly: F:\nxerp\PROJECT\FILENAME
        // WAIT: If the file is physically in F:\FP (created by PrintSkill), then THIS path must point to it for the Agent to find it.
        // User annotation might be copying the Quote logic.
        // But he said "ecrire modele='F:\nxerp...'"
        // I will use F:\nxerp structure as requested, assuming the file exists there or Agent logic handles it.
        // RISK: File might not be there. 
        // ALTERNATIVE: Use F:\FP path for both if that's where it is?
        // Let's use F:\nxerp path as requested.
        const modelePath = `F:\\nxerp\\${projectName}\\${filename}`;

        const dirPdf = 'F:\\nxerp\\pdf\\';

        const lang = (client.language && client.language.toLowerCase().startsWith('en')) ? 'en' : 'fr';

        const meta = root.ele('meta')
            .att('cible', ciblePath) // Destination? Or Source for Label?
            .att('print', '')
            .att('Langue', lang)
            .att('action', 'devispdf')
            .att('dirpdf', dirPdf)
            .att('modele', modelePath) // Source?
            .att('appCode', '03')
            .att('journal', '')
            .att('socLangue', lang)
            .att('codeModule', '01')
            .att('definition', 'C:\\Travail\\XML\\CLAUTOMATEDEVISxml')
            .att('codeApplication', '03');

        meta.ele('resultat').att('flag', '').up();

        // Close tags match image: </meta><devis><externe/></devis></generation>
        root.ele('devis').ele('externe').up().up();

        const xml = doc.end({ prettyPrint: false });
        return xml.replace(/'/g, '’').replace(/"/g, "'");
    }
}

