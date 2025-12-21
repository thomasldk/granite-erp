"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlService = void 0;
const xmlbuilder2_1 = require("xmlbuilder2");
const path_1 = __importDefault(require("path"));
class XmlService {
    fmtPhone(v) {
        if (!v)
            return '';
        let d = v.replace(/[^\d]/g, '');
        // Fix: If number starts with 1 and has 11 digits (e.g., 1514...), strip leading 1
        if (d.length === 11 && d.startsWith('1')) {
            d = d.substring(1);
        }
        if (d.length < 10)
            return v;
        return `+1_(${d.slice(0, 3)})_${d.slice(3, 6)}-${d.slice(6)}`;
    }
    getMesureCode(val) {
        if (!val)
            return 'an';
        if (val.toLowerCase().includes('imp'))
            return 'an';
        if (val.toLowerCase().includes('met'))
            return 'm';
        return 'an';
    }
    formatDecimal(val) {
        if (val === null || val === undefined)
            return '';
        let s = val.toString().replace('.', ',');
        if (s.startsWith('0,'))
            return s.substring(1); // "0,3" -> ",3"
        return s;
    }
    generatePaymentTermLabel(code, days, deposit, lang = 'fr', discountPercent = 0, discountDays = 0) {
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
        }
        else {
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
    generateQuoteXml(quote, rep, revisionData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26;
            try {
                console.log('🚨 XML GEN V7 (INCOTERM DYNAMIC) ');
                console.log('--- DEBUG DATA ---');
                console.log('Quote ID:', quote.id);
                if (revisionData)
                    console.log('REVISION MODE DETECTED:', revisionData);
                // ... (keeping debug logs)
                const doc = (0, xmlbuilder2_1.create)({ version: '1.0' });
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
                const safe = (s) => (s || '').replace(/[^a-zA-Z0-9-]/g, '_');
                // FILENAME LOGIC: Restored Full Format per User Request (Required for PDF)
                // Format: Ref_Client_Project_Material
                const filename = `${safe(quote.reference)}_${safe((_a = quote.client) === null || _a === void 0 ? void 0 : _a.name)}_${safe((_b = quote.project) === null || _b === void 0 ? void 0 : _b.name)}_${safe((_c = quote.material) === null || _c === void 0 ? void 0 : _c.name)}.xlsx`;
                // Target: f:\nxerp\ProjectName\Ref_Client_Project_Materiaux.xlsx
                const defaultFullPath = `${excelTargetBase}\\${((_d = quote.project) === null || _d === void 0 ? void 0 : _d.name) || 'Projet'}\\${filename}`;
                // Inject Quote ID for Agent Download (Source = Original ID if Revision)
                // REMOVED PER USER MAPPING (Agent parses filename or uses other logic if needed)
                // const downloadQuoteId = revisionData?.sourceQuoteId || quote.id;
                // meta.att('quoteId', downloadQuoteId);
                if (revisionData) {
                    // REVISION MODE - STRICT ORDER PER USER REQUEST
                    meta.att('cible', revisionData.cible)
                        .att('Langue', ((_e = quote.client) === null || _e === void 0 ? void 0 : _e.language) || 'fr')
                        .att('action', 'reviser')
                        .att('modele', revisionData.cible) // Modele = Cible for Revision
                        .att('appCode', '03')
                        .att('journal', '')
                        .att('ancienNom', revisionData.ancienNom) // Position 1
                        .att('socLangue', ((_f = quote.client) === null || _f === void 0 ? void 0 : _f.language) || 'fr')
                        .att('codeModule', '01')
                        .att('definition', 'C:\\Travail\\XML\\CLAUTOMATEREVISION.xml')
                        .att('nouveauNom', revisionData.nouveauNom)
                        .att('ancienCouleur', revisionData.ancienCouleur)
                        .att('ancienQualite', revisionData.ancienQualite || '')
                        .att('nouveauCouleur', revisionData.nouveauCouleur)
                        .att('codeApplication', '03')
                        .att('nouvelleQualite', revisionData.nouvelleQualite || ''); // Added at end or per specific need? User list ended at nouveauCouleur but xml has quality
                }
                else {
                    // STANDARD MODE (EMCOT)
                    meta.att('cible', defaultFullPath)
                        .att('Langue', ((_g = quote.client) === null || _g === void 0 ? void 0 : _g.language) || 'fr')
                        .att('action', 'emcot')
                        .att('modele', 'H:\\Modeles\\Directe\\Modele de cotation defaut.xlsx')
                        .att('appCode', '03')
                        .att('journal', '')
                        .att('socLangue', ((_h = quote.client) === null || _h === void 0 ? void 0 : _h.language) || 'fr')
                        .att('codeModule', '01')
                        .att('definition', 'C:\\Travail\\XML\\CLAUTOMATEEMISSIONCOTATION.xml') // Moved here
                        .att('codeApplication', '03');
                }
                meta.ele('resultat').att('flag', '').up();
                const cli = root.ele('client')
                    .att('nom', ((_j = quote.client) === null || _j === void 0 ? void 0 : _j.name) || '')
                    .att('pays', 'CA')
                    .att('ville', ((_m = (_l = (_k = quote.client) === null || _k === void 0 ? void 0 : _k.addresses) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.city) || '')
                    .att('langue', ((_o = quote.client) === null || _o === void 0 ? void 0 : _o.language) || 'fr') // FIXED: Client Language
                    .att('region', 'CA-QC')
                    .att('adresse1', ((_r = (_q = (_p = quote.client) === null || _p === void 0 ? void 0 : _p.addresses) === null || _q === void 0 ? void 0 : _q[0]) === null || _r === void 0 ? void 0 : _r.line1) || '')
                    .att('codepostal', ((_u = (_t = (_s = quote.client) === null || _s === void 0 ? void 0 : _s.addresses) === null || _t === void 0 ? void 0 : _t[0]) === null || _u === void 0 ? void 0 : _u.zipCode) || '');
                const contacts = cli.ele('contacts');
                const targetContact = quote.contact || (((_v = quote.client) === null || _v === void 0 ? void 0 : _v.contacts) && quote.client.contacts[0]);
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
                }
                else {
                    root.ele('representant')
                        .att('cel', '').att('fax', '').att('nom', 'System').att('tel', '').att('mail', 'admin@granitedrc.com').att('prenom', 'Admin').up();
                }
                // --- INCOTERM LOGIC V8 (Data Priority) ---
                // STRICT MAPPING: Name -> Incoterm, Code -> IncotermInd, Custom -> IncotermS
                // 1. Determine Name
                let incotermName = ((_w = quote.incotermRef) === null || _w === void 0 ? void 0 : _w.name) || quote.incoterm || 'Ex-Works';
                // 2. Determine Code (Ind)
                let incotermCode = (_x = quote.incotermRef) === null || _x === void 0 ? void 0 : _x.xmlCode;
                // Fallback for Code if missing from Ref (e.g. legacy data)
                if (!incotermCode) {
                    const upperName = incotermName.toUpperCase();
                    if (upperName.includes('FOB'))
                        incotermCode = '2';
                    else if (upperName.includes('EX-WORK') || upperName.includes('EX WORK'))
                        incotermCode = '1';
                    else if (upperName.includes('SAISIE'))
                        incotermCode = '3';
                    else
                        incotermCode = '1'; // Default Safety
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
                }
                else if (incotermCode === '1') {
                    valIncotermS = 'Ex-Work';
                }
                else if (incotermCode === '2') {
                    valIncotermS = 'FOB';
                }
                else {
                    // If unknown code but mapped to 1/2 by fallback, use Name as safety
                    valIncotermS = incotermName;
                }
                const mesureCode = this.getMesureCode(((_y = quote.project) === null || _y === void 0 ? void 0 : _y.measurementSystem) || ((_z = quote.client) === null || _z === void 0 ? void 0 : _z.unitSystem));
                const devis = root.ele('devis')
                    .att('UC', 'CAD')
                    .att('nom', ((_0 = quote.project) === null || _0 === void 0 ? void 0 : _0.name) || 'Projet')
                    .att('Mesure', mesureCode)
                    .att('TxSemi', this.formatDecimal(quote.semiStandardRate || 0))
                    .att('devise', quote.salesCurrency || quote.currency || '')
                    .att('numero', quote.reference || '')
                    .att('CratePU', this.formatDecimal(quote.palletPrice || 0))
                    .att('Accompte', this.formatDecimal(((_1 = quote.depositPercentage) !== null && _1 !== void 0 ? _1 : 0) / 100))
                    .att('Escompte', this.formatDecimal(((_2 = quote.discountPercentage) !== null && _2 !== void 0 ? _2 : 0) / 100))
                    .att('Incoterm', valIncoterm)
                    .att('IncotermS', valIncotermS)
                    .att('IncotermInd', valIncotermInd)
                    .att('Paiement', ((_3 = quote.paymentDays) !== null && _3 !== void 0 ? _3 : 0).toString())
                    .att('delaiNbr', (quote.estimatedWeeks || ((_4 = quote.project) === null || _4 === void 0 ? void 0 : _4.estimatedWeeks) || '').toString())
                    .att('emetteur', rep ? `${rep.firstName} ${rep.lastName}` : (((_5 = quote.representative) === null || _5 === void 0 ? void 0 : _5.firstName) ? `${quote.representative.firstName} ${quote.representative.lastName}` : ''))
                    .att('valideur', '')
                    .att('Complexite', 'Spécifique')
                    .att('TauxChange', this.formatDecimal(quote.exchangeRate || 1))
                    .att('optPalette', quote.palletRequired ? '1' : '0')
                    .att('DureValidite', ((_6 = quote.validityDuration) !== null && _6 !== void 0 ? _6 : 0).toString())
                    .att('dateEmission', dateEmission)
                    .att('DelaiEscompte', ((_7 = quote.discountDays) !== null && _7 !== void 0 ? _7 : 0).toString());
                console.log(`[XML DEBUG] Payment Logic - CustomText: '${quote.paymentCustomText}', TermCode: ${(_8 = quote.paymentTerm) === null || _8 === void 0 ? void 0 : _8.code}`);
                devis.att('ConditionPaiement', (quote.paymentCustomText && quote.paymentCustomText.trim() !== '') ? quote.paymentCustomText : ((((_9 = quote.client) === null || _9 === void 0 ? void 0 : _9.language) === 'en' ? (_10 = quote.paymentTerm) === null || _10 === void 0 ? void 0 : _10.label_en : (_11 = quote.paymentTerm) === null || _11 === void 0 ? void 0 : _11.label_fr) || this.generatePaymentTermLabel(((_12 = quote.paymentTerm) === null || _12 === void 0 ? void 0 : _12.code) || 0, (_13 = quote.paymentDays) !== null && _13 !== void 0 ? _13 : 0, (_14 = quote.depositPercentage) !== null && _14 !== void 0 ? _14 : 0, ((_15 = quote.client) === null || _15 === void 0 ? void 0 : _15.language) || 'fr', (_16 = quote.discountPercentage) !== null && _16 !== void 0 ? _16 : 0, (_17 = quote.discountDays) !== null && _17 !== void 0 ? _17 : 0) || ''))
                    // FIX: Priority = Local Code > 3. (If Mode 7 is selected, we want '7', even if text is present)
                    .att('ConditionPaiementInd', ((_19 = (_18 = quote.paymentTerm) === null || _18 === void 0 ? void 0 : _18.code) === null || _19 === void 0 ? void 0 : _19.toString()) || ((quote.paymentCustomText && quote.paymentCustomText.trim() !== '') ? '3' : ''))
                    .att('ConditionPaiementSaisie', quote.paymentCustomText || '');
                devis.ele('LOADING').att('nom', 'GRANITE DRC RAP').att('pays', 'CA').att('ville', 'Rivière-à-Pierre').att('region', 'CA-QC').att('adresse1', '475 Avenue Delisle').att('codepostal', 'G0A3A0').up();
                devis.ele('externe').att('devise', '').up();
                const qty = ((_20 = quote.project) === null || _20 === void 0 ? void 0 : _20.numberOfLines) || 0;
                const matUnit = (((_21 = quote.material) === null || _21 === void 0 ? void 0 : _21.unit) === 'sqft') ? 'pi3' : (((_22 = quote.material) === null || _22 === void 0 ? void 0 : _22.unit) === 'm2' ? 'm3' : (((_23 = quote.material) === null || _23 === void 0 ? void 0 : _23.unit) || ''));
                devis.ele('pierre')
                    .att('Poid', '175')
                    .att('prix', (((_24 = quote.material) === null || _24 === void 0 ? void 0 : _24.purchasePrice) || 0).toString())
                    .att('perte', ',4')
                    .att('unite', matUnit)
                    .att('devise', quote.currency || '')
                    .att('couleur', ((_25 = quote.material) === null || _25 === void 0 ? void 0 : _25.name) || '')
                    .att('qualite', ((_26 = quote.material) === null || _26 === void 0 ? void 0 : _26.quality) || '')
                    .att('quantite', qty.toString())
                    .att('unitePoid', 'lbs').up();
                root.ele('Fournisseurs').up();
                const xml = doc.end({ prettyPrint: false });
                // FIX: Replace content single quotes with typographic quotes to avoid breaking parser
                // Then convert attribute double quotes to single quotes
                return xml.replace(/'/g, '’').replace(/"/g, "'");
            }
            catch (e) {
                console.error(e);
                throw e;
            }
        });
    }
    generatePdfXml(quote, projectPath, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // PDF GENERATION RAK
            console.log('📄 GENERATING PDF RAK for:', filename);
            const doc = (0, xmlbuilder2_1.create)({ version: '1.0' });
            const now = new Date();
            const dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            doc.com(`Génération par DRC le ${dateStr}`);
            const root = doc.ele('generation').att('type', 'Soumission');
            // modele: Source file for the Agent to copy FROM. 
            // Agent logic: copies 'modele' -> to 'dirpdf'
            // So 'modele' must point to the existing file in the Project folder.
            // FIX: Force Windows Backslashes (Mac uses / by default with path.join)
            const fullSourcePath = path_1.default.join(projectPath, filename).replace(/\//g, '\\');
            // cible: The destination in the Project Folder (Standard storage)
            const ciblePath = `${projectPath}\\${filename}`.replace(/\//g, '\\');
            // Language
            const lang = (((_a = quote.client) === null || _a === void 0 ? void 0 : _a.language) && quote.client.language.toLowerCase().startsWith('en')) ? 'en' : 'fr';
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
        });
    }
    generateReintegrationXml(p, quoteId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Validation: Ensure P points to F:\nxerp (Excel)
            // XML is essentially a wrapper.
            const root = (0, xmlbuilder2_1.create)({ version: '1.0', encoding: 'UTF-8' })
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
        });
    }
    // Helper to format Country to 2 chars
    formatCountry(str) {
        if (!str)
            return '';
        const normalized = str.trim().toUpperCase();
        if (normalized === 'CANADA')
            return 'CA';
        if (normalized === 'USA' || normalized === 'UNITED STATES' || normalized === 'ETATS-UNIS')
            return 'US';
        return normalized.length === 2 ? normalized : normalized.substring(0, 2);
    }
    // Helper to format Province/State to 2 chars
    formatProvince(str) {
        if (!str)
            return '';
        const normalized = str.trim().toUpperCase();
        if (normalized === 'QUEBEC')
            return 'QC';
        if (normalized === 'ONTARIO')
            return 'ON';
        if (normalized === 'NEW BRUNSWICK' || normalized === 'NOUVEAU-BRUNSWICK')
            return 'NB';
        return normalized.length === 2 ? normalized : normalized.substring(0, 2);
    }
    generateDuplicateXml(quote, sourcePath, targetPath, originalReference) {
        return __awaiter(this, void 0, void 0, function* () {
            // "Recopier": Manual String Construction
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
            const now = new Date();
            const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
            const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ':');
            const materialName = ((_a = quote.material) === null || _a === void 0 ? void 0 : _a.name) || '';
            const client = quote.client || {};
            const contact = quote.contact || {};
            const escape = (str) => (str || '').replace(/'/g, "’");
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
            const safe = (s) => (s || '').replace(/[^a-zA-Z0-9-]/g, '_');
            // FULL FORMAT: Ref_Client_Project_Material
            const fullNewName = `${safe(quote.reference)}_${safe(client.name)}_${safe((_b = quote.project) === null || _b === void 0 ? void 0 : _b.name)}_${safe(materialName)}`;
            xml += ` definition='C:\\Travail\\XML\\CLAUTOMATERECOPIER.xml'`;
            xml += ` nouveauNom='${escape(quote.reference)}'`;
            xml += ` ancienCouleur='${escape(materialName)}'`;
            xml += ` ancienQualite='${escape(((_c = quote.material) === null || _c === void 0 ? void 0 : _c.quality) || '')}'`;
            xml += ` nouveauCouleur='${escape(materialName)}'`;
            xml += ` codeApplication='03'`;
            xml += ` nouvelleQualite='${escape(((_d = quote.material) === null || _d === void 0 ? void 0 : _d.quality) || '')}'>`;
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
            }
            else if (client.repName) {
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
                valIncotermInd = ((_e = quote.incotermRef) === null || _e === void 0 ? void 0 : _e.xmlCode) || '3';
            }
            else if (quote.incotermRef) {
                valIncoterm = quote.incotermRef.name || 'Ex-Works';
                valIncotermInd = quote.incotermRef.xmlCode || 'EXW';
                valIncotermS = ' ';
                if (quote.incotermRef.requiresText)
                    valIncoterm = 'Saisie';
            }
            // Dynamic Payment Terms
            const payLabel = (client.language === 'en' ? (_f = quote.paymentTerm) === null || _f === void 0 ? void 0 : _f.label_en : (_g = quote.paymentTerm) === null || _g === void 0 ? void 0 : _g.label_fr) ||
                this.generatePaymentTermLabel(((_h = quote.paymentTerm) === null || _h === void 0 ? void 0 : _h.code) || 0, (_j = quote.paymentDays) !== null && _j !== void 0 ? _j : 0, (_k = quote.depositPercentage) !== null && _k !== void 0 ? _k : 0, client.language || 'fr', (_l = quote.discountPercentage) !== null && _l !== void 0 ? _l : 0, (_m = quote.discountDays) !== null && _m !== void 0 ? _m : 0);
            xml += `<devis nom='${escape((_o = quote.project) === null || _o === void 0 ? void 0 : _o.name)}' numero='${escape(quote.reference)}' UC='CAD' Mesure='an' devise='${escape(quote.salesCurrency || quote.currency || '')}' Accompte='${this.formatDecimal(((_p = quote.depositPercentage) !== null && _p !== void 0 ? _p : 0) / 100)}' Escompte='${this.formatDecimal(((_q = quote.discountPercentage) !== null && _q !== void 0 ? _q : 0) / 100)}' Incoterm='${escape(valIncoterm)}' Paiement='${((_r = quote.paymentDays) !== null && _r !== void 0 ? _r : 0)}' delaiNbr='${quote.estimatedWeeks || ''}' emetteur='${r ? escape(r.firstName + ' ' + r.lastName) : ''}' IncotermS='${escape(valIncotermS)}' TauxChange='${this.formatDecimal(quote.exchangeRate || 1)}' IncotermInd='${escape(valIncotermInd)}' DureValidite='${(quote.validityDuration || 30)}' dateEmission='${dateEmission}' DelaiEscompte='${((_s = quote.discountDays) !== null && _s !== void 0 ? _s : 0)}' ConditionPaiement='${escape(payLabel)}' ConditionPaiementInd='${((_t = quote.paymentTerm) === null || _t === void 0 ? void 0 : _t.code) || ''}' ConditionPaiementSaisie='${escape(quote.paymentCustomText || '')}'>`;
            xml += `<LOADING nom='GRANITE DRC RAP' pays='CA' ville='Rivière-à-Pierre' region='CA-QC' adresse1='475 Avenue Delisle' regiondsp='Quebec' codepostal='G0A3A0' paysTraduit='Canada' abbreviation=''/>`;
            const matUnit = (((_u = quote.material) === null || _u === void 0 ? void 0 : _u.unit) === 'sqft') ? 'pi3' : (((_v = quote.material) === null || _v === void 0 ? void 0 : _v.unit) === 'm2' ? 'm3' : (((_w = quote.material) === null || _w === void 0 ? void 0 : _w.unit) || 'm3'));
            xml += `<pierre Poid='0' prix='${((_x = quote.material) === null || _x === void 0 ? void 0 : _x.purchasePrice) || 0}' perte='0' unite='${matUnit}' couleur='${escape(materialName)}' qualite='${escape(((_y = quote.material) === null || _y === void 0 ? void 0 : _y.quality) || '')}' quantite='${((_z = quote.project) === null || _z === void 0 ? void 0 : _z.numberOfLines) || 0}' unitePoid='lbs'/><externe devise=''/>`;
            xml += `</devis>`;
            xml += `<Fournisseurs/>`;
            xml += `</generation>`;
            return xml;
        });
    }
    parseExcelReturnXml(xmlContent) {
        var _a, _b, _c, _d;
        try {
            console.log('[XmlService] Parsing Return XML...');
            const doc = (0, xmlbuilder2_1.create)(xmlContent);
            const obj = doc.toObject();
            const devis = (_a = obj === null || obj === void 0 ? void 0 : obj.generation) === null || _a === void 0 ? void 0 : _a.devis;
            if (devis) {
                console.log(`[DEBUG] Devis Keys: ${Object.keys(devis).join(', ')}`);
                if (devis.externe)
                    console.log(`[DEBUG] Devis.externe Keys: ${Object.keys(devis.externe).join(', ')}`);
                if (devis.Externe)
                    console.log(`[DEBUG] Devis.Externe Keys: ${Object.keys(devis.Externe).join(', ')}`);
            }
            if (!devis) {
                console.warn('[XmlService] No <devis> tag found in XML.');
                return [];
            }
            // Target <externe><ligne> or <externe><Ligne>
            let lignes = ((_b = devis.externe) === null || _b === void 0 ? void 0 : _b.ligne) || ((_c = devis.externe) === null || _c === void 0 ? void 0 : _c.Ligne);
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
                if (devis)
                    console.log(`[XmlService] Devis keys: ${Object.keys(devis).join(', ')}`);
                return [];
            }
            if (!Array.isArray(lignes)) {
                lignes = [lignes];
            }
            const items = [];
            const parseNum = (val) => {
                if (!val)
                    return 0;
                if (typeof val === 'string')
                    return parseFloat(val.replace(',', '.').replace(/[^0-9.-]/g, ''));
                return Number(val);
            };
            lignes.forEach((p, index) => {
                if (index === 0)
                    console.log(`[XmlService] Line[0] Keys: ${Object.keys(p).join(', ')}`);
                // Robust case-insensitive attribute getter
                const getAtt = (target) => {
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
                    const v = (k) => `${k}=${getAtt(k)}`;
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
                const getFuzzyAtt = (targets) => {
                    const normalizedKeys = Object.keys(p).reduce((acc, k) => {
                        acc[k.toUpperCase().replace(/[^A-Z0-9]/g, '')] = k;
                        return acc;
                    }, {});
                    for (const t of targets) {
                        const normT = t.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        // Priority 1: Exact Fuzzy Match
                        if (normalizedKeys[normT])
                            return p[normalizedKeys[normT]];
                    }
                    // Priority 2: Standard getAtt fallback for non-normalized logic (e.g. existing logic)
                    for (const t of targets) {
                        const val = getAtt(t);
                        if (val !== undefined)
                            return val;
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
            const metaObj = (_d = obj === null || obj === void 0 ? void 0 : obj.generation) === null || _d === void 0 ? void 0 : _d.meta;
            let metadata = {};
            if (metaObj) {
                // xmlbuilder2 often prefixes attributes with @ in toObject()
                metadata = {
                    cible: metaObj['@cible'] || metaObj['cible']
                };
                console.log(`[XmlService] Parsed Metadata:`, metadata);
            }
            console.log(`[XmlService] Successfully parsed ${items.length} items and metadata.`);
            return { items, metadata };
        }
        catch (e) {
            console.error('[XmlService] Parsing Error:', e);
            return { items: [], metadata: {} };
        }
    }
}
exports.XmlService = XmlService;
