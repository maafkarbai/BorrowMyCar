// src/components/PaymentModal.jsx - Updated with Payment Service Integration
import { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Building,
  Smartphone,
  Lock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Clock,
  Banknote,
  Wallet,
} from "lucide-react";
import paymentService from "../assets/services/paymentService"; // Import your payment service

const PaymentModal = ({
  isOpen,
  onClose,
  bookingData,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [processing, setProcessing] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
    saveCard: false,
  });
  const [bankForm, setBankForm] = useState({
    bank: "",
    accountNumber: "",
    routingNumber: "",
  });
  const [digitalWalletForm, setDigitalWalletForm] = useState({
    walletType: "apple_pay",
    phoneNumber: "",
  });
  const [cashOnPickupForm, setCashOnPickupForm] = useState({
    meetingLocation: "",
    meetingTime: "",
    notes: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [savedCards, setSavedCards] = useState([]);
  const [selectedSavedCard, setSelectedSavedCard] = useState("");

  // UAE Banks for bank transfer
  const uaeBanks = [
    "Emirates NBD",
    "First Abu Dhabi Bank (FAB)",
    "Abu Dhabi Commercial Bank (ADCB)",
    "Dubai Islamic Bank (DIB)",
    "Mashreq Bank",
    "Commercial Bank of Dubai (CBD)",
    "Union National Bank (UNB)",
    "Ajman Bank",
    "Bank of Sharjah",
    "Invest Bank",
  ];

  // Digital Wallet Options
  const digitalWallets = [
    { id: "apple_pay", name: "Apple Pay", icon: "🍎" },
    { id: "google_pay", name: "Google Pay", icon: "🔵" },
    { id: "samsung_pay", name: "Samsung Pay", icon: "📱" },
    { id: "paypal", name: "PayPal", icon: "💙" },
    { id: "careem_pay", name: "Careem Pay", icon: "🚗" },
    { id: "beam_wallet", name: "Beam Wallet", icon: "💫" },
  ];

  // Payment Methods Configuration
  const paymentMethods = [
    {
      id: "stripe",
      name: "Credit/Debit Card",
      icon: CreditCard,
      description: "Pay securely with Visa, Mastercard, or American Express",
      processing: "Instant",
      fees: "3.5% + AED 1.50",
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      icon: Building,
      description: "Direct bank transfer from UAE banks",
      processing: "1-2 business days",
      fees: "Free",
    },
    {
      id: "digital_wallet",
      name: "Digital Wallet",
      icon: Smartphone,
      description: "Apple Pay, Google Pay, PayPal and more",
      processing: "Instant",
      fees: "2.9% + AED 1.00",
    },
    {
      id: "cash_on_pickup",
      name: "Cash on Pickup",
      icon: Banknote,
      description: "Pay cash when you collect the car",
      processing: "At pickup",
      fees: "Free",
    },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchSavedCards();
    }
  }, [isOpen]);

  const fetchSavedCards = async () => {
    try {
      const cards = await paymentService.getSavedPaymentMethods();
      setSavedCards(cards);
    } catch (error) {
      console.error("Failed to fetch saved cards:", error);
    }
  };

  // Format card number for display
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : v;
  };

  // Format expiry date
  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  // Validation functions
  const validateStripeForm = () => {
    const newErrors = {};

    if (selectedSavedCard) {
      if (!cardForm.cvv || cardForm.cvv.length < 3) {
        newErrors.cvv = "CVV is required";
      }
    } else {
      const cardNumber = cardForm.cardNumber.replace(/\s/g, "");
      if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
        newErrors.cardNumber = "Valid card number is required";
      }

      if (!cardForm.expiryDate || !/^\d{2}\/\d{2}$/.test(cardForm.expiryDate)) {
        newErrors.expiryDate = "Valid expiry date is required (MM/YY)";
      } else {
        const [month, year] = cardForm.expiryDate.split("/");
        const currentDate = new Date();
        const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
        if (expiryDate < currentDate) {
          newErrors.expiryDate = "Card has expired";
        }
      }

      if (!cardForm.cvv || cardForm.cvv.length < 3) {
        newErrors.cvv = "Valid CVV is required";
      }

      if (!cardForm.cardholderName.trim()) {
        newErrors.cardholderName = "Cardholder name is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateBankForm = () => {
    const newErrors = {};

    if (!bankForm.bank) {
      newErrors.bank = "Please select a bank";
    }
    if (!bankForm.accountNumber) {
      newErrors.accountNumber = "Account number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDigitalWallet = () => {
    const newErrors = {};

    if (
      digitalWalletForm.walletType === "careem_pay" ||
      digitalWalletForm.walletType === "beam_wallet"
    ) {
      if (!digitalWalletForm.phoneNumber) {
        newErrors.phoneNumber = "Phone number is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCashOnPickup = () => {
    const newErrors = {};

    if (!cashOnPickupForm.meetingLocation.trim()) {
      newErrors.meetingLocation = "Meeting location is required";
    }

    if (!cashOnPickupForm.meetingTime) {
      newErrors.meetingTime = "Meeting time is required";
    }

    if (!cashOnPickupForm.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCardInputChange = (field, value) => {
    let formattedValue = value;

    if (field === "cardNumber") {
      formattedValue = formatCardNumber(value);
    } else if (field === "expiryDate") {
      formattedValue = formatExpiryDate(value);
    } else if (field === "cvv") {
      formattedValue = value.replace(/[^0-9]/g, "").substring(0, 4);
    }

    setCardForm((prev) => ({ ...prev, [field]: formattedValue }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const processPayment = async () => {
    setProcessing(true);

    try {
      let paymentData = {
        ...bookingData,
        paymentMethod: paymentMethod,
        amount: bookingData.totalAmount,
        currency: "AED",
      };

      let isValid = false;

      // Validate and add payment method specific data
      switch (paymentMethod) {
        case "stripe":
          isValid = validateStripeForm();
          if (isValid) {
            paymentData.cardDetails = selectedSavedCard
              ? { savedCardId: selectedSavedCard, cvv: cardForm.cvv }
              : cardForm;
          }
          break;
        case "bank_transfer":
          isValid = validateBankForm();
          if (isValid) {
            paymentData.bankDetails = bankForm;
          }
          break;
        case "digital_wallet":
          isValid = validateDigitalWallet();
          if (isValid) {
            paymentData.walletDetails = digitalWalletForm;
          }
          break;
        case "cash_on_pickup":
          isValid = validateCashOnPickup();
          if (isValid) {
            paymentData.cashDetails = cashOnPickupForm;
          }
          break;
      }

      if (!isValid) {
        setProcessing(false);
        return;
      }

      // Process payment using the payment service
      const result = await paymentService.processPayment(paymentData);

      if (result.success) {
        onPaymentSuccess?.(result);
        onClose();
      } else {
        throw new Error(result.message || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      onPaymentError?.(error.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  // Calculate fees based on payment method
  const calculateFees = () => {
    const baseAmount = bookingData?.totalAmount || 0;
    let fee = 0;

    switch (paymentMethod) {
      case "stripe":
        fee = Math.round(baseAmount * 0.035 + 1.5);
        break;
      case "digital_wallet":
        fee = Math.round(baseAmount * 0.029 + 1.0);
        break;
      default:
        fee = 0;
    }

    return fee;
  };

  const paymentFee = calculateFees();
  const finalAmount = (bookingData?.totalAmount || 0) + paymentFee;
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Complete Payment
            </h2>
            <p className="text-gray-600 mt-1">
              Secure your booking for {bookingData?.carTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left Side - Payment Methods */}
          <div className="lg:w-2/3 p-6 border-r border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Choose Payment Method
            </h3>

            {/* Payment Method Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-4 border-2 rounded-xl transition-all text-left ${
                    paymentMethod === method.id
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <method.icon
                      className={`w-5 h-5 ${
                        paymentMethod === method.id
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    />
                    <span className="font-medium text-gray-900">
                      {method.name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {method.description}
                  </p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Processing: {method.processing}</span>
                    <span>Fees: {method.fees}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Payment Form Based on Selected Method */}
            <div className="space-y-4">
              {/* Stripe Payment Form */}
              {paymentMethod === "stripe" && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Card Information
                  </h4>

                  {/* Saved Cards */}
                  {savedCards.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Saved Cards
                      </label>
                      <select
                        value={selectedSavedCard}
                        onChange={(e) => setSelectedSavedCard(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Use new card</option>
                        {savedCards.map((card) => (
                          <option key={card.id} value={card.id}>
                            **** **** **** {card.last4} ({card.brand})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* New Card Form */}
                  {!selectedSavedCard && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          value={cardForm.cardNumber}
                          onChange={(e) =>
                            handleCardInputChange("cardNumber", e.target.value)
                          }
                          placeholder="1234 5678 9012 3456"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            errors.cardNumber
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {errors.cardNumber && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.cardNumber}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            value={cardForm.expiryDate}
                            onChange={(e) =>
                              handleCardInputChange(
                                "expiryDate",
                                e.target.value
                              )
                            }
                            placeholder="MM/YY"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              errors.expiryDate
                                ? "border-red-500"
                                : "border-gray-300"
                            }`}
                          />
                          {errors.expiryDate && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.expiryDate}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CVV
                          </label>
                          <input
                            type="text"
                            value={cardForm.cvv}
                            onChange={(e) =>
                              handleCardInputChange("cvv", e.target.value)
                            }
                            placeholder="123"
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                              errors.cvv ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          {errors.cvv && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.cvv}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          value={cardForm.cardholderName}
                          onChange={(e) =>
                            handleCardInputChange(
                              "cardholderName",
                              e.target.value
                            )
                          }
                          placeholder="John Doe"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                            errors.cardholderName
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {errors.cardholderName && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.cardholderName}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="saveCard"
                          checked={cardForm.saveCard}
                          onChange={(e) =>
                            setCardForm((prev) => ({
                              ...prev,
                              saveCard: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label
                          htmlFor="saveCard"
                          className="ml-2 text-sm text-gray-700"
                        >
                          Save this card for future payments
                        </label>
                      </div>
                    </>
                  )}

                  {/* CVV for saved cards */}
                  {selectedSavedCard && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV for saved card
                      </label>
                      <input
                        type="text"
                        value={cardForm.cvv}
                        onChange={(e) =>
                          handleCardInputChange("cvv", e.target.value)
                        }
                        placeholder="123"
                        className={`w-full max-w-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors.cvv ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.cvv && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.cvv}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Bank Transfer Form */}
              {paymentMethod === "bank_transfer" && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Bank Transfer Details
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Bank
                    </label>
                    <select
                      value={bankForm.bank}
                      onChange={(e) =>
                        setBankForm((prev) => ({
                          ...prev,
                          bank: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.bank ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Choose your bank</option>
                      {uaeBanks.map((bank) => (
                        <option key={bank} value={bank}>
                          {bank}
                        </option>
                      ))}
                    </select>
                    {errors.bank && (
                      <p className="text-red-500 text-xs mt-1">{errors.bank}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={bankForm.accountNumber}
                      onChange={(e) =>
                        setBankForm((prev) => ({
                          ...prev,
                          accountNumber: e.target.value,
                        }))
                      }
                      placeholder="Enter your account number"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                        errors.accountNumber
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors.accountNumber && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.accountNumber}
                      </p>
                    )}
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      <strong>Note:</strong> After clicking "Complete Payment",
                      you'll receive bank transfer instructions via email. Your
                      booking will be confirmed once the transfer is completed.
                    </p>
                  </div>
                </div>
              )}

              {/* Digital Wallet Form */}
              {paymentMethod === "digital_wallet" && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Digital Wallet</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Wallet
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {digitalWallets.map((wallet) => (
                        <button
                          key={wallet.id}
                          type="button"
                          onClick={() =>
                            setDigitalWalletForm((prev) => ({
                              ...prev,
                              walletType: wallet.id,
                            }))
                          }
                          className={`p-3 border-2 rounded-lg transition-all ${
                            digitalWalletForm.walletType === wallet.id
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="text-center">
                            <span className="text-2xl mb-1 block">
                              {wallet.icon}
                            </span>
                            <span className="text-sm font-medium">
                              {wallet.name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {(digitalWalletForm.walletType === "careem_pay" ||
                    digitalWalletForm.walletType === "beam_wallet") && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={digitalWalletForm.phoneNumber}
                        onChange={(e) =>
                          setDigitalWalletForm((prev) => ({
                            ...prev,
                            phoneNumber: e.target.value,
                          }))
                        }
                        placeholder="+971 50 123 4567"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors.phoneNumber
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                      {errors.phoneNumber && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.phoneNumber}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Cash on Pickup Form */}
              {paymentMethod === "cash_on_pickup" && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Cash Payment Details
                  </h4>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Banknote className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                      <div>
                        <h5 className="font-medium text-yellow-800 mb-1">
                          Cash Payment Instructions
                        </h5>
                        <p className="text-yellow-700 text-sm">
                          You'll pay cash directly to the car owner when you
                          pick up the vehicle. Please bring the exact amount in
                          AED.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting Location <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={cashOnPickupForm.meetingLocation}
                        onChange={(e) =>
                          setCashOnPickupForm((prev) => ({
                            ...prev,
                            meetingLocation: e.target.value,
                          }))
                        }
                        placeholder="Enter pickup location (e.g., Dubai Mall Parking)"
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors.meetingLocation
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                    </div>
                    {errors.meetingLocation && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.meetingLocation}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Meeting Time{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="datetime-local"
                        value={cashOnPickupForm.meetingTime}
                        onChange={(e) =>
                          setCashOnPickupForm((prev) => ({
                            ...prev,
                            meetingTime: e.target.value,
                          }))
                        }
                        min={new Date().toISOString().slice(0, 16)}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                          errors.meetingTime
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      />
                    </div>
                    {errors.meetingTime && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.meetingTime}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Notes
                    </label>
                    <textarea
                      value={cashOnPickupForm.notes}
                      onChange={(e) =>
                        setCashOnPickupForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Any special instructions for the meeting..."
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      checked={cashOnPickupForm.agreeToTerms}
                      onChange={(e) =>
                        setCashOnPickupForm((prev) => ({
                          ...prev,
                          agreeToTerms: e.target.checked,
                        }))
                      }
                      className={`w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1 ${
                        errors.agreeToTerms ? "border-red-500" : ""
                      }`}
                    />
                    <label
                      htmlFor="agreeToTerms"
                      className="ml-2 text-sm text-gray-700"
                    >
                      I agree to meet at the specified time and location, and
                      understand that I need to bring the exact amount in cash
                      (AED {bookingData?.totalAmount}).
                    </label>
                  </div>
                  {errors.agreeToTerms && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.agreeToTerms}
                    </p>
                  )}

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">
                      Important Reminders:
                    </h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>
                        • Bring exact change: AED {bookingData?.totalAmount}
                      </li>
                      <li>• Bring your Emirates ID and driving license</li>
                      <li>• Inspect the vehicle before taking possession</li>
                      <li>
                        • The car owner will contact you to confirm meeting
                        details
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Booking Summary */}
          <div className="lg:w-1/3 p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Booking Summary
            </h3>

            {/* Car Details */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src={bookingData?.carImage || "/placeholder-car.jpg"}
                  alt={bookingData?.carTitle}
                  className="w-16 h-12 object-cover rounded-lg"
                />
                <div>
                  <h4 className="font-medium text-gray-900">
                    {bookingData?.carTitle}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {bookingData?.carLocation}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pickup Date:</span>
                  <span className="font-medium">
                    {new Date(bookingData?.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Return Date:</span>
                  <span className="font-medium">
                    {new Date(bookingData?.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">
                    {bookingData?.numberOfDays} day
                    {bookingData?.numberOfDays !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Price Breakdown
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Rate:</span>
                  <span>AED {bookingData?.dailyRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span>
                    {bookingData?.numberOfDays} day
                    {bookingData?.numberOfDays !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>AED {bookingData?.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Fee:</span>
                  <span>AED {bookingData?.serviceFee || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Insurance:</span>
                  <span>AED {bookingData?.insurance || 0}</span>
                </div>

                {/* Payment Method Fees */}
                {paymentFee > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Payment Processing:</span>
                    <span>AED {paymentFee.toFixed(2)}</span>
                  </div>
                )}

                <hr className="border-gray-200" />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-green-600">
                    AED {finalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Features */}
            <div className="bg-white rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Lock className="w-4 h-4 mr-2 text-green-600" />
                Secure Payment
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  <span>256-bit SSL encryption</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  <span>PCI DSS compliant</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  <span>Fraud protection</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  <span>Instant confirmation</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={processPayment}
                disabled={processing}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                {processing ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {paymentMethod === "cash_on_pickup" ? (
                      <>
                        <Banknote className="w-5 h-5 mr-2" />
                        Confirm Cash Payment
                      </>
                    ) : paymentMethod === "bank_transfer" ? (
                      <>
                        <Building className="w-5 h-5 mr-2" />
                        Complete Bank Transfer
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        Pay AED {finalAmount.toFixed(2)}
                      </>
                    )}
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                disabled={processing}
                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                {paymentMethod === "cash_on_pickup" ? (
                  <>
                    <strong>Cash Payment:</strong> You'll pay directly to the
                    car owner at pickup. Make sure to bring exact change and
                    inspect the vehicle before payment.
                  </>
                ) : paymentMethod === "bank_transfer" ? (
                  <>
                    <strong>Bank Transfer:</strong> Your booking will be
                    confirmed once we receive your bank transfer. You'll receive
                    detailed instructions via email.
                  </>
                ) : (
                  <>
                    <strong>Instant Booking:</strong> Your payment is secure and
                    your booking will be confirmed immediately after successful
                    payment.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
