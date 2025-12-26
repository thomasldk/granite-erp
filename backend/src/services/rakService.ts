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

export const generateDeliveryNoteRak = async (note: any): Promise<string> => {
    // Generate Timestamp
    const now = new Date();
    const timestamp = formatDate(now, "dd-MM-yyyy HH:mm");
    const dateEmission = formatDate(new Date(), "yyyyMMdd");

    // Construct Filename for Target (meta cible)
    // H:\BL\CLIENT_NAME\BL-XXXX.xlsx
    const clientName = note.client.name.toUpperCase();
    const blRef = note.reference; // BL-25-0356
    const targetPath = `F:\\BL\\${clientName}\\${blRef} ${formatDate(now, "MMM d, yyyy")}.xlsx`;

    // Calculate Totals
    // XML structure uses a flat list of lines.
    // We iterate over note.items (DeliveryNoteItems -> Pallet) -> pallet.items (PalletItems -> QuoteItem)

    let linesXml = "";
    let totalPallets = note.items.length;

    // Flatten items
    for (const item of note.items) {
        const pallet = item.pallet;
        const palletRef = `P#${pallet.number?.toString().padStart(2, '0')}`; // For 'NuBT' or similar
        // 'crate' field in XML seems to involve WorkOrder/Prog?
        // Model: crate='134566b-1 / 001'
        // We can use pallet.barcode or similar.

        for (const pi of pallet.items) {
            const qi = pi.quoteItem;
            // Calculations
            const width = qi.width || 0;
            const length = qi.length || 0;
            const thickness = qi.thickness || 0;

            // Weight logic: (TotalWeight / QtyLine) * QtyPallet
            const unitWeight = (qi.quantity && qi.quantity > 0) ? (qi.totalWeight / qi.quantity) : 0;
            const lineWeight = unitWeight * pi.quantity;

            // Volume (similar logic if needed, or just 0)
            const unitVol = (qi.quantity && qi.quantity > 0) ? (qi.netVolume / qi.quantity) : 0;
            const lineVol = unitVol * pi.quantity;

            // Price (Unit Price External)
            const unitPrice = qi.unitPrice || 0;
            const totalPrice = unitPrice * pi.quantity;

            // Mapping Fields to XML Attributes
            // Note: XML attributes are case sensitive. Model uses: No, MEP, QTÉ, Ref, TAG, ITEM, NuBT...
            // I will strictly follow the casing in the model.

            // MEP (Mise en Prod) - use Date Issued or Now? Model uses specific dates. I'll use Now for safety if not mapped.
            const mepDate = qi.quote?.updatedAt ? new Date(qi.quote.updatedAt) : new Date();

            linesXml += `<ligne No='L${qi.lineNo || 1}' MEP='${formatDate(mepDate, "yyyy-MM-dd")}' QTÉ='${pi.quantity}' Ref='${qi.refReference || qi.quote?.reference}' TAG='${qi.tag || ''}' ITEM='${qi.product || qi.description}' NuBT='${pallet.barcode || palletRef}' PROG='${pallet.workOrder?.orderNumber || ''}' Site='GRANITE DRC RAP' Unité='/ ea' crate='${palletRef} / ${pallet.barcode}' Requis='??' mesure='an' GRANITE='${qi.material}' Largeur='${width}' Longeur='${length}' Vol_Tot='${lineVol.toFixed(2).replace('.', ',')}' Long.net='${qi.length || 0}' Poid_Tot='${lineWeight.toFixed(1).replace('.', ',')}' Epaisseur='${thickness}' LargeurBrut='${width}' Surface_net='${qi.netArea || 0}' LongueurBrut='${length}' Prix_externe='${totalPrice.toFixed(2).replace('.', ',')}' Prix_interne='${totalPrice.toFixed(2).replace('.', ',')}' Prix_unitaire_externe='${unitPrice.toFixed(1).replace('.', ',')}' Prix_unitaire_interne='${unitPrice.toFixed(1).replace('.', ',')}'/>`;
        }
    }

    const xml = `<?xml version='1.0'?>
<!--Génération par DRC le ${timestamp}-->
<generation type='Soumission'><meta cible='${targetPath}' print='' Langue='en' action='GénérationBL' dirpdf='C:\\Lotus\\Domino\\data\\domino\\html\\erp\\drc\\pdf\\' modele='H:\\Modeles\\Directe\\Modèle BL defaut.xlsx' source='' appCode='03' journal='' socLangue='en' codeModule='07' definition='C:\\Travail\\XML\\CLAUTOMATEBL.xml' imprimante='' codeApplication='03'/><BL Devise='${note.client.defaultCurrency || 'CAD'}' Export='1' FretIn='1' FretPx='0' Langue='en' numero='${note.reference.replace('BL-', '')}' projet='${note.items[0]?.pallet?.workOrder?.quote?.project?.name || ''}' Incodsp='Entry' TaxesIn='0' TaxesPx='0' Incoterm='' IncotermS='${note.client.incoterm || ''}' CourtageIn='1' CourtagePx='0' NbrPalette='${totalPallets}' FraisDouane='1' IncotermInd='3' BorderToDest='0' FretToBorder='0' Transporteur='${note.carrier || ''}' dateEmission='${dateEmission}' Devise_interne='CAD' LiensFinancier='0'><client IRS='${note.client.taxId || ''}' pays='${note.deliveryAddress ? 'US' : 'CA'}' ville='${note.deliveryAddress || ''}' region='${note.deliveryAddress || ''}' adresse1='${note.deliveryAddress || ''}' nomClient='${note.client.name.replace(/&/g, '&amp;')}' codepostal='' abbreviation=''><contact cel='${note.siteContactPhone || ''}' fax='' nom='${note.siteContactName || ''}' tel='' mail='${note.siteContactEmail || ''}' prenom=''/></client><EXPORT nom='GRANITE DRC inc.' pays='CA' ville='RIVIÈRE-À-PIERRE' region='CA-QC' adresse1='475' codepostal='GOA-3AO' paysTraduit='CA' abbreviation=''/><LOADING nom='GRANITE DRC RAP' pays='CA' ville='Rivière-à-Pierre' region='CA-QC' adresse1='475 Avenue Delisle' regiondsp='Quebec' codepostal='G0A3A0' paysTraduit='Canada' abbreviation=''/><BROKER BrokerUse='1' SocieteNom='A.N. DERINGER INC.'><contact cel='' fax='' nom='-' tel='' mail='' prenom='-'/></BROKER><lignes>${linesXml}</lignes><resultat flag=''/></BL></generation>`;

    return xml;
};
