# Hereo Demo Guide

Welcome to **Hereo** - a proximity-based community connection platform! This guide will help you effectively demonstrate the app's features.

## 🎯 What is Hereo?

Hereo connects people nearby through privacy-first location sharing, visual heat maps, and mutual opt-in messaging. Think of it as a local community discovery platform that respects user privacy while fostering real connections.

## 🌟 Key Features to Highlight

### 1. **Real-Time Heat Map** 📍
- **What it shows**: Anonymous user density visualization based on the Highlands area (40205) in Louisville, KY
- **Privacy-first**: All locations are fuzzed - no exact coordinates are ever displayed
- **FLIR-style colors**: Brighter/warmer colors indicate higher user activity
- **Demo tip**: Open the Map tab first to show the impressive visualization with 2000+ simulated users

### 2. **User Profiles** 👤
- **Customizable preferences**: Name, age, gender, message preferences
- **Smart filtering**: Age range and gender preferences ensure relevant matches
- **Privacy controls**: 
  - Toggle "Appear in Discover" to control visibility in search results
  - Toggle "Require Approval" to review chat requests before messaging
- **Demo tip**: Create a profile with broad preferences (all genders, age 18-80) to see maximum results

### 3. **Discover Tab** 🔍
- **Smart matching**: Only shows users who mutually match your preferences
- **Configurable radius**: Search from 0.1km to 1.0km
- **Live stats**: See total users, active users, in-range users, and matching users
- **Refresh button**: Generate new nearby users on demand
- **Demo tip**: 
  - Start with 0.8km radius to see plenty of matches
  - Click "Refresh" to show dynamic user generation
  - Hover over cards to see smooth animations

### 4. **Messaging System** 💬
- **Two modes**:
  - **Auto-accept**: Users can message you directly without approval
  - **Approval required**: Review requests in the Requests tab first
- **Real conversations**: Send and receive messages in real-time
- **Profile viewing**: Click any user's name or avatar to view their full profile
- **Demo tip**: Accept a request and send a few messages to show the chat interface

### 5. **Requests Tab** 📬
- **Incoming requests**: See who wants to connect with you
- **Accept/Decline**: Simple two-button interface for managing requests
- **Profile previews**: View user details before accepting
- **Demo tip**: You'll get 2-3 initial requests when creating a profile with "Appear in Discover" enabled

## 🎬 Recommended Demo Flow

### Opening (30 seconds)
1. **Start with the Map tab** - Show the impressive heat map visualization
2. Point out the street names (Bardstown Rd, Eastern Pkwy, Cherokee Pkwy, etc.)
3. Highlight the privacy aspect: "All locations are fuzzed for privacy"
4. Show the live counter: "X active nearby"

### Profile Creation (1 minute)
1. Click the **Profile** button in the header
2. Fill out a sample profile:
   - Name: "Alex" (or any name)
   - Age: 25
   - Gender: Any option
   - Receive Messages From: **Check all boxes** (for maximum demo matches)
   - Age Range: Leave at 18-80 (default)
   - **Enable "Appear in Discover"**
   - Choose either approval mode based on preference
3. Click **Save Profile**
4. Watch the success toast and automatic navigation

### Discover Feature (1-2 minutes)
1. Navigate to **Discover** tab (or wait for auto-navigation)
2. Point out the stats at the top showing:
   - Total users: 2000
   - Active users: ~1500
   - In range users: varies by radius
   - Matching users: based on preferences
3. Adjust the **Search Radius** slider to show filtering in action
4. Hover over user cards to show smooth animations
5. Click **Refresh** to generate new nearby users
6. Click a user card's avatar or name to **view their profile**
7. Click **Send Message** on a user to initiate contact

### Requests & Messaging (1-2 minutes)
1. Go to **Requests** tab to show incoming requests
2. Click **Accept** on a request
3. Navigate to **Messages** tab
4. Click on the conversation to open the chat
5. Send a few messages to demonstrate the interface
6. Click the user's name in the chat header to view their profile
7. Use the back arrow to return to the conversation list

### Advanced Features (30 seconds)
1. Show the **Demo Mode** badge in the header
2. Click **Profile** again to show the edit experience
3. Toggle **"Appear in Discover"** off to show the warning banner
4. Demonstrate the **Refresh** button in Discover
5. Show how clicking avatars/names throughout the app opens profiles

## 💡 Demo Tips & Talking Points

### Privacy & Safety
- "All locations are fuzzed for privacy - we never show exact coordinates"
- "You control your visibility with the 'Appear in Discover' toggle"
- "Mutual matching ensures both users meet each other's preferences"
- "Choose between auto-accept or approval-required for messages"

### Technical Highlights
- "Built with React and TypeScript for type-safe, modern development"
- "Uses shadcn/ui components for a polished, accessible interface"
- "2000+ simulated users with realistic geographic distribution"
- "Real Louisville street layout in the 40205 zip code"
- "Responsive design works perfectly on mobile and desktop"

### User Experience
- "Notice the smooth animations on every interaction"
- "Cards lift and scale on hover for tactile feedback"
- "Staggered animations when loading the user grid"
- "Clear visual hierarchy with stats, badges, and color coding"
- "Empty states guide users toward the next action"

### Business Value
- "Privacy-first approach builds user trust"
- "Smart matching reduces noise and improves connection quality"
- "Heat map provides ambient awareness without compromising privacy"
- "Flexible approval settings accommodate different user comfort levels"

## 🎨 Visual Highlights

### Color Palette
- **Primary (Coral Orange)**: Warm, inviting, energetic
- **Secondary (Purple)**: Sophisticated, premium feel
- **Accent (Teal)**: Eye-catching for CTAs and active states
- **FLIR Heat Map**: White → Yellow → Red → Green → Blue gradient

### Typography
- **Space Grotesk**: Geometric, modern font for headings
- **Inter**: Clean, readable font for body text
- Well-defined hierarchy from titles to metadata

### Interactions
- Card hover effects with lift and shadow
- Avatar scale effects on hover
- Smooth tab transitions
- Animated empty states
- Pulsing badges for notifications

## 🐛 Troubleshooting

### "No users showing in Discover"
- Make sure you've created a profile
- Check that you've selected at least one gender preference
- Verify your age range includes the simulated users (18-65)
- Try increasing the search radius
- Click the **Refresh** button to regenerate users

### "No requests appearing"
- Ensure "Appear in Discover" is enabled in your profile
- You get 2-3 initial requests when first creating a profile
- The number of requests depends on how many users match your preferences

### "Want to reset the demo"
- Clear your browser's local storage
- Refresh the page
- Create a new profile to start fresh

## 🚀 Advanced Demo Scenarios

### Scenario 1: Privacy-Conscious User
1. Create profile with "Appear in Discover" **disabled**
2. Show warning message explaining they're hidden from searches
3. Note they can still browse and message others
4. Show they still appear on the heat map (anonymously)

### Scenario 2: Selective User
1. Create profile with "Require Approval" **enabled**
2. Show requests coming in
3. Demonstrate declining some, accepting others
4. Show that only accepted requests appear in Messages

### Scenario 3: Open User
1. Create profile with "Require Approval" **disabled**
2. Send a message request to a user
3. Show that conversations appear immediately (auto-accept)
4. Demonstrate seamless messaging without approval flow

## 📊 Key Metrics to Highlight

- **2000 simulated users** in the demo
- **~1500 active users** with location sharing enabled
- **0.1-1.0 km** configurable search radius
- **100% privacy-preserving** location fuzzing
- **Responsive design** works on all screen sizes
- **4 main features**: Heat Map, Discover, Messages, Requests

## 🎯 Closing Points

When wrapping up your demo, emphasize:

1. **Privacy-first design** - Users control their visibility and data
2. **Smart matching** - Both users must match each other's preferences
3. **Beautiful UI** - Modern, polished interface with smooth animations
4. **Real-world ready** - Built with production-quality code and components
5. **Scalable architecture** - Ready to connect with real backend services

---

**Need help?** The app includes helpful empty states, tooltips, and guided flows to make the demo experience intuitive and impressive.

**Pro tip:** Create multiple profiles in different browser windows to simulate real user interactions!
