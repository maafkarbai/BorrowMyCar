import { Car } from '../models/Car.js';

export const createCar = async (req, res) => {
  try {
    const car = await Car.create({
      ...req.body,
      owner: req.user._id,
    });
    res.status(201).json(car);
  } catch (err) {
    res.status(500).json({ message: 'Error creating car', err });
  }
};

export const getAllCars = async (req, res) => {
  try {
    const { city, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

    const query = {};
    if (city) query.city = city;
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
    }

    const cars = await Car.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('owner', 'name email');

    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching cars' });
  }
};




export const getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });
    res.json(car);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching car' });
  }
};

export const updateCar = async (req, res) => {
  try {
    const car = await Car.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      req.body,
      { new: true }
    );
    if (!car) return res.status(404).json({ message: 'Car not found or not authorized' });
    res.json(car);
  } catch (err) {
    res.status(500).json({ message: 'Error updating car' });
  }
};

export const deleteCar = async (req, res) => {
  try {
    const car = await Car.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!car) return res.status(404).json({ message: 'Car not found or not authorized' });
    res.json({ message: 'Car deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting car' });
  }
};


