# CareSprint — Database Schema Reference

CareSprint utilizes **MongoDB** with **Mongoose ODM** and **GeoJSON 2dsphere indexing** for location querying.

---

## Data Models Overview

```
                      ┌──────────────┐
                      │     User     │
                      └──────┬───────┘
                             │ (1:1)
             ┌───────────────┴───────────────┐
             ▼                               ▼
      ┌────────────┐                  ┌────────────┐
      │  Patient   │                  │   Doctor   │
      └─────┬──────┘                  └─────┬──────┘
            │ (1:N)                         │ (1:N)
            └───────────────┬───────────────┘
                            ▼
                     ┌────────────┐
                     │  Booking   │
                     └──────┬─────┘
            ┌───────────────┼───────────────┬───────────────┐
            ▼               ▼               ▼               ▼
     ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
     │  Payment   │  │Prescription│  │   Review   │  │Notification│
     └────────────┘  └────────────┘  └────────────┘  └────────────┘
```

---

## 1. User Model (`User.js`)

Stores core authentication credentials and system roles.

| Field | Type | Validation / Options | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated PK | Unique user identifier |
| `name` | String | Required, trim | Full name |
| `email` | String | Required, unique, lowercase | Email address |
| `phone` | String | Required, unique, regex (10 digits) | Phone number |
| `password` | String | Required, minlength: 6, select: false | Bcrypt hashed password |
| `role` | String | Enum: `PATIENT`, `DOCTOR`, `ADMIN` | Account role |
| `isPhoneVerified` | Boolean | Default: `false` | OTP verification flag |
| `isActive` | Boolean | Default: `true`, index: true | Active / suspended account flag |
| `profileImage` | String | Default: `null` | Avatar image URL |

---

## 2. Patient Model (`Patient.js`)

Extends `User` profile with medical notes and home coordinates.

| Field | Type | Validation / Options | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated PK | Patient ID |
| `userId` | ObjectId | Ref: `User`, required, unique | Foreign Key to User |
| `address` | String | Trim | Default home address |
| `location` | GeoJSON Point | 2dsphere index | Coordinates `[longitude, latitude]` |
| `dateOfBirth` | Date | Default: `null` | Date of birth |
| `gender` | String | Enum: `MALE`, `FEMALE`, `OTHER` | Gender |
| `medicalNotes` | String | Trim, maxlength: 2000 | Pre-existing medical conditions |

---

## 3. Doctor Model (`Doctor.js`)

Stores medical license credentials, verification status, and availability state.

| Field | Type | Validation / Options | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated PK | Doctor ID |
| `userId` | ObjectId | Ref: `User`, required, unique | Foreign Key to User |
| `specialization` | String | Required, trim | Medical specialty |
| `qualification` | String | Required, trim | Degrees (e.g. MBBS, MD) |
| `experience` | Number | Required, min: 0 | Experience in years |
| `licenseNumber` | String | Required, unique, trim | State Medical Council registration |
| `verificationStatus` | String | Enum: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED` | Admin verification status |
| `availabilityStatus` | String | Enum: `AVAILABLE`, `BUSY`, `OFFLINE` | Operational online status |
| `activeBookingId` | ObjectId | Ref: `Booking`, default: `null` | Atomic concurrency lock |
| `consultationFee` | Number | Required, min: 0, default: 500 | Visit fee in INR |
| `serviceRadius` | Number | Default: 10 (km) | Maximum travel radius |
| `serviceZone` | String | Enum: `Bhilai`, `Durg`, `Raipur` | Supported operational city |
| `currentLocation` | GeoJSON Point | 2dsphere index | Current location `[longitude, latitude]` |
| `rating` | Number | Default: 5.0, min: 1, max: 5 | Aggregate average rating |

---

## 4. Booking Model (`Booking.js`)

Manages home visit lifecycle, geolocation telemetry, and fee status.

| Field | Type | Validation / Options | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated PK | Booking ID |
| `patientId` | ObjectId | Ref: `Patient`, required, index: true | Patient foreign key |
| `doctorId` | ObjectId | Ref: `Doctor`, default: `null`, index: true | Assigned doctor foreign key |
| `symptoms` | String | Required, trim, maxlength: 1000 | Chief symptoms |
| `specializationRequired` | String | Required, trim | Requested specialty |
| `status` | String | Enum: `REQUESTED`, `MATCHING`, `ACCEPTED`, `DOCTOR_ON_THE_WAY`, `ARRIVED`, `CONSULTATION`, `COMPLETED`, `REJECTED`, `CANCELLED` | Visit state machine status |
| `paymentStatus` | String | Enum: `PENDING`, `PAID`, `FAILED`, `REFUNDED` | Fee payment status |
| `consultationFee` | Number | Required, min: 0 | Payable amount in INR |
| `prescriptionId` | ObjectId | Ref: `Prescription`, default: `null` | Linked prescription |
| `patientLocation` | GeoJSON Point | 2dsphere index | Patient address coordinates `[lng, lat]` |
| `address` | Object | Object with street, area, city, pincode | Visit physical address |

---

## 5. Payment Model (`Payment.js`)

Records Razorpay payment orders and HMAC-SHA256 signature verification metadata.

| Field | Type | Validation / Options | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated PK | Payment ID |
| `bookingId` | ObjectId | Ref: `Booking`, required, unique | Foreign Key to Booking |
| `patientId` | ObjectId | Ref: `Patient`, required, index: true | Patient foreign key |
| `doctorId` | ObjectId | Ref: `Doctor`, default: `null` | Doctor foreign key |
| `amount` | Number | Required, min: 0 | Amount in INR |
| `provider` | String | Enum: `RAZORPAY`, default: `RAZORPAY` | Gateway provider |
| `orderId` | String | Unique, sparse | Razorpay Order ID |
| `paymentId` | String | Unique, sparse | Razorpay Payment ID |
| `signature` | String | Default: `null` | Cryptographic HMAC signature |
| `status` | String | Enum: `CREATED`, `PENDING`, `SUCCESS`, `FAILED` | Payment transaction status |

---

## 6. Prescription Model (`Prescription.js`)

Digital prescription document issued by assigned doctor.

| Field | Type | Validation / Options | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated PK | Prescription ID |
| `bookingId` | ObjectId | Ref: `Booking`, required, unique | Booking foreign key |
| `patientId` | ObjectId | Ref: `Patient`, required, index: true | Patient foreign key |
| `doctorId` | ObjectId | Ref: `Doctor`, required, index: true | Doctor foreign key |
| `diagnosis` | String | Trim, maxlength: 2000 | Clinical diagnosis |
| `medicines` | Array | Objects: `name`, `dosage`, `frequency`, `duration`, `instructions` | Prescribed medications |
| `instructions` | String | Trim, maxlength: 3000 | General care instructions |
| `notes` | String | Trim, maxlength: 3000 | Private clinical notes |
| `followUpAdvice` | String | Trim, maxlength: 2000 | Follow-up recommendations |

---

## 7. Review Model (`Review.js`)

Patient reviews and 1–5 star ratings.

| Field | Type | Validation / Options | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated PK | Review ID |
| `bookingId` | ObjectId | Ref: `Booking`, required, unique | Booking foreign key |
| `patientId` | ObjectId | Ref: `Patient`, required, index: true | Patient foreign key |
| `doctorId` | ObjectId | Ref: `Doctor`, required, index: true | Doctor foreign key |
| `rating` | Number | Required, min: 1, max: 5 | Rating value |
| `comment` | String | Trim, maxlength: 1000 | Review text |

---

## 8. Notification Model (`Notification.js`)

In-app alerts and Socket.IO real-time notification records.

| Field | Type | Validation / Options | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated PK | Notification ID |
| `userId` | ObjectId | Ref: `User`, required, index: true | Recipient user foreign key |
| `type` | String | Enum: `BOOKING_REQUEST`, `BOOKING_ACCEPTED`, `DOCTOR_ON_THE_WAY`, `DOCTOR_ARRIVED`, `CONSULTATION_STARTED`, `CONSULTATION_COMPLETED`, `PRESCRIPTION_READY`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `BOOKING_CANCELLED`, `BOOKING_REJECTED`, `GENERAL` | Event type |
| `title` | String | Required, trim | Notification header |
| `message` | String | Required, trim | Notification body |
| `bookingId` | ObjectId | Ref: `Booking`, default: `null` | Associated booking ID |
| `isRead` | Boolean | Default: `false`, index: true | Unread status flag |

---

## 9. AuditLog Model (`AuditLog.js`)

Tamper-evident audit trail for administrative, clinical, and financial actions.

| Field | Type | Validation / Options | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto-generated PK | Audit Log ID |
| `userId` | ObjectId | Ref: `User`, default: `null` | Actor User ID |
| `role` | String | Enum: `PATIENT`, `DOCTOR`, `ADMIN`, `SYSTEM` | Actor role |
| `action` | String | Required, trim | Action code (e.g. `DOCTOR_APPROVED`) |
| `resource` | String | Required, trim | Modified resource type |
| `resourceId` | ObjectId | Default: `null` | Modified resource ID |
| `metadata` | Object | Mixed metadata payload | Detailed action snapshot |
| `ipAddress` | String | Default: `null` | IP address of request |
