# Qmuter Cloud Functions Backend

A comprehensive Firebase Cloud Functions backend for the Qmuter community route sharing platform. This backend provides route management, admin controls, user management, and automated workflows.

## 🏗️ Architecture

### Core Components

- **Route Management**: Create, update, delete, and approve route proposals
- **Comprehensive Admin System**: Advanced analytics dashboard, user management, route analytics, transaction tracking, and system alerts
- **GTFS Integration**: Auckland Transport API integration with secure proxying, caching, and rate limiting
- **Zone-Based Pricing**: Dynamic fare calculation based on GTFS stop locations
- **Authentication**: Firebase Auth integration with custom claims
- **Real-time Triggers**: Firestore triggers for automated workflows
- **Scheduled Functions**: Daily cleanup and weekly statistics
- **Callable Functions**: Secure client-server communication

### Technology Stack

- **Runtime**: Node.js 18
- **Framework**: Firebase Cloud Functions
- **Database**: Firestore with real-time updates
- **Authentication**: Firebase Auth with custom claims
- **GTFS Integration**: Auckland Transport API v2
- **Language**: TypeScript
- **Validation**: Joi
- **HTTP Framework**: Express.js
- **Caching**: Firestore-based caching with expiry
- **Rate Limiting**: Per-endpoint rate limiting

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Firebase CLI
- Firebase project with Firestore enabled

### Installation

1. **Install dependencies**:
   ```bash
   cd functions
   npm install
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Set up Firebase**:
   ```bash
   firebase login
   firebase use your-project-id
   ```

4. **Deploy functions**:
   ```bash
   firebase deploy --only functions
   ```

### Development

1. **Start emulators**:
   ```bash
   firebase emulators:start
   ```

2. **Watch for changes**:
   ```bash
   npm run build:watch
   ```

## 📡 API Endpoints

### Route Management

#### Create Route Proposal
```http
POST /api/v1/routes
Authorization: Bearer <token>
Content-Type: application/json

{
  "routeName": "Downtown Express",
  "description": "Daily commute to downtown",
  "startPoint": {
    "address": "123 Main St, City",
    "lat": 40.7128,
    "lng": -74.0060
  },
  "endPoint": {
    "address": "456 Business Ave, Downtown",
    "lat": 40.7589,
    "lng": -73.9851
  },
  "pickupPoints": [
    {
      "name": "Central Station",
      "address": "789 Central Ave",
      "lat": 40.7500,
      "lng": -73.9900
    }
  ],
  "schedule": {
    "type": "recurring",
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
    "time": "08:00",
    "timezone": "America/New_York"
  },
  "totalSeats": 4,
  "pricePerSeat": 5.00,
  "currency": "USD"
}
```

#### Get Routes
```http
GET /api/v1/routes?status=active&page=1&limit=10
```

#### Update Route
```http
PUT /api/v1/routes/{routeId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "routeName": "Updated Route Name",
  "pricePerSeat": 6.00
}
```

#### Delete Route
```http
DELETE /api/v1/routes/{routeId}
Authorization: Bearer <token>
```

#### Vote on Route
```http
POST /api/v1/routes/{routeId}/vote
Authorization: Bearer <token>
Content-Type: application/json

{
  "vote": "upvote"
}
```

#### Get Nearby Routes
```http
GET /api/v1/routes/nearby?lat=40.7128&lng=-74.0060&radius=10
```

### Admin Endpoints

#### Get Pending Routes
```http
GET /api/v1/admin/routes/pending?page=1&limit=10
Authorization: Bearer <admin-token>
```

#### Approve Route
```http
POST /api/v1/admin/routes/{routeId}/approve
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "notes": "Route approved after review"
}
```

#### Reject Route
```http
POST /api/v1/admin/routes/{routeId}/reject
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Route violates community guidelines",
  "notes": "Please review and resubmit"
}
```

#### Suspend User
```http
POST /api/v1/admin/users/{userId}/suspend
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Multiple violations reported",
  "notes": "Suspended for 30 days"
}
```

#### Get System Statistics
```http
GET /api/v1/admin/stats
Authorization: Bearer <admin-token>
```

### GTFS Integration

#### Get Stops
```http
GET /api/v1/gtfs/stops
Authorization: Bearer <token>
```

#### Get Routes
```http
GET /api/v1/gtfs/routes
Authorization: Bearer <token>
```

#### Search Stops
```http
GET /api/v1/gtfs/stops/search?query=station
Authorization: Bearer <token>
```

#### Get Nearby Stops
```http
GET /api/v1/gtfs/stops/nearby?lat=-36.8501&lng=174.7652&radius=5
Authorization: Bearer <token>
```

### Comprehensive Admin Analytics

#### Get Admin Statistics
```http
GET /api/v1/admin/stats
Authorization: Bearer <admin-token>
```

#### Get All Users
```http
GET /api/v1/admin/users
Authorization: Bearer <admin-token>
```

#### Get Route Analytics
```http
GET /api/v1/admin/routes
Authorization: Bearer <admin-token>
```

#### Get Transaction History
```http
GET /api/v1/admin/transactions
Authorization: Bearer <admin-token>
```

#### Get System Alerts
```http
GET /api/v1/admin/alerts
Authorization: Bearer <admin-token>
```

#### Get Analytics Data
```http
GET /api/v1/admin/analytics
Authorization: Bearer <admin-token>
```

## 🔥 Firestore Triggers

### Route Triggers

- **onRouteCreated**: Triggered when a new route is created
- **onRouteUpdated**: Triggered when a route is updated (includes approval notifications)

### User Triggers

- **onUserCreated**: Triggered when a new user is created
- **onUserUpdated**: Triggered when user data is updated (includes suspension handling)

## ⏰ Scheduled Functions

### Daily Cleanup
- **Function**: `cleanupExpiredRoutes`
- **Schedule**: Every 24 hours
- **Purpose**: Removes routes that haven't been updated in 30 days

### Weekly Statistics
- **Function**: `aggregateWeeklyStats`
- **Schedule**: Every Monday at 00:00
- **Purpose**: Aggregates weekly route statistics

## 📞 Callable Functions

### getUserRoutes
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const getUserRoutes = httpsCallable(functions, 'getUserRoutes');

const result = await getUserRoutes();
```

### voteOnRoute
```typescript
const voteOnRoute = httpsCallable(functions, 'voteOnRoute');

const result = await voteOnRoute({
  routeId: 'route-id',
  vote: 'upvote'
});
```

### getNearbyRoutes
```typescript
const getNearbyRoutes = httpsCallable(functions, 'getNearbyRoutes');

const result = await getNearbyRoutes({
  lat: 40.7128,
  lng: -74.0060,
  radius: 10
});
```

## 🔐 Authentication & Authorization

### User Authentication
- Uses Firebase Auth ID tokens
- Automatic token verification
- User suspension checking

### Admin Authorization
- Custom claims for admin access
- Admin-only endpoints protected
- Action logging for audit trails

### Rate Limiting
- 100 requests per 15 minutes per IP
- Configurable limits per endpoint
- GTFS API rate limiting (35,000 calls/week)
- Per-endpoint caching with expiry

## 📊 Data Models

### RouteProposal
```typescript
interface RouteProposal {
  id: string;
  driverId: string;
  driverInfo: {
    displayName: string | null;
    photoURL: string | null;
    rating: number;
  };
  routeName: string;
  description?: string;
  startPoint: Location;
  endPoint: Location;
  pickupPoints: PickupPoint[];
  schedule: {
    type: 'recurring' | 'one-time';
    days?: string[];
    time: string;
    timezone: string;
  };
  totalSeats: number;
  pricePerSeat: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  upvotes: number;
  downvotes: number;
  communityScore: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### QmuterUser
```typescript
interface QmuterUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'driver' | 'passenger';
  phoneNumber?: string;
  country?: string;
  totalRides: number;
  totalCO2Saved: number;
  totalMoneySaved: number;
  badgeTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Eco Hero';
  walletBalance: number;
  onboardingComplete: boolean;
  emailVerified?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 🛡️ Security Features

### Input Validation
- Joi schema validation for all inputs
- Type checking and sanitization
- Request size limits

### Error Handling
- Comprehensive error responses
- Proper HTTP status codes
- Error logging and monitoring

### Data Protection
- User data isolation
- Admin action logging
- Suspension handling

## 📈 Performance Optimizations

### Firestore Indexes
- Optimized queries for common patterns
- Composite indexes for filtering and sorting
- Efficient pagination support

### Caching
- Firestore client-side caching
- Optimized read patterns
- Batch operations for bulk updates

### Rate Limiting
- Per-IP rate limiting
- Configurable limits
- Graceful degradation

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Emulator Testing
```bash
firebase emulators:start --only functions
```

## 📝 Environment Variables

### Required
- `GOOGLE_APPLICATION_CREDENTIALS`: Service account key path
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `AT_API_KEY`: Auckland Transport API key

### Optional
- `NODE_ENV`: Environment (development/production)
- `FIREBASE_REGION`: Functions region (default: us-central1)
- `BACKEND_URL`: Backend URL for frontend proxying

## 🚀 Deployment

### Production Deployment
```bash
# Build and deploy
npm run build
firebase deploy --only functions

# Deploy specific functions
firebase deploy --only functions:api,functions:onRouteCreated
```

### Environment Setup
```bash
# Set environment variables
firebase functions:config:set app.environment="production"
firebase functions:config:set app.region="us-central1"
```

## 📚 API Documentation

### Response Format
All API responses follow this format:
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Pagination
Paginated responses include:
```typescript
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### Error Codes
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## 🔧 Configuration

### Firebase Configuration
```json
{
  "functions": {
    "source": ".",
    "runtime": "nodejs18",
    "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"]
  }
}
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2017",
    "strict": true,
    "outDir": "lib"
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 