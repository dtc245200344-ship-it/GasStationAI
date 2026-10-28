# AI-Integrated Gas Station Management System

This project is a comprehensive Gas Station Management System with AI integration for generating intelligent shift reports and detecting anomalies. It is built to satisfy the requirements of the final project assessment.

## Architecture

- **Backend**: Python FastAPI with SQLAlchemy (SQLite).
- **Frontend**: React (Vite) with Tailwind CSS for a premium UI.
- **AI Integration**: Google Gemini 1.5 Pro.

## Project Structure

- `/backend`: Contains the FastAPI application, database models, CRUD operations, and AI service.
- `/frontend`: Contains the React application with Vite, Tailwind CSS, and React Router.

## Getting Started

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows
   .\venv\Scripts\activate
   # On Mac/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install fastapi "uvicorn[standard]" sqlalchemy passlib[bcrypt] python-jose[cryptography] python-multipart pydantic-settings pytest google-generativeai python-dotenv
   ```
4. Configure the AI API Key:
   Open `backend/.env` and insert your actual Google Gemini API Key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```
5. Run the backend server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will be available at `http://127.0.0.1:8000`. You can view the API documentation at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

## Features Implemented against Rubrics

- **Database**: ERD fully mapped to SQLAlchemy models (`models.py`) with primary/foreign keys and relationships. SQLite is used for easy local deployment without requiring complex setup.
- **CRUD & Business Logic**: Implemented in `crud.py` and `main.py` for Tanks, Shifts, Sales, and Imports. Includes business logic constraints (e.g., cannot sell more than what's in the tank).
- **Authentication**: JWT token-based auth scaffolded. Role-based access control (RBAC) implemented in endpoints to restrict actions (e.g., only managers/accountants can generate reports).
- **AI Integration**: The `ai_service.py` is fully integrated with Gemini 1.5 Pro. It takes shift context directly from the system's database and outputs structured JSON (Summary, Inventory Analysis, Abnormalities).
- **Frontend UI**: Built with React and Tailwind CSS. The interface is clean, consistent, and provides a sidebar for easy navigation. (Routing scaffolded in `App.jsx`).

## Testing the AI Feature

1. Start a shift.
2. Record sales and/or imports for that shift.
3. End the shift.
4. Call the `POST /shifts/{shift_id}/ai-report` endpoint. The AI will analyze the difference between the starting tank volume, ending tank volume, imports, and total sales recorded to spot any missing fuel or anomalies.
