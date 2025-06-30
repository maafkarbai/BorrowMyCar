import { describe, it, expect } from 'vitest';

describe('Simple Test', () => {
  it('should pass basic assertion', () => {
    expect(2 + 2).toBe(4);
  });

  it('should work with strings', () => {
    expect('hello').toBe('hello');
  });

  it('should work with objects', () => {
    const mockCar = {
      _id: '1',
      title: 'Toyota Camry',
      price: 150,
      owner: {
        name: 'John Doe',
        phone: '+971501234567'
      }
    };

    expect(mockCar.title).toBe('Toyota Camry');
    expect(mockCar.owner.name).toBe('John Doe');
    expect(mockCar.owner.phone).toBe('+971501234567');
  });
});