# AI-Assisted Smart Attendance & Performance Tracker

A comprehensive college management system designed for academic evaluation, featuring Role-Based Access Control (RBAC), AI-driven insights, and multi-language support.

## 🚀 Features

### User Roles
1. **Admin**: Full access. Can manage students, teachers, and view all data.
2. **Teacher**: Can manage attendance and marks. Can filter students by Course/Semester.
3. **Student**: Read-only access to own data and AI insights.

### Core Modules
- **Student Management**: CRUD operations for students (Admin).
- **Attendance**: Track lectures attended vs total. Auto-calculation of %.
- **Performance**: Record marks.
- **AI Integration**: 
  - **Auto-generated Remarks**: Uses Google Gemini AI to analyze marks and provide personalized feedback.
  - **Risk Analysis**: Heuristic AI to flag students with attendance < 75%.

### UI/UX
- **Responsive Design**: Works on Mobile, Tablet, Desktop.
- **Theme**: Light & Dark mode support.
- **Language**: Supports English + 11 Indian Languages (Hindi, Gujarati, Tamil, etc.).

## 🛠 Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **AI**: Google Gemini API (`@google/genai`)
- **Data Persistence**: LocalStorage (Simulated Backend for portability)

## 📦 How to Run

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create a `.env` file in the root directory and add your Gemini API Key:
   ```env
   API_KEY=your_google_gemini_api_key
   ```
   *Note: If no API Key is provided, the system will fallback to rule-based logic automatically.*

3. **Start the App**:
   ```bash
   npm start
   ```

## 🧪 Sample Data & Usage
The system auto-seeds with mock data on first load.

- **Login**: Click "Admin Access", "Teacher Access", or "Student Access" on the login screen. No password required for demo.
- **Filtering**: Go to Attendance or Performance pages and use the dropdowns to filter by "BCA" / "Sem 1".
- **AI Demo**:
  1. Login as Teacher.
  2. Go to Performance.
  3. Edit a student's marks.
  4. Click "Save & Analyze". The system will call the AI to generate a remark based on the score.

## 🌐 Language Switching
Click the language code (e.g., "EN") in the bottom-left of the sidebar to switch languages instantly.

## 🌓 Dark Mode
Click the Sun/Moon icon in the sidebar to toggle themes.
