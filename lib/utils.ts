import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("hu-HU").format(new Date(date));
}

export function generateQuoteNumber(sequence: number, year?: number): string {
  const y = year ?? new Date().getFullYear();
  return `SL-${y}-${String(sequence).padStart(3, "0")}`;
}

export function validateTaxNumber(taxNumber: string): boolean {
  // Magyar adószám: 8 jegy-2 jegy-2 jegy (pl. 12345678-1-42)
  return /^\d{8}-\d{1}-\d{2}$/.test(taxNumber.trim());
}

export function calcLineTotal(
  quantity: number,
  fullWidth: number | null,
  unitPrice: number,
  discountPercent: number,
  unit: string,
  pieceCount?: number | null
): number {
  let baseQty: number;
  if (unit === "m2" && fullWidth) {
    const totalFm = pieceCount != null ? pieceCount * quantity : quantity;
    baseQty = totalFm * fullWidth;
  } else if (unit === "fm" && pieceCount != null) {
    baseQty = pieceCount * quantity;
  } else {
    baseQty = quantity;
  }
  return baseQty * unitPrice * (1 - discountPercent / 100);
}

export function calcEffectiveDiscount(
  lineDiscount: number,
  globalDiscount: number
): number {
  // Kombinált kedvezmény: 1 - (1-d1)*(1-d2)
  return 100 * (1 - ((100 - lineDiscount) / 100) * ((100 - globalDiscount) / 100));
}

export const VAT_RATE = 0.27;

export const STATUS_LABELS: Record<string, string> = {
  draft: "Piszkozat",
  sent: "Elküldve",
  accepted: "Elfogadva",
  declined: "Elutasítva",
};

export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
};
