// ===== BACKEND IMPLEMENTATION =====

// 1. Install required packages first:
// npm install stripe

// 2. Add to your .env file:
// STRIPE_SECRET_KEY=sk_test_your_stripe_test_secret_key
// STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

// 3. Backend: controllers/paymentController.js
import Stripe from "stripe";
import Booking from "../models/Booking.js";
import { handleAsyncError } from "../utils/errorHandler.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Payment Intent
export const createPaymentIntent = handleAsyncError(async (req, res) => {
  const { bookingId } = req.body;
  const userId = req.user.id;

  // Get booking details
  const booking = await Booking.findById(bookingId)
    .populate("car", "title make model year images")
    .populate("renter", "name email");

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found",
      code: "BOOKING_NOT_FOUND",
    });
  }

  // Verify user owns this booking
  if (booking.renter._id.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized to pay for this booking",
      code: "UNAUTHORIZED",
    });
  }

  // Check if booking is in correct status
  if (!["pending", "approved"].includes(booking.status)) {
    return res.status(400).json({
      success: false,
      message: "Booking cannot be paid for in current status",
      code: "INVALID_BOOKING_STATUS",
    });
  }

  try {
    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(booking.totalPayable * 100), // Convert AED to fils (cents)
      currency: "aed",
      metadata: {
        bookingId: booking._id.toString(),
        carId: booking.car._id.toString(),
        renterId: booking.renter._id.toString(),
        carTitle: booking.car.title,
      },
      description: `Car Rental: ${booking.car.title} for ${booking.totalDays} days`,
      receipt_email: booking.renter.email,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update booking with payment intent ID
    booking.paymentIntentId = paymentIntent.id;
    booking.paymentStatus = "pending";
    await booking.save();

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: booking.totalPayable,
        booking: {
          id: booking._id,
          car: booking.car,
          totalDays: booking.totalDays,
          totalPayable: booking.totalPayable,
          startDate: booking.startDate,
          endDate: booking.endDate,
        },
      },
    });
  } catch (error) {
    console.error("Stripe Payment Intent Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment intent",
      code: "PAYMENT_INTENT_FAILED",
    });
  }
});

// Confirm Payment Success
export const confirmPayment = handleAsyncError(async (req, res) => {
  const { paymentIntentId, bookingId } = req.body;

  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
        code: "PAYMENT_NOT_COMPLETED",
      });
    }

    // Update booking status
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
        code: "BOOKING_NOT_FOUND",
      });
    }

    booking.status = "confirmed";
    booking.paymentStatus = "paid";
    booking.transactionId = paymentIntent.id;
    booking.paidAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: "Payment confirmed successfully",
      data: { booking },
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm payment",
      code: "PAYMENT_CONFIRMATION_FAILED",
    });
  }
});

// Stripe Webhook Handler
export const handleStripeWebhook = handleAsyncError(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log("PaymentIntent succeeded:", paymentIntent.id);

      // Update booking automatically
      try {
        const booking = await Booking.findOne({
          paymentIntentId: paymentIntent.id,
        });

        if (booking) {
          booking.status = "confirmed";
          booking.paymentStatus = "paid";
          booking.transactionId = paymentIntent.id;
          booking.paidAt = new Date();
          await booking.save();
          console.log("Booking updated via webhook:", booking._id);
        }
      } catch (error) {
        console.error("Error updating booking via webhook:", error);
      }
      break;

    case "payment_intent.payment_failed":
      const failedPayment = event.data.object;
      console.log("PaymentIntent failed:", failedPayment.id);

      // Update booking status
      try {
        const booking = await Booking.findOne({
          paymentIntentId: failedPayment.id,
        });

        if (booking) {
          booking.paymentStatus = "failed";
          await booking.save();
        }
      } catch (error) {
        console.error("Error updating failed payment:", error);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Get Payment History
export const getPaymentHistory = handleAsyncError(async (req, res) => {
  const userId = req.user.id;

  const bookings = await Booking.find({
    renter: userId,
    paymentStatus: { $in: ["paid", "failed", "refunded"] },
  })
    .populate("car", "title make model year images")
    .sort({ paidAt: -1 });

  res.json({
    success: true,
    data: { payments: bookings },
  });
});
