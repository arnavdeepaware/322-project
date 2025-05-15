# EditFlow  
### City College of New York  
### CSc 322 Spring 2025 Project
**Group - X**

---

## Introduction

This report outlines the development and implementation of a web-based text editing and correction system. The system is designed to provide real-time grammar correction, text transformation, and collaborative document management functionalities. The project consists of both frontend and backend components, leveraging modern web frameworks and cloud-based services for scalability and efficiency.

The **frontend** is implemented using React, with additional integrations including Supabase for authentication and database management, and Monaco Editor for advanced text editing.

The **backend** is built using Flask, with integration of the OpenAI API for advanced language processing. Supabase is utilized for secure authentication and data storage.

**Key Features** include real-time text correction, collaborative editing, document management, and user statistics tracking.

---

### Installation & Setup Requirements

#### Frontend Dependencies

- React v19
- Supabase Client
- Monaco Editor
- React Router
- Axios

Install with:
```bash
npm install
```

#### Backend Dependencies

- Flask 3.1.1
- OpenAI API
- Python-dotenv
- Flask-CORS

Install with:
```bash
pip install -r requirements.txt
```

#### Environment Setup

1. Clone the project repository.
2. Set up `.env` files in both the frontend and backend directories.
3. Configure Supabase credentials and the OpenAI API key.
4. Start the backend server:
    ```bash
    python main.py
    ```
5. Launch the frontend development server:
    ```bash
    npm run dev
    ```

---

## System Features and Implementation Status

**Completed Features:**
- User authentication (Google OAuth and Guest Access)
- Real-time text correction utilizing the OpenAI API
- Document management system with collaborative capabilities
- Token-based economy and user statistics tracking
- Shakespearean-style text transformation
- Grammar correction suggestions
- Blacklist Words
- Correction Highlights

**Partially Completed Features:**
- Advanced error rejection mechanisms
- Real-time collaborative editing enhancements
- Self-Correction Mode (missing accept/reject feature)

**Incomplete Features:**
- Admin Control over paid user applications
- All correct text, leads to increase in tokens

---

