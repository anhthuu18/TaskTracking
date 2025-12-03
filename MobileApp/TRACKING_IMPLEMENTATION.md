# Task Tracking Implementation Guide

## Overview
This document describes the complete implementation of the Pomodoro task tracking system with background timer support, recurring notifications, and proper session management.

## Architecture

### New Services Created

#### 1. **backgroundTimerService.ts**
Handles timer continuation when app is in background.

**Key Features:**
- Monitors app state changes (active/background/inactive)
- Persists timer state to AsyncStorage
- Checks for session completion periodically (every 1 second)
- Triggers notifications when session completes in background
- Emits events for listeners to react to session completion

**Key Methods:**
- `initialize()` - Setup AppState listener and periodic check
- `handleAppStateChange()` - React to app state changes
- `checkSessionCompletion()` - Verify if session completed while app was backgrounded
- `handleSessionCompletion()` - Trigger notification and emit events
- `subscribe()` - Listen to background timer events

**Flow:**
1. App goes to background → persist timer state
2. Periodic check runs every 1 second
3. When session time reaches 0 → trigger notification
4. App comes to foreground → hydrate timer with correct remaining time

#### 2. **notificationEventHandler.ts**
Manages all notification interactions and recurring notifications.

**Key Features:**
- Setup foreground and background notification event listeners
- Handle notification tap/dismiss events
- Navigate to TaskTrackingScreen when notification is tapped
- Show session complete dialog automatically
- Implement recurring notifications (every 5-10 seconds)
- Persist pending notification state for app restart recovery

**Key Methods:**
- `initialize()` - Setup all event listeners
- `setupForegroundHandler()` - Handle notifications when app is active
- `setupBackgroundHandler()` - Handle notifications when app is closed
- `handleNotificationTap()` - Navigate and show dialog
- `startRecurringNotification()` - Send notification repeatedly
- `stopRecurringNotification()` - Stop recurring notifications
- `checkPendingNotification()` - Check if there's pending notification to handle

**Flow:**
1. Session completes → start recurring notification
2. Notification sent every 7 seconds
3. User taps notification → stop recurring, navigate, show dialog
4. User confirms → move to next session

#### 3. **appStateService.ts**
Coordinates between background timer and notification handler.

**Key Features:**
- Initialize all services on app startup
- Coordinate app state changes across services
- Handle foreground/background transitions
- Cleanup on app destroy

**Key Methods:**
- `initialize()` - Setup all services
- `handleForeground()` - React to app coming to foreground
- `handleBackground()` - React to app going to background
- `subscribe()` - Listen to app state changes
- `destroy()` - Cleanup resources

### Modified Services

#### 1. **activeTimer.ts**
Enhanced with better state management and completion tracking.

**New Features:**
- `getRemainingSeconds()` - Calculate remaining time based on expectedEndTs
- `hasSessionCompleted()` - Check if session should have completed
- `markCompletionHandled()` - Mark completion as processed
- `resetCompletionFlag()` - Reset for next session
- Better logging and error handling

**Why:**
- Prevents duplicate session completion handling
- Accurate time calculation across app background/foreground
- Better state tracking

#### 2. **localNotification.ts**
Enhanced with better Android support and data payload handling.

**New Features:**
- `initialize()` - Request permission and create channel on startup
- `NotificationOptions` interface for flexible notification config
- Support for high priority, bypass DND, heads-up notifications
- Better error handling and fallbacks
- Data payload support for notification tap handling

**Android-Specific:**
- Channel creation with HIGH importance
- Bypass Do Not Disturb (bypassDnd: true)
- Heads-up notification support
- Full screen action for critical notifications

#### 3. **TaskTrackingScreen.tsx**
Major refactoring for background support and proper lifecycle management.

**New Features:**
- `useFocusEffect` hook to detect screen focus/blur
- AppState listener for background/foreground transitions
- Proper timer cleanup on screen blur
- Screen-aware session completion (dialog vs notification)
- Hydration from activeTimer on screen focus
- Support for `showSessionCompleteDialog` route param
- Better ref management to prevent race conditions

**Key Changes:**
```typescript
// Screen focus detection
useFocusEffect(
  React.useCallback(() => {
    setIsScreenFocused(true);
    // Handle pending session complete dialog
    if (showSessionCompleteDialog) {
      handleShowSessionCompleteDialog();
    }
    return () => setIsScreenFocused(false);
  }, [showSessionCompleteDialog])
);

// App state listener
useEffect(() => {
  const subscription = AppState.addEventListener('change', handleAppStateChange);
  return () => subscription.remove();
}, [isRunning, timeRemaining, currentIdx]);

// Timer only ticks when screen focused
useEffect(() => {
  if (isRunning && timeRemaining > 0 && isScreenFocused) {
    // Start interval
  }
}, [isRunning, timeRemaining, isScreenFocused]);

// Session completion logic
if (isScreenFocused) {
  handleShowSessionCompleteDialog(); // Show dialog
} else {
  showSessionCompletionNotification(); // Show notification
}
```

#### 4. **App.tsx**
Initialize services on app startup.

**Changes:**
```typescript
useEffect(() => {
  const initializeServices = async () => {
    // Initialize local notification service
    await localNotification.initialize();
    
    // Initialize app state service (includes background timer and notification handler)
    await appStateService.initialize();
  };
  
  initializeServices();
  
  return () => {
    appStateService.destroy();
  };
}, []);
```

#### 5. **PersonalSettingsScreen.tsx**
Added notification permission management.

**New Features:**
- Display notification permission status
- Button to request notification permission
- Button to open notification settings
- Visual indicator for permission status

## Flow Diagrams

### Session Completion Flow

```
Session Time = 0
    ↓
[Background Timer Service checks]
    ↓
Is App Active?
├─ YES → Show Dialog (TaskTrackingScreen)
│         ├─ User clicks "Start" → moveToNextSession(true)
│         └─ User clicks "Later" → moveToNextSession(false)
│
└─ NO → Start Recurring Notification
        ├─ Send notification every 7 seconds
        ├─ User taps notification
        │   ├─ Stop recurring
        │   ├─ Navigate to TaskTrackingScreen
        │   └─ Show dialog on screen focus
        └─ User confirms → moveToNextSession(true)
```

### App Background/Foreground Flow

```
App Active
    ↓
[User leaves app or screen locks]
    ↓
App State → Background
    ├─ Persist timer state to AsyncStorage
    ├─ Background timer service continues checking
    └─ If session completes → Show notification
    
[User returns to app]
    ↓
App State → Active
    ├─ TaskTrackingScreen hydrates timer state
    ├─ Recalculate remaining time from expectedEndTs
    └─ If session completed → Show dialog
```

### Notification Tap Flow

```
User taps notification
    ↓
Is App Active?
├─ YES → Foreground handler
│         ├─ Stop recurring notification
│         ├─ Navigate to TaskTrackingScreen
│         └─ Show dialog on screen focus
│
└─ NO → Background handler
        ├─ Save pending notification state
        ├─ When app opens → Load pending state
        └─ Navigate and show dialog
```

## Key Implementation Details

### 1. Timer Accuracy
- Uses `expectedEndTs` (epoch milliseconds) to track session end time
- Calculates remaining time as: `Math.max(0, (expectedEndTs - Date.now()) / 1000)`
- Handles app background/foreground transitions without losing accuracy
- No reliance on setInterval for long-term timing

### 2. Notification Recurring
- Sends notification immediately when session completes
- Repeats every 7 seconds (configurable via `RECURRING_NOTIFICATION_INTERVAL`)
- Stops when user taps notification
- Persists state so notifications resume if app crashes

### 3. Session Completion Handling
- Only shows dialog if user is on TaskTrackingScreen
- Shows notification if user is elsewhere
- Prevents duplicate handling with `completionHandled` flag
- Clears flag when moving to next session

### 4. Screen Lifecycle
- Uses `useFocusEffect` to detect when screen is focused
- Only runs timer tick when screen is focused
- Hydrates timer state when screen comes to focus
- Stops recurring notification when user taps it

### 5. State Persistence
- All timer state persisted to AsyncStorage
- Notification state persisted separately
- Background timer state persisted
- Survives app restart and crash

## Testing Checklist

### Basic Timer
- [ ] Start focus session
- [ ] Timer counts down correctly
- [ ] Pause/resume works
- [ ] Reset works

### Background Behavior
- [ ] Start timer, press home button
- [ ] Timer continues in background
- [ ] Return to app, time is accurate
- [ ] Session completes in background

### Notifications
- [ ] Notification shows when session completes
- [ ] Notification shows sound + vibration
- [ ] Notification repeats every 7 seconds
- [ ] Notification stops when user taps it

### Navigation
- [ ] Tap notification navigates to TaskTrackingScreen
- [ ] Dialog shows automatically
- [ ] Confirm moves to next session
- [ ] Cancel keeps same session

### Edge Cases
- [ ] App crash during timer
- [ ] App restart during session
- [ ] Multiple sessions in background
- [ ] Notification tap while app is closed
- [ ] Permission denied for notifications

## Configuration

### Recurring Notification Interval
Edit `TaskTrackingScreen.tsx`:
```typescript
const RECURRING_NOTIFICATION_INTERVAL = 7; // seconds
```

### Pomodoro Durations
Edit `PersonalSettingsScreen.tsx` or via app settings:
- Focus: 25 minutes (default)
- Short Break: 5 minutes (default)
- Long Break: 15 minutes (default)

### Notification Channel (Android)
Edit `localNotification.ts`:
```typescript
await notifee.createChannel({
  id: 'pomodoro',
  name: 'Pomodoro Alerts',
  sound: 'default',
  importance: 4, // HIGH
  vibration: true,
  bypassDnd: true, // Bypass Do Not Disturb
});
```

## Troubleshooting

### Notifications not showing
1. Check notification permission in PersonalSettingsScreen
2. Verify Android channel is created
3. Check device notification settings
4. Ensure @notifee/react-native is installed

### Timer not accurate after background
1. Check that expectedEndTs is being set correctly
2. Verify backgroundTimerService is initialized
3. Check AsyncStorage for timer state persistence

### Session completion not triggering
1. Verify backgroundTimerService periodic check is running
2. Check that session time is actually reaching 0
3. Verify notification event handler is initialized

### Notification not stopping on tap
1. Check that notificationEventHandler is initialized
2. Verify foreground/background event listeners are setup
3. Check that stopRecurringNotification is being called

## Performance Considerations

1. **Background Timer Check**: Runs every 1 second, minimal CPU impact
2. **Recurring Notifications**: Sent every 7 seconds, can be adjusted
3. **Memory**: All state stored in memory + AsyncStorage, minimal footprint
4. **Battery**: Uses native AppState listener, not custom polling

## Future Enhancements

1. Add sound customization
2. Add vibration pattern customization
3. Add notification sound selection
4. Add background task for more reliable background timing
5. Add analytics tracking
6. Add user preferences for notification frequency


