// utils/phoneUtils.js - Create this new file
export const formatUAEPhone = (phone) => {
  if (!phone) return phone;

  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, "");

  // Handle different input formats
  if (cleanPhone.startsWith("971")) {
    // Already has country code: 971501234567
    return `+${cleanPhone}`;
  } else if (cleanPhone.startsWith("00971")) {
    // International format: 00971501234567
    return `+${cleanPhone.substring(2)}`;
  } else if (cleanPhone.startsWith("0") && cleanPhone.length === 10) {
    // Local format: 0501234567
    return `+971${cleanPhone.substring(1)}`;
  } else if (cleanPhone.length === 9) {
    // Without leading zero: 501234567
    return `+971${cleanPhone}`;
  }

  // Return as is if format is unclear
  return phone;
};

export const validateUAEPhone = (phone) => {
  if (!phone) return false;

  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, "");

  // Valid formats:
  // 0501234567 (10 digits starting with 0)
  // 501234567 (9 digits)
  // 971501234567 (12 digits starting with 971)
  // 00971501234567 (14 digits starting with 00971)

  const validPatterns = [
    /^0[5][0-9]{8}$/, // 0501234567 - local format with leading 0
    /^[5][0-9]{8}$/, // 501234567 - local format without leading 0
    /^971[5][0-9]{8}$/, // 971501234567 - with country code
    /^00971[5][0-9]{8}$/, // 00971501234567 - international format
  ];

  return validPatterns.some((pattern) => pattern.test(cleanPhone));
};

export const displayUAEPhone = (phone) => {
  if (!phone) return phone;

  const cleanPhone = phone.replace(/\D/g, "");

  // Convert to local display format (0XX XXX XXXX)
  if (cleanPhone.startsWith("971") && cleanPhone.length === 12) {
    const localNumber = cleanPhone.substring(3);
    return `0${localNumber.substring(0, 2)} ${localNumber.substring(
      2,
      5
    )} ${localNumber.substring(5)}`;
  } else if (cleanPhone.startsWith("0") && cleanPhone.length === 10) {
    return `${cleanPhone.substring(0, 3)} ${cleanPhone.substring(
      3,
      6
    )} ${cleanPhone.substring(6)}`;
  }

  return phone;
};
