# Week 6 Data Sources

This file documents the data sources for the official FIFA Fantasy data sprint.

The main rule for Week 6 is:

Official FIFA Fantasy data should be the source of truth for player pool, prices, positions, and fantasy rules.

If a field does not come from FIFA, the website should label it as helper data, matched data, estimated data, or `needs_check`.

## Official FIFA Fantasy Sources

### FIFA World Cup Fantasy game

Link:

https://play.fifa.com/fantasy/

Used for:

- official FIFA Fantasy game page
- player pool visibility
- player price examples
- position examples
- budget display
- deadline display
- source rows for `data/fifaFantasyPlayers.json`

Important note:

This page is a JavaScript app. Some detailed rules were not visible from basic page text. If the rule is not clearly visible, it should be marked as `needs_check`.

### FIFA World Cup Fantasy help page

Link:

https://play.fifa.com/fantasy/help

Used for:

- official help/rules page to check

Important note:

This page is also a JavaScript app. The detailed help text was not visible from basic page text during this check. Rules from this page should only be added when we can clearly see them.

### FIFA World Cup Fantasy team/player pool page

Link:

https://play.fifa.com/fantasy/team

Official JSON files referenced by the FIFA Fantasy app:

https://play.fifa.com/json/fantasy/players.json

https://play.fifa.com/json/fantasy/squads.json

Used for:

- official FIFA Fantasy player pool
- player display names
- national team codes
- official fantasy positions
- official fantasy prices
- official player status
- official team/country mapping from squad IDs

File created:

`data/fifaFantasyPlayers.json`

Important note:

The official FIFA Fantasy app references public JSON data files. `players.json` contains the full official fantasy player pool used in the app, and `squads.json` maps each `squadId` to a country name and abbreviation.

Club and league are not included in the official fantasy player JSON, so those fields stay `null` until another reputable source is matched later.

### FIFA World Cup Fantasy launched article

Link:

https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/world-cup-fantasy-game-launched

Used for:

- official squad size
- official position requirements
- official starting budget
- official group-stage nation limit
- official knockout budget increase
- official note that player prices do not fluctuate
- official substitutions and captain switching summary
- official booster names
- official transfer summary
- official scoring categories

## FIFA World Cup 2026 Team Sources

### FIFA World Cup 2026 teams page

Link:

https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/teams/

Used for:

- official FIFA World Cup 2026 team pages
- team qualification context
- group information where visible
- FIFA world ranking context where visible

### FIFA qualified teams article

Link:

https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/world-cup-2026-who-has-qualified

Used for:

- official list of 48 qualified teams
- confederation qualification context

### FIFA match schedule page

Link:

https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums

Used for:

- official group fixture context
- checking group assignments through scheduled matches

### Associated Press World Cup group breakdown

Link:

https://apnews.com/article/world-cup-soccer-2026-cb70708367cc68bd94edff66416b3c7d

Used for:

- complete group breakdown from Group A through Group L
- FIFA rankings listed beside each team
- tournament format summary

File created:

`data/teams.json`

Important note:

`data/teams.json` includes all 48 qualified teams. `team_elo` and `pele_rating` are currently `null` because a complete verified World Football Elo or PELE ratings table for all 48 teams was not added in this pass.

## FIFA World Cup 2026 Fixture Sources

### FIFA match schedule page

Link:

https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums

Used for:

- preferred official fixture source
- checking fixture context
- checking group-stage schedule details where visible

Important note:

The FIFA page was checked first, but the page text was not available in a reusable complete table during this pass.

### FIFA Fantasy team page

Link:

https://play.fifa.com/fantasy/team

Used for:

- checking early matchday fixture text visible in the Fantasy game/player pool page

Important note:

The FIFA Fantasy page is a JavaScript app. It showed indexed fixture text for early matches, but not a reusable full group-stage data file.

### openfootball World Cup 2026 JSON

Link:

https://github.com/openfootball/worldcup.json

Raw data:

https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json

Used for:

- complete reusable group-stage fixture data
- fixture dates
- local kickoff times
- UTC offsets
- home and away teams
- group labels
- city or host-area field

File created:

`data/fixtures.json`

Important note:

`data/fixtures.json` includes 72 group-stage fixtures. `match_number` and `venue` are currently `null` because the reusable openfootball rows did not include official group-stage match numbers or stadium names as separate fields.

## FIFA World Cup 2026 Matchday Sources

### FIFA Fantasy indexed matchday text

Links:

- https://play.fifa.com/fantasy/team
- https://play.fifa.com/en/

Used for:

- checking official FIFA Fantasy Matchday 1 deadline text
- checking visible Round 1 fixture text

Important note:

FIFA indexed text shows `Matchday 1 Deadline: 11 June, 20:00` in Play Zone. The FIFA Fantasy team page also shows `Transfers deadline: 11 June, 19:00`. The time zone and the difference between these two visible deadline times need checking in the live app.

### Fixture-based prototype grouping

Source file:

`data/fixtures.json`

Used for:

- creating `data/matchdays.json`
- grouping each team's first group-stage fixture as Matchday 1
- grouping each team's second group-stage fixture as Matchday 2
- grouping each team's third group-stage fixture as Matchday 3
- grouping all 72 fixtures as Full group stage

File created:

`data/matchdays.json`

Important note:

Official FIFA Fantasy Matchday 2 and Matchday 3 windows were not clearly visible in this pass. Those matchdays are prototype groupings based on `data/fixtures.json`, not confirmed official FIFA Fantasy matchday windows.

## Official Rules Confirmed From FIFA

The following rules are confirmed from visible FIFA sources:

- Squad size is 15 players.
- Squad positions are 2 goalkeepers, 5 defenders, 5 midfielders, and 3 forwards.
- Starting budget is `$100m`.
- An extra `$5m` budget is added for the knockout stage.
- Player prices do not fluctuate during the tournament.
- The group stage starts with a maximum of 3 players from the same nation.
- Nation limits change during the tournament, but the exact later-round limits need checking from the official help page.
- Unlimited changes are allowed until the first FIFA World Cup match on Thursday, 11 June.
- Unlimited transfers are available before Matchday 1 and before the Round of 32.
- Other stages have transfer limits, but the exact limits need checking.
- Users can make bench substitutions during each Matchday.
- Users can switch captains during each Matchday.
- Five boosters are available: Wildcard, 12th Man, Maximum Captain, Qualification Booster, and Mystery Booster.
- Mystery Booster will be revealed ahead of the Round of 32.
- Scoring is based on minutes played, goals scored/conceded, assists, cards, own goals, penalties won/conceded, tackles, chances created, and shots on target.
- Direct free-kick goals and scouting bonus can earn additional points.

## Rules Marked As Needs Check

The following rules were not clear enough from visible official source text:

- exact max players per nation for Round of 32
- exact max players per nation for Round of 16
- exact max players per nation for quarter-finals
- exact max players per nation for semi-finals
- exact max players per nation for the final
- exact number of free transfers by round after Matchday 1
- whether extra transfers cost points, and how many
- whether transfers can roll over
- exact booster mechanics
- whether only one booster can be active at a time
- exact scoring point values
- exact starting lineup and formation rules
- vice-captain rules
- automatic substitution rules
- deadline time zone
- whether the official player pool has finished updating after the 2 June final squad confirmation date

## Current Non-Official Project Sources

The older project still has these prototype data sources:

- `players.json`
- `transfermarktPlayers.csv`
- root-level `dataSources.md`

These are useful for the prototype, but they are not official FIFA Fantasy sources.

### Older player source

GitHub source:

https://github.com/mondriaj/FPL-Core-Insights

Used before Week 6 for:

- player names
- clubs
- positions
- FPL-style prices
- helper performance data

Important note:

This is Fantasy Premier League data, not official FIFA World Cup Fantasy data.

### Older country source

File:

`transfermarktPlayers.csv`

Used before Week 6 for:

- country matching

Important note:

This file helped improve the prototype, but official FIFA Fantasy should now become the main source for player country/nation.

## Data Honesty Rule

Official FIFA Fantasy should be used for:

- player pool
- player prices
- player positions
- fantasy rules

Everything else should be clearly labeled:

- `official_confirmed`
- `needs_check`
- `helper_data`
- `matched_data`
- `prototype_estimate`

The website should not make guessed data look official.

## Club Performance Sources

### FPL-Core-Insights

GitHub source:

https://github.com/mondriaj/FPL-Core-Insights

Local files used:

- `FPL-Core-Insights-main/data/2025-2026/players.csv`
- `FPL-Core-Insights-main/data/2025-2026/teams.csv`
- `FPL-Core-Insights-main/data/2025-2026/playerstats.csv`

Used for:

- Premier League club names
- Premier League player minutes
- Premier League player starts
- Premier League goals
- Premier League assists
- Premier League clean sheets
- Premier League yellow cards
- Premier League red cards

Important note:

This source was only used when a visible official FIFA Fantasy player could be clearly matched to a Premier League player in the local FPL-Core-Insights data.

### ESPN and OneFootball

Potential sources:

- https://www.espn.com/soccer/
- https://onefootball.com/

Used for:

- Future club performance checks if exact player profile data is needed.

Important note:

No ESPN or OneFootball numbers were copied into `data/playerClubPerformance.json` in this pass. If exact stats are not easy to verify, the website keeps those fields as `null`.

## Club Performance Data Honesty Rule

Do not invent club performance numbers.

If a player cannot be matched to a reliable club performance row, keep the player in `data/players.json`, but mark the club performance quality as lower.

## National Team Performance Sources

File created:

`data/playerNationalTeamPerformance.json`

### UEFA European Qualifiers

Main source:

https://www.uefa.com/european-qualifiers/

Used for:

- European national team qualifying appearances
- minutes played
- goals
- assists
- yellow cards
- red cards

Important note:

UEFA player pages were the strongest source in this pass because they showed player-level qualifying stats.

Starts and player-specific clean sheets were not clearly visible on the checked player pages, so those fields are `null`.

### FIFA CONMEBOL Qualifying Article

Source:

https://www.fifa.com/en/articles/conmebol-south-american-qualifying-world-cup-2026-goals-top-scorers-goalscorers

Used for:

- CONMEBOL qualifying goal totals

Important note:

This source was useful for goals, but it did not provide every field needed for the website.

### FIFA CAF Qualifying Articles

Sources:

https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/mohamed-salah-qualifying-profile-records

https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/african-qualifying-stats

Used for:

- Mohamed Salah's World Cup qualifying goal total

Important note:

These sources did not provide full player-level minutes, starts, assists, or cards for this website pass.

### ESPN Team And Player Stat Pages

Source:

https://www.espn.com/soccer/

Used for:

- visible CONMEBOL appearances
- visible CONMEBOL goals
- visible CONMEBOL assists
- visible CONMEBOL card counts where shown

Important note:

ESPN pages were difficult to open directly because they may require JavaScript or bot checks. Only clearly visible search-indexed snippets were used. Missing fields stay `null`.

## National Team Performance Data Honesty Rule

Do not invent national team performance numbers.

If only goals or appearances are visible, include those and leave the rest as `null`.

If a full player source is not available, mark the row as partial instead of pretending it is complete.

## Added Defensive Fantasy Player Rows

Source:

https://www.rotowire.com/soccer/article/2026-fifa-world-cup-fantasy-rankings-best-picks-for-matchday-1-116025

Used for:

- extra goalkeeper rows
- extra defender rows
- fantasy position
- fantasy price
- opening fixture context

Important note:

These rows were added because the official FIFA Fantasy page is a JavaScript app and the directly visible FIFA player rows only included midfielders and forwards.

RotoWire's 2026 FIFA World Cup Fantasy rankings list player fantasy positions and prices, but these added rows are marked in the data notes as `needs_direct_fifa_check`.

They should be directly verified inside the official FIFA Fantasy app when the full player pool can be copied or exported.

## Fixture Difficulty And Score Prediction Sources

Files created:

- `data/fixtureDifficulty.json`
- `data/scorePredictions.json`

Source files used:

- `data/fixtures.json`
- `data/teams.json`

Team-strength source used:

- FIFA ranking from `data/teams.json`

Important note:

`team_elo` and `pele_rating` are currently `null` in `data/teams.json`, so this pass uses FIFA ranking as the available team-strength input.

The model converts FIFA ranking into a prototype rating:

`prototype_team_rating = 2200 - fifa_ranking * 10`

This means a lower/better FIFA ranking creates a higher team rating.

## Fixture Difficulty Prototype Model

For each team in each fixture:

`rating_gap = team_rating - opponent_rating`

Difficulty labels:

- `easy`: rating gap is 150 or higher
- `favorable`: rating gap is 50 to 149
- `medium`: rating gap is -49 to 49
- `difficult`: rating gap is -149 to -50
- `very difficult`: rating gap is -150 or lower

## Score Prediction Prototype Model

The score prediction model uses:

`base_goals = 1.35`

`team_xg = base_goals + rating_gap / 400`

`opponent_xg = base_goals - rating_gap / 400`

Expected goals are capped between `0.4` and `3.2`.

Important note:

This is a simple prototype model based on team strength ratings.

It does not use betting odds.

It is not an official FIFA prediction.
