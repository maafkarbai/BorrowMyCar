import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import PaymentForm from '../../components/PaymentForm';
import { StripeProvider } from '../../context/StripeProvider';

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    elements: vi.fn(() => ({
      create: vi.fn(() => ({
        mount: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn()
      }))
    })),
    confirmCardPayment: vi.fn(() => Promise.resolve({ error: null }))
  }))
}));

const mockStripeProvider = {
  stripe: {
    elements: vi.fn(() => ({
      create: vi.fn(() => ({
        mount: vi.fn(),
        on: vi.fn(),
        destroy: vi.fn()
      }))
    })),
    confirmCardPayment: vi.fn(() => Promise.resolve({ error: null }))
  },
  elements: {
    create: vi.fn(() => ({
      mount: vi.fn(),
      on: vi.fn(),
      destroy: vi.fn()
    }))
  }
};

describe('PaymentForm Component', () => {
  const mockProps = {
    amount: 500,
    onSuccess: vi.fn(),
    onError: vi.fn(),
    bookingDetails: {
      carId: '123',
      startDate: '2024-06-01',
      endDate: '2024-06-05'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders payment form with correct amount', () => {
    render(
      <StripeProvider value={mockStripeProvider}>
        <PaymentForm {...mockProps} />
      </StripeProvider>
    );

    expect(screen.getByText('AED 500')).toBeInTheDocument();
    expect(screen.getByText('Pay Now')).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(
      <StripeProvider value={mockStripeProvider}>
        <PaymentForm {...mockProps} />
      </StripeProvider>
    );

    const payButton = screen.getByText('Pay Now');
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
    });
  });

  test('handles payment submission', async () => {
    render(
      <StripeProvider value={mockStripeProvider}>
        <PaymentForm {...mockProps} />
      </StripeProvider>
    );

    // Fill in form fields
    const nameInput = screen.getByLabelText('Cardholder Name');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    const payButton = screen.getByText('Pay Now');
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalled();
    });
  });

  test('handles payment errors', async () => {
    const errorStripeProvider = {
      ...mockStripeProvider,
      stripe: {
        ...mockStripeProvider.stripe,
        confirmCardPayment: vi.fn(() => Promise.resolve({ 
          error: { message: 'Payment failed' } 
        }))
      }
    };

    render(
      <StripeProvider value={errorStripeProvider}>
        <PaymentForm {...mockProps} />
      </StripeProvider>
    );

    const payButton = screen.getByText('Pay Now');
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(mockProps.onError).toHaveBeenCalledWith('Payment failed');
    });
  });

  test('displays loading state during payment', async () => {
    render(
      <StripeProvider value={mockStripeProvider}>
        <PaymentForm {...mockProps} />
      </StripeProvider>
    );

    const payButton = screen.getByText('Pay Now');
    fireEvent.click(payButton);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });
});