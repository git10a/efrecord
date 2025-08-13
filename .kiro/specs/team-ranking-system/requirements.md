# Requirements Document

## Introduction

This feature adds a comprehensive team ranking system to the eF record application. Users can view rankings of the top 5 teams based on various statistics including win rate, total wins, total points scored, average points scored, total goals conceded, and average goals conceded. The ranking system will be accessible from the existing win rate card on the dashboard through a hyperlink, and users can switch between different ranking criteria. Column titles will display without the "ランキング" suffix for cleaner presentation.

## Requirements

### Requirement 1

**User Story:** As a user, I want to access team rankings from the dashboard, so that I can easily compare my team's performance with other teams.

#### Acceptance Criteria

1. WHEN the dashboard win rate card is displayed THEN the system SHALL show a hyperlink labeled "勝率を見る" at the bottom of the card
2. WHEN the user clicks the ranking hyperlink THEN the system SHALL navigate to a dedicated team ranking page
3. WHEN the ranking page loads THEN the system SHALL display the top 5 teams by default sorted by win rate

### Requirement 2

**User Story:** As a user, I want to view different types of team rankings, so that I can analyze team performance from multiple perspectives.

#### Acceptance Criteria

1. WHEN the ranking page is displayed THEN the system SHALL show tabs or buttons for switching between ranking types
2. WHEN the user selects "勝率" THEN the system SHALL display teams ranked by win percentage (wins/total_matches * 100)
3. WHEN the user selects "勝利数" THEN the system SHALL display teams ranked by total number of wins
4. WHEN the user selects "合計得点" THEN the system SHALL display teams ranked by total points scored across all matches
5. WHEN the user selects "平均得点" THEN the system SHALL display teams ranked by average points scored per match
6. WHEN the user selects "合計失点" THEN the system SHALL display teams ranked by total goals conceded across all matches (lower values rank higher)
7. WHEN the user selects "平均失点" THEN the system SHALL display teams ranked by average goals conceded per match (lower values rank higher)

### Requirement 3

**User Story:** As a user, I want to see comprehensive team information in the rankings, so that I can understand each team's performance at a glance.

#### Acceptance Criteria

1. WHEN any ranking is displayed THEN each team entry SHALL show the team name, ranking position, and the primary metric value
2. WHEN win rate ranking is displayed THEN each team SHALL show win rate percentage, total matches, wins, draws, and losses
3. WHEN total wins ranking is displayed THEN each team SHALL show total wins, total matches, and win rate percentage
4. WHEN total points ranking is displayed THEN each team SHALL show total points scored, total matches, and average points per match
5. WHEN average points ranking is displayed THEN each team SHALL show average points per match, total points, and total matches
6. WHEN total goals conceded ranking is displayed THEN each team SHALL show total goals conceded, total matches, and average goals conceded per match
7. WHEN average goals conceded ranking is displayed THEN each team SHALL show average goals conceded per match, total goals conceded, and total matches

### Requirement 4

**User Story:** As a user, I want to see my own team highlighted in the rankings, so that I can quickly identify my team's position.

#### Acceptance Criteria

1. WHEN any ranking is displayed AND the current user's team appears in the top 5 THEN the system SHALL highlight the user's team with a distinct visual style
2. WHEN the user's team is highlighted THEN it SHALL use a different background color or border to distinguish it from other teams
3. WHEN the user's team does not appear in the top 5 THEN the system SHALL display a message indicating the user's current ranking position

### Requirement 5

**User Story:** As a user, I want the ranking system to handle edge cases gracefully, so that I have a consistent experience regardless of data availability.

#### Acceptance Criteria

1. WHEN there are fewer than 5 teams with statistics THEN the system SHALL display all available teams in the ranking
2. WHEN a team has zero matches THEN it SHALL be excluded from win rate, average point, and average goals conceded rankings
3. WHEN teams have identical ranking values THEN they SHALL be sorted by total matches (descending) as a tiebreaker
4. WHEN no teams have statistics THEN the system SHALL display a message indicating no ranking data is available
5. WHEN the ranking data is loading THEN the system SHALL show a loading indicator
6. WHEN displaying goals conceded rankings THEN teams with lower values SHALL be ranked higher (1st place for lowest goals conceded)

### Requirement 6

**User Story:** As a user, I want responsive design for the ranking system, so that I can view rankings on both desktop and mobile devices.

#### Acceptance Criteria

1. WHEN the ranking page is viewed on mobile devices THEN the layout SHALL adapt to smaller screen sizes
2. WHEN the ranking tabs are displayed on mobile THEN they SHALL remain easily tappable and readable
3. WHEN team information is displayed on mobile THEN all essential data SHALL remain visible without horizontal scrolling