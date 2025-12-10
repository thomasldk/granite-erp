
import { create } from 'xmlbuilder2';

const xmlSnippet = `
<root>
    <generation>
        <devis>
            <externe>
                <ligne No="L1" Ref="A renseigner" TAG="1" GRANITE="Caledonia" QTY="1" Item="step" Longeur="96" Largeur="24" Epaisseur="7" Description="A renseigner" Poid_Tot="0,00" Prix_unitaire_interne="738,70" Prix_unitaire_externe="738,70" Unité="/ / ea" Prix_interne="738,70" Prix_externe="738,70"/>
            </externe>
        </devis>
    </generation>
</root>
`;

function parse() {
    try {
        const doc = create(xmlSnippet);
        const obj = doc.end({ format: 'object' }) as any;

        console.log("Parsed Object:", JSON.stringify(obj, null, 2));

        const ligne = obj.root.generation.devis.externe.ligne;
        const l = ligne;

        const get = (key: string) => l[`@${key}`] || l[key];
        const getVar = (...keys: string[]) => {
            for (const k of keys) {
                const v = get(k);
                if (v !== undefined && v !== null && v !== '') return v;
            }
            return undefined;
        };
        const parseFloatComma = (val: string | undefined): number => {
            if (!val) return 0;
            return parseFloat(val.toString().replace(',', '.'));
        };

        const result = {
            tag: getVar('TAG', 'Tag', 'Ref Tag', 'No'),
            length: parseFloatComma(getVar('Longeur', 'Length')),
            unitPrice: parseFloatComma(getVar('Prix_unitaire_externe', 'Unit Price USD$')),
            unitPriceCad: parseFloatComma(getVar('Prix_unitaire_interne', 'Unit Price CAD$')),
        };

        console.log("Extracted:", result);

    } catch (e) {
        console.error(e);
    }
}

parse();
