
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const csvData = `1500/3133,N.R.,Roulement,,30,20,0,0,Ball Bearings for Conveyor Rollers
ABF-3/10,N.R.,Consommable,Bureau,,0,0,0,Filtre a air
Arbre Terzago HB,C062112,Autres,,0,1,0,0,Arbre sur lequel sont fixé les engrenage pour le mouvement haut bas,,MARC PRÉVOST MACHINERIE INC.
Axe X Polisseur (GD),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe gauche droite
Axe x Predator (GD),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe gauche droite
Axe X Terzago (GD),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe gauche droite
Axe X Wilson 3 (GD),Assemblage,Assemblage,,,0,1,0,Assemblage des composants de l'axe gauche droite
Axe X Wilson 3.5 (GD),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe gauche droite
Axe Y Falcon (AA),Assemblage,Assemblage,,,0,0,0,Axe avant arrière de la Falcon
Axe Y Polisseur (AA),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe avant arrière
Axe Y Predator (AA),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe avant arrière
Axe Y Terzago (AA),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe avant arrière
Axe Y Wilson 3 (AA),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe avant arrière
Axe Y Wilson 3.5 (AA),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe avant arrière
Axe Z Falcon (HB),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe haut bas
Axe Z Polisseur (HB),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe haut bas
Axe Z Predator (HB),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe haut bas
Axe Z Terzago (HB),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe haut bas
Axe Z Wilson 3 (HB),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe haut bas
Axe Z Wilson 3.5 (HB),Assemblage,Assemblage,,,0,0,0,Assemblage des composants de l'axe haut bas
Batterie comp JD,PF31P7,Autres,,0,0,0,0,Batterie qui va sur le compresseur John Deer,,machineries Lourdes St-Raymond Inc
Bearing linear pour Noat,97 MO2 KWVE30BL G3V1,Roulement,,,0,0,0,Roulement linéaire pour la Noat
Bushing Prédator,FLN24,Roulement,,4,0,0,0,Bushing qui permet à la tête de la prédator de ce déplacer,,APPLIED INSDUSTRIAL TECHNOLOGIES
Cage de roulement driving shaft Falcon,FC214,Roulement,,,0,0,0,Cage dans laquelle est insérer le roulement du driving shaft de la Falcon,,APPLIED INSDUSTRIAL TECHNOLOGIES
Cam follower Falcon AA,CFE 30-2 BUUR,Roulement,,1,0,0,0,Cam follower installer sur la Falcon qui enligne les rails du mouvement avant arrière,IKO CFE 30-2 BUUR
Cam follower Polisseur,CF 2 1/2 SB,Roulement,,2,0,0,0,Cam follower qui vont sur la tête du polisseur,,APPLIED INSDUSTRIAL TECHNOLOGIES
Cam follower Wilson 3,CYR 2 3/4 S,Roulement,,0,0,0,0,Came situé sur la Wilson 3 mètre qui aligne le déplacement de gauche à droite,Mc GILL : CYR 2 3/4 S,APPLIED INSDUSTRIAL TECHNOLOGIES
Capteur Wilson 3.5 GD,E2E-X10MF1-M1,Capteur,,1,0,0,0,Capteur de proximité servant de limit switch sur la Wilson 3.5 mètre axe de gauche à droite,Omron E2E-X10MF1-M1,CALIBRATECK INC.
Chauffe Moteur 1500 W 120 V,TEM8600287,Autres,Container,1,0,0,0,,,Macpek inc.
Contacteur Pont roulant 25T GD,3RA2324-8XB30-1AK6,Contacteur,,1,0,0,0,Contacteur réversible du pont roulant 25T de gauche à droite,Gauche à droite si on regarde l'usine par les por
Contacteur Pont roulant usine 4 HB,3RA2328-8XB30-1AK6,Contacteur,,0,0,0,0,Contcteur du pont roulant situé à l'usine 4 qui permet de monter et descendre,,MLE SERVICES
Coupe Courant,POL51902,Autres,,0,0,0,0,Coupe courant aussi appelé couteaux électrique,,Macpek inc.
Courroie moteur prédator,8140253,Courroie,,0,0,0,0,Courroie reliant la poulie du moteur à la poulie du shaft de la prédator,,PARK INDUSTRIES
Courroie scie Prédator,8140265,Courroie,,0,0,0,0,Courroie reliant la poulie de l'arbre central à l'arbre de la scie sur la prédator.,,PARK INDUSTRIES
Engrenage terzago AA,C1302106,Engrenage,,0,0,0,0,Engrenage de l'axe y avant arrière installé sur la Terzago,,MARC PRÉVOST MACHINERIE INC.
Engrenage Terzago HB,C074140/01,Engrenage,,2,1,0,0,Gros engrenage de l'axe Z de la Terzago,Numéro MPM: C074140/01,MARC PRÉVOST MACHINERIE INC.
Engrenage Terzago HB,C074141/01,Engrenage,,2,1,0,0,Petit engrenage de l'axe Z sur la Terzago,Numéro MPM: C074141/01,MARC PRÉVOST MACHINERIE INC.
Engrenage Wilson 3 AA,S-624,Engrenage,,1,0,0,0,Engrenage qui active le déplacement de l'axe avant arrière de la Wilson 3,,APPLIED INSDUSTRIAL TECHNOLOGIES
Engrenage Wilson 3 GD,S320,Engrenage,,1,0,0,0,Engrenage de l'axe X de gauche à droite sur la Wilson 3,S320
Engrenage Wilson 3.5 AA,S520 14-1/2,Engrenage,,1,0,0,0,Engrenage de la Wilson 3.5 de l'axe avant arrière,Martin S520 14-1/2
Engrenage Wilson 3.5 GD,S514 14.5,Engrenage,,1,,0,0,Engrenage de l'axe X de gauche à droite sur la Wilson 3.5,,HARVEY ROULEMENTS. BEARINGS
Fan de chauffrette Dresseur,TEM710025,Autres,,0,0,0,0,Fan de la chauffrette du dresseur,,Macpek inc.
Filtre a gasoil,3682,Filtre,Bureau,,2,0,0
Filtre a huile,B161-S,Filtre,Bureau,,2,0,0
Filtre a huile,BT310,Filtre,,,2,0,0
Filtre a huile hydraulique,WIX 51782,Filtre,Bureau,,1,0,0,POUR TEREX
Filtre a huile hydraulique,N.R.,Filtre,Bureau,,1,0,0,POUR TEREX
Filtre air compresseur JD,1310033926,Filtre,,0,0,0,0,Filtre à air du compresseur John Deer
Filtre air gros Dresseur,42637,Filtre,,0,0,0,0,,Wix: 42637,AGI St-Raymond
Filtre air petit Dresseur,42638,Filtre,,0,0,0,0,,Wix: 42638,AGI St-Raymond
Filtre air Volvo,4881174,Filtre,,0,0,0,0,Filtre à air du Volvo,Volvo: 4881174,machineries Lourdes St-Raymond Inc
Filtre air Volvo,11007848,Filtre,,0,0,0,0,Filtre à air du Volvo,Volvo: 11007848,machineries Lourdes St-Raymond Inc
Filtre air Volvo 2,4881175,Filtre,,0,0,0,0,Filtre à l'air du Volvo,Volvo: 4881175,machineries Lourdes St-Raymond Inc
Filtre air Volvo 3,6639203,Filtre,,0,0,0,0,Filtre à l'air du Volvo,Volvo: 6639203,machineries Lourdes St-Raymond Inc
Filtre à air Volvo,11007847,Filtre,,0,0,0,0,Filtre à l'air du Volvo,Volvo: 11007847,machineries Lourdes St-Raymond Inc
Filtre Cat 988,42680,Filtre,,0,0,0,0,Filtre à air,No filtre: 42680
Filtre Cat 988,51792,Filtre,,0,0,0,0,Filtre à l'huile,No filtre: 51792
Filtre Cat 988,33384,Filtre,,0,0,0,0,Filtre à gaz,No filtre: 33384
Filtre Cat 988,33405,Filtre,,0,0,0,0,Filtre à gaz,No filtre: 33405
Filtre eau Dresseur,24071,Filtre,,0,0,0,0,,Wix: 24071
Filtre eau Volvo,1699830,Filtre,,0,0,0,0,Filtre à l'eau du moteur Volvo,Volvo: 1699830,machineries Lourdes St-Raymond Inc
Filtre fuel Dresseur,33116,Filtre,,0,0,0,0,,Wix: 33116
Filtre fuel Volvo,466987,Filtre,,0,0,0,0,Filtre à fuel du moteur du Volvo,Volvo: 466987,machineries Lourdes St-Raymond Inc
Filtre gaz comp JD,533752,Filtre,,0,,,,Filtre à gaz
Filtre huile comp JD,57076,Filtre,,0,,,,Filtre à l'huile du moteur du compresseur
Filtre huile hydraulique Volvo,11026936,Filtre,,0,0,0,0,Filtre à l'huile hydraulique du Volvo,Volvo: 11026936,machineries Lourdes St-Raymond Inc
Filtre huile hydraulique Volvo,965899,Filtre,,0,0,0,0,Filtre pour l'huile hydraulique du Volvo,Volvo: 965899,machineries Lourdes St-Raymond Inc
Filtre huile hydraulique Volvo 2,12973159,Filtre,,0,0,0,0,Filtre pour l'huile hydraulique du Volvo,Volvo: 12973159,machineries Lourdes St-Raymond Inc
Filtre huile moteur Dresseur,51749,Filtre,,,0,0,0,,Wix:51749,AGI St-Raymond
Filtre huile moteur Volvo,466634,Filtre,,0,0,0,0,Filtreur pour l'huile du moteur du Volvo,Volvo: 466634,machineries Lourdes St-Raymond Inc
Filtre huile moteur Volvo 2,477556,Filtre,,0,0,0,0,Filtreur à l'huile du moteur du volvo,Volvo: 477556,machineries Lourdes St-Raymond Inc
Filtre stainer huile moteur Dresseur,51954,Filtre,,,0,0,0,,Wix: 51954
Filtre volvo ?,11006995,Filtre,,,0,0,0,Je sais pas c'est quoi,,machineries Lourdes St-Raymond Inc
Flow switch Wilson,We Anderson V8,Capteur,,1,0,0,0,interrupteur de débit qui est installer sur les scie Wilson 3 et 3.5 mètre,WE Anderson V8,ITM INSTRUMENTS
Frein moteur Wilson 3 (AA),105672105PF,Moteur,,,0,0,0,Frein du moteur de la Wilson 3 mètre situé sur l'axe avant arrière,Stearns 59BK2105-PF
Frein moteur Wilson 3.5 (AA),C2006-551-R1DD,Moteur,,,0,0,0,Frein du moteur de l'axe avant arrière situé sur la Wilson 3.5 mètre,Dings dynamic group
Joint caoutchouc,D123007,Joint,Garage,2,0,2,2,joint pour la table tournante
L095 1,N.R.,Assemblage,Bureau,,0,0,0,Jaw Coupling Hub,,GENERAL BEARING SERVICE INC.
L095 7/8,N.R.,Assemblage,Bureau,,0,0,0,,Jaw Coupling Hub,GENERAL BEARING SERVICE INC.
Limit switch Polisseur AA,D4A-1101N,Capteur,,1,0,0,0,Capteur de fin de course de l'axe avant arrière,OMRON D4A-1101N,CALIBRATECK INC.
Limit switch Terzago,D4A-1116N,Capteur,,1,0,2,2,Capteur de fin de course servant à éviter les collisions entre la roche et la partie fixer au centre de la scie,Omron D4A-1116N,CALIBRATECK INC.
Limit switch Terzago HB,D4N-2120,Capteur,,1,0,0,0,Capteur de fin de course de l'axe des z haut bas,Omron D4N-2120,CALIBRATECK INC.
Maille chaine Explorer,81C1007,Autres,,2,0,0,0,Maille de chaine qui permet au roue d'avancer sur l'Explorer,,NOVAMAC INDUSTRIES INC
Moteur 2hp Polisseur (GD),SRF4S2TCN61,Moteur,,,0,0,0,Moteur 2 HP utilisé sur l'axe gauche droite du polisseur,Lincoln motors
Moteur 1/2HP (AA),F56C 1/2M4A,Moteur,,,0,0,0,Moteur de 1/2HP utilisé sur plusieurs machines pour l'axe avant arrière,Newport
Moteur 2 HP (HB),56C2M4D,Moteur,,,0,0,0,Moteur de 2 hp utilisé pour les déplacement vertical haut et bas,Newport electronic motor
Moteur 2HP (GD),YSN5664G,Moteur,,,0,0,0,Moteur de 2 hp utilisé sur plusieurs machines pour le déplacement gauche droite,JRP Nema Frame 56C
Moteur chauffrette Dresseur,TEM7100006,Moteur,,0,0,0,0,Moteur de chauffrette qui va sur le dresseur,,Macpek inc.
Moteur hydraulique Explorer,PLM30 43S0-3255-LOF/0C N,Moteur,,0,0,0,0,Moteur hydraulique du compresseur sur l'exploreur
Moteur Terzago axe Z,SH-90S-4,Moteur,,0,0,0,0,Moteur de la Terzago qui active l'axe Z,Cantoni group
Moteur Volvo 330,TD164KAE,Moteur,,,0,0,0,Information sur le moteur du Volvo 330,Engine family: WVSXL16.OCE1
Moteur Wilson 3.5 (GD),1UUU7L0,Moteur,,0,0,0,0,Moteur servant au déplacement gauche droite sur la Wilson 3.5 mètre,JRP
NP-28,N.R.,Roulement,Bureau,2,2,0,0,Ball Bearing Unit,Sealmaster NP-28
Nut en bronze - RH20125,N.R.,N.D.,Bureau,4,5,0,0,Nut en bronze pour vis sans fin up and down scie bleue,,GENERAL BEARING SERVICE INC.
polisseur ressort tête à martelage,300misc,Autres,,0,0,0,0,Ressort installé sur la tête à marteler du polisseur,300misc spring for polishing plate,DERUSHA SUPPLY INC.
Polisseur tête à martelage,23014542,Autres,,1,0,0,0,Pièce qui se monte sur le polisseur qui donne un fini martelé à la pierre,,DERUSHA SUPPLY INC.
Pompe eau propre,20WA15S4-PE,Autres,,0,0,0,0,Pompe pour l'eau propre à l'usine 2,Franklin electric (Water horse)
Poulie arbre Prédator moteur,8130249,Poulie,,0,0,0,0,Jack shaft sheave,Poulie installer sur le shaft qui est relié par l,PARK INDUSTRIES
Poulie arbre Prédator scie,8130357,Poulie,,0,0,0,0,Poulie installé sur l'arbre central relier par la courroie à l'arbre de la scie,,PARK INDUSTRIES
Poulie moteur Prédator,8130273,Poulie,,0,0,0,0,Motor sheave,,PARK INDUSTRIES
Poulie scie Prédator,8130361,Poulie,,0,0,0,0,Poulie installer sur l'abre de la scie de la prédtor,Abor sheave,PARK INDUSTRIES
Pressure switch Dresseur,A-273541M1,Capteur,,0,0,0,0,Pressure switch qui active le son lorsque l'on recule avec le dresseur,,machineries Lourdes St-Raymond Inc
Protection Predator,8281020,Protection,,0,0,0,0,Accordéon de protection en dessous du pont (Bottom Bridge Bellow),,PARK INDUSTRIES
Protection Predator,8281021,Protection,,0,,0,0,Accordéon de protection sur le dessus le du pont (Top Bridge bellow),,PARK INDUSTRIES
Protection Predator,8281021,Protection,,0,0,0,0,Accordeon de protection du pont (Top way cover),,PARK INDUSTRIES
Réducteur Polisseur AA,GR8240558.23,Réducteur,,,0,0,0,Réducteur de vitesse du moteur de l'axe avant arrière situé sur le polisseur,Ironman by Grove Gear
Réducteur Polisseur GD,HM224-1,Réducteur,,,0,0,0,,Grove gear
Réducteur Terzago HB,A102 UH25 F1A 23.8 S1 VA PAM80,Réducteur,,0,1,0,0,Réducteur de vitesse du moteur de l'axe haut bas situé sur la Terzago,,MARC PRÉVOST MACHINERIE INC.
Réducteur Wilson 3 AA,?,Réducteur,,,0,0,0,Réducteur de vitesse du moteur de l'axe avant arrière situé sur la Wilson 3 mètre,Pas de marque seulement des numéro
Réducteur Wilson 3 GD,M3213BAH60A,Réducteur,,,0,0,0,Réducteur de vitesse du moteur de l'axe gauche droite situé sur la Wilson 3 mètre,Cleveland Gear
Réducteur Wilson 3 HB,232BQ025562,Réducteur,,,0,0,0,Réducteur de vitesse du moteur de l'axe haut bas situé sur la Wilson 3 mètre,Sterling electric  inc
Réducteur Wilson 3.5 AA,?,Réducteur,,,0,0,0,Réducteur de vitesse du moteur de l'axe avant arrière situé sur la Wilson 3.5 mètre,Pas de marque seulement des chiffres sur une plaq
RH12125 Vis sans fin,N.R.,Assemblage,,,0,0,0,,,GENERAL BEARING SERVICE INC.
Roue des scie Wilson,A déterminer,Roue,,1,0,1,0,Roue utilisé sur les rails de la Wlson 3 et 3.5 mètres
Roue Falcon,BigWheel1000mm,Roue,Usine3,1,0,,,Roue de 1000 mm de diametre,Aucun reference du fournisseur HUADA,HuaDa Superabrasive Tool
Roulement convoyeur entrer splitter,UCFB 28-24,Roulement,,1,0,0,0,Roulement qui vont à l'avant du convoyeur à l'entré de la guillotine,Casting: FB208,APPLIED INSDUSTRIAL TECHNOLOGIES
Roulement convoyeur sortie splitteur,FRANTZ-2532,Roulement,,6,0,0,0,Roulement du convoyeur à rouleaux à la sortie du splitter,,APPLIED INSDUSTRIAL TECHNOLOGIES
Roulement des roues Falcon AA,UCP212D1,Roulement,,0,0,0,0,Roulement pour les roues déplacement avant arrière de la Falcon,NTN UCP212D1,APPLIED INSDUSTRIAL TECHNOLOGIES
Roulement driving shaft Falcon,UC214D1,Roulement,,0,0,0,0,Roulement fixé à l'arbre qui transmet la puissance sur la Falcon,,APPLIED INSDUSTRIAL TECHNOLOGIES
Roulement driving shaft Terzago,30215M-90KM1,Roulement,,0,0,0,0,Roulement fixer à l'arbre de la scie du côté de la scie sur la Terzago,Timken 30215M-90KM1
Roulement driving shaft Terzago,NU2312-E-TVP2-C3,Roulement,,1,0,0,0,Roulement fixer à l'arbre de la scie du côté de la poulie sur la Terzago,,APPLIED INSDUSTRIAL TECHNOLOGIES
Roulement Falcon HB,R151341013,Roulement,,1,0,0,0,Roulement linéaire en haut de l'axe haut bas,Rexroth R151341013
Roulement linéaire Terzago HB,R151344013,Roulement,,2,0,2,0,Roulement linéaire qui va sur la Terzago
Roulement plat Terzago HB,D14328,Roulement,,1,0,0,0,Roulement à plat qui va sur l'arbre de l'axe Z de la Terzago,Numéro mpm: D104328,APPLIED INSDUSTRIAL TECHNOLOGIES
Roulement Prédator,8070171-1,Roulement,Garage,9,0,0,0,Bearing de y et z sur la predator,,PARK INDUSTRIES
Roulement support d'arbre Terzago HB,D105010,Roulement,,2,0,0,0,Roulement de support de l'arbre qui va sur l'axe Z de la Terzago,Numéro MPM: D105010,APPLIED INSDUSTRIAL TECHNOLOGIES
Roulement support vis terzago HB,D104173,Roulement,,2,0,0,0,Roulement qui supporte les vis sans fin de l'axe Z sur la Terzago,Numéro MPM: D104173,APPLIED INSDUSTRIAL TECHNOLOGIES
Roulement Wilson roue,3920,Roulement,,2,0,4,8,Bearing situé à l'intérieur des roues de la Wilson 3 et 3.5 mètre,Roulement situé à l'intérieur des roues de la Wil,HARVEY ROULEMENTS. BEARINGS
S614BS 1,N.R.,Engrenage,Bureau,,0,,0,,,GENERAL BEARING SERVICE INC.
Seal de roue Wilson,415088,Roulement,,2,0,4,8,Seal de roue pour la Wlson 3 et 3.5 mètre,Seal de roue pour la Wilson 3 et 3.5 mètre il y e,HARVEY ROULEMENTS. BEARINGS
Seal shaft scie Terzago,90-110-12,Roulement,,2,0,0,0,Seal qui sont poser avec les roulement sur le shaft de la scie de la Terzago,,APPLIED INSDUSTRIAL TECHNOLOGIES
Séparateur carburant/eau,N.R.,N.D.,Bureau,,3,0,0,3732
SKF 6208-2RS1,N.R.,N.D.,Bureau,4,3,0,0,Flange-Mount Ball Bearing Unit - 4-Bolt
Socle Wilson roue,3994,Roulement,,2,0,4,8,Socle du roulement pour les roue Wilson 3 et 3.5,Socle dans lequel s'appuie les bearings situé dan,HARVEY ROULEMENTS. BEARINGS
Solénoide Dresseur,66-123,Contacteur,,0,0,0,0,Solénoide du strater du Dresseur,SOLENOID 37MT 24V,machineries Lourdes St-Raymond Inc
SPIDER L090/L095,N.R.,Assemblage,Bureau,,0,0,0,Jaw Coupling Insert,,GENERAL BEARING SERVICE INC.
Spring Washer,D128076,Joint,Garage,2,0,2,2,Spring washer pour table terzago,,MARC PRÉVOST MACHINERIE INC.
Tige fillettée 5/8 GRADE 8,N.R.,N.D.,Usine 4,,6,0,0,,,DIST. J.M. BERGERON
UCFU-3/4M,N.R.,Roulement,Bureau,2,3,0,0,Roulements vis sans fin axe Z,Marque en stock : NTN,GENERAL BEARING SERVICE INC.
X30210 Tapered Roller Bearings,N.R.,Roulement,Bureau,,2,0,0,This is the most basic and most widely used type of tapered roller bearing. It consists of two main separable parts: the cone (inner ring) assembly and the cup (outer ring). It is typically mounted in opposing pairs on a shaft.
`;

async function main() {
    console.log('🌱 Seeding Parts from CSV...');

    const lines = csvData.split('\n').filter(line => line.trim() !== '');

    // Fetch all categories
    const categories = await prisma.partCategory.findMany();
    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

    let count = 0;

    for (const line of lines) {
        // Simple comma split - assuming no commas in quoted fields for now based on visual inspection of normalized data
        const parts = line.split(',');

        // Skip if not enough fields or empty name
        if (parts.length < 3 || !parts[0]) continue;

        const name = parts[0].trim();
        const reference = parts[1]?.trim() === 'N.R.' ? null : parts[1]?.trim();
        const categoryName = parts[2]?.trim();
        const location = parts[3]?.trim() || null;

        // Min Qty (index 4)
        let minQuantity = 0;
        if (parts[4] && !isNaN(parseInt(parts[4]))) {
            minQuantity = parseInt(parts[4]);
        }

        // Stock (index 5) - "Qté. Dispo."
        let stockQuantity = 0;
        if (parts[5] && !isNaN(parseInt(parts[5]))) {
            stockQuantity = parseInt(parts[5]);
        }

        // Description (index 8)
        const description = parts[8]?.trim() || null;

        // Note (index 9)
        const note = parts[9]?.trim() || null;

        // Supplier (index 10)
        const supplier = parts[10]?.trim() || null;

        let categoryId = null;
        if (categoryName) {
            // Try Case Insensitive Match
            const lowerCat = categoryName.toLowerCase();
            if (categoryMap.has(lowerCat)) {
                categoryId = categoryMap.get(lowerCat);
            } else {
                // Try fuzzy match or just ignore? 
                // Creating categories on the fly might be risky if typos.
                // But for "Consommable" vs "Consommables" etc.
                // Let's create if missing? No, user provided strict list before.
                // I'll try to create if seemingly valid word, or just skip category.
                // Given the instructions, I should probably CREATE it if meaningful.
                // But I'll stick to linking existing for safety.
                console.warn(`Category not found: ${categoryName} for part ${name}`);
            }
        }

        try {
            await prisma.part.create({
                data: {
                    name,
                    reference,
                    stockQuantity,
                    minQuantity,
                    description,
                    location,
                    note,
                    supplier,
                    categoryId: categoryId || undefined
                }
            });
            count++;
        } catch (error) {
            console.error(`Failed to create part ${name}:`, error);
        }
    }

    console.log(`✅ ${count} Parts seeded.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
