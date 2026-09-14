# CareSprint — Product Architecture Overview

## 1. Executive Summary

CareSprint is an on-demand, location-aware at-home healthcare platform connecting Patients with nearby verified Doctors for urgent and scheduled home consultation visits across Bhilai, Durg, and Raipur (Chhattisgarh, India).

The platform comprises an Express.js backend with MongoDB GeoJSON indexing, Socket.IO real-time event streaming, Razorpay payment gateway integration, and a React.js single-page frontend.

---

## 2. User Roles & Authorization

CareSprint enforces strict Role-Based Access Control (RBAC) across three primary user roles:

| Role | Access Scope | Allowed Routes | Key Responsibilities & Capabilities |
| :--- | :--- | :--- | :--- |
| **PATIENT** | Patient Portal | `/patient/*` | Request doctors, process Razorpay payments, live-track doctor en-route, view digital prescriptions, submit 1–5 star reviews |
| **DOCTOR** | Doctor Portal | `/doctor/*` | Toggle availability status, accept/reject booking requests, navigate to patient address, record diagnoses & prescriptions, track earnings |
| **ADMIN** | Admin Portal | `/admin/*` | Verify doctor credentials/licenses, audit platform transactions, monitor active visits, inspect reviews & complaints, manage user statuses |

---

## 3. Core State Machines & Lifecycles

### 3.1 Booking Lifecycle State Machine

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

#### State Definitions & Allowed Transitions

| State | Description | Next Allowed States | Responsible Actor / Trigger |
| :--- | :--- | :--- | :--- |
| `REQUESTED` | Booking request initiated by patient | `MATCHING`, `CANCELLED` | Patient / System |
| `MATCHING` | Matching engine evaluating eligible nearby doctors | `ACCEPTED`, `EXPIRED`, `MATCHING_FAILED`, `CANCELLED` | Automated Matching Engine |
| `ACCEPTED` | Doctor accepted the booking request | `DOCTOR_ON_THE_WAY`, `CANCELLED` | Assigned Doctor |
| `DOCTOR_ON_THE_WAY` | Doctor started live GPS navigation to patient address | `ARRIVED`, `CANCELLED` | Assigned Doctor |
| `ARRIVED` | Doctor reached patient location | `CONSULTATION` | Assigned Doctor |
| `CONSULTATION` | Active medical consultation in progress | `COMPLETED` | Assigned Doctor |
| `COMPLETED` | Consultation finished & prescription issued | *Terminal State* | Assigned Doctor |
| `REJECTED` | Doctor explicitly declined the request | *Terminal State / Forward* | Assigned Doctor / Matching Loop |
| `EXPIRED` | Doctor response window (15s) elapsed without response | *Terminal State / Forward* | System Timeout Handler |
| `CANCELLED` | Booking cancelled prior to consultation | *Terminal State* | Patient / Doctor / System |

---

### 3.2 Doctor Verification & Availability Lifecycle

```
[ REGISTERED ] ──► [ PENDING_VERIFICATION ] ──► [ APPROVED ] ──► [ AVAILABLE ] ⇄ [ BUSY ] ⇄ [ OFFLINE ]
                                      └──────► [ REJECTED / SUSPENDED ]
```

1. **REGISTERED**: Doctor account created with professional profile credentials.
2. **PENDING_VERIFICATION**: Verification documents (Medical License, Degree Certificate, ID Proof) submitted; awaiting Admin review.
3. **APPROVED**: Admin verifies credentials and grants operational access.
4. **AVAILABLE**: Doctor toggles online status; eligible for smart matching queries.
5. **BUSY**: Atomic lock acquired during an active booking assignment.
6. **OFFLINE**: Doctor toggles offline status; excluded from matching queries.

---

## 4. Socket.IO Real-Time Architecture

CareSprint uses authenticated Socket.IO connections with JWT handshake verification (`socket.handshake.auth.token`). Users join isolated, authorized rooms:

- `user:{userId}`: Personal user notification stream for alerts, payment updates, and booking dispatches.
- `booking:{bookingId}`: Isolated booking telemetry room for patient and assigned doctor to exchange live location updates (`DOCTOR_LOCATION_UPDATED`), status transitions, and ETA updates.

```
Doctor Browser ──(GPS Location Watcher)──► REST API / Socket ──► Backend Validation ──► Socket.IO Room (booking:{id}) ──► Authorized Patient Map
```

---

## 5. Security & Concurrency Architecture

- **NoSQL Injection Defense**: Custom middleware (`sanitizeNoSQL`) strips `$` and `.` operators recursively from all incoming payloads (`req.body`, `req.query`, `req.params`).
- **Atomic Locks**: MongoDB `findOneAndUpdate` atomic conditional updates prevent race conditions (e.g. `activeBookingId: null` lock prevents two patients from acquiring the same doctor simultaneously).
- **IDOR Protection**: Database queries strictly filter by authenticated `patientId` / `doctorId` derived from verified JWT tokens.
- **Fail-Safe Background Handlers**: Notifications and email dispatches execute in safe `try-catch` blocks and `setImmediate` async tasks, ensuring notification/email issues never crash core booking, payment, or consultation transactions.
