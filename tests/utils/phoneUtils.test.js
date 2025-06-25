import { formatUAEPhone, validateUAEPhone } from '../../utils/phoneUtils.js';

describe('Phone Utils', () => {
  describe('validateUAEPhone', () => {
    it('should validate correct UAE phone numbers', () => {
      const validNumbers = [
        '0501234567',
        '0561234567',
        '0541234567',
        '0521234567',
        '0507654321',
        '+971501234567',
        '971501234567',
      ];

      validNumbers.forEach(number => {
        expect(validateUAEPhone(number)).toBe(true);
      });
    });

    it('should reject invalid UAE phone numbers', () => {
      const invalidNumbers = [
        '123456789',
        '0401234567', // Invalid prefix
        '050123456',  // Too short
        '05012345678', // Too long
        '9715012345',  // Missing digit
        '+1234567890', // Non-UAE country code
        'abc123456',   // Contains letters
        '',            // Empty string
        null,          // Null
        undefined,     // Undefined
      ];

      invalidNumbers.forEach(number => {
        expect(validateUAEPhone(number)).toBe(false);
      });
    });
  });

  describe('formatUAEPhone', () => {
    it('should format local UAE numbers correctly', () => {
      const testCases = [
        { input: '0501234567', expected: '0501234567' },
        { input: '501234567', expected: '0501234567' },
        { input: '050 123 4567', expected: '0501234567' },
        { input: '050-123-4567', expected: '0501234567' },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(formatUAEPhone(input)).toBe(expected);
      });
    });

    it('should format international UAE numbers correctly', () => {
      const testCases = [
        { input: '+971501234567', expected: '0501234567' },
        { input: '971501234567', expected: '0501234567' },
        { input: '+971 50 123 4567', expected: '0501234567' },
        { input: '971-50-123-4567', expected: '0501234567' },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(formatUAEPhone(input)).toBe(expected);
      });
    });

    it('should handle edge cases', () => {
      const testCases = [
        { input: '', expected: '' },
        { input: '   ', expected: '' },
        { input: '050', expected: '050' },
        { input: 'abc', expected: 'abc' },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(formatUAEPhone(input)).toBe(expected);
      });
    });
  });
});