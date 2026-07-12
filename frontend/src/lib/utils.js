import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number in Indian currency style with compact units.
 * e.g. 1500 → ₹1.5K, 150000 → ₹1.5L, 1500000 → ₹15L, 10000000 → ₹1Cr
 * @param {number} value - The number to format
 * @param {boolean} [withSymbol=true] - Whether to prefix ₹
 * @param {number} [decimals=1] - Decimal places for compact form
 * @returns {string}
 */
export function formatINR(value, withSymbol = true, decimals = 1) {
  const prefix = withSymbol ? '₹' : '';
  const num = Number(value) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  let formatted;
  if (abs >= 1_00_00_000) {          // ≥ 10 Crore
    formatted = `${(abs / 1_00_00_000).toFixed(decimals)}Cr`;
  } else if (abs >= 1_00_000) {      // ≥ 1 Lakh
    formatted = `${(abs / 1_00_000).toFixed(decimals)}L`;
  } else if (abs >= 1_000) {         // ≥ 1 Thousand
    formatted = `${(abs / 1_000).toFixed(decimals)}K`;
  } else {
    // Small number — show full with Indian locale
    formatted = abs.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  return `${sign}${prefix}${formatted}`;
}

/**
 * Full precision Indian locale format for tables/tooltips.
 * e.g. 1500000 → ₹15,00,000.00
 */
export function formatINRFull(value, withSymbol = true) {
  const prefix = withSymbol ? '₹' : '';
  const num = Number(value) || 0;
  return `${prefix}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a plain number compactly (no ₹ symbol).
 * e.g. 1500000 → 15L
 */
export function formatCompact(value, decimals = 1) {
  return formatINR(value, false, decimals);
}

/**
 * Format a phone number to standard Indian format: +91 XXXXX XXXXX
 */
export function formatPhone(phone) {
  if (!phone) return '';
  // Remove non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+91')) {
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    }
  }
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    return `+91 ${cleaned.substring(3, 8)} ${cleaned.substring(8, 13)}`;
  }
  return phone;
}
