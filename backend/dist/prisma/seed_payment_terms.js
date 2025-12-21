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
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const paymentTerms = [
            {
                code: 1,
                label_en: 'Payment upon confirmation of order',
                label_fr: 'Paiement à la commande',
                days: 0,
                depositPercentage: 0, // Assuming full payment is not a "deposit" in this logic, but maybe 100? Start with 0 unless "deposit" means partial. The text says "Payment upon confirmation", implying 100%. But user said "deposit % if the mode asks". Mode 1 doesn't explicitly say "deposit", it says "Payment". I will treat as 0 days net.
            },
            {
                code: 2,
                label_en: '5% deposit on confirmation of order, balance before delivery',
                label_fr: '5% à la commande, le solde avant expédition',
                days: 0, // Balance before delivery implies effectively immediate upon completion? Or just 0 net terms after invoice? unique logic.
                depositPercentage: 5.0,
            },
            {
                code: 3,
                label_en: '5% deposit on confirmation of order, balance net 30 days after date of invoice',
                label_fr: '5% à la commande le solde 30 jours net après date de facturation',
                days: 30,
                depositPercentage: 5.0,
            },
            {
                code: 4,
                label_en: 'net 30 days and 5% discount if payment by WIRE TRANSFER is received before', // Truncated in image? "received before 30 days"? No, "received before..." maybe date? Re-reading user providing text: "net 30 days and 5% discount if payment by WIRE TRANSFER is received before" ... likely "before X days". French says "avant 30 jours".
                label_fr: 'net 30 jours avec 5% d\'escompte si paiement reçu par VIREMENT BANCAIRE chez DRC avant 30 jours',
                days: 30,
                depositPercentage: 0,
            },
            {
                code: 5,
                label_en: 'net 30 days of date of invoice',
                label_fr: 'net 30 jours après date de facturation',
                days: 30,
                depositPercentage: 0,
            },
            {
                code: 6,
                label_en: 'Terms to be confirmed',
                label_fr: 'A déterminer',
                days: 0,
                depositPercentage: 0,
            },
        ];
        console.log('Seeding payment terms...');
        for (const term of paymentTerms) {
            yield prisma.paymentTerm.upsert({
                where: { code: term.code },
                update: term,
                create: term,
            });
        }
        console.log('Payment terms seeded successfully.');
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
