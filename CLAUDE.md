# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

BorrowMyCar is a full-stack car rental platform for the UAE with a Node.js/Express backend and React frontend:

- **Package Management**: Always yse Bun package manager for both backend and frontend
- **Backend (root)**: Express.js API with MongoDB/Mongoose, authentication, payments, and file uploads
- **Frontend (`borrowmycarfrontend/`)**: React + Vite application with Tailwind CSS, Mapbox integration, and Stripe payments

### Complete Directory Structure

```
BorrowMyCar Vibecoding/
├── .aidigestignore
├── .env
├── .gitignore
├── CLAUDE.md
├── README.md
├── TESTING.md
├── bun.lockb
├── codebase.md
├── index.js
├── jest.config.cjs
├── jsconfig.json
├── package-lock.json
├── package.json
│
├── BorrowMyCarTwo/                          # [Empty directory]
│
├── borrowmycarfrontend/                     # Frontend React Application
│   ├── .gitignore
│   ├── README.md
│   ├── bun.lockb
│   ├── codebase.md
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── vite.config.js
│   ├── vite.config.test.js
│   │
│   ├── public/
│   │   └── vite.svg
│   │
│   ├── src/
│   │   ├── App.jsx                          # Main app component
│   │   ├── BrowseCars.jsx                   # Car browsing page
│   │   ├── CarDetails.jsx                   # Individual car details
│   │   ├── CarFilterBar.jsx                 # Car filtering component
│   │   ├── CarListingSection.jsx            # Car listing display
│   │   ├── Footer.jsx                       # Footer component
│   │   ├── HowItWorks.jsx                   # How it works page
│   │   ├── ListCar.jsx                      # Car listing form
│   │   ├── Login.jsx                        # Login page
│   │   ├── MyBookings.jsx                   # User bookings page
│   │   ├── Navbar.jsx                       # Navigation component
│   │   ├── NotFound.jsx                     # 404 page
│   │   ├── PaymentSuccess.jsx               # Payment success page
│   │   ├── Profile.jsx                      # User profile page
│   │   ├── SeedData.jsx                     # Data seeding component
│   │   ├── Settings.jsx                     # User settings page
│   │   ├── Signup.jsx                       # Registration page
│   │   ├── api.js                           # API client configuration
│   │   ├── global.css                       # Global styles
│   │   ├── index.jsx                        # App entry point
│   │   │
│   │   ├── assets/
│   │   │   ├── BorrowMyCar.png             # App logo
│   │   │   ├── react.svg                   # React logo
│   │   │   │
│   │   │   └── services/
│   │   │       └── paymentService.js       # Payment service utilities
│   │   │
│   │   ├── components/
│   │   │   ├── ButtonAccent.jsx            # Styled button component
│   │   │   ├── CarCard.jsx                 # Car display card
│   │   │   ├── DeliveryLocationPicker.jsx  # Location picker for delivery
│   │   │   ├── GeocodingSearch.jsx         # Geocoding search component
│   │   │   ├── LocationPicker.jsx          # General location picker
│   │   │   ├── MapSearchView.jsx           # Map search interface
│   │   │   ├── NearbyCars.jsx              # Nearby cars component
│   │   │   ├── PaymentForm.jsx             # Payment form component
│   │   │   ├── PaymentModal.jsx            # Payment modal dialog
│   │   │   ├── PhoneInput.jsx              # UAE phone input component
│   │   │   ├── ProfilePictureManager.jsx   # Profile picture upload
│   │   │   ├── ProtectedRoute.jsx          # Route protection component
│   │   │   ├── RouteToCarModal.jsx         # Route directions modal
│   │   │   │
│   │   │   └── Mapbox/
│   │   │       ├── BaseMap.jsx             # Base map component
│   │   │       └── CarLocationMap.jsx      # Car location map
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx             # Authentication context
│   │   │   ├── AuthProvider.jsx            # Auth provider component
│   │   │   ├── PaymentContext.jsx          # Payment context
│   │   │   └── StripeProvider.jsx          # Stripe provider wrapper
│   │   │
│   │   ├── hooks/
│   │   │   └── useLocationSearch.js        # Location search hook
│   │   │
│   │   ├── pages/
│   │   │   ├── BookingSuccess.jsx          # Booking confirmation page
│   │   │   └── Checkout.jsx                # Checkout page
│   │   │
│   │   └── tests/                          # Frontend test files
│   │       ├── setup.js                    # Test setup configuration
│   │       │
│   │       ├── components/
│   │       │   ├── CarCard.test.jsx        # CarCard component tests
│   │       │   └── PhoneInput.test.jsx     # PhoneInput component tests
│   │       │
│   │       └── context/
│   │           └── AuthContext.test.jsx    # AuthContext tests
│   │
│   └── node_modules/                        # Frontend dependencies
│
├── config/                                  # Backend Configuration
│   ├── db.js                               # Database configuration
│   ├── mapbox.js                           # Mapbox configuration
│   └── stripe.js                           # Stripe configuration
│
├── controllers/                             # Backend Controllers (MVC)
│   ├── authController.js                   # Authentication logic
│   ├── bookingController.js                # Booking management
│   ├── carController.js                    # Car management
│   └── paymentController.js                # Payment processing
│
├── middlewares/                             # Backend Middleware
│   ├── authMiddleware.js                   # JWT authentication middleware
│   └── multer.js                           # File upload middleware
│
├── models/                                  # Database Models (Mongoose)
│   ├── Booking.js                          # Booking model schema
│   ├── Car.js                              # Car model schema
│   └── User.js                             # User model schema
│
├── routes/                                  # API Routes
│   ├── authRoutes.js                       # Authentication endpoints
│   ├── bookingRoutes.js                    # Booking endpoints
│   ├── carRoutes.js                        # Car management endpoints
│   └── paymentRoutes.js                    # Payment endpoints
│
├── scripts/                                 # Utility Scripts
│   ├── cleanupIndexes.js                   # Database index cleanup
│   └── seedData.js                         # Database seeding
│
├── tests/                                   # Backend Test Files
│   ├── setup.js                            # Test setup configuration
│   │
│   ├── controllers/
│   │   ├── authController.test.js          # Auth controller tests
│   │   ├── bookingController.test.js       # Booking controller tests
│   │   └── carController.test.js           # Car controller tests
│   │
│   ├── helpers/
│   │   └── testHelpers.js                  # Test utility functions
│   │
│   ├── integration/
│   │   └── carBooking.test.js              # Integration tests
│   │
│   └── utils/
│       ├── phoneUtils.test.js              # Phone utilities tests
│       └── validators.test.js              # Validation tests
│
├── utils/                                   # Backend Utilities
│   ├── BookingValidation.js                # Booking validation logic
│   ├── cloudUploader.js                    # Cloud upload utilities
│   ├── cloudinary.js                       # Cloudinary integration
│   ├── errorHandler.js                     # Error handling utilities
│   ├── locationUtils.js                    # Location utilities
│   ├── mapboxUtils.js                      # Mapbox utilities
│   ├── phoneUtils.js                       # UAE phone validation
│   └── validators.js                       # Input validation
│
└── node_modules/                            # Backend dependencies
```

## Project Requirements

You write code using only the best coding practices. You are making a car renting app called borrowmycar Here is a structured breakdown of each core feature in the BorrowMyCar app, with clear headings, subheadings, and detailed logic descriptions for frontend + backend integration. 1. User Accounts & Roles A. User Roles • Renter: A user (tourist or local) who books cars. • Owner (Lender): A user who lists their own cars for others to rent. • Admin: The backend moderator who verifies users and manages content. B. Account Creation Logic • User signs up via frontend with name, email, password, and uploads: – Emirates ID / Visa – Valid driving license (UAE for residents, international for tourists) • Role is selected during registration (renter or owner). C. Account Verification Logic (Admin Side) • Admin checks uploaded documents and sets isApproved = true. • Until approved: – Renter cannot book – Owner cannot list cars 2. Car Listing (Owner Feature) A. Car Listing Fields • Owner uploads: – Title, Description, City, Price – Car specifications (fuel type, year, mileage, transmission, etc.) – Multiple images (stored via Cloudinary) – Availability dates (availabilityFrom, availabilityTo) B. Car Listing Logic • Form data is sent as multipart/form-data • Backend uses: – sanitizeCarData() and validateCarData() – uploadImagesToCloud() for file storage • Car saved with status = "active" (pending approval optional) 3. Car Browsing, Search, and Filtering A. Public Browsing Logic • Unverified users can still browse: – Cars are shown with filters: city, price range, transmission, year, fuel type • Search bar lets user find cars by title or model name B. Filtering/Sorting • Frontend sends query params: /api/cars?city=Dubai&minPrice=100&fuelType=Hybrid • Backend handles Mongoose filtering and returns paginated results 4. Availability Calendar A. Owner Logic • Owner selects start and end dates for car availability • Stored as availabilityFrom and availabilityTo in DB B. Booking Restrictions • Cars cannot be booked outside the availability range • Backend must check: if (req.body.startDate < car.availabilityFrom || req.body.endDate > car.availabilityTo) return next(new AppError("Selected dates are outside car availability", 400)); 5. JWT Authentication & Route Protection A. JWT Login/Signup Flow • User signs in → JWT token is issued • Token is stored in localStorage or HTTP-only cookie B. Protected Routes Logic • Backend uses protect middleware to verify token • Optional: restrictTo("admin") or restrictTo("owner") for role-based access 6. Booking System (Renter Feature) A. Booking Flow 1. Renter selects car and date range. 2. Booking request sent with: { "carId": "...", "startDate": "...", "endDate": "..." } 3. Backend: – Checks if user is approved – Checks if car is available in that range – Checks if there’s no existing overlapping booking B. Double Booking Prevention Booking.findOne({ car: carId, $or: [ { startDate: { $lte: endDate }, endDate: { $gte: startDate } } ] }); C. Booking Approval Logic • Owners can choose: – Manual approval (booking status: pending) – Instant approval (auto set to approved) • Status options: "pending", "approved", "rejected" 7. Payment Handling (Manual & Future Integration) A. Current Logic • Renter selects payment method: Cash, Card, Bank Transfer • No live processing yet — shown as frontend choice B. Future Logic • Use Stripe, Tap, or PayPal for card handling • Option to hold funds in escrow until trip ends 8. Admin Dashboard (To be Built) A. Admin Functionalities • View and verify: – New users – New car listings • Approve or reject accounts • Toggle isApproved, status, and role fields 9. Cloudinary File Upload (Image Storage) A. Upload Flow • multer handles multipart/form-data • Images passed to Cloudinary via: cloudinary.v2.uploader.upload(file.path, { folder: "borrowmycar" }) • URLs saved in car.images[] 10. Error Handling & Validation A. Custom Error System • AppError class for manual errors • handleAsyncError() for clean route handlers • globalErrorHandler() for consistent API responses B. Form Validation • validateCarData() ensures all fields are safe • Sanitization prevents malicious input

## Development Commands

### Backend Development

```bash
npm run dev              # Start backend with nodemon
npm run start           # Production start
npm run seed            # Seed database with test data
npm run cleanup:indexes # Clean up duplicate MongoDB indexes
npm run fresh:start     # Full reset: cleanup, seed, and start both servers
```

### Frontend Development

```bash
cd borrowmycarfrontend
npm run dev            # Start Vite dev server
npm run build          # Production build
npm run lint           # ESLint checking
```

### Full Stack Development

```bash
npm run dev:both       # Start both backend and frontend concurrently
npm run setup          # Install all dependencies (backend + frontend)
```

## Architecture Overview

### Backend Architecture

- **MVC Pattern**: Controllers handle business logic, models define data schemas, routes handle HTTP endpoints
- **Authentication**: JWT-based auth with bcrypt password hashing, protected routes via middleware
- **Database**: MongoDB with Mongoose ODM, includes User, Car, and Booking models
- **File Uploads**: Cloudinary integration via multer for car images and profile pictures
- **Payments**: Stripe integration for booking payments and refunds
- **Geolocation**: Mapbox integration for location-based car searching and routing

### Frontend Architecture

- **React Router v7**: File-based routing with protected routes for authenticated users
- **Context Providers**: AuthProvider for user state, PaymentProvider for Stripe integration
- **Component Structure**: Reusable components in `/components`, page components in root and `/pages`
- **State Management**: React Context for global state (auth, payments)
- **Styling**: Tailwind CSS with custom utility classes
- **Maps**: Mapbox GL JS integration for interactive maps and location features

### Key Integrations

- **Stripe**: Payment processing with webhooks for booking confirmations
- **Cloudinary**: Image storage and optimization for car photos and user avatars
- **Mapbox**: Location services, geocoding, and route visualization
- **Twilio**: SMS notifications (configured but not fully implemented)

### Environment Configuration

Both backend and frontend require `.env` files with API keys for:

- MongoDB connection string
- JWT secret
- Stripe keys (public/secret)
- Cloudinary credentials
- Mapbox access token

### Data Models

- **User**: Profile with UAE phone validation, authentication, and car ownership
- **Car**: Listings with location data, pricing, images, and availability
- **Booking**: Rental transactions with payment tracking, status, and time ranges

### Phone Number Handling

UAE-specific phone validation and formatting utilities in `utils/phoneUtils.js` handle local and international formats.

### Testing

- **Backend**: Jest with `npm run test` or `npm run test:watch` for watch mode
- **Frontend**: Vitest with `npm run test` or `npm run test:watch` for watch mode
- Test files follow `*.test.js` or `*.test.jsx` pattern
- Backend tests in `/tests/` directory with setup in `tests/setup.js`
- Frontend tests in `src/tests/` directory with setup in `src/tests/setup.js`

## Important File Locations

### Key Backend Files

- `utils/phoneUtils.js` - UAE phone number validation and formatting
- `utils/validators.js` - Input validation and sanitization utilities
- `controllers/` - Business logic handlers for API endpoints
- `middlewares/authMiddleware.js` - JWT authentication and route protection
- `config/` - Database, Stripe, and Mapbox configuration

### Key Frontend Files

- `src/context/AuthContext.jsx` - Global authentication state management
- `src/components/ProtectedRoute.jsx` - Route protection component
- `src/api.js` - Axios configuration and API client setup
- `src/components/Mapbox/` - Mapbox integration components
- `src/components/PaymentModal.jsx` - Stripe payment processing

## Development Guidelines

### Code Quality

- Always run `npm run lint` in the frontend directory before committing
- Use existing patterns and conventions found in the codebase
- Follow the established MVC pattern in the backend
- Maintain UAE-specific validation patterns for phone numbers and locations

### Security Considerations

- Never commit API keys or sensitive data to the repository
- Always validate and sanitize user input using existing validator utilities
- Use the established JWT authentication patterns for protected routes
- Follow existing file upload patterns with Cloudinary integration

# Some instructions to remember for you

Be brutually honest, don't be a yes man
If I am wrong point it out bluntly
I need honest feedback on my code
Also don't remove any features and replace it with a temporary one fix the feature completely and make it functional when there is a problem
