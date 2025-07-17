# Design Document

## Overview

This design document outlines the modifications needed to improve the player display interface in the dashboard component. The changes focus on simplifying the UI, ensuring full player name display, and repositioning the player section for better visibility.

## Architecture

The changes will be implemented in the existing `components/dashboard/dashboard.tsx` file, specifically modifying the player display section without affecting other dashboard functionality.

## Components and Interfaces

### Modified Components

#### Dashboard Component (`components/dashboard/dashboard.tsx`)

**Current Structure:**
- Player section is positioned after the period filter
- Contains subtitle "毎日変わるサッカーの歴史"
- Has a large star icon next to the player name
- Player name may be truncated with ellipsis

**New Structure:**
- Player section moved above the period filter
- Subtitle removed completely
- Large icon removed from player name area
- Player name displayed in full without truncation

### Layout Changes

#### Section Reordering
1. Header (unchanged)
2. **Player Section (moved up)**
3. Period Filter Section
4. Statistics Cards
5. Recent Matches

#### Player Section Modifications
- Remove the subtitle div containing "毎日変わるサッカーの歴史"
- Remove the large circular icon with the player avatar
- Ensure player name uses full width and no text truncation
- Maintain the existing card styling and responsive design

## Data Models

No changes to existing data models are required. The `Player` interface and related queries remain unchanged:

```typescript
interface Player {
  id: number
  name: string
  position: string
  country: string
  episode: string
}
```

## Error Handling

Existing error handling for player data loading will be maintained. The loading state and error states remain unchanged.

## Testing Strategy

### Manual Testing
1. Verify player section appears above period filter on desktop
2. Verify player section appears above period filter on mobile
3. Verify full player names are displayed without truncation
4. Verify subtitle is completely removed
5. Verify large icon is removed
6. Test responsive behavior across different screen sizes

### Visual Regression Testing
- Compare before/after screenshots to ensure only intended elements are removed
- Verify layout positioning is correct on various screen sizes

## Implementation Notes

### CSS/Styling Considerations
- Maintain existing responsive grid system
- Preserve existing color scheme and spacing
- Ensure proper mobile touch targets
- Keep existing hover states and transitions

### Accessibility
- Maintain existing ARIA labels and semantic HTML structure
- Ensure keyboard navigation remains functional
- Preserve screen reader compatibility