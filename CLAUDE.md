# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

BorrowMyCar is a full-stack car rental platform for the UAE with a Node.js/Express backend and React frontend:

- **Backend (root)**: Express.js API with MongoDB/Mongoose, authentication, payments, and file uploads
- **Frontend (`borrowmycarfrontend/`)**: React + Vite application with Tailwind CSS, Mapbox integration, and Stripe payments

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
Tests are not yet implemented - when adding tests, check existing patterns in the codebase first.