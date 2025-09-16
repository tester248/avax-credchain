# HRIS Module

A Next.js-based Human Resource Information System (HRIS) application that integrates with the CredChain verification system for employee background checks and credential verification.

## Overview

The HRIS module provides a professional interface for HR managers to:

- Look up employees by ID
- Initiate blockchain-based background checks
- Track verification progress in real-time
- Manage employee credential verification workflows
- Interface with the CredChain API for secure verification

## Features

### Employee Management
- Employee lookup by ID with real-time feedback
- Employee profile display with comprehensive information
- Department and role-based organization

### Background Check Integration
- Initiate comprehensive background checks via CredChain
- Real-time status tracking and progress monitoring
- Multiple verification categories:
  - Identity Verification
  - Employment History
  - Education Verification
  - Criminal Background Check
  - Credit History Check

### Modern Interface
- Clean, professional UI built with Tailwind CSS
- Responsive design for desktop and mobile
- Accessibility compliant with WCAG standards
- Intuitive workflow from lookup to verification completion

## Technology Stack

- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Build Tool**: Turbopack

## Installation

Install dependencies from the hris directory:

```bash
cd hris
npm install
```

## Configuration

The HRIS system integrates with the CredChain API. Ensure the module3-api service is running:

```bash
# In module3-api directory
npm run dev
```

## Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run code quality checks

## Usage Workflow

1. **Employee Lookup**
   - Enter employee ID in the search field
   - System validates and retrieves employee information
   - Employee details are displayed with verification options

2. **Initiate Background Check**
   - Click "Initiate Background Check" button
   - System creates verification request via CredChain API
   - Background check categories are processed sequentially

3. **Monitor Progress**
   - Real-time updates show verification progress
   - Each category displays completion status
   - Final verification results are displayed

4. **Review History**
   - View previously initiated background checks
   - Track verification status across multiple employees
   - Access historical verification data

## Sample Data

The application includes test employee data:

- **EMP001**: John Smith (Engineering Department)
- **EMP002**: Sarah Johnson (Marketing Department)
- **EMP003**: Michael Brown (Finance Department)

## API Integration

The HRIS module integrates with the CredChain API endpoints:

- `POST /api/hr/verification/request` - Initiate employee verification
- `GET /api/hr/verification/:ticketId` - Check verification status
- `POST /api/hr/verification/complete/:ticketId` - Complete verification

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main employee verification interface
│   ├── layout.tsx        # Application layout and global configuration
│   └── globals.css       # Global styles and Tailwind CSS imports
├── components/           # Reusable UI components (if added)
└── types/               # TypeScript type definitions (if added)
```

## Security Considerations

- No sensitive employee data is stored locally
- All verification requests are authenticated via API
- Employee PII is handled according to privacy regulations
- Secure communication with blockchain infrastructure

## Development Features

- Hot reloading with Turbopack for fast development
- TypeScript for type safety and developer experience
- ESLint configuration for code quality
- Tailwind CSS for rapid UI development

## Production Deployment

For production deployment:

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run start
   ```

3. Configure environment variables for API endpoints
4. Set up proper authentication and authorization
5. Implement proper logging and monitoring

## Future Enhancements

- Advanced employee search and filtering
- Detailed reporting and analytics dashboard
- Role-based access control for different HR functions
- Email notifications for verification completion
- Audit trail and compliance tracking
- Integration with external HRIS systems
- Batch verification processing

## Troubleshooting

**Application Won't Start**:
- Verify Node.js version (18+ required)
- Check that all dependencies are installed
- Ensure port 3000 is available

**API Integration Issues**:
- Verify module3-api service is running
- Check API endpoint configuration
- Validate network connectivity

**UI/UX Issues**:
- Clear browser cache and reload
- Check console for JavaScript errors
- Verify Tailwind CSS is loading properly
