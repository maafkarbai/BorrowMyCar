import mongoose from 'mongoose';

const carSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: String,
  description: String,
  city: String,
  pricePerDay: Number,
  images: [String], // array of URLs
  availabilityFrom: Date,
  availabilityTo: Date,
}, { timestamps: true });

export const Car = mongoose.model('Car', carSchema);
