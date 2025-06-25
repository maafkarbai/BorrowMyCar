import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import api from '../../api';

// Mock the API
vi.mock('../../api');

// Test component to use the auth context
const TestComponent = () => {
  const { user, login, logout, loading, error } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="error">{error || 'No error'}</div>
      <button onClick={() => login('test@example.com', 'password')}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const renderWithAuthProvider = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('provides initial state correctly', () => {
    renderWithAuthProvider(<TestComponent />);

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    expect(screen.getByTestId('error')).toHaveTextContent('No error');
  });

  it('loads user from localStorage on mount', async () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
    const mockToken = 'fake-jwt-token';

    localStorage.setItem('borrowmycar_user', JSON.stringify(mockUser));
    localStorage.setItem('borrowmycar_token', mockToken);

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('John Doe');
    });
  });

  it('handles login successfully', async () => {
    const mockResponse = {
      data: {
        success: true,
        user: { id: '1', name: 'John Doe', email: 'test@example.com' },
        token: 'fake-jwt-token',
      },
    };

    api.post.mockResolvedValueOnce(mockResponse);

    renderWithAuthProvider(<TestComponent />);

    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    });

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password',
    });

    // Check localStorage
    expect(localStorage.getItem('borrowmycar_user')).toBe(
      JSON.stringify(mockResponse.data.user)
    );
    expect(localStorage.getItem('borrowmycar_token')).toBe(mockResponse.data.token);
  });

  it('handles login failure', async () => {
    const mockError = {
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    };

    api.post.mockRejectedValueOnce(mockError);

    renderWithAuthProvider(<TestComponent />);

    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
    });
  });

  it('handles logout correctly', async () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
    const mockToken = 'fake-jwt-token';

    localStorage.setItem('borrowmycar_user', JSON.stringify(mockUser));
    localStorage.setItem('borrowmycar_token', mockToken);

    renderWithAuthProvider(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('John Doe');
    });

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(localStorage.getItem('borrowmycar_user')).toBeNull();
    expect(localStorage.getItem('borrowmycar_token')).toBeNull();
  });

  it('sets authorization header after login', async () => {
    const mockResponse = {
      data: {
        success: true,
        user: { id: '1', name: 'John Doe', email: 'test@example.com' },
        token: 'fake-jwt-token',
      },
    };

    api.post.mockResolvedValueOnce(mockResponse);

    renderWithAuthProvider(<TestComponent />);

    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('John Doe');
    });

    // Check if API defaults were updated
    expect(api.defaults.headers.common.Authorization).toBe('Bearer fake-jwt-token');
  });

  it('clears authorization header after logout', async () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
    const mockToken = 'fake-jwt-token';

    localStorage.setItem('borrowmycar_user', JSON.stringify(mockUser));
    localStorage.setItem('borrowmycar_token', mockToken);
    api.defaults.headers.common.Authorization = `Bearer ${mockToken}`;

    renderWithAuthProvider(<TestComponent />);

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(api.defaults.headers.common.Authorization).toBeUndefined();
  });

  it('handles signup correctly', async () => {
    const mockResponse = {
      data: {
        success: true,
        user: { id: '1', name: 'John Doe', email: 'john@example.com' },
        token: 'fake-jwt-token',
        message: 'Account created successfully',
      },
    };

    api.post.mockResolvedValueOnce(mockResponse);

    const TestSignupComponent = () => {
      const { signup, user, loading, error } = useAuth();

      return (
        <div>
          <div data-testid="user">{user ? user.name : 'No user'}</div>
          <div data-testid="loading">{loading ? 'Loading' : 'Not loading'}</div>
          <div data-testid="error">{error || 'No error'}</div>
          <button
            onClick={() => signup({
              name: 'John Doe',
              email: 'john@example.com',
              password: 'password123',
              phone: '0501234567',
              role: 'renter',
            })}
          >
            Signup
          </button>
        </div>
      );
    };

    renderWithAuthProvider(<TestSignupComponent />);

    const signupButton = screen.getByText('Signup');
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('John Doe');
    });

    expect(api.post).toHaveBeenCalledWith('/auth/signup', {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      phone: '0501234567',
      role: 'renter',
    });
  });

  it('persists authentication state across page reloads', () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
    const mockToken = 'fake-jwt-token';

    localStorage.setItem('borrowmycar_user', JSON.stringify(mockUser));
    localStorage.setItem('borrowmycar_token', mockToken);

    renderWithAuthProvider(<TestComponent />);

    expect(screen.getByTestId('user')).toHaveTextContent('John Doe');
    expect(api.defaults.headers.common.Authorization).toBe(`Bearer ${mockToken}`);
  });
});