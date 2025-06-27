import i18n from '../i18n';

/**
 * Format currency based on current language
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: AED)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'AED') => {
  const locale = i18n.language === 'ar' ? 'ar-AE' : 'en-AE';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format date based on current language
 * @param {Date|string} date - The date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  const locale = i18n.language === 'ar' ? 'ar-AE' : 'en-AE';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
};

/**
 * Format date and time based on current language
 * @param {Date|string} date - The date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date, options = {}) => {
  const locale = i18n.language === 'ar' ? 'ar-AE' : 'en-AE';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {Date|string} date - The date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  const locale = i18n.language === 'ar' ? 'ar-AE' : 'en-AE';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  // Use Intl.RelativeTimeFormat for modern browsers
  if (typeof Intl.RelativeTimeFormat !== 'undefined') {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    
    if (diffInSeconds < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (diffInSeconds < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (diffInSeconds < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (diffInSeconds < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (diffInSeconds < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  }
  
  // Fallback for older browsers
  if (diffInSeconds < 60) {
    return i18n.language === 'ar' ? 'الآن' : 'now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return i18n.language === 'ar' ? `منذ ${minutes} دقيقة` : `${minutes} minutes ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return i18n.language === 'ar' ? `منذ ${hours} ساعة` : `${hours} hours ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return i18n.language === 'ar' ? `منذ ${days} يوم` : `${days} days ago`;
  }
};

/**
 * Format numbers based on current language
 * @param {number} number - The number to format
 * @param {Object} options - Intl.NumberFormat options
 * @returns {string} Formatted number string
 */
export const formatNumber = (number, options = {}) => {
  const locale = i18n.language === 'ar' ? 'ar-AE' : 'en-AE';
  
  return new Intl.NumberFormat(locale, options).format(number);
};

/**
 * Format phone number for display based on current language
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove non-digits
  const digits = phoneNumber.replace(/\D/g, '');
  
  // UAE phone number formatting
  if (digits.startsWith('971')) {
    // International format: +971 XX XXX XXXX
    const match = digits.match(/^971(\d{2})(\d{3})(\d{4})$/);
    if (match) {
      return `+971 ${match[1]} ${match[2]} ${match[3]}`;
    }
  } else if (digits.startsWith('0')) {
    // Local format: 0XX XXX XXXX
    const match = digits.match(/^0(\d{2})(\d{3})(\d{4})$/);
    if (match) {
      return `0${match[1]} ${match[2]} ${match[3]}`;
    }
  }
  
  return phoneNumber; // Return original if no pattern matches
};