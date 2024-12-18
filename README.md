# Secure File Share

A secure file-sharing web application with end-to-end encryption, multi-factor authentication, and role-based access control.

## Features

- User Authentication with Multi-Factor Authentication (MFA)
- Role-Based Access Control (RBAC)
- End-to-End File Encryption
- Secure File Sharing with Time-Limited Links
- File Upload/Download with Client-Side Encryption
- Admin Dashboard for User Management

## Tech Stack

### Frontend
- React
- Redux for state management
- Web Crypto API for client-side encryption
- Material-UI for components

### Backend
- Django
- Django REST Framework
- SQLite Database
- JWT Authentication
- AES-256 Encryption

## Prerequisites

- Docker
- Docker Compose
- Git

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd secure-file-share
```

2. Start the application using Docker Compose:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Interface: http://localhost:8000/admin

## Security Features

- End-to-end encryption using AES-256
- Multi-factor authentication using TOTP
- JWT-based authentication with secure session management
- Role-based access control
- Input validation and sanitization
- HTTPS/TLS encryption in transit
- Secure password hashing using bcrypt
- File encryption at rest
- Time-limited sharing links

## Development

### Frontend Development
```bash
cd frontend
npm install
npm start
```

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Project Structure

```
secure-file-share/
├── frontend/                # React frontend application
├── backend/                 # Django backend application
├── docker-compose.yml      # Docker compose configuration
├── .gitignore             # Git ignore file
└── README.md              # Project documentation
```

## API Documentation

The API documentation is available at `/api/docs/` when running the backend server.

## Security Considerations

- All passwords are hashed using bcrypt
- Files are encrypted using AES-256 before storage
- MFA is required for all user accounts
- Session tokens expire after 24 hours
- File sharing links have configurable expiration times
- All API endpoints require authentication
- CORS is properly configured
- Input validation is performed on both client and server side

## License

MIT License 