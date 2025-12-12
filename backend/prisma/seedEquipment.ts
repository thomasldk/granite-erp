
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const csvData = `Site,No.Système,Nom,No.d'équipement,Catégorie,Site,No.Comptable,Fournisseur
Carrière 3,EQ-0042,compresseur Denver,602,Compresseur,CARRIÈRE CALÉDONIA 3,6348602
Carrière 3,EQ-0043,Génératrice Caterpillar 1999,603,Génératrice,CARRIÈRE CALÉDONIA 3,6348603
Carrière 3,EQ-0044,Compresseur John Deer,604,Compresseur,CARRIÈRE CALÉDONIA 3,6348604
Carrière 3,EQ-0045,Scie perfora,606,Scie à Cable Carrière,CARRIÈRE CALÉDONIA 3,6348606
Carrière 3,EQ-0046,Drilleuse "Down the hole",607,Drilleuse,CARRIÈRE CALÉDONIA 3,6348607
Carrière 3,EQ-0047,Drill Hydraulique explorer,611,Drilleuse,CARRIÈRE CALÉDONIA 3,6348611
Carrière 3,EQ-0048,Compresseur orange,612,Compresseur,CARRIÈRE CALÉDONIA 3,6348612
Carrière 3,EQ-0049,Génératrice 45-49 KVA (Multiquip),613,Génératrice,CARRIÈRE CALÉDONIA 3,6348613
Carrière 3,EQ-0050,Dresser 570 Komatsu (payloader),616,Chargeur,CARRIÈRE CALÉDONIA 3,6348616
Carrière 3,EQ-0051,Toyo1 (Marteau) 1998,621,Chargeur,CARRIÈRE CALÉDONIA 3,6348621
Carrière 3,EQ-0052,Compresseur portatif diesel 185 CFM,622,Compresseur,CARRIÈRE CALÉDONIA 3,6348622
Carrière 3,EQ-0053,Loader caterpillar 988-B 1979,623,Chargeur,CARRIÈRE CALÉDONIA 3,6348623
Carrière 3,EQ-0054,Loader caterpillar 988-B 1987,624,Chargeur,CARRIÈRE CALÉDONIA 3,6348624
Carrière 3,EQ-0055,Petite scie pour équarrir,626,Outillage de coupe,CARRIÈRE CALÉDONIA 3,6348626
Carrière 3,EQ-0056,Pelle Komatsu,628,Pelle,CARRIÈRE CALÉDONIA 3,6348628
Carrière 3,EQ-0080,down the hole drill (pneumatic & hydraulic),627,Drilleuse,CARRIÈRE CALÉDONIA 3,6348628
Garage,EQ-0038,Soudeuse Hobert 460,501,Soudeuse,GRANITE DRC RAP,4800360
Garage,EQ-0039,Soudeuse Lincoln 400,502,Soudeuse,GRANITE DRC RAP,4800360
Garage,EQ-0040,Soudeuse Hobert LN25,503,Soudeuse,GRANITE DRC RAP,4800360
Granite DRC RAP,EQ-0027,john Deer 544,400,Chargeur,GRANITE DRC RAP,4800400
Granite DRC RAP,EQ-0028,Inter SS 6 Roues 1987,401,Chargeur,GRANITE DRC RAP,4800401
Granite DRC RAP,EQ-0029,Caterpilar 988 Stanstead,402,Chargeur,GRANITE DRC RAP,6348402
Granite DRC RAP,EQ-0030,T-Rex TL160 (blanc),403,Chargeur,GRANITE DRC STD,4800403
Granite DRC RAP,EQ-0031,T-Rex TL260 (blanc2011),404,Chargeur,GRANITE DRC STD,4800404
Granite DRC RAP,EQ-0032,Ford F-150 (Daniel 2012),405,Automobile,GRANITE DRC RAP,4800405
Granite DRC RAP,EQ-0033,ford F-150 Gris Carl (2010),406,Automobile,GRANITE DRC RAP,4800406
Granite DRC RAP,EQ-0034,Ford F-150 DB Carr. (2012),407,Automobile,GRANITE DRC RAP,6348407
Granite DRC RAP,EQ-0035,Volvo 330,408,Chargeur,GRANITE DRC RAP,4800408
Granite DRC RAP,EQ-0081,GANTS 11168663,,Consommables,GRANITE DRC RAP,4220600
Granite DRC RAP,EQ-0082,VESTE NOIR COTON IGNIFUGE LINDE,,Consommables,GRANITE DRC RAP,4220600
Granite DRC RAP,EQ-0083,HABIT PLUIE EN POCHE 3PCS JAUNE,,Consommables,GRANITE DRC RAP,4220600
Granite DRC RAP,EQ-0084,GANT NITRILE SUR NYLON BLEU GR 9,,Consommables,GRANITE DRC RAP,4220600
Granite DRC RAP,EQ-0085,LUNETTES SECURITE CLAIRE FUMEE GS1000C,,Consommables,GRANITE DRC RAP,4220600
Granite DRC RAP,EQ-0086,LUNETTES SECURITE CLAIRE FUMEE GS1000C,,Consommables,GRANITE DRC RAP,4220600
Granite DRC RAP,EQ-0087,LUNETTES SECURITE FUMEE GS1000S,,Consommables,GRANITE DRC RAP,4220600
Granite DRC RAP,EQ-0088,LUNETTE SECURITE11169114 / #S3435X,,Consommables,GRANITE DRC RAP,4220600
Granite DRC RAP,EQ-0090,GANTS SOUDEURS SABLE FIL KEVLAR,,Consommables,GRANITE DRC RAP,4220600
Granite DRC RAP,EQ-0091,GANT CUIR FENDU ET COTON MANC. TG,,Consommables,GRANITE DRC RAP,4220600
Granite DRC RAP,EQ-0093,VESTE CIRCUL ORANGE POLYESTER CSA,,Consommables,GRANITE DRC RAP,4220600
Granite DRC RAP,EQ-0094,VESTE CIRCUL ORANGE POLYESTER CSA,,Consommables,GRANITE DRC RAP,4220600
Granite DRC RAP,EQ-0095,OXYGENE VRAC,,Consommables,GRANITE DRC RAP,4220500
Usine 1,EQ-0003,Scie Wilson 3|0 m,102,Scie circulaire,GRANITE DRC RAP,48000102,Wilson Industrial
Usine 1,EQ-0004,Barrière de sécurité 3.5,116,Barrière de sécuritée,GRANITE DRC RAP,4800101
Usine 1,EQ-0005,Barrière de sécurité 3.0,117,Barrière de sécuritée,GRANITE DRC RAP,4800102
Usine 1,EQ-0006,Pompe à eau usine 1,106,Pompe à eau,GRANITE DRC RAP,4800106
Usine 1,EQ-0007,Porte avant 3.5 m avant,109,Grande porte,GRANITE DRC RAP,4800700
Usine 1,EQ-0008,Porte avant 3.5 m arrière,110,Grande porte,GRANITE DRC RAP,4800700
Usine 1,EQ-0009,Porte avant 3.0 m avant,111,Grande porte,GRANITE DRC RAP,4800700
Usine 1,EQ-0010,Porte avant 3.0 m arriere,112,Grande porte,GRANITE DRC RAP,4800700
Usine 1,EQ-0099,Scie Wilson 3.5 m,101,Scie circulaire,GRANITE DRC RAP,48000101,WILSON INDUSTRIAL
Usine 2,EQ-0011,Polisseur Wilson U2,201,Polisseur,GRANITE DRC RAP,4800201,Wilson Industrial
Usine 2,EQ-0012,Pont Roulant 3T U2,202,Pont Roulant,GRANITE DRC RAP,4800202
Usine 2,EQ-0013,Système de chauffage U2,203,Chauffage,GRANITE DRC RAP,4800700
Usine 2,EQ-0014,Scandivent C4,209,CNC Profileuse,GRANITE DRC RAP,4800209,Scandinvent
Usine 2,EQ-0015,Pompe à eau U2 recyclée,214,Pompe à eau,GRANITE DRC RAP,4800106
Usine 2,EQ-0016,Pompe à eau U2 propre,215,Pompe à eau,GRANITE DRC RAP,4800106
Usine 2,EQ-0017,S5 Bimatech Techtone 4000,233,CNC Profileuse,GRANITE DRC RAP,4800233
Usine 2,EQ-0018,Sfera 825 CNC NOAT,235,Scie CNC,GRANITE DRC RAP,4800235,Noat Srl
Usine 2,EQ-0019,Porte avant U2,226,Grande porte,GRANITE DRC RAP,4800700
Usine 2,EQ-0020,Porte arrière U2,227,Grande porte,GRANITE DRC RAP,4800700
Usine 2,EQ-0021,Ligne à air U2,221,Ligne à air,GRANITE DRC RAP,4800221
Usine 2,EQ-0022,Ligne à eau propre U2,223,Ligne à eau,GRANITE DRC RAP,4800106
Usine 2,EQ-0023,Ligne à eau recyclée U2,222,Ligne à eau,GRANITE DRC RAP,4800106
Usine 2,EQ-0024,Grinder petit U2,220,Outillage de coupe,GRANITE DRC RAP,4800349
Usine 2,EQ-0025,Grinder Hydraulique U2,219,Outillage de coupe,GRANITE DRC RAP,4800349
Usine 2,EQ-0026,Barrière de sécurité Sfera,230,Barrière de sécuritée,GRANITE DRC RAP,4800201
Usine 3,EQ-0041,Compresseur à air Leroy,301,Compresseur,GRANITE DRC RAP,4800360
Usine 3,EQ-0057,Terzago,305,Scie circulaire,GRANITE DRC RAP,4800305,MARC PRÉVOST MACHINERIE INC.
Usine 3,EQ-0058,Falcon,306,Scie à Cable Usine,GRANITE DRC RAP,4080306
Usine 3,EQ-0059,Scie park industries Gantry Predator II,308,Scie circulaire,GRANITE DRC RAP,4800308,PARK INDUSTRIES
Usine 3,EQ-0060,Barrières sécurité Falcon,311,Barrière de sécuritée,GRANITE DRC RAP,4800306
Usine 3,EQ-0061,Barrières sécurité predator,312,Barrière de sécuritée,GRANITE DRC RAP,4800308
Usine 3,EQ-0062,Convoyeur Entrée splitter,318,Convoyeur,GRANITE DRC RAP,4800320
Usine 3,EQ-0063,Guillotine,320,Guillotineuse,GRANITE DRC RAP,4800320
Usine 3,EQ-0064,Convoyeur guillotine,321,Convoyeur,GRANITE DRC RAP,4800320
Usine 3,EQ-0065,Pont roulant 10 tonnes U3,329,Pont Roulant,GRANITE DRC RAP,4800329
Usine 3,EQ-0066,Pont roulant 25 tonnes U3,330,Pont Roulant,GRANITE DRC RAP,4800330
Usine 3,EQ-0067,Système de chauffage U3,331,Chauffage,GRANITE DRC RAP,4800700
Usine 3,EQ-0068,Porte avant #1 U3,333,Grande porte,GRANITE DRC RAP,4800700
Usine 3,EQ-0069,Porte avant #2 U3,334,Grande porte,GRANITE DRC RAP,4800700
Usine 3,EQ-0070,porte avant #3 U3,335,Grande porte,GRANITE DRC RAP,4800700
Usine 3,EQ-0071,Porte arrière #1 U3,337,Grande porte,GRANITE DRC RAP,4800700
Usine 3,EQ-0072,Porte arrière #2 U3,338,Grande porte,GRANITE DRC RAP,4800700
Usine 3,EQ-0073,porte arrière #3 U3,339,Grande porte,GRANITE DRC RAP,4800700
Usine 3,EQ-0074,porte arrière #4 U3,340,Grande porte,GRANITE DRC RAP,4800700
Usine 3,EQ-0075,Ligne d'eau recyclée U3,342,Ligne à eau,GRANITE DRC RAP,4800106
Usine 3,EQ-0076,Ligne d'eau propre U3,343,Ligne à eau,GRANITE DRC RAP,4800106
Usine 3,EQ-0077,Ligne à air U3,344,Ligne à air,GRANITE DRC RAP,4800221
Usine 3,EQ-0078,Compresseur à l'air mobile ingersoll rand 185 diesel (petit portatif),345,Compresseur,GRANITE DRC RAP,4800345
Usine 3,EQ-0079,Sullair compresseur électrique U3,346,Compresseur,GRANITE DRC RAP,4800346
Usine 3,EQ-0105,Table tournante Terzago,305,Scie circulaire,GRANITE DRC RAP,4800305
Usine 4,EQ-0036,Water jet 150 HP 575 electric uNIT 15000 psi 12 GPM #9 PLUNGERS (U4),450,Chargeur,GRANITE DRC RAP,4800450
Usine 4,EQ-0037,Xinda SHXJ2200 (U4),451,Scie à Cable Usine,GRANITE DRC RAP,4800451
Usine 4,EQ-0096,Camion Grue Freightline,,Boom Truck,GRANITE DRC RAP
Usine 4 - Transformation,EQ-0108,SCIE BLEUE,,Scie circulaire,GRANITE DRC STD
Usine 4 - Transformation,EQ-0114,GUILLOTINEUSE,,Guillotineuse,GRANITE DRC STD
Usine 4 - Transformation,EQ-0116,SCIE WILSON,,Scie circulaire,GRANITE DRC STD
Usine 4 - Transformation,EQ-0117,CONVOYEURS A ROULEAUX,,N.D.,GRANITE DRC STD
Usine 4 - Transformation,EQ-0119,HYSTER 50,,Chargeur,GRANITE DRC STD
Usine 5 - Sciage primaire,EQ-0109,SCIE A CABLE - N5,,Scie à Cable Usine,GRANITE DRC STD
Usine 5 - Sciage primaire,EQ-0110,SCIE 3METRES - N3,,Scie circulaire,GRANITE DRC STD
Usine 5 - Sciage primaire,EQ-0111,SCIE 3METRES - N4,,Scie circulaire,GRANITE DRC STD
Usine 5 - Sciage primaire,EQ-0112,SCIE 2|5METRES - N1,,Scie circulaire,GRANITE DRC STD
Usine 5 - Sciage primaire,EQ-0113,SCIE 3|5METRES - N2,,Scie circulaire,GRANITE DRC STD
Usine 6,EQ-0115,SFERA 825,,Scie CNC,GRANITE DRC STD
,EQ-0118,TEREX TL 260,,Chargeur,GRANITE DRC STD
`;

async function main() {
    console.log('🌱 Seeding Equipment from CSV...');

    const lines = csvData.split('\n').filter(line => line.trim() !== '');

    // Cache existing entities to avoid repeated DB calls
    // Sites
    const existingSites = await prisma.productionSite.findMany();
    const siteMap = new Map(existingSites.map(s => [s.name.toUpperCase(), s.id]));

    // Categories
    const existingCategories = await prisma.equipmentCategory.findMany();
    const categoryMap = new Map(existingCategories.map(c => [c.name.toLowerCase(), c.id]));

    // Suppliers (ThirdParty type=Supplier)
    const existingSuppliers = await prisma.thirdParty.findMany({ where: { type: 'Supplier' } });
    const supplierMap = new Map(existingSuppliers.map(s => [s.name.toUpperCase(), s.id]));

    let count = 0;

    for (const line of lines) {
        if (line.startsWith('Site,')) continue; // Header

        // CSV Split logic: Handle simple comma split for now
        // The data seems clean enough (no commas inside quotes in the sample except "Drilleuse "Down the hole"")
        // Wait, "Drilleuse "Down the hole"" has quotes but no commas inside.
        // "Scie Wilson 3|0 m" - the user used pipe possibly to avoid comma issues? Or just typo.
        // "SCIE 2|5METRES - N1"
        // Let's stick to simple split, and maybe rejoin if quotes are unbalanced?
        // Actually, looking at the data:
        // Carrière 3,EQ-0046,Drilleuse "Down the hole",607,Drilleuse,CARRIÈRE CALÉDONIA 3,6348607
        // Commas are separators.

        const parts = line.split(',');

        // Expected columns: Site, No.Système, Nom, No.d'équipement, Catégorie, Site, No.Comptable, Fournisseur
        // Indices:
        // 0: Site (Short)
        // 1: System Number (EQ-XXXX) -> unique key
        // 2: Name
        // 3: Internal ID (602)
        // 4: Category
        // 5: Site (Long) -> Use this for ProductionSite
        // 6: Accounting Code
        // 7: Supplier Name (Optional)

        if (parts.length < 2) continue;

        const systemNumber = parts[1]?.trim();
        if (!systemNumber) continue;

        const name = parts[2]?.trim();
        const internalId = parts[3]?.trim();
        const categoryName = parts[4]?.trim();
        const siteNameLong = parts[5]?.trim();
        const accountingCode = parts[6]?.trim();
        const supplierName = parts[7]?.trim();

        // 1. Resolve Category
        let categoryId = null;
        if (categoryName) {
            const lowerCat = categoryName.toLowerCase();
            if (categoryMap.has(lowerCat)) {
                categoryId = categoryMap.get(lowerCat);
            } else {
                // Create category if missing? Use Upsert?
                try {
                    const newCat = await prisma.equipmentCategory.upsert({
                        where: { name: categoryName },
                        update: {},
                        create: { name: categoryName }
                    });
                    categoryId = newCat.id;
                    categoryMap.set(lowerCat, newCat.id);
                } catch (e) {
                    // ignore
                }
            }
        }

        // 2. Resolve Site
        let productionSiteId = null;
        if (siteNameLong) {
            const upperSite = siteNameLong.toUpperCase();
            if (siteMap.has(upperSite)) {
                productionSiteId = siteMap.get(upperSite);
            } else {
                // Create site
                try {
                    const newSite = await prisma.productionSite.upsert({
                        where: { name: siteNameLong },
                        update: {},
                        create: { name: siteNameLong }
                    });
                    productionSiteId = newSite.id;
                    siteMap.set(upperSite, newSite.id);
                } catch (e) {
                    // ignore
                }
            }
        }

        // 3. Resolve Supplier
        let supplierId = null;
        if (supplierName) {
            const upperSup = supplierName.toUpperCase();
            if (supplierMap.has(upperSup)) {
                supplierId = supplierMap.get(upperSup);
            } else {
                // Create Supplier if missing?
                // Depending on strictness. Let's create as placeholder.
                try {
                    const newSup = await prisma.thirdParty.create({
                        data: {
                            name: supplierName,
                            type: 'Supplier',
                            supplierType: 'Equipment' // Defaulting
                        }
                    });
                    supplierId = newSup.id;
                    supplierMap.set(upperSup, newSup.id);
                } catch (e) {
                    // ignore duplicate or error
                }
            }
        }

        // 4. Upsert Equipment
        try {
            await prisma.equipment.upsert({
                where: { number: systemNumber },
                update: {
                    name,
                    internalId,
                    accountingCode,
                    categoryId: categoryId || undefined,
                    productionSiteId: productionSiteId || undefined,
                    supplierId: supplierId || undefined
                },
                create: {
                    number: systemNumber,
                    name: name || 'Unknown',
                    internalId,
                    accountingCode,
                    categoryId,
                    productionSiteId,
                    supplierId
                }
            });
            count++;
        } catch (error) {
            console.error(`Failed to upsert equipment ${systemNumber}:`, error);
        }
    }

    console.log(`✅ ${count} Equipments seeded/updated.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
