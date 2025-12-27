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
    const clientName = clientNameRaw.toUpperCase().replace(/[^A-Z0-9 _-]/g, '_'); // Directory name (keep simple)

    // Filename Components
    const fClient = clientNameRaw.replace(/[^a-zA-Z0-9 _-]/g, ''); // Client
    const fRef = (note.reference || 'BL-XXXX').replace(/[^a-zA-Z0-9 _-]/g, ''); // BL Number

    // Project Name (Safely retrieve from first item)
    const projectRaw = note.items?.[0]?.pallet?.workOrder?.quote?.project?.name || 'NO_PROJECT';
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
    // Find Billing/Main address
    const clientAddress = note.client?.addresses?.find((a: any) => a.type === 'Billing' || a.type === 'Bureau')
        || note.client?.addresses?.[0]
        || {};
    // Find Primary Contact for Client Office
    // PRIORITY: Quote Contact (Manager for this specific project) -> Client Contact -> First Client Contact
    const quoteContact = note.items?.[0]?.pallet?.workOrder?.quote?.contact;
    const clientContact = quoteContact || note.client?.contacts?.[0] || {};

    // Find Client Phone from contact or client fallback
    const clientPhone = clientContact.phone || note.client?.phone || '';

    // 2. Delivery Information (Chantier)
    // Parse unstructured delivery address from Note
    const rawAddr = note.deliveryAddress || '';
    const addrLines = rawAddr.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0);

    // Heuristic Parsing
    const livAdresse1 = addrLines[0] || '';
    let livVille = '', livRegion = '', livCodePostal = '', livPays = 'CA';

    // Try to parse City, Region Zip from last lines
    // Example: "Montreal, QC H1A 1A1" or "Montreal\nQC H1A 1A1"
    if (addrLines.length > 1) {
        // Check for Country in last line
        const last = addrLines[addrLines.length - 1];
        if (last.toUpperCase() === 'CANADA' || last.toUpperCase() === 'US' || last.toUpperCase() === 'USA') {
            livPays = last === 'CANADA' ? 'CA' : 'US';
            // If lines > 2, line before might be city/state
        }

        // Simple heuristic: If 2 lines, Line 2 is City/State/Zip
        // We will just put the rest in 'ville' if we can't parse or leave blank?
        // Better: Put raw address in adresse1 if valid, but user wants specific fields.
        // I will attempt to extract Zip Code (Regex)
        const zipRegex = /[A-Z]\d[A-Z]\s?\d[A-Z]\d/i; // Canadian Zip
        const foundZip = rawAddr.match(zipRegex);
        if (foundZip) livCodePostal = foundZip[0];

        // This is imperfect but better than nothing.
    }

    const lang = note.client?.language === 'fr' ? 'fr' : 'en';
    const currency = note.client?.defaultCurrency || 'CAD';

    const xml = `<?xml version='1.0'?>
<!--Génération par DRC le ${timestamp}-->
<generation type='Soumission'><meta cible='${escapeXml(targetPath)}' print='' Langue='${lang}' action='GénérationBL' dirpdf='C:\\Lotus\\Domino\\data\\domino\\html\\erp\\drc\\pdf\\' modele='H:\\Modeles\\Directe\\Modèle BL defaut.xlsx' source='' appCode='03' journal='' socLangue='${lang}' codeModule='07' definition='C:\\Travail\\XML\\CLAUTOMATEBL.xml' imprimante='' codeApplication='03'/><BL Devise='${escapeXml(currency)}' Export='1' FretIn='1' FretPx='0' Langue='${lang}' numero='${escapeXml(note.reference.replace('BL-', ''))}' projet='${escapeXml(note.items?.[0]?.pallet?.workOrder?.quote?.project?.name || '')}' Incodsp='Entry' TaxesIn='0' TaxesPx='0' Incoterm='' IncotermS='${escapeXml(note.client?.incoterm || '')}' CourtageIn='1' CourtagePx='0' NbrPalette='${totalPallets}' FraisDouane='1' IncotermInd='3' BorderToDest='0' FretToBorder='0' Transporteur='${escapeXml(note.carrier || '')}' dateEmission='${dateEmission}' Devise_interne='CAD' LiensFinancier='0'>
<client IRS='${escapeXml(note.client?.taxId)}' pays='${escapeXml(clientAddress.country === 'Canada' ? 'CA' : 'US')}' ville='${escapeXml(clientAddress.city)}' region='${escapeXml(clientAddress.state)}' adresse1='${escapeXml(clientAddress.line1)}' nomClient='${escapeXml(note.client?.name)}' codepostal='${escapeXml(clientAddress.zipCode)}' abbreviation=''>
<contact cel='${escapeXml(clientContact.mobile)}' fax='${escapeXml(clientContact.fax)}' nom='${escapeXml(clientContact.lastName)}' tel='${escapeXml(clientContact.phone)}' mail='${escapeXml(clientContact.email)}' prenom='${escapeXml(clientContact.firstName)}'/>
</client>
<livraison pays='${escapeXml(livPays)}' ville='${escapeXml(livVille)}' region='${escapeXml(livRegion)}' adresse1='${escapeXml(livAdresse1)}' nomClient='${escapeXml(note.items?.[0]?.pallet?.workOrder?.quote?.project?.name || '')}' codepostal='${escapeXml(livCodePostal)}' abbreviation='' livraisonCel='${escapeXml(note.siteContactPhone)}' livraisonFax='' livraisonNom='${escapeXml(note.siteContactName)}' livraisonTel=''/>
<EXPORT nom='GRANITE DRC inc.' pays='CA' ville='RIVIÈRE-À-PIERRE' region='CA-QC' adresse1='475' codepostal='GOA-3AO' paysTraduit='CA' abbreviation=''/><LOADING nom='GRANITE DRC RAP' pays='CA' ville='Rivière-à-Pierre' region='CA-QC' adresse1='475 Avenue Delisle' regiondsp='Quebec' codepostal='G0A3A0' paysTraduit='Canada' abbreviation=''/><BROKER BrokerUse='1' SocieteNom='A.N. DERINGER INC.'><contact cel='' fax='' nom='-' tel='' mail='' prenom='-'/></BROKER><lignes>${linesXml}</lignes><resultat flag=''/></BL></generation>`;

    return xml;
};
