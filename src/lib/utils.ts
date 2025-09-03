
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getValidImageUrl = (url: string | undefined | null) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        try {
            // new URL() will throw an error for invalid URLs
            new URL(url);
            return url;
        } catch (e) {
            // Invalid URL format, fall through to placeholder
        }
    }
    // Fallback for missing, invalid, or non-http URLs
    return `https://placehold.co/100x100/EFEFEF/AAAAAA/png?text=Product&font=inter`;
};
