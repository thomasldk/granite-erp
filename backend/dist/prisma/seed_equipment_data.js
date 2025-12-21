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
exports.seedEquipment = seedEquipment;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const rawData = [
    { id: 1, name: "compresseur Denver", internalId: "EQ-0042", serialNumber: "602", category: "Compresseur", site: "CARRIÈRE CALÉDONIA 3", accountingCode: "6348602", supplier: "" },
    { id: 2, name: "Génératrice Caterpillar 1999", internalId: "EQ-0043", serialNumber: "603", category: "Génératrice", site: "CARRIÈRE CALÉDONIA 3", accountingCode: "6348603", supplier: "" },
    { id: 3, name: "Compresseur John Deer", internalId: "EQ-0044", serialNumber: "604", category: "Compresseur", site: "CARRIÈRE CALÉDONIA 3", accountingCode: "6348604", supplier: "" },
    { id: 4, name: "Scie perfora", internalId: "EQ-0045", serialNumber: "606", category: "Scie à Cable Carrière", site: "CARRIÈRE CALÉDONIA 3", accountingCode: "6348606", supplier: "" },
    { id: 5, name: "Drilleuse \"Down the hole\"", internalId: "EQ-0046", serialNumber: "607", category: "Drilleuse", site: "CARRIÈRE CALÉDONIA 3", accountingCode: "6348607", supplier: "" },
    { id: 6, name: "Drill Hydraulique explorer", internalId: "EQ-0047", serialNumber: "611", category: "Drilleuse", site: "CARRIÈRE CALÉDONIA 3", accountingCode: "6348611", supplier: "" },
    { id: 7, name: "Compresseur orange", internalId: "EQ-0048", serialNumber: "612", category: "Compresseur", site: "CARRIÈRE CALÉDONIA 3", accountingCode: "6348612", supplier: "" },
    { id: 8, name: "Génératrice 45-49 KVA (Multiquip)", internalId: "EQ-0049", serialNumber: "613", category: "Génératrice", site: "CARRIÈRE CALÉDONIA 3", accountingCode: "6348613", supplier: "" },
    { id: 9, name: "Dresser 570 Komatsu (payloader)", internalId: "EQ-0050", serialNumber: "616", category: "Chargeur", site: "CARRIÈRE CALÉDONIA 3", accountingCode: "6348616", supplier: "" },
    { id: 10, name: "Toyo1 (Marteau) 1998", internalId: "EQ-0051", serialNumber: "621", category: "Chargeur", site: "CARRIÈRE CALÉDONIA 3", accountingCode: "6348621", supplier: "" },
    { id: 11, name: "Compresseur portatif diesel 185 CFM", internalId: "EQ-0052", serialNumber: "622", category: "Compresseur", site: "CARRIÈRE CALÉDONIA 3", accountingCode: "6348622", supplier: "" },
    { id: 12, name: "Loader caterpillar 988-B 1979", internalId: "EQ-0053", serialNumber: "623", category: "Chargeur", site: "CARRIÈRE CALÉDONIA 3", accountingCode: "6348623", supplier: "" },
    { id: 13, name: "Loader caterpillar 988-B 1987", internalId: "EQ-0054", serialNumber: "624", category: "Chargeur", site: "CARRIÈRE CALÉDONIA 3", accountingCode: "6348624", supplier: "" },
    { id: 14, name: "Petite scie pour équarrir", internalId: "EQ-0055", serialNumber: "626", category: "Outillage de coupe", site: "CARRIÈRE CALÉDONIA 3", accountingCode: "6348626", supplier: "" },
    { id: 15, name: "Pelle Komatsu", internalId: "EQ-0056", serialNumber: "628", category: "Pelle", site: "CARRIÈRE CALÉDONIA 3", accountingCode: "6348628", supplier: "" },
    { id: 16, name: "down the hole drill (pneumatic & hydraulic)", internalId: "EQ-0080", serialNumber: "627", category: "Drilleuse", site: "CARRIÈRE CALÉDONIA 3", accountingCode: "6348628", supplier: "" },
    { id: 17, name: "Soudeuse Hobert 460", internalId: "EQ-0038", serialNumber: "501", category: "Soudeuse", site: "GRANITE DRC RAP", accountingCode: "4800360", supplier: "" },
    { id: 18, name: "Soudeuse Lincoln 400", internalId: "EQ-0039", serialNumber: "502", category: "Soudeuse", site: "GRANITE DRC RAP", accountingCode: "4800360", supplier: "" },
    { id: 19, name: "Soudeuse Hobert LN25", internalId: "EQ-0040", serialNumber: "503", category: "Soudeuse", site: "GRANITE DRC RAP", accountingCode: "4800360", supplier: "" },
    { id: 20, name: "john Deer 544", internalId: "EQ-0027", serialNumber: "400", category: "Chargeur", site: "GRANITE DRC RAP", accountingCode: "4800400", supplier: "" },
    { id: 21, name: "Inter SS 6 Roues 1987", internalId: "EQ-0028", serialNumber: "401", category: "Chargeur", site: "GRANITE DRC RAP", accountingCode: "4800401", supplier: "" },
    { id: 22, name: "Caterpilar 988 Stanstead", internalId: "EQ-0029", serialNumber: "402", category: "Chargeur", site: "GRANITE DRC RAP", accountingCode: "6348402", supplier: "" },
    { id: 23, name: "T-Rex TL160 (blanc)", internalId: "EQ-0030", serialNumber: "403", category: "Chargeur", site: "GRANITE DRC STD", accountingCode: "4800403", supplier: "" },
    { id: 24, name: "T-Rex TL260 (blanc2011)", internalId: "EQ-0031", serialNumber: "404", category: "Chargeur", site: "GRANITE DRC STD", accountingCode: "4800404", supplier: "" },
    { id: 25, name: "Ford F-150 (Daniel 2012)", internalId: "EQ-0032", serialNumber: "405", category: "Automobile", site: "GRANITE DRC RAP", accountingCode: "4800405", supplier: "" },
    { id: 26, name: "ford F-150 Gris Carl (2010)", internalId: "EQ-0033", serialNumber: "406", category: "Automobile", site: "GRANITE DRC RAP", accountingCode: "4800406", supplier: "" },
    { id: 27, name: "Ford F-150 DB Carr. (2012)", internalId: "EQ-0034", serialNumber: "407", category: "Automobile", site: "GRANITE DRC RAP", accountingCode: "6348407", supplier: "" },
    { id: 28, name: "Volvo 330", internalId: "EQ-0035", serialNumber: "408", category: "Chargeur", site: "GRANITE DRC RAP", accountingCode: "4800408", supplier: "" },
    { id: 29, name: "GANTS 11168663", internalId: "EQ-0081", serialNumber: "", category: "Consommables", site: "GRANITE DRC RAP", accountingCode: "4220600", supplier: "" },
    { id: 30, name: "VESTE NOIR COTON IGNIFUGE LINDE", internalId: "EQ-0082", serialNumber: "", category: "Consommables", site: "GRANITE DRC RAP", accountingCode: "4220600", supplier: "" },
    { id: 31, name: "HABIT PLUIE EN POCHE 3PCS JAUNE", internalId: "EQ-0083", serialNumber: "", category: "Consommables", site: "GRANITE DRC RAP", accountingCode: "4220600", supplier: "" },
    { id: 32, name: "GANT NITRILE SUR NYLON BLEU GR 9", internalId: "EQ-0084", serialNumber: "", category: "Consommables", site: "GRANITE DRC RAP", accountingCode: "4220600", supplier: "" },
    { id: 33, name: "LUNETTES SECURITE CLAIRE FUMEE GS1000C", internalId: "EQ-0085", serialNumber: "", category: "Consommables", site: "GRANITE DRC RAP", accountingCode: "4220600", supplier: "" },
    { id: 34, name: "LUNETTES SECURITE CLAIRE FUMEE GS1000C", internalId: "EQ-0086", serialNumber: "", category: "Consommables", site: "GRANITE DRC RAP", accountingCode: "4220600", supplier: "" },
    { id: 35, name: "LUNETTES SECURITE FUMEE GS1000S", internalId: "EQ-0087", serialNumber: "", category: "Consommables", site: "GRANITE DRC RAP", accountingCode: "4220600", supplier: "" },
    { id: 36, name: "LUNETTE SECURITE11169114 / #S3435X", internalId: "EQ-0088", serialNumber: "", category: "Consommables", site: "GRANITE DRC RAP", accountingCode: "4220600", supplier: "" },
    { id: 37, name: "GANTS SOUDEURS SABLE FIL KEVLAR", internalId: "EQ-0090", serialNumber: "", category: "Consommables", site: "GRANITE DRC RAP", accountingCode: "4220600", supplier: "" },
    { id: 38, name: "GANT CUIR FENDU ET COTON MANC. TG", internalId: "EQ-0091", serialNumber: "", category: "Consommables", site: "GRANITE DRC RAP", accountingCode: "4220600", supplier: "" },
    { id: 39, name: "VESTE CIRCUL ORANGE POLYESTER CSA", internalId: "EQ-0093", serialNumber: "", category: "Consommables", site: "GRANITE DRC RAP", accountingCode: "4220600", supplier: "" },
    { id: 40, name: "VESTE CIRCUL ORANGE POLYESTER CSA", internalId: "EQ-0094", serialNumber: "", category: "Consommables", site: "GRANITE DRC RAP", accountingCode: "4220600", supplier: "" },
    { id: 41, name: "OXYGENE VRAC", internalId: "EQ-0095", serialNumber: "", category: "Consommables", site: "GRANITE DRC RAP", accountingCode: "4220500", supplier: "" },
    { id: 42, name: "Scie Wilson 3|0 m", internalId: "EQ-0003", serialNumber: "102", category: "Scie circulaire", site: "GRANITE DRC RAP", accountingCode: "48000102", supplier: "Wilson Industrial" },
    { id: 43, name: "Barrière de sécurité 3.5", internalId: "EQ-0004", serialNumber: "116", category: "Barrière de sécuritée", site: "GRANITE DRC RAP", accountingCode: "4800101", supplier: "" },
    { id: 44, name: "Barrière de sécurité 3.0", internalId: "EQ-0005", serialNumber: "117", category: "Barrière de sécuritée", site: "GRANITE DRC RAP", accountingCode: "4800102", supplier: "" },
    { id: 45, name: "Pompe à eau usine 1", internalId: "EQ-0006", serialNumber: "106", category: "Pompe à eau", site: "GRANITE DRC RAP", accountingCode: "4800106", supplier: "" },
    { id: 46, name: "Porte avant 3.5 m avant", internalId: "EQ-0007", serialNumber: "109", category: "Grande porte", site: "GRANITE DRC RAP", accountingCode: "4800700", supplier: "" },
    { id: 47, name: "Porte avant 3.5 m arrière", internalId: "EQ-0008", serialNumber: "110", category: "Grande porte", site: "GRANITE DRC RAP", accountingCode: "4800700", supplier: "" },
    { id: 48, name: "Porte avant 3.0 m avant", internalId: "EQ-0009", serialNumber: "111", category: "Grande porte", site: "GRANITE DRC RAP", accountingCode: "4800700", supplier: "" },
    { id: 49, name: "Porte avant 3.0 m arriere", internalId: "EQ-0010", serialNumber: "112", category: "Grande porte", site: "GRANITE DRC RAP", accountingCode: "4800700", supplier: "" },
    { id: 50, name: "Scie Wilson 3.5 m", internalId: "EQ-0099", serialNumber: "101", category: "Scie circulaire", site: "GRANITE DRC RAP", accountingCode: "48000101", supplier: "WILSON INDUSTRIAL" },
    { id: 51, name: "Polisseur Wilson U2", internalId: "EQ-0011", serialNumber: "201", category: "Polisseur", site: "GRANITE DRC RAP", accountingCode: "4800201", supplier: "Wilson Industrial" },
    { id: 52, name: "Pont Roulant 3T U2", internalId: "EQ-0012", serialNumber: "202", category: "Pont Roulant", site: "GRANITE DRC RAP", accountingCode: "4800202", supplier: "" },
    { id: 53, name: "Système de chauffage U2", internalId: "EQ-0013", serialNumber: "203", category: "Chauffage", site: "GRANITE DRC RAP", accountingCode: "4800700", supplier: "" },
    { id: 54, name: "Scandivent C4", internalId: "EQ-0014", serialNumber: "209", category: "CNC Profileuse", site: "GRANITE DRC RAP", accountingCode: "4800209", supplier: "Scandinvent" },
    { id: 55, name: "Pompe à eau U2 recyclée", internalId: "EQ-0015", serialNumber: "214", category: "Pompe à eau", site: "GRANITE DRC RAP", accountingCode: "4800106", supplier: "" },
    { id: 56, name: "Pompe à eau U2 propre", internalId: "EQ-0016", serialNumber: "215", category: "Pompe à eau", site: "GRANITE DRC RAP", accountingCode: "4800106", supplier: "" },
    { id: 57, name: "S5 Bimatech Techtone 4000", internalId: "EQ-0017", serialNumber: "233", category: "CNC Profileuse", site: "GRANITE DRC RAP", accountingCode: "4800233", supplier: "" },
    { id: 58, name: "Sfera 825 CNC NOAT", internalId: "EQ-0018", serialNumber: "235", category: "Scie CNC", site: "GRANITE DRC RAP", accountingCode: "4800235", supplier: "Noat Srl" },
    { id: 59, name: "Porte avant U2", internalId: "EQ-0019", serialNumber: "226", category: "Grande porte", site: "GRANITE DRC RAP", accountingCode: "4800700", supplier: "" },
    { id: 60, name: "Porte arrière U2", internalId: "EQ-0020", serialNumber: "227", category: "Grande porte", site: "GRANITE DRC RAP", accountingCode: "4800700", supplier: "" },
    { id: 61, name: "Ligne à air U2", internalId: "EQ-0021", serialNumber: "221", category: "Ligne à air", site: "GRANITE DRC RAP", accountingCode: "4800221", supplier: "" },
    { id: 62, name: "Ligne à eau propre U2", internalId: "EQ-0022", serialNumber: "223", category: "Ligne à eau", site: "GRANITE DRC RAP", accountingCode: "4800106", supplier: "" },
    { id: 63, name: "Ligne à eau recyclée U2", internalId: "EQ-0023", serialNumber: "222", category: "Ligne à eau", site: "GRANITE DRC RAP", accountingCode: "4800106", supplier: "" },
    { id: 64, name: "Grinder petit U2", internalId: "EQ-0024", serialNumber: "220", category: "Outillage de coupe", site: "GRANITE DRC RAP", accountingCode: "4800349", supplier: "" },
    { id: 65, name: "Grinder Hydraulique U2", internalId: "EQ-0025", serialNumber: "219", category: "Outillage de coupe", site: "GRANITE DRC RAP", accountingCode: "4800349", supplier: "" },
    { id: 66, name: "Barrière de sécurité Sfera", internalId: "EQ-0026", serialNumber: "230", category: "Barrière de sécuritée", site: "GRANITE DRC RAP", accountingCode: "4800201", supplier: "" },
    { id: 67, name: "Compresseur à air Leroy", internalId: "EQ-0041", serialNumber: "301", category: "Compresseur", site: "GRANITE DRC RAP", accountingCode: "4800360", supplier: "" },
    { id: 68, name: "Terzago", internalId: "EQ-0057", serialNumber: "305", category: "Scie circulaire", site: "GRANITE DRC RAP", accountingCode: "4800305", supplier: "MARC PRÉVOST MACHINERIE INC." },
    { id: 69, name: "Falcon", internalId: "EQ-0058", serialNumber: "306", category: "Scie à Cable Usine", site: "GRANITE DRC RAP", accountingCode: "4080306", supplier: "" },
    { id: 70, name: "Scie park industries Gantry Predator II", internalId: "EQ-0059", serialNumber: "308", category: "Scie circulaire", site: "GRANITE DRC RAP", accountingCode: "4800308", supplier: "PARK INDUSTRIES" },
    { id: 71, name: "Barrières sécurité Falcon", internalId: "EQ-0060", serialNumber: "311", category: "Barrière de sécuritée", site: "GRANITE DRC RAP", accountingCode: "4800306", supplier: "" },
    { id: 72, name: "Barrières sécurité predator", internalId: "EQ-0061", serialNumber: "312", category: "Barrière de sécuritée", site: "GRANITE DRC RAP", accountingCode: "4800308", supplier: "" },
    { id: 73, name: "Convoyeur Entrée splitter", internalId: "EQ-0062", serialNumber: "318", category: "Convoyeur", site: "GRANITE DRC RAP", accountingCode: "4800320", supplier: "" },
    { id: 74, name: "Guillotine", internalId: "EQ-0063", serialNumber: "320", category: "Guillotineuse", site: "GRANITE DRC RAP", accountingCode: "4800320", supplier: "" },
    { id: 75, name: "Convoyeur guillotine", internalId: "EQ-0064", serialNumber: "321", category: "Convoyeur", site: "GRANITE DRC RAP", accountingCode: "4800320", supplier: "" },
    { id: 76, name: "Pont roulant 10 tonnes U3", internalId: "EQ-0065", serialNumber: "329", category: "Pont Roulant", site: "GRANITE DRC RAP", accountingCode: "4800329", supplier: "" },
    { id: 77, name: "Pont roulant 25 tonnes U3", internalId: "EQ-0066", serialNumber: "330", category: "Pont Roulant", site: "GRANITE DRC RAP", accountingCode: "4800330", supplier: "" },
    { id: 78, name: "Système de chauffage U3", internalId: "EQ-0067", serialNumber: "331", category: "Chauffage", site: "GRANITE DRC RAP", accountingCode: "4800700", supplier: "" },
    { id: 79, name: "Porte avant #1 U3", internalId: "EQ-0068", serialNumber: "333", category: "Grande porte", site: "GRANITE DRC RAP", accountingCode: "4800700", supplier: "" },
    { id: 80, name: "Porte avant #2 U3", internalId: "EQ-0069", serialNumber: "334", category: "Grande porte", site: "GRANITE DRC RAP", accountingCode: "4800700", supplier: "" },
    { id: 81, name: "porte avant #3 U3", internalId: "EQ-0070", serialNumber: "335", category: "Grande porte", site: "GRANITE DRC RAP", accountingCode: "4800700", supplier: "" },
    { id: 82, name: "Porte arrière #1 U3", internalId: "EQ-0071", serialNumber: "337", category: "Grande porte", site: "GRANITE DRC RAP", accountingCode: "4800700", supplier: "" },
    { id: 83, name: "Porte arrière #2 U3", internalId: "EQ-0072", serialNumber: "338", category: "Grande porte", site: "GRANITE DRC RAP", accountingCode: "4800700", supplier: "" },
    { id: 84, name: "porte arrière #3 U3", internalId: "EQ-0073", serialNumber: "339", category: "Grande porte", site: "GRANITE DRC RAP", accountingCode: "4800700", supplier: "" },
    { id: 85, name: "porte arrière #4 U3", internalId: "EQ-0074", serialNumber: "340", category: "Grande porte", site: "GRANITE DRC RAP", accountingCode: "4800700", supplier: "" },
    { id: 86, name: "Ligne d'eau recyclée U3", internalId: "EQ-0075", serialNumber: "342", category: "Ligne à eau", site: "GRANITE DRC RAP", accountingCode: "4800106", supplier: "" },
    { id: 87, name: "Ligne d'eau propre U3", internalId: "EQ-0076", serialNumber: "343", category: "Ligne à eau", site: "GRANITE DRC RAP", accountingCode: "4800106", supplier: "" },
    { id: 88, name: "Ligne à air U3", internalId: "EQ-0077", serialNumber: "344", category: "Ligne à air", site: "GRANITE DRC RAP", accountingCode: "4800221", supplier: "" },
    { id: 89, name: "Compresseur à l'air mobile ingersoll rand 185 diesel (petit portatif)", internalId: "EQ-0078", serialNumber: "345", category: "Compresseur", site: "GRANITE DRC RAP", accountingCode: "4800345", supplier: "" },
    { id: 90, name: "Sullair compresseur électrique U3", internalId: "EQ-0079", serialNumber: "346", category: "Compresseur", site: "GRANITE DRC RAP", accountingCode: "4800346", supplier: "" },
    { id: 91, name: "Table tournante Terzago", internalId: "EQ-0105", serialNumber: "305", category: "Scie circulaire", site: "GRANITE DRC RAP", accountingCode: "4800305", supplier: "" },
    { id: 92, name: "Water jet 150 HP 575 electric uNIT 15000 psi 12 GPM #9 PLUNGERS (U4)", internalId: "EQ-0036", serialNumber: "450", category: "Chargeur", site: "GRANITE DRC RAP", accountingCode: "4800450", supplier: "" },
    { id: 93, name: "Xinda SHXJ2200 (U4)", internalId: "EQ-0037", serialNumber: "451", category: "Scie à Cable Usine", site: "GRANITE DRC RAP", accountingCode: "4800451", supplier: "" },
    { id: 94, name: "Camion Grue Freightline", internalId: "EQ-0096", serialNumber: "", category: "Boom Truck", site: "GRANITE DRC RAP", accountingCode: "", supplier: "" },
    { id: 95, name: "SCIE BLEUE", internalId: "EQ-0108", serialNumber: "", category: "Scie circulaire", site: "GRANITE DRC STD", accountingCode: "", supplier: "" },
    { id: 96, name: "GUILLOTINEUSE", internalId: "EQ-0114", serialNumber: "", category: "Guillotineuse", site: "GRANITE DRC STD", accountingCode: "", supplier: "" },
    { id: 97, name: "SCIE WILSON", internalId: "EQ-0116", serialNumber: "", category: "Scie circulaire", site: "GRANITE DRC STD", accountingCode: "", supplier: "" },
    { id: 98, name: "CONVOYEURS A ROULEAUX", internalId: "EQ-0117", serialNumber: "", category: "N.D.", site: "GRANITE DRC STD", accountingCode: "", supplier: "" },
    { id: 99, name: "HYSTER 50", internalId: "EQ-0119", serialNumber: "", category: "Chargeur", site: "GRANITE DRC STD", accountingCode: "", supplier: "" },
    { id: 100, name: "SCIE A CABLE - N5", internalId: "EQ-0109", serialNumber: "", category: "Scie à Cable Usine", site: "GRANITE DRC STD", accountingCode: "", supplier: "" },
    { id: 101, name: "SCIE 3METRES - N3", internalId: "EQ-0110", serialNumber: "", category: "Scie circulaire", site: "GRANITE DRC STD", accountingCode: "", supplier: "" },
    { id: 102, name: "SCIE 3METRES - N4", internalId: "EQ-0111", serialNumber: "", category: "Scie circulaire", site: "GRANITE DRC STD", accountingCode: "", supplier: "" },
    { id: 103, name: "SCIE 2|5METRES - N1", internalId: "EQ-0112", serialNumber: "", category: "Scie circulaire", site: "GRANITE DRC STD", accountingCode: "", supplier: "" },
    { id: 104, name: "SCIE 3|5METRES - N2", internalId: "EQ-0113", serialNumber: "", category: "Scie circulaire", site: "GRANITE DRC STD", accountingCode: "", supplier: "" },
    { id: 105, name: "SFERA 825", internalId: "EQ-0115", serialNumber: "", category: "Scie CNC", site: "GRANITE DRC STD", accountingCode: "", supplier: "" },
    { id: 106, name: "TEREX TL 260", internalId: "EQ-0118", serialNumber: "", category: "Chargeur", site: "GRANITE DRC STD", accountingCode: "", supplier: "" }
];
function seedEquipment() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Start seeding equipment...');
        for (const item of rawData) {
            if (!item.internalId) {
                console.warn(`Skipping item without internalId: ${item.name}`);
                continue;
            }
            // 1. Find or Create Category
            let category = null;
            if (item.category) {
                category = yield prisma.equipmentCategory.upsert({
                    where: { name: item.category },
                    update: {},
                    create: { name: item.category },
                });
            }
            // 2. Find or Create Site
            let site = null;
            if (item.site) {
                site = yield prisma.maintenanceSite.upsert({
                    where: { name: item.site },
                    update: {},
                    create: { name: item.site },
                });
            }
            // 3. Upsert Equipment
            yield prisma.equipment.upsert({
                where: { internalId: item.internalId },
                update: {},
                create: {
                    name: item.name,
                    internalId: item.internalId,
                    serialNumber: item.serialNumber,
                    accountingCode: item.accountingCode,
                    supplier: item.supplier,
                    categoryId: category === null || category === void 0 ? void 0 : category.id,
                    siteId: site === null || site === void 0 ? void 0 : site.id,
                    status: 'Active'
                }
            });
        }
        console.log('Seeding finished.');
    });
}
