const formatDate = (date: Date, fmt: string) => {
    const d = date;
    const pad = (n: number) => n.toString().padStart(2, '0');

    if (fmt === "dd-MM-yyyy HH:mm") {
        return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    if (fmt === "yyyyMMdd") {
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    }
    if (fmt === "yyyy-MM-dd") {
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }
    if (fmt === "MMM d, yyyy") {
        // e.g. Dec 26, 2025. 
        // fallback if locale not available or node issue? usually fine in node.
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
    return d.toISOString();
};

// Helper to escape XML special characters
const escapeXml = (unsafe: string | null | undefined): string => {
    if (!unsafe) return "";
    return unsafe.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

export const generateDeliveryNoteRak = async (note: any): Promise<string> => {
    // Generate Timestamp
    const now = new Date();
    const timestamp = formatDate(now, "dd-MM-yyyy HH:mm");
    const dateEmission = formatDate(new Date(), "yyyyMMdd");

    // Construct Filename for Target (meta cible)
    // Construct Filename for Target (meta cible)
    const clientNameRaw = note.client?.name || 'UNKNOWN_CLIENT';
    const clientName = clientNameRaw.replace(/[^a-zA-Z0-9 _-]/g, '_'); // Directory name (keep simple, mixed case)

    // Filename Components
    const fClient = clientNameRaw.replace(/[^a-zA-Z0-9 _-]/g, ''); // Client
    const fRef = (note.reference || 'BL-XXXX').replace(/[^a-zA-Z0-9 _-]/g, ''); // BL Number

    // Project Name (Safely retrieve from ANY item)
    // Project Name (Safely retrieve from ANY item)
    let projectRaw = 'no_project';
    if (note.items && note.items.length > 0) {
        for (const item of note.items) {
            // Priority 1: WorkOrder Path (Canonical)
            const pName1 = item.pallet?.workOrder?.quote?.project?.name;
            if (pName1) {
                projectRaw = pName1;
                break;
            }

            // Priority 2: QuoteItem Path (Fallback if WorkOrder link issues)
            // item.pallet.items[] -> quoteItem -> quote -> project
            if (item.pallet?.items && item.pallet.items.length > 0) {
                const qiProject = item.pallet.items[0]?.quoteItem?.quote?.project?.name;
                if (qiProject) {
                    projectRaw = qiProject;
                    console.log(`[RAK] Recovered project name from QuoteItem path: ${qiProject}`);
                    break;
                }
            }
        }
    }

    if (projectRaw === 'no_project') {
        console.warn(`[RAK] Warning: Could not find project name for BL ${note.reference}. Items: ${note.items?.length}`);
        // Consider failing? No, better to generate file than crash.
    }

    const fProject = projectRaw.replace(/[^a-zA-Z0-9 _-]/g, '');

    const fDate = formatDate(now, "yyyy-MM-dd"); // Emission Date

    // Format: Client_BL_Project_Date
    const filename = `${fClient}_${fRef}_${fProject}_${fDate}.xlsx`;

    // Target Path: F:\BL\ClientFolder\Client_BL_Project_Date.xlsx
    const targetPath = `F:\\BL\\${clientName}\\${filename}`;

    // Calculate Totals
    const items = note.items || [];
    let linesXml = "";
    let totalPallets = items.length;

    // Flatten items
    for (const item of items) {
        const pallet = item.pallet;
        if (!pallet) continue; // Skip if pallet missing

        const palletRef = `P#${(pallet.number || 0).toString().padStart(2, '0')}`;
        // 'crate' field in XML seems to involve WorkOrder/Prog?

        const palletItems = pallet.items || [];
        for (const pi of palletItems) {
            const qi = pi.quoteItem;
            if (!qi) continue;

            // Calculations
            const width = qi.width || 0;
            const length = qi.length || 0;
            const thickness = qi.thickness || 0;

            const unitWeight = (qi.quantity && qi.quantity > 0) ? (qi.totalWeight / qi.quantity) : 0;
            const lineWeight = unitWeight * pi.quantity;

            const unitVol = (qi.quantity && qi.quantity > 0) ? (qi.netVolume / qi.quantity) : 0;
            const lineVol = unitVol * pi.quantity;

            const unitPrice = qi.unitPrice || 0;
            const totalPrice = unitPrice * pi.quantity;

            // MEP
            const mepDate = qi.quote?.updatedAt ? new Date(qi.quote.updatedAt) : new Date();

            linesXml += `<ligne No='L${qi.lineNo || 1}' MEP='${formatDate(mepDate, "yyyy-MM-dd")}' QTÉ='${pi.quantity}' Ref='${escapeXml(qi.refReference || qi.quote?.reference)}' TAG='${escapeXml(qi.tag)}' ITEM='${escapeXml(qi.product || qi.description)}' NuBT='${escapeXml(pallet.barcode || palletRef)}' PROG='${escapeXml(pallet.workOrder?.orderNumber || pallet.workOrder?.reference)}' Site='GRANITE DRC RAP' Unité='/ ea' crate='${escapeXml(palletRef + ' / ' + (pallet.barcode || ''))}' Requis='??' mesure='an' GRANITE='${escapeXml(qi.material)}' Largeur='${width}' Longeur='${length}' Vol_Tot='${lineVol.toFixed(2).replace('.', ',')}' Long.net='${qi.length || 0}' Poid_Tot='${lineWeight.toFixed(1).replace('.', ',')}' Epaisseur='${thickness}' LargeurBrut='${width}' Surface_net='${qi.netArea || 0}' LongueurBrut='${length}' Prix_externe='${totalPrice.toFixed(2).replace('.', ',')}' Prix_interne='${totalPrice.toFixed(2).replace('.', ',')}' Prix_unitaire_externe='${unitPrice.toFixed(1).replace('.', ',')}' Prix_unitaire_interne='${unitPrice.toFixed(1).replace('.', ',')}'/>`;
        }
    }

    // 1. Client Office Information (Bureau)
    // 1. Client Office Information (Bureau)
    // Find Office/Main address (Prioritize Main/Office/Bureau, then fallback to anything NOT Delivery/Chantier)
    const clientAddress = note.client?.addresses?.find((a: any) => ['Main', 'Office', 'Bureau', 'Billing'].includes(a.type))
        || note.client?.addresses?.find((a: any) => !['Delivery', 'Chantier'].includes(a.type)) // Fallback to any non-delivery
        || note.client?.addresses?.[0] // Absolute fallback
        || {};
    // Find Primary Contact for Client Office
    // PRIORITY: Quote Contact (Manager for this specific project) -> Client Contact -> First Client Contact
    const quoteContact = note.items?.[0]?.pallet?.workOrder?.quote?.contact;
    const clientContact = quoteContact || note.client?.contacts?.[0] || {};

    // Find Client Phone from contact or client fallback
    const clientPhone = clientContact.phone || note.client?.phone || '';

    // 2. Delivery Information (Chantier)
    // Parse unstructured delivery address from Note
    // Parse unstructured delivery address from Note
    const rawAddr = note.deliveryAddress || '';
    const addrLines = rawAddr.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0);

    // Heuristic Parsing
    const livAdresse1 = addrLines[0] || '';
    let livVille = '', livRegion = '', livCodePostal = '', livPays = 'CA'; // Default to CA

    if (addrLines.length > 1) {
        // 1. Detect Country (Last Line)
        const last = addrLines[addrLines.length - 1].trim().toUpperCase();
        if (['US', 'USA', 'UNITED STATES', 'ÉTATS-UNIS'].includes(last)) {
            livPays = 'US';
        } else if (['CA', 'CANADA', 'CAN'].includes(last)) {
            livPays = 'CA';
        }

        // 2. Parse City/State/Zip (Second to Last Line usually)
        // Format from Frontend: "City, State Zip"
        let midLine = '';
        if (addrLines.length >= 3) {
            midLine = addrLines[addrLines.length - 2]; // Line before Country
        } else if (addrLines.length === 2 && !['US', 'USA', 'UNITED STATES', 'ÉTATS-UNIS', 'CA', 'CANADA', 'CAN'].includes(last)) {
            // If only 2 lines and last line is NOT country (rare, but possible if country omitted)
            midLine = last;
        } else if (addrLines.length === 2) {
            // 2 lines, last is Country. Line 1 is Address. Missing City/State line? 
            // Actually Frontend forces 3 lines if City/State exists.
            // If valid address, we expect: Line 1, Line 2 (City..), Line 3 (Country)
            // So addrLines[1] is midLine
            midLine = addrLines[1];
        }

        if (midLine) {
            // Extract ZIP first
            // CA Zip: A1A 1A1
            // US Zip: 12345 or 12345-1234
            const caZipRegex = /[A-Z]\d[A-Z]\s?\d[A-Z]\d/i;
            const usZipRegex = /\b\d{5}(?:-\d{4})?\b/;

            let zipMatch = midLine.match(caZipRegex);
            if (!zipMatch) zipMatch = midLine.match(usZipRegex);

            if (zipMatch) {
                livCodePostal = zipMatch[0].toUpperCase();
                // Remove Zip from line to parse City/State
                midLine = midLine.replace(zipMatch[0], '').trim();
            }

            // Split City / State by comma
            const parts = midLine.split(',');
            if (parts.length > 0) {
                livVille = parts[0].trim();
                // If there is a part after comma, it's state
                if (parts.length > 1) {
                    livRegion = parts[1].trim();
                } else if (!livRegion) {
                    // unexpected format "City State" without comma? 
                    // Attempt to take last word as state if small? tough.
                    // Assume whole thing is city if no comma
                }
            }
        }
    }

    const lang = note.client?.language === 'fr' ? 'fr' : 'en';
    const currency = note.client?.defaultCurrency || 'CAD';

    // Freight Logic
    const freightCost = note.freightCost || 0;
    const fretPx = freightCost > 0 ? freightCost.toFixed(0) : '0';
    const fretIn = freightCost > 0 ? '1' : ''; // Only set if cost exists? Or '0'? User said: "si aucun frais tu met pas cette mention" -> Empty string usually ignored or parsed as null.

    // Export Logic
    const exportVal = livPays === 'CA' ? '0' : '1';

    // Broker Logic
    const isCanadianClient = (clientAddress.country === 'Canada' || clientAddress.country === 'CA');
    const brokerUse = isCanadianClient ? '0' : '1';
    const brokerName = isCanadianClient ? '' : (note.client?.customsBroker?.name || 'A.N. DERINGER INC. ( ACCT # GRADRC0001)');

    // Broker Fee Logic (RAK)
    const brokerFee = note.customsBrokerFee || 0;
    const courtageIn = brokerFee > 0 ? '1' : '0'; // '1' if fee exists
    const courtagePx = brokerFee > 0 ? brokerFee.toFixed(2).replace('.', ',') : '0'; // Amount or '0'

    // Helper for Country Code
    const getCountryCode = (c: string) => {
        if (!c) return 'CA';
        const upper = c.toUpperCase();
        if (['US', 'USA', 'UNITED STATES', 'ÉTATS-UNIS'].includes(upper)) return 'US';
        return 'CA';
    };

    const clientCountryCode = getCountryCode(clientAddress.country);
    // Ensure Client Zip/City/State are clean
    const clientZip = clientAddress.zipCode || '';
    const clientCity = clientAddress.city || '';
    const clientState = clientAddress.state || '';
    const clientLine1 = clientAddress.line1 || '';

    const xml = `<?xml version='1.0'?>
<!--Génération par DRC le ${timestamp}-->
<generation type='Soumission'><meta cible='${escapeXml(targetPath)}' print='' Langue='${lang}' action='GénérationBL' dirpdf='C:\\Lotus\\Domino\\data\\domino\\html\\erp\\drc\\pdf\\' modele='H:\\Modeles\\Directe\\Modèle BL defaut.xlsx' source='' appCode='03' journal='' socLangue='${lang}' codeModule='07' definition='C:\\Travail\\XML\\CLAUTOMATEBL.xml' imprimante='' codeApplication='03'/><BL Devise='${escapeXml(currency)}' Export='${exportVal}' FretIn='${fretIn}' FretPx='${fretPx}' Langue='${lang}' numero='${escapeXml(note.reference.replace('BL-', ''))}' projet='${escapeXml(note.items?.[0]?.pallet?.workOrder?.quote?.project?.name || '')}' Incodsp='Entry' TaxesIn='0' TaxesPx='0' Incoterm='' IncotermS='${escapeXml(note.client?.incoterm || '')}' CourtageIn='${courtageIn}' CourtagePx='${courtagePx}' NbrPalette='${totalPallets}' FraisDouane='1' IncotermInd='3' BorderToDest='0' FretToBorder='0' Transporteur='${escapeXml(note.carrier || '')}' dateEmission='${dateEmission}' Devise_interne='CAD' LiensFinancier='0'>
<client IRS='${escapeXml(note.client?.taxId)}' pays='${escapeXml(clientCountryCode)}' ville='${escapeXml(clientCity)}' region='${escapeXml(clientState)}' adresse1='${escapeXml(clientLine1)}' nomClient='${escapeXml(note.client?.name)}' codepostal='${escapeXml(clientZip)}' abbreviation=''>
<contact cel='${escapeXml(clientContact.mobile)}' fax='${escapeXml(clientContact.fax)}' nom='${escapeXml(clientContact.lastName)}' tel='${escapeXml(clientContact.phone)}' mail='${escapeXml(clientContact.email)}' prenom='${escapeXml(clientContact.firstName)}'/>
</client>
<livraison pays='${escapeXml(livPays)}' ville='${escapeXml(livVille)}' region='${escapeXml(livRegion)}' adresse1='${escapeXml(livAdresse1)}' nomClient='${escapeXml(note.client?.name || '')}' codepostal='${escapeXml(livCodePostal)}' abbreviation='' livraisonCel='${escapeXml(note.siteContactPhone)}' livraisonFax='' livraisonNom='${escapeXml(note.siteContactName)}' livraisonTel=''/>
<EXPORT nom='GRANITE DRC inc.' pays='CA' ville='RIVIÈRE-À-PIERRE' region='CA-QC' adresse1='475' codepostal='GOA-3AO' paysTraduit='CA' abbreviation=''/><LOADING nom='GRANITE DRC RAP' pays='CA' ville='Rivière-à-Pierre' region='CA-QC' adresse1='475 Avenue Delisle' regiondsp='Quebec' codepostal='G0A3A0' paysTraduit='Canada' abbreviation=''/><BROKER BrokerUse='${brokerUse}' SocieteNom='${escapeXml(brokerName)}'><contact cel='' fax='' nom='-' tel='' mail='' prenom='-'/></BROKER><lignes>${linesXml}</lignes><resultat flag=''/></BL></generation>`;

    return xml;
};
