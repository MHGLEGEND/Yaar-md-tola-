# Yaar Mohammad Tola – Complete Setup Guide

## Project Structure

```
yaar-mohammad-tola/
├── backend/
│   ├── src/
│   │   ├── config/         # database.ts, redis.ts
│   │   ├── controllers/    # authController, familyController, etc.
│   │   ├── middleware/     # auth.ts, errorHandler.ts
│   │   ├── routes/         # auth, family, news, market, mosque, ...
│   │   ├── services/       # sms.ts, email.ts, notifications.ts
│   │   ├── utils/          # logger.ts, jwt.ts
│   │   ├── seed.ts         # Initial database data
│   │   └── index.ts        # App entry point
│   ├── prisma/
│   │   └── schema.prisma   # Full database schema
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js app router pages
│   │   │   ├── page.tsx          # Main app (dashboard)
│   │   │   ├── login/page.tsx    # OTP login
│   │   │   ├── setup-profile/    # Registration profile
│   │   │   ├── pending-approval/ # Approval waiting
│   │   │   └── admin/page.tsx    # Admin dashboard
│   │   ├── components/
│   │   │   ├── layout/     # Header, Sidebar, BottomNav
│   │   │   └── pages/      # HomePage, FamilyTreePage, NewsPage, ...
│   │   ├── lib/api.ts      # Axios API client
│   │   └── store/authStore.ts  # Zustand auth state
│   ├── public/manifest.json
│   ├── Dockerfile
│   └── package.json
├── nginx/nginx.conf
├── docker-compose.yml
└── SETUP.md
```

---

## 1. LOCAL DEVELOPMENT SETUP

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+
- Git

### Step 1: Clone and configure

```bash
git clone <your-repo-url> yaar-mohammad-tola
cd yaar-mohammad-tola
```

### Step 2: Backend setup

```bash
cd backend

# Install dependencies
npm install

# Copy and fill environment variables
cp .env.example .env
# Edit .env with your DB credentials, Twilio, SMTP, Firebase keys

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed initial data (family tree, mosque, market prices, etc.)
npm run db:seed

# Start development server
npm run dev
# API running at http://localhost:5000
```

### Step 3: Frontend setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_API_URL=http://localhost:5000

# Start development server
npm run dev
# App running at http://localhost:3000
```

### Step 4: Verify

Open http://localhost:3000
- Click "Mobile OTP" login
- In dev mode, OTP is logged to backend console
- First user created is auto-admin if email matches ADMIN_EMAIL in .env

---

## 2. DATABASE SETUP (Direct SQL)

If not using Prisma migrations, run this SQL directly:

```sql
-- Create database
CREATE DATABASE ymt_db;
\c ymt_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE "Role" AS ENUM ('ADMIN','TEACHER','FARMER','MUKHIYA','WARD_MEMBER',
  'PANCHAYAT_SAMITI_MEMBER','MADRASA_COMMITTEE','IMAM','MOZZIM','COMMON_RESIDENT','OTHER');

CREATE TYPE "Branch" AS ENUM ('ABU_SHEIKH','GUMANI_SHEIKH','KALIMUDDIN_HAJI',
  'HAJRAT_ALI','AFSAR_SHEIKH','JOHORDI_SHEIKH','ZHURU_SAMAD','UNASSIGNED');

CREATE TYPE "Gender" AS ENUM ('MALE','FEMALE','OTHER');
CREATE TYPE "RequestStatus" AS ENUM ('PENDING','APPROVED','REJECTED');
CREATE TYPE "NewsCategory" AS ENUM ('VILLAGE_NEWS','BIRTH_ANNOUNCEMENT','DEATH_ANNOUNCEMENT',
  'NIKAH_ANNOUNCEMENT','LOST_AND_FOUND','PANCHAYAT_NEWS','EMERGENCY_ALERT');
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN','IN_PROGRESS','RESOLVED','CLOSED');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash TEXT,
  role "Role" NOT NULL DEFAULT 'COMMON_RESIDENT',
  custom_role VARCHAR(100),
  branch "Branch" NOT NULL DEFAULT 'UNASSIGNED',
  family_member_id UUID,
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  profile_photo TEXT,
  fcm_token TEXT,
  preferred_lang VARCHAR(5) DEFAULT 'en',
  dark_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family members (self-referencing)
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  name_urdu VARCHAR(255),
  father_id UUID REFERENCES family_members(id),
  mother_id UUID REFERENCES family_members(id),
  spouse_id UUID REFERENCES family_members(id),
  branch "Branch" DEFAULT 'UNASSIGNED',
  generation INTEGER DEFAULT 1,
  gender "Gender" DEFAULT 'MALE',
  dob DATE,
  dod DATE,
  photo TEXT,
  profession VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  is_alive BOOLEAN DEFAULT true,
  graveyard_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_family_father ON family_members(father_id);
CREATE INDEX idx_family_branch ON family_members(branch);
CREATE INDEX idx_family_generation ON family_members(generation);
CREATE INDEX idx_family_name ON family_members(name);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_approved ON users(is_approved);
```

---

## 3. PRODUCTION DEPLOYMENT (Docker)

### Step 1: Server requirements
- Ubuntu 22.04 LTS
- 2 vCPU, 4GB RAM minimum (DigitalOcean/AWS/VPS)
- Docker + Docker Compose installed
- Domain name configured (optional, for SSL)

### Step 2: Install Docker on Ubuntu

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify
docker --version
docker compose version
```

### Step 3: Clone project on server

```bash
git clone <your-repo> /opt/ymt-app
cd /opt/ymt-app

# Create production .env
cat > .env << 'EOF'
POSTGRES_PASSWORD=YourStrongPassword123!
REDIS_PASSWORD=YourRedisPassword456!
JWT_SECRET=your-64-char-random-secret-here-change-this-now
FRONTEND_URL=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com

# Twilio (for SMS OTP)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password

# Firebase (optional - for push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
EOF
```

### Step 4: Deploy

```bash
cd /opt/ymt-app

# Build and start all services
docker compose up -d --build

# Check all containers are running
docker compose ps

# Watch logs
docker compose logs -f backend

# Run database migrations inside container
docker compose exec backend npx prisma migrate deploy

# Seed initial data
docker compose exec backend node dist/seed.js

# Check health
curl http://localhost:5000/health
curl http://localhost:3000
```

### Step 5: SSL with Let's Encrypt (production domain)

```bash
# Install Certbot
sudo apt install certbot -y

# Stop nginx temporarily
docker compose stop nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certs
sudo mkdir -p /opt/ymt-app/nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/ymt-app/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/ymt-app/nginx/ssl/

# Uncomment HTTPS redirect in nginx/nginx.conf, then restart
docker compose up -d nginx
```

### Step 6: Update nginx.conf for HTTPS

Add this server block to nginx.conf:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # ... (same location blocks as HTTP)
}
```

---

## 4. ANDROID APK BUILD (Capacitor)

### Step 1: Install required tools

```bash
# Install Android Studio
# Download from: https://developer.android.com/studio

# Install Java 17
sudo apt install openjdk-17-jdk -y

# Set JAVA_HOME
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools' >> ~/.bashrc
source ~/.bashrc
```

### Step 2: Add Capacitor to frontend

```bash
cd frontend

# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialize Capacitor
npx cap init "Yaar Mohammad Tola" "com.yaarmohammadtola.app" --web-dir=out

# Build Next.js for static export
# First update next.config.js to add: output: 'export'
npm run build

# Add Android platform
npx cap add android
```

### Step 3: Update capacitor.config.ts

```typescript
// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yaarmohammadtola.app',
  appName: 'Yaar Mohammad Tola',
  webDir: 'out',
  server: {
    // For production, use your deployed URL
    url: 'https://yourdomain.com',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1e1b4b',
      androidSplashResourceName: 'splash',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};
export default config;
```

### Step 4: Sync and open Android project

```bash
npx cap sync android
npx cap open android
# This opens Android Studio
```

### Step 5: Configure Android app

In Android Studio:
1. Open `android/app/src/main/AndroidManifest.xml`
2. Add permissions:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.VIBRATE" />
```

3. Update `android/app/build.gradle`:
```gradle
android {
    compileSdkVersion 34
    defaultConfig {
        applicationId "com.yaarmohammadtola.app"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

### Step 6: Add app icons

```bash
# Install icon generator
npm install -g @capacitor/assets

# Place your icon at resources/icon.png (1024x1024)
# Place splash at resources/splash.png (2732x2732)
mkdir -p android/app/src/main/res
npx capacitor-assets generate --android
```

### Step 7: Build debug APK

```bash
# From Android Studio: Build > Build Bundle(s)/APK(s) > Build APK(s)
# OR via command line:
cd android
./gradlew assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 8: Build release APK (for Play Store)

```bash
# Generate keystore (one time)
keytool -genkey -v -keystore ymt-release.keystore \
  -alias ymt-key -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Yaar Mohammad Tola, OU=App, O=YMT, L=Bihar, S=Bihar, C=IN"

# Add to android/app/build.gradle:
android {
    signingConfigs {
        release {
            storeFile file('../../ymt-release.keystore')
            storePassword 'your_keystore_password'
            keyAlias 'ymt-key'
            keyPassword 'your_key_password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

# Build release APK
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 5. ADMIN ACCOUNT SETUP

After deployment:

```bash
# The seed script creates:
# Email: admin@yaarmohammadtola.com
# Role: ADMIN
# Status: Approved

# To login as admin:
# 1. Go to /login
# 2. Choose Email OTP
# 3. Enter: admin@yaarmohammadtola.com
# 4. Check backend logs for OTP (dev) or email (production)
# 5. Once logged in, role=ADMIN → can access /admin panel
```

---

## 6. API ENDPOINTS REFERENCE

```
Authentication:
POST /api/auth/send-phone-otp      { phone }
POST /api/auth/verify-phone-otp    { phone, otp }
POST /api/auth/send-email-otp      { email }
POST /api/auth/verify-email-otp    { email, otp }
POST /api/auth/complete-profile    { userId, name, role, branch }
POST /api/auth/refresh-token       { refreshToken }

Family Tree:
GET  /api/family/tree              Full branching tree
GET  /api/family/member/:id        Member detail + ancestors
GET  /api/family/search?q=name     Search members
GET  /api/family/stats             Total counts
GET  /api/family/branch/:branch    Members by branch
POST /api/family/request           Request new member (auth)
GET  /api/family/requests          Pending requests (admin)
PATCH /api/family/requests/:id/review  Approve/reject (admin)
POST /api/family/member            Add directly (admin)
PUT  /api/family/member/:id        Update member (admin)

News:
GET  /api/news?category=&page=     Paginated news list
GET  /api/news/:id                 Single news
POST /api/news                     Create news (auth)
PUT  /api/news/:id                 Update (author/admin)
DELETE /api/news/:id               Delete (author/admin)

Market:
GET  /api/market                   All prices
GET  /api/market/trends?item=      Price trend data
POST /api/market/update            Update price (admin)

Mosque:
GET  /api/mosque                   All mosques + committees
GET  /api/mosque/announcements     Active announcements
GET  /api/mosque/:id/namaz         Today's namaz timings
POST /api/mosque/:id/namaz         Update timings (admin)

Governance:
GET  /api/governance/officials     All elected officials
POST /api/governance/complaints    Submit complaint (auth)
GET  /api/governance/complaints/mine  My complaints (auth)

Admin Panel:
GET  /api/admin/dashboard          Stats overview
GET  /api/admin/users/pending      Unapproved users
GET  /api/admin/users              All users (paginated)
PATCH /api/admin/users/:id/approve Approve/reject user
GET  /api/admin/analytics          Charts data
```

---

## 7. ENVIRONMENT VARIABLES CHECKLIST

### Required for basic functionality:
- ✅ DATABASE_URL
- ✅ REDIS_URL
- ✅ JWT_SECRET

### Required for OTP login:
- ✅ TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_PHONE_NUMBER (for SMS)
- ✅ SMTP_* variables (for email OTP)

### Optional but recommended:
- Firebase credentials (push notifications)
- Cloudinary credentials (image uploads)
- OpenWeather API key (weather widget)

---

## 8. MONITORING & MAINTENANCE

```bash
# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Database backup
docker compose exec postgres pg_dump -U ymt_user ymt_db > backup_$(date +%Y%m%d).sql

# Restore backup
docker compose exec -T postgres psql -U ymt_user ymt_db < backup_20240101.sql

# Update application
git pull
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy

# Scale backend (multiple instances)
docker compose up -d --scale backend=3

# View Prisma Studio (DB GUI)
docker compose exec backend npx prisma studio
```

---

## 9. SECURITY CHECKLIST

- [ ] Change JWT_SECRET to random 64+ char string
- [ ] Change default DB passwords
- [ ] Enable HTTPS / SSL in production
- [ ] Set CORS to your actual domain only
- [ ] Enable Redis authentication
- [ ] Review rate limits for your traffic
- [ ] Keep NODE_ENV=production in production
- [ ] Rotate Twilio/Firebase keys periodically
- [ ] Enable PostgreSQL connection pooling (PgBouncer) for 1M+ users
- [ ] Set up CloudFlare WAF in front of Nginx

---

## 10. SCALING TO 1M+ USERS

When user base grows:

```bash
# 1. Add PgBouncer for DB connection pooling
# 2. Use Redis Cluster for distributed caching
# 3. Move to managed DB (AWS RDS / Supabase)
# 4. Add CDN (CloudFlare) for static assets
# 5. Use horizontal scaling:
docker compose up -d --scale backend=5

# 6. Add database read replicas
# 7. Implement ElasticSearch for fast family search
# 8. Use S3/CloudFront for media storage
# 9. Add APM monitoring (Datadog / NewRelic)
```

---

## SUPPORT

For technical support or village data issues:
- Admin Email: admin@yaarmohammadtola.com
- GitHub Issues: <your-repo>/issues

**One family, many generations — preserving history, faith & unity.**
**یار محمد ٹولہ — Official Digital Platform**
