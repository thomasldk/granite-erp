
import api from './api';

export interface PaymentTerm {
    id: string;
    code: number;
    label_en: string;
    label_fr: string;
    days: number;
    depositPercentage: number;
}

export const getPaymentTerms = async (): Promise<PaymentTerm[]> => {
    const response = await api.get('/payment-terms');
    return response.data;
};

export const generatePaymentTermLabel = (code: number, days: number, deposit: number, lang: string = 'fr'): string => {
    if (lang === 'fr') {
        switch (code) {
            case 1: return "Paiement à la commande";
            case 2: return `${deposit}% à la commande, le solde avant expédition`;
            case 3: return `${deposit}% à la commande le solde ${days} jours net après date de facturation`;
            case 4: return `net ${days} jours avec ${deposit}% d'escompte si paiement reçu par VIREMENT BANCAIRE chez DRC avant ${days} jours`;
            case 5: return `net ${days} jours après date de facturation`;
            case 6: return "A déterminer";
            default: return "";
        }
    } else {
        switch (code) {
            case 1: return "Payment upon confirmation of order";
            case 2: return `${deposit}% deposit on confirmation of order, balance before delivery`;
            case 3: return `${deposit}% deposit on confirmation of order, balance net ${days} days after date of invoice`;
            case 4: return `net ${days} days and ${deposit}% discount if payment by WIRE TRANSFER is received before`;
            case 5: return `net ${days} days of date of invoice`;
            case 6: return "Terms to be confirmed";
            default: return "";
        }
    }
};
