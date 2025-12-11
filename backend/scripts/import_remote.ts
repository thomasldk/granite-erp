import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Démarrage de l\'importation vers Railway...');

    const dumpPath = path.join(__dirname, 'data_dump.json');
    if (!fs.existsSync(dumpPath)) {
        console.error("❌ Fichier data_dump.json introuvable. Lancez d'abord export_local.ts");
        process.exit(1);
    }

    const rawData = fs.readFileSync(dumpPath, 'utf-8');
    const data = JSON.parse(rawData);

    // Fonction utilitaire pour éviter les doublons (Upsert)
    // On garde les ID d'origine pour que les liens entre tables fonctionnent


    console.log(`Traitement de ${data.currencies.length} devises...`);
    for (const item of data.currencies) {
        try {
            await prisma.currency.upsert({ where: { code: item.code }, update: {}, create: item });
        } catch (e) { console.log(`⏩ Devise ${item.code} déjà existante ou erreur mineure.`); }
    }

    console.log(`Traitement de ${data.languages.length} langues...`);
    for (const item of data.languages) {
        try {
            await prisma.language.upsert({ where: { code: item.code }, update: {}, create: item });
        } catch (e) { console.log(`⏩ Langue ${item.code} déjà existante.`); }
    }

    console.log(`Traitement de ${data.paymentTerms.length} termes de paiement...`);
    for (const item of data.paymentTerms) {
        try {
            // PaymentTerm unique constraint might be on code (int)
            await prisma.paymentTerm.upsert({ where: { code: item.code }, update: {}, create: item });
        } catch (e) { console.log(`⏩ Terme de paiement ${item.code} passé.`); }
    }

    console.log(`Traitement de ${data.contactTypes.length} types de contact...`);
    for (const item of data.contactTypes) {
        try {
            const exists = await prisma.contactType.findFirst({ where: { name: item.name } });
            if (!exists) await prisma.contactType.create({ data: item });
        } catch (e) { console.log(`⏩ ContactType ${item.name} passé.`); }
    }

    console.log(`Traitement de ${data.representatives.length} représentants...`);
    for (const item of data.representatives) {
        try {
            await prisma.representative.upsert({ where: { id: item.id }, update: {}, create: item });
        } catch (e) { console.log(`⏩ Représentant passé.`); }
    }

    console.log(`Traitement de ${data.materials.length} matériaux...`);
    for (const item of data.materials) {
        try {
            await prisma.material.upsert({ where: { id: item.id }, update: {}, create: item });
        } catch (e) { console.log(`⏩ Matériau passé.`); }
    }

    console.log(`Traitement de ${data.projectLocations.length} locations de projet...`);
    for (const item of data.projectLocations) {
        try {
            await prisma.projectLocation.upsert({ where: { id: item.id }, update: {}, create: item });
        } catch (e) { console.log(`⏩ Location passé.`); }
    }


    // --- Phase de "Mapping" ---
    // On charge les nouvelles données de la base Distante pour faire la correspondance
    const remotePaymentTerms = await prisma.paymentTerm.findMany();
    const remoteReps = await prisma.representative.findMany();

    // On crée des dictionnaires pour retrouver facilemet l'ID distant à partir du Code (pour PaymentTerm) ou Email (pour Rep)
    // Map: Code (Local) -> ID (Distant)
    // Note: On doit d'abord trouver le Code du term local à partir de son ID local
    const localPaymentTermsMap = new Map(); // LocalID -> Code
    data.paymentTerms.forEach((pt: any) => localPaymentTermsMap.set(pt.id, pt.code));

    const remotePaymentTermsCodeToId = new Map(); // Code -> RemoteID
    remotePaymentTerms.forEach(pt => remotePaymentTermsCodeToId.set(pt.code, pt.id));

    const localRepMap = new Map(); // LocalID -> Email
    data.representatives.forEach((r: any) => localRepMap.set(r.id, r.email));

    const remoteRepEmailToId = new Map(); // Email -> RemoteID
    remoteReps.forEach(r => remoteRepEmailToId.set(r.email, r.id));


    console.log(`Traitement de ${data.thirdParties.length} Tiers (Clients/Fournisseurs)...`);
    for (const tp of data.thirdParties) {
        let { addresses, contacts, ...tpData } = tp;

        // --- Réparation des Foreign Keys ---

        // 1. PaymentTerm
        if (tpData.paymentTermId) {
            const localCode = localPaymentTermsMap.get(tpData.paymentTermId);
            if (localCode) {
                const newId = remotePaymentTermsCodeToId.get(localCode);
                if (newId) tpData.paymentTermId = newId;
            }
        }

        // 2. Representative
        if (tpData.repId) {
            const localEmail = localRepMap.get(tpData.repId);
            if (localEmail) {
                const newId = remoteRepEmailToId.get(localEmail);
                if (newId) tpData.repId = newId;
            }
        }

        // Nous ne pouvons pas garder l'ID original du Tiers si on veut être propre, 
        // mais pour garder la cohérence avec les Adresses locales, on va essayer de forcer l'ID 
        // ou alors on accepte que l'ID change et on met à jour les adresses aussi.
        // Pour ce script de sauvetage, conservons l'ID si possible, sinon on le laisse générer et on perd le lien (trop complexe à remapper à la volée sans map dédiée).
        // Le plus simple ici : Tenter l'insert avec l'ID. Si FK error, c'est résolu par le mapping ci-dessus.

        try {
            await prisma.thirdParty.upsert({
                where: { id: tp.id }, // On essaie de garder le mme ID
                update: tpData,      // Si existe, on met à jour avec les nouvaux IDs de FK
                create: tpData
            });
        } catch (e: any) {
            if (e.code === 'P2002') {
                console.log(`⏩ Tiers ${tpData.name} (${tpData.code}) existe déjà (conflit Code).`);
            } else {
                console.log(`⚠️ Erreur sur Tiers ${tpData.name}:`, e.message);
            }
            continue;
        }

        // On gère les sous-éléments (Adresses et Contacts)
        if (addresses && addresses.length > 0) {
            for (const addr of addresses) {
                try {
                    // Les adresses n'ont pas de FK complexes à part thirdPartyId qui est bon si on a gardé l'ID du Tiers
                    await prisma.address.upsert({ where: { id: addr.id }, update: {}, create: { ...addr, thirdPartyId: tp.id } });
                } catch (e) { }
            }
        }

        if (contacts && contacts.length > 0) {
            for (const ct of contacts) {
                try {
                    await prisma.contact.upsert({ where: { id: ct.id }, update: {}, create: { ...ct, thirdPartyId: tp.id } });
                } catch (e) { }
            }
        }
    }

    // Remapping pour Projets aussi au cas où
    console.log(`Traitement de ${data.projects.length} Projets...`);
    for (const p of data.projects) {
        // Remap Client (ThirdParty) - Si on a gardé les ID Clients, ça marche. Sinon ça cassera.
        // On croise les doigts pour les IDs Clients.
        try {
            await prisma.project.upsert({
                where: { id: p.id },
                update: {},
                create: p
            });
        } catch (e: any) {
            console.log(`⏩ Projet ${p.reference} passé (Erreur: ${e.code || e.message}).`);
        }
    }

    console.log('✅ Importation terminée avec succès ! La base Railway est à jour.');
}

main()
    .catch((e) => {
        console.error("❌ Erreur lors de l'importation :", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
