# BorrowMyCar UML Class Diagram

This document contains the comprehensive UML class diagram for the BorrowMyCar application, showing detailed relationships between models, controllers, middlewares, and utility classes.

## Architecture Overview

The BorrowMyCar application follows a layered architecture pattern with:

- **Model Layer**: Database models with business logic
- **Controller Layer**: HTTP request handlers and business logic
- **Middleware Layer**: Authentication, authorization, and request processing
- **Utility Layer**: Helper functions and services

## Core Entity Classes

### User
```
+------------------------------------------+
|                 User                     |
+------------------------------------------+
| - _id: ObjectId                          |
| - name: String                           |
| - email: String [unique]                 |
| - phone: String                          |
| - password: String [select: false]       |
| - profileImage: String                   |
| - role: Enum ["renter", "owner", "admin"]|
| - isApproved: Boolean                    |
| - rejectionReason: String                |
| - drivingLicenseUrl: String              |
| - licenseVerified: Boolean               |
| - licenseVerificationNotes: String       |
| - emiratesIdUrl: String                  |
| - visaUrl: String                        |
| - passportUrl: String                    |
| - preferredCity: String                  |
| - notificationPreferences: Object        |
| - privacySettings: Object                |
| - isEmailVerified: Boolean               |
| - isPhoneVerified: Boolean               |
| - lastLoginAt: Date                      |
| - isBlocked: Boolean                     |
| - blockedAt: Date                        |
| - blockReason: String                    |
| - deletedAt: Date                        |
| - createdAt: Date                        |
| - updatedAt: Date                        |
+------------------------------------------+
| + matchPassword(password: String): Bool  |
| + getPublicProfile(): Object             |
| + getPrivateProfile(): Object            |
| + findPublicProfiles(query): User[]      |
| + phoneDisplay: String [virtual]         |
+------------------------------------------+
```

### Car
```
+------------------------------------------+
|                 Car                      |
+------------------------------------------+
| - _id: ObjectId                          |
| - owner: ObjectId -> User                |
| - title: String                          |
| - description: String                    |
| - city: String                           |
| - price: Number                          |
| - availabilityFrom: Date                 |
| - availabilityTo: Date                   |
| - make: String                           |
| - model: String                          |
| - year: Number                           |
| - color: String                          |
| - plateNumber: String                    |
| - transmission: Enum                     |
| - fuelType: Enum                         |
| - mileage: Number                        |
| - seatingCapacity: Number                |
| - specifications: String                 |
| - features: String[]                     |
| - images: String[]                       |
| - isInstantApproval: Boolean             |
| - minimumRentalDays: Number              |
| - maximumRentalDays: Number              |
| - deliveryAvailable: Boolean             |
| - deliveryFee: Number                    |
| - securityDeposit: Number                |
| - status: Enum                           |
| - totalBookings: Number                  |
| - averageRating: Number                  |
| - adminNotes: String                     |
| - rejectionReason: String                |
| - deletedAt: Date                        |
| - createdAt: Date                        |
| - updatedAt: Date                        |
+------------------------------------------+
| + pricePerDay: Number [virtual]          |
+------------------------------------------+
```

### Booking
```
+------------------------------------------+
|                Booking                   |
+------------------------------------------+
| - _id: ObjectId                          |
| - renter: ObjectId -> User               |
| - car: ObjectId -> Car                   |
| - startDate: Date                        |
| - endDate: Date                          |
| - totalDays: Number                      |
| - dailyRate: Number                      |
| - totalAmount: Number                    |
| - securityDeposit: Number                |
| - deliveryFee: Number                    |
| - totalPayable: Number                   |
| - status: Enum                           |
| - paymentMethod: Enum                    |
| - paymentStatus: Enum                    |
| - transactionId: String                  |
| - paymentIntentId: String                |
| - paidAt: Date                           |
| - pickupLocation: String                 |
| - returnLocation: String                 |
| - pickupTime: Date                       |
| - returnTime: Date                       |
| - actualReturnTime: Date                 |
| - deliveryRequested: Boolean             |
| - deliveryAddress: String                |
| - renterNotes: String                    |
| - ownerNotes: String                     |
| - adminNotes: String                     |
| - preRentalCondition: String             |
| - postRentalCondition: String            |
| - damageReported: Boolean                |
| - damageDescription: String              |
| - cancellationReason: String             |
| - cancelledBy: String                    |
| - cancellationFee: Number                |
| - renterReview: Object                   |
| - ownerReview: Object                    |
| - approvedAt: Date                       |
| - confirmedAt: Date                      |
| - completedAt: Date                      |
| - expiresAt: Date                        |
| - createdAt: Date                        |
| - updatedAt: Date                        |
+------------------------------------------+
| + findConflictingBookings(): Booking     |
+------------------------------------------+
```

### Notification
```
+------------------------------------------+
|              Notification                |
+------------------------------------------+
| - _id: ObjectId                          |
| - user: ObjectId -> User                 |
| - type: Enum                             |
| - title: String                          |
| - message: String                        |
| - isRead: Boolean                        |
| - readAt: Date                           |
| - data: Object                           |
|   - bookingId: ObjectId -> Booking       |
|   - carId: ObjectId -> Car               |
|   - amount: Number                       |
|   - actionBy: ObjectId -> User           |
|   - rejectionReason: String              |
|   - redirectUrl: String                  |
| - priority: Enum                         |
| - scheduledFor: Date                     |
| - isSent: Boolean                        |
| - sentAt: Date                           |
| - channels: Object                       |
| - deliveryStatus: Object                 |
| - deletedAt: Date                        |
| - createdAt: Date                        |
| - updatedAt: Date                        |
+------------------------------------------+
| + createAccountApprovalNotification()    |
| + createAccountRejectionNotification()   |
| + createBookingNotification()            |
| + createPaymentNotification()            |
| + markAsRead(): void                     |
| + softDelete(): void                     |
| + getUnreadCount(userId): Number         |
| + markAllAsReadForUser(userId): void     |
| + getUserNotifications(): Notification[] |
+------------------------------------------+
```

### OTP
```
+------------------------------------------+
|                 OTP                      |
+------------------------------------------+
| - _id: ObjectId                          |
| - email: String                          |
| - otp: String                            |
| - purpose: Enum                          |
| - expiresAt: Date                        |
| - isUsed: Boolean                        |
| - attempts: Number                       |
| - userData: Mixed                        |
| - createdAt: Date                        |
| - updatedAt: Date                        |
+------------------------------------------+
| + generateOTP(): String                  |
| + createOTP(email, purpose, userData)    |
| + verifyOTP(email, otp, purpose)         |
| + cleanupExpired(): Number               |
+------------------------------------------+
```

## Controller Classes

### AuthController
```
+------------------------------------------+
|             AuthController               |
+------------------------------------------+
| - handleAsyncErrorLocal: Function        |
| - generateToken: Function                |
| - sendTokenResponse: Function            |
| - sanitizeUserData: Function             |
| - validateUserData: Function             |
+------------------------------------------+
| + signup(req, res, next): void           |
| + login(req, res, next): void            |
| + logout(req, res, next): void           |
| + forgotPassword(req, res, next): void   |
| + resetPassword(req, res, next): void    |
| + updatePassword(req, res, next): void   |
| + updateProfile(req, res, next): void    |
| + deleteAccount(req, res, next): void    |
| + verifyToken(req, res, next): void      |
| + refreshToken(req, res, next): void     |
+------------------------------------------+
```

### CarController
```
+------------------------------------------+
|             CarController                |
+------------------------------------------+
| - sanitizeCarData: Function              |
| - validateCarData: Function              |
+------------------------------------------+
| + createCar(req, res, next): void        |
| + getAllCars(req, res, next): void       |
| + getCarById(req, res, next): void       |
| + updateCar(req, res, next): void        |
| + deleteCar(req, res, next): void        |
| + getOwnerCars(req, res, next): void     |
| + searchCars(req, res, next): void       |
| + getCarsByCity(req, res, next): void    |
| + updateCarStatus(req, res, next): void  |
| + getCarAvailability(req, res, next): void|
+------------------------------------------+
```

### BookingController
```
+------------------------------------------+
|            BookingController             |
+------------------------------------------+
| - checkBookingConflicts: Function        |
| - calculateBookingPricing: Function      |
+------------------------------------------+
| + createBooking(req, res, next): void    |
| + getUserBookings(req, res, next): void  |
| + getBookingById(req, res, next): void   |
| + updateBookingStatus(req, res, next): void|
| + cancelBooking(req, res, next): void    |
| + getOwnerBookings(req, res, next): void |
| + approveBooking(req, res, next): void   |
| + rejectBooking(req, res, next): void    |
| + completeBooking(req, res, next): void  |
| + addReview(req, res, next): void        |
+------------------------------------------+
```

### PaymentController
```
+------------------------------------------+
|            PaymentController             |
+------------------------------------------+
| - stripe: Stripe                         |
+------------------------------------------+
| + getStripeConfig(req, res, next): void  |
| + processPayment(req, res, next): void   |
| + createPaymentIntent(req, res, next): void|
| + handleWebhook(req, res, next): void    |
| + refundPayment(req, res, next): void    |
| + getPaymentHistory(req, res, next): void|
+------------------------------------------+
```

### AdminController
```
+------------------------------------------+
|            AdminController               |
+------------------------------------------+
| + getAdminStats(req, res, next): void    |
| + getPendingUsers(req, res, next): void  |
| + approveUser(req, res, next): void      |
| + rejectUser(req, res, next): void       |
| + getPendingCars(req, res, next): void   |
| + approveCar(req, res, next): void       |
| + rejectCar(req, res, next): void        |
| + getAllUsers(req, res, next): void      |
| + getAllCars(req, res, next): void       |
| + getAllBookings(req, res, next): void   |
| + blockUser(req, res, next): void        |
| + unblockUser(req, res, next): void      |
| + getSystemLogs(req, res, next): void    |
+------------------------------------------+
```

### NotificationController
```
+------------------------------------------+
|          NotificationController          |
+------------------------------------------+
| - handleAsyncErrorLocal: Function        |
+------------------------------------------+
| + getUserNotifications(req, res, next): void|
| + markNotificationRead(req, res, next): void|
| + markAllNotificationsRead(req, res, next): void|
| + deleteNotification(req, res, next): void|
| + getUnreadCount(req, res, next): void   |
| + updateNotificationPreferences(req, res, next): void|
+------------------------------------------+
```

## Utility Classes

### CloudUploader
```
+------------------------------------------+
|            CloudUploader                 |
+------------------------------------------+
| + uploadImagesToCloud(files): String[]   |
| + deleteImagesFromCloud(urls): void      |
| + uploadSingleImage(file): String        |
+------------------------------------------+
```

### ErrorHandler
```
+------------------------------------------+
|            ErrorHandler                  |
+------------------------------------------+
| + handleAsyncError(fn): Function         |
| + AppError: Class                        |
| + globalErrorHandler: Function           |
+------------------------------------------+
```

### PhoneUtils
```
+------------------------------------------+
|             PhoneUtils                   |
+------------------------------------------+
| + formatUAEPhone(phone): String          |
| + validateUAEPhone(phone): Boolean       |
| + displayUAEPhone(phone): String         |
+------------------------------------------+
```

### EmailService
```
+------------------------------------------+
|            EmailService                  |
+------------------------------------------+
| + sendWelcomeEmail(user): void           |
| + sendOTPEmail(email, otp): void         |
| + sendPasswordResetEmail(user, token): void|
| + sendBookingConfirmation(booking): void |
| + sendNotificationEmail(notification): void|
+------------------------------------------+
```

## Mermaid Class Diagram

```mermaid
classDiagram
    %% Model Classes
    class User {
        -ObjectId _id
        -String name
        -String email
        -String phone
        -String role
        -Boolean isApproved
        -String profileImage
        -String drivingLicenseUrl
        -String emiratesIdUrl
        -Object notificationPreferences
        -Object privacySettings
        -Boolean isEmailVerified
        -Boolean isPhoneVerified
        -Date lastLoginAt
        -Boolean isBlocked
        -Date deletedAt
        -Date createdAt
        +matchPassword(password) Boolean
        +getPublicProfile() Object
        +getPrivateProfile() Object
        +findPublicProfiles(query) User[]
    }

    class Car {
        -ObjectId _id
        -ObjectId owner
        -String title
        -String description
        -String city
        -Number price
        -Date availabilityFrom
        -Date availabilityTo
        -String make
        -String model
        -Number year
        -String color
        -String plateNumber
        -String transmission
        -String fuelType
        -Number mileage
        -Number seatingCapacity
        -String specifications
        -String[] features
        -String[] images
        -Boolean isInstantApproval
        -Number minimumRentalDays
        -Number maximumRentalDays
        -Boolean deliveryAvailable
        -Number deliveryFee
        -Number securityDeposit
        -String status
        -Number totalBookings
        -Number averageRating
        -String adminNotes
        -String rejectionReason
        -Date deletedAt
        -Date createdAt
    }

    class Booking {
        -ObjectId _id
        -ObjectId renter
        -ObjectId car
        -Date startDate
        -Date endDate
        -Number totalDays
        -Number dailyRate
        -Number totalAmount
        -Number securityDeposit
        -Number deliveryFee
        -Number totalPayable
        -String status
        -String paymentMethod
        -String paymentStatus
        -String transactionId
        -String paymentIntentId
        -Date paidAt
        -String pickupLocation
        -String returnLocation
        -Date pickupTime
        -Date returnTime
        -Date actualReturnTime
        -Boolean deliveryRequested
        -String deliveryAddress
        -String renterNotes
        -String ownerNotes
        -String adminNotes
        -Object renterReview
        -Object ownerReview
        -Date approvedAt
        -Date confirmedAt
        -Date completedAt
        -Date expiresAt
        -Date createdAt
        +findConflictingBookings(carId, startDate, endDate) Booking
    }

    class Notification {
        -ObjectId _id
        -ObjectId user
        -String type
        -String title
        -String message
        -Boolean isRead
        -Date readAt
        -Object data
        -String priority
        -Date scheduledFor
        -Boolean isSent
        -Date sentAt
        -Object channels
        -Object deliveryStatus
        -Date deletedAt
        -Date createdAt
        +createAccountApprovalNotification(userId) Notification
        +createAccountRejectionNotification(userId, reason) Notification
        +createBookingNotification(userId, type, bookingId, carTitle) Notification
        +createPaymentNotification(userId, type, amount, bookingId) Notification
        +markAsRead() void
        +softDelete() void
        +getUnreadCount(userId) Number
        +markAllAsReadForUser(userId) void
        +getUserNotifications(userId, options) Notification[]
    }

    class OTP {
        -ObjectId _id
        -String email
        -String otp
        -String purpose
        -Date expiresAt
        -Boolean isUsed
        -Number attempts
        -Mixed userData
        -Date createdAt
        +generateOTP() String
        +createOTP(email, purpose, userData) Object
        +verifyOTP(email, otp, purpose) Object
        +cleanupExpired() Number
    }

    %% Controller Classes
    class AuthController {
        -Function handleAsyncErrorLocal
        -Function generateToken
        -Function sendTokenResponse
        -Function sanitizeUserData
        -Function validateUserData
        +signup(req, res, next) void
        +login(req, res, next) void
        +logout(req, res, next) void
        +forgotPassword(req, res, next) void
        +resetPassword(req, res, next) void
        +updatePassword(req, res, next) void
        +updateProfile(req, res, next) void
        +deleteAccount(req, res, next) void
        +verifyToken(req, res, next) void
        +refreshToken(req, res, next) void
    }

    class CarController {
        -Function sanitizeCarData
        -Function validateCarData
        +createCar(req, res, next) void
        +getAllCars(req, res, next) void
        +getCarById(req, res, next) void
        +updateCar(req, res, next) void
        +deleteCar(req, res, next) void
        +getOwnerCars(req, res, next) void
        +searchCars(req, res, next) void
        +getCarsByCity(req, res, next) void
        +updateCarStatus(req, res, next) void
        +getCarAvailability(req, res, next) void
    }

    class BookingController {
        -Function checkBookingConflicts
        -Function calculateBookingPricing
        +createBooking(req, res, next) void
        +getUserBookings(req, res, next) void
        +getBookingById(req, res, next) void
        +updateBookingStatus(req, res, next) void
        +cancelBooking(req, res, next) void
        +getOwnerBookings(req, res, next) void
        +approveBooking(req, res, next) void
        +rejectBooking(req, res, next) void
        +completeBooking(req, res, next) void
        +addReview(req, res, next) void
    }

    class PaymentController {
        -Stripe stripe
        +getStripeConfig(req, res, next) void
        +processPayment(req, res, next) void
        +createPaymentIntent(req, res, next) void
        +handleWebhook(req, res, next) void
        +refundPayment(req, res, next) void
        +getPaymentHistory(req, res, next) void
    }

    class AdminController {
        +getAdminStats(req, res, next) void
        +getPendingUsers(req, res, next) void
        +approveUser(req, res, next) void
        +rejectUser(req, res, next) void
        +getPendingCars(req, res, next) void
        +approveCar(req, res, next) void
        +rejectCar(req, res, next) void
        +getAllUsers(req, res, next) void
        +getAllCars(req, res, next) void
        +getAllBookings(req, res, next) void
        +blockUser(req, res, next) void
        +unblockUser(req, res, next) void
        +getSystemLogs(req, res, next) void
    }

    class NotificationController {
        -Function handleAsyncErrorLocal
        +getUserNotifications(req, res, next) void
        +markNotificationRead(req, res, next) void
        +markAllNotificationsRead(req, res, next) void
        +deleteNotification(req, res, next) void
        +getUnreadCount(req, res, next) void
        +updateNotificationPreferences(req, res, next) void
    }

    %% Utility Classes
    class PhoneUtils {
        +formatUAEPhone(phone) String
        +validateUAEPhone(phone) Boolean
        +displayUAEPhone(phone) String
    }

    class CloudUploader {
        +uploadImagesToCloud(files) String[]
        +deleteImagesFromCloud(urls) void
        +uploadSingleImage(file) String
    }

    class EmailService {
        +sendWelcomeEmail(user) void
        +sendOTPEmail(email, otp) void
        +sendPasswordResetEmail(user, token) void
        +sendBookingConfirmation(booking) void
        +sendNotificationEmail(notification) void
    }

    class ErrorHandler {
        +handleAsyncError(fn) Function
        +AppError Class
        +globalErrorHandler Function
    }

    %% Relationships
    User ||--o{ Car : owns
    User ||--o{ Booking : rents
    Car ||--o{ Booking : books
    User ||--o{ Notification : receives
    User ||--o{ OTP : verifies
    Booking ||--o{ Notification : triggers
    Car ||--o{ Notification : triggers

    %% Controller Dependencies
    AuthController ..> User : uses
    AuthController ..> OTP : uses
    AuthController ..> CloudUploader : uses
    AuthController ..> PhoneUtils : uses
    AuthController ..> EmailService : uses
    AuthController ..> ErrorHandler : uses

    CarController ..> Car : uses
    CarController ..> Booking : uses
    CarController ..> CloudUploader : uses
    CarController ..> ErrorHandler : uses

    BookingController ..> Booking : uses
    BookingController ..> Car : uses
    BookingController ..> Notification : uses
    BookingController ..> ErrorHandler : uses

    PaymentController ..> Booking : uses
    PaymentController ..> Car : uses
    PaymentController ..> Notification : uses
    PaymentController ..> ErrorHandler : uses

    AdminController ..> User : uses
    AdminController ..> Car : uses
    AdminController ..> Booking : uses
    AdminController ..> Notification : uses
    AdminController ..> ErrorHandler : uses

    NotificationController ..> Notification : uses
    NotificationController ..> ErrorHandler : uses
```

## Class Descriptions

### Model Classes

#### User
- **Purpose**: Represents system users (renters, owners, admins)
- **Key Features**: Authentication, profile management, role-based access
- **Methods**: Password matching, profile data retrieval, user queries

#### Car
- **Purpose**: Represents car listings in the system
- **Key Features**: Car details, availability, pricing, features
- **Relationships**: Owned by User, can be booked via Booking

#### Booking
- **Purpose**: Represents rental bookings between renters and car owners
- **Key Features**: Date management, pricing calculation, status tracking
- **Methods**: Conflict detection, pricing calculation

#### Notification
- **Purpose**: Handles in-app notifications for users
- **Key Features**: Real-time notifications, delivery tracking, user preferences
- **Methods**: Various notification creation methods, read status management

#### OTP
- **Purpose**: Manages one-time passwords for verification
- **Key Features**: Email verification, password reset, signup verification
- **Methods**: OTP generation, verification, cleanup

### Controller Classes

#### AuthController
- **Purpose**: Handles authentication and user management
- **Key Features**: JWT token management, password operations, profile updates
- **Dependencies**: User, OTP, CloudUploader, PhoneUtils, EmailService

#### CarController
- **Purpose**: Manages car listings and operations
- **Key Features**: CRUD operations, search functionality, validation
- **Dependencies**: Car, Booking, CloudUploader, Validators

#### BookingController
- **Purpose**: Handles rental booking operations
- **Key Features**: Booking creation, conflict checking, status management
- **Dependencies**: Booking, Car, Notification, ErrorHandler

#### NotificationController
- **Purpose**: Manages user notifications
- **Key Features**: Notification CRUD, read status, preferences
- **Dependencies**: Notification, ErrorHandler

### Middleware Classes

#### AuthMiddleware
- **Purpose**: Handles authentication and authorization
- **Key Features**: JWT verification, role-based access control
- **Dependencies**: User, ErrorHandler

### Utility Classes

#### PhoneUtils
- **Purpose**: UAE phone number validation and formatting
- **Key Features**: Format conversion, validation patterns

#### Validators
- **Purpose**: Input validation for API endpoints
- **Key Features**: Express-validator chains, custom validation rules
- **Dependencies**: PhoneUtils

#### CloudUploader
- **Purpose**: Handles file uploads to cloud storage
- **Key Features**: Image upload, deletion, Cloudinary integration

#### EmailService
- **Purpose**: Email sending functionality
- **Key Features**: Various email types, SMTP integration

#### ErrorHandler
- **Purpose**: Centralized error handling
- **Key Features**: Async error wrapper, custom error classes, global error handler

## Relationship Types

- **Solid lines (||--o{)**: Entity relationships (composition/aggregation)
- **Dashed lines (..>)**: Dependencies (uses relationship)
- **Visibility indicators**: 
  - `-` for private attributes
  - `+` for public methods

## Usage Notes

1. **Models** define the data structure and business logic
2. **Controllers** handle HTTP requests and coordinate between models and utilities
3. **Middlewares** provide cross-cutting concerns like authentication
4. **Utilities** offer reusable helper functions and services

This architecture promotes separation of concerns, maintainability, and scalability in the BorrowMyCar application.