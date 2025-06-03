import { Booking } from '../models/Booking.js';
import { Car } from '../models/Car.js';

export const createBooking = async (req, res) => {
  const { carId, startDate, endDate } = req.body;
  try {
    const booking = await Booking.create({
      car: carId,
      renter: req.user._id,
      startDate,
      endDate,
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Booking failed' });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ renter: req.user._id }).populate('car');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};

export const getBookingsForOwner = async (req, res) => {
  try {
    const cars = await Car.find({ owner: req.user._id });
    const carIds = cars.map(car => car._id);
    const bookings = await Booking.find({ car: { $in: carIds } }).populate('car renter');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Error getting owner bookings' });
  }
};

export const updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const booking = await Booking.findById(req.params.id).populate('car');
    if (!booking || booking.car.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }
    booking.status = status;
    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update booking status' });
  }
};
