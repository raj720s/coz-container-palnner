# Container Management System

A comprehensive container management system with session storage-based authentication and role-based access control (RBAC).

## Features

### 🔐 Authentication & Authorization
- **Session Storage-based Token Management**: Secure token storage using browser session storage
- **Role-Based Access Control (RBAC)**: Admin and User roles with different permissions
- **GCP SSO Integration Ready**: Prepared for Google Cloud Platform Single Sign-On
- **Automatic Role-based Redirection**: Users are redirected based on their role after login

### 📊 Admin Features
- **Master Data Management**:
  - Container Types (Add/Edit/Delete with status toggle)
  - Container Thresholds (Min/Max CBM configuration)
  - Container Priority Index (Drag-and-drop reordering)
  - Port & Customer Master (Bulk upload support)
- **Shipment Processing**:
  - File Upload with drag-and-drop (Excel/CSV support)
  - Validation Summary with error reporting
  - Container Planning with progress tracking
  - Assignment Results with export functionality

### 👤 User Features
- **Shipment Operations**:
  - Upload shipment data
  - View personal shipments
  - Check validation results
  - Monitor assignment status
- **Reports & Analytics**:
  - Shipment reports
  - Performance metrics
  - Data export functionality

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Framework**: Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Tables**: TanStack React Table
- **Authentication**: Custom session storage implementation
- **Notifications**: React Hot Toast
- **File Upload**: React Dropzone

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd app
```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Run the development server:
    ```bash
    npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication

### Test Credentials

**Admin User:**
- Email: `admin@company.com`
- Password: `admin123`

**Regular User:**
- Email: `user@company.com`
- Password: `user123`

### Login Flow
1. Navigate to `/signin`
2. Enter corporate credentials
3. System validates and assigns role
4. Automatic redirection based on role:
   - Admin → `/admin/dashboard`
   - User → `/user/dashboard`

## RBAC Implementation

### Admin Role (`admin`)
- Access to all master data management features
- Container type configuration
- Shipment upload and processing
- System administration
- Full CRUD operations

### User Role (`user`)
- Limited to personal shipment operations
- View-only access to most features
- Upload personal shipment data
- View assignment results

## File Structure

```
src/
├── app/
│   ├── (admin)/
│   │   ├── admin/
│   │   │   ├── dashboard/          # Admin dashboard
│   │   │   ├── container-types/    # Container management
│   │   │   ├── shipment-upload/    # File upload
│   │   │   ├── validation-summary/ # Validation results
│   │   │   └── container-planning/ # Planning process
│   │   └── user/
│   │       └── dashboard/          # User dashboard
│   └── (full-width-pages)/
│       └── (auth)/
│           └── signin/             # Login page
├── components/
│   ├── auth/
│   │   ├── SignInForm.tsx         # Login form
│   │   └── withAuth.tsx           # RBAC HOC
│   └── ...
├── context/
│   ├── AuthContext.tsx            # Authentication context
│   ├── SidebarContext.tsx         # Sidebar state
│   └── ThemeContext.tsx           # Theme management
└── layout/
    └── AppHeader.tsx              # Header with user info
```

## Key Components

### Authentication Context (`AuthContext.tsx`)
- Manages user authentication state
- Handles session storage for tokens
- Provides login/logout functionality
- Role-based access control

### RBAC HOC (`withAuth.tsx`)
- Higher Order Component for route protection
- Role-based access control
- Automatic redirection based on user role
- Loading states and error handling

### Container Types Management
- Full CRUD operations with react-table
- Form validation with react-hook-form
- Status toggle functionality
- Search and filtering capabilities

### Shipment Upload
- Drag-and-drop file upload
- Progress tracking
- File validation
- Template download functionality

## API Integration Ready

The system is designed to easily integrate with backend APIs:

### Authentication Endpoints
```typescript
// Replace mock authentication in AuthContext.tsx
const login = async (email: string, password: string) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  // Handle response and token storage
};
```

### Data Endpoints
```typescript
// Container types API
GET    /api/container-types
POST   /api/container-types
PUT    /api/container-types/:id
DELETE /api/container-types/:id

// Shipment upload API
POST   /api/shipments/upload
GET    /api/shipments/validation/:id
POST   /api/shipments/planning
```

## Security Features

- **Session Storage**: Tokens stored in browser session storage
- **Automatic Logout**: Session expires on browser close
- **Role-based Routes**: Protected routes based on user role
- **Form Validation**: Client-side validation with Zod schemas
- **CSRF Protection**: Ready for CSRF token implementation

## Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=your-api-url
NEXT_PUBLIC_APP_NAME=Container Management System
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.
