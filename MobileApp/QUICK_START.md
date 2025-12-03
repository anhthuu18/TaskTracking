# Quick Start Guide - Task Tracking System

## Installation

### 1. Install Dependencies
```bash
npm install @notifee/react-native
npm install react-native-safe-area-context
npm install @react-navigation/native
npm install react-native-vector-icons
```

### 2. Link Native Modules (if needed)
```bash
npx react-native link @notifee/react-native
```

### 3. Android Configuration

#### AndroidManifest.xml
Add permissions:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.VIBRATE" />
```

#### build.gradle
Ensure targetSdk is 36+:
```gradle
android {
    compileSdk 36
    targetSdk 36
}
```

## Usage

### 1. Start Timer
```typescript
// Navigate to TaskTrackingScreen
navigation.navigate('TaskTracking', {
  task: { id: 123, title: 'My Task' },
  timerConfig: { focus: 25, shortBreak: 5, longBreak: 15 }
});
```

### 2. Session Completion
- If user is on screen: Shows dialog
- If user is elsewhere: Shows notification
- Notification repeats every 7 seconds
- User taps notification → navigates → shows dialog

### 3. Notification Tap
- Automatically navigates to TaskTrackingScreen
- Shows session complete dialog
- User can confirm or cancel

### 4. Configure Pomodoro
Go to Personal Settings:
- Focus duration (default: 25 min)
- Short break duration (default: 5 min)
- Long break duration (default: 15 min)

### 5. Manage Notifications
Go to Personal Settings:
- View notification permission status
- Request permission if needed
- Open notification settings

## API Reference

### backgroundTimerService
```typescript
import { backgroundTimerService } from './services/backgroundTimerService';

// Initialize (called automatically by appStateService)
await backgroundTimerService.initialize();

// Subscribe to events
const unsubscribe = backgroundTimerService.subscribe((event, data) => {
  if (event === 'sessionCompleted') {
    console.log('Session completed:', data);
  }
});

// Cleanup
backgroundTimerService.destroy();
```

### notificationEventHandler
```typescript
import { notificationEventHandler } from './services/notificationEventHandler';

// Initialize (called automatically by appStateService)
await notificationEventHandler.initialize();

// Start recurring notification
await notificationEventHandler.startRecurringNotification(
  'Focus Complete!',
  'Time for a break',
  { taskId: '123', taskTitle: 'My Task' },
  7 // interval in seconds
);

// Stop recurring notification
await notificationEventHandler.stopRecurringNotification();

// Check pending notification
const pending = await notificationEventHandler.checkPendingNotification();

// Cleanup
notificationEventHandler.destroy();
```

### appStateService
```typescript
import { appStateService } from './services/appStateService';

// Initialize (called in App.tsx)
await appStateService.initialize();

// Subscribe to app state changes
const unsubscribe = appStateService.subscribe((state) => {
  console.log('App state:', state); // 'active', 'background', 'inactive'
});

// Get current state
const state = appStateService.getCurrentState();

// Cleanup
appStateService.destroy();
```

### activeTimer
```typescript
import { activeTimer } from './services/activeTimer';

// Load from storage
const state = await activeTimer.load();

// Get current state
const state = activeTimer.get();

// Set state
await activeTimer.set({
  taskId: 123,
  taskTitle: 'My Task',
  currentSessionIndex: 0,
  sessionType: 'focus',
  durationSec: 1500,
  isRunning: true,
  expectedEndTs: Date.now() + 1500000,
  remainingAtPause: null,
  backendSessionId: 456,
  scheduledNotificationId: 'notif-123',
  completionHandled: false
});

// Update state
await activeTimer.update({
  isRunning: false,
  expectedEndTs: null,
  remainingAtPause: 1200
});

// Clear state
await activeTimer.clear();

// Get remaining seconds
const remaining = activeTimer.getRemainingSeconds();

// Check if completed
const completed = activeTimer.hasSessionCompleted();

// Mark completion handled
await activeTimer.markCompletionHandled();

// Reset completion flag
await activeTimer.resetCompletionFlag();

// Subscribe to changes
const unsubscribe = activeTimer.subscribe((state) => {
  console.log('Timer state changed:', state);
});
```

### localNotification
```typescript
import { localNotification } from './services/localNotification';

// Initialize (called in App.tsx)
await localNotification.initialize();

// Request permission
const granted = await localNotification.requestPermission();

// Get permission status
const hasPermission = await localNotification.getPermissionStatus();

// Open notification settings
await localNotification.openSettings();

// Show notification immediately
const notificationId = await localNotification.showNow(
  'Title',
  'Body',
  {
    sound: 'default',
    vibration: true,
    importance: 'high',
    tag: 'session-complete',
    autoCancel: false,
    data: { taskId: '123' }
  }
);

// Schedule notification at specific time
const notificationId = await localNotification.scheduleAt(
  new Date(Date.now() + 5000), // 5 seconds from now
  'Title',
  'Body',
  { sound: 'default', vibration: true }
);

// Cancel notification
await localNotification.cancel(notificationId);

// Cancel all notifications
await localNotification.cancelAll();

// Get displayed notifications
const notifications = await localNotification.getDisplayedNotifications();
```

## Common Tasks

### Start a Pomodoro Session
```typescript
// In your task list screen
const startTracking = (task) => {
  navigation.navigate('TaskTracking', {
    task: task,
    showSessionCompleteDialog: false
  });
};
```

### Handle Session Completion
```typescript
// Automatically handled by TaskTrackingScreen
// If user is on screen: Shows dialog
// If user is elsewhere: Shows notification

// To manually show dialog:
Alert.alert(
  'Focus Complete!',
  'Time for a break?',
  [
    { text: 'Later', onPress: () => moveToNextSession(false) },
    { text: 'Start', onPress: () => moveToNextSession(true) }
  ]
);
```

### Check Timer Status
```typescript
const timerState = activeTimer.get();
if (timerState?.isRunning) {
  const remaining = activeTimer.getRemainingSeconds();
  console.log('Time remaining:', remaining, 'seconds');
}
```

### Request Notification Permission
```typescript
// In PersonalSettingsScreen
const requestPermission = async () => {
  const granted = await localNotification.requestPermission();
  if (granted) {
    showSuccess('Notifications enabled');
  } else {
    showError('Notifications disabled');
  }
};
```

## Troubleshooting

### Notifications not showing
1. Check permission status: `await localNotification.getPermissionStatus()`
2. Request permission: `await localNotification.requestPermission()`
3. Check device notification settings
4. Verify @notifee/react-native is installed

### Timer not accurate
1. Check that `expectedEndTs` is set correctly
2. Verify backgroundTimerService is initialized
3. Check AsyncStorage for timer state

### Session completion not triggering
1. Verify backgroundTimerService periodic check is running
2. Check that session time reaches 0
3. Verify notification event handler is initialized

### App crashes on notification
1. Check that @notifee/react-native is properly linked
2. Verify AndroidManifest.xml has POST_NOTIFICATIONS permission
3. Check logcat for errors

## Performance Tips

1. **Reduce Notification Frequency**: Change `RECURRING_NOTIFICATION_INTERVAL` if needed
2. **Optimize Background Check**: Default 1 second is optimal
3. **Monitor Memory**: Check AsyncStorage usage
4. **Battery**: App state listener has minimal battery impact

## Security Considerations

1. Validate task ID before creating session
2. Verify user owns task before tracking
3. Don't expose sensitive data in notification
4. Use HTTPS for backend API calls
5. Validate notification data on tap

## Debugging

### Enable Verbose Logging
All services log to console with `[ServiceName]` prefix:
```
[BackgroundTimerService] Session completed
[NotificationEventHandler] Notification tapped
[TaskTrackingScreen] App state changed: background -> active
```

### Check AsyncStorage
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get timer state
const timerState = await AsyncStorage.getItem('activeTimer');
console.log('Timer state:', JSON.parse(timerState));

// Get notification state
const notificationState = await AsyncStorage.getItem('notificationState');
console.log('Notification state:', JSON.parse(notificationState));

// Get background timer state
const bgState = await AsyncStorage.getItem('backgroundTimerState');
console.log('Background state:', JSON.parse(bgState));
```

### Monitor App State
```typescript
import { AppState } from 'react-native';

AppState.addEventListener('change', (state) => {
  console.log('App state:', state);
});
```

## Version History

### v1.0.0 (Current)
- Background timer support
- Recurring notifications
- Session auto-transition
- Notification tap handling
- Screen lifecycle detection
- State persistence


