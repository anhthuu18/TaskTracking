# Members Tab - Testing Guide

## Prerequisites
- Backend server running on `http://10.0.2.2:3000`
- Mobile app running with `USE_MOCK_API: false` in `src/config/api.ts`
- Test user accounts created in backend
- Workspace with multiple members created

## Test Scenarios

### 1. View Members Tab
**Steps:**
1. Navigate to a project detail screen
2. Click on "Members" tab in footer navigation
3. Verify members are displayed

**Expected Results:**
- Members tab loads without errors
- All project members are displayed
- Members are organized by role (Leaders first, then regular members)
- Each member card shows:
  - Avatar with initials
  - Name and email
  - Join date
  - Role badge

### 2. Add Member Button Visibility
**Steps:**
1. Login as project owner/admin
2. Navigate to project detail
3. Click "Members" tab
4. Observe "Add" button

**Expected Results:**
- "Add" button is visible for owner/admin
- Button is positioned in top-right of Members section

**Steps (Non-admin user):**
1. Login as regular project member
2. Navigate to same project
3. Click "Members" tab

**Expected Results:**
- "Add" button is NOT visible for regular members

### 3. Add Member Flow
**Steps:**
1. Click "Add" button
2. AddMemberModal opens
3. Select a workspace member from dropdown
4. Click "Gửi thông báo" button
5. Wait for success message

**Expected Results:**
- Modal opens with list of available workspace members
- Selected member is highlighted
- Success toast appears: "Member added successfully"
- Modal closes automatically
- New member appears in Members tab
- Member count increases

### 4. Filter Available Members
**Steps:**
1. Click "Add" button
2. Open member dropdown
3. Observe list of members

**Expected Results:**
- Only workspace members NOT already in project are shown
- Members already in project are filtered out
- List is scrollable if many members

### 5. Member Role Display
**Steps:**
1. View Members tab
2. Observe role badges

**Expected Results:**
- Owner badge shows with admin icon and "Owner" text
- Admin badges show with verified icon and "Admin" text
- Member badges show with person icon and "Member" text
- Role badges have appropriate colors

### 6. Current User Indicator
**Steps:**
1. View Members tab
2. Find your user in the list

**Expected Results:**
- Your user has a "You" badge next to name
- Badge is visually distinct (light blue background)

### 7. Empty Members State
**Steps:**
1. Create a new project
2. Navigate to Members tab
3. Observe empty state

**Expected Results:**
- Empty state message displays
- Icon shows group outline
- Message says "No members yet"
- Subtitle suggests adding members

### 8. Notifications After Adding Member
**Steps:**
1. Add a member to project
2. Login as the added member
3. Check notifications

**Expected Results:**
- In-app notification appears in Notifications tab
- Notification shows project name and workspace name
- Email notification is sent to member's email

### 9. Member Persistence
**Steps:**
1. Add a member
2. Navigate away from project
3. Return to project
4. Click Members tab

**Expected Results:**
- Added member still appears in Members tab
- Member data is persisted correctly

### 10. Error Handling
**Steps:**
1. Try to add a member already in project
2. Observe error handling

**Expected Results:**
- Error message appears
- User can try again
- No duplicate members created

## Edge Cases to Test

### 1. Adding Self
**Steps:**
1. Try to add yourself to the project (if not already member)
2. Observe behavior

**Expected Results:**
- Either prevented or handled gracefully
- No duplicate entries

### 2. Network Errors
**Steps:**
1. Disconnect network
2. Try to add member
3. Observe error handling

**Expected Results:**
- Timeout error appears
- User can retry
- No partial data saved

### 3. Large Member Lists
**Steps:**
1. Create project with many members (10+)
2. View Members tab
3. Scroll through list

**Expected Results:**
- List scrolls smoothly
- No performance issues
- All members visible

### 4. Role Transitions
**Steps:**
1. Add member as regular member
2. Promote to admin (if feature exists)
3. Observe role change

**Expected Results:**
- Role badge updates
- Member position may change (if sorted by role)

## Performance Checks

- [ ] Members tab loads in < 2 seconds
- [ ] Scrolling is smooth with 20+ members
- [ ] Adding member completes in < 3 seconds
- [ ] No memory leaks when navigating away and back

## UI/UX Checks

- [ ] Member cards are properly aligned
- [ ] Text is readable and not truncated
- [ ] Colors match design system
- [ ] Spacing is consistent
- [ ] Icons are properly sized
- [ ] Badges are visually distinct

## Data Validation

- [ ] Member names display correctly
- [ ] Emails are valid and complete
- [ ] Join dates are formatted correctly
- [ ] Role names are capitalized properly
- [ ] Avatar initials are correct

## API Integration Checks

- [ ] Backend receives add member request
- [ ] Backend creates in-app notification
- [ ] Backend sends email notification
- [ ] Member role is set to "Member"
- [ ] Project member count updates
- [ ] No duplicate members created

## Troubleshooting

### Members not showing
- Check if user has access to project
- Verify backend API is running
- Check network connectivity
- Review console logs for errors

### Add button not visible
- Verify user is owner/admin of project
- Check user role in project
- Verify project data loaded correctly

### Member not appearing after adding
- Check if backend returned success
- Verify network request completed
- Check if page was refreshed
- Review backend logs for errors

### Notifications not appearing
- Check if email service is configured
- Verify member email is valid
- Check notification settings
- Review backend logs

## Success Criteria
- All test scenarios pass
- No console errors
- Smooth user experience
- Proper error handling
- Data persists correctly
- Performance is acceptable

