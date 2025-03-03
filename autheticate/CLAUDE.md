# CLAUDE.md - Coding Assistant Reference

## Commands
- **Frontend**
  - Start: `cd frontend && npm run start`
  - Build: `cd frontend && npm run build`
  - Test: `cd frontend && npm run test`
  - Single test: `cd frontend && npm test -- -t "test name"`
  
- **Backend**
  - Run server: `cd backend && uvicorn main:app --reload`
  - Run tests: `cd backend && pytest`
  - Single test: `cd backend && pytest path/to/test.py::test_function`

## Code Style Guidelines
- **Frontend**: 
  - React functional components, hooks
  - Import order: React > libraries > components > utils > CSS
  - 2-space indentation, semicolons
  - PascalCase components, camelCase functions/variables
  - Use try/catch for error handling

- **Backend**:
  - 4-space indentation, snake_case
  - Type hints and Pydantic models
  - Imports: stdlib > third-party > app modules
  - FastAPI patterns with specific HTTP exceptions
  - Docstrings for route handlers

## Design System
- Dark themed UI with CSS variables in `frontend/src/styles/global.css`
- Main pages:
  - Home: 30/70 split with video background (Welcome.mp4)
  - Auth pages: Form on left, illustration/video on right
  - Dashboard: Dark sidebar with main content area
- Assets located in `frontend/public/assets/`
- Responsive breakpoints at 768px (mobile view)
- MUI components for UI elements with custom styling

## Project Architecture
- Authentication system using Supabase
- Dashboard analytics with Recharts
- Modular component structure
- Context API for state management
- Lazy-loaded routes for performance

## Dashboard Features
- Main dashboard with KPI cards
- Sales rep analytics
- Call tracking and management
- Customer relationship views
- Interactive data visualization
- Notification system
- User profile management
- Settings and configuration

This codebase uses Supabase for authentication and data storage.