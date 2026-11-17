# Feedback System - Backend (Express + MongoDB)
```
npm install
npm run dev     # http://localhost:5000
npm test        # API tests (server must be running)
```
Endpoints: POST /api/auth/register | /login, POST /api/feedback, GET /api/feedback/my, GET /api/feedback (admin, ?category=), GET /api/feedback/stats (admin), PATCH /api/feedback/:id (admin)
Deploy on Render / Railway; use MongoDB Atlas for MONGO_URI.
