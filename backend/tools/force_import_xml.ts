
import { PrismaClient } from '@prisma/client';
import { XmlService } from '../src/services/xmlService';

const prisma = new PrismaClient();
const xmlService = new XmlService();

const quoteId = '233a6049-1fb5-4651-a1be-12b47b8e10db'; // DRC25-0015-C3R0

const xmlContent = `<?xml version="1.0"?>
<!--Génération par DRC le 12-12-2025 04:53-->
<generation type="Soumission"><meta cible="F:\\nxerp\\essai10\\DRC25-0015-C3R0_Architecture_Moderne_essai10_Caledonia.xlsx" Langue="fr" action="reintegrer" modele="F:\\nxerp\\essai10\\DRC25-0015-C3R0_Architecture_Moderne_essai10_Caledonia.xlsx" appCode="03" journal="" socLangue="fr" codeModule="01" definition="C:\\Travail\\XML\\CLAUTOMATEREINTEGRER.xml" codeApplication="03"><resultat flag=""/></meta><devis><externe devise="CAD" volume="296.333333333333" prix="30232.7" prixInterne="30232.7" poids="51858.3333333333" scPrimaire_Tot="552.160555555555" scSecondaire_Tot="321.25" profilage_tot="0" Finition_tot="0" Ancrage_tot="0" tempsTotal="65.3382314814815" PDF="C:\\Lotus\\Domino\\data\\domino\\html\\erp\\drc\\pdf\\DRC25-1283_C1R0_NORTHEAST MASONRY DISTRIBUTORS_T024620_Salt And Pepper.pdf" nbrLigne="8" TauxChange="1" Mesure="an"><ligne ID="" Type="" No="L1" Ref="" TAG="BB-01" GRANITE="Caledonia" QTY="7" Item="landing" Longeur="12" Largeur="12" Epaisseur="12" Description="polie" Long.net="7" Surface_net="7" Vol_Tot="7,0000" Poid_Tot="1225" Prix_unitaire_interne="159.8" Prix_unitaire_externe="159.8" Unité="/ ea" Prix_interne="1118.6" Prix_externe="1118.6" valeurPierre="55.5241" scPrimaire="5.35166666666667" scSecondaire="15" profilage="0" Finition="0" Ancrage="0" tempsUnitaire="0.339194444444444" tempsTotal="2.37436111111111"/><ligne ID="" Type="" No="L2" Ref="" TAG="015-2" GRANITE="Caledonia" QTY="7" Item="step" Longeur="96" Largeur="24" Epaisseur="7" Description="A renseigner" Long.net="56" Surface_net="112" Vol_Tot="65,3333" Poid_Tot="11433.333333" Prix_unitaire_interne="936.5" Prix_unitaire_externe="936.5" Unité="/ ea" Prix_interne="6555.5" Prix_externe="6555.5" valeurPierre="518.2247" scPrimaire="78.1155555555555" scSecondaire="43.75" profilage="0" Finition="0" Ancrage="0" tempsUnitaire="2.03109259259259" tempsTotal="14.2176481481481"/><ligne ID="" Type="" No="L3" Ref="" TAG="015-3" GRANITE="Caledonia" QTY="8" Item="step" Longeur="96" Largeur="24" Epaisseur="7" Description="A renseigner" Long.net="64" Surface_net="128" Vol_Tot="74,6667" Poid_Tot="13066.666667" Prix_unitaire_interne="937.9" Prix_unitaire_externe="937.9" Unité="/ ea" Prix_interne="7503.2" Prix_externe="7503.2" valeurPierre="518.2247" scPrimaire="78.1155555555555" scSecondaire="43.75" profilage="0" Finition="0" Ancrage="0" tempsUnitaire="2.03109259259259" tempsTotal="16.2487407407407"/><ligne ID="" Type="" No="L4" Ref="" TAG="015-4" GRANITE="Caledonia" QTY="7" Item="step" Longeur="96" Largeur="24" Epaisseur="7" Description="A renseigner" Long.net="56" Surface_net="112" Vol_Tot="65,3333" Poid_Tot="11433.333333" Prix_unitaire_interne="936.5" Prix_unitaire_externe="936.5" Unité="/ ea" Prix_interne="6555.5" Prix_externe="6555.5" valeurPierre="518.2247" scPrimaire="78.1155555555555" scSecondaire="43.75" profilage="0" Finition="0" Ancrage="0" tempsUnitaire="2.03109259259259" tempsTotal="14.2176481481481"/><ligne ID="" Type="" No="L5" Ref="" TAG="015-5" GRANITE="Caledonia" QTY="2" Item="step" Longeur="96" Largeur="24" Epaisseur="7" Description="A renseigner" Long.net="16" Surface_net="32" Vol_Tot="18,6667" Poid_Tot="3266.666667" Prix_unitaire_interne="947.2" Prix_unitaire_externe="947.2" Unité="/ ea" Prix_interne="1894.4" Prix_externe="1894.4" valeurPierre="518.2247" scPrimaire="78.1155555555555" scSecondaire="43.75" profilage="0" Finition="0" Ancrage="0" tempsUnitaire="2.03109259259259" tempsTotal="4.06218518518518"/><ligne ID="" Type="" No="L6" Ref="" TAG="015-6" GRANITE="Caledonia" QTY="2" Item="step" Longeur="96" Largeur="24" Epaisseur="7" Description="A renseigner" Long.net="16" Surface_net="32" Vol_Tot="18,6667" Poid_Tot="3266.666667" Prix_unitaire_interne="947.2" Prix_unitaire_externe="947.2" Unité="/ ea" Prix_interne="1894.4" Prix_externe="1894.4" valeurPierre="518.2247" scPrimaire="78.1155555555555" scSecondaire="43.75" profilage="0" Finition="0" Ancrage="0" tempsUnitaire="2.03109259259259" tempsTotal="4.06218518518518"/><ligne ID="" Type="" No="L7" Ref="" TAG="015-7" GRANITE="Caledonia" QTY="2" Item="step" Longeur="96" Largeur="24" Epaisseur="7" Description="A renseigner" Long.net="16" Surface_net="32" Vol_Tot="18,6667" Poid_Tot="3266.666667" Prix_unitaire_interne="947.2" Prix_unitaire_externe="947.2" Unité="/ ea" Prix_interne="1894.4" Prix_externe="1894.4" valeurPierre="518.2247" scPrimaire="78.1155555555555" scSecondaire="43.75" profilage="0" Finition="0" Ancrage="0" tempsUnitaire="2.03109259259259" tempsTotal="4.06218518518518"/><ligne ID="" Type="" No="L8" Ref="" TAG="015-8" GRANITE="Caledonia" QTY="3" Item="step" Longeur="96" Largeur="24" Epaisseur="7" Description="A renseigner" Long.net="24" Surface_net="48" Vol_Tot="28,0000" Poid_Tot="4900" Prix_unitaire_interne="938.9" Prix_unitaire_externe="938.9" Unité="/ ea" Prix_interne="2816.7" Prix_externe="2816.7" valeurPierre="518.2247" scPrimaire="78.1155555555555" scSecondaire="43.75" profilage="0" Finition="0" Ancrage="0" tempsUnitaire="2.03109259259259" tempsTotal="6.09327777777778"/></externe></devis></generation>`;

async function run() {
    try {
        console.log("Forcing Import for Quote:", quoteId);

        // 1. Parse
        const items = xmlService.parseExcelReturnXml(xmlContent);
        console.log(`Parsed ${items.length} items from XML.`);
        console.log("First item parsed:", items[0]);
        console.log("Second item parsed:", items[1]);

        // 2. Update DB
        if (items.length > 0) {
            await prisma.$transaction(async (tx) => {
                // Delete old
                await tx.quoteItem.deleteMany({ where: { quoteId } });
                console.log("Deleted old items.");

                // Create new
                await tx.quoteItem.createMany({
                    data: items.map(item => ({
                        quoteId: quoteId,
                        tag: item.tag,
                        description: item.description,
                        material: item.material,
                        quantity: item.quantity,
                        unit: item.unit,
                        length: item.length,
                        width: item.width,
                        thickness: item.thickness,
                        netLength: item.netLength,
                        netArea: item.netArea,
                        netVolume: item.netVolume,
                        totalWeight: item.totalWeight,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                        unitPriceCad: item.unitPriceCad,
                        totalPriceCad: item.totalPriceCad,
                        stoneValue: item.stoneValue,
                        primarySawingCost: item.primarySawingCost,
                        secondarySawingCost: item.secondarySawingCost,
                        profilingCost: item.profilingCost,
                        finishingCost: item.finishingCost,
                        anchoringCost: item.anchoringCost,
                        unitTime: item.unitTime,
                        totalTime: item.totalTime,
                        numHoles: 0,
                        numSlots: 0,
                    }))
                });
                console.log("Created new items.");

                // Update Quote Total & Status
                const totalAmount = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
                await tx.quote.update({
                    where: { id: quoteId },
                    data: {
                        totalAmount,
                        syncStatus: 'Calculated (Agent)'
                    }
                });
                console.log(`Quote updated. Status: Calculated (Agent). Total: ${totalAmount}`);
            });
        }

    } catch (e) {
        console.error("Error during force import:", e);
    } finally {
        await prisma.$disconnect();
    }
}

run();
