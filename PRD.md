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
- **Functionality**: Create and edit profile with name, age, gender (including "Prefer not to say"), relationship status (optional), gender preferences (excludes "Prefer not to say" from message preferences), relationship status preferences, age range preferences, and real-time location sharing toggle
- **Purpose**: Allows users to present themselves, control their privacy, manage location visibility, and define their messaging preferences including filtering by relationship status
- **Trigger**: Profile button in navigation or automatic prompt for first-time users
- **Progression**: Click profile → View/edit form → Enter details → Set relationship status (Single/Not Single/Prefer not to say) → Choose genders to receive messages from (Male/Female/Non-binary/Other, excluding "Prefer not to say") → Choose relationship statuses to receive messages from (Single/Not Single/Prefer not to say) → Set age range preferences → Toggle location sharing on/off → Toggle "Require Approval for Messages" on/off → Save → Profile stored persistently
- **Success criteria**: Profile persists across sessions, all fields editable, data validates appropriately, location sharing toggle controls visibility in discovery and heat map, relationship status preferences properly filter matches, "Prefer not to say" gender is selectable as user's own gender but not as a filter preference

### Proximity Search
- **Functionality**: Browse list of nearby active users with distance estimates and configurable search radius, filtered by mutual preference matching including relationship status
- **Purpose**: Enables intentional discovery of people in the surrounding area who match all preference criteria
- **Trigger**: Navigate to "Discover" tab or section
- **Progression**: Open discovery → Set radius filter → View user cards with approximate distance (filtered by gender preferences, age range preferences, AND relationship status preferences) → Click user for more details → Option to initiate chat
- **Success criteria**: Users appear sorted by distance, radius filter works, distances are approximate (not exact coordinates), only mutually compatible users are shown (matching on gender, age range, AND relationship status)

### Mutual Opt-In Messaging
- **Functionality**: Send/receive chat requests and engage in simple text conversations with automatic approval option
- **Purpose**: Facilitates actual connection between interested users
- **Trigger**: Click "Message" on another user's card
- **Progression**: Send chat request → If recipient has "Require Approval" enabled, they manually accept/decline → If recipient has "Require Approval" disabled, request auto-accepts → Chat thread opens → Send/receive messages → Messages persist
- **Success criteria**: Both users must opt in before messaging (or automatic approval if setting disabled), conversation history persists, messages appear in real-time feel, switching "Require Approval" from on to off automatically accepts all pending incoming requests

## Edge Case Handling
- **Empty states**: When no users nearby, show encouraging empty state with illustration
- **Profile incomplete**: Prompt user to complete profile before accessing discovery features
- **Location sharing disabled**: Show informative message in discovery tab when user has disabled location sharing, with quick access to enable it
- **Pending requests**: Show clear status for outgoing/incoming chat requests with appropriate actions
- **Blocked or unavailable users**: Gracefully handle when selected user is no longer active
- **Location simulation**: Use randomized demo coordinates around a central point for MVP testing

## Design Direction
The design should feel modern, social, and welcoming - evoking excitement about local community with a polished, refined aesthetic. The interface prioritizes visual hierarchy, generous spacing, and thoughtful micro-interactions that make every interaction feel intentional and delightful. Warm, approachable, sophisticated, with emphasis on spatial awareness through the map interface while maintaining a premium feel through elevated shadows, refined borders, and smooth transitions.

## Color Selection
Vibrant gradient-based palette with warm tones that evoke energy, connection, and community, refined with deeper saturation and better contrast.

- **Primary Color**: Vibrant coral-orange `oklch(0.70 0.20 20)` - Warm, inviting, and energetic with deeper saturation; communicates friendliness and social connection
- **Secondary Colors**: Rich purple `oklch(0.48 0.18 295)` for depth and sophistication in secondary UI elements
- **Accent Color**: Bright teal-cyan `oklch(0.76 0.15 200)` - Eye-catching for CTAs, notifications, and active states
- **Foreground/Background Pairings**: 
  - Background (Near white `oklch(0.99 0.005 85)`): Deep purple text `oklch(0.20 0.05 295)` - Ratio 14.8:1 ✓
  - Primary (Coral orange `oklch(0.70 0.20 20)`): White text `oklch(1 0 0)` - Ratio 5.2:1 ✓
  - Accent (Bright teal `oklch(0.76 0.15 200)`): Dark purple text `oklch(0.20 0.05 295)` - Ratio 7.5:1 ✓

## Font Selection
Typography should feel contemporary and friendly with geometric clarity for the social interface and readable text for profiles/messages. Refined hierarchy with tighter letter spacing for headings.

- **Primary Font**: Space Grotesk - Modern geometric sans with personality, perfect for headings and UI elements
- **Secondary Font**: Inter - Clean, highly legible for body text and messaging interface

**Typographic Hierarchy**:
- H1 (App Name/Hero): Space Grotesk Bold/32px/tight letter spacing (-0.025em)
- H2 (Section Headers/Dialog Titles): Space Grotesk Semibold/24px/tight letter spacing (-0.025em)
- H3 (Card Titles): Space Grotesk Semibold/18px/tight letter spacing (-0.025em)
- Body (Profiles/Messages): Inter Regular/15px/relaxed line height (1.6)
- Small (Distance/Metadata): Inter Medium/13px/normal spacing
- Labels: Inter Semibold/14px for form labels and section headers

## Animations
Animations should enhance spatial awareness, create delight during discovery moments, and provide smooth, polished transitions throughout the interface.

- **Heat map**: Subtle pulsing glow effect on high-density zones, smooth color transitions between density levels
- **Card interactions**: Elevated lift on hover with scale (1.02-1.05) and dramatic shadow depth increase, border color shift
- **Message sends**: Quick slide-up with fade for sent messages (300ms), gentle bounce for received
- **Chat requests**: Celebratory micro-animation when mutual connection established
- **Transitions**: Smooth page transitions with slight fade (all duration-200 to duration-300)
- **Avatar hovers**: Scale transform on profile avatars with transition-transform
- **Button interactions**: Shadow elevation changes from sm to md to lg on hover states
- **Empty states**: Duotone icons for softer, more polished appearance

## Component Selection
- **Components**: 
  - Card (user profiles in discovery, message threads) - Enhanced with border-2, rounded-xl, and elevation shadows
  - Button (primary actions, chat requests) - Larger touch targets (h-11, h-12), enhanced shadows
  - Avatar (user profile pictures - initials fallback with gradient backgrounds)
  - Badge (online status, distance indicators, notification counts) - Refined with shadow-sm
  - Dialog (profile editing, chat request confirmations) - Larger titles (text-2xl), max-height with scroll
  - Tabs (navigation) - Enhanced height (h-auto, py-2.5), active state shadows
  - Input/Textarea (profile fields, message composition) - Taller height (h-11) for better touch
  - ScrollArea (message threads, user lists)
  - Slider (radius selection)
  - Switch (location sharing toggle)
  
- **Customizations**: 
  - Custom heat map component with border-2 and rounded-xl
  - Enhanced user card with group hover effects and gradient avatars
  - Message bubbles with refined padding (px-4 py-3), border on received messages
  - Empty states with larger icons (size-56), duotone weight, rounded containers
  - Profile info cards with gradient backgrounds and larger icon circles
  
- **States**: 
  - Buttons: shadow-sm default, shadow-md hover, shadow-lg for primary CTAs
  - Cards: hover:shadow-xl with border color transitions (hover:border-primary/30)
  - Avatars: hover:scale-105 with smooth transitions
  - Form controls: Taller inputs (h-11), bordered checkboxes in rounded containers
  
- **Icon Selection**: 
  - MapTrifold (heat map tab) - size 20
  - MagnifyingGlass (discovery/search) - size 20, duotone for empty states
  - ChatCircle (messages) - size 20, duotone for empty states
  - User (profile) - size 20, size 18 in buttons, duotone for empty states
  - MapPin (location sharing status) - size 14-22, weight fill for emphasis
  - PaperPlaneTilt (send message) - size 20, weight fill
  - Check/X (accept/decline requests) - size 18
  - ArrowsClockwise (refresh) - size 18
  - Calendar, Heart (user profile details) - size 22, weight duotone
  
- **Spacing**: 
  - Page padding: `px-4 sm:px-6 py-6 sm:py-8` with responsive breakpoints
  - Container: max-w-7xl for better large screen layouts
  - Card gaps: `gap-4` for lists, `gap-5` for grids, `lg:grid-cols-3` for discover
  - Section spacing: `space-y-6` between major sections
  - Card padding: `p-5` for content cards, `p-6` for profile cards
  - Form spacing: `space-y-6` for forms, generous vertical rhythm
  
- **Mobile**: 
  - Responsive tab labels with `hidden sm:inline` for text, always show icons
  - Grid: single column mobile → 2 cols tablet → 3 cols desktop
  - Dialog: max-h-[90vh] with overflow-y-auto for long content
  - Header: responsive padding, shadow-sm for elevation
  - Touch targets: Minimum h-11 for all interactive elements
