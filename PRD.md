# Hereo - Proximity-Based Community Connection App

A demonstration MVP for a proximity-based community platform that connects nearby users through heat maps, discovery, and messaging.

**Experience Qualities**:
1. **Exploratory** - Users should feel curious about who's nearby and excited to discover their local community through visual heat maps
2. **Safe** - Privacy-first design with fuzzy locations, demo coordinates, and mutual opt-in messaging creates trust
3. **Connected** - Seamless flow from discovery to conversation makes meeting nearby people feel natural and approachable

**Complexity Level**: Light Application (multiple features with basic state)
This is a focused MVP with core features: heat map visualization, user profiles, proximity search, and basic messaging. Uses persistent state for user data and conversations but avoids complex features like real-time location tracking, advanced matching algorithms, or notification systems.

## Essential Features

### Heat Map Visualization
- **Functionality**: Display an interactive map showing anonymous user density as color-coded heat zones
- **Purpose**: Provides ambient awareness of community activity without compromising individual privacy
- **Trigger**: Automatically loads on home screen
- **Progression**: App loads → Generate fuzzy coordinates for demo users → Render heat map overlay → Display density visualization → User can pan/zoom
- **Success criteria**: Heat map renders with realistic density patterns, no exact user locations visible, smooth interaction

### User Profile Management
- **Functionality**: Create and edit profile with name, age, gender, and sexual orientation fields
- **Purpose**: Allows users to present themselves and sets context for connections
- **Trigger**: Profile button in navigation or automatic prompt for first-time users
- **Progression**: Click profile → View/edit form → Enter details → Save → Profile stored persistently
- **Success criteria**: Profile persists across sessions, all fields editable, data validates appropriately

### Proximity Search
- **Functionality**: Browse list of nearby active users with distance estimates and configurable search radius
- **Purpose**: Enables intentional discovery of people in the surrounding area
- **Trigger**: Navigate to "Discover" tab or section
- **Progression**: Open discovery → Set radius filter → View user cards with approximate distance → Click user for more details → Option to initiate chat
- **Success criteria**: Users appear sorted by distance, radius filter works, distances are approximate (not exact coordinates)

### Mutual Opt-In Messaging
- **Functionality**: Send/receive chat requests and engage in simple text conversations
- **Purpose**: Facilitates actual connection between interested users
- **Trigger**: Click "Message" on another user's card
- **Progression**: Send chat request → Other user accepts → Chat thread opens → Send/receive messages → Messages persist
- **Success criteria**: Both users must opt in before messaging, conversation history persists, messages appear in real-time feel

## Edge Case Handling
- **Empty states**: When no users nearby, show encouraging empty state with illustration
- **Profile incomplete**: Prompt user to complete profile before accessing discovery features
- **Pending requests**: Show clear status for outgoing/incoming chat requests with appropriate actions
- **Blocked or unavailable users**: Gracefully handle when selected user is no longer active
- **Location simulation**: Use randomized demo coordinates around a central point for MVP testing

## Design Direction
The design should feel modern, social, and welcoming - evoking excitement about local community without feeling corporate or clinical. Warm, approachable, with emphasis on spatial awareness through the map interface. Should feel like a blend between a social app and an exploration tool.

## Color Selection
Vibrant gradient-based palette with warm tones that evoke energy, connection, and community.

- **Primary Color**: Vibrant coral-pink `oklch(0.68 0.18 15)` - Warm, inviting, and energetic; communicates friendliness and social connection
- **Secondary Colors**: Deep purple `oklch(0.45 0.15 295)` for depth and sophistication in secondary UI elements
- **Accent Color**: Bright cyan `oklch(0.75 0.13 195)` - Eye-catching for CTAs, notifications, and active states
- **Foreground/Background Pairings**: 
  - Background (Soft cream `oklch(0.98 0.01 85)`): Dark purple text `oklch(0.25 0.05 295)` - Ratio 11.2:1 ✓
  - Primary (Coral pink `oklch(0.68 0.18 15)`): White text `oklch(1 0 0)` - Ratio 4.9:1 ✓
  - Accent (Bright cyan `oklch(0.75 0.13 195)`): Dark purple text `oklch(0.25 0.05 295)` - Ratio 6.8:1 ✓

## Font Selection
Typography should feel contemporary and friendly with geometric clarity for the social interface and readable text for profiles/messages.

- **Primary Font**: Space Grotesk - Modern geometric sans with personality, perfect for headings and UI elements
- **Secondary Font**: Inter - Clean, highly legible for body text and messaging interface

**Typographic Hierarchy**:
- H1 (App Name/Hero): Space Grotesk Bold/32px/tight letter spacing (-0.02em)
- H2 (Section Headers): Space Grotesk Semibold/24px/normal spacing
- H3 (Card Titles): Space Grotesk Medium/18px/normal spacing
- Body (Profiles/Messages): Inter Regular/15px/relaxed line height (1.6)
- Small (Distance/Metadata): Inter Medium/13px/tracking wide (0.01em)

## Animations
Animations should enhance spatial awareness and create delight during discovery moments.

- **Heat map**: Subtle pulsing glow effect on high-density zones, smooth color transitions between density levels
- **Card interactions**: Gentle lift on hover with scale (1.02) and shadow depth increase
- **Message sends**: Quick slide-up with fade for sent messages, gentle bounce for received
- **Chat requests**: Celebratory micro-animation when mutual connection established
- **Transitions**: Smooth page transitions with slight fade and slide (200ms ease-out)

## Component Selection
- **Components**: 
  - Card (user profiles in discovery, message threads)
  - Button (primary actions, chat requests)
  - Avatar (user profile pictures - will use initials fallback)
  - Badge (online status, distance indicators, notification counts)
  - Dialog (profile editing, chat request confirmations)
  - Tabs (navigation between heat map, discovery, messages, profile)
  - Input/Textarea (profile fields, message composition)
  - ScrollArea (message threads, user lists)
  - Slider (radius selection for proximity search)
  
- **Customizations**: 
  - Custom heat map component using canvas or SVG with gradient overlays
  - Custom user card component combining Card, Avatar, Badge with distance display
  - Custom message bubble component with sender/receiver styling distinction
  
- **States**: 
  - Buttons: Default (gradient fill), hover (brightness increase + lift), active (slight scale down), disabled (reduced opacity + grayscale)
  - Cards: Default (subtle shadow), hover (elevated shadow + border glow), selected (accent border)
  - Inputs: Default (border only), focus (accent border + ring), error (destructive border + message)
  
- **Icon Selection**: 
  - MapTrifold (heat map tab)
  - MagnifyingGlass (discovery/search)
  - ChatCircle (messages)
  - User (profile)
  - PaperPlaneTilt (send message)
  - Check/X (accept/decline requests)
  
- **Spacing**: 
  - Page padding: `p-6` on mobile, `p-8` on tablet+
  - Card gaps: `gap-4` for lists, `gap-6` for grid layouts
  - Section spacing: `space-y-6` between major sections
  - Inline elements: `gap-2` for buttons/badges
  
- **Mobile**: 
  - Bottom tab navigation on mobile, side navigation on desktop
  - Single column card layout on mobile, 2-3 column grid on desktop
  - Full-screen modals for profile/messaging on mobile, dialogs on desktop
  - Collapsible filters in discovery, always-visible on desktop
