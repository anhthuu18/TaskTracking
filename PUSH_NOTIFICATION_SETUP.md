# Push Notification Setup Guide

## Overview

This guide will help you set up Firebase Cloud Messaging (FCM) for push notifications in the mobile app.

## Current Status

✅ **Backend**: Fully implemented with Firebase Admin SDK
✅ **Mobile App**: FCM client code ready but temporarily disabled
✅ **Database**: FCM token storage configured
✅ **Email Notifications**: Working ✓
✅ **In-App Notifications**: Working ✓
❌ **Push Notifications**: Need Firebase configuration

---

## Prerequisites

- Firebase project created (https://console.firebase.google.com)
- Android Studio installed
- Node.js and npm installed

---

## Step 1: Firebase Console Setup

### 1.1 Create/Access Firebase Project

1. Go to https://console.firebase.google.com
2. Select your existing project or create a new one
3. Click on **Project Settings** (gear icon)

### 1.2 Get Service Account Key (Backend)

1. In Project Settings → **Service accounts** tab
2. Click **Generate new private key**
3. Save the JSON file as `firebase-service-account.json`
4. Place it in `Backend/` directory
5. Add to `.gitignore`: `firebase-service-account.json`

### 1.3 Add Android App

1. In Project Settings → **General** tab
2. Click **Add app** → Select **Android**
3. Android package name: `com.aitasktrackingmobile` (check `android/app/build.gradle`)
4. Download `google-services.json`

---

## Step 2: Android Configuration

### 2.1 Add google-services.json

1. Copy `google-services.json` to `MobileApp/android/app/`
2. Verify the file structure:

```
MobileApp/
  android/
    app/
      google-services.json  ← Here
      build.gradle
```

### 2.2 Verify Gradle Configuration

Check `android/build.gradle` has:

```gradle
buildscript {
  dependencies {
    classpath 'com.google.gms:google-services:4.4.0'
  }
}
```

Check `android/app/build.gradle` has:

```gradle
apply plugin: 'com.google.gms.google-services'
```

### 2.3 Rebuild Android App

```bash
cd MobileApp/android
./gradlew clean
cd ..
```

---

## Step 3: Backend Configuration

### 3.1 Verify Firebase Service Setup

File: `Backend/src/services/firebase.service.ts`

- Already configured with Admin SDK ✓
- Sends notifications to FCM tokens ✓

### 3.2 Environment Variables (Optional)

Add to `Backend/.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

---

## Step 4: Mobile App - Uncomment FCM Code

### 4.1 SignInScreen.tsx

File: `MobileApp/src/screens/SignInScreen.tsx`

**Find lines 100-116** (currently commented):

```typescript
// import fcmService from '../services/fcmService';
// import userService from '../services/userService';

// ... after successful login ...
// try {
//   const fcmToken = await fcmService.getFCMToken();
//   if (fcmToken) {
//     await userService.updateFCMToken(user.id, fcmToken);
//   }
// } catch (error) {
//   console.log('FCM setup error:', error);
// }
```

**Uncomment these lines** after verifying Firebase is configured.

### 4.2 AppNavigator.tsx

File: `MobileApp/src/navigation/AppNavigator.tsx`

**Find lines 164-172** (currently commented):

```typescript
// import fcmService from '../services/fcmService';

// useEffect(() => {
//   fcmService.setupNotificationListeners((notification) => {
//     // Handle notification tap
//     console.log('Notification tapped:', notification);
//   });
// }, []);
```

**Uncomment these lines** after verifying Firebase is configured.

---

## Step 5: Test Push Notifications

### 5.1 Test FCM Token Registration

1. Uncomment the FCM code in Step 4
2. Rebuild and run the app:

```bash
cd MobileApp
npx react-native run-android
```

3. Check logs for FCM token:

```bash
npx react-native log-android | grep "FCM"
```

You should see:

```
FCM Token: eyJ0eXAiOiJKV1QiLCJhbGc...
```

### 5.2 Verify Token in Database

Check if FCM token is saved:

```sql
SELECT id, username, fcmToken
FROM "User"
WHERE fcmToken IS NOT NULL;
```

### 5.3 Trigger Test Notification

**Option 1: Wait for scheduler**

- Cron runs every 2 minutes (currently for testing)
- Create a task with due date = tomorrow
- Wait for notification

**Option 2: Manual trigger (Postman)**

```http
POST http://localhost:3000/tasks/reminders/send
Authorization: Bearer YOUR_JWT_TOKEN
```

### 5.4 Verify Notification Received

- Check mobile device notification tray
- Should see: "Task Reminder: [Task Name]"
- Tap notification → should open app

---

## Step 6: Production Configuration

### 6.1 Change Cron Schedule

File: `Backend/src/services/task-reminder.scheduler.ts`

**Current (Testing):**

```typescript
@Cron('*/2 * * * *') // Every 2 minutes
```

**Production (9 AM daily):**

```typescript
@Cron('0 9 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
```

**Or 10 PM daily:**

```typescript
@Cron('0 22 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
```

### 6.2 User Preferences

Users can control notifications via:

- `UserSettings.notifyByEmail` (default: true)
- `UserSettings.notifyByPush` (default: true)
- Update via user settings screen

---

## Troubleshooting

### Issue: "Module not found: @react-native-firebase/messaging"

**Solution:**

```bash
cd MobileApp
npm install @react-native-firebase/app @react-native-firebase/messaging
npx react-native link
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Issue: "Default FirebaseApp is not initialized"

**Solution:**

- Verify `google-services.json` is in `android/app/`
- Verify `apply plugin: 'com.google.gms.google-services'` in `android/app/build.gradle`
- Clean and rebuild:

```bash
cd android
./gradlew clean
cd ..
```

### Issue: FCM token not registered

**Solution:**

- Check notification permissions granted on device
- Check logs: `npx react-native log-android | grep "FCM"`
- Verify `fcmService.ts` is properly imported

### Issue: Notifications not received

**Solution:**

1. Check FCM token in database is up-to-date
2. Verify backend Firebase service account is valid
3. Check backend logs for FCM send errors
4. Test with Firebase Console → Cloud Messaging → Send test message

### Issue: Bell notification count stuck at 1

**Solution:**

- Fixed! Backend now filters by `isRead: false`
- Mobile app refreshes count on screen focus
- Restart backend to apply changes

---

## Architecture Summary

### Notification Flow:

```
┌─────────────────────────────────────────────────────┐
│ 1. Scheduler checks tasks (every 2 min / 9 AM)     │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ 2. Find tasks with endTime = tomorrow               │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ 3. Check user notification preferences              │
└─────────────────┬───────────────────────────────────┘
                  │
       ┌──────────┴──────────┬──────────────┐
       ▼                     ▼              ▼
┌────────────┐      ┌─────────────┐   ┌──────────┐
│ Email      │      │ Push (FCM)  │   │ In-App   │
│ Service    │      │ Service     │   │ DB       │
└────────────┘      └─────────────┘   └──────────┘
```

### Database Schema:

```sql
-- User table
fcmToken VARCHAR(500) NULL

-- UserSettings table
notifyByEmail BOOLEAN DEFAULT true
notifyByPush BOOLEAN DEFAULT true

-- ProjectNotification table
id SERIAL PRIMARY KEY
projectId INT
receiverUserId INT
title TEXT
message TEXT
isRead BOOLEAN DEFAULT false
createdAt TIMESTAMP
```

---

## API Endpoints

### Notification Endpoints:

```
GET    /notification                    - Get all unread notifications
POST   /notification/accept/:id         - Accept workspace invitation
POST   /notification/decline/:id        - Decline workspace invitation
POST   /notification/mark-read/:id      - Mark notification as read
POST   /notification/mark-all-read      - Mark all as read
```

### User Endpoints:

```
PUT    /users/:id/fcm-token            - Update FCM token
Body: { "fcmToken": "eyJ0eXAiOiJ..." }
```

### Task Endpoints:

```
POST   /tasks/reminders/send           - Manual trigger (testing only)
```

---

## Next Steps

1. ✅ Fix bell notification count (DONE)
2. 🔄 Complete Firebase setup following this guide
3. 🔄 Test push notifications end-to-end
4. 🔄 Change cron to production schedule
5. 🔄 Add notification settings UI in mobile app
6. 🔄 Test on physical device (not just emulator)

---

## Security Notes

⚠️ **IMPORTANT:**

- Never commit `firebase-service-account.json` to git
- Never commit `google-services.json` with real credentials to public repos
- Add both files to `.gitignore`
- Use environment variables for production
- Rotate FCM tokens periodically for security

---

## Support

If you encounter issues:

1. Check Firebase Console → Cloud Messaging → Usage & billing
2. Verify server key in Firebase Console
3. Check backend logs: `npm run start:dev` in Backend directory
4. Check mobile logs: `npx react-native log-android`
5. Test with Firebase Console test message first

---

**Last Updated:** December 2024
**Backend Version:** NestJS 10.0
**Mobile Version:** React Native 0.81.0
**Firebase Admin SDK:** 13.5.0
