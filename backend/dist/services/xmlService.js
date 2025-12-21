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
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlService = void 0;
const xmlbuilder2_1 = require("xmlbuilder2");
class XmlService {
    fmtPhone(v) {
        if (!v)
            return '';
        const d = v.replace(/[^\d]/g, '');
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
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18;
            try {
                console.log('🚨 XML GEN V7 (INCOTERM DYNAMIC) ');
                console.log('--- DEBUG DATA ---');
                console.log('Quote ID:', quote.id);
                if (revisionData)
                    console.log('REVISION MODE DETECTED:', revisionData);
                // ... (keeping debug logs)
                const doc = (0, xmlbuilder2_1.create)({ version: '1.0' });
                const now = new Date();
                const dateStr = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}`;
                const dateEmission = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
                doc.com(`Génération par DRC le ${dateStr}`);
                const root = doc.ele('generation').att('type', 'Soumission');
                let meta = root.ele('meta');
                // Default Values (EMCOT)
                const excelTargetBase = 'F:\\nxerp';
                const safe = (s) => (s || '').replace(/[^a-zA-Z0-9-]/g, '_');
                const filename = `${safe(quote.reference)}_${safe((_a = quote.client) === null || _a === void 0 ? void 0 : _a.name)}_${safe((_b = quote.project) === null || _b === void 0 ? void 0 : _b.name)}_${safe((_c = quote.material) === null || _c === void 0 ? void 0 : _c.name)}.xlsx`;
                const defaultFullPath = `${excelTargetBase}\\${((_d = quote.project) === null || _d === void 0 ? void 0 : _d.name) || 'Projet'}\\${filename}`;
                if (revisionData) {
                    // REVISION MODE
                    meta.att('cible', revisionData.cible)
                        .att('Langue', ((_e = quote.client) === null || _e === void 0 ? void 0 : _e.language) || 'fr')
                        .att('action', 'reviser')
                        .att('modele', revisionData.cible) // Modele = Cible for Revision
                        .att('appCode', '03').att('journal', '').att('socLangue', ((_f = quote.client) === null || _f === void 0 ? void 0 : _f.language) || 'fr').att('codeModule', '01')
                        .att('definition', 'C:\\Travail\\XML\\CLAUTOMATEREVISION.xml')
                        .att('ancienNom', revisionData.ancienNom)
                        .att('nouveauNom', revisionData.nouveauNom)
                        .att('ancienCouleur', revisionData.ancienCouleur)
                        .att('nouveauCouleur', revisionData.nouveauCouleur)
                        .att('ancienQualite', revisionData.ancienQualite || '') // Optional
                        .att('nouveauQualite', revisionData.nouveauQualite || '')
                        .att('codeApplication', '03'); // Ensure this matches sample
                    if (revisionData.nouvelleQualite)
                        meta.att('nouvelleQualite', revisionData.nouvelleQualite);
                }
                else {
                    // STANDARD MODE (EMCOT)
                    meta.att('cible', defaultFullPath)
                        .att('Langue', ((_g = quote.client) === null || _g === void 0 ? void 0 : _g.language) || 'fr')
                        .att('action', 'emcot')
                        .att('modele', 'H:\\Modeles\\Directe\\Modele de cotation defaut.xlsx')
                        .att('definition', 'C:\\Travail\\XML\\CLAUTOMATEEMISSIONCOTATION.xml')
                        .att('appCode', '03').att('journal', '').att('socLangue', ((_h = quote.client) === null || _h === void 0 ? void 0 : _h.language) || 'fr').att('codeModule', '01').att('codeApplication', '03');
                }
                meta.ele('resultat').att('flag', '').up();
                const cli = root.ele('client')
                    .att('nom', ((_j = quote.client) === null || _j === void 0 ? void 0 : _j.name) || '')
                    .att('pays', 'CA')
                    .att('ville', ((_m = (_l = (_k = quote.client) === null || _k === void 0 ? void 0 : _k.addresses) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.city) || '')
                    .att('langue', 'fr')
                    .att('region', 'CA-QC')
                    .att('adresse1', ((_q = (_p = (_o = quote.client) === null || _o === void 0 ? void 0 : _o.addresses) === null || _p === void 0 ? void 0 : _p[0]) === null || _q === void 0 ? void 0 : _q.line1) || '')
                    .att('codepostal', ((_t = (_s = (_r = quote.client) === null || _r === void 0 ? void 0 : _r.addresses) === null || _s === void 0 ? void 0 : _s[0]) === null || _t === void 0 ? void 0 : _t.zipCode) || '');
                const contacts = cli.ele('contacts');
                const targetContact = quote.contact || (((_u = quote.client) === null || _u === void 0 ? void 0 : _u.contacts) && quote.client.contacts[0]);
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
                    }
                    else {
                        // Standard logic (EXW, FOB)
                        valIncoterm = quote.incotermRef.name || 'Ex-Works';
                        valIncotermS = ' ';
                    }
                }
                else {
                    // FALLBACK to Legacy String if no relation
                    // Try to guess from string
                    const leg = (quote.incoterm || '').toUpperCase();
                    if (leg.includes('FOB')) {
                        valIncoterm = 'FOB';
                        valIncotermInd = 'FOB';
                    }
                }
                const mesureCode = this.getMesureCode(((_v = quote.project) === null || _v === void 0 ? void 0 : _v.measurementSystem) || ((_w = quote.client) === null || _w === void 0 ? void 0 : _w.unitSystem));
                const devis = root.ele('devis')
                    .att('UC', 'CAD')
                    .att('nom', ((_x = quote.project) === null || _x === void 0 ? void 0 : _x.name) || 'Projet')
                    .att('Mesure', mesureCode)
                    .att('TxSemi', (quote.semiStandardRate || 0.4).toString().replace('.', ','))
                    .att('devise', quote.salesCurrency || quote.currency || 'CAD')
                    .att('numero', quote.reference || '')
                    .att('CratePU', (quote.palletPrice || 50).toString().replace('.', ','))
                    .att('Accompte', (((_y = quote.depositPercentage) !== null && _y !== void 0 ? _y : 30) / 100).toString().replace('.', ',')) // V8
                    .att('Escompte', (((_z = quote.discountPercentage) !== null && _z !== void 0 ? _z : 0) / 100).toString().replace('.', ',')) // V8
                    .att('Incoterm', valIncoterm)
                    .att('IncotermS', valIncotermS)
                    .att('IncotermInd', valIncotermInd)
                    .att('Paiement', ((_0 = quote.paymentDays) !== null && _0 !== void 0 ? _0 : 30).toString()) // V8
                    .att('delaiNbr', (quote.estimatedWeeks || '3').toString())
                    .att('emetteur', 'Thomas Leguen') // TODO: Dynamic User
                    .att('valideur', '')
                    .att('Complexite', 'Spécifique')
                    .att('TauxChange', (quote.exchangeRate || 1).toString().replace('.', ',')) // V8
                    .att('optPalette', quote.palletRequired ? '1' : '0')
                    .att('DureValidite', ((_1 = quote.validityDuration) !== null && _1 !== void 0 ? _1 : 30).toString())
                    .att('dateEmission', dateEmission)
                    .att('DelaiEscompte', ((_2 = quote.discountDays) !== null && _2 !== void 0 ? _2 : 0).toString()) // V8
                    .att('ConditionPaiement', ((((_3 = quote.client) === null || _3 === void 0 ? void 0 : _3.language) === 'en' ? (_4 = quote.paymentTerm) === null || _4 === void 0 ? void 0 : _4.label_en : (_5 = quote.paymentTerm) === null || _5 === void 0 ? void 0 : _5.label_fr) || this.generatePaymentTermLabel(((_6 = quote.paymentTerm) === null || _6 === void 0 ? void 0 : _6.code) || 1, (_7 = quote.paymentDays) !== null && _7 !== void 0 ? _7 : 30, (_8 = quote.depositPercentage) !== null && _8 !== void 0 ? _8 : 0, ((_9 = quote.client) === null || _9 === void 0 ? void 0 : _9.language) || 'fr', (_10 = quote.discountPercentage) !== null && _10 !== void 0 ? _10 : 0, (_11 = quote.discountDays) !== null && _11 !== void 0 ? _11 : 0)))
                    .att('ConditionPaiementInd', ((_13 = (_12 = quote.paymentTerm) === null || _12 === void 0 ? void 0 : _12.code) === null || _13 === void 0 ? void 0 : _13.toString()) || '1') // V8 Code
                    .att('ConditionPaiementSaisie', quote.paymentCustomText || ''); // V8
                devis.ele('LOADING').att('nom', 'GRANITE DRC RAP').att('pays', 'CA').att('ville', 'Rivière-à-Pierre').att('region', 'CA-QC').att('adresse1', '475 Avenue Delisle').att('codepostal', 'G0A3A0').up();
                devis.ele('externe').att('devise', '').up();
                const qty = ((_14 = quote.project) === null || _14 === void 0 ? void 0 : _14.numberOfLines) || 4;
                devis.ele('pierre')
                    .att('Poid', '175')
                    .att('prix', (((_15 = quote.material) === null || _15 === void 0 ? void 0 : _15.purchasePrice) || 750).toString())
                    .att('perte', ',4')
                    .att('unite', ((_16 = quote.material) === null || _16 === void 0 ? void 0 : _16.unit) || 'm3')
                    .att('devise', quote.currency || 'CAD')
                    .att('couleur', ((_17 = quote.material) === null || _17 === void 0 ? void 0 : _17.name) || 'Ash')
                    .att('qualite', ((_18 = quote.material) === null || _18 === void 0 ? void 0 : _18.quality) || 'S')
                    .att('quantite', qty.toString())
                    .att('unitePoid', 'lbs').up();
                root.ele('Fournisseurs').up();
                const xml = doc.end({ prettyPrint: false });
                return xml.replace(/"/g, "'");
            }
            catch (e) {
                console.error(e);
                throw e;
            }
        });
    }
    generateReintegrationXml(p) {
        return __awaiter(this, void 0, void 0, function* () {
            // Implementation based on User Example (v7 Reintegration)
            // Action: Integrates the Excel file content back into XML return
            const root = (0, xmlbuilder2_1.create)({ version: '1.0', encoding: 'UTF-8' })
                .ele('generation', { type: 'Soumission' });
            root.ele('meta')
                .att('cible', p)
                .att('Langue', 'en') // Matches user example
                .att('action', 'reintegrer')
                .att('modele', p)
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
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            const now = new Date();
            const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
            const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ':');
            const materialName = ((_a = quote.material) === null || _a === void 0 ? void 0 : _a.name) || '';
            const client = quote.client || {};
            const contact = quote.contact || {};
            const escape = (str) => (str || '').replace(/'/g, "&apos;");
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
            xml += ` ancienQualite='${escape(((_b = quote.material) === null || _b === void 0 ? void 0 : _b.quality) || '')}'`;
            xml += ` nouveauCouleur='${escape(materialName)}'`;
            xml += ` codeApplication='03'`;
            xml += ` nouvelleQualite='${escape(((_c = quote.material) === null || _c === void 0 ? void 0 : _c.quality) || '')}'>`;
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
            const matUnit = (((_d = quote.material) === null || _d === void 0 ? void 0 : _d.unit) === 'sqft') ? 'pi3' : (((_e = quote.material) === null || _e === void 0 ? void 0 : _e.unit) === 'm2' ? 'm3' : (((_f = quote.material) === null || _f === void 0 ? void 0 : _f.unit) || 'm3'));
            xml += `<pierre Poid='0' prix='${((_g = quote.material) === null || _g === void 0 ? void 0 : _g.purchasePrice) || 0}' perte='0' unite='${matUnit}' couleur='${escape(materialName)}' qualite='${escape(((_h = quote.material) === null || _h === void 0 ? void 0 : _h.quality) || '')}' quantite='${((_j = quote.project) === null || _j === void 0 ? void 0 : _j.numberOfLines) || 0}' unitePoid='lbs'/><externe devise=''/>`;
            xml += `</devis>`;
            xml += `<Fournisseurs/>`;
            xml += `</generation>`;
            return xml;
        });
    }
    parseExcelReturnXml(xmlContent) {
        var _a, _b;
        try {
            console.log('[XmlService] Parsing Return XML...');
            const doc = (0, xmlbuilder2_1.create)(xmlContent);
            const obj = doc.toObject();
            const devis = (_a = obj === null || obj === void 0 ? void 0 : obj.generation) === null || _a === void 0 ? void 0 : _a.devis;
            if (!devis) {
                console.warn('[XmlService] No <devis> tag found in XML.');
                return [];
            }
            // Target <externe><ligne>
            let lignes = (_b = devis.externe) === null || _b === void 0 ? void 0 : _b.ligne;
            // Fallback to <pierre> if <ligne> not found (legacy/robustness)
            if (!lignes) {
                console.log('[XmlService] No <externe><ligne> found. Check <pierre>...');
                lignes = devis.pierre;
            }
            if (!lignes) {
                console.warn('[XmlService] No lines found (checked <externe><ligne> and <pierre>).');
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
                // Helper to get attribute case-insensitive (handle @ prefix or direct)
                const getAtt = (k) => p[`@${k}`] || p[`@${k.toLowerCase()}`] || p[`@${k.toUpperCase()}`] || p[k] || p[k.toLowerCase()] || p[k.toUpperCase()];
                // Mapping based on "16:20" XML
                const item = {
                    tag: getAtt('TAG') || getAtt('tag') || 'Ligne',
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
                console.log(`[XmlService] CHECK -> Item 1: ScP=${i.primarySawingCost}, ScS=${i.secondarySawingCost}, UnitTime=${i.unitTime}, PriceInt=${i.unitPriceInternal}, TotalInt=${i.totalPriceInternal}`);
            }
            console.log(`[XmlService] Successfully parsed ${items.length} items.`);
            return items;
        }
        catch (e) {
            console.error('[XmlService] Parsing Error:', e);
            return [];
        }
    }
}
exports.XmlService = XmlService;
