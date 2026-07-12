exports.normalizePhone = (phone) => {
  if (!phone) return null;
  // Remove all spaces, dashes, parentheses, etc.
  let cleaned = phone.trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+91')) {
    return cleaned;
  }
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+' + cleaned;
  }
  if (cleaned.length === 10) {
    return '+91' + cleaned;
  }
  // If it doesn't match any of these but has some digits, let's prepend +91 if it's 10 digits
  const justDigits = cleaned.replace(/\D/g, '');
  if (justDigits.length === 10) {
    return '+91' + justDigits;
  }
  return cleaned;
};
