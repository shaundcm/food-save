# 🌱 FoodSave — Food Waste Management System

> **23XT68 Software Patterns Lab Project**  
> Deishaun Collins (23PT05) & Devanand K (23PT06)

A full-stack platform that connects food donors (restaurants, households) with recipients (NGOs, shelters) to reduce food waste through smart matching and real-time notifications.

---

## 📋 Submission Checklist

| Requirement | Status | Details |
|---|---|---|
| Problem Statement | ✅ | Below |
| Class / Component Diagram | ✅ | `/docs/diagrams/` |
| Design Patterns | ✅ | Strategy, Observer, Factory |
| Design Principles | ✅ | SRP, OCP, DIP |
| Architectural Pattern | ✅ | Layered (MVC + Service Layer) |
| Refactoring | ✅ | See Refactoring section |
| SonarCloud Analysis | ✅ | `sonar-project.properties` |

---

## 🎯 Problem Statement

Restaurants and households generate millions of tons of food waste daily while nearby NGOs and shelters face food insecurity. The gap exists because:
- No standardised way to list and discover surplus food
- No smart matching between donors and the most suitable recipients
- No real-time notifications when food becomes available

**FoodSave** solves this by providing a platform where donors post surplus food listings, recipients claim them through a smart matching algorithm, and the whole pipeline is tracked from donation to pickup.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    PRESENTATION                      │
│          React + TypeScript + TailwindCSS            │
├─────────────────────────────────────────────────────┤
│                    CONTROLLER                        │
│              GraphQL Resolvers (Apollo)              │
├─────────────────────────────────────────────────────┤
│                    SERVICE LAYER                     │
│        MatchingEngine │ EventBus │ UserFactory       │
├─────────────────────────────────────────────────────┤
│                   REPOSITORY                         │
│              Prisma ORM (PostgreSQL)                 │
├─────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE                      │
│         PostgreSQL │ Redis │ Prometheus              │
└─────────────────────────────────────────────────────┘
```

---

## 🎨 Design Patterns

### 1. Strategy Pattern — `backend/src/patterns/MatchingStrategy.ts`

**Intent:** Define a family of matching algorithms, encapsulate each one, and make them interchangeable at runtime.

```
MatchingStrategy (interface)
    ├── ProximityMatchingStrategy   → sorts by haversine distance
    ├── UrgencyMatchingStrategy     → sorts by time-to-expiry
    ├── QuantityMatchingStrategy    → sorts by available quantity
    └── CompositeMatchingStrategy   → weighted score (urgency 40% + proximity 40% + qty 20%)

MatchingEngine (context)
    └── setStrategy(strategy) → plugs in any strategy at runtime
```

**How it's used:** When a recipient browses listings, they can select a strategy (`?strategy=proximity`). The `MatchingEngine` swaps the algorithm without changing the resolver logic.

### 2. Observer Pattern — `backend/src/patterns/ObserverPattern.ts`

**Intent:** Define a one-to-many dependency so when a Subject changes state, all Observers are notified automatically.

```
FoodEventBus (Subject / Singleton)
    ├── subscribe(observer)
    ├── unsubscribe(observerId)
    └── notify(payload) → calls update() on all observers

FoodEventObserver (interface)
    ├── DatabaseNotificationObserver → persists notifications to DB
    └── LoggingObserver             → logs all events
```

**How it's used:** When a donor creates a listing, `FoodEventBus.notify({ eventType: 'LISTING_CREATED', ... })` fires. All registered observers respond — the database observer inserts notification rows for every recipient, the logging observer writes an audit log.

### 3. Factory Pattern — `backend/src/patterns/FactoryPattern.ts`

**Intent:** Define an interface for creating objects, letting subclasses decide which class to instantiate.

```
UserCreator (abstract)
    ├── DonorUserCreator     → requires organization + address, validates them
    ├── RecipientUserCreator → requires address
    └── AdminUserCreator     → minimal validation

UserFactory
    └── create(role, dto) → delegates to the right creator
```

**How it's used:** The `register` mutation calls `UserFactory.create(role, dto)`. The factory picks the role-specific creator, which validates the input and returns a ready-to-insert payload with the hashed password.

---

## 📐 Design Principles

| Principle | Where Applied |
|---|---|
| **SRP** | Each service file does one thing: auth, listings, matching, notifications |
| **OCP** | New matching strategies added without modifying `MatchingEngine` |
| **DIP** | Resolvers depend on `MatchingStrategy` interface, not concrete classes |
| **ISP** | `FoodEventObserver` interface is minimal — just `observerId` + `update()` |

---

## ♻️ Refactoring Notes

**Before refactoring:** The `createListing` resolver was a fat function containing matching logic, notification dispatch, and cache invalidation inline.

**After refactoring:**
- Matching logic → extracted to `MatchingEngine` (Strategy Pattern)
- Notification dispatch → extracted to `FoodEventBus` (Observer Pattern)
- User creation logic → extracted to `UserFactory` (Factory Pattern)
- Cache operations → extracted to `config/redis.ts` utilities

Run SonarCloud before and after to see the improvement in cognitive complexity scores.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker + Docker Compose
- Git

### Option A — Docker (recommended, one command)

```bash
git clone <repo-url>
cd food-waste-mgmt

# Copy env file
cp backend/.env.example backend/.env

# Start everything
docker-compose up --build

# In a new terminal, seed the database
docker exec foodsave-backend npx ts-node src/prisma/seed.ts
```

Services:
- **Frontend:**   http://localhost:3000
- **GraphQL:**    http://localhost:4000/graphql
- **Grafana:**    http://localhost:3001  (admin / admin)
- **Prometheus:** http://localhost:9090

### Option B — Local Development

```bash
# 1. Start infrastructure only
docker-compose up postgres redis -d

# 2. Backend
cd backend
cp ../.env.example .env      # edit DATABASE_URL etc.
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
npm run dev                  # → http://localhost:4000/graphql

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev                  # → http://localhost:3000
```

---

## 🔑 Demo Accounts

All accounts use password: **`password123`**

| Role | Email |
|---|---|
| Admin | admin@foodsave.com |
| Donor | restaurant@example.com |
| Donor | bakery@example.com |
| Recipient | ngo@example.com |
| Recipient | shelter@example.com |

---

## 📁 Project Structure

```
food-waste-mgmt/
├── backend/
│   ├── src/
│   │   ├── patterns/
│   │   │   ├── MatchingStrategy.ts   ← Strategy Pattern ⭐
│   │   │   ├── ObserverPattern.ts    ← Observer Pattern ⭐
│   │   │   └── FactoryPattern.ts     ← Factory Pattern  ⭐
│   │   ├── graphql/
│   │   │   ├── typeDefs.ts
│   │   │   └── resolvers.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── logger.ts
│   │   ├── middleware/
│   │   │   └── auth.ts               ← JWT + RBAC
│   │   ├── prisma/
│   │   │   └── seed.ts
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── Dockerfile
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── AuthPage.tsx
│       │   ├── DashboardPage.tsx     ← Role-adaptive
│       │   ├── BrowsePage.tsx        ← Strategy selector
│       │   ├── CreateListingPage.tsx
│       │   ├── MyListingsPage.tsx
│       │   ├── MyClaimsPage.tsx
│       │   ├── NotificationsPage.tsx
│       │   ├── AdminUsersPage.tsx
│       │   ├── AdminListingsPage.tsx
│       │   └── AdminAnalyticsPage.tsx
│       ├── components/shared/
│       │   ├── UI.tsx
│       │   ├── Sidebar.tsx
│       │   ├── ListingCard.tsx
│       │   └── Layouts.tsx
│       ├── context/AuthContext.tsx
│       └── lib/
│           ├── apollo.ts
│           ├── queries.ts
│           └── types.ts
│
├── docker/
│   ├── prometheus.yml
│   └── grafana-datasource.yml
│
├── .github/workflows/ci-cd.yml       ← GitHub Actions
├── docker-compose.yml
├── sonar-project.properties          ← SonarCloud config
└── README.md
```

---

## 🔐 Security

- **JWT** authentication with 7-day expiry
- **RBAC** — role-based access control on every resolver
- **bcrypt** password hashing (12 rounds in production)
- **Zod** input validation on all mutations
- **HTTPS** via nginx reverse proxy in production
- **Non-root** Docker container user

---

## 📊 Monitoring

- **Prometheus** scrapes `/metrics` from the backend every 10s
- **Grafana** dashboards at `localhost:3001` (default: admin/admin)
- Tracks: HTTP request count, request duration, Node.js heap usage, event loop lag

---

## 🧪 SonarCloud Setup

1. Push repo to GitHub
2. Go to [sonarcloud.io](https://sonarcloud.io) → import project
3. Add `SONAR_TOKEN` to GitHub repo secrets
4. CI/CD pipeline runs analysis on every push to `main`
5. Take screenshot before refactoring (fat resolvers), then after

---

## 📄 License

MIT — for academic submission 23XT68, Term 2025.
