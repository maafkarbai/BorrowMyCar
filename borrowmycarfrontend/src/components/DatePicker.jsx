import React, { useState, useEffect, useRef } from 'react';
import API from '../api';

const DatePicker = ({
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(startDate ? new Date(startDate) : null);
  const [selectedEndDate, setSelectedEndDate] = useState(endDate ? new Date(endDate) : null);
  const [hoverDate, setHoverDate] = useState(null);
  const [selectingEndDate, setSelectingEndDate] = useState(false);
  const containerRef = useRef(null);


  const fullMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];


  // Format full date for display
  const formatFullDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is in the past
  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Check if date is unavailable
  const isDateUnavailable = (date) => {
    if (!availability) return false;
    
    const availableFrom = new Date(availability.availabilityFrom);
    const availableTo = new Date(availability.availabilityTo);
    
    // Check if outside availability range
    if (date < availableFrom || date > availableTo) return true;
    
    // Check if date falls within any booked period
    return unavailableDates.some(booking => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      return date >= bookingStart && date <= bookingEnd;
    });
  };

  // Check if date is in selected range
  const isInSelectedRange = (date) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    return date >= selectedStartDate && date <= selectedEndDate;
  };

  // Check if date is in hover range
  const isInHoverRange = (date) => {
    if (!selectedStartDate || !hoverDate || selectedEndDate) return false;
    const start = selectedStartDate;
    const end = hoverDate;
    return date >= Math.min(start, end) && date <= Math.max(start, end);
  };

  // Get calendar days for a month
  const getCalendarDays = (month, year) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Handle date click
  const handleDateClick = (date) => {
    if (isPastDate(date) || isDateUnavailable(date)) return;

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Starting new selection
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      setSelectingEndDate(true);
    } else if (selectingEndDate) {
      // Selecting end date
      if (date < selectedStartDate) {
        // If clicked date is before start date, make it the new start date
        setSelectedStartDate(date);
        setSelectedEndDate(null);
      } else {
        // Check if any date in range is unavailable
        const dateRange = [];
        const current = new Date(selectedStartDate);
        while (current <= date) {
          dateRange.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
        
        const hasUnavailableDate = dateRange.some(d => isDateUnavailable(d));
        if (hasUnavailableDate) {
          onError?.("Selected date range contains unavailable dates. Please select a different range.");
          return;
        }

        setSelectedEndDate(date);
        setSelectingEndDate(false);
        
        // Trigger callback with selected dates
        setTimeout(() => {
          onDateChange({
            startDate: selectedStartDate.toISOString().split('T')[0],
            endDate: date.toISOString().split('T')[0]
          });
          setIsOpen(false);
        }, 300);
      }
    }
  };

  // Handle mouse enter for hover effect
  const handleMouseEnter = (date) => {
    if (selectingEndDate && selectedStartDate && !selectedEndDate) {
      setHoverDate(date);
    }
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setSelectingEndDate(false);
    setHoverDate(null);
    onDateChange({ startDate: '', endDate: '' });
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch availability data
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

  // Update selected dates when props change
  useEffect(() => {
    setSelectedStartDate(startDate ? new Date(startDate) : null);
    setSelectedEndDate(endDate ? new Date(endDate) : null);
  }, [startDate, endDate]);

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200 rounded-2xl"></div>
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

  const calendarDays = getCalendarDays(currentMonth.getMonth(), currentMonth.getFullYear());
  const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  const nextCalendarDays = getCalendarDays(nextMonth.getMonth(), nextMonth.getFullYear());

  const totalDays = selectedStartDate && selectedEndDate 
    ? Math.ceil((selectedEndDate - selectedStartDate) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Date Input Display */}
      <div 
        className="bg-white border-2 border-gray-200 rounded-2xl p-6 cursor-pointer hover:border-gray-300 hover:shadow-lg transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-6">
              {/* Check-in */}
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Check-in</div>
                <div className="text-lg font-semibold text-gray-900">
                  {selectedStartDate ? formatFullDate(selectedStartDate) : 'Select date'}
                </div>
              </div>
              
              {/* Divider */}
              <div className="h-12 w-px bg-gray-200"></div>
              
              {/* Check-out */}
              <div className="flex-1">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Check-out</div>
                <div className="text-lg font-semibold text-gray-900">
                  {selectedEndDate ? formatFullDate(selectedEndDate) : 'Select date'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Icon and Duration */}
          <div className="flex items-center gap-4 ml-6">
            {totalDays > 0 && (
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</div>
                <div className="text-lg font-semibold text-green-600">{totalDays} day{totalDays !== 1 ? 's' : ''}</div>
              </div>
            )}
            <div className="p-3 bg-gray-100 rounded-xl">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 p-8 max-w-full overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={goToPreviousMonth}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {fullMonths[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </div>
              {selectingEndDate && selectedStartDate && (
                <div className="text-sm text-gray-600">
                  Select your check-out date
                </div>
              )}
              {!selectedStartDate && (
                <div className="text-sm text-gray-600">
                  Select your check-in date
                </div>
              )}
            </div>
            
            <button
              onClick={goToNextMonth}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Current Month */}
            <div>
              <div className="text-center font-semibold text-gray-700 mb-6">
                {fullMonths[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </div>
              
              {/* Days Header */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {daysOfWeek.map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-500 p-3">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={index} className="p-3 h-12"></div>;
                  }

                  const isUnavailable = isPastDate(date) || isDateUnavailable(date);
                  const isSelected = (selectedStartDate && date.getTime() === selectedStartDate.getTime()) ||
                                   (selectedEndDate && date.getTime() === selectedEndDate.getTime());
                  const isInRange = isInSelectedRange(date) || isInHoverRange(date);
                  const isStart = selectedStartDate && date.getTime() === selectedStartDate.getTime();
                  const isEnd = selectedEndDate && date.getTime() === selectedEndDate.getTime();

                  return (
                    <button
                      key={index}
                      onClick={() => handleDateClick(date)}
                      onMouseEnter={() => handleMouseEnter(date)}
                      className={`
                        relative h-12 w-12 text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center
                        ${isUnavailable 
                          ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
                          : 'text-gray-900 hover:bg-blue-50 hover:text-blue-600 cursor-pointer'
                        }
                        ${isSelected 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg scale-105' 
                          : ''
                        }
                        ${isInRange && !isSelected 
                          ? 'bg-blue-100 text-blue-700' 
                          : ''
                        }
                        ${isToday(date) && !isSelected && !isUnavailable
                          ? 'ring-2 ring-blue-200 bg-blue-50 text-blue-700 font-bold' 
                          : ''
                        }
                      `}
                      disabled={isUnavailable}
                    >
                      {date.getDate()}
                      {isStart && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                      {isEnd && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Month */}
            <div className="hidden lg:block">
              <div className="text-center font-semibold text-gray-700 mb-6">
                {fullMonths[nextMonth.getMonth()]} {nextMonth.getFullYear()}
              </div>
              
              {/* Days Header */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {daysOfWeek.map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-500 p-3">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {nextCalendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={index} className="p-3 h-12"></div>;
                  }

                  const isUnavailable = isPastDate(date) || isDateUnavailable(date);
                  const isSelected = (selectedStartDate && date.getTime() === selectedStartDate.getTime()) ||
                                   (selectedEndDate && date.getTime() === selectedEndDate.getTime());
                  const isInRange = isInSelectedRange(date) || isInHoverRange(date);
                  const isStart = selectedStartDate && date.getTime() === selectedStartDate.getTime();
                  const isEnd = selectedEndDate && date.getTime() === selectedEndDate.getTime();

                  return (
                    <button
                      key={index}
                      onClick={() => handleDateClick(date)}
                      onMouseEnter={() => handleMouseEnter(date)}
                      className={`
                        relative h-12 w-12 text-sm font-medium rounded-xl transition-all duration-200 flex items-center justify-center
                        ${isUnavailable 
                          ? 'text-gray-300 cursor-not-allowed bg-gray-50' 
                          : 'text-gray-900 hover:bg-blue-50 hover:text-blue-600 cursor-pointer'
                        }
                        ${isSelected 
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg scale-105' 
                          : ''
                        }
                        ${isInRange && !isSelected 
                          ? 'bg-blue-100 text-blue-700' 
                          : ''
                        }
                        ${isToday(date) && !isSelected && !isUnavailable
                          ? 'ring-2 ring-blue-200 bg-blue-50 text-blue-700 font-bold' 
                          : ''
                        }
                      `}
                      disabled={isUnavailable}
                    >
                      {date.getDate()}
                      {isStart && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                      {isEnd && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selection Summary */}
          {selectedStartDate && selectedEndDate && (
            <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-1">Selected Period</div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatFullDate(selectedStartDate)} → {formatFullDate(selectedEndDate)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-600 mb-1">Duration</div>
                  <div className="text-2xl font-bold text-green-600">
                    {totalDays} day{totalDays !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Footer */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={clearSelection}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors underline"
            >
              Clear Selection
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              {selectedStartDate && selectedEndDate && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
                >
                  Confirm Selection
                </button>
              )}
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Check-in</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Check-out</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-100 rounded"></div>
                <span>Selected range</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-100 rounded"></div>
                <span>Unavailable</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;