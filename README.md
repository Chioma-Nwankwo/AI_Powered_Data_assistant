# AI Data Assistant

A modern, production-ready web application that enables students and professionals to upload data files and interact with them using natural language queries powered by AI.

## Features

### Core Functionality
- **File Upload**: Support for CSV and Excel files with drag-and-drop interface
- **AI Analysis**: Automatic data analysis and summary generation using OpenAI
- **Natural Language Queries**: Ask questions about your data in plain English
- **Visual Insights**: Automatic chart generation (bar, line, pie, area, scatter)
- **Suggested Questions**: AI-generated relevant questions about your dataset
- **Real-time Chat**: Interactive chat interface for data exploration

### Authentication
- **Email/Password Authentication**: Secure email validation and password requirements
- **Google Sign-In**: OAuth integration for quick authentication
- **Protected Routes**: Secure dashboard access
- **User Profiles**: Automatic profile creation and management

### Technical Features
- **Supabase Backend**: Database, authentication, and storage
- **Edge Functions**: Serverless API for OpenAI integration
- **Row Level Security**: Secure data access policies
- **Responsive Design**: Mobile-friendly interface
- **Smooth Animations**: Framer Motion for enhanced UX
- **Type Safety**: Full TypeScript implementation

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI**: OpenAI GPT-4o-mini
- **Data Parsing**: PapaParse

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ChatInterface.tsx
│   ├── ChartDisplay.tsx
│   ├── FileList.tsx
│   ├── FileUpload.tsx
│   ├── ProtectedRoute.tsx
│   └── Sidebar.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── lib/               # Utilities and configurations
│   ├── api.ts        # AI API functions
│   ├── database.types.ts
│   ├── fileUtils.ts  # File parsing utilities
│   └── supabase.ts   # Supabase client
├── pages/            # Page components
│   ├── Dashboard.tsx
│   ├── Landing.tsx
│   ├── Login.tsx
│   └── Signup.tsx
├── App.tsx           # Main app component with routing
├── main.tsx          # App entry point
└── index.css         # Global styles
```

## Database Schema

### Tables
- **profiles**: User profile information
- **uploaded_files**: Metadata for uploaded data files
- **conversations**: Chat sessions for each file
- **messages**: Individual messages in conversations

### Storage
- **data-files**: Bucket for storing uploaded CSV/Excel files

### Security
- Row Level Security (RLS) enabled on all tables
- User-specific access policies
- Secure file storage with folder-based permissions

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- A Supabase account and project
- An OpenAI API key

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The OpenAI API key needs to be configured in your Supabase project as a secret named `OPENAI_API_KEY`.

### Installation

1. Install dependencies:
```bash
npm install
```

2. The database migrations and edge functions are already deployed via Supabase.

3. (Optional) Enable Google OAuth in your Supabase project:
   - Go to Authentication > Providers in your Supabase dashboard
   - Enable Google provider
   - Add your Google OAuth credentials

### Running the Application

Development mode:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

Type checking:
```bash
npm run typecheck
```

## Key Features Explained

### File Upload & Processing
1. User uploads CSV or Excel file
2. File is parsed using PapaParse
3. File is stored in Supabase Storage
4. Metadata is saved to database
5. AI analyzes the data and generates a summary
6. Suggested questions are automatically generated

### Chat Interface
1. User asks a question in natural language
2. Question is sent to the Edge Function with file context
3. OpenAI processes the query and generates an answer
4. If applicable, chart data is also generated
5. Response is displayed with optional visualization
6. Conversation history is persisted in the database

### Authentication Flow
1. User signs up with email/password or Google
2. Email validation ensures valid email format
3. Password must be at least 6 characters
4. Profile is automatically created
5. User is redirected to dashboard
6. Protected routes ensure secure access

## API Integration

### Edge Function: ai-data-assistant

The application uses a single Edge Function deployed on Supabase that handles three actions:

1. **analyze-data**: Analyzes uploaded data and generates a summary
2. **generate-questions**: Creates suggested questions about the dataset
3. **query-data**: Answers natural language questions about the data

All API calls are authenticated using Supabase JWT tokens.

## Security Features

- Email validation with regex pattern matching
- Password strength requirements (minimum 6 characters)
- Row Level Security (RLS) on all database tables
- Secure file storage with user-specific access
- JWT-based authentication for API calls
- Protected routes on the frontend
- HTTPS-only connections

## Charts & Visualizations

The application automatically generates appropriate visualizations:

- **Bar Charts**: For categorical comparisons
- **Line Charts**: For trends over time
- **Pie Charts**: For percentage distributions
- **Area Charts**: For cumulative data
- **Scatter Plots**: For correlation analysis

Charts are generated based on the AI's analysis of the question and data structure.

## Design Philosophy

- Clean, modern interface with subtle animations
- Blue color scheme for professional appearance
- Responsive design for all screen sizes
- Clear visual hierarchy and typography
- Accessible and user-friendly
- Production-ready code quality

## Future Enhancements

Potential features for future development:
- Multi-file analysis and comparison
- Advanced filtering and data manipulation
- Export results and visualizations
- Collaborative features
- Custom chart configurations
- More data formats (JSON, XML, SQL)
- Data transformation capabilities
- Advanced statistical analysis

## License

This project is built for educational and professional use.

## Support

For questions or issues, please reach out to chioman059@gmail.com.
