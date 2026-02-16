# Preference Filter Fix - Summary

## Issue Identified
The preference filters (Receive Messages From, Age Range, and Relationship Status Preference) were being used to **filter which users appear in the Discover tab**, rather than controlling **who can initiate conversations**.

## What Was Changed

### Before
- Users who didn't match your preferences were completely hidden from the Discover tab
- The `nearbyUsers` filter included: `&& item.canMessage` 
- You could only see users you were compatible with

### After
- **All nearby users now appear in the Discover tab** (regardless of preference match)
- The `canMessage` flag is still calculated for each user
- Users are shown with a "Preferences Mismatch" badge and disabled "Send Message" button if preferences don't align
- The `nearbyUsers` filter changed to: removed `&& item.canMessage` condition

## How Preferences Now Work

### What Controls Messaging
For two users to be able to message each other, **ALL** of the following must be true:

1. **Gender Preferences (Receive Messages From)**
   - User A's "Receive Messages From" must include User B's gender
   - User B's "Receive Messages From" must include User A's gender

2. **Age Range Preferences**
   - User A must be within User B's age range (ageRangeMin to ageRangeMax)
   - User B must be within User A's age range

3. **Relationship Status Preferences**
   - User A's "Relationship Status Preference" must accept User B's status (Single/Not Single/Prefer not to say)
   - User B's "Relationship Status Preference" must accept User A's status

### UI Changes
- **Discover Tab**: Shows all active users within search radius
  - Users you CAN message: "Send Message" button is enabled
  - Users you CANNOT message: "Preferences Mismatch" badge shown, button disabled with text "Preferences Mismatch"

- **When clicking disabled button**: The existing validation in `handleSendChatRequest` will show error: "Your preferences do not match with this user"

## Files Modified
- `/workspaces/spark-template/src/App.tsx` - Updated `nearbyUsers` filter logic and UserCard props

## Technical Details

The `nearbyUsers` memo now:
1. Gets all active users with location sharing enabled
2. Calculates distance to each user
3. Calculates `canMessage` flag based on preference compatibility
4. Filters ONLY by distance (removed `&& item.canMessage`)
5. Returns array with `{ user, distance, canMessage }` for each user

The UserCard component receives the `canMessage` boolean and:
- Shows "Not a match" badge when `canMessage` is false
- Disables the message button when `canMessage` is false
- Changes button text to "Preferences Mismatch" when disabled
