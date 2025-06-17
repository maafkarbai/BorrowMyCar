// src/components/PaymentModal.jsx - COMPLETE VERSION
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
} from "lucide-react";
import API from "../api";

const PaymentModal = ({
  isOpen,
  onClose,
  bookingData,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [processing, setProcessing] = useState(false);

  // Form states
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

  // UAE Banks
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

  // Digital Wallets
  const digitalWallets = [
    { id: "apple_pay", name: "Apple Pay", icon: "🍎" },
    { id: "google_pay", name: "Google Pay", icon: "🔵" },
    { id: "samsung_pay", name: "Samsung Pay", icon: "📱" },
    { id: "paypal", name: "PayPal", icon: "💙" },
    { id: "careem_pay", name: "Careem Pay", icon: "🚗" },
    { id: "beam_wallet", name: "Beam Wallet", icon: "💫" },
  ];

  // Payment Methods
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

  // Fetch saved cards on modal open
  useEffect(() => {
    if (isOpen) {
      fetchSavedCards();
    }
  }, [isOpen]);

  const fetchSavedCards = async () => {
    try {
      const response = await API.get("/payments/saved-cards");
      setSavedCards(response.data.data?.cards || []);
    } catch (error) {
      console.error("Failed to fetch saved cards:", error);
    }
  };

  // Format card number
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

  // Calculate fees function
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
      case "bank_transfer":
      case "cash_on_pickup":
        fee = 0;
        break;
      default:
        fee = 0;
    }
    return fee;
  };

  // Main payment processing function
  const processPayment = async () => {
    setProcessing(true);

    try {
      // Prepare base payment data
      let paymentData = {
        paymentMethod: paymentMethod,
        amount: bookingData.totalAmount,
        currency: "AED",
        bookingId: bookingData.bookingId,
        carId: bookingData.carId,
        carTitle: bookingData.carTitle,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        numberOfDays: bookingData.numberOfDays,
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

      // Process payment via API
      const response = await API.post("/payments/process", paymentData);

      if (response.data.success) {
        onPaymentSuccess?.(response.data.data);
        onClose();
      } else {
        throw new Error(response.data.message || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      onPaymentError?.(
        error.response?.data?.message || error.message || "Payment failed"
      );
    } finally {
      setProcessing(false);
    }
  };

  // Reset forms when payment method changes
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setErrors({});
    setSelectedSavedCard("");
  };

  // Render payment form based on selected method
  const renderPaymentForm = () => {
    switch (paymentMethod) {
      case "stripe":
        return (
          <div className="space-y-4">
            {/* Saved Cards Section */}
            {savedCards.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saved Cards
                </label>
                <div className="space-y-2">
                  {savedCards.map((card) => (
                    <div
                      key={card.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedSavedCard === card.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedSavedCard(card.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">
                            •••• •••• •••• {card.lastFour}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            {card.brand} • {card.expiryMonth}/{card.expiryYear}
                          </span>
                        </div>
                        <input
                          type="radio"
                          checked={selectedSavedCard === card.id}
                          onChange={() => setSelectedSavedCard(card.id)}
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-blue-600 text-sm hover:underline"
                    onClick={() => setSelectedSavedCard("")}
                  >
                    Use a different card
                  </button>
                </div>
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
                    placeholder="1234 5678 9012 3456"
                    value={cardForm.cardNumber}
                    onChange={(e) =>
                      handleCardInputChange("cardNumber", e.target.value)
                    }
                    className={`w-full p-3 border rounded-lg ${
                      errors.cardNumber ? "border-red-500" : "border-gray-300"
                    }`}
                    maxLength="19"
                  />
                  {errors.cardNumber && (
                    <p className="text-red-500 text-sm mt-1">
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
                      placeholder="MM/YY"
                      value={cardForm.expiryDate}
                      onChange={(e) =>
                        handleCardInputChange("expiryDate", e.target.value)
                      }
                      className={`w-full p-3 border rounded-lg ${
                        errors.expiryDate ? "border-red-500" : "border-gray-300"
                      }`}
                      maxLength="5"
                    />
                    {errors.expiryDate && (
                      <p className="text-red-500 text-sm mt-1">
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
                      placeholder="123"
                      value={cardForm.cvv}
                      onChange={(e) =>
                        handleCardInputChange("cvv", e.target.value)
                      }
                      className={`w-full p-3 border rounded-lg ${
                        errors.cvv ? "border-red-500" : "border-gray-300"
                      }`}
                      maxLength="4"
                    />
                    {errors.cvv && (
                      <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardForm.cardholderName}
                    onChange={(e) =>
                      handleCardInputChange("cardholderName", e.target.value)
                    }
                    className={`w-full p-3 border rounded-lg ${
                      errors.cardholderName
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.cardholderName && (
                    <p className="text-red-500 text-sm mt-1">
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
                    className="mr-2"
                  />
                  <label htmlFor="saveCard" className="text-sm text-gray-600">
                    Save this card for future payments
                  </label>
                </div>
              </>
            )}

            {/* CVV for saved cards */}
            {selectedSavedCard && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVV
                </label>
                <input
                  type="text"
                  placeholder="123"
                  value={cardForm.cvv}
                  onChange={(e) => handleCardInputChange("cvv", e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    errors.cvv ? "border-red-500" : "border-gray-300"
                  }`}
                  maxLength="4"
                />
                {errors.cvv && (
                  <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                )}
              </div>
            )}
          </div>
        );

      case "bank_transfer":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Bank
              </label>
              <select
                value={bankForm.bank}
                onChange={(e) =>
                  setBankForm((prev) => ({ ...prev, bank: e.target.value }))
                }
                className={`w-full p-3 border rounded-lg ${
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
                <p className="text-red-500 text-sm mt-1">{errors.bank}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                placeholder="Enter your account number"
                value={bankForm.accountNumber}
                onChange={(e) =>
                  setBankForm((prev) => ({
                    ...prev,
                    accountNumber: e.target.value,
                  }))
                }
                className={`w-full p-3 border rounded-lg ${
                  errors.accountNumber ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.accountNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.accountNumber}
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm text-blue-800">
                  You will receive bank transfer instructions after
                  confirmation.
                </span>
              </div>
            </div>
          </div>
        );

      case "digital_wallet":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Wallet
              </label>
              <div className="grid grid-cols-2 gap-3">
                {digitalWallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className={`p-3 border rounded-lg cursor-pointer text-center transition-colors ${
                      digitalWalletForm.walletType === wallet.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() =>
                      setDigitalWalletForm((prev) => ({
                        ...prev,
                        walletType: wallet.id,
                      }))
                    }
                  >
                    <div className="text-2xl mb-1">{wallet.icon}</div>
                    <div className="text-sm font-medium">{wallet.name}</div>
                  </div>
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
                  type="tel"
                  placeholder="+971 50 123 4567"
                  value={digitalWalletForm.phoneNumber}
                  onChange={(e) =>
                    setDigitalWalletForm((prev) => ({
                      ...prev,
                      phoneNumber: e.target.value,
                    }))
                  }
                  className={`w-full p-3 border rounded-lg ${
                    errors.phoneNumber ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case "cash_on_pickup":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter meeting location"
                  value={cashOnPickupForm.meetingLocation}
                  onChange={(e) =>
                    setCashOnPickupForm((prev) => ({
                      ...prev,
                      meetingLocation: e.target.value,
                    }))
                  }
                  className={`w-full pl-10 p-3 border rounded-lg ${
                    errors.meetingLocation
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
              </div>
              {errors.meetingLocation && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.meetingLocation}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="datetime-local"
                  value={cashOnPickupForm.meetingTime}
                  onChange={(e) =>
                    setCashOnPickupForm((prev) => ({
                      ...prev,
                      meetingTime: e.target.value,
                    }))
                  }
                  className={`w-full pl-10 p-3 border rounded-lg ${
                    errors.meetingTime ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.meetingTime && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.meetingTime}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                placeholder="Any additional notes for the meeting..."
                value={cashOnPickupForm.notes}
                onChange={(e) =>
                  setCashOnPickupForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg"
                rows="3"
              />
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={cashOnPickupForm.agreeToTerms}
                onChange={(e) =>
                  setCashOnPickupForm((prev) => ({
                    ...prev,
                    agreeToTerms: e.target.checked,
                  }))
                }
                className="mt-1 mr-2"
              />
              <label htmlFor="agreeTerms" className="text-sm text-gray-600">
                I agree to meet at the specified location and time with exact
                cash amount
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-red-500 text-sm mt-1">{errors.agreeToTerms}</p>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800">
                  Please bring exact amount: AED {bookingData?.totalAmount || 0}
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const fees = calculateFees();
  const totalWithFees = (bookingData?.totalAmount || 0) + fees;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Complete Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={processing}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-2">Booking Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Car:</span>
                <span className="font-medium">{bookingData?.carTitle}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>{bookingData?.numberOfDays} days</span>
              </div>
              <div className="flex justify-between">
                <span>Dates:</span>
                <span>
                  {new Date(bookingData?.startDate).toLocaleDateString()} -{" "}
                  {new Date(bookingData?.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2 mt-2">
                <span>Subtotal:</span>
                <span>AED {bookingData?.totalAmount}</span>
              </div>
              {fees > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Processing fee:</span>
                  <span>AED {fees}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>Total:</span>
                <span>AED {totalWithFees}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <h3 className="font-medium mb-4">Select Payment Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === method.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handlePaymentMethodChange(method.id)}
                  >
                    <div className="flex items-center mb-2">
                      <IconComponent className="h-5 w-5 mr-2" />
                      <span className="font-medium">{method.name}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {method.description}
                    </p>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Processing: {method.processing}</span>
                      <span>Fees: {method.fees}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Form */}
          <div className="mb-6">
            <h3 className="font-medium mb-4">Payment Details</h3>
            {renderPaymentForm()}
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <Lock className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm text-green-800">
                Your payment information is encrypted and secure. We never store
                your full card details.
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              onClick={processPayment}
              disabled={processing}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Pay AED {totalWithFees}
                </>
              )}
            </button>
          </div>

          {/* Payment Method Specific Instructions */}
          {paymentMethod === "bank_transfer" && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Bank Transfer Instructions
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  1. You will receive detailed bank transfer instructions via
                  email
                </p>
                <p>
                  2. Transfer must be completed within 24 hours to hold your
                  booking
                </p>
                <p>
                  3. Include your booking reference in the transfer description
                </p>
                <p>4. Upload transfer receipt in your booking dashboard</p>
              </div>
            </div>
          )}

          {paymentMethod === "cash_on_pickup" && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">
                Cash Payment Guidelines
              </h4>
              <div className="text-sm text-yellow-800 space-y-1">
                <p>• Bring exact amount: AED {totalWithFees}</p>
                <p>• Meeting location and time are confirmed upon booking</p>
                <p>• Bring valid ID for verification</p>
                <p>• Late arrival may result in booking cancellation</p>
              </div>
            </div>
          )}

          {paymentMethod === "digital_wallet" && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">
                Digital Wallet Payment
              </h4>
              <div className="text-sm text-purple-800 space-y-1">
                <p>
                  • You will be redirected to complete payment with your
                  selected wallet
                </p>
                <p>
                  • Ensure you have sufficient balance or linked payment method
                </p>
                <p>• Payment confirmation will be sent via email</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
