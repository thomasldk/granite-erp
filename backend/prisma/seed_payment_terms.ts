
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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
        await prisma.paymentTerm.upsert({
            where: { code: term.code },
            update: term,
            create: term,
        });
    }

    console.log('Payment terms seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
