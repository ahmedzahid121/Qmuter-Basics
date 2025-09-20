# Qmuter - Community Route Sharing

Qmuter is a modern web application designed to simplify and encourage commute sharing. It connects drivers and passengers with similar routes, making travel more sustainable, affordable, and community-driven.

## ✨ Core Features

-   **Community-Focused Route Sharing:** Instead of on-demand rides, Qmuter is built around fixed, shared routes posted by the community.
-   **Dual Roles:** Users can seamlessly switch between being a **Driver** offering a route and a **Passenger** looking for one.
-   **Secure Authentication:** Robust sign-up and login system supporting Email/Password, Google, and Apple sign-in.
-   **Email Verification:** Firebase-powered email verification system with automatic verification emails and status tracking.
-   **User Onboarding:** A friendly, multi-step onboarding process including display name selection to personalize the user experience.
-   **Route Management:** Comprehensive backend system for creating, approving, and managing route proposals.
-   **Comprehensive Admin Portal:** Advanced analytics dashboard with real-time data, user management, route analytics, transaction tracking, system alerts, and emergency management.
-   **GTFS Integration:** Real-time Auckland Transport data integration with secure API proxying, caching, and rate limiting.
-   **Zone-Based Pricing:** Dynamic fare calculation based on GTFS stop locations with geographic clustering.
-   **Emergency Response System:** Enterprise-grade safety features with real-time monitoring, audit trails, and admin controls.
-   **Wallet System:** In-app wallet that users must fund before booking or offering routes, ensuring user commitment.
-   **Gamification & Rewards:** Users earn badges and progress through tiers based on their eco-friendly contributions.
-   **AI-Powered Matching:** Utilizes Genkit to evaluate and score the similarity between different commutes for potential matching.

## 🛠️ Tech Stack

-   **Frontend:** [Next.js](https://nextjs.org/) (with App Router), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [ShadCN UI](https://ui.shadcn.com/)
-   **Backend:** [Firebase Cloud Functions](https://firebase.google.com/docs/functions) with Express.js
-   **Database:** [Firestore](https://firebase.google.com/docs/firestore) (NoSQL)
-   **Authentication:** [Firebase Authentication](https://firebase.google.com/docs/auth) with custom claims
-   **Email Verification:** Firebase Authentication built-in email verification
-   **GTFS Integration:** Auckland Transport API v2 with secure proxying and caching
-   **Real-time Data:** Firestore triggers and live updates
-   **Generative AI:** [Genkit](https://firebase.google.com/docs/genkit)
-   **Forms:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/) for validation
-   **Backend Validation:** [Joi](https://joi.dev/) for API request validation
-   **Analytics:** Comprehensive admin dashboard with real-time metrics
-   **Emergency System:** Real-time monitoring, audit trails, and safety team notifications

## 🏗️ Architecture

### Frontend (Next.js App)
- **Pages & Components:** React-based UI with TypeScript
- **State Management:** React Context for authentication and user state
- **Styling:** Tailwind CSS with ShadCN UI components
- **Forms:** React Hook Form with Zod validation

### Backend (Firebase Cloud Functions)
- **API Routes:** Express.js-based REST API with comprehensive admin endpoints
- **Authentication:** Firebase Auth token verification
- **Authorization:** Custom claims for admin access
- **Database Operations:** Firestore CRUD operations with real-time updates
- **GTFS Integration:** Secure Auckland Transport API proxying with caching
- **Admin Analytics:** Real-time statistics, user management, and transaction tracking
- **Emergency Management:** Real-time emergency monitoring, audit trails, and safety team notifications
- **Real-time Triggers:** Firestore triggers for automated workflows
- **Scheduled Functions:** Daily cleanup and weekly statistics
- **Callable Functions:** Secure client-server communication

## 🚀 Getting Started

Follow these steps to get the Qmuter application running locally.

### 1. Prerequisites

-   Node.js (v18 or later)
-   npm or yarn
-   Firebase CLI
-   A Firebase project with Firestore enabled

### 2. Installation

Clone the repository and install the dependencies.

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd functions
npm install
cd ..
```

### 3. Environment Variables

Create a `.env` file in the root of the project and add your Firebase project configuration. You can find these keys in your Firebase project settings.

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_MEASUREMENT_ID

# Genkit Configuration (if using Google AI)
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY

# Auckland Transport API Configuration
AT_API_KEY=YOUR_AT_API_KEY
BACKEND_URL=https://your-project.cloudfunctions.net
```

### 4. Firebase Authentication Setup

#### Enable Authentication Providers
In your Firebase Console, go to **Authentication** → **Sign-in method** and enable:
- ✅ **Email/Password** (required for email verification)
- ✅ **Google** (optional)
- ✅ **Apple** (optional)

#### Email Verification Configuration
1. Go to **Authentication** → **Templates**
2. Select **Email verification**
3. Customize the email template with your branding
4. Set the action URL to: `https://your-domain.com/dashboard`

### 5. Backend Setup

#### Build and Deploy Cloud Functions
```bash
# Navigate to functions directory
cd functions

# Build the TypeScript code
npm run build

# Deploy to Firebase
firebase deploy --only functions
```

#### Set Up Admin User (Required for Admin Dashboard)

To access the Admin Dashboard, you must assign a custom claim to your user account. This can be done using the Firebase Admin SDK in a secure backend environment (e.g., a Node.js script or a Cloud Function).

**Example Node.js script:**
```javascript
// Make sure to install firebase-admin: npm install firebase-admin
import admin from 'firebase-admin';

// Initialize the Admin SDK with your service account credentials
// admin.initializeApp({ ... });

const uid = 'YOUR_FIREBASE_UID'; // The UID of the user you want to make an admin

admin.auth().setCustomUserClaims(uid, { role: 'admin' })
  .then(() => {
    console.log(`Successfully set admin claim for user ${uid}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`Error setting custom claim: ${error}`);
    process.exit(1);
  });
```

### 6. Run the Development Server

You can now start the development server.

```bash
# Start frontend development server
npm run dev

# Start backend emulators (in another terminal)
firebase emulators:start
```

The application will be available at `http://localhost:9002`.

## 🔐 Authentication & User Flow

### Signup Process
1. **User Registration:** Users fill out the signup form with email, password, full name, phone number, and country
2. **Account Creation:** Firebase creates the user account and automatically sends a verification email
3. **Email Verification:** User receives a verification email with a secure link
4. **Verification Confirmation:** User clicks the link and returns to the app to confirm verification
5. **Onboarding:** User completes the 6-step onboarding process including display name selection
6. **Dashboard Access:** User gains full access to the application

### Authentication Features
- **Multi-Provider Support:** Email/Password, Google, and Apple sign-in
- **Email Verification:** Required for all email/password accounts
- **Verification Status Tracking:** Real-time verification status updates
- **Resend Functionality:** Users can resend verification emails
- **Dashboard Integration:** Verification banner for unverified users

### Onboarding Process
The onboarding consists of 6 steps:
1. **Welcome & Introduction**
2. **Role Selection** (Driver/Passenger)
3. **Location Setup**
4. **Preferences Configuration**
5. **Display Name Selection** - Users can choose or input their preferred display name
6. **Badge & Completion** - Welcome message with personalized display name

## 🛣️ Route Management System

### Route Creation & Approval
1. **Driver Proposes Route:** Drivers create route proposals with details like start/end points, schedule, and pricing
2. **Admin Review:** Admins review route proposals for community guidelines compliance
3. **Approval/Rejection:** Routes are approved or rejected with feedback
4. **Community Voting:** Users can upvote/downvote routes to help with community curation
5. **Active Routes:** Approved routes become available for booking

### Route Features
- **Flexible Scheduling:** Recurring or one-time routes
- **Multiple Pickup Points:** Drivers can set multiple pickup locations
- **Pricing Control:** Drivers set their own pricing per seat
- **Community Scoring:** Routes are ranked by community votes
- **Geolocation Support:** Find routes near your location

## 📂 Project Structure

```
/
├── src/                    # Frontend Next.js application
│   ├── ai/                # Genkit flows and AI logic
│   ├── app/               # Next.js App Router pages and layouts
│   ├── components/        # Reusable React components
│   │   ├── ui/           # ShadCN UI components
│   │   ├── AuthForm.tsx  # Authentication forms with email verification
│   │   ├── FirebaseEmailVerification.tsx # Email verification interface
│   │   ├── EmailVerificationBanner.tsx # Dashboard verification banner
│   │   └── NameSelectionStep.tsx # Display name selection component
│   ├── context/          # React Context providers (AuthContext with verification)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions, Firebase config
│   └── types/            # TypeScript type definitions
├── functions/            # Firebase Cloud Functions backend
│   ├── src/              # TypeScript source code
│   │   ├── config/       # Firebase configuration
│   │   ├── middleware/   # Express middleware (auth, validation)
│   │   ├── routes/       # API route definitions
│   │   ├── services/     # Business logic services
│   │   ├── types/        # TypeScript interfaces
│   │   ├── utils/        # Utility functions and helpers
│   │   └── index.ts      # Main entry point
│   ├── package.json      # Backend dependencies
│   ├── tsconfig.json     # TypeScript configuration
│   ├── firebase.json     # Firebase configuration
│   └── README.md         # Backend documentation
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore indexes
└── README.md             # This file
```

## 🔧 Key Components

### Frontend Components
- **`AuthForm.tsx`**: Handles signup/login with integrated email verification
- **`FirebaseEmailVerification.tsx`**: Email verification interface with resend functionality
- **`EmailVerificationBanner.tsx`**: Dashboard banner for unverified users
- **`AuthContext.tsx`**: Manages authentication state and email verification
- **`NameSelectionStep.tsx`**: Display name selection with suggestions
- **`onboarding/page.tsx`**: Multi-step onboarding flow

### Backend Services
- **`RouteService`**: Handles route CRUD operations and community features
- **`AdminService`**: Manages route approvals, user suspensions, and admin actions
- **`AuthMiddleware`**: Token verification and admin authorization
- **`ValidationUtils`**: Request validation using Joi schemas

### Backend Functions
- **HTTP Functions**: REST API endpoints for route management
- **Callable Functions**: Secure client-server communication
- **Firestore Triggers**: Automated workflows on data changes
- **Scheduled Functions**: Daily cleanup and weekly statistics

## 📡 API Endpoints

### Route Management
- `POST /api/v1/routes` - Create route proposal
- `GET /api/v1/routes` - Get routes with filters
- `PUT /api/v1/routes/:id` - Update route
- `DELETE /api/v1/routes/:id` - Delete route
- `POST /api/v1/routes/:id/vote` - Vote on route
- `GET /api/v1/routes/nearby` - Get nearby routes

### Admin Endpoints
- `GET /api/v1/admin/routes/pending` - Get pending routes
- `POST /api/v1/admin/routes/:id/approve` - Approve route
- `POST /api/v1/admin/routes/:id/reject` - Reject route
- `POST /api/v1/admin/users/:id/suspend` - Suspend user
- `GET /api/v1/admin/stats` - Get system statistics

### Callable Functions
- `getUserRoutes` - Get user's created routes
- `voteOnRoute` - Vote on a route
- `getNearbyRoutes` - Get routes near a location

## 📜 Available Scripts

### Frontend
-   `npm run dev`: Starts the Next.js development server.
-   `npm run build`: Builds the application for production.
-   `npm run start`: Starts the production server.
-   `npm run lint`: Lints the codebase.

### Backend
-   `cd functions && npm run build`: Builds the Cloud Functions.
-   `cd functions && npm run serve`: Starts the Firebase emulators.
-   `firebase deploy --only functions`: Deploys functions to production.
-   `firebase emulators:start`: Starts all Firebase emulators.

## 🚀 Recent Updates

### Comprehensive Admin Portal (Latest)
- ✅ **Advanced Analytics Dashboard** with 6 main tabs (Overview, Users, Routes, Transactions, Analytics, Alerts)
- ✅ **Real-time Statistics** including total users, rides, revenue, profit, and growth metrics
- ✅ **User Management** with detailed user profiles, suspension capabilities, and activity tracking
- ✅ **Route Analytics** with performance metrics, revenue tracking, and community feedback
- ✅ **Transaction History** with complete financial data, platform fees, and user tracking
- ✅ **System Alerts** with real-time notifications and admin action logging
- ✅ **Top Performers** analytics showing best drivers and passengers
- ✅ **30-Day Trends** with rides and revenue by day visualization
- ✅ **Popular Routes** tracking most used routes and their performance

### GTFS Integration & Zone-Based Pricing (Latest)
- ✅ **Auckland Transport API Integration** with secure v2 API proxying
- ✅ **Rate Limiting & Caching** to stay under AT API limits (35,000 calls/week)
- ✅ **Firestore Caching** with automatic expiry (24h for stops, 7d for routes, 30d for agencies)
- ✅ **Zone-Based Pricing** using GTFS stop clustering for dynamic fare calculation
- ✅ **Geographic Clustering** to create zones based on actual transport infrastructure
- ✅ **Secure API Proxying** with authentication headers never exposed to frontend
- ✅ **Fallback System** with mock data when API unavailable
- ✅ **Usage Monitoring** with Firestore logging for API call tracking

### Firebase Cloud Functions Backend
- ✅ **Complete backend system** with Express.js and TypeScript
- ✅ **Route management API** for creating, updating, and approving routes
- ✅ **Admin system** with route approval and user management
- ✅ **Authentication middleware** with Firebase Auth integration
- ✅ **Real-time triggers** for automated workflows
- ✅ **Scheduled functions** for maintenance tasks
- ✅ **Callable functions** for secure client communication
- ✅ **Comprehensive validation** using Joi schemas
- ✅ **Rate limiting** and security features
- ✅ **Firestore indexes** for optimal performance

### Email Verification System
- ✅ **Firebase-powered email verification** with automatic email sending
- ✅ **Verification status tracking** in real-time
- ✅ **Resend functionality** for verification emails
- ✅ **Dashboard integration** with verification banners
- ✅ **Professional email templates** customizable in Firebase Console
- ✅ **Secure token management** handled by Firebase

### Enhanced Onboarding
- ✅ **Display name selection** as a new onboarding step
- ✅ **Personalized experience** with user-chosen display names
- ✅ **Name suggestions** for easier selection
- ✅ **Validation** for display name format and length
- ✅ **Integration** with user profile and dashboard

### Authentication Improvements
- ✅ **Multi-step signup process** with email verification
- ✅ **Enhanced error handling** for authentication failures
- ✅ **Better user feedback** with toast notifications
- ✅ **Improved UX** with loading states and disabled states

## 🔒 Security Features

- **Firebase Authentication** with built-in security
- **Email verification** required for all accounts
- **Secure token management** by Firebase
- **Rate limiting** on API endpoints
- **Input validation** with Joi schemas
- **Admin authorization** with custom claims
- **User suspension** capabilities
- **Audit logging** for admin actions
- **GTFS API Security** with secure proxying and rate limiting
- **Data Protection** with Firestore security rules and encryption
- **Emergency Response System** with real-time monitoring and audit trails

## 📧 Email Verification Benefits

- **No custom email service** required - Firebase handles everything
- **Automatic email templates** - Professional-looking emails
- **Built-in security** - Firebase manages verification tokens
- **Automatic cleanup** - No need to manage verification codes
- **Reliable delivery** - Firebase's email infrastructure
- **Customizable templates** - Email content can be customized in Firebase Console

## 🛣️ Route Management Benefits

- **Community-driven** route approval system
- **Flexible scheduling** for recurring or one-time routes
- **Geolocation support** for finding nearby routes
- **Community voting** for route quality control
- **Admin oversight** for maintaining community standards
- **Automated workflows** for route lifecycle management
- **GTFS Integration** for real-time transport data
- **Zone-Based Pricing** for dynamic fare calculation

## 🚨 Emergency Response System

### Enterprise-Grade Safety Features

Qmuter includes a comprehensive emergency response system designed for user safety and platform accountability:

#### **Emergency Trigger & Data Capture**
- **One-tap emergency button** for riders and drivers
- **Real-time location tracking** with GPS coordinates
- **Complete ride context** including pickup/drop-off locations
- **User profile snapshot** at time of emergency
- **Immutable audit trail** for legal compliance

#### **Admin Emergency Center**
- **Real-time emergency monitoring** with live updates
- **Emergency details dashboard** with full ride context
- **Action logging system** for admin interventions
- **Contact user functionality** with audit trails
- **Emergency resolution workflow** with notes and timestamps

#### **Safety Team Notifications**
- **Automatic email alerts** to safety team (alerts@qmuter.nz)
- **Emergency data forwarding** with masked sensitive information
- **Escalation protocols** for critical situations
- **Resolution tracking** with admin action logs

#### **Legal & Compliance Features**
- **6-7 year data retention** for legal compliance
- **Masked sensitive data** in audit logs
- **Admin action logging** for accountability
- **Terms of Use integration** for legal protection
- **Law enforcement export** capabilities

#### **Technical Implementation**
- **Secure Firestore storage** with emergency collections
- **Real-time admin dashboard** with emergency tab
- **Audit log system** for all admin actions
- **Notification system** for safety team alerts
- **Data masking utilities** for privacy protection

## 🧪 Testing

### Frontend Testing
```bash
npm run test
```

### Backend Testing
```bash
cd functions
npm test
```

### Integration Testing
```bash
firebase emulators:start
npm run test:integration
```

## 📝 Environment Variables

### Frontend (.env)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

### Backend (functions/.env)
```env
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
FIREBASE_PROJECT_ID=your_project_id
NODE_ENV=development
```

## 🚀 Deployment

### Frontend Deployment
```bash
npm run build
# Deploy to your preferred hosting platform
```

### Backend Deployment
```bash
cd functions
npm run build
firebase deploy --only functions
```

### Complete Deployment
```bash
# Deploy everything
firebase deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (frontend and backend)
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
