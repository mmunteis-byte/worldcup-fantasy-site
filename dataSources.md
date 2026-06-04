# Data Sources

This file explains where the data for my World Cup fantasy website comes from.

## Main Data Source

GitHub source:
https://github.com/mondriaj/FPL-Core-Insights

Downloaded folder used in this project:
`FPL-Core-Insights-main`

Data files used:

- `data/2025-2026/players.csv`
- `data/2025-2026/teams.csv`
- `data/2025-2026/playerstats.csv`

## Player Names

Player names come from:

`FPL-Core-Insights-main/data/2025-2026/players.csv`

Fields used:

- `first_name`
- `second_name`
- `web_name`

## Clubs

Club names come from:

`FPL-Core-Insights-main/data/2025-2026/teams.csv`

Fields used:

- `name`
- `short_name`
- `code`

The player file uses `team_code`, and the teams file uses `code`. These are matched together so each player can show the correct club.

## Positions

Player positions come from:

`FPL-Core-Insights-main/data/2025-2026/players.csv`

Field used:

- `position`

Example positions include:

- Goalkeeper
- Defender
- Midfielder
- Forward

## Prices

Player prices come from:

`FPL-Core-Insights-main/data/2025-2026/playerstats.csv`

Field used:

- `now_cost`

This is fantasy-style price data from the FPL data source.

## Country Or Team Strength

Player country data comes from:

`transfermarktPlayers.csv`

Field used:

- `country_of_citizenship`

If `country_of_citizenship` was missing, `country_of_birth` was available as a backup field.

Players were matched by name. Some players may still show `needs_check` if their name was written differently in the two sources or if they were missing from the country source.

Team strength data is available from:

`FPL-Core-Insights-main/data/2025-2026/teams.csv`

Fields available:

- `strength`
- `strength_overall_home`
- `strength_overall_away`
- `strength_attack_home`
- `strength_attack_away`
- `strength_defence_home`
- `strength_defence_away`
- `elo`

These fields can be used later to estimate which clubs or teams are stronger.

## Prototype Estimate Fields

The following fields are prototype fields unless they come directly from a data source:

- `attack_score`
- `defense_score`
- `risk_score`
- `short_reason`

This means they should not be treated as official data unless they are clearly calculated from the source files or added with a documented rule.

For now, these fields are helper estimates for the website prototype. They are meant to make the fantasy helper easier to understand, but they are not official player statistics by themselves.

## Important Note

The source data is Fantasy Premier League data, not official World Cup national-team data. It is still useful for this project because it provides real player names, clubs, positions, fantasy prices, and performance data.

## Week 6 Official FIFA Fantasy Data

Week 6 starts a new official FIFA Fantasy data sprint.

New official-data files are stored in:

- `data/fifaFantasyPlayers.json`
- `data/fantasyRules.json`
- `data/teams.json`
- `data/fixtures.json`
- `data/dataSources.md`
- `data/dataQualityReport.md`

Official FIFA Fantasy links checked:

- https://play.fifa.com/fantasy/
- https://play.fifa.com/fantasy/help
- https://play.fifa.com/fantasy/team
- https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums
- https://github.com/openfootball/worldcup.json

Important note:

The current `data/fifaFantasyPlayers.json` only includes official FIFA Fantasy player rows that were visible from the checked official player pool text. It is partial official data, not the full player pool yet.

If a field was not visible from FIFA, it was set to `null` or marked as `needs_check`.

The current `data/fixtures.json` includes the 72 World Cup 2026 group-stage fixtures from openfootball's reusable World Cup 2026 JSON. FIFA's official fixture page was checked first, but a complete reusable official table was not visible in this pass.
