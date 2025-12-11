
import { create } from 'xmlbuilder2';

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

    generateQuoteXml(quote: any, rep?: any): string {
        try {
            // Based on "que-22712D6E8E48F13685258D59005E8500.xml"

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

            // Root Element
            const root = doc.ele('generation').att('type', 'Soumission');

            // Meta
            // Helper to safe name
            const safeName = (str: string | undefined) => (str || '').replace(/[^a-zA-Z0-9- ]/g, '');
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

            root.ele('meta')
                .att('cible', `F:\\nxerp\\${quote.project?.name || 'Projet'}\\${targetFilename}`)
                .att('Langue', 'fr')
                .att('action', 'emcot')
                .att('modele', 'H:\\Modeles\\Directe\\Modele de cotation defaut.xlsx')
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

            if (quote.items && quote.items.length > 0) {
                quote.items.forEach((item: any, index: number) => {
                    externe.ele('ligne')
                        .att('ID', item.id)
                        .att('Type', '')
                        .att('No', 'L' + (index + 1).toString())
                        .att('Ref', item.description || '')
                        .att('TAG', item.tag || (index + 1).toString())
                        .att('GRANITE', item.material || '')
                        .att('QTY', item.quantity?.toString() || '0')
                        .att('Item', 'step')
                        .att('Longeur', item.length?.toString().replace('.', ',') || '0')
                        .att('Largeur', item.width?.toString().replace('.', ',') || '0')
                        .att('Epaisseur', item.thickness?.toString().replace('.', ',') || '0')
                        .att('Description', item.description || '')
                        .att('Poid_Tot', (item.totalWeight || 0).toFixed(2).replace('.', ','))
                        .att('Prix_unitaire_interne', (item.unitPriceCad || item.unitPrice || 0).toFixed(2).replace('.', ','))
                        .att('Prix_unitaire_externe', (item.unitPriceUsd || item.unitPrice || 0).toFixed(2).replace('.', ','))
                        .att('Unité', item.unit ? '/ ' + item.unit : '/ ea')
                        .att('Prix_interne', (item.totalPriceCad || item.totalPrice || 0).toFixed(2).replace('.', ','))
                        .att('Prix_externe', (item.totalPriceUsd || item.totalPrice || 0).toFixed(2).replace('.', ','))
                        .up();
                });
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

    parseExcelReturnXml(xmlContent: string): any[] {
        try {
            const doc = create(xmlContent);
            const obj = doc.end({ format: 'object' }) as any;

            const root = obj.generation;
            if (!root) throw new Error("Invalid XML: missing root 'generation'");

            const devis = root.devis;
            if (!devis) throw new Error("Invalid XML: missing 'devis'");

            const externe = devis.externe;
            if (!externe) return [];

            let lignes = externe.ligne;
            if (!lignes) return [];

            if (!Array.isArray(lignes)) {
                lignes = [lignes];
            }

            const mappedItems = lignes.map((l: any) => {
                const parseFloatComma = (val: string | undefined): number => {
                    if (!val) return 0;
                    return parseFloat(val.toString().replace(',', '.'));
                };

                const get = (key: string) => l[`@${key}`] || l[key];
                const getVar = (...keys: string[]) => {
                    for (const k of keys) {
                        const v = get(k);
                        if (v !== undefined && v !== null && v !== '') return v;
                    }
                    return undefined;
                };

                let desc = getVar('Description');
                const itemLabel = getVar('Item');
                if (!desc || desc === 'A renseigner' || (itemLabel && itemLabel.length > desc.length)) {
                    if (itemLabel) desc = itemLabel;
                }

                let unitVal = getVar('Unité', 'Unit') || '';
                unitVal = unitVal.replace(/\/ \/ /g, '').replace(/\//g, '').trim();

                return {
                    tag: getVar('TAG', 'Tag', 'Ref Tag', 'No') || '',
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
                    totalPriceCad: parseFloatComma(getVar('Prix_interne', 'Total CDN$')),
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
            mappedItems.forEach((item: any) => {
                const existing = uniqueItems.get(item.tag);
                if (!existing) {
                    uniqueItems.set(item.tag, item);
                } else {
                    const currentScore = (item.netLength || 0) + (item.stoneValue || 0);
                    const existingScore = (existing.netLength || 0) + (existing.stoneValue || 0);
                    if (currentScore > existingScore) {
                        uniqueItems.set(item.tag, item);
                    }
                }
            });

            return Array.from(uniqueItems.values());

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
