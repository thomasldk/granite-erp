export const formatPhoneNumber = (value: string): string => {
    if (!value) return '';

    // Remove all non-digit characters
    let digits = value.replace(/\D/g, '');

    // Since we enforce +1, we strip any leading 1 which is likely the country code
    // Area codes strictly cannot start with 0 or 1, so this is safe for NA numbers.
    if (digits.startsWith('1')) {
        digits = digits.substring(1);
    }

    // Limit to 10 digits
    digits = digits.slice(0, 10);

    // If empty after stripping (e.g. user just deleted everything but the +1), return empty
    if (digits.length === 0) return '';

    // Build the formatted string
    let formatted = '+1';

    if (digits.length > 0) {
        formatted += ` (${digits.slice(0, 3)}`;
    }

    if (digits.length >= 3) {
        formatted += `) ${digits.slice(3, 6)}`;
    }

    if (digits.length >= 6) {
        formatted += `-${digits.slice(6)}`;
    }

    return formatted;
};
