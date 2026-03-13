# 🌉 FoodBridge

> Connecting surplus food from donors with NGOs and drivers that distribute it to those in need.

---

## 📁 Project Structure

```
FoodBridge/
├── backend/
│   ├── controllers/
│   │   ├── adminController.js      # Admin dashboard stats & user management
│   │   ├── authController.js       # Auth, profile updates, password reset
│   │   ├── driverController.js     # Driver deliveries, OTP verification, emails
│   │   ├── listingController.js    # Food listing CRUD
│   │   └── requestController.js    # NGO requests, donor approvals, donor listing
│   ├── middleware/
│   │   └── auth.js                 # JWT authentication & role authorization
│   ├── models/
│   │   ├── Listing.js              # Food listing schema
│   │   ├── Request.js              # Pickup request schema (with OTP fields)
│   │   └── User.js                 # User schema (donor/ngo/driver/admin)
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── driver.js
│   │   ├── listings.js
│   │   └── requests.js
│   ├── utils/
│   │   └── sendEmail.js            # Nodemailer email utility
│   ├── .env
│   ├── package.json
│   └── server.js
└── mobile/
    ├── public/
    │   └── logo.png                # App logo (used across screens & emails)
    ├── src/
    │   ├── api/
    │   │   └── index.js            # API client with all endpoint methods
    │   ├── components/
    │   │   └── index.js            # Reusable UI components (Button, Input, Card, etc.)
    │   ├── context/
    │   │   └── AuthContext.js       # Auth state management
    │   ├── navigation/
    │   │   └── AppNavigator.js      # Tab & stack navigation for all roles
    │   ├── screens/
    │   │   ├── AdminScreen.js
    │   │   ├── AdminExpiredFoodScreen.js
    │   │   ├── CreateListingScreen.js
    │   │   ├── DonorHomeScreen.js
    │   │   ├── DonorProfileScreen.js       # Premium donor profile UI
    │   │   ├── DonorRequestsScreen.js
    │   │   ├── DriverDeliveriesScreen.js    # OTP-based pickup & delivery
    │   │   ├── DriverEditProfileScreen.js   # Driver profile editor
    │   │   ├── DriverHomeScreen.js
    │   │   ├── DriverProfileScreen.js       # Driver profile with vehicle info
    │   │   ├── EditProfileScreen.js         # Donor profile editor
    │   │   ├── ForgotPasswordScreen.js
    │   │   ├── ListingDetailScreen.js
    │   │   ├── LocationPickerScreen.js
    │   │   ├── LoginScreen.js
    │   │   ├── NGOBrowseScreen.js
    │   │   ├── NGODonorsScreen.js           # All donors list for NGOs
    │   │   ├── NGORequestsScreen.js
    │   │   ├── ProfileScreen.js             # Generic profile (NGO/Admin)
    │   │   └── RegisterScreen.js
    │   └── utils/
    │       ├── helpers.js           # Date formatting, distance calc
    │       ├── location.js          # Expo location utilities
    │       └── theme.js             # Colors, spacing, typography
    ├── App.js
    ├── app.json
    └── package.json
```

---

## ⚙️ Prerequisites

- **Node.js** >= 18
- **MongoDB** (local or Atlas)
- **Expo Go** app (SDK 53) on your phone

---

## 🚀 Backend Setup

```bash
cd FoodBridge/backend
npm install
```

### Configure `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/foodbridge
JWT_SECRET=foodbridge_super_secret_key_2024
JWT_EXPIRE=7d

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Start the backend:
```bash
npm run dev
```

---

## 📱 Mobile Setup

```bash
cd FoodBridge/mobile
npm install --legacy-peer-deps
```

### Set your machine's IP:
Edit `src/api/index.js` and set `BASE_URL` to your machine's local IP:
```javascript
export const BASE_URL = 'http://YOUR_IP:5000/api';
```

### Start Expo:
```bash
npx expo start --clear
```

Scan the QR code with Expo Go on your phone.

---

## 👥 User Roles

| Role   | Can Do |
|--------|--------|
| Donor  | Create food listings, approve/reject NGO requests, edit extended profile |
| NGO    | Browse food, request pickups, mark collected, view all donors with contact info |
| Driver | See approved deliveries, accept & deliver with OTP verification, edit vehicle/profile |
| Admin  | View all users and listings, manage accounts, see expired food |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile (all fields) |
| POST | `/api/auth/forgot-password` | Request password reset OTP |
| POST | `/api/auth/verify-otp` | Verify password reset OTP |
| POST | `/api/auth/reset-password` | Reset password |

### Listings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/listings` | Get available listings |
| GET | `/api/listings/expired` | Get expired listings |
| GET | `/api/listings/mine` | Get donor's listings |
| GET | `/api/listings/:id` | Get single listing |
| POST | `/api/listings` | Create listing |
| PUT | `/api/listings/:id` | Update listing |
| DELETE | `/api/listings/:id` | Delete listing |

### Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/requests/listing/:id` | NGO requests pickup |
| GET | `/api/requests/donor` | Donor's received requests |
| GET | `/api/requests/ngo` | NGO's sent requests |
| GET | `/api/requests/ngo/donors` | All donors list (for NGO) |
| PUT | `/api/requests/:id/approve` | Approve request |
| PUT | `/api/requests/:id/reject` | Reject request |
| PUT | `/api/requests/:id/collect` | Mark as collected |

### Driver
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/driver/deliveries` | Available deliveries |
| GET | `/api/driver/deliveries/mine` | Driver's deliveries |
| PUT | `/api/driver/deliveries/:id/accept` | Accept delivery |
| PUT | `/api/driver/deliveries/:id/status` | Update status |
| PUT | `/api/driver/location` | Update driver location |
| POST | `/api/driver/deliveries/:id/pickup-otp` | Request pickup OTP |
| POST | `/api/driver/deliveries/:id/verify-pickup-otp` | Verify pickup OTP |
| POST | `/api/driver/deliveries/:id/delivery-otp` | Request delivery OTP |
| POST | `/api/driver/deliveries/:id/verify-delivery-otp` | Verify delivery OTP |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/users` | All users |
| GET | `/api/admin/listings` | All listings |
| PUT | `/api/admin/users/:id/toggle` | Toggle user status |

---

## 🗄️ Database Models

### User
`name`, `email`, `password`, `role` (donor/ngo/driver/admin), `phone`, `address`, `organizationName`, `isActive`, `bio`, `city`, `contactPerson`, `donorType`, `businessName`, `typicalDonationTime`, `profilePhoto`, `vehicleType`, `vehicleNumber`, `isAvailable`, `currentLocation`, `preferences`, `stats`, `verificationStatus`

### Listing
`donor`, `title`, `description`, `foodType`, `quantity`, `servings`, `expiresAt`, `pickupAddress`, `pickupLocation`, `status`, `images`, `allergens`

### Request
`listing`, `ngo`, `donor`, `driver`, `message`, `status`, `driverStatus`, `pickupTime`, `ngoLocation`, `driverAcceptedAt`, `pickedUpAt`, `deliveredAt`, `pickupOTP`, `deliveryOTP`

---

## 📧 Email Notifications

| Event | Recipient | Content |
|-------|-----------|---------|
| Password Reset | User | Formal OTP email with branded HTML template |
| Pickup OTP | Donor | OTP + order details + driver info for pickup verification |
| Delivery OTP | NGO | OTP + order details + driver info for delivery verification |
| Pickup Confirmed | Donor | Thank-you email with donation summary & NGO details |
| Delivery Complete | Driver | Acknowledgement email with points earned |

### Points System (Driver)
| Servings | Points Awarded |
|----------|---------------|
| < 5 | 10 points |
| 5 - 10 | 20 points |
| 11 - 20 | 50 points |
| > 20 | 250 points |

---

## 🎨 App Screens

### Donor
- **Dashboard** — stats, listings, pending requests
- **Create Listing** — post food with map location picker
- **Pickup Requests** — approve/reject NGO requests
- **Profile** — premium settings-style profile with edit

### NGO
- **Browse Food** — filter available listings by type and distance
- **Listing Detail** — view details, pick location on map, request pickup
- **My Requests** — track status, see driver info
- **Donors** — view all donors with contact info

### Driver
- **Available Deliveries** — see all approved jobs, accept delivery
- **My Deliveries** — OTP-based status flow: accepted → heading → picked up → delivered
- **Profile** — vehicle info, availability toggle, edit profile

### Admin
- **Dashboard** — platform stats
- **Expired Food** — track expired listings
- **Users** — manage all accounts

---

## 🏆 Hackathon Demo Flow

1. Register as **Donor** → post food listing with map location
2. Register as **NGO** → browse, pick location on map, request pickup
3. Login as **Donor** → approve the request
4. Register as **Driver** → see the delivery → accept it
5. Driver → request pickup OTP → donor gets formal email → verify OTP
6. Driver → request delivery OTP → NGO gets formal email → verify OTP
7. Donor receives thank-you email, driver receives points email
8. Login as **Admin** → view all stats

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect to API | Check `BASE_URL` in `src/api/index.js` — use your machine's IP |
| MongoDB not connecting | Verify `MONGODB_URI` in `.env` |
| Expo issues | `npx expo start --clear` |
| JWT errors | Clear app data and re-login |
| OTP not received | Check email config in `.env` and server console logs |
| Email sending fails | Ensure Gmail App Password is correct (not regular password) |