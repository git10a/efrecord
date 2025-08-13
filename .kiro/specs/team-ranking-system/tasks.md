# Implementation Plan

- [ ] 1. Create core TypeScript interfaces and types
  - Define UserStatsWithPoints interface extending existing UserStats with average_points_conceded field
  - Create RankingType union type including 'total_points_conceded' and 'average_points_conceded'
  - Create RankingConfig interface with sortOrder property to handle ascending sort for goals conceded
  - Add component prop interfaces for all ranking components
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 2. Implement team ranking data fetching and calculation logic
  - Create utility functions to calculate win rates, total points, average points, and average goals conceded from user_stats and matches data
  - Implement ranking sort logic with tie-breaking rules and ascending sort for goals conceded rankings
  - Create Supabase query functions to fetch user statistics and match data for point calculations
  - Add error handling for data fetching operations
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 5.1, 5.2, 5.3, 5.4, 5.6_

- [ ] 3. Create Team Rank Card component
  - Implement TeamRankCard component to display individual team ranking information
  - Add conditional rendering for different ranking types (win rate, wins, points, average points, total goals conceded, average goals conceded)
  - Implement current user team highlighting with distinct visual styling
  - Add responsive design for mobile and desktop display
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 6.1, 6.2, 6.3_

- [ ] 4. Create Ranking Tabs component
  - Implement RankingTabs component for switching between ranking types including goals conceded tabs
  - Update tab labels to remove "ランキング" suffix (勝率, 勝利数, 合計得点, 平均得点, 合計失点, 平均失点)
  - Add tab state management and click handlers
  - Implement responsive tab design with mobile-friendly touch targets
  - Add active tab highlighting and smooth transitions
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 6.1, 6.2, 6.3_

- [ ] 5. Create Ranking List component
  - Implement RankingList component to display top 5 teams with support for goals conceded rankings
  - Add loading states with skeleton placeholders
  - Implement empty state handling when no teams have statistics
  - Add current user team highlighting logic
  - Handle edge cases for fewer than 5 teams
  - Implement proper sorting for goals conceded rankings (lower values rank higher)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 5.1, 5.4, 5.5, 5.6_

- [ ] 6. Create main Rankings page component
  - Implement main rankings page at app/rankings/page.tsx
  - Integrate RankingTabs and RankingList components
  - Add data fetching logic using React Query
  - Implement ranking type state management
  - Add error handling and loading states
  - _Requirements: 1.2, 1.3, 2.1, 5.4, 5.5_

- [ ] 7. Modify Dashboard component to add ranking link
  - Add hyperlink "勝率を見る" to the bottom of the win rate card
  - Implement navigation to /rankings page using Next.js Link
  - Maintain existing card styling and layout
  - Ensure link is properly styled and accessible
  - _Requirements: 1.1, 1.2_

- [ ] 8. Add comprehensive error handling and edge cases
  - Implement proper error boundaries for ranking components
  - Add retry functionality for failed data fetching
  - Handle division by zero cases in average calculations including average goals conceded
  - Add proper loading indicators throughout the ranking system
  - Test and handle scenarios with zero teams or zero matches
  - Ensure teams with zero matches are excluded from average-based rankings
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 9. Implement responsive design and mobile optimization
  - Ensure all ranking components work properly on mobile devices
  - Test and optimize tab navigation for touch interfaces
  - Verify team information displays correctly on small screens
  - Add proper responsive breakpoints and mobile-specific styling
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 10. Add unit tests for ranking functionality
  - Write tests for ranking calculation utility functions including goals conceded calculations
  - Test component rendering with various data states
  - Test user team highlighting logic
  - Test tab switching and state management for all ranking types
  - Test edge cases like empty data and tie scenarios
  - Test ascending sort logic for goals conceded rankings
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.1, 4.2, 5.1, 5.2, 5.3, 5.6_