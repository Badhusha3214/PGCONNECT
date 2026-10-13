# PGCON — Node.js Backend

REST API built with **Express + MongoDB (Mongoose)** for the PGCON platform.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env and set your MONGO_URI and JWT_SECRET

# 3. Seed the database (optional but recommended)
npm run seed

# 4. Start development server
npm run dev

# 5. Start production server
npm start
```

Server runs at **http://localhost:5000**

---

## 📁 Project Structure

```
pgcon-backend/
├── src/
│   ├── index.js                  ← Entry point
│   ├── config/
│   │   └── seed.js               ← DB seeder
│   ├── models/
│   │   ├── user.model.js         ← User schema
│   │   ├── property.model.js     ← Property schema
│   │   └── booking.model.js      ← Booking + Inquiry schemas
│   ├── controllers/
│   │   ├── auth.controller.js    ← register, login, logout, me
│   │   ├── property.controller.js← CRUD + search
│   │   └── admin.controller.js   ← admin stats, bookings, inquiries
│   ├── middleware/
│   │   ├── auth.middleware.js    ← JWT protect, restrictTo, optionalAuth
│   │   ├── error.middleware.js   ← Global error handler + 404
│   │   └── upload.middleware.js  ← Multer image upload
│   └── routes/
│       ├── auth.routes.js
│       ├── property.routes.js
│       ├── user.routes.js
│       ├── booking.routes.js
│       ├── admin.routes.js
│       └── inquiry.routes.js
├── uploads/                      ← Uploaded images (gitignored)
├── .env.example
└── package.json
```

---

## 🔗 API Endpoints

### Auth  `/api/auth`
| Method | Endpoint           | Access | Description          |
|--------|--------------------|--------|----------------------|
| POST   | /register          | Public | Register new user    |
| POST   | /login             | Public | Login + get token    |
| POST   | /logout            | Public | Clear auth cookie    |
| GET    | /me                | 🔒 Any | Get current user     |
| PATCH  | /update-password   | 🔒 Any | Change password      |

### Properties  `/api/properties`
| Method | Endpoint           | Access        | Description                |
|--------|--------------------|---------------|----------------------------|
| GET    | /                  | Public        | Search & filter properties |
| GET    | /:id               | Public        | Get single property        |
| POST   | /                  | 🔒 Owner/Admin| Create listing             |
| PATCH  | /:id               | 🔒 Owner/Admin| Update listing             |
| DELETE | /:id               | 🔒 Owner/Admin| Delete listing             |
| GET    | /owner/mine        | 🔒 Owner      | Get my listings            |

### Users  `/api/users`
| Method | Endpoint           | Access | Description         |
|--------|--------------------|--------|---------------------|
| GET    | /profile           | 🔒 Any | Get profile         |
| PATCH  | /profile           | 🔒 Any | Update profile      |
| POST   | /save/:propertyId  | 🔒 Any | Toggle saved property|

### Bookings  `/api/bookings`
| Method | Endpoint  | Access         | Description              |
|--------|-----------|----------------|--------------------------|
| POST   | /         | 🔒 Student     | Create booking request   |
| GET    | /mine     | 🔒 Student     | My bookings              |
| GET    | /owner    | 🔒 Owner       | Bookings for my properties|

### Admin  `/api/admin`  (Admin only 🔒)
| Method | Endpoint                      | Description              |
|--------|-------------------------------|--------------------------|
| GET    | /stats                        | Platform overview stats  |
| GET    | /verification-queue           | Pending property list    |
| PATCH  | /properties/:id/verify        | Approve / reject listing |
| GET    | /users                        | All users with filter    |
| PATCH  | /users/:id/toggle             | Enable / disable user    |

### Inquiries  `/api/inquiries`
| Method | Endpoint  | Access         | Description             |
|--------|-----------|----------------|-------------------------|
| POST   | /         | Public         | Send inquiry            |
| GET    | /owner    | 🔒 Owner       | Inquiries for my props  |

---

## 🔍 Property Search Query Params

```
GET /api/properties?city=Bangalore&minPrice=10000&maxPrice=20000&gender=Boys&roomType=Double&amenities=Wi-Fi,Gym&search=skyline&sort=price_asc&page=1&limit=12
```

| Param      | Values                                    |
|------------|-------------------------------------------|
| `city`     | any string                                |
| `minPrice` | number                                    |
| `maxPrice` | number                                    |
| `gender`   | Boys / Girls / Co-ed                      |
| `roomType` | Single / Double / Triple                  |
| `amenities`| comma-separated list                      |
| `search`   | full-text search                          |
| `sort`     | price_asc / price_desc / rating / newest  |
| `page`     | number (default 1)                        |
| `limit`    | number (default 12)                       |

---

## 🔐 Authentication

All protected routes require a JWT passed either as:
- **Cookie** (auto-set on login, preferred)
- **Header**: `Authorization: Bearer <token>`

---

## 🌱 Seed Test Credentials

After running `npm run seed`:

| Role    | Email                   | Password    |
|---------|-------------------------|-------------|
| Admin   | admin@pgconnect.com     | Admin@123   |
| Owner   | rajesh@pgconnect.com    | Owner@123   |
| Student | aditya@university.edu   | Student@123 |