# CareSprint — API Contracts & Specifications

## 1. Authentication & Common Endpoints (`/api/v1/auth`)

### `POST /api/v1/auth/patient/register`
- **Auth**: Public
- **Description**: Registers a new patient user account and sends OTP.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "9876543210",
    "password": "Password123!",
    "address": "Civic Center, Bhilai"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Registration successful. Please verify your OTP.",
    "userId": "64f1a2b3c4d5e6f7a8b9c0d1"
  }
  ```

---

### `POST /api/v1/auth/patient/verify-otp`
- **Auth**: Public
- **Description**: Verifies phone number via 6-digit OTP code and logs in patient.
- **Request Body**:
  ```json
  {
    "phone": "9876543210",
    "otp": "123456"
  }
  ```
- **Response (200 OK)**: Sets HTTP-Only Cookie `accessToken`
  ```json
  {
    "success": true,
    "message": "Authentication successful",
    "user": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "9876543210",
      "role": "PATIENT",
      "isVerified": true
    }
  }
  ```

---

### `POST /api/v1/auth/doctor/register`
- **Auth**: Public
- **Description**: Registers a doctor profile in `PENDING_VERIFICATION` status.
- **Request Body**:
  ```json
  {
    "name": "Dr. John Smith",
    "email": "drjohn@example.com",
    "phone": "9876543211",
    "password": "DoctorPassword123!",
    "specialization": "General Physician",
    "qualification": "MBBS, MD",
    "experience": 8,
    "consultationFee": 500,
    "licenseNumber": "MCI-123456-A",
    "address": "Sector 6, Bhilai"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Doctor registration submitted successfully. Awaiting admin verification.",
    "userId": "64f1a2b3c4d5e6f7a8b9c0d2",
    "verificationStatus": "PENDING"
  }
  ```

---

### `POST /api/v1/auth/login`
- **Auth**: Public
- **Description**: Common login endpoint for Patients, Doctors, and Admins.
- **Request Body**:
  ```json
  {
    "phone": "9876543210",
    "password": "Password123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Authentication successful",
    "user": {
      "id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Jane Doe",
      "role": "PATIENT",
      "isVerified": true
    }
  }
  ```

---

### `GET /api/v1/auth/me`
- **Auth**: Protected (`PATIENT`, `DOCTOR`, `ADMIN`)
- **Description**: Fetches current authenticated user data.

---

## 2. Patient & Matching Endpoints (`/api/v1/matching`)

### `POST /api/v1/matching/bookings`
- **Auth**: Protected (`PATIENT`)
- **Description**: Creates a new booking request and initiates intelligent doctor matching.
- **Request Body**:
  ```json
  {
    "symptoms": "High fever and severe headache since morning",
    "specialization": "General Physician",
    "address": {
      "street": "123 Main Street",
      "area": "Civic Center",
      "city": "Bhilai",
      "state": "Chhattisgarh",
      "pincode": "490006"
    },
    "patientLocation": {
      "coordinates": [81.3500, 21.1900]
    },
    "consultationFee": 500
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Doctor matching started",
    "booking": {
      "id": "64f1b2c3d4e5f6a7b8c9d0e1",
      "status": "MATCHING",
      "consultationFee": 500,
      "requestedAt": "2026-09-14T15:00:00.000Z"
    }
  }
  ```

---

### `GET /api/v1/matching/bookings/:bookingId/matching`
- **Auth**: Protected (`PATIENT`)
- **Description**: Gets current dispatch status and candidate status for a booking.

---

## 3. Doctor Portal Endpoints (`/api/v1/doctor`)

### `GET /api/v1/doctor/dashboard`
- **Auth**: Protected (`DOCTOR`)
- **Description**: Doctor dashboard stats (today's visits, pending requests, total earnings).

---

### `PATCH /api/v1/doctor/availability`
- **Auth**: Protected (`DOCTOR`)
- **Description**: Toggles doctor availability (`OFFLINE` / `AVAILABLE`).
- **Request Body**: `{ "availabilityStatus": "AVAILABLE" }`

---

### `GET /api/v1/doctor/requests`
- **Auth**: Protected (`DOCTOR`)
- **Description**: Retrieves pending incoming dispatch requests.

---

### `PATCH /api/v1/doctor/requests/:bookingId/accept`
- **Auth**: Protected (`DOCTOR`)
- **Description**: Accepts an incoming booking request; acquires atomic doctor lock.

---

### `PATCH /api/v1/doctor/requests/:bookingId/reject`
- **Auth**: Protected (`DOCTOR`)
- **Description**: Rejects an incoming booking request.

---

### Lifecycle Visit Progression Endpoints:
- `PATCH /api/v1/doctor/visits/:bookingId/start` ➔ Transitions status to `DOCTOR_ON_THE_WAY`.
- `PATCH /api/v1/doctor/visits/:bookingId/arrived` ➔ Transitions status to `ARRIVED`.
- `PATCH /api/v1/doctor/visits/:bookingId/consultation` ➔ Transitions status to `CONSULTATION`.
- `PATCH /api/v1/doctor/visits/:bookingId/complete` ➔ Transitions status to `COMPLETED` and releases doctor lock.
- `POST /api/v1/doctor/visits/:bookingId/prescription` ➔ Creates prescription.

---

## 4. Admin Portal Endpoints (`/api/v1/admin`)

### `GET /api/v1/admin/doctors/pending`
- **Auth**: Protected (`ADMIN`)
- **Description**: Retrieves list of doctors awaiting verification.

---

### `PATCH /api/v1/admin/doctors/:doctorId/approve`
- **Auth**: Protected (`ADMIN`)
- **Description**: Approves doctor profile & uploaded credentials.

---

### `PATCH /api/v1/admin/doctors/:doctorId/reject`
- **Auth**: Protected (`ADMIN`)
- **Description**: Rejects doctor profile with obligatory rejection reason.
- **Request Body**: `{ "reason": "Medical license number could not be verified with state council" }`
