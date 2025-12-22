
import { create } from 'xmlbuilder2';

const sampleXml = `<?xml version='1.0'?>
<generation type='Soumission'>
    <meta cible='F:\\nxerp\\...' />
    <devis>
        <pierre Poid='175' prix='750' No='SpecialItem123' quantite='2' unitePoid='lbs' couleur='Ash' />
    </devis>
</generation>`;

function parse() {
    console.log('--- XML PARSING DEBUG ---');
    const doc = create(sampleXml);
    const obj = doc.toObject() as any;

    console.log('Object Structure:', JSON.stringify(obj, null, 2));

    const root = obj.generation;
    const devis = root.devis;
    let items: any[] = [];

    // Mimic xmlService logic
    let lignes = devis.externe?.ligne || devis.externe?.Ligne;
    if (!lignes) {
        lignes = devis.pierre || devis.Pierre;
        console.log('Using fallback: pierre');
    }

    const arr = Array.isArray(lignes) ? items : [lignes];

    for (const p of arr) {
        // Mimic getAtt logic
        const getAtt = (k: string) => {
            // xmlbuilder2 usually uses @ for attributes in toObject
            return p['@' + k] || p[k] || p[k.toLowerCase()] || '';
        };

        const tag = getAtt('TAG') || getAtt('tag') || getAtt('No') || 'Ligne';
        const description = getAtt('description') || getAtt('nom') || getAtt('Nom') || 'Item';

        console.log('--- Item Parsed (Current Logic) ---');
        console.log('Raw Node keys:', Object.keys(p));
        console.log('Tag:', tag);
        console.log('Description:', description);

        // Test extracting No
        console.log('Attribute No:', getAtt('No'));
        console.log('Attribute @No:', p['@No']);
    }
}

parse();
