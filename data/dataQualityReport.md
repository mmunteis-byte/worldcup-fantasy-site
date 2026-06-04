# Data Quality Report

## Official FIFA Fantasy Player Data Check

Date checked:

2026-06-04

Official sources checked:

- https://play.fifa.com/fantasy/
- https://play.fifa.com/fantasy/help
- https://play.fifa.com/fantasy/team

## Official Fantasy Players Found

Official fantasy players added to:

`data/fifaFantasyPlayers.json`

Count:

21 official fantasy player rows

## Rebuilt Website Player File

Official fantasy players were used to create:

`data/players.json`

Counts:

- Number of official fantasy players: 21
- Number of players with prices: 21
- Number of players with positions: 21
- Number of players missing club: 21
- Number of players missing league: 21

Important note:

`data/players.json` now uses `data/fifaFantasyPlayers.json` as the source of truth. The `position` field comes from `official_fantasy_position`, and the price comes from `official_price`.

Club and league are `null` because they were not visible in the checked official FIFA Fantasy player pool text.

## FIFA World Cup 2026 Teams File

Team data was added to:

`data/teams.json`

Counts:

- Number of teams: 48
- Number of groups: 12
- Teams per group: 4
- Number of teams marked qualified: 48
- Number of teams with FIFA ranking: 48
- Number of teams with World Football Elo rating: 0
- Number of teams with PELE rating: 0

What is complete:

- all 48 teams are included
- every team has a `team_id`
- every team has a country name
- every team has a group from A through L
- every team has `qualified: true`
- every team has a FIFA ranking from a reputable published group breakdown

What is missing:

- `team_elo` is currently `null` for every team
- `pele_rating` is currently `null` for every team

Why ratings are missing:

A complete verified World Football Elo or PELE ratings table for all 48 teams was not added in this pass. These fields should stay `null` until a clear source is checked and documented.

## FIFA World Cup 2026 Group Fixtures File

Fixture data was added to:

`data/fixtures.json`

Counts:

- Number of group-stage fixtures: 72
- Number of fixtures with dates: 72
- Number of fixtures with local kickoff times: 72
- Number of fixtures with time zones: 72
- Number of fixtures with home and away team IDs: 72
- Number of fixtures with stage: 72
- Number of fixtures with group: 72
- Number of fixtures with city or host-area field: 72
- Number of fixtures with match number: 0
- Number of fixtures with venue: 0

What is complete:

- all 72 group-stage fixtures are included
- every fixture has a generated `match_id`
- every fixture has a matchday label from the source data
- every fixture has a date
- every fixture has a local kickoff time
- every fixture has a UTC offset
- every fixture has home and away team names
- every fixture has home and away team IDs mapped to `data/teams.json`
- every fixture has `stage: group_stage`
- every fixture has a group from A through L

What is missing:

- `match_number` is currently `null` for every group-stage fixture
- `venue` is currently `null` for every group-stage fixture

Why fields are missing:

The reusable openfootball source provided group-stage teams, dates, times, UTC offsets, groups, and host city/area data, but it did not provide official group-stage match numbers or stadium names as separate fields.

The FIFA official schedule page was checked first as the preferred source, and the FIFA Fantasy page was checked for matchday data, but a reusable complete official fixture table was not visible in this pass.

## FIFA Fantasy Matchdays File

Matchday data was added to:

`data/matchdays.json`

Counts:

- Number of matchday records: 4
- Matchday 1 fixtures: 24
- Matchday 2 fixtures: 24
- Matchday 3 fixtures: 24
- Full group stage fixtures: 72
- Matchday records with start dates: 4
- Matchday records with end dates: 4
- Matchday records with deadline: 1

What is complete:

- `Matchday 1` includes every team's first group-stage fixture
- `Matchday 2` includes every team's second group-stage fixture
- `Matchday 3` includes every team's third group-stage fixture
- `Full group stage` includes all 72 group-stage fixtures
- all fixture IDs come from `data/fixtures.json`

What is official:

- FIFA Play Zone indexed text shows `Matchday 1 Deadline: 11 June, 20:00`

What needs checking:

- the Matchday 1 deadline time zone
- why the FIFA Fantasy team page also shows `Transfers deadline: 11 June, 19:00`
- official FIFA Fantasy Matchday 2 deadline
- official FIFA Fantasy Matchday 3 deadline
- whether FIFA's official fantasy matchday windows exactly match the prototype fixture groupings

Why some matchday fields are prototype:

Official FIFA Fantasy matchday windows were not clearly extractable in this pass. Matchday 1, Matchday 2, and Matchday 3 were therefore grouped from `data/fixtures.json` using each team's first, second, and third group-stage fixtures.

## What Was Found

The official FIFA Fantasy player pool was visible in search-indexed text for part of the player list.

For those visible players, the following fields were available:

- display name
- national team code
- fantasy position
- official fantasy price
- first visible fixture/opponent code

## What Was Not Found

The following fields were not visible from the checked official page text:

- `fifa_fantasy_id`
- full official player ID
- club
- league
- selectable status
- full official player pool

These fields were set to `null` when missing.

## Current Quality Status

Status:

Partial official data only.

The file is valid JSON and uses official visible FIFA Fantasy player rows, but it is not the full official player pool.

## Why The Full List Was Not Collected Automatically

The FIFA Fantasy pages are JavaScript app pages.

When checked directly, the pages returned:

`You need to enable JavaScript to run this app.`

No easy public download button or clearly documented official data API was visible during this check.

## Easiest Legal Manual Or Semi-Manual Collection Method

The easiest legal next step is manual or semi-manual collection from the official FIFA Fantasy player pool in the browser.

Suggested method:

1. Open https://play.fifa.com/fantasy/team in a browser.
2. Use the visible Player Pool table.
3. Sort or filter by position if the app allows it.
4. Copy player rows into a CSV file.
5. Use this CSV format:

```text
name,country,team_id,official_fantasy_position,official_price,club,league,selectable_status
```

6. Leave unknown fields blank.
7. Convert the CSV into `data/fifaFantasyPlayers.json`.

Important:

Only copy data that is visible to you in the official FIFA Fantasy app. Do not bypass login, access controls, rate limits, or website rules.

## Data Honesty Rule

Do not invent:

- official prices
- official positions
- official player names
- official IDs
- official club or league data

If a field is not visible, use `null` or `needs_check`.

## Club Performance Data

File:

`data/playerClubPerformance.json`

Created from:

- official FIFA Fantasy visible player list
- local FPL-Core-Insights 2025-2026 Premier League data

## Club Performance Match Rates

Official FIFA Fantasy players in current data file:

21

Players matched to club performance:

5

Players unmatched:

16

Leagues with strong data in this pass:

- Premier League

Leagues with weak or missing data in this pass:

- La Liga
- Bundesliga
- Serie A
- Ligue 1

## Matched Players

The following players were matched to exact local Premier League performance rows:

- Haaland, Man City
- Mohamed Salah, Liverpool
- Saka, Arsenal
- Bruno Fernandes, Man Utd
- Díaz, Liverpool

## Unmatched Players

Players without a reliable club performance match were kept in `data/playerClubPerformance.json`, but their performance fields are set to `null`.

This is intentional.

The website should not invent:

- minutes
- starts
- goals
- assists
- clean sheets
- yellow cards
- red cards

## Club Data Quality Notes

`data/players.json` was also updated:

- matched Premier League players now have club and league filled in
- unmatched players remain in the official FIFA Fantasy player pool
- unmatched players are marked with lower club data quality

## National Team Performance Data

File:

`data/playerNationalTeamPerformance.json`

Created from:

- official FIFA Fantasy visible player list
- UEFA European Qualifiers player stats
- FIFA CONMEBOL qualifying top-scorer article
- FIFA CAF qualifying articles
- visible ESPN team/player stat snippets

## National Team Performance Match Rates

Official FIFA Fantasy players in current data file:

21

Players matched to some national team performance data:

21

Players unmatched:

0

Rows with stronger player-level data:

13 UEFA rows with visible player-level stats from UEFA.

Additional matched player-level row:

1 Bruno Fernandes row using visible FBref and ESPN stat snippets.

Rows with partial data:

7 rows using FIFA or ESPN snippets where only some fields were visible.

## Strongest Sources

The strongest source in this pass was UEFA European Qualifiers because it showed player-level fields such as:

- appearances
- minutes
- goals
- assists
- yellow cards
- red cards

## Weakest Countries Or Confederations For Data

The weakest data in this pass came from:

- CONMEBOL players, because complete minutes and starts were not easy to verify from the available visible sources
- CAF player data for Egypt, because Mohamed Salah's goal total was visible but full player-level minutes, starts, assists, and cards were not

## National Team Data Quality Notes

The file does not invent missing values.

If a source did not clearly show a field, that field is `null`.

Starts and player-specific clean sheets are mostly `null` because the checked sources did not clearly provide those fields for the players.

`data/players.json` was also updated so each player has a `national_team_data_quality` value based on the quality of the matched national team performance row.

## Player Recommendation Quality Labels

File updated:

`data/players.json`

The quality labels were revised so the website can recommend players more carefully.

## Data Quality Counts

`data_quality` groups:

- high: 3
- medium: 18
- low: 0
- unknown: 0

`club_data_quality` groups:

- high: 5
- medium: 0
- low: 0
- unknown: 16

`national_team_data_quality` groups:

- high: 14
- medium: 6
- low: 1
- unknown: 0

`recommendation_status` groups:

- eligible: 3
- caution: 18
- limited: 0
- avoid: 0

## How The Labels Are Used

High `data_quality` means:

- the player is in the official FIFA Fantasy pool
- the player has an official price
- the player has an official fantasy position
- useful club performance data was found
- useful national team or qualifying data was found

Medium `data_quality` means:

- the player is in the official FIFA Fantasy pool
- the player has an official price and position
- some performance data is missing or partial

No official FIFA Fantasy player was deleted because of weak supporting data.

## Examples Of Strong Data

These players currently have strong overall data:

- Haaland
- Saka
- Bruno Fernandes

They have official fantasy data, useful club performance data, and useful national team performance data.

## Examples Of Weaker Or Partial Data

These players are still useful, but should be shown with caution:

- Kane: strong national team data, but club performance data has not been matched yet
- Mbappé: strong national team data, but club performance data has not been matched yet
- Messi: partial national team data and no matched club performance row yet
- Vinícius Júnior: partial national team data and no matched club performance row yet
- Mohamed Salah: strong club data, but only limited national team qualifying data was found
- Díaz: strong club data, but only partial national team qualifying data was found

## Recommendation Status Notes

`eligible` players can be recommended normally.

`caution` players can still be recommended, but the website should make it clear that some supporting data is incomplete.

No players are currently marked `limited` or `avoid` because every current player is from the official FIFA Fantasy pool and has at least some usable data.

## Fixture Difficulty And Score Prediction Data

Files:

- `data/fixtureDifficulty.json`
- `data/scorePredictions.json`

Created from:

- `data/fixtures.json`
- `data/teams.json`

## Fixture Difficulty Counts

Total group-stage fixtures:

72

Fixture difficulty rows:

144

There are two fixture difficulty rows per match because each team gets its own difficulty rating.

Difficulty counts:

- easy: 52
- favorable: 17
- medium: 6
- difficult: 17
- very difficult: 52

## Score Prediction Counts

Score prediction rows:

72

Prediction label counts:

- home_team_edge: 37
- away_team_edge: 29
- close_match: 6

## Rating Source Used

The model uses FIFA ranking from `data/teams.json`.

`team_elo` and `pele_rating` are currently missing for all teams, so the model uses a simple prototype rating:

`prototype_team_rating = 2200 - fifa_ranking * 10`

## Model Quality Notes

This model is useful for a Week 6 prototype because every team has a FIFA ranking.

However, it is not a full football prediction model.

It does not include:

- injuries
- lineup strength
- player availability
- tactical matchups
- venue effects
- travel
- recent form beyond the ranking source
- betting odds

The model should be shown on the website as a prototype team-strength model, not as an official prediction.
