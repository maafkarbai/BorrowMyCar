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

  it('renders with label and UAE flag', () => {
    render(<PhoneInput {...defaultProps} />);

    expect(screen.getByText('Phone Number')).toBeInTheDocument();
    expect(screen.getByText('🇦🇪')).toBeInTheDocument();
    expect(screen.getByText('+971')).toBeInTheDocument();
  });

  it('displays placeholder text', () => {
    render(<PhoneInput {...defaultProps} placeholder="Enter your phone number" />);

    const input = screen.getByPlaceholderText('Enter your phone number');
    expect(input).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    render(<PhoneInput {...defaultProps} required={true} />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('formats input correctly for UAE numbers', () => {
    render(<PhoneInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    
    // Test typing a local UAE number
    fireEvent.change(input, { target: { value: '501234567' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('0501234567');
  });

  it('handles international UAE numbers correctly', () => {
    render(<PhoneInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    
    // Test typing an international UAE number
    fireEvent.change(input, { target: { value: '971501234567' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('0501234567');
  });

  it('validates UAE phone number format', () => {
    render(<PhoneInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    
    // Test invalid number
    fireEvent.change(input, { target: { value: '123456789' } });
    fireEvent.blur(input);
    
    expect(screen.getByText(/Please enter a valid UAE phone number/i)).toBeInTheDocument();
  });

  it('shows error message when provided', () => {
    render(<PhoneInput {...defaultProps} error="Invalid phone number" />);

    expect(screen.getByText('Invalid phone number')).toBeInTheDocument();
  });

  it('applies error styling when error exists', () => {
    render(<PhoneInput {...defaultProps} error="Invalid phone number" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('removes non-numeric characters', () => {
    render(<PhoneInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: '050abc123def4567' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('0501234567');
  });

  it('handles paste events correctly', () => {
    render(<PhoneInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    
    // Simulate pasting a formatted number
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => '+971 50 123 4567'
      }
    });
    
    expect(mockOnChange).toHaveBeenCalledWith('0501234567');
  });

  it('displays correct prefix for UAE', () => {
    render(<PhoneInput {...defaultProps} />);

    expect(screen.getByText('+971')).toBeInTheDocument();
  });

  it('shows maximum length constraint', () => {
    render(<PhoneInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    
    // Try to enter more than 10 digits
    fireEvent.change(input, { target: { value: '050123456789' } });
    
    // Should be truncated to 10 digits
    expect(mockOnChange).toHaveBeenCalledWith('0501234567');
  });

  it('handles empty value gracefully', () => {
    render(<PhoneInput {...defaultProps} value="" />);

    const input = screen.getByRole('textbox');
    expect(input.value).toBe('');
  });

  it('is disabled when disabled prop is true', () => {
    render(<PhoneInput {...defaultProps} disabled={true} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('focuses on click of the container', () => {
    render(<PhoneInput {...defaultProps} />);

    const container = screen.getByText('+971').closest('div');
    const input = screen.getByRole('textbox');
    
    fireEvent.click(container);
    
    expect(input).toHaveFocus();
  });

  it('validates common UAE mobile prefixes', () => {
    const validPrefixes = ['050', '051', '052', '055', '056'];
    
    validPrefixes.forEach(prefix => {
      render(<PhoneInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: `${prefix}1234567` } });
      
      expect(mockOnChange).toHaveBeenCalledWith(`0${prefix}1234567`);
    });
  });
});