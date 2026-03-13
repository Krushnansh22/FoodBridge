# 🌉 FoodBridge

> Connecting surplus food from donors with NGOs and drivers that distribute it to those in need.

---

## 📁 Project Structure

FoodBridge/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── .env
│   ├── package.json
│   └── server.js
└── mobile/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── context/
    │   ├── navigation/
    │   ├── screens/
    │   └── utils/
    ├── App.js
    ├── app.json
    └── package.json

---

## ⚙️ Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)
- Expo Go app SDK 53 on your phone

---

## 🚀 Backend Setup

cd FoodBridge/backend
npm install
npm run dev

Configure .env:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/foodbridge
JWT_SECRET=foodbridge_super_secret_key_2024
JWT_EXPIRE=7d

---

## 📱 Mobile Setup

cd FoodBridge/mobile
npm install --legacy-peer-deps
npx expo start --clear

Set BASE_URL in src/api/index.js to your machine IP.

---

## 👥 User Roles

| Role   | Can Do |
|--------|--------|
| Donor  | Create listings, approve/reject NGO requests |
| NGO    | Browse food, request pickups, mark collected |
| Driver | See approved deliveries, accept & deliver food |
| Admin  | View all users and listings, manage accounts |

---

## 📡 API Endpoints

### Auth
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile
POST   /api/auth/forgot-password
POST   /api/auth/verify-otp
POST   /api/auth/reset-password

### Listings
GET    /api/listings
GET    /api/listings/mine
GET    /api/listings/:id
POST   /api/listings
PUT    /api/listings/:id
DELETE /api/listings/:id

### Requests
POST   /api/requests/listing/:listingId
GET    /api/requests/donor
GET    /api/requests/ngo
PUT    /api/requests/:id/approve
PUT    /api/requests/:id/reject
PUT    /api/requests/:id/collect

### Driver
GET    /api/driver/deliveries
GET    /api/driver/deliveries/mine
PUT    /api/driver/deliveries/:id/accept
PUT    /api/driver/deliveries/:id/status
PUT    /api/driver/location

### Admin
GET    /api/admin/stats
GET    /api/admin/users
GET    /api/admin/listings
PUT    /api/admin/users/:id/toggle

---

## 🗄️ Database Models

### User
name, email, password, role (donor/ngo/driver/admin),
phone, address, organizationName, isActive,
vehicleType, vehicleNumber, isAvailable, currentLocation,
resetPasswordOTP, resetPasswordOTPExpire

### Listing
donor, title, description, foodType, quantity, servings,
expiresAt, pickupAddress, pickupLocation, status

### Request
listing, ngo, donor, driver, message, status, driverStatus,
pickupTime, ngoLocation, driverAcceptedAt, pickedUpAt, deliveredAt

---

## 🎨 App Screens

### Donor
- Dashboard — stats, listings, pending requests
- Create Listing — post food with map location picker
- Pickup Requests — approve/reject NGO requests

### NGO
- Browse Food — filter available listings
- Listing Detail — view details, pick location on map, request pickup
- My Requests — track status, see driver info

### Driver
- Available Deliveries — see all approved jobs, accept delivery
- My Deliveries — track status: accepted → heading → picked up → delivered
- Map buttons to open pickup and drop locations

### Admin
- Dashboard — platform stats
- Users — manage all accounts

---

## 🏆 Hackathon Demo Flow

1. Register as Donor → post food listing with map location
2. Register as NGO → browse, pick location on map, request pickup
3. Login as Donor → approve the request
4. Register as Driver → see the delivery → accept it
5. Driver → update status: heading → picked up → delivered
6. Login as Admin → view all stats

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect to API | Check BASE_URL in src/api/index.js |
| MongoDB not connecting | Run mongod |
| Expo issues | npx expo start --clear |
| JWT errors | Clear app and re-login |
| OTP not received | Check server console log for dev OTP |