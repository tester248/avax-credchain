# HRIS Employee Verification System

A modern, professional HRIS (Human Resource Information System) application built with Next.js for employee background check verification. This system allows HR managers to efficiently lookup employees by ID and initiate comprehensive background checks.

## Features

- **Employee Lookup**: Search employees by ID with real-time feedback
- **Background Check Management**: Initiate and track comprehensive background checks
- **Real-time Status Updates**: Watch background checks progress in real-time
- **Modern UI**: Clean, professional interface with Tailwind CSS
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Background Check Categories**:
  - Identity Verification
  - Employment History
  - Education Verification
  - Criminal Background Check
  - Credit History Check

## Technology Stack

- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Build Tool**: Turbopack

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code quality

## Usage

1. **Employee Lookup**: Enter an employee ID (e.g., EMP001, EMP002, EMP003) in the search field
2. **View Details**: Review employee information once found
3. **Initiate Background Check**: Click the "Initiate Background Check" button
4. **Monitor Progress**: Watch as different verification categories complete in real-time
5. **Review Recent Checks**: View previously initiated background checks

## Sample Data

The application includes sample employee data for testing:
- EMP001: John Smith (Engineering)
- EMP002: Sarah Johnson (Marketing)  
- EMP003: Michael Brown (Finance)

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main employee verification page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
```

## Design Features

- **Modern Aesthetic**: Clean, minimalist design with professional color scheme
- **Intuitive Workflow**: Streamlined process from employee lookup to background check completion
- **Visual Feedback**: Clear status indicators and progress tracking
- **Accessibility**: WCAG compliant with proper contrast ratios and keyboard navigation
- **Performance**: Optimized with Next.js 15 and Turbopack for fast development and production builds

## Future Enhancements

- Integration with real background check APIs
- Advanced filtering and search capabilities
- Detailed reporting and analytics
- Role-based access control
- Email notifications for check completion
- Audit trail and compliance tracking

## License

This project is for demonstration purposes.
