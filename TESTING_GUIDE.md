# Complete Testing & Validation Guide

## Test Scenario 1: Fresh Install (New User)

### Steps:
1. **Clear all data:**
   - Open DevTools → Application → Storage → Clear site data
   - OR use "Clear All & Reload" from Debug menu

2. **Reload the page**
   - Should see "Welcome to Hereo!" dialog
   - Console should show: `🎲 GENERATED DEMO USERS` with 2000 users

3. **Create profile:**
   - Name: "Test User"
   - Age: 28
   - Gender: "Female"
   - Receive messages from: Check ALL boxes (Male, Female, Non-binary, Other)
   - Age range: 18-80 (use slider)
   - Location sharing: ON
   - Require approval: Your choice
   - Click "Save Profile"

4. **Observe auto-generation:**
   - Toast: "Profile created! Generating demo data..."
   - Wait 2-3 seconds
   - Console logs should show:
     ```
     🎬 AUTO-GENERATING DEMO DATA ON PROFILE CREATE
     🔍 DEBUG CONVERSATION GENERATION - START
     🔍 ELIGIBLE USERS FOR CONVERSATIONS - DETAILED
     💬 GENERATED DEMO CONVERSATIONS
     🔔 GENERATED ADDITIONAL REQUESTS - COMPLETE
     💾 SAVING TO KV
     ✅ DEMO DATA SUCCESSFULLY SAVED TO KV STORE
     ```
   - Toast: "15 conversations and 20 requests loaded!"
   - Auto-switch to Messages tab

5. **Verify Messages tab:**
   - Should see 10-15 conversation cards
   - Each card should show user name and last message
   - Click a conversation → Should open chat interface
   - Should see 10-30 messages in the conversation

6. **Verify Requests tab:**
   - Should see 15-25 pending request cards
   - Each card should show user name, age, gender
   - Accept button and Decline button visible

7. **Verify Discover tab:**
   - Should see nearby users (varies by search radius)
   - Adjust radius slider → User count should update
   - Each user card should show distance (e.g., "450m away")

### Expected Console Output:
```
🎲 GENERATED DEMO USERS: { count: 2000, within800m: ~140, closestUsers: [...] }
🎬 AUTO-GENERATING DEMO DATA ON PROFILE CREATE
🔍 DEBUG CONVERSATION GENERATION - START: { totalDemoUsers: 2000, requestedConversations: 15 }
🔍 ELIGIBLE USERS FOR CONVERSATIONS - DETAILED: { finalEligible: 1200+, filterBreakdown: {...} }
💬 GENERATED DEMO CONVERSATIONS: { conversationCount: 15, totalMessages: 150+ }
🔔 GENERATED ADDITIONAL REQUESTS - COMPLETE: { totalRequestCount: 25, requestsToMe: 21 }
💾 SAVING TO KV: { conversations: 15, requests: 40, messages: 15 }
✅ DEMO DATA SUCCESSFULLY SAVED TO KV STORE
```

---

## Test Scenario 2: Returning User (Data Persists)

### Steps:
1. **Reload page** (don't clear data)
2. **Observe:**
   - Profile dialog should NOT appear
   - Console: `✅ Existing data detected on load`
   - Messages tab should show same conversations
   - Requests tab should show same pending requests
3. **Verify persistence:**
   - Click into a conversation
   - Send a new message
   - Reload page
   - Navigate back to that conversation
   - New message should still be there

---

## Test Scenario 3: Force Regenerate Demo Data

### Steps:
1. **Enable Debug mode** (click "Debug" button in header)
2. **Click "⚡ Force Generate" button**
3. **Observe:**
   - Console: `🔄 FORCE REGENERATING - Resetting all flags and data...`
   - All old conversations and requests cleared
   - New data generated
   - Toast: "✅ 15 conversations, 20 requests!"
4. **Verify:**
   - Messages tab has fresh conversations
   - Requests tab has fresh requests
   - All message history is new

---

## Test Scenario 4: Restrictive Profile Settings

### Steps:
1. **Edit profile:**
   - Age: 75
   - Receive messages from: Only "Male" (uncheck others)
   - Age range: 70-80
   - Save
2. **Force regenerate:**
   - Use Debug → Force Generate
   - May see fewer or no conversations
   - Console should show low `finalEligible` count
3. **Adjust and retry:**
   - Edit profile
   - Check all gender boxes
   - Age range: 18-100
   - Force generate again
   - Should see more results

---

## Test Scenario 5: Accept/Decline Requests

### Steps:
1. **Go to Requests tab**
2. **Click "Accept" on a request:**
   - Request disappears from list
   - New conversation appears in Messages tab
   - Can now message that user
3. **Click "Decline" on a request:**
   - Request disappears from list
   - No conversation created

---

## Test Scenario 6: Send New Chat Request

### Steps:
1. **Go to Discover tab**
2. **Find a user with green "Can message" badge**
3. **Click "Message" button:**
   - If user doesn't require approval: Immediately opens conversation
   - If user requires approval: Shows "Request Sent!" dialog
4. **Verify:**
   - Check Messages tab (if auto-accepted)
   - OR request appears in their pending list (simulated in demo)

---

## Debug Panel Features

### Enable Debug Mode:
Click "Debug" button in header

### Panel Shows:
- **Profile**: ✅ if profile exists, shows name/gender/age
- **Conversations**: Count of active conversations
- **Requests**: Count of pending incoming requests
- **Status**: ✅ Ready or ⏳ Pending

### Buttons:
- **🔄 Refresh Users**: Regenerates 2000 demo users (preserves existing conversations)
- **⚡ Force Generate**: Clears ALL data and regenerates from scratch
- **🗑️ Clear All & Reload**: Nuclear option - clears everything and reloads page

---

## Console Log Reference

### Successful Flow Logs:
```
🎲 GENERATED DEMO USERS          → Demo users created
🎬 AUTO-GENERATING               → Auto-gen triggered
🔍 DEBUG CONVERSATION GENERATION → Starting generation
🔍 ELIGIBLE USERS FOR CONVERSATIONS → Filter breakdown
💬 GENERATED DEMO CONVERSATIONS  → Conversations created
🔔 GENERATED ADDITIONAL REQUESTS → Requests created
💾 SAVING TO KV                  → Writing to storage
✅ DEMO DATA SUCCESSFULLY SAVED  → Complete!
```

### Monitoring Logs:
```
🔍 PENDING REQUESTS CHECK        → Shows current requests
💬 ACTIVE CONVERSATIONS CHECK    → Shows current conversations
```

---

## Common Issues & Solutions

### Issue: "No conversations or requests showing"
**Check:**
1. Console for `finalEligible` count
2. If 0, profile settings too restrictive
3. Adjust age range to 18-100
4. Check ALL gender boxes
5. Force regenerate

### Issue: "Demo data generates but disappears after reload"
**Check:**
1. Browser isn't in incognito/private mode
2. IndexedDB isn't disabled
3. Console for KV errors
4. Try "Clear All & Reload"

### Issue: "Force Generate does nothing"
**Check:**
1. Profile must exist first
2. Check console for errors
3. Wait 3-5 seconds after clicking
4. Look for toast notifications

### Issue: "Can't see any users in Discover"
**Check:**
1. Location sharing is enabled in profile
2. Search radius isn't too small
3. Demo users were generated (check console on load)
4. Refresh users button

---

## Performance Expectations

- **Initial load**: 2000 users generated in <500ms
- **Profile creation**: <100ms
- **Demo data generation**: 2-3 seconds for 15 conversations + 25 requests
- **Force regenerate**: 3-5 seconds total
- **Page navigation**: Instant
- **Message send**: <50ms
- **Storage operations**: <100ms each

---

## Browser Compatibility

Tested and working on:
- Chrome 120+
- Firefox 121+
- Safari 17+
- Edge 120+

Requires:
- IndexedDB support
- ES2020+ features
- Canvas API (for avatar generation)
