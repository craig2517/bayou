# Debug Mode Guide - Hereo Demo Data Generation

## How to Enable Debug Mode

1. **Click the "Debug" button** in the top-left corner of the header (next to the Hereo logo)
2. The debug panel will appear below the header with detailed information

## Understanding the Debug Panel

### 5 Key Status Cards

1. **Profile Status**
   - Shows if you have a profile created
   - Displays: name, gender, age, accepted genders, and age range
   - ❌ If you see "None", create a profile first

2. **Conversations**
   - Total number of conversations stored
   - Shows "Active" conversations (filtered to show only yours)
   - Must be > 0 to see messages in the Messages tab

3. **Chat Requests**
   - Total number of chat requests (sent and received)
   - "Pending" shows requests waiting for your response
   - "To Me" shows requests you need to accept/decline

4. **Messages**
   - Number of conversation IDs with messages
   - Total message count across all conversations
   - Should match the number of conversations (1 key per conversation)

5. **Demo Users**
   - Total simulated users (should be 2000)
   - "Init" flag shows if demo data has been generated
   - "Eligible" shows how many users match YOUR preferences

## Step-by-Step: Force Generate Demo Data

### Step 1: Create Your Profile
1. Click **Profile** button in top-right
2. Fill in all required fields:
   - Name (any name)
   - Age (18-100)
   - Gender (select one)
   - **IMPORTANT: Check ALL 4 gender options** under "Receive Messages From"
   - **IMPORTANT: Set Age Range to 18-100** (full range)
3. Toggle "Share location" ON
4. Click **Save Profile**

### Step 2: Enable Debug Mode
1. Click **Debug** button next to the logo
2. Review the debug panel that appears

### Step 3: Generate Demo Data
1. In the debug panel, click **⚡ Force Generate Demo Data** (yellow button)
2. Watch the button change to "⏳ Generating..."
3. Wait for the success toast notification
4. Check the debug panel numbers update

### Step 4: Verify Success
✅ **Success looks like:**
- Conversations: 10-15
- Chat Requests: 30-40 total, 20-25 pending to you
- Messages: 10-15 (one key per conversation)
- You'll automatically switch to the Messages tab

❌ **If generation fails:**
- Check browser console (F12) for detailed logs
- Review the "Eligible" user count in Demo Users card
- If Eligible = 0, your preferences don't match anyone

## Troubleshooting: No Demo Data Generated

### Problem: Eligible Users = 0

**Cause:** Your profile preferences don't match any demo users.

**Solution:**
1. Click **Profile** button
2. Under "Receive Messages From", check **ALL 4 genders**
3. Set Age Range slider to **18-100** (full range)
4. Save Profile
5. Try Force Generate again

### Problem: Eligible Users > 0 but No Conversations

**Cause:** Something went wrong in the generation logic.

**Solution:**
1. Click **🔄 Refresh Users** button in debug panel
2. Wait for "Nearby users refreshed!" toast
3. Click **⚡ Force Generate Demo Data** again
4. Check browser console (F12) for error messages

### Problem: Generation Works But No Messages/Requests Showing

**Cause:** UI state issue or data not persisting.

**Solution:**
1. Click the **Demo Mode** badge (top-left header)
2. Select **Clear All & Reload**
3. Confirm and wait for page reload
4. Create profile again with ALL genders accepted
5. Enable Debug mode
6. Force Generate Demo Data

## Understanding Console Logs

Open browser console (F12) to see detailed generation logs:

### Key Log Messages:

```
🔄 FORCE REGENERATING DEMO DATA...
```
Generation started

```
📋 MY PROFILE BEFORE GENERATION:
```
Shows your current profile settings

```
🔍 ELIGIBLE USERS PRE-CHECK: X
```
How many users match your preferences (must be > 0)

```
🔍 ELIGIBLE USERS FOR CONVERSATIONS - DETAILED:
```
Detailed breakdown of why users pass/fail matching

```
💬 GENERATED DEMO CONVERSATIONS:
```
Shows successful conversation creation

```
🔔 GENERATED ADDITIONAL REQUESTS - COMPLETE:
```
Shows chat request generation

```
✅ Force regeneration complete:
```
Final success summary

### Error Messages:

```
❌ FAILURE ANALYSIS:
```
Detailed breakdown of why generation failed

## Demo Mode Dropdown Options

Click the **Demo Mode** badge in the header to access:

1. **Force Generate Demo Data** - Same as debug panel button
2. **Add More Conversations** - Add 10 more conversations to existing data
3. **Add More Requests** - Add 20 more chat requests
4. **Clear All & Reload** - Wipe all data and refresh the page

## Best Practices for Testing

### For Maximum Demo Data:
- ✅ Accept ALL 4 genders in profile
- ✅ Set age range to 18-100
- ✅ Enable location sharing
- ✅ Use Force Generate first, then add more if needed

### For Realistic Testing:
- Set specific preferences (e.g., only 2 genders, age 25-35)
- You'll get fewer matches (more realistic)
- May need to Refresh Users to get different people

## Quick Reference

| You Want... | Do This... |
|-------------|-----------|
| See what's wrong | Enable Debug mode |
| Generate data from scratch | Force Generate Demo Data |
| Get more conversations | Add More Conversations |
| Get more requests | Add More Requests |
| Start completely fresh | Clear All & Reload |
| Different demo users | Refresh Users |
| Maximum matches | Accept all genders, age 18-100 |

## Common Issues & Fixes

### "No profile exists"
**Fix:** Create a profile first before generating data

### "No compatible users found"
**Fix:** Accept all genders and expand age range to 18-100

### "Generation failed"
**Fix:** Refresh Users, then try again

### Numbers in debug panel don't update
**Fix:** Refresh the page (Ctrl+R / Cmd+R)

### Force Generate button disabled
**Fix:** Create a profile first

### Button stuck on "⏳ Generating..."
**Fix:** Refresh the page and check console for errors

## Technical Details

### What "Force Generate" Does:
1. Resets the initialization flag
2. Filters demo users by:
   - Not yourself
   - Active users only
   - Within 10km distance
   - Gender preferences match (bidirectional)
   - Age preferences match (bidirectional)
3. Creates 15 conversations with messages (5-20 messages each)
4. Creates 25 additional chat requests (20 to you, 5 from you)
5. Stores all data in persistent key-value storage

### Why Might Generation Fail?
- **No Eligible Users:** Your preferences are too restrictive
- **Location Mismatch:** All users are > 10km away (shouldn't happen with 2000 users)
- **State Issue:** Try refreshing users or clearing all data

### Where Data Is Stored:
- Conversations: `useKV('conversations-v3', [])`
- Chat Requests: `useKV('chat-requests-v3', [])`
- Messages: `useKV('messages-v3', {})`
- Your Profile: `useKV('my-profile-v2', null)`

All data persists between sessions unless you clear it.

---

**Still having issues?** Check the browser console (F12) for detailed error logs. Every step of generation is logged with 🔍, 💬, 🔔, and ✅ emojis.
