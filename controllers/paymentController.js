// controllers/paymentController.js - ENHANCED with Multiple Payment Methods
import Stripe from "stripe";
import Booking from "../models/Booking.js";
import Car from "../models/Car.js";
import { User } from "../models/User.js";
import { handleAsyncError } from "../utils/errorHandler.js";
import { sendNotificationEmail } from "../utils/emailService.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Get Stripe Configuration for Frontend
export const getStripeConfig = handleAsyncError(async (req, res) => {
  res.json({
    success: true,
    data: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      currency: "aed",
      country: "AE",
    },
  });
});

// Create Payment Intent for Stripe
export const createPaymentIntent = handleAsyncError(async (req, res) => {
  const { amount, currency = "aed", bookingId, metadata = {} } = req.body;
  const userId = req.user.id;

  try {
    // Validate booking if provided
    let booking = null;
    if (bookingId) {
      booking = await Booking.findById(bookingId)
        .populate("car", "title images owner")
        .populate("renter", "name email");

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
          code: "BOOKING_NOT_FOUND",
        });
      }

      if (booking.renter._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to pay for this booking",
          code: "UNAUTHORIZED",
        });
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert AED to fils
      currency: currency.toLowerCase(),
      metadata: {
        bookingId: bookingId || "",
        userId: userId,
        carTitle: booking?.car?.title || "",
        ...metadata,
      },
      description: booking
        ? `Car Rental: ${booking.car.title} for ${booking.totalDays} days`
        : "BorrowMyCar Payment",
      receipt_email: req.user.email,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update booking with payment intent if applicable
    if (booking) {
      booking.paymentIntentId = paymentIntent.id;
      booking.paymentStatus = "pending";
      await booking.save();
    }

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: amount,
        currency: currency,
      },
    });
  } catch (error) {
    console.error("Payment Intent Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment intent",
      code: "PAYMENT_INTENT_FAILED",
    });
  }
});

// Process Multiple Payment Methods
export const processPayment = handleAsyncError(async (req, res) => {
  const {
    paymentMethod,
    bookingId,
    amount,
    currency = "aed",
    cardDetails,
    bankDetails,
    walletDetails,
    cashDetails,
  } = req.body;

  const userId = req.user.id;

  try {
    // Get booking details
    const booking = await Booking.findById(bookingId)
      .populate("car", "title images owner price")
      .populate("renter", "name email phone");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
        code: "BOOKING_NOT_FOUND",
      });
    }

    if (booking.renter._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to pay for this booking",
        code: "UNAUTHORIZED",
      });
    }

    let paymentResult = {};

    switch (paymentMethod) {
      case "stripe":
        paymentResult = await processStripePayment({
          booking,
          amount,
          currency,
          cardDetails,
        });
        break;

      case "bank_transfer":
        paymentResult = await processBankTransfer({
          booking,
          amount,
          currency,
          bankDetails,
        });
        break;

      case "digital_wallet":
        paymentResult = await processDigitalWallet({
          booking,
          amount,
          currency,
          walletDetails,
        });
        break;

      case "cash_on_pickup":
        paymentResult = await processCashOnPickup({
          booking,
          amount,
          currency,
          cashDetails,
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Unsupported payment method",
          code: "UNSUPPORTED_PAYMENT_METHOD",
        });
    }

    res.json({
      success: true,
      data: paymentResult,
    });
  } catch (error) {
    console.error("Payment processing error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Payment processing failed",
      code: "PAYMENT_PROCESSING_FAILED",
    });
  }
});

// Stripe Payment Processing
const processStripePayment = async ({
  booking,
  amount,
  currency,
  cardDetails,
}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata: {
        bookingId: booking._id.toString(),
        carId: booking.car._id.toString(),
        renterId: booking.renter._id.toString(),
      },
      description: `Car Rental: ${booking.car.title}`,
      receipt_email: booking.renter.email,
    });

    // Update booking
    booking.paymentIntentId = paymentIntent.id;
    booking.paymentMethod = "stripe";
    booking.paymentStatus = "pending";
    await booking.save();

    return {
      paymentId: paymentIntent.id,
      paymentMethod: "stripe",
      status: "pending",
      clientSecret: paymentIntent.client_secret,
      amount: amount,
      currency: currency,
    };
  } catch (error) {
    throw new Error(`Stripe payment failed: ${error.message}`);
  }
};

// Bank Transfer Processing
const processBankTransfer = async ({
  booking,
  amount,
  currency,
  bankDetails,
}) => {
  try {
    const transferId = `BT_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Update booking
    booking.paymentMethod = "bank_transfer";
    booking.paymentStatus = "pending";
    booking.transactionId = transferId;
    booking.paymentDetails = {
      bank: bankDetails.bank,
      accountNumber: bankDetails.accountNumber.slice(-4), // Store only last 4 digits
      transferInstructions: generateBankTransferInstructions(
        amount,
        transferId
      ),
    };
    await booking.save();

    // Send email with bank transfer instructions
    await sendBankTransferInstructions(booking, transferId);

    return {
      paymentId: transferId,
      paymentMethod: "bank_transfer",
      status: "pending",
      instructions: generateBankTransferInstructions(amount, transferId),
      amount: amount,
      currency: currency,
    };
  } catch (error) {
    throw new Error(`Bank transfer processing failed: ${error.message}`);
  }
};

// Digital Wallet Processing
const processDigitalWallet = async ({
  booking,
  amount,
  currency,
  walletDetails,
}) => {
  try {
    const walletId = `DW_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Update booking
    booking.paymentMethod = "digital_wallet";
    booking.paymentStatus = "pending";
    booking.transactionId = walletId;
    booking.paymentDetails = {
      walletType: walletDetails.walletType,
      phoneNumber: walletDetails.phoneNumber,
    };
    await booking.save();

    // Process different wallet types
    let instructions = "";
    switch (walletDetails.walletType) {
      case "apple_pay":
      case "google_pay":
      case "samsung_pay":
        instructions =
          "Payment request sent to your device. Please complete payment on your phone.";
        break;
      case "paypal":
        instructions = "PayPal payment link sent to your email.";
        break;
      case "careem_pay":
        instructions = `Payment request sent to Careem Pay account: ${walletDetails.phoneNumber}`;
        break;
      case "beam_wallet":
        instructions = `Payment request sent to Beam Wallet: ${walletDetails.phoneNumber}`;
        break;
      default:
        instructions = "Digital wallet payment initiated.";
    }

    return {
      paymentId: walletId,
      paymentMethod: "digital_wallet",
      status: "pending",
      instructions: instructions,
      amount: amount,
      currency: currency,
    };
  } catch (error) {
    throw new Error(`Digital wallet processing failed: ${error.message}`);
  }
};

// Cash on Pickup Processing
const processCashOnPickup = async ({
  booking,
  amount,
  currency,
  cashDetails,
}) => {
  try {
    const cashId = `CASH_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Update booking
    booking.paymentMethod = "cash_on_pickup";
    booking.paymentStatus = "pending_pickup";
    booking.transactionId = cashId;
    booking.paymentDetails = {
      meetingLocation: cashDetails.meetingLocation,
      meetingTime: cashDetails.meetingTime,
      notes: cashDetails.notes,
      amount: amount,
    };
    await booking.save();

    // Notify car owner about cash pickup arrangement
    await notifyOwnerCashPickup(booking);

    return {
      paymentId: cashId,
      paymentMethod: "cash_on_pickup",
      status: "pending_pickup",
      meetingDetails: {
        location: cashDetails.meetingLocation,
        time: cashDetails.meetingTime,
        notes: cashDetails.notes,
        amount: amount,
        currency: currency,
      },
    };
  } catch (error) {
    throw new Error(`Cash on pickup processing failed: ${error.message}`);
  }
};

// Confirm Payment Success
export const confirmPayment = handleAsyncError(async (req, res) => {
  const { paymentIntentId, bookingId } = req.body;

  try {
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
        code: "PAYMENT_NOT_COMPLETED",
      });
    }

    // Update booking
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

    // Send confirmation emails
    await sendPaymentConfirmation(booking);

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

// Get Payment History
export const getPaymentHistory = handleAsyncError(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;

  const bookings = await Booking.find({
    renter: userId,
    paymentStatus: { $in: ["paid", "failed", "refunded", "pending"] },
  })
    .populate("car", "title make model year images")
    .sort({ paidAt: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Booking.countDocuments({
    renter: userId,
    paymentStatus: { $in: ["paid", "failed", "refunded", "pending"] },
  });

  res.json({
    success: true,
    data: {
      payments: bookings,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    },
  });
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

  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentSuccess(event.data.object);
      break;
    case "payment_intent.payment_failed":
      await handlePaymentFailure(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Handle Payment Success (Webhook)
const handlePaymentSuccess = async (paymentIntent) => {
  try {
    const booking = await Booking.findOne({
      paymentIntentId: paymentIntent.id,
    }).populate("car renter");

    if (booking) {
      booking.status = "confirmed";
      booking.paymentStatus = "paid";
      booking.transactionId = paymentIntent.id;
      booking.paidAt = new Date();
      await booking.save();

      // Send confirmation notifications
      await sendPaymentConfirmation(booking);
    }
  } catch (error) {
    console.error("Error handling payment success:", error);
  }
};

// Handle Payment Failure (Webhook)
const handlePaymentFailure = async (paymentIntent) => {
  try {
    const booking = await Booking.findOne({
      paymentIntentId: paymentIntent.id,
    });

    if (booking) {
      booking.paymentStatus = "failed";
      await booking.save();
    }
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
};

// Utility Functions
const generateBankTransferInstructions = (amount, transferId) => {
  return {
    bankName: "Emirates NBD",
    accountName: "BorrowMyCar DMCC",
    accountNumber: "1234567890",
    iban: "AE07 0331 2345 6789 0123 456",
    swiftCode: "EBILAEAD",
    amount: `AED ${amount}`,
    reference: transferId,
    instructions: [
      `Transfer exactly AED ${amount} to the above account`,
      `Use reference number: ${transferId}`,
      "Transfer must be completed within 24 hours",
      "Send transfer receipt to payments@borrowmycar.ae",
    ],
  };
};

const sendBankTransferInstructions = async (booking, transferId) => {
  // Implementation depends on your email service
  console.log(`Sending bank transfer instructions for booking ${booking._id}`);
};

const notifyOwnerCashPickup = async (booking) => {
  // Implementation depends on your notification service
  console.log(`Notifying owner about cash pickup for booking ${booking._id}`);
};

const sendPaymentConfirmation = async (booking) => {
  // Implementation depends on your email service
  console.log(`Sending payment confirmation for booking ${booking._id}`);
};
