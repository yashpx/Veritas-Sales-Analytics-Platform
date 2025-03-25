# Veritas Authentication Technical Report

## 1. System Architecture

### 1.1 Backend Architecture
- **Framework**: FastAPI (Python) - provides a high-performance RESTful API with type hints and validation
- **Authentication**: Dual authentication system
  - Supabase Auth: JWT-based authentication for regular users
  - Custom JWT implementation: For sales representatives with bcrypt password hashing
- **Database**: Supabase (PostgreSQL) with defined schema for users, calls, and analytics data
- **API Structure**: Modular design with separate routes for authentication, user management, and data access

### 1.2 Frontend Architecture
- **Framework**: React with function components and hooks
- **Routing**: React Router with protected routes using a custom `PrivateRoute` component
- **State Management**: React Context API for authentication state
- **UI Components**: Material UI with custom styling and responsive design
- **Data Fetching**: Custom API clients for different data domains (dashboard, sales rep, insights)

### 1.3 Authentication System
- Dual authentication pathways:
  - **Regular users**: Supabase authentication with email/password
  - **Sales reps**: Custom JWT authentication with server-side token generation
- Role-based access control: Manager vs. Sales Rep roles
- Persistent sessions via localStorage and Supabase session management
- Token refresh and validation mechanisms

## 2. Key Features & Technical Implementation

### 2.1 Authentication & Authorization
- **Implementation**: Uses Supabase Auth for regular users and custom JWT for sales reps
- **Token Handling**: JWT tokens with expiration and validation
- **Password Security**: bcrypt for password hashing and verification
- **Role-Based Routing**: Different dashboards and access based on user roles
- **Protected Routes**: React Router with custom authentication guards

### 2.2 Dashboard Analytics
- **Data Source**: Supabase queries with parallel request optimization via Promise.all
- **Visualization**: Recharts library for interactive charts
- **Real-time Updates**: Dynamic data fetching based on timeframe selection
- **KPI Tracking**: Custom calculations for performance metrics
- **Optimization**: Batch queries with Promise.all for performance

### 2.3 Call Management & Transcription
- **Audio Handling**:
  - Client-side audio file processing
  - Multi-location storage for redundancy (localStorage, Supabase)
  - Audio playback with synchronized transcript highlighting
- **Transcription Pipeline**:
  - Utilizes Groq API's LLaMA 3.3 70B model for transcription
  - Speaker diarization using advanced LLM capabilities
  - Transcript cleaning and formatting with sentence-level segmentation
- **Interactive Transcript**:
  - Color-coded speaker identification
  - Time-synced highlighting of current segment during playback
  - Click-to-navigate functionality

### 2.4 Call Insights & Analysis
- **AI Analysis Pipeline**:
  - Sentiment analysis of customer conversations
  - Key topic extraction from call content
  - Strengths and areas of improvement identification
  - Call outcome classification (Closed, In-progress, Failed)
- **Data Visualization**:
  - Rating percentages with circular progress indicators
  - Topic classification with colored chips
  - Sentiment distribution pie charts
- **Data Persistence**:
  - Multi-layer caching strategy (localStorage + database)
  - Fallback mechanisms for offline/error scenarios

### 2.5 Sales Representative Management
- **User Management**:
  - CRUD operations for sales rep accounts
  - Performance tracking and KPI monitoring
  - Profile management with edit capabilities
- **Dashboard Customization**:
  - Role-specific dashboards for managers vs. sales reps
  - Timeframe selection (weekly vs. monthly views)
  - Performance comparison metrics
- **Data Relationships**:
  - Many-to-many relationships between sales reps and customers
  - Call logs linked to sales reps and customers
  - Sales data tracking with product information

### 2.6 DialPad Implementation
- **Functionality**:
  - Interactive dialing interface
  - Contact management and search
  - Call logging with duration tracking
  - Call outcome recording
- **Integration Points**:
  - Supabase for contact data storage
  - Call history synchronization with main database
  - User profile connection for caller identification
- **Technical Approach**:
  - Simulated call API for demonstration purposes
  - Real-time call status updates
  - Background call logging with error recovery

## 3. Database Schema & Relationships

### 3.1 Core Tables
- **user_auth**: Authentication data for all users
- **user_profiles**: Extended user information and preferences
- **sales_reps**: Sales representative specific information
- **customers**: Customer data and contact information
- **call_logs**: Call recording metadata and outcomes
- **sales_data**: Sales transaction records
- **sales_kpi**: Performance targets and metrics

### 3.2 Key Relationships
- One-to-many: User to Calls
- Many-to-many: Sales reps to Customers
- One-to-many: Sales rep to Sales
- One-to-one: User to Sales rep (for sales rep users)

## 4. API Integration Points

### 4.1 External Services
- **Supabase**: Authentication, database, and storage
- **Groq API**: LLM-based transcription and analysis
  - Uses LLaMA 3.3 70B model for advanced NLP tasks
  - Whisper API integration for audio transcription

### 4.2 Internal API Structure
- **/api/auth**: Authentication endpoints
  - Regular user management
  - Sales rep authentication
- **/api/call-insights**: Call analysis pipeline
- **/api/call**: Call management endpoints

## 5. Security Implementation

### 5.1 Authentication Security
- **JWT**: Secure token generation with proper expiration
- **Password Hashing**: bcrypt with proper salt generation
- **Role Validation**: Server-side verification for all protected routes

### 5.2 Data Protection
- **Input Validation**: Using Pydantic models for type checking
- **CORS Protection**: Configured with specific allowed origins
- **Error Handling**: Consistent HTTP exception management

## 6. Frontend Implementation

### 6.1 Component Architecture
- **Layout Components**: DashboardLayout, AuthLayout
- **Auth Components**: PrivateRoute, Login/Register forms
- **Feature Components**: Call transcription, dial pad, analytics
- **UI Components**: Custom buttons, cards, inputs with consistent styling

### 6.2 State Management
- **Authentication Context**: Global auth state for user information
- **Local State**: Component-specific state for UI interactions
- **Persistent Storage**: localStorage for offline capability

### 6.3 Styling Approach
- **CSS Modules**: Scoped styling with component-specific CSS
- **Theme Variables**: Global CSS variables for design consistency
- **Responsive Design**: Mobile-friendly layouts with breakpoints

## 7. Performance Optimizations

### 7.1 Frontend Optimizations
- **Code Splitting**: React.lazy for route-based code splitting
- **Data Fetching**: Parallel requests with Promise.all
- **Caching Strategy**: localStorage for frequently accessed data
- **Conditional Rendering**: Efficient component rendering based on state

### 7.2 Backend Optimizations
- **Async I/O**: Utilizing FastAPI's async capabilities
- **Database Queries**: Optimized queries with proper indexing
- **Response Caching**: Strategic caching of expensive operations

## 8. Error Handling & Resilience

### 8.1 Frontend Error Handling
- **API Error Handling**: Consistent error catching and display
- **Fallback UI**: Loading states and error messages
- **Offline Capability**: localStorage fallback for key operations

### 8.2 Backend Error Handling
- **HTTP Exceptions**: Proper status codes and error messages
- **Database Error Handling**: Transaction management and rollbacks
- **API Service Errors**: Graceful degradation for external service failures

## 9. Testing & Quality Assurance

### 9.1 Frontend Testing
- Jest test framework configured
- Component testing capabilities

### 9.2 Backend Testing
- Pytest configuration for Python tests
- FastAPI test client for endpoint testing

## 10. Deployment & Environment Management

### 10.1 Environment Configuration
- Environment variable management for API keys and endpoints
- Development vs production configuration

### 10.2 Build & Deployment
- NPM scripts for frontend build and deployment
- Python dependency management with requirements.txt