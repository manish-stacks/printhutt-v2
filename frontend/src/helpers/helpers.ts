// Frontend helpers. Backend-only helpers (shiprocketAuth, fshipToken,
// getUTCDayRange) have moved to the backend repo.

export function isEmail(input: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
}

export const generateSlug = (text: string): string => {
    return text
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
};

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
export function formatCurrency(amount?: number | string | null): string {
    const n = Number(amount);
    return INR.format(Math.round(Number.isFinite(n) ? n : 0));
}

export function randomNumber(max: number, min: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + 400;
}

export function formatDate(date?: string | Date | null): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date ?? Date.now()));
}
