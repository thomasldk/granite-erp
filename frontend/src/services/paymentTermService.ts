
import api from './api';

export interface PaymentTerm {
    id: string;
    code: number;
    label_en: string;
    label_fr: string;
    days: number;
    depositPercentage: number;
    discountPercentage: number; // V8
    discountDays: number; // V8
    requiresText: boolean; // V8
}

export const getPaymentTerms = async (): Promise<PaymentTerm[]> => {
    const response = await api.get('/payment-terms');
    return response.data;
};

export const generatePaymentTermLabel = (code: number, days: number, deposit: number, lang: string = 'fr', discountPercent: number = 0, discountDays: number = 0): string => {
    if (lang === 'fr') {
        switch (code) {
            case 1: return "Paiement à la commande";
            case 2: return `${deposit}% à la commande, le solde avant expédition`;
            case 3: return `${deposit}% à la commande le solde ${days} jours net après date de production`; // Changed facturation to production
            case 4: return `net ${days} jours avec ${discountPercent}% d'escompte si paiement reçu par VIREMENT BANCAIRE chez DRC avant ${discountDays} jours`; // V8
            case 5: return `net ${days} jours après date de facturation`;
            case 6: return "A déterminer";
            case 7: return "Saisie manuelle"; // V8
            case 8: return `${deposit}% à la commande et ${discountPercent}% de remise sur le solde si paiement reçu sous ${discountDays} jours terme ${days} jours`; // V8
            default: return "";
        }
    } else {
        switch (code) {
            case 1: return "Payment upon confirmation of order";
            case 2: return `${deposit}% deposit on confirmation of order, balance before delivery`;
            case 3: return `${deposit}% deposit on confirmation of order, balance net ${days} days after date of production`; // Changed
            case 4: return `net ${days} days and ${discountPercent}% discount if payment by WIRE TRANSFER is received before ${discountDays} days from date of invoice`; // V8
            case 5: return `net ${days} days of date of invoice`;
            case 6: return "Terms to be confirmed";
            case 7: return "Manual entry"; // V8
            case 8: return `${deposit}% deposit on confirmation of order and ${discountPercent}% discount on balance if payment received before ${discountDays} days from date of invoice`; // V8
            default: return "";
        }
    }
};
