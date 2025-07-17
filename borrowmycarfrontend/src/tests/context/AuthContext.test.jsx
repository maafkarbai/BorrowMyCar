import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import API from '../../api';

// Mock API
vi.mock('../../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Test component to access context
const TestComponent = () => {
  const { user, login, logout, loading, error } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="error">{error || 'No Error'}</div>
      <div data-testid="user">{user ? user.name : 'No User'}</div>
      <button onClick={() => login({ email: 'test@test.com', password: 'password' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const AuthWrapper = ({ children }) => (
  <AuthProvider>
    {children}
  </AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with default state', () => {
      render(
        <AuthWrapper>
          <TestComponent />
        </AuthWrapper>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
      expect(screen.getByTestId('error')).toHaveTextContent('No Error');
      expect(screen.getByTestId('user')).toHaveTextContent('No User');
    });
  });

  describe('Login', () => {
    it('should login successfully', async () => {
      const mockUser = { id: '1', name: 'John Doe', email: 'john@test.com' };
      API.post.mockResolvedValue({
        data: { success: true, user: mockUser }
      });

      render(
        <AuthWrapper>
          <TestComponent />
        </AuthWrapper>
      );

      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('John Doe');
      });

      expect(API.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@test.com',
        password: 'password',
        rememberMe: false,
      });
    });

    it('should handle login error', async () => {
      const errorMessage = 'Invalid credentials';
      API.post.mockRejectedValue({
        response: { data: { message: errorMessage } }
      });

      render(
        <AuthWrapper>
          <TestComponent />
        </AuthWrapper>
      );

      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
      });
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      // First login
      const mockUser = { id: '1', name: 'John Doe', email: 'john@test.com' };
      API.post.mockResolvedValue({
        data: { success: true, user: mockUser }
      });

      render(
        <AuthWrapper>
          <TestComponent />
        </AuthWrapper>
      );

      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('John Doe');
      });

      // Then logout
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No User');
      });
    });
  });

  describe('Profile Check', () => {
    it('should check auth status on mount', async () => {
      const mockUser = { id: '1', name: 'John Doe', email: 'john@test.com' };
      API.get.mockResolvedValue({
        data: { success: true, data: { user: mockUser } }
      });

      render(
        <AuthWrapper>
          <TestComponent />
        </AuthWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('John Doe');
      });

      expect(API.get).toHaveBeenCalledWith('/auth/profile');
    });

    it('should handle profile check error', async () => {
      API.get.mockRejectedValue({
        response: { status: 401 }
      });

      render(
        <AuthWrapper>
          <TestComponent />
        </AuthWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('No User');
    });
  });
});