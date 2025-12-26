import axios from 'axios';
import { formatPostalCode } from '../utils/formatters';

/**
 * Looks up the postal code for a given address string using OpenStreetMap (Nominatim).
 * @param address The full address string (e.g., "123 Main St, Montreal, QC, Canada")
 * @returns The formatted postal code or null if not found.
 */
export const lookupPostalCode = async (address: string): Promise<string | null> => {
    if (!address || address.length < 5) return null;

    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: address,
                format: 'json',
                addressdetails: 1,
                limit: 1
            }
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            if (result.address && result.address.postcode) {
                return formatPostalCode(result.address.postcode);
            }
        }
        return null;
    } catch (error) {
        console.error("Geocoding lookup failed:", error);
        return null;
    }
};
