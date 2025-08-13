# Design Document

## Overview

The team ranking system will be implemented as a new page component that displays the top 5 teams across different statistical categories including goals conceded metrics. The system will integrate with the existing dashboard by adding a hyperlink to the win rate card and will utilize the existing `user_stats` table to calculate rankings. Column titles will be simplified by removing the "ランキング" suffix. The design follows the existing UI patterns and styling conventions of the eF record application.

## Architecture

### Component Structure
```
app/rankings/
├── page.tsx                 # Main ranking page component
└── components/
    ├── ranking-tabs.tsx     # Tab navigation for different ranking types
    ├── ranking-list.tsx     # List component for displaying ranked teams
    └── team-rank-card.tsx   # Individual team ranking card component

components/dashboard/
└── dashboard.tsx            # Modified to include ranking link
```

### Data Flow
1. Dashboard component renders win rate card with ranking link
2. User clicks link to navigate to `/rankings` page
3. Rankings page fetches user_stats data from Supabase
4. Data is processed and sorted based on selected ranking type
5. Top 5 teams are displayed with current user's team highlighted

## Components and Interfaces

### 1. Rankings Page (`app/rankings/page.tsx`)

**Purpose**: Main page component that orchestrates the ranking display

**Key Features**:
- Fetches user statistics from Supabase
- Manages active ranking type state
- Handles loading and error states
- Calculates additional metrics (total points, average points)

**Data Requirements**:
```typescript
interface UserStatsWithPoints {
  user_id: string
  team_name: string
  total_matches: number
  total_wins: number
  total_draws: number
  total_losses: number
  win_rate: number
  total_points_scored: number
  total_points_conceded: number
  average_points_scored: number
  average_points_conceded: number
}
```

### 2. Ranking Tabs Component (`components/rankings/ranking-tabs.tsx`)

**Purpose**: Tab navigation for switching between ranking types

**Props**:
```typescript
interface RankingTabsProps {
  activeTab: RankingType
  onTabChange: (tab: RankingType) => void
}

type RankingType = 'win_rate' | 'total_wins' | 'total_points' | 'average_points' | 'total_points_conceded' | 'average_points_conceded'
```

**Features**:
- Responsive tab design
- Active tab highlighting
- Touch-friendly on mobile

### 3. Ranking List Component (`components/rankings/ranking-list.tsx`)

**Purpose**: Displays the list of ranked teams

**Props**:
```typescript
interface RankingListProps {
  teams: UserStatsWithPoints[]
  rankingType: RankingType
  currentUserId: string
  isLoading: boolean
}
```

**Features**:
- Displays top 5 teams
- Highlights current user's team
- Shows appropriate metrics based on ranking type
- Handles empty states

### 4. Team Rank Card Component (`components/rankings/team-rank-card.tsx`)

**Purpose**: Individual team display within rankings

**Props**:
```typescript
interface TeamRankCardProps {
  team: UserStatsWithPoints
  rank: number
  rankingType: RankingType
  isCurrentUser: boolean
}
```

**Features**:
- Displays rank position
- Shows team name and primary metric
- Shows secondary statistics
- Highlights current user's team

### 5. Modified Dashboard Component

**Changes**:
- Add hyperlink to win rate card
- Link navigates to `/rankings` page
- Maintains existing styling and layout

## Data Models

### User Statistics Extended Interface
```typescript
interface UserStatsWithPoints extends UserStats {
  win_rate: number // Calculated: (total_wins / total_matches) * 100
  total_points_scored: number // Calculated from matches table
  total_points_conceded: number // Calculated from matches table  
  average_points_scored: number // Calculated: total_points_scored / total_matches
  average_points_conceded: number // Calculated: total_points_conceded / total_matches
}
```

### Ranking Configuration
```typescript
interface RankingConfig {
  key: RankingType
  label: string
  primaryMetric: keyof UserStatsWithPoints
  secondaryMetrics: (keyof UserStatsWithPoints)[]
  sortOrder: 'desc' | 'asc'
  formatter: (value: number) => string
}
```

## Error Handling

### Data Fetching Errors
- Display error message with retry option
- Fallback to empty state with appropriate messaging
- Log errors for debugging

### Edge Cases
- Teams with zero matches excluded from percentage-based rankings
- Tie-breaking logic: sort by total_matches (desc), then by team_name (asc)
- Handle division by zero for average calculations

### Loading States
- Skeleton loading for ranking cards
- Loading spinner for tab switches
- Progressive loading for better UX

## Testing Strategy

### Unit Tests
- Test ranking calculation logic
- Test component rendering with different data states
- Test tab switching functionality
- Test user team highlighting logic

### Integration Tests
- Test navigation from dashboard to rankings
- Test data fetching and error handling
- Test responsive behavior across devices

### Edge Case Tests
- Empty data scenarios
- Single team scenarios
- Tie scenarios
- Zero matches scenarios

## Performance Considerations

### Data Optimization
- Fetch only necessary fields from user_stats
- Use single query to get all required data
- Implement client-side caching for ranking data

### Rendering Optimization
- Use React.memo for ranking cards
- Implement virtual scrolling if needed (future enhancement)
- Optimize re-renders on tab switches

## UI/UX Design

### Visual Hierarchy
- Clear ranking positions (1st, 2nd, 3rd, etc.)
- Prominent display of primary metrics
- Secondary information in muted colors
- Current user team highlighted with accent color

### Responsive Design
- Mobile-first approach
- Collapsible secondary information on small screens
- Touch-friendly tab navigation
- Horizontal scrolling for tabs if needed

### Accessibility
- Proper ARIA labels for rankings
- Keyboard navigation support
- Screen reader friendly content
- High contrast for highlighted elements

## Integration Points

### Dashboard Integration
- Modify existing win rate card component
- Add hyperlink labeled "勝率を見る" with consistent styling
- Maintain existing card layout and functionality

### Navigation Integration
- Add new route `/rankings` to Next.js routing
- Implement proper page metadata
- Add breadcrumb navigation if needed

### Supabase Integration
- Extend existing user_stats queries
- Add matches table queries for point calculations
- Utilize existing RLS policies
- Maintain existing error handling patterns