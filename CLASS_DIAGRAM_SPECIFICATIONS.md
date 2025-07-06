# BorrowMyCar Platform - Class Diagram Specifications

## Overview

This document provides a comprehensive specification of all classes and their relationships for creating UML class diagrams for the BorrowMyCar platform. The system follows a full-stack architecture with distinct layers for data models, business logic, presentation, and utilities.

## 1. Data Model Classes (Backend Models)

### 1.1 User Class
**File:** `models/User.js`
**Stereotypes:** `<<Entity>>, <<Model>>`

#### Attributes:
- `_id: ObjectId` - Primary key
- `name: String` - Full name (required, 2-50 chars)
- `email: String` - Email address (required, unique, lowercase)
- `phone: String` - UAE phone number (required, validated)
- `password: String` - Hashed password (required, min 6 chars, select: false)
- `profileImage: String` - Cloudinary URL
- `role: String` - Enum: ["renter", "owner", "admin"], default: "renter"
- `isApproved: Boolean` - Admin approval status, default: false
- `rejectionReason: String` - Reason for rejection
- `drivingLicenseUrl: String` - Document URL (required)
- `licenseVerified: Boolean` - Verification status, default: false
- `licenseVerificationNotes: String` - Admin notes
- `emiratesIdUrl: String` - Document URL
- `visaUrl: String` - Document URL
- `passportUrl: String` - Document URL
- `preferredCity: String` - Enum: UAE cities
- `notificationPreferences: Object` - Email, SMS, push preferences
- `privacySettings: Object` - Profile visibility, contact info display
- `isEmailVerified: Boolean` - Email verification status, default: false
- `isPhoneVerified: Boolean` - Phone verification status, default: false
- `lastLoginAt: Date` - Last login timestamp
- `deletedAt: Date` - Soft delete timestamp, default: null
- `createdAt: Date` - Auto-generated timestamp
- `updatedAt: Date` - Auto-generated timestamp

#### Methods:
- `matchPassword(enteredPassword: String): Promise<Boolean>` - Verify password
- `getPublicProfile(): Object` - Return public profile data
- `getPrivateProfile(): Object` - Return full profile data
- `phoneDisplay: String` - Virtual field for formatted phone display

#### Static Methods:
- `findPublicProfiles(query: Object): Query` - Find users with public profiles

#### Relationships:
- **1:N** with Car (owns many cars)
- **1:N** with Booking (makes many bookings as renter)
- **1:N** with OTP (has many OTP records)

---

### 1.2 Car Class
**File:** `models/Car.js`
**Stereotypes:** `<<Entity>>, <<Model>>`

#### Attributes:
- `_id: ObjectId` - Primary key
- `owner: ObjectId` - Foreign key to User (required)
- `title: String` - Car title (required, max 100 chars)
- `description: String` - Car description (required, max 1000 chars)
- `city: String` - UAE city/area (required, enum)
- `price: Number` - Daily rental price (required, 50-5000 AED)
- `availabilityFrom: Date` - Available start date (required)
- `availabilityTo: Date` - Available end date (required)
- `make: String` - Car manufacturer (required)
- `model: String` - Car model (required)
- `year: Number` - Manufacturing year (required, 2010+)
- `color: String` - Car color (required)
- `plateNumber: String` - UAE plate number (required, validated)
- `transmission: String` - Enum: ["Automatic", "Manual", "CVT", "Semi-Automatic"]
- `fuelType: String` - Enum: ["Petrol", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid"]
- `mileage: Number` - Odometer reading (required, min 0)
- `seatingCapacity: Number` - Number of seats (required, 2-8)
- `specifications: String` - Car specs type (default: "GCC Specs")
- `features: [String]` - Array of car features
- `images: [String]` - Array of Cloudinary URLs (min 3 required)
- `isInstantApproval: Boolean` - Auto-approve bookings, default: true
- `minimumRentalDays: Number` - Min rental period, default: 1
- `maximumRentalDays: Number` - Max rental period, default: 30
- `deliveryAvailable: Boolean` - Delivery service, default: false
- `deliveryFee: Number` - Delivery cost, default: 0
- `securityDeposit: Number` - Security deposit, default: 500
- `status: String` - Enum: ["active", "inactive", "deleted", "pending", "rejected", "maintenance"]
- `totalBookings: Number` - Total bookings count, default: 0
- `averageRating: Number` - Average rating (0-5), default: 0
- `adminNotes: String` - Admin comments
- `rejectionReason: String` - Rejection reason
- `deletedAt: Date` - Soft delete timestamp, default: null
- `createdAt: Date` - Auto-generated timestamp
- `updatedAt: Date` - Auto-generated timestamp

#### Virtual Properties:
- `pricePerDay: Number` - Alias for price field (frontend compatibility)

#### Relationships:
- **N:1** with User (belongs to owner)
- **1:N** with Booking (has many bookings)

---

### 1.3 Booking Class
**File:** `models/Booking.js`
**Stereotypes:** `<<Entity>>, <<Model>>`

#### Attributes:
- `_id: ObjectId` - Primary key
- `renter: ObjectId` - Foreign key to User (required)
- `car: ObjectId` - Foreign key to Car (required)
- `startDate: Date` - Rental start date (required)
- `endDate: Date` - Rental end date (required)
- `totalDays: Number` - Calculated rental duration (required, min 1)
- `dailyRate: Number` - Rate per day (required)
- `totalAmount: Number` - Base rental cost (required)
- `securityDeposit: Number` - Security deposit amount, default: 0
- `deliveryFee: Number` - Delivery service fee, default: 0
- `totalPayable: Number` - Total amount to pay (required)
- `status: String` - Enum: ["pending", "approved", "confirmed", "active", "completed", "cancelled", "rejected", "expired"]
- `paymentMethod: String` - Enum: ["Cash", "Card"], default: "Cash"
- `paymentStatus: String` - Enum: ["pending", "paid", "failed", "refunded", "partial"]
- `transactionId: String` - Payment transaction ID
- `paymentIntentId: String` - Stripe payment intent ID
- `paidAt: Date` - Payment completion timestamp
- `pickupLocation: String` - Car pickup location (required)
- `returnLocation: String` - Car return location (required)
- `pickupTime: Date` - Scheduled pickup time
- `returnTime: Date` - Scheduled return time
- `actualReturnTime: Date` - Actual return time
- `deliveryRequested: Boolean` - Delivery service requested, default: false
- `deliveryAddress: String` - Delivery address
- `renterNotes: String` - Renter comments (max 500 chars)
- `ownerNotes: String` - Owner comments (max 500 chars)
- `adminNotes: String` - Admin comments (max 500 chars)
- `preRentalCondition: String` - Car condition before rental
- `postRentalCondition: String` - Car condition after return
- `damageReported: Boolean` - Damage reported flag, default: false
- `damageDescription: String` - Damage details
- `cancellationReason: String` - Cancellation reason
- `cancelledBy: String` - Enum: ["renter", "owner", "admin", "system"]
- `cancellationFee: Number` - Cancellation penalty, default: 0
- `renterReview: Object` - Review by renter {rating, comment, reviewedAt}
- `ownerReview: Object` - Review by owner {rating, comment, reviewedAt}
- `approvedAt: Date` - Approval timestamp
- `confirmedAt: Date` - Confirmation timestamp
- `completedAt: Date` - Completion timestamp
- `expiresAt: Date` - Auto-expiry timestamp
- `createdAt: Date` - Auto-generated timestamp
- `updatedAt: Date` - Auto-generated timestamp

#### Static Methods:
- `findConflictingBookings(carId, startDate, endDate, excludeBookingId): Promise<Booking>` - Check for booking conflicts

#### Relationships:
- **N:1** with User (belongs to renter)
- **N:1** with Car (belongs to car)

---

### 1.4 OTP Class
**File:** `models/OTP.js`
**Stereotypes:** `<<Entity>>, <<Model>>`

#### Attributes:
- `_id: ObjectId` - Primary key
- `email: String` - Target email address (required)
- `otp: String` - OTP code (required, encrypted)
- `purpose: String` - Enum: ["signup", "password-reset"], default: "signup"
- `userData: Object` - Temporary user data for signup
- `isUsed: Boolean` - Usage status, default: false
- `expiresAt: Date` - Expiration timestamp (required)
- `createdAt: Date` - Auto-generated timestamp

#### Static Methods:
- `createOTP(email, purpose, userData): Promise<{otp}>` - Generate and store OTP
- `verifyOTP(email, otp, purpose): Promise<{success, message, userData}>` - Verify OTP

#### Relationships:
- **N:1** with User (belongs to user email)

---

## 2. Controller Classes (Business Logic Layer)

### 2.1 AuthController Class
**File:** `controllers/authController.js`
**Stereotypes:** `<<Controller>>, <<Service>>`

#### Methods:
- `signup(req, res): Promise<Response>` - User registration with OTP
- `verifyEmail(req, res): Promise<Response>` - Email verification
- `resendOTP(req, res): Promise<Response>` - Resend verification OTP
- `login(req, res): Promise<Response>` - User authentication
- `logout(req, res): Promise<Response>` - User logout
- `getProfile(req, res): Promise<Response>` - Get user profile
- `updateProfile(req, res): Promise<Response>` - Update user profile
- `updateProfilePicture(req, res): Promise<Response>` - Update profile picture
- `removeProfilePicture(req, res): Promise<Response>` - Remove profile picture
- `changePassword(req, res): Promise<Response>` - Change password
- `updatePreferences(req, res): Promise<Response>` - Update notification/privacy preferences
- `getPublicUserProfile(req, res): Promise<Response>` - Get public user profile
- `exportUserData(req, res): Promise<Response>` - Export user data
- `deleteAccount(req, res): Promise<Response>` - Soft delete account
- `forgotPassword(req, res): Promise<Response>` - Password reset request
- `resetPassword(req, res): Promise<Response>` - Password reset with OTP
- `resendPasswordResetOTP(req, res): Promise<Response>` - Resend password reset OTP

#### Private Methods:
- `generateToken(user, rememberMe): String` - Generate JWT token
- `sendTokenResponse(user, statusCode, res, message, rememberMe): void` - Send auth response
- `sanitizeUserData(data): Object` - Sanitize user input
- `validateUserData(data, isSignup): Object` - Validate user data

#### Dependencies:
- Uses User, OTP models
- Uses CloudUploader utility
- Uses PhoneUtils utility
- Uses EmailService utility

---

### 2.2 CarController Class
**File:** `controllers/carController.js`
**Stereotypes:** `<<Controller>>, <<Service>>`

#### Methods:
- `createCar(req, res): Promise<Response>` - Create car listing
- `getCars(req, res): Promise<Response>` - Get cars with filtering/pagination
- `getCarById(req, res): Promise<Response>` - Get single car details
- `updateCar(req, res): Promise<Response>` - Update car listing
- `deleteCar(req, res): Promise<Response>` - Soft delete car
- `getCarsByOwner(req, res): Promise<Response>` - Get cars by owner
- `getMyCars(req, res): Promise<Response>` - Get authenticated user's cars
- `getSellerDashboard(req, res): Promise<Response>` - Get seller analytics
- `getSellerOrders(req, res): Promise<Response>` - Get seller bookings
- `getCarAvailability(req, res): Promise<Response>` - Get car availability
- `bulkUpdateCars(req, res): Promise<Response>` - Bulk update cars
- `toggleCarStatus(req, res): Promise<Response>` - Toggle car active status
- `duplicateCarListing(req, res): Promise<Response>` - Duplicate car listing

#### Private Methods:
- `sanitizeCarData(data): Object` - Sanitize car input data

#### Dependencies:
- Uses Car, Booking models
- Uses CloudUploader utility

---

### 2.3 BookingController Class
**File:** `controllers/bookingController.js`
**Stereotypes:** `<<Controller>>, <<Service>>`

#### Methods:
- `createBooking(req, res): Promise<Response>` - Create new booking
- `getMyBookings(req, res): Promise<Response>` - Get user's bookings
- `getBookingsForOwner(req, res): Promise<Response>` - Get owner's bookings
- `updateBookingStatus(req, res): Promise<Response>` - Update booking status
- `getBookingById(req, res): Promise<Response>` - Get single booking
- `cancelBooking(req, res): Promise<Response>` - Cancel booking
- `addReview(req, res): Promise<Response>` - Add booking review

#### Private Methods:
- `checkBookingConflicts(carId, startDate, endDate, excludeBookingId): Promise<Booking>` - Check conflicts
- `calculateBookingPricing(car, startDate, endDate, deliveryRequested): Object` - Calculate pricing

#### Dependencies:
- Uses Booking, Car models

---

### 2.4 PaymentController Class
**File:** `controllers/paymentController.js`
**Stereotypes:** `<<Controller>>, <<Service>>`

#### Methods:
- `getStripeConfig(req, res): Promise<Response>` - Get Stripe configuration
- `processPayment(req, res): Promise<Response>` - Process payment (cash/card)
- `createPaymentIntent(req, res): Promise<Response>` - Create Stripe payment intent
- `confirmPayment(req, res): Promise<Response>` - Confirm payment
- `getPaymentHistory(req, res): Promise<Response>` - Get payment history
- `getSavedPaymentMethods(req, res): Promise<Response>` - Get saved cards
- `deleteSavedPaymentMethod(req, res): Promise<Response>` - Delete saved card
- `refundPayment(req, res): Promise<Response>` - Process refund
- `handleStripeWebhook(req, res): Promise<Response>` - Handle Stripe webhooks

#### Dependencies:
- Uses Stripe SDK
- Uses Booking, Car models

---

## 3. Frontend Component Classes (Presentation Layer)

### 3.1 AuthContext Class
**File:** `borrowmycarfrontend/src/context/AuthContext.jsx`
**Stereotypes:** `<<Context>>, <<StateManager>>`

#### State Properties:
- `isAuthenticated: Boolean` - Authentication status
- `user: Object` - Current user data
- `loading: Boolean` - Loading state
- `error: String` - Error message

#### Methods:
- `login(credentials): Promise<Object>` - Authenticate user
- `signup(userData): Promise<Object>` - Register user
- `verifyEmail(email, otp): Promise<Object>` - Verify email
- `logout(): void` - Logout user
- `clearError(): void` - Clear error state
- `updateUser(userData): void` - Update user data
- `checkAuth(isMounted): Promise<void>` - Check authentication status

#### Private Methods:
- `authReducer(state, action): Object` - State reducer function

#### Dependencies:
- Uses API utility

---

### 3.2 PaymentModal Class
**File:** `borrowmycarfrontend/src/components/PaymentModal.jsx`
**Stereotypes:** `<<Component>>, <<Modal>>`

#### Props:
- `isOpen: Boolean` - Modal visibility
- `onClose: Function` - Close callback
- `bookingData: Object` - Booking information
- `onPaymentSuccess: Function` - Success callback
- `onPaymentError: Function` - Error callback

#### State Properties:
- `paymentMethod: String` - Selected payment method
- `processing: Boolean` - Processing state
- `cardForm: Object` - Credit card form data
- `cashOnPickupForm: Object` - Cash payment form data
- `errors: Object` - Form validation errors
- `savedCards: Array` - Saved payment methods
- `selectedSavedCard: String` - Selected saved card ID

#### Methods:
- `processPayment(): Promise<void>` - Process payment
- `validateStripeForm(): Boolean` - Validate card form
- `validateCashOnPickup(): Boolean` - Validate cash form
- `handleCardInputChange(field, value): void` - Handle card input
- `handlePaymentMethodChange(method): void` - Change payment method
- `calculateFees(): Number` - Calculate processing fees
- `renderPaymentForm(): JSX.Element` - Render payment form

#### Private Methods:
- `formatCardNumber(value): String` - Format card number
- `formatExpiryDate(value): String` - Format expiry date
- `fetchSavedCards(): Promise<void>` - Fetch saved cards

#### Dependencies:
- Uses API utility
- Uses Lucide React icons

---

### 3.3 CarCard Class
**File:** `borrowmycarfrontend/src/components/CarCard.jsx`
**Stereotypes:** `<<Component>>, <<Card>>`

#### Props:
- `car: Object` - Car data
- `userLocation: Object` - User location (optional)
- `showDistance: Boolean` - Show distance flag, default: true

#### Methods:
- `getDistanceText(): String` - Calculate distance text
- `render(): JSX.Element` - Render car card

#### Dependencies:
- Uses UserAvatar component
- Uses React Router Link
- Uses Lucide React icons

---

### 3.4 App Component Class
**File:** `borrowmycarfrontend/src/App.jsx`
**Stereotypes:** `<<Component>>, <<Root>>`

#### Methods:
- `render(): JSX.Element` - Render main application

#### Dependencies:
- Uses React Helmet for SEO
- Uses i18next for translations
- Uses CarListingSection component

---

### 3.5 ListCar Component Class
**File:** `borrowmycarfrontend/src/ListCar.jsx`
**Stereotypes:** `<<Component>>, <<Form>>`

#### State Properties:
- `form: Object` - Car listing form data
- `images: Array` - Selected car images
- `error: String` - Error message
- `loading: Boolean` - Loading state
- `fileInputKey: Number` - File input reset key
- `showSuggestions: Boolean` - Show car name suggestions
- `filteredSuggestions: Array` - Filtered car suggestions
- `showCitySuggestions: Boolean` - Show city suggestions
- `filteredCities: Array` - Filtered city suggestions

#### Methods:
- `handleChange(e): void` - Handle form input changes
- `handleSubmit(e): Promise<void>` - Submit car listing
- `validateForm(): Boolean` - Validate form data
- `handleFileChange(e): void` - Handle image uploads
- `removeImage(index): void` - Remove selected image
- `handleSuggestionClick(suggestion): void` - Select car suggestion
- `handleCityClick(city): void` - Select city suggestion
- `handleFeatureChange(feature): void` - Toggle car feature

#### Dependencies:
- Uses API utility
- Uses React Router navigation

---

### 3.6 MyBookings Component Class
**File:** `borrowmycarfrontend/src/MyBookings.jsx`
**Stereotypes:** `<<Component>>, <<Dashboard>>`

#### State Properties:
- `bookings: Array` - User bookings
- `loading: Boolean` - Loading state
- `error: String` - Error message
- `activeTab: String` - Active filter tab
- `updateLoading: String` - Update operation loading
- `message: Object` - Success/error message

#### Methods:
- `fetchBookings(): Promise<void>` - Fetch user bookings
- `handleStatusUpdate(bookingId, newStatus): Promise<void>` - Update booking status
- `getStatusColor(status): String` - Get status color class
- `getStatusIcon(status): JSX.Element` - Get status icon
- `filterBookings(status): Array` - Filter bookings by status
- `calculateEarnings(): Number` - Calculate total earnings

#### Dependencies:
- Uses API utility
- Uses AuthContext
- Uses UserAvatar component
- Uses Lucide React icons

---

## 4. Utility Classes (Support Layer)

### 4.1 PhoneUtils Class
**File:** `utils/phoneUtils.js`
**Stereotypes:** `<<Utility>>, <<Helper>>`

#### Static Methods:
- `formatUAEPhone(phone): String` - Format to local format (0XXXXXXXXX)
- `validateUAEPhone(phone): Boolean` - Validate UAE phone number
- `displayUAEPhone(phone): String` - Format for display (050 123 4567)
- `getPhoneType(phone): String` - Get phone type (mobile/landline)
- `debugPhoneValidation(phone): Object` - Debug phone validation
- `formatUAEPhoneInternational(phone): String` - Format with +971 prefix
- `normalizePhoneForStorage(phone): String` - Normalize for database storage
- `getLocalNumber(phone): String` - Extract local number without country code

---

### 4.2 CloudUploader Class
**File:** `utils/cloudUploader.js`
**Stereotypes:** `<<Utility>>, <<Service>>`

#### Static Methods:
- `uploadImagesToCloud(files): Promise<Array<String>>` - Upload multiple images
- `deleteImagesFromCloud(imageUrls): Promise<Object>` - Delete images
- `uploadSingleImage(file, options): Promise<String>` - Upload single image
- `getImageInfo(publicId): Promise<Object>` - Get image metadata
- `optimizeImageUrl(url, transformations): String` - Optimize image URL

#### Private Methods:
- `extractPublicIdFromUrl(url): String` - Extract Cloudinary public ID

#### Dependencies:
- Uses Cloudinary SDK

---

### 4.3 ErrorHandler Class
**File:** `utils/errorHandler.js`
**Stereotypes:** `<<Utility>>, <<Middleware>>`

#### Classes:
- `AppError extends Error` - Custom error class

#### Static Methods:
- `globalErrorHandler(err, req, res, next): void` - Global error middleware
- `handleAsyncError(fn): Function` - Async error wrapper

#### Private Methods:
- `handleCastErrorDB(err): AppError` - Handle MongoDB cast errors
- `handleDuplicateFieldsDB(err): AppError` - Handle duplicate key errors
- `handleValidationErrorDB(err): AppError` - Handle validation errors
- `handleJWTError(): AppError` - Handle JWT errors
- `handleJWTExpiredError(): AppError` - Handle expired JWT
- `handleMulterError(err): AppError` - Handle file upload errors
- `sendErrorDev(err, res): void` - Development error response
- `sendErrorProd(err, res): void` - Production error response

---

### 4.4 Validators Class
**File:** `utils/validators.js`
**Stereotypes:** `<<Utility>>, <<Validator>>`

#### Static Methods:
- `validateSignup: Array` - User signup validation rules
- `validateLogin: Array` - User login validation rules
- `validateCreateCar: Array` - Car creation validation rules
- `validateCreateBooking: Array` - Booking creation validation rules
- `validateUpdateBookingStatus: Array` - Booking status update validation
- `validateAddReview: Array` - Review validation rules
- `validatePagination: Array` - Pagination validation rules
- `handleValidationErrors(req, res, next): void` - Validation error handler
- `validateCarData(carData): Object` - Car data validation
- `sanitizeCarData(carData): Object` - Car data sanitization
- `generalLimiter: Function` - General rate limiter middleware

---

### 4.5 AuthMiddleware Class
**File:** `middlewares/authMiddleware.js`
**Stereotypes:** `<<Middleware>>, <<Security>>`

#### Static Methods:
- `protect(req, res, next): Promise<void>` - JWT authentication middleware
- `restrictTo(...roles): Function` - Role-based authorization
- `requireApproval(req, res, next): void` - Account approval requirement
- `optionalAuth(req, res, next): Promise<void>` - Optional authentication
- `authLimiter: Function` - Authentication rate limiter
- `uploadLimiter: Function` - Upload rate limiter

#### Dependencies:
- Uses User model
- Uses JWT library

---

### 4.6 EmailService Class
**File:** `utils/emailService.js`
**Stereotypes:** `<<Service>>, <<Utility>>`

#### Methods:
- `sendOTPEmail(email, otp, purpose): Promise<Object>` - Send OTP email
- `sendWelcomeEmail(email, name, role): Promise<Object>` - Send welcome email
- `sendPasswordResetEmail(email, otp): Promise<Object>` - Send password reset email
- `sendBookingConfirmationEmail(booking): Promise<Object>` - Send booking confirmation

---

### 4.7 API Client Class
**File:** `borrowmycarfrontend/src/api.js`
**Stereotypes:** `<<Client>>, <<HTTP>>`

#### Configuration:
- `baseURL: String` - API base URL
- `timeout: Number` - Request timeout
- `withCredentials: Boolean` - Include cookies

#### Interceptors:
- Request interceptor for authentication
- Response interceptor for error handling

#### Dependencies:
- Uses Axios library

---

## 5. Class Relationships and Dependencies

### 5.1 Model Relationships
```
User ||--o{ Car : owns
User ||--o{ Booking : rents
Car ||--o{ Booking : booked
User ||--o{ OTP : generates
```

### 5.2 Controller Dependencies
```
AuthController --> User, OTP, CloudUploader, PhoneUtils, EmailService
CarController --> Car, Booking, CloudUploader
BookingController --> Booking, Car
PaymentController --> Booking, Car, Stripe
```

### 5.3 Frontend Component Dependencies
```
AuthContext --> API
PaymentModal --> API
CarCard --> UserAvatar
App --> CarListingSection
ListCar --> API
MyBookings --> API, AuthContext, UserAvatar
```

### 5.4 Utility Dependencies
```
CloudUploader --> Cloudinary
ErrorHandler --> AppError
AuthMiddleware --> User, JWT
EmailService --> SMTP/Email Provider
```

## 6. Design Patterns Used

### 6.1 Backend Patterns
- **MVC Pattern**: Models, Controllers, Views separation
- **Repository Pattern**: Data access through models
- **Middleware Pattern**: Authentication, validation, error handling
- **Factory Pattern**: Error creation and handling
- **Strategy Pattern**: Payment processing methods

### 6.2 Frontend Patterns
- **Context Pattern**: Global state management (AuthContext)
- **Component Pattern**: Reusable UI components
- **Container Pattern**: Smart vs presentational components
- **Hook Pattern**: Custom React hooks for state logic

### 6.3 Utility Patterns
- **Singleton Pattern**: API client configuration
- **Utility Pattern**: Stateless helper functions
- **Decorator Pattern**: Express middleware
- **Observer Pattern**: React state management

## 7. Class Diagram Notes

### 7.1 Stereotypes Legend
- `<<Entity>>` - Database model classes
- `<<Model>>` - Data model classes
- `<<Controller>>` - Business logic controllers
- `<<Service>>` - Service layer classes
- `<<Component>>` - React components
- `<<Context>>` - React context providers
- `<<Utility>>` - Utility/helper classes
- `<<Middleware>>` - Express middleware
- `<<Client>>` - API client classes

### 7.2 Visibility Modifiers
- `+` Public methods/properties
- `-` Private methods/properties
- `#` Protected methods/properties
- `~` Package methods/properties

### 7.3 Multiplicity
- `1` - Exactly one
- `0..1` - Zero or one
- `1..*` - One or more
- `*` - Zero or more
- `1..N` - One to N

## 8. Testing Infrastructure Classes

### 8.1 Backend Testing Setup Classes

#### 8.1.1 MongoTestSetup Class
**File:** `tests/setup.js`
**Stereotypes:** `<<TestSetup>>, <<Configuration>>`

#### Attributes:
- `mongoServer: MongoMemoryServer` - In-memory MongoDB instance
- `TIMEOUT: Number` - Test timeout configuration (30000ms)

#### Methods:
- `beforeAll(): Promise<void>` - Initialize MongoDB Memory Server
- `afterAll(): Promise<void>` - Cleanup test database and server
- `afterEach(): Promise<void>` - Clear all collections between tests

#### Dependencies:
- Uses MongoDB Memory Server
- Uses Mongoose ODM
- Integrates with Jest framework

---

#### 8.1.2 TestHelpers Class
**File:** `tests/helpers/testHelpers.js`
**Stereotypes:** `<<TestUtility>>, <<Helper>>`

#### Static Methods:
- `createTestUser(userData): Promise<User>` - Create test user
- `createTestCar(carData): Promise<Car>` - Create test car
- `createTestBooking(bookingData): Promise<Booking>` - Create test booking
- `loginUser(credentials): Promise<String>` - Get test JWT token
- `cleanupTestData(): Promise<void>` - Clean test data

#### Dependencies:
- Uses User, Car, Booking models
- Uses JWT for token generation

---

#### 8.1.3 AuthControllerTest Class
**File:** `tests/controllers/authController.test.js`
**Stereotypes:** `<<TestSuite>>, <<UnitTest>>`

#### Test Methods:
- `testSignupSuccess(): void` - Test successful user signup
- `testSignupValidationErrors(): void` - Test signup validation
- `testEmailVerificationSuccess(): void` - Test email verification
- `testLoginSuccess(): void` - Test successful login
- `testLoginFailure(): void` - Test login failure
- `testProtectedRoutes(): void` - Test authentication middleware
- `testPasswordReset(): void` - Test password reset flow
- `testProfileUpdate(): void` - Test profile updates

#### Mock Objects:
- `mockUser: Object` - Mock user data
- `mockOTP: Object` - Mock OTP data
- `mockRequest: Object` - Mock Express request
- `mockResponse: Object` - Mock Express response

#### Dependencies:
- Uses Supertest for HTTP testing
- Uses Jest mocking framework
- Uses AuthController

---

#### 8.1.4 CarControllerTest Class
**File:** `tests/controllers/carController.test.js`
**Stereotypes:** `<<TestSuite>>, <<UnitTest>>`

#### Test Methods:
- `testCreateCar(): void` - Test car creation
- `testGetCars(): void` - Test car listing with filters
- `testCarValidation(): void` - Test car data validation
- `testCarImageUpload(): void` - Test image upload
- `testCarSearch(): void` - Test car search functionality
- `testCarPagination(): void` - Test pagination

#### Mock Objects:
- `mockCar: Object` - Mock car data
- `mockMulterFile: Object` - Mock file upload
- `mockCloudinaryResponse: Object` - Mock Cloudinary response

#### Dependencies:
- Uses Supertest for HTTP testing
- Uses CarController
- Uses mock file upload utilities

---

### 8.2 Frontend Testing Setup Classes

#### 8.2.1 VitestSetup Class
**File:** `borrowmycarfrontend/src/tests/setup.js`
**Stereotypes:** `<<TestSetup>>, <<Configuration>>`

#### Configuration:
- `testEnvironment: 'jsdom'` - Browser environment simulation
- `setupFiles: ['./setup.js']` - Test setup files
- `coverage: Object` - Coverage configuration

#### Global Mocks:
- `localStorage: Object` - Mock localStorage API
- `sessionStorage: Object` - Mock sessionStorage API
- `window.matchMedia: Function` - Mock media queries
- `IntersectionObserver: Function` - Mock intersection observer
- `ResizeObserver: Function` - Mock resize observer
- `navigator.geolocation: Object` - Mock geolocation API
- `fetch: Function` - Mock fetch API for external services

#### Static Methods:
- `beforeAll(): void` - Setup global mocks
- `afterEach(): void` - Clean up after each test
- `mockReactRouter(): Object` - Mock React Router hooks and components
- `mockLucideIcons(): Object` - Mock Lucide React icons
- `mockAPI(): Object` - Mock API client

#### Dependencies:
- Uses Vitest testing framework
- Uses React Testing Library
- Uses Jest DOM matchers

---

#### 8.2.2 CarCardTest Class
**File:** `borrowmycarfrontend/src/tests/components/CarCard.test.jsx`
**Stereotypes:** `<<TestSuite>>, <<ComponentTest>>`

#### Test Methods:
- `testCarInfoRendering(): void` - Test car information display
- `testOwnerInfoRendering(): void` - Test owner information display
- `testImageHandling(): void` - Test image display and fallbacks
- `testStatusDisplays(): void` - Test status indicators
- `testNavigationLinks(): void` - Test routing links
- `testRatingDisplay(): void` - Test rating stars
- `testPriceFormatting(): void` - Test price formatting
- `testResponsiveDesign(): void` - Test responsive behavior

#### Mock Objects:
- `mockCar: Object` - Complete car data mock
- `mockOwner: Object` - Car owner data mock
- `mockBrowserRouter: Component` - Mock React Router

#### Test Utilities:
- `renderCarCard(props): RenderResult` - Render component with props
- `fireEvent: Object` - Simulate user interactions
- `screen: Object` - Query rendered elements

#### Dependencies:
- Uses React Testing Library
- Uses Vitest framework
- Uses BrowserRouter wrapper

---

#### 8.2.3 AuthContextTest Class
**File:** `borrowmycarfrontend/src/tests/context/AuthContext.test.jsx`
**Stereotypes:** `<<TestSuite>>, <<ContextTest>>`

#### Test Methods:
- `testInitialState(): void` - Test initial authentication state
- `testUserLogin(): void` - Test login functionality
- `testUserLogout(): void` - Test logout functionality
- `testSignupFlow(): void` - Test signup process
- `testTokenPersistence(): void` - Test token storage
- `testAuthorizationHeaders(): void` - Test API header management
- `testErrorHandling(): void` - Test error states

#### Mock Objects:
- `mockUser: Object` - Mock user data
- `mockAPIResponse: Object` - Mock API responses
- `mockLocalStorage: Object` - Mock localStorage

#### Test Components:
- `TestComponent: Component` - Test wrapper component
- `TestSignupComponent: Component` - Signup test component

#### Test Utilities:
- `renderWithAuthProvider(component): RenderResult` - Render with context
- `waitFor(callback): Promise` - Wait for async operations

#### Dependencies:
- Uses React Testing Library
- Uses Vitest framework
- Uses AuthContext and API mocks

---

### 8.3 Testing Design Patterns

#### 8.3.1 Test Organization Patterns
- **AAA Pattern**: Arrange, Act, Assert structure
- **Test Factory Pattern**: Helper functions for creating test data
- **Mock Object Pattern**: Simulated dependencies and external services
- **Test Fixture Pattern**: Reusable test data and setup

#### 8.3.2 Frontend Testing Patterns
- **Component Testing Pattern**: Isolated component testing
- **Integration Testing Pattern**: Multi-component interaction testing
- **Context Testing Pattern**: Context provider testing
- **User-Centric Testing Pattern**: Testing from user perspective

#### 8.3.3 Backend Testing Patterns
- **Controller Testing Pattern**: HTTP endpoint testing
- **Service Testing Pattern**: Business logic testing
- **Repository Testing Pattern**: Data access testing
- **Middleware Testing Pattern**: Express middleware testing

### 8.4 Test Utility Classes

#### 8.4.1 SupertestClient Class
**Stereotypes:** `<<TestClient>>, <<HTTP>>`

#### Methods:
- `get(endpoint): Test` - GET request test
- `post(endpoint, data): Test` - POST request test
- `put(endpoint, data): Test` - PUT request test
- `delete(endpoint): Test` - DELETE request test
- `authenticate(token): Test` - Add authentication headers

#### Dependencies:
- Uses Supertest library
- Uses Express app instance

---

#### 8.4.2 TestDataFactory Class
**Stereotypes:** `<<Factory>>, <<TestUtility>>`

#### Static Methods:
- `createUserData(overrides): Object` - Generate user test data
- `createCarData(overrides): Object` - Generate car test data
- `createBookingData(overrides): Object` - Generate booking test data
- `createOTPData(overrides): Object` - Generate OTP test data

#### Properties:
- `DEFAULT_USER: Object` - Default user template
- `DEFAULT_CAR: Object` - Default car template
- `DEFAULT_BOOKING: Object` - Default booking template

---

### 8.5 Testing Class Relationships

#### 8.5.1 Backend Testing Dependencies
```
MongoTestSetup --> MongoMemoryServer, Mongoose
TestHelpers --> User, Car, Booking models
AuthControllerTest --> AuthController, TestHelpers
CarControllerTest --> CarController, TestHelpers
SupertestClient --> Express app
```

#### 8.5.2 Frontend Testing Dependencies
```
VitestSetup --> Vitest, React Testing Library, Jest DOM
CarCardTest --> CarCard component, VitestSetup
AuthContextTest --> AuthContext, API mocks, VitestSetup
TestDataFactory --> Mock data generators
```

#### 8.5.3 Testing Infrastructure Flow
```
Test Setup (beforeAll) → Test Execution (it/test) → Test Cleanup (afterEach/afterAll)
                ↓
        Mock Setup → Component/Function Testing → Assertion Validation
                ↓
        Error Handling → Test Reporting → Coverage Analysis
```

### 8.6 Test Coverage Classes

#### 8.6.1 Backend Coverage Configuration
**File:** `jest.config.cjs`
**Stereotypes:** `<<Configuration>>, <<Coverage>>`

#### Coverage Targets:
- Controllers: 80%+ line coverage
- Utils: 90%+ line coverage
- Middlewares: 85%+ line coverage
- Models: 75%+ line coverage

#### Coverage Reporters:
- Text: Console output
- LCOV: CI/CD integration
- HTML: Detailed coverage reports

#### 8.6.2 Frontend Coverage Configuration
**File:** `borrowmycarfrontend/vite.config.test.js`
**Stereotypes:** `<<Configuration>>, <<Coverage>>`

#### Coverage Targets:
- Components: 80%+ line coverage
- Contexts: 85%+ line coverage
- Utilities: 90%+ line coverage
- Hooks: 75%+ line coverage

#### Coverage Exclusions:
- Test files (*.test.js, *.test.jsx)
- Configuration files
- Build artifacts

### 8.7 Testing Best Practices Implemented

#### 8.7.1 Test Isolation
- Each test runs in isolation with clean database state
- Mocks prevent external dependencies
- No shared state between tests

#### 8.7.2 Test Data Management
- Factory pattern for consistent test data
- Automatic cleanup after each test
- In-memory database for fast testing

#### 8.7.3 Mock Strategy
- External APIs mocked to prevent network calls
- Database operations use in-memory storage
- UI components tested with mock implementations

#### 8.7.4 Error Testing
- Validation error scenarios covered
- Network failure simulations
- Edge case handling verified

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Analyze backend models for class identification", "status": "completed", "priority": "high"}, {"id": "2", "content": "Analyze controllers for service classes", "status": "completed", "priority": "high"}, {"id": "3", "content": "Analyze frontend components for UI classes", "status": "completed", "priority": "medium"}, {"id": "4", "content": "Identify utility and helper classes", "status": "completed", "priority": "medium"}, {"id": "5", "content": "Document class relationships and dependencies", "status": "completed", "priority": "high"}, {"id": "6", "content": "Create class diagram specification document", "status": "completed", "priority": "medium"}]