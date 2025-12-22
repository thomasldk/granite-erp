
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding V8 Payment Terms (Verified)...');

    const terms = [
        {
            code: 1,
            label_fr: "Paiement à la commande",
            label_en: "Payment upon confirmation of order",
            days: 0,
            depositPercentage: 100,
            discountPercentage: 0,
            discountDays: 0,
            requiresText: false
        },
        {
            code: 2,
            label_fr: "% de dépôt à la commande, le solde avant expédition",
            label_en: "% deposit on confirmation of order, balance before delivery",
            days: 0,
            depositPercentage: 20, // Default 20
            discountPercentage: 0,
            discountDays: 0,
            requiresText: false
        },
        {
            code: 3,
            label_fr: "% de dépôt à la commande, le solde jours net après date de production",
            label_en: "% deposit on confirmation of order, balance net days after date of production",
            days: 35, // Default 35
            depositPercentage: 20, // Default 20
            discountPercentage: 0,
            discountDays: 0,
            requiresText: false
        },
        {
            code: 4,
            label_fr: "net jours avec % d'escompte si paiement reçu par VIREMENT BANCAIRE chez DRC avant jours net date de facturation",
            label_en: "net days and % discount if payment by WIRE TRANSFER is received before days from date of invoice",
            days: 35, // Default Payment Days (Y)
            depositPercentage: 0,
            discountPercentage: 7, // Default 7%
            discountDays: 10,     // Default 10 days (Z)
            requiresText: false
        },
        {
            code: 5,
            label_fr: "net jours après date de facturation",
            label_en: "net days of date of invoice",
            days: 35, // Default 35
            depositPercentage: 0,
            discountPercentage: 0,
            discountDays: 0,
            requiresText: false
        },
        {
            code: 6,
            label_fr: "A déterminer",
            label_en: "Terms to be confirmed",
            days: 0,
            depositPercentage: 0,
            discountPercentage: 0,
            discountDays: 0,
            requiresText: false
        },
        {
            code: 7,
            label_fr: "Saisie manuelle",
            label_en: "Manual entry",
            days: 0,
            depositPercentage: 0,
            discountPercentage: 0,
            discountDays: 0,
            requiresText: true // Custom Input
        },
        {
            code: 8,
            label_fr: "% de dépôt à la commande et % de remise sur le solde si paiement reçu sous jours",
            label_en: "% deposit on confirmation of order and % discount on balance if payment received before days from date of invoice",
            days: 35, // Default Payment Days (Final due date)
            depositPercentage: 20, // Default Deposit
            discountPercentage: 7, // Default Discount
            discountDays: 10,     // Default Discount Validity (Z)
            requiresText: false
        }
    ];

    for (const t of terms) {
        await prisma.paymentTerm.upsert({
            where: { code: t.code },
            update: {
                label_fr: t.label_fr,
                label_en: t.label_en,
                requiresText: t.requiresText
            },
            create: {
                code: t.code,
                label_fr: t.label_fr,
                label_en: t.label_en,
                days: t.days,
                depositPercentage: t.depositPercentage,
                discountPercentage: t.discountPercentage,
                discountDays: t.discountDays,
                requiresText: t.requiresText
            }
        });
        console.log(`Upserted Code ${t.code}`);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
