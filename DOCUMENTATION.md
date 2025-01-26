# Echelon - Social Dogecoin Platform

## Overview
Echelon is a social platform built around the Dogecoin cryptocurrency community. It allows users to track their Dogecoin holdings, compete on a leaderboard, and interact with other Dogecoin enthusiasts.

## Core Features

### 1. User Authentication
- Email-based registration and login system
- JWT token-based authentication
- Secure password handling with bcrypt
- Remember me functionality

### 2. Profile Management
- Personal profile page with editable information
- Custom avatar upload with image processing
- Country selection with flag display (flags shown only next to username, simplified dropdown)
- Bio and personal link fields
- Real-time DOGE amount and USD value display
- Secure wallet address storage and display

### 3. Leaderboard System
- Real-time ranking based on DOGE holdings
- Dynamic updates using WebSocket
- Filtering and sorting capabilities
- Visual indicators for rank changes

### 4. Chat System
- Real-time chat functionality using Socket.IO
- Message history with timestamps
- User presence indicators
- Emoji support
- Clickable usernames linking to user profiles
- Optimized timestamp formatting in main.js:
  - "just now" for < 1 minute
  - "Xm ago" for minutes
  - "Xh ago" for hours
  - "Xd ago" for days
  - "Xw ago" for weeks
  - "Xmo ago" for months
  - "Xy ago" for years
- Improved code organization with timestamp logic centralized in main.js

## Technical Architecture

### Frontend
- Pure JavaScript (No framework)
- CSS with custom properties for consistent styling
- Responsive design with mobile-first approach
- WebSocket integration for real-time updates

### Backend
- Node.js with Express
- MongoDB Atlas database (.env file set)
- Socket.IO for real-time communication
- JWT for authentication
- Multer for file uploads

### File Structure
```
personal-website/
├── css/
│   ├── components.css    # Reusable component styles
│   ├── index.css        # Global styles and CSS variables
│   ├── navigation.css   # Navigation styles
│   ├── pages.css       # Page-specific styles
│   └── profile.css     # Profile page styles
├── js/
│   ├── auth.js         # Authentication logic
│   ├── chat.js         # Chat functionality
│   ├── my_profile.js   # Personal profile page logic
│   ├── nav.js          # Navigation functionality
│   └── profile.js      # Public profile page logic
├── server/
│   ├── routes/         # API routes
│   ├── models/         # Database models
│   └── app.js          # Main server file
└── *.html              # HTML pages
```

## Key Components

### Profile System
- **My Profile Page**: Personal dashboard showing DOGE holdings, profile info, and account settings
- **Public Profile Page**: Public view of user profiles with DOGE amount and basic info
- **Avatar System**: Supports image upload with automatic resizing and optimization

### Navigation
- Responsive navigation bar with mobile menu
- Dynamic content based on authentication state

### Real-time Updates
- WebSocket connections for live data
- Automatic DOGE/USD price updates
- Live leaderboard position changes
- Real-time chat messages

## Styling Guidelines

### Responsive Design
- Mobile-first approach
- Breakpoints:
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px

### Color Scheme
```css
:root {
  --primary-color: #1a1b26;
  --accent-color: #7aa2f7;
  --text-primary: #ffffff;
  --text-secondary: #9699a3;
  --border-color: #2f3133;
}
```

## Security Features
1. JWT-based authentication
2. Password hashing with bcrypt
3. CORS protection
4. File upload restrictions and validation
5. XSS protection
6. Rate limiting on API endpoints

## Future Enhancements
1. Two-factor authentication
2. Social media integration
3. Transaction history
4. Achievement system
5. Direct messaging between users
6. Advanced analytics dashboard

## API Documentation

### Authentication Endpoints
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout
- GET `/api/auth/verify` - Token verification

### User Endpoints
- GET `/api/users/profile` - Get user profile
- PUT `/api/users/profile` - Update user profile
- POST `/api/users/avatar` - Upload avatar
- GET `/api/users/:id` - Get public profile

### Leaderboard Endpoints
- GET `/api/leaderboard` - Get leaderboard data
- GET `/api/leaderboard/rank` - Get user rank

### Chat Endpoints
- GET `/api/chat/history` - Get chat history
- WebSocket events for real-time messaging


## Recent Updates

### January 8, 2025
1. **Chat System Improvements**
   - Moved timestamp formatting logic to main.js for better code organization
   - Removed redundant timestamp code from chat.js
   - Enhanced timestamp display with relative time formatting

2. **Profile UI Enhancements**
   - Simplified country selection dropdown by removing flags for better compatibility
   - Standardized form input styling across the application
   - Fixed padding and alignment issues in country select dropdown

3. **Code Optimization**
   - Centralized common functions in main.js for better maintainability
   - Improved code organization with proper function exports
   - Updated CSS to follow consistent styling patterns

### January 9, 2025

### 1. Join Page Enhancements
- Fixed login state persistence issues
- Improved wallet selection UI with custom dropdown
- Added error handling for wallet selection
- Removed button hover animations for consistent UI
- Standardized button text sizes across the platform
- Adjusted spacing in pool and price chart sections

### 2. CSS Organization
- Moved pool section styles from components.css to layout.css
- Added proper left padding to left column for better spacing
- Reduced duplication in CSS files
- Improved code organization and maintainability

### 3. Upcoming Wallet Integration Plan
The following features need to be implemented for secure wallet integration:

#### Transaction Handling
- Add recipient DOGE wallet address for contributions
- Implement proper wallet connection for MetaMask, Phantom, and Binance Wallet
- Add transaction verification system
- Create balance update logic

#### Required Backend Endpoints
1. Transaction Status Check
   ```
   GET /api/transaction/{txHash}
   Response: { confirmed: boolean }
   ```

2. Balance Update
   ```
   POST /api/users/balance
   Body: {
     amount: number,
     txHash: string,
     walletAddress: string
   }
   ```

#### Security Considerations
- Transaction verification system
- Store and verify transaction hashes
- Amount validation
- Recipient address verification
- Secure wallet connection handling

#### Database Updates Needed
- Transaction history table
- Wallet address storage
- Balance tracking system

### January 21, 2025

#### 1. Newsletter System Implementation
- Added complete newsletter subscription system with MongoDB integration
- Implemented robust error handling on both client and server sides
- Added real-time form validation with immediate user feedback
- Enhanced API route organization for better maintainability

##### Newsletter Features
- Client-side email validation with regex
- Real-time validation feedback as user types
- Proper content type negotiation (application/json)
- Comprehensive error handling for various scenarios:
  - Invalid email format
  - Already subscribed email
  - Network errors
  - Server errors
- Success/error message display with visual indicators
- MongoDB storage with timestamp and active status

##### API Endpoints
- POST `/api/v1/newsletter/subscribe` - Subscribe to newsletter
  - Request: `{ "email": "user@example.com" }`
  - Success Response: `{ "message": "Successfully subscribed", "email": "user@example.com" }`
  - Error Responses:
    - 400: Invalid email format
    - 409: Email already subscribed
    - 500: Server error

##### Technical Improvements
- Separated API and web app routing for better organization
- Added detailed request logging for debugging
- Implemented proper JSON response handling
- Added MongoDB schema validation for email format
- Enhanced form state management during submission

#### 2. API Route Organization
- Restructured API routes under `/api/v1` namespace
- Improved error handling with specific error messages
- Added proper content type checking and validation
- Enhanced logging for better debugging
- Implemented proper 404 handling for API routes

#### 3. Server-side Improvements
- Added better error handling middleware
- Improved static file serving
- Enhanced request logging
- Added proper content type negotiation
- Implemented proper route organization

## Next Steps
1. Implement wallet integration system
2. Create backend endpoints for transaction handling
3. Add transaction verification logic
4. Set up secure balance updating system
5. Add transaction history display
6. Implement error handling and user feedback

## Development Setup
1. Install Node.js and MongoDB
2. Clone the repository
3. Install dependencies: `npm install`
4. Set up environment variables
5. Start the server: `npm start`
6. Access the site at `http://localhost:5000`

## Environment Variables
```
PORT=5000
MONGODB_URI=mongodb+srv://[username]:[password]@[cluster].mongodb.net/[database]
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:3000
```

## Maintenance
- Regular database backups
- Log rotation
- Performance monitoring
- Security updates
- User feedback collection

## Support
For technical support or feature requests, please create an issue in the repository or contact the development team.
