# CareSprint — On-Demand At-Home Healthcare Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-v18%2B-blue.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-GeoJSON-green.svg)](https://www.mongodb.com/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay-blue.svg)](https://razorpay.com/)
[![Socket.IO](https://img.shields.io/badge/Real--Time-Socket.IO-black.svg)](https://socket.io/)

CareSprint is an enterprise-grade, location-aware at-home healthcare platform that connects patients with nearby verified doctors for urgent and scheduled home consultation visits. Built using modern web technologies, CareSprint features real-time GPS telemetry tracking, deterministic doctor matching, secure Razorpay payments, verified digital prescriptions, and role-based portals for Patients, Doctors, and Administrators.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Solution](#3-solution)
4. [Key Features](#4-key-features)
5. [User Roles & Access Scope](#5-user-roles--access-scope)
6. [Booking Lifecycle State Machine](#6-booking-lifecycle-state-machine)
7. [System Architecture](#7-system-architecture)
8. [Technology Stack](#8-technology-stack)
9. [Folder Structure](#9-folder-structure)
10. [Database Schema Overview](#10-database-schema-overview)
11. [API Documentation Summary](#11-api-documentation-summary)
12. [Authentication & JWT Security](#12-authentication--jwt-security)
13. [Doctor Verification Workflow](#13-doctor-verification-workflow)
14. [Production-Safe Booking Engine & Concurrency](#14-production-safe-booking-engine--concurrency)
15. [Smart Doctor Matching Engine](#15-smart-doctor-matching-engine)
16. [Socket.IO Real-Time Architecture](#16-socketio-real-time-architecture)
17. [Live Doctor GPS Tracking](#17-live-doctor-gps-tracking)
18. [Google Maps & Telemetry Fallback](#18-google-maps--telemetry-fallback)
19. [Razorpay Payment Gateway Integration](#19-razorpay-payment-gateway-integration)
20. [Digital Prescription System](#20-digital-prescription-system)
21. [Reviews & Ratings System](#21-reviews--ratings-system)
22. [Notification & Asynchronous Email Architecture](#22-notification--asynchronous-email-architecture)
23. [Security Audit & Production Hardening](#23-security-audit--production-hardening)
24. [Master End-to-End Automated Testing Suite](#24-master-end-to-end-automated-testing-suite)
25. [Deployment Guide](#25-deployment-guide)
26. [Environment Variables Reference](#26-environment-variables-reference)
27. [User Interface & Visual Architecture](#27-user-interface--visual-architecture)
28. [Future Roadmap](#28-future-roadmap)

---

## 1. Project Overview

CareSprint bridges the gap between patient homecare demands and qualified medical practitioner dispatch across urban cities (Bhilai, Durg, and Raipur, Chhattisgarh, India). Patients request a home visit via an interactive interface, and the platform deterministically matches, dispatches, and tracks verified doctors in real-time while ensuring strict privacy, data integrity, and atomic concurrency controls.

---

## 2. Problem Statement

Accessing timely medical consultation often presents severe bottlenecks:
- **Mobility Restrictions**: Elderly patients, acute illness sufferers, and bedridden individuals struggle to commute to hospitals.
- **Hospital Overcrowding**: Outpatient departments experience long waiting times for minor or routine consultations.
- **Opacity & Lack of Telemetry**: Traditional home visits lack real-time arrival estimates, transparent pricing, and verifiable medical credentials.

---

## 3. Solution

CareSprint offers an end-to-end digital health logistics solution:
- **On-Demand Dispatch**: Matches patients with eligible doctors within a 10 km service radius in minutes.
- **Real-Time GPS Telemetry**: Live map tracking displaying doctor movement and route-based ETA updates.
- **Verified Credentials**: Strict admin verification requiring state medical council license validation prior to operational access.
- **Integrated Payments & Records**: Instant digital receipts via Razorpay and printable digital prescriptions.

---

## 4. Key Features

- 📍 **Geo-Spatial Radius Filtering**: MongoDB `$geoNear` 2dsphere indexing for exact geographic proximity querying.
- ⚡ **Atomic Concurrency Locks**: Conditional MongoDB updates (`activeBookingId`) preventing double-assignment race conditions.
- 💳 **Cryptographic Payments**: HMAC-SHA256 signature verification for Razorpay payment orders.
- 📄 **Digital Prescriptions**: Structured medication schedules with instructions, notes, follow-up advice, and one-click PDF printing (`window.print()`).
- 🔔 **Real-Time Notifications**: Multi-room Socket.IO events and asynchronous email dispatches.
- 🛡️ **Production Hardening**: NoSQL injection sanitization (`sanitizeNoSQL`), Helmet HTTP headers, rate limiting, and real-time active account status verification.

---

## 5. User Roles & Access Scope

CareSprint enforces strict Role-Based Access Control (RBAC):

| Role | Access Scope | Allowed Routes | Description |
| :--- | :--- | :--- | :--- |
| **PATIENT** | Patient Portal | `/patient/*` | Request home visits, make payments, track assigned doctor live, view prescriptions, submit reviews. |
| **DOCTOR** | Doctor Portal | `/doctor/*` | Manage availability (`AVAILABLE`, `BUSY`, `OFFLINE`), accept/reject requests, navigate to patient address, record diagnoses & issue digital prescriptions. |
| **ADMIN** | Admin Portal | `/admin/*` | Verify doctor credentials/licenses, audit platform transactions, monitor active visits, inspect reviews & audit logs. |

---

## 6. Booking Lifecycle State Machine

```
   [ REQUESTED ]
         │
         ▼
    [ MATCHING ] ───────────► [ EXPIRED / MATCHING_FAILED ]
         │
         ▼
    [ ACCEPTED ] ───────────► [ REJECTED / CANCELLED ]
         │
         ▼
[ DOCTOR_ON_THE_WAY ] ──────► [ CANCELLED ]
         │
         ▼
    [ ARRIVED ]
         │
         ▼
  [ CONSULTATION ]
         │
         ▼
   [ COMPLETED ]
```

---

## 7. System Architecture

CareSprint follows a decoupled client-server microservice-ready architecture:

```
┌─────────────────────────────────────────────────────────┐
│                      Client Layer                       │
│  React.js (Vite) + Tailwind CSS + Lucide Icons + Maps   │
└────────────────────────────┬────────────────────────────┘
                             │ REST API / WebSocket
┌────────────────────────────▼────────────────────────────┐
│                      Server Layer                       │
│ Node.js + Express.js + Socket.IO + JWT + Helmet         │
└────────────────────────────┬────────────────────────────┘
                             │ Mongoose ODM
┌────────────────────────────▼────────────────────────────┐
│                     Database Layer                      │
│ MongoDB Atlas / Enterprise (GeoJSON 2dsphere Indexing) │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Axios, React Router v6
- **Backend**: Node.js, Express.js, Socket.IO, Mongoose ODM, Nodemailer, Crypto
- **Database**: MongoDB (2dsphere index support for GeoJSON Point objects)
- **Payment Gateway**: Razorpay Payment API & HMAC-SHA256 Signature Verification
- **Security & Testing**: Helmet, Express Rate Limit, BcryptJS, Custom NoSQL Sanitizer, Node Native Test Runner

---

## 9. Folder Structure

```
CareSprint/
├── client/                      # React Frontend Project
│   ├── src/
│   │   ├── api/                 # Matching & Doctor API handlers
│   │   ├── components/          # Reusable UI Components & Header/Sidebar
│   │   ├── layouts/             # Patient, Doctor, Admin Layout Containers
│   │   ├── pages/               # Application Pages (Patient/Doctor/Admin)
│   │   ├── services/            # Axios API Axios Instance & Endpoint Services
│   │   └── routes/              # AppRoutes & Role Protected Routes
│   └── package.json
├── server/                      # Express.js Node.js Backend API
│   ├── src/
│   │   ├── controllers/         # Auth, Patient, Doctor, Admin, Payment, Notification Controllers
│   │   ├── middleware/          # Auth Protect, Role Authorize, NoSQL Sanitizer
│   │   ├── models/              # User, Patient, Doctor, Booking, Payment, Prescription, Review, Notification, AuditLog
│   │   ├── routes/              # Express API Routes
│   │   ├── services/            # Smart Matching Engine
│   │   ├── sockets/             # Socket.IO Handshake Auth & Room Event Emitters
│   │   └── utils/               # JWT, Geolocation Telemetry, Email & Audit Loggers
│   ├── .env.example
│   ├── server.js                # Server Entrypoint
│   └── verify_*.js              # Automated Test Suites
├── docs/                        # Project Architecture, Database & API Documentation
└── README.md
```

---

## 10. Database Schema Overview

The CareSprint database comprises 9 inter-connected Mongoose models:
- **`User`**: Authentication credentials, role (`PATIENT`, `DOCTOR`, `ADMIN`), active status.
- **`Patient`**: Home address, medical notes, GeoJSON coordinates.
- **`Doctor`**: Medical license number, specialization, consultation fee, availability status (`AVAILABLE`, `BUSY`, `OFFLINE`), active booking lock (`activeBookingId`), GeoJSON coordinates, average rating.
- **`Booking`**: Visit state machine status, chief symptoms, consultation fee, payment status, location coordinates.
- **`Payment`**: Razorpay order ID, payment ID, HMAC signature, status (`SUCCESS`, `FAILED`).
- **`Prescription`**: Diagnosis, medication schedule array, general instructions, clinical notes, follow-up advice.
- **`Review`**: 1–5 star rating and feedback comment.
- **`Notification`**: In-app alert history and unread status.
- **`AuditLog`**: Security audit log entries for administrative, clinical, and financial actions.

See [`docs/database/schema.md`](docs/database/schema.md) for full schema specifications.

---

## 11. API Documentation Summary

Base URL: `/api/v1`

- **Auth**: `/auth/patient/register`, `/auth/patient/verify-otp`, `/auth/doctor/register`, `/auth/login`, `/auth/me`
- **Patient**: `/patient/dashboard`, `/patient/doctors`, `/patient/bookings`, `/patient/bookings/:id/tracking`, `/patient/prescriptions`, `/patient/reviews`
- **Doctor**: `/doctor/dashboard`, `/doctor/availability`, `/doctor/requests`, `/doctor/visits/:id/complete`, `/doctor/visits/:id/prescription`
- **Payment**: `/payment/create-order`, `/payment/verify-signature`, `/payment/handle-failure`
- **Admin**: `/admin/overview`, `/admin/doctors/pending`, `/admin/doctors/:id/approve`, `/admin/audit-logs`
- **Notifications**: `/notifications`, `/notifications/:id/read`, `/notifications/read-all`

See [`docs/api/endpoints.md`](docs/api/endpoints.md) for the complete endpoint reference.

---

## 12. Authentication & JWT Security

- **HttpOnly Cookies & Bearer Tokens**: JWTs issued upon login (`expiresIn: "15m"`).
- **Active User Lookup**: `protect` middleware queries database on every request (`User.findById`). Suspended accounts (`isActive = false`) have token access instantly revoked.
- **Role Enforcement**: User role is derived directly from database records during request execution, preventing payload manipulation or role spoofing.

---

## 13. Doctor Verification Workflow

1. Doctor registers with professional qualifications and Medical Council License Number.
2. Status initialized to `PENDING_VERIFICATION`.
3. Admin inspects credentials and uploaded documents via Admin Portal (`/admin/doctors/pending`).
4. Admin approves doctor (`verificationStatus = "APPROVED"`).
5. Only approved doctors can toggle availability to `AVAILABLE` or receive visit dispatches.

---

## 14. Production-Safe Booking Engine & Concurrency

To prevent double-booking race conditions when multiple patients request a doctor simultaneously:
- Atomic database updates (`Doctor.findOneAndUpdate({ _id, activeBookingId: null })`) ensure only **one** patient successfully locks an available doctor.
- When a doctor completes a visit (`completeConsultation`), the system verifies `activeBookingId === booking._id` prior to clearing the active booking lock.

---

## 15. Smart Doctor Matching Engine

CareSprint uses a deterministic matching algorithm:
1. **Filters**: Role = `DOCTOR`, `verificationStatus = "APPROVED"`, `availabilityStatus = "AVAILABLE"`, `activeBookingId = null`, location inside supported service zone and 10 km radius.
2. **Ranking Score**:
   $$\text{Score} = (\text{Distance Score} \times 0.5) + (\text{Rating} \times 0.3) + (\text{Experience} \times 0.2)$$
3. **Dispatch Loop**: Dispatches request to highest-ranked doctor with a 15-second response deadline. If rejected/expired, automatically forwards to the next eligible candidate.

---

## 16. Socket.IO Real-Time Architecture

CareSprint uses multi-room WebSocket event channels:
- `user:{userId}`: Delivers personal notifications, booking dispatches, and payment confirmations.
- `booking:{bookingId}`: Isolated telemetry channel for patient and assigned doctor to exchange live location coordinates (`DOCTOR_LOCATION_UPDATED`), ETA, and visit status updates.

---

## 17. Live Doctor GPS Tracking

- **Browser Geolocation API**: Doctor's browser broadcasts GPS coordinates while visit status is `DOCTOR_ON_THE_WAY`, `ARRIVED`, or `CONSULTATION`.
- **Privacy Protection**: Doctor location coordinates are shared ONLY with the patient associated with the active accepted booking. Live location access is terminated immediately upon consultation completion.

---

## 18. Google Maps & Telemetry Fallback

- **Google Tracking Map**: Renders map container, home marker, doctor vehicle marker, route polyline, and auto-adjusts bounds (`fitBounds`). Position updates are throttled (max 1 update per 3s) to avoid flickering.
- **Zero-Crash Fallback**: If Google Maps API key is missing or fails, the frontend renders an SVG telemetry map displaying live Haversine distance & ETA badges without crashing React.

---

## 19. Razorpay Payment Gateway Integration

1. **Order Creation**: Patient initiates checkout $\rightarrow$ Backend validates fee and creates Razorpay Order (`POST /api/v1/payment/create-order`).
2. **Modal Checkout**: Frontend opens Razorpay Checkout JS modal.
3. **Server Signature Check**: Upon payment completion, backend verifies HMAC-SHA256 signature (`orderId + "|" + paymentId`).
4. **Idempotency**: Prevents duplicate callbacks, amount manipulation, or replay attacks.

---

## 20. Digital Prescription System

- Assigned doctors generate structured digital prescriptions during `CONSULTATION` or `COMPLETED` visits.
- Stores diagnosis, medication items (name, dosage, frequency, duration, instructions), care notes, and follow-up advice.
- Patients can view, print, or download their verified prescription via browser print formatting (`window.print()`).

---

## 21. Reviews & Ratings System

- Patients can rate completed consultations from 1 to 5 stars with feedback comments.
- **Identity Derivation**: `patientId` derived strictly from JWT authentication context.
- **Atomic Aggregate Update**: Automatically recalculates and updates `Doctor.rating` average on the database.
- **Duplicate Protection**: Unique `bookingId` index prevents duplicate review submissions.

---

## 22. Notification & Asynchronous Email Architecture

- **In-App Alerts**: Tracks 11 lifecycle event types (`BOOKING_REQUEST`, `BOOKING_ACCEPTED`, `DOCTOR_ON_THE_WAY`, `DOCTOR_ARRIVED`, `CONSULTATION_STARTED`, `CONSULTATION_COMPLETED`, `PRESCRIPTION_READY`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `BOOKING_CANCELLED`, `BOOKING_REJECTED`).
- **Asynchronous Email Service**: Dispatches non-blocking emails via Nodemailer for registration, booking confirmations, payment receipts, and digital prescriptions (`emailService.js`).
- **Fail-Safe Execution**: Notification/email errors are caught silently, ensuring notification issues never crash core transactions.

---

## 23. Security Audit & Production Hardening

- **NoSQL Sanitization**: `sanitizeNoSQL` middleware strips `$` and `.` operators from all incoming requests.
- **HTTP Security**: Configured Helmet headers, strict CORS origins (`CLIENT_URL`), body parser limits (`10mb`), and rate limiting (`15m` window, max `200` requests).
- **Audit Logging**: Tamper-evident `AuditLog` records sensitive administrative, clinical, and financial actions.

---

## 24. Master End-to-End Automated Testing Suite

CareSprint includes automated test suites covering all 19 phases:
- `verify_doctor_phase.js`: Doctor verification & availability status state machine tests.
- `verify_payment_phase.js`: Razorpay HMAC signature & payment idempotency tests.
- `verify_prescription_phase.js`: Digital prescription creation & medical privacy isolation tests.
- `verify_reviews_phase.js`: Review submission & aggregate rating calculation tests.
- `verify_notifications_phase.js`: In-app notification creation & email dispatch tests.
- `verify_security_phase.js`: NoSQL injection, active user revocation, & IDOR guard tests.
- `verify_e2e_complete_phase19.js`: Master suite testing all 10 booking concurrency scenarios and system integrity guards.

Run all tests via:
```bash
cd server
node verify_e2e_complete_phase19.js
```

---

## 25. Deployment Guide

### Prerequisites
- Node.js v18+ & npm
- MongoDB Instance / MongoDB Atlas Cluster with GeoJSON 2dsphere index support

### Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Configure MONGO_URI, JWT_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET in .env
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
# Configure VITE_API_BASE_URL and VITE_GOOGLE_MAPS_API_KEY in client/.env
npm run dev
```

---

## 26. Environment Variables Reference

### Backend (`server/.env.example`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/caresprint
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:5173
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

### Frontend (`client/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

---

## 27. User Interface & Visual Architecture

CareSprint features responsive web pages built with Tailwind CSS, Lucide icons, glassmorphism containers, and interactive state badges:
- **Patient Portal**: Dashboard, Doctor Discovery, Checkout, Live GPS Tracking, Digital Prescriptions, Consultation History, Notification Drawer.
- **Doctor Portal**: Doctor Dashboard, Request Modal, Live Navigation & Visit Status Controller, Prescription Form, Earnings Analytics.
- **Admin Portal**: Platform Overview, Pending Doctor Verification Panel, User Status Manager, Transactions Audit Table, System Audit Logs.

---

## 28. Future Roadmap

- 📱 **Native Mobile Apps**: React Native iOS & Android builds with native background location streaming.
- 🤖 **AI Triage & Symptom Checker**: LLM-assisted preliminary symptom assessment to suggest target medical specialties.
- 🏥 **EHR / Health Locker Integration**: ABDM (Ayushman Bharat Digital Mission) compliance for unified patient health records.
- 💊 **Pharmacy & Diagnostics Integration**: Automated prescription dispatch to partner diagnostic labs and pharmacies.

---

<p align="center">
  <strong>CareSprint Telemedicine Platform · Enterprise At-Home Healthcare</strong>
</p>