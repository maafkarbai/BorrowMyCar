import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PhoneInput from '../../components/PhoneInput';

describe('PhoneInput Component', () => {
  const mockOnChange = vi.fn();
  const defaultProps = {
    value: '',
    onChange: mockOnChange,
    label: 'Phone Number',
    required: true,
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Basic Rendering', () => {
    it('renders with label and UAE flag', () => {
      render(<PhoneInput {...defaultProps} />);

      expect(screen.getByText('Phone Number')).toBeInTheDocument();
      expect(screen.getByText('🇦🇪')).toBeInTheDocument();
      expect(screen.getByText('+971')).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
      render(<PhoneInput {...defaultProps} required={true} />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('is disabled when disabled prop is true', () => {
      render(<PhoneInput {...defaultProps} disabled={true} />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });

  describe('Phone Number Formatting', () => {
    it('formats UAE mobile numbers correctly', () => {
      render(<PhoneInput {...defaultProps} />);
      const input = screen.getByRole('textbox');
      
      fireEvent.change(input, { target: { value: '501234567' } });
      expect(mockOnChange).toHaveBeenCalledWith('0501234567');
    });

    it('handles international UAE numbers', () => {
      render(<PhoneInput {...defaultProps} />);
      const input = screen.getByRole('textbox');
      
      fireEvent.change(input, { target: { value: '971501234567' } });
      expect(mockOnChange).toHaveBeenCalledWith('0501234567');
    });

    it('removes non-numeric characters', () => {
      render(<PhoneInput {...defaultProps} />);
      const input = screen.getByRole('textbox');
      
      fireEvent.change(input, { target: { value: '050abc123def4567' } });
      expect(mockOnChange).toHaveBeenCalledWith('0501234567');
    });

    it('limits input to 10 digits', () => {
      render(<PhoneInput {...defaultProps} />);
      const input = screen.getByRole('textbox');
      
      fireEvent.change(input, { target: { value: '050123456789' } });
      expect(mockOnChange).toHaveBeenCalledWith('0501234567');
    });
  });

  describe('Validation', () => {
    it('shows validation message for invalid numbers', () => {
      render(<PhoneInput {...defaultProps} value="123456" />);
      expect(screen.getByText(/Please enter a valid UAE phone number/i)).toBeInTheDocument();
    });

    it('shows error message when provided', () => {
      render(<PhoneInput {...defaultProps} error="Invalid phone number" />);
      expect(screen.getByText('Invalid phone number')).toBeInTheDocument();
    });

    it('shows checkmark for valid numbers', () => {
      render(<PhoneInput {...defaultProps} value="0501234567" />);
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('handles paste events correctly', () => {
      render(<PhoneInput {...defaultProps} />);
      const input = screen.getByRole('textbox');
      
      fireEvent.paste(input, {
        clipboardData: {
          getData: () => '+971 50 123 4567'
        }
      });
      
      expect(mockOnChange).toHaveBeenCalledWith('0501234567');
    });

    it('focuses input when container is clicked', () => {
      render(<PhoneInput {...defaultProps} />);
      const container = screen.getByText('+971').closest('div');
      const input = screen.getByRole('textbox');
      
      fireEvent.click(container);
      expect(input).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty value gracefully', () => {
      render(<PhoneInput {...defaultProps} value="" />);
      const input = screen.getByRole('textbox');
      expect(input.value).toBe('');
    });

    it('handles null/undefined props gracefully', () => {
      expect(() => {
        render(<PhoneInput value={null} onChange={null} />);
      }).not.toThrow();
    });
  });
});