import { validateCarData, sanitizeCarData } from '../../utils/validators.js';

describe('Validators', () => {
  describe('validateCarData', () => {
    it('should validate correct car data', () => {
      const validCarData = {
        title: 'Toyota Camry 2023',
        description: 'Luxury sedan in excellent condition',
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        color: 'White',
        price: 150,
        transmission: 'Automatic',
        fuelType: 'Petrol',
        seatingCapacity: 5,
        city: 'Dubai',
        plateNumber: 'D12345',
      };

      const result = validateCarData(validCarData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for missing required fields', () => {
      const incompleteCarData = {
        description: 'Missing title',
        make: 'Toyota',
      };

      const result = validateCarData(incompleteCarData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required');
      expect(result.errors).toContain('Model is required');
      expect(result.errors).toContain('Year is required');
      expect(result.errors).toContain('Price is required');
    });

    it('should validate year range', () => {
      const carDataOldYear = {
        title: 'Old Car',
        make: 'Toyota',
        model: 'Camry',
        year: 1980,
        price: 100,
        transmission: 'Manual',
        fuelType: 'Petrol',
        seatingCapacity: 4,
        city: 'Dubai',
      };

      const result = validateCarData(carDataOldYear);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Year must be between 1990 and current year + 1');
    });

    it('should validate price range', () => {
      const carDataInvalidPrice = {
        title: 'Test Car',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        price: -50,
        transmission: 'Automatic',
        fuelType: 'Petrol',
        seatingCapacity: 5,
        city: 'Dubai',
      };

      const result = validateCarData(carDataInvalidPrice);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Price must be greater than 0');
    });

    it('should validate seating capacity', () => {
      const carDataInvalidSeating = {
        title: 'Test Car',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        price: 150,
        transmission: 'Automatic',
        fuelType: 'Petrol',
        seatingCapacity: 15,
        city: 'Dubai',
      };

      const result = validateCarData(carDataInvalidSeating);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Seating capacity must be between 2 and 12');
    });

    it('should validate enum fields', () => {
      const carDataInvalidEnums = {
        title: 'Test Car',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        price: 150,
        transmission: 'InvalidTransmission',
        fuelType: 'InvalidFuel',
        seatingCapacity: 5,
        city: 'Dubai',
      };

      const result = validateCarData(carDataInvalidEnums);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Transmission must be one of: Manual, Automatic, CVT');
      expect(result.errors).toContain('Fuel type must be one of: Petrol, Diesel, Hybrid, Electric');
    });
  });

  describe('sanitizeCarData', () => {
    it('should sanitize car data correctly', () => {
      const dirtyCarData = {
        title: '  Toyota Camry 2023  ',
        description: '  Luxury sedan  ',
        make: '  TOYOTA  ',
        model: '  camry  ',
        year: '2023',
        color: '  white  ',
        price: '150.00',
        transmission: '  automatic  ',
        fuelType: '  PETROL  ',
        seatingCapacity: '5',
        city: '  dubai  ',
        plateNumber: '  d12345  ',
        mileage: '50000',
      };

      const sanitized = sanitizeCarData(dirtyCarData);

      expect(sanitized.title).toBe('Toyota Camry 2023');
      expect(sanitized.description).toBe('Luxury sedan');
      expect(sanitized.make).toBe('TOYOTA');
      expect(sanitized.model).toBe('camry');
      expect(sanitized.year).toBe(2023);
      expect(sanitized.color).toBe('white');
      expect(sanitized.price).toBe(150);
      expect(sanitized.transmission).toBe('automatic');
      expect(sanitized.fuelType).toBe('PETROL');
      expect(sanitized.seatingCapacity).toBe(5);
      expect(sanitized.city).toBe('dubai');
      expect(sanitized.plateNumber).toBe('D12345');
      expect(sanitized.mileage).toBe(50000);
    });

    it('should handle missing fields gracefully', () => {
      const partialCarData = {
        title: 'Test Car',
        price: '100',
      };

      const sanitized = sanitizeCarData(partialCarData);

      expect(sanitized.title).toBe('Test Car');
      expect(sanitized.price).toBe(100);
      expect(sanitized.description).toBeUndefined();
      expect(sanitized.make).toBeUndefined();
    });

    it('should handle array fields', () => {
      const carDataWithFeatures = {
        title: 'Test Car',
        features: ['GPS', 'Bluetooth', 'AC'],
      };

      const sanitized = sanitizeCarData(carDataWithFeatures);

      expect(sanitized.features).toEqual(['GPS', 'Bluetooth', 'AC']);
    });

    it('should handle non-array features', () => {
      const carDataWithSingleFeature = {
        title: 'Test Car',
        features: 'GPS',
      };

      const sanitized = sanitizeCarData(carDataWithSingleFeature);

      expect(sanitized.features).toEqual(['GPS']);
    });
  });
});