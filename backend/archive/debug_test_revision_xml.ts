
import { XmlService } from './src/services/xmlService';

const xmlService = new XmlService();

// MOCK DATA
const originalQuote = {
    id: 'ORIGINAL-ID-123',
    reference: 'DRC25-0001-C0R0',
    client: {
        name: 'Client A',
        language: 'fr',
        unitSystem: 'Imperial',
        addresses: [{ city: 'Quebec', line1: '123 Rue A', zipCode: 'G1G1G1' }],
        contacts: [{ firstName: 'Jean', lastName: 'Dupont', mobile: '555-555-5555' }]
    },
    project: { name: 'Projet Test', measurementSystem: 'Imperial' },
    material: { name: 'Granit X', quality: 'Standard' },
    contact: { firstName: 'Jean', lastName: 'Dupont', mobile: '555-555-5555' },
    representative: { firstName: 'Rep', lastName: 'One' }
};

const newQuote = {
    id: 'NEW-ID-456',
    reference: 'DRC25-0001-C0R1',
    // ... cloned data ...
};

// SIMULATE PATHS
const safe = (s: string) => s.replace(/[^a-zA-Z0-9-]/g, '_');
const oldFilename = `${safe(originalQuote.reference)}_${safe(originalQuote.client.name)}_${safe(originalQuote.project.name)}_${safe(originalQuote.material.name)}.xlsx`;
const newFilename = `${safe(newQuote.reference)}_${safe(originalQuote.client.name)}_${safe(originalQuote.project.name)}_${safe(originalQuote.material.name)}.xlsx`;

const revisionData = {
    sourceQuoteId: originalQuote.id,
    cible: `f:\\nxerp\\${originalQuote.project.name}\\${newFilename}`,
    ancienNom: oldFilename,
    nouveauNom: newFilename,
    ancienCouleur: originalQuote.material.name,
    nouveauCouleur: originalQuote.material.name,
    ancienQualite: originalQuote.material.quality,
    nouvelleQualite: originalQuote.material.quality
};

// GENERATE
console.log('--- GENERATING REVISION XML ---');
xmlService.generateQuoteXml(originalQuote, originalQuote.representative, revisionData)
    .then(xml => {
        console.log(xml);
        console.log('\n--- CHECKS ---');
        console.log(`Action 'reviser': ${xml.includes("action='reviser'") ? 'PASS' : 'FAIL'}`);
        console.log(`QuoteID matches Original (${originalQuote.id}): ${xml.includes(`quoteId='${originalQuote.id}'`) ? 'PASS' : 'FAIL'}`);
        console.log(`Ancien Nom Present: ${xml.includes(`ancienNom='${oldFilename}'`) ? 'PASS' : 'FAIL'}`);
        console.log(`Nouveau Nom Present: ${xml.includes(`nouveauNom='${newFilename}'`) ? 'PASS' : 'FAIL'}`);
    })
    .catch(err => console.error(err));
