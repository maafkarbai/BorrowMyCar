// src/components/BookingPaymentModal.jsx
import { useState, useEffect } from "react";
import { X, Car, Calendar, MapPin, User, CheckCircle } from "lucide-react";
import { useStripe } from "@stripe/react-stripe-js";
import PaymentForm from "./PaymentForm";
import API from "../api";

const BookingPaymentModal = ({ isOpen, onClose, booking, car, onSuccess }) => {
  const stripe = useStripe();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentStep, setPaymentStep] = useState("details"); // 'details', 'payment', 'success'

  useEffect(() => {
    if (isOpen && booking) {
      createPaymentIntent();
    }
  }, [isOpen, booking]);

  const createPaymentIntent = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.post("/payments/create-intent", {
        amount: Math.round(booking.totalCost * 100), // Convert to fils (smallest currency unit)
        currency: "aed",
        bookingId: booking.id,
        carId: car._id,
        metadata: {
          booking_id: booking.id,
          car_title: car.title,
          renter_name: booking.renterName || "Customer",
          rental_days: booking.numberOfDays,
        },
      });

      setClientSecret(response.data.clientSecret);
    } catch (err) {
      console.error("Failed to create payment intent:", err);
      setError("Failed to initialize payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setPaymentStep("success");
    // Call the parent success handler after a short delay
    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 3000);
  };

  const handlePaymentError = (error) => {
    console.error("Payment failed:", error);
    setError(error.message || "Payment failed. Please try again.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {paymentStep === "success"
              ? "Payment Successful!"
              : "Complete Your Booking"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {paymentStep === "details" && (
            <div className="space-y-6">
              {/* Booking Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Car className="w-5 h-5 mr-2 text-green-600" />
                  Booking Summary
                </h3>

                <div className="space-y-3">
                  {/* Car Details */}
                  <div className="flex items-center space-x-3">
                    <img
                      src={car.images?.[0] || "/placeholder-car.jpg"}
                      alt={car.title}
                      className="w-16 h-12 object-cover rounded-lg"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{car.title}</p>
                      <p className="text-sm text-gray-600">{car.city}</p>
                    </div>
                  </div>

                  {/* Rental Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Duration</p>
                        <p className="font-medium">
                          {booking.numberOfDays} day
                          {booking.numberOfDays > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <div>
                        <p className="text-gray-600">Pickup</p>
                        <p className="font-medium">{car.city}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Start Date</p>
                        <p className="font-medium">
                          {new Date(booking.startDate).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">End Date</p>
                        <p className="font-medium">
                          {new Date(booking.endDate).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Cost Breakdown
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Daily Rate</span>
                    <span>AED {car.pricePerDay || car.price}/day</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Duration</span>
                    <span>
                      {booking.numberOfDays} day
                      {booking.numberOfDays > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>AED {booking.totalCost}</span>
                  </div>
                  <div className="border-t border-green-200 pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span className="text-green-600">
                        AED {booking.totalCost}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setPaymentStep("payment")}
                  disabled={loading || !clientSecret}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {loading ? "Preparing..." : "Proceed to Payment"}
                </button>
              </div>
            </div>
          )}

          {paymentStep === "payment" && clientSecret && (
            <div className="space-y-6">
              <PaymentForm
                amount={booking.totalCost}
                currency="AED"
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                loading={loading}
                bookingDetails={{
                  bookingId: booking.id,
                  carId: car._id,
                  days: booking.numberOfDays,
                }}
              />

              <button
                onClick={() => setPaymentStep("details")}
                className="w-full text-gray-600 hover:text-gray-800 text-sm transition-colors"
              >
                ← Back to booking details
              </button>
            </div>
          )}

          {paymentStep === "success" && (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Booking Confirmed!
                </h3>
                <p className="text-gray-600">
                  Your payment was successful. You'll receive a confirmation
                  email shortly.
                </p>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>What's next?</strong>
                  <br />
                  • Check your email for booking details
                  <br />
                  • Contact the car owner for pickup coordination
                  <br />• Prepare required documents for pickup
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPaymentModal;
