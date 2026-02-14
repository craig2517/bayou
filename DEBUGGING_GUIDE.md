# Demo Data Debugging Guide

## What Changed

Added comprehensive console logging throughout the demo data generation pipeline to identify why conversations and requests aren't being created.

## How to Debug

### Step 1: Enable Debug Mode
1. Click the "Debug" button in the header (next to the Hereo logo)
2. This shows the debug panel with current data counts

### Step 2: Open Browser Console
- Press F12 (Windows/Linux) or Cmd+Option+I (Mac)
- Go to the "Console" tab

### Step 3: Clear All Data & Regenerate
1. Click the "Demo Mode" badge dropdown
2. Select "Clear All & Reload"
3. Watch the console output

## What to Look For

### Console Log Markers

#### 🎲 GENERATED DEMO USERS
Shows how demo users are distributed by distance from center:
- `within100m`, `within300m`, `within500m`, `within800m`, `within1km`
- `sampleUsers` - first 3 generated users with full details

#### 🔍 DEBUG CONVERSATION GENERATION - START
Shows your profile details when starting conversation generation

#### 🔍 ELIGIBLE USERS FOR CONVERSATIONS - DETAILED
**KEY LOG** - This shows the filtering breakdown:
- `afterSelfFilter` - users after removing self
- `afterActiveFilter` - active users only
- `afterDistanceFilter` - users within 10km
- `finalEligible` - users that pass ALL matching criteria
- `failedMatchingChecks` - users within distance but failed matching

Look at `failedMatchesBreakdown` to see WHY users fail:
```javascript
{
  name: "Alex",
  gender: "Male",
  age: 25,
  checks: {
    theyAcceptMyGender: true/false,  // Do they accept messages from your gender?
    myAgeInTheirRange: true/false,   // Is your age in their age range?
    iAcceptTheirGender: true/false,  // Do you accept messages from their gender?
    theirAgeInMyRange: true/false    // Is their age in your age range?
  }
}
```

#### 💬 GENERATED DEMO CONVERSATIONS
Shows the final result of conversation generation

#### 🔔 DEBUG ADDITIONAL REQUESTS - START
Shows your profile when generating chat requests

#### 🔔 ADDITIONAL REQUESTS - FILTER BREAKDOWN
Similar filtering breakdown for requests

#### 🔔 GENERATED ADDITIONAL REQUESTS - COMPLETE
Final result of request generation with samples

## Common Issues & Solutions

### Issue: No eligible users found

**Symptom:** `finalEligible: 0` in console logs

**Possible Causes:**

1. **Gender Mismatch**
   - Check: Your profile's "Receive Messages From" settings
   - Fix: Make sure you're accepting messages from the genders that exist in demo users (Male, Female, Non-binary, Other)
   - Default demo users accept all genders in 85% of cases

2. **Age Range Too Narrow**
   - Check: Your profile's age range (ageRangeMin to ageRangeMax)
   - Fix: Widen your age range (18-100 to match all users)
   - Demo users have ages 18-80 with varied age range preferences

3. **Demo Users Not Accepting Your Gender**
   - Check: `theyAcceptMyGender: false` in failedMatchesBreakdown
   - Note: 15% of demo users have limited gender preferences
   - Fix: Generate new users with "Refresh" button (85% accept all genders)

4. **Your Age Out of Their Range**
   - Check: `myAgeInTheirRange: false` in failedMatchesBreakdown
   - Note: Demo users have age ranges like [age-30, age+50]
   - Fix: Adjust your profile age to match more users (25-45 is most common)

5. **Distance Issue** (rare)
   - Check: `afterDistanceFilter` should be > 1000 (many users within 10km)
   - Note: All demo users are generated within 1.5km of center
   - Your profile is at exact center, so all should be within 10km

### Issue: Some eligible users but no data generated

**Symptom:** `finalEligible: 5` but `conversationCount: 0`

This should not happen - if you see eligible users, conversations WILL be created. If not, there's a KV storage issue.

**Check:**
1. Is `hasInitializedDemoData.current` true in debug panel?
2. Check "Raw" counts in debug panel vs filtered counts

### Issue: Data shows in console but not in UI

**Symptom:** Console shows conversations created, but UI shows empty

**Check:**
1. Debug panel "Raw" counts - are they null/undefined or actual numbers?
2. KV storage persistence - reload page and check if data persists
3. Look for KV-related errors in console

## Testing Scenarios

### Scenario 1: Fresh Start (Best Case)
1. Clear all data
2. Create profile with:
   - Age: 30
   - Gender: Any
   - Receive from: All genders checked
   - Age range: 18-100
3. Enable location sharing
4. Result: Should see 10-20 conversations and 20-30 requests

### Scenario 2: Restricted Preferences
1. Clear all data
2. Create profile with:
   - Age: 25
   - Gender: Male
   - Receive from: Female only
   - Age range: 22-28
3. Enable location sharing
4. Result: Fewer matches, but still 2-5 conversations minimum

### Scenario 3: Edge Case
1. Clear all data
2. Create profile with:
   - Age: 75
   - Gender: Other
   - Receive from: Other only
   - Age range: 70-80
3. Enable location sharing
4. Result: Very few or zero matches (expected - demo users are mostly 20-50)

## Next Steps If Still Broken

1. Share the FULL console output starting from page load
2. Share your profile settings (from debug panel or profile form)
3. Look for any errors (red text) in console
4. Check if you see "✅ KV data saved successfully" message
5. Check if hasInitializedDemoData is true after generation

## Technical Details

### Demo User Generation
- 2000 users total
- 70% within 0.5km, 20% within 1km, 10% between 1-1.5km
- 85% accept messages from all genders
- Age ranges are wide (typically ±20-30 years from user's age)
- All ages 18-80

### Matching Algorithm
ALL four conditions must be true:
1. They accept messages from your gender
2. Your age is in their age range
3. You accept messages from their gender  
4. Their age is in your age range

### Data Generation
- Conversations: Tries to generate 15, limited by eligible users
- Requests: Generates 25 additional, with 85% being requests TO you
- Distance filter: Within 10km (very generous - all demo users qualify)

## Debug Panel Legend

```
Profile: ✅ Created / ❌ None
  - Shows if you have a profile and its ID

Conversations:
  - Raw: What's stored in KV (null/undefined/number)
  - Active: What's displayed in UI after filtering

Chat Requests:
  - Raw: What's stored in KV
  - Pending: Incoming requests waiting for approval

Messages:
  - Keys: Number of conversation IDs with messages
  - Total: Total message count across all conversations

Init: ✅ Yes / ❌ No
  - Has demo data generation completed?

Demo Users: 2000
  - Total users generated
```
