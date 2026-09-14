# CareSprint — API Endpoint Reference

All endpoints operate under base path `/api/v1`. Authentication tokens are passed via HttpOnly `accessToken` cookie or HTTP Header `Authorization: Bearer <token>`.

---

## 1. Authentication Endpoints (`/auth`)

| Method | Endpoint | Description | Auth Required | Request Body / Params |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/patient/register` | Register new patient account | None | `{ name, email, phone, password }` |
| `POST` | `/auth/patient/verify-otp` | Verify patient OTP | None | `{ phone, otp }` |
| `POST` | `/auth/doctor/register` | Register doctor applicant | None | `{ name, email, phone, password, specialization, qualification, experience, licenseNumber, consultationFee }` |
| `POST` | `/auth/login` | User login (Patient, Doctor, Admin) | None | `{ email, password }` |
| `GET` | `/auth/me` | Get current authenticated user profile | Yes | None |
| `POST` | `/auth/logout` | Clear authentication cookies | Yes | None |

---

## 2. Patient Endpoints (`/patient`) — Authorized Role: `PATIENT`

| Method | Endpoint | Description | Query / Body Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/patient/dashboard` | Patient home dashboard summary | None |
| `GET` | `/patient/profile` | Get patient profile details | None |
| `PATCH` | `/patient/profile` | Update profile information | `{ name, address, dateOfBirth, gender, emergencyContact, medicalNotes }` |
| `PATCH` | `/patient/location` | Update live patient coordinates | `{ longitude, latitude, address }` |
| `GET` | `/patient/doctors` | Search & geo-filter nearby doctors | `?search=general&longitude=81.35&latitude=21.19` |
| `GET` | `/patient/doctors/:doctorId` | Get doctor details & reviews | None |
| `GET` | `/patient/doctors/:doctorId/reviews` | Get public doctor reviews | None |
| `GET` | `/patient/bookings` | List patient's bookings | None |
| `POST` | `/patient/bookings` | Create new home visit booking | `{ doctorId, symptoms, specialization, address, patientLocation, consultationFee }` |
| `GET` | `/patient/bookings/:bookingId` | Get single booking details | None |
| `GET` | `/patient/bookings/:bookingId/tracking` | Get live doctor tracking telemetry | None |
| `PATCH` | `/patient/bookings/:bookingId/cancel` | Cancel an active booking | `{ reason }` |
| `GET` | `/patient/prescriptions` | Get patient's digital prescriptions | None |
| `GET` | `/patient/reviews` | List reviews submitted by patient | None |
| `POST` | `/patient/reviews` | Submit doctor consultation review | `{ bookingId, doctorId, rating, comment }` |

---

## 3. Doctor Endpoints (`/doctor`) — Authorized Role: `DOCTOR`

| Method | Endpoint | Description | Body Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/doctor/dashboard` | Doctor portal dashboard | None |
| `GET` | `/doctor/profile` | Get doctor profile | None |
| `PATCH` | `/doctor/profile` | Update doctor profile details | `{ specialization, qualification, experience, consultationFee, serviceRadius }` |
| `PATCH` | `/doctor/availability` | Toggle online status | `{ availabilityStatus: "AVAILABLE" | "BUSY" | "OFFLINE" }` |
| `PATCH` | `/doctor/location` | Broadcast current GPS location | `{ longitude, latitude }` |
| `GET` | `/doctor/requests` | List incoming visit requests | None |
| `PATCH` | `/doctor/requests/:bookingId/accept` | Accept booking request | None |
| `PATCH` | `/doctor/requests/:bookingId/reject` | Reject booking request | `{ reason }` |
| `GET` | `/doctor/visits/:bookingId` | Get visit details & patient location | None |
| `PATCH` | `/doctor/visits/:bookingId/start` | Start visit (`DOCTOR_ON_THE_WAY`) | None |
| `PATCH` | `/doctor/visits/:bookingId/arrived` | Mark doctor arrived at address | None |
| `PATCH` | `/doctor/visits/:bookingId/consultation` | Start consultation | None |
| `PATCH` | `/doctor/visits/:bookingId/complete` | Complete consultation | None |
| `POST` | `/doctor/visits/:bookingId/prescription` | Create / update prescription | `{ diagnosis, medicines, instructions, notes, followUpAdvice }` |
| `GET` | `/doctor/earnings` | Earnings summary & breakdown | None |
| `GET` | `/doctor/history` | List completed visit history | None |

---

## 4. Payment Endpoints (`/payment`) — Authorized Role: `PATIENT`

| Method | Endpoint | Description | Body Parameters |
| :--- | :--- | :--- | :--- |
| `POST` | `/payment/create-order` | Create Razorpay order | `{ bookingId }` |
| `POST` | `/payment/verify-signature` | Verify Razorpay HMAC signature | `{ bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature }` |
| `POST` | `/payment/handle-failure` | Process payment cancellation | `{ bookingId, orderId, reason }` |

---

## 5. Admin Endpoints (`/admin`) — Authorized Role: `ADMIN`

| Method | Endpoint | Description | Body / Query Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/overview` | Admin platform metrics & revenue | None |
| `GET` | `/admin/doctors/pending` | List doctors awaiting approval | None |
| `GET` | `/admin/doctors` | List all registered doctors | `?status=APPROVED&page=1&limit=20` |
| `PATCH` | `/admin/doctors/:doctorId/approve` | Approve doctor application | None |
| `PATCH` | `/admin/doctors/:doctorId/reject` | Reject doctor application | `{ reason }` |
| `PATCH` | `/admin/doctors/:doctorId/suspend` | Suspend doctor access | None |
| `PATCH` | `/admin/doctors/:doctorId/reactivate` | Reactivate suspended doctor | None |
| `GET` | `/admin/patients` | List registered patients | `?page=1&limit=20` |
| `PATCH` | `/admin/users/:userId/status` | Toggle user active status | `{ isActive: true | false }` |
| `GET` | `/admin/bookings` | List all platform bookings | `?status=COMPLETED&page=1&limit=20` |
| `GET` | `/admin/visits/active` | Monitor live active visits | None |
| `GET` | `/admin/payments` | Inspect payment transactions | `?status=SUCCESS` |
| `GET` | `/admin/reviews` | Inspect patient reviews | None |
| `GET` | `/admin/audit-logs` | View tamper-evident audit logs | `?action=DOCTOR_APPROVED&page=1` |

---

## 6. Notification Endpoints (`/notifications`) — Authorized Roles: `PATIENT`, `DOCTOR`, `ADMIN`

| Method | Endpoint | Description | Response Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Get user notifications & unread count | `{ success: true, unreadCount, notifications }` |
| `PATCH` | `/notifications/:id/read` | Mark single notification as read | `{ success: true, unreadCount, notification }` |
| `PATCH` | `/notifications/read-all` | Mark all notifications as read | `{ success: true, unreadCount: 0 }` |
