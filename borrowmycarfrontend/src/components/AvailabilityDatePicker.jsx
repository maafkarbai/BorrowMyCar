// components/AvailabilityDatePicker.jsx - Smart date picker with availability restrictions
import React, { useState, useEffect } from "react";
import API from "../api";

const AvailabilityDatePicker = ({
  carId,
  startDate,
  endDate,
  onDateChange,
  onError,
  className = ""
}) => {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unavailableDates, setUnavailableDates] = useState([]);

  // Fetch car availability data
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!carId) return;
      
      try {
        setLoading(true);
        const response = await API.get(`/cars/${carId}/availability`);
        const data = response.data.data;
        
        setAvailability(data);
        setUnavailableDates(data.unavailableDates || []);
      } catch (error) {
        console.error("Error fetching availability:", error);
        onError?.("Failed to load availability data");
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [carId, onError]);

  // Helper function to check if a date is unavailable
  const isDateUnavailable = (dateString) => {
    if (!availability) return false;
    
    const checkDate = new Date(dateString);
    const availableFrom = new Date(availability.availabilityFrom);
    const availableTo = new Date(availability.availabilityTo);
    
    // Check if outside availability range
    if (checkDate < availableFrom || checkDate > availableTo) {
      return true;
    }
    
    // Check if date falls within any booked period
    return unavailableDates.some(booking => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      return checkDate >= bookingStart && checkDate <= bookingEnd;
    });
  };

  // Helper function to get the minimum selectable date
  const getMinDate = () => {
    const today = new Date();
    const availableFrom = availability ? new Date(availability.availabilityFrom) : today;
    return availableFrom > today ? availableFrom : today;
  };

  // Helper function to get the maximum selectable date
  const getMaxDate = () => {
    return availability ? new Date(availability.availabilityTo) : null;
  };

  // Helper function to get next available date after a given date
  const getNextAvailableDate = (fromDate) => {
    if (!availability) return null;
    
    const checkDate = new Date(fromDate);
    const maxDate = getMaxDate();
    
    while (checkDate <= maxDate) {
      if (!isDateUnavailable(checkDate.toISOString().split('T')[0])) {
        return checkDate;
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    
    return null;
  };

  // Handle start date change
  const handleStartDateChange = (e) => {
    const selectedDate = e.target.value;
    
    if (isDateUnavailable(selectedDate)) {
      const nextAvailable = getNextAvailableDate(new Date(selectedDate));
      if (nextAvailable) {
        onDateChange({
          startDate: nextAvailable.toISOString().split('T')[0],
          endDate: endDate
        });
        onError?.(`Selected date was unavailable. Moved to next available: ${nextAvailable.toLocaleDateString()}`);
      } else {
        onError?.("No available dates found after selected date");
      }
      return;
    }
    
    // If end date is before start date or start date is unavailable, clear end date
    let newEndDate = endDate;
    if (endDate && selectedDate >= endDate) {
      newEndDate = "";
    }
    
    onDateChange({
      startDate: selectedDate,
      endDate: newEndDate
    });
  };

  // Handle end date change
  const handleEndDateChange = (e) => {
    const selectedDate = e.target.value;
    
    if (isDateUnavailable(selectedDate)) {
      onError?.("Selected end date is not available");
      return;
    }
    
    // Check if any days between start and end are unavailable
    if (startDate) {
      const start = new Date(startDate);
      const end = new Date(selectedDate);
      const checkDate = new Date(start);
      checkDate.setDate(checkDate.getDate() + 1); // Start checking from day after start date
      
      while (checkDate < end) {
        if (isDateUnavailable(checkDate.toISOString().split('T')[0])) {
          onError?.("There are unavailable dates in the selected range");
          return;
        }
        checkDate.setDate(checkDate.getDate() + 1);
      }
    }
    
    onDateChange({
      startDate,
      endDate: selectedDate
    });
  };

  // Generate disabled dates pattern for input (not all browsers support this)
  const _getDisabledDatesPattern = () => {
    // This is a basic implementation - modern browsers have limited support
    // for disabling specific dates in date inputs
    return "";
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-12 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!availability) {
    return (
      <div className={`text-red-600 text-sm ${className}`}>
        Unable to load availability data
      </div>
    );
  }

  const minDate = getMinDate()?.toISOString().split('T')[0];
  const maxDate = getMaxDate()?.toISOString().split('T')[0];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Availability Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <div className="font-medium text-blue-800 mb-1">Availability Period</div>
        <div className="text-blue-700">
          {new Date(availability.availabilityFrom).toLocaleDateString()} - {new Date(availability.availabilityTo).toLocaleDateString()}
        </div>
        {unavailableDates.length > 0 && (
          <div className="mt-2 text-blue-600">
            {unavailableDates.length} booking{unavailableDates.length !== 1 ? 's' : ''} during this period
          </div>
        )}
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Start Date
        </label>
        <input
          type="date"
          value={startDate}
          onChange={handleStartDateChange}
          min={minDate}
          max={maxDate}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
          required
        />
      </div>

      {/* End Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          End Date
        </label>
        <input
          type="date"
          value={endDate}
          onChange={handleEndDateChange}
          min={startDate || minDate}
          max={maxDate}
          disabled={!startDate}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          required
        />
      </div>

      {/* Booking Constraints Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>• Minimum rental: {availability.minimumRentalDays} day{availability.minimumRentalDays !== 1 ? 's' : ''}</div>
        <div>• Maximum rental: {availability.maximumRentalDays} day{availability.maximumRentalDays !== 1 ? 's' : ''}</div>
        {unavailableDates.length > 0 && (
          <div>• Some dates may be unavailable due to existing bookings</div>
        )}
      </div>

      {/* Visual Calendar Legend */}
      {unavailableDates.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm font-medium text-gray-700 mb-2">Unavailable Periods:</div>
          <div className="space-y-1 text-xs">
            {unavailableDates.slice(0, 3).map((booking, index) => (
              <div key={index} className="flex justify-between text-gray-600">
                <span>
                  {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                </span>
                <span className="capitalize text-orange-600 font-medium">
                  {booking.status}
                </span>
              </div>
            ))}
            {unavailableDates.length > 3 && (
              <div className="text-gray-500 italic">
                +{unavailableDates.length - 3} more booking{unavailableDates.length - 3 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityDatePicker;