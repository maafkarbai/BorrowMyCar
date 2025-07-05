import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import UserAvatar from '../../components/UserAvatar';

describe('UserAvatar', () => {
  it('renders initials when no profile image is provided', () => {
    const user = { name: 'John Doe' };
    render(<UserAvatar user={user} />);
    
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders single initial for single name', () => {
    const user = { name: 'John' };
    render(<UserAvatar user={user} />);
    
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders first and last name initials for multiple names', () => {
    const user = { name: 'John Michael Doe' };
    render(<UserAvatar user={user} />);
    
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders default initial when no name is provided', () => {
    const user = {};
    render(<UserAvatar user={user} />);
    
    expect(screen.getByText('U')).toBeInTheDocument();
  });

  it('renders profile image when provided', () => {
    const user = { 
      name: 'John Doe', 
      profileImage: 'https://example.com/avatar.jpg' 
    };
    render(<UserAvatar user={user} />);
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'John Doe');
  });

  it('applies correct size classes', () => {
    const user = { name: 'John Doe' };
    const { container } = render(<UserAvatar user={user} size="lg" />);
    
    const avatar = container.querySelector('div');
    expect(avatar).toHaveClass('w-12', 'h-12');
  });

  it('applies custom className', () => {
    const user = { name: 'John Doe' };
    const { container } = render(<UserAvatar user={user} className="custom-class" />);
    
    const avatar = container.querySelector('div');
    expect(avatar).toHaveClass('custom-class');
  });
});