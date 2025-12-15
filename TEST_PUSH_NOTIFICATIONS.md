# 🧪 HƯỚNG DẪN TEST PUSH NOTIFICATION

## ✅ Đã Implement

### Backend:

- ✅ FCM token field trong User model
- ✅ Push notification settings trong UserSettings
- ✅ Firebase push notification service
- ✅ Email reminder service
- ✅ Cron job chạy 9h sáng mỗi ngày
- ✅ Manual trigger endpoint: `POST /tasks/reminders/send`

### Mobile:

- ✅ FCM service setup
- ✅ Auto get FCM token sau login
- ✅ Gửi token lên backend
- ✅ Listen foreground/background/quit notifications
- ✅ Display notifications với notifee

---

## 📱 TEST NGAY BÂY GIỜ

### Bước 1: Chạy Backend

```bash
cd Backend
npm run start:dev
```

### Bước 2: Chạy Mobile App

```bash
cd MobileApp
npm run android
```

### Bước 3: Login vào app

- Đăng nhập với tài khoản của bạn
- App sẽ tự động get FCM token và gửi lên backend
- Check console log xem có "FCM token registered successfully"

### Bước 4: Tạo Test Task

1. Vào một project
2. Tạo task mới với:
   - **Task Name**: "Test Push Notification"
   - **Assigned To**: User của bạn
   - **Due Date**: Ngày MAI (ví dụ: 16/12/2025 nếu hôm nay là 15/12)
   - **Due Time**: Bất kỳ (vd: 2:00 PM)

### Bước 5: Manual Trigger (Test ngay không cần đợi 9h sáng)

**Option A: Dùng Postman**

```
POST http://localhost:3000/tasks/reminders/send
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
```

**Option B: Dùng cURL**

```bash
curl -X POST http://localhost:3000/tasks/reminders/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Bước 6: Kiểm tra kết quả

**Backend Console sẽ hiện:**

```
[TaskReminderScheduler] Starting task reminder job...
[TaskReminderScheduler] Found 1 tasks due tomorrow
[TaskReminderScheduler] Email sent to xxx@gmail.com for task "Test Push Notification"
[TaskReminderScheduler] Push notification sent to username for task "Test Push Notification"
[TaskReminderScheduler] In-app notification created for task "Test Push Notification"
[TaskReminderScheduler] Task reminder job completed successfully
```

**Mobile App sẽ:**

1. ✅ Hiển thị push notification trên thanh notification
2. ✅ Có âm thanh và vibration
3. ✅ Title: "⏰ Task sắp đến hạn"
4. ✅ Body: "Test Push Notification sẽ hết hạn vào ngày mai"

**Email:**

- Check email của user assigned
- Sẽ nhận email với subject "⏰ Nhắc nhở: Task "Test Push Notification" sắp đến hạn"

---

## 🌅 TEST LÚC 9H SÁNG MAI (16/12/2025)

### Chuẩn bị:

1. ✅ Giữ backend chạy qua đêm HOẶC
2. ✅ Start backend trước 9h sáng

### Tự động:

- ⏰ 9:00 AM: Cron job tự động chạy
- 📨 Gửi email + push notification cho tất cả tasks due ngày mai (17/12)
- 💾 Lưu in-app notification trong ProjectNotifications

### Kiểm tra:

```sql
-- Check notifications đã tạo
SELECT * FROM "ProjectNotifications"
WHERE "Title" = 'Task sắp đến hạn'
ORDER BY "CreatedAt" DESC;
```

---

## 🔧 Troubleshooting

### Không nhận được push notification?

**1. Check FCM token đã lưu chưa:**

```sql
SELECT "Username", "FCMToken" FROM "Users" WHERE "FCMToken" IS NOT NULL;
```

**2. Check backend logs:**

- Có log "FCM token registered successfully" không?
- Có log "Push notification sent successfully" không?

**3. Check mobile logs:**

```bash
npx react-native log-android
```

- Tìm "FCM Token:"
- Tìm "Foreground notification received:"

**4. Check notification permissions:**

- Android: Settings → Apps → Your App → Notifications → Enabled
- iOS: Settings → Your App → Notifications → Allow Notifications

### Email không gửi được?

**Check .env backend:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Not regular password!
```

**Gmail App Password:**

1. Google Account → Security → 2-Step Verification → App passwords
2. Tạo app password mới
3. Copy vào SMTP_PASS

---

## 📊 Expected Behavior

### Foreground (App đang mở):

- ✅ Notification xuất hiện trên đầu màn hình
- ✅ Có âm thanh
- ✅ Tap vào → Navigate to task (chưa implement đầy đủ)

### Background (App minimize):

- ✅ Notification trong notification tray
- ✅ Có badge icon
- ✅ Tap → Mở app và navigate to task

### Quit (App đã tắt):

- ✅ Notification trong notification tray
- ✅ Tap → Khởi động app và navigate to task

---

## 🎯 Test Cases

### Case 1: Single task due tomorrow

- ✅ 1 task assigned to you, due date = ngày mai
- ✅ Expect: 1 email + 1 push + 1 in-app notification

### Case 2: Multiple tasks due tomorrow

- ✅ 3 tasks assigned to you, cùng due date = ngày mai
- ✅ Expect: 3 emails + 3 push notifications (có thể gộp)

### Case 3: Task due today (not tomorrow)

- ❌ Task due hôm nay (15/12)
- ❌ Expect: KHÔNG gửi notification

### Case 4: Task due next week

- ❌ Task due tuần sau (22/12)
- ❌ Expect: KHÔNG gửi notification

### Case 5: Unassigned task

- ❌ Task không có assignedTo
- ❌ Expect: KHÔNG gửi notification

### Case 6: User disable notifications

```sql
-- Tắt email notifications
UPDATE "UserSettings" SET "NotifyByEmail" = false WHERE "UserID" = 1;

-- Tắt push notifications
UPDATE "UserSettings" SET "NotifyByPush" = false WHERE "UserID" = 1;
```

- ❌ Expect: KHÔNG gửi notification tương ứng

---

## 🚀 Next Steps (Chưa implement)

1. ❌ Navigate to task detail khi tap notification
2. ❌ Notification badge count
3. ❌ Mark notifications as read
4. ❌ UI để config notification preferences trong Settings
5. ❌ Multiple reminder times (3h trước, 1 ngày trước, v.v.)

---

## 📝 Notes

- Cron schedule: `'0 9 * * *'` = 9:00 AM mỗi ngày
- Timezone: `'Asia/Ho_Chi_Minh'` (GMT+7)
- Tasks được query: `endTime >= tomorrow AND endTime < dayAfterTomorrow`
- Chỉ gửi cho tasks có `assignedTo` không null

---

## ⚡ Quick Commands

```bash
# Restart backend
cd Backend
npm run start:dev

# View backend logs
# (already showing in terminal)

# Restart mobile app
cd MobileApp
npm run android

# View mobile logs
npx react-native log-android

# Manual trigger notifications
curl -X POST http://localhost:3000/tasks/reminders/send \
  -H "Authorization: Bearer YOUR_TOKEN"
```
