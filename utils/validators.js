// utils/validators.js

export const sanitizeCarData = (data) => {
  const sanitized = {};

  if (data.title) sanitized.title = data.title.toString().trim();
  if (data.description)
    sanitized.description = data.description.toString().trim();
  if (data.city) sanitized.city = data.city.toString().trim();
  if (data.transmission)
    sanitized.transmission = data.transmission.toString().trim();
  if (data.fuelType) sanitized.fuelType = data.fuelType.toString().trim();
  if (data.specifications)
    sanitized.specifications = data.specifications.toString().trim();

  if (data.pricePerDay) sanitized.pricePerDay = parseFloat(data.pricePerDay);
  if (data.year) sanitized.year = parseInt(data.year);
  if (data.mileage) sanitized.mileage = parseInt(data.mileage);

  if (data.availabilityFrom) sanitized.availabilityFrom = data.availabilityFrom;
  if (data.availabilityTo) sanitized.availabilityTo = data.availabilityTo;

  return sanitized;
};

export const validateCarData = (data, isPartial = false) => {
  const errors = [];

  // Required fields for new car creation
  if (!isPartial) {
    if (!data.title || data.title.length < 3) {
      errors.push("Title must be at least 3 characters long");
    }
    if (!data.description || data.description.length < 10) {
      errors.push("Description must be at least 10 characters long");
    }
    if (!data.city || data.city.length < 2) {
      errors.push("City is required and must be at least 2 characters");
    }
    if (!data.pricePerDay || data.pricePerDay <= 0) {
      errors.push("Price per day must be greater than 0");
    }
    if (!data.availabilityFrom) {
      errors.push("Availability start date is required");
    }
    if (!data.availabilityTo) {
      errors.push("Availability end date is required");
    }
  }

  // Field validations
  if (
    data.title !== undefined &&
    (typeof data.title !== "string" || data.title.length > 100)
  ) {
    errors.push("Title must be a string with maximum 100 characters");
  }

  if (
    data.pricePerDay !== undefined &&
    (isNaN(data.pricePerDay) ||
      data.pricePerDay < 1 ||
      data.pricePerDay > 10000)
  ) {
    errors.push("Price per day must be between 1 and 10,000 AED");
  }

  if (data.year !== undefined) {
    const currentYear = new Date().getFullYear();
    if (isNaN(data.year) || data.year < 1990 || data.year > currentYear + 1) {
      errors.push(`Year must be between 1990 and ${currentYear + 1}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default { sanitizeCarData, validateCarData };
