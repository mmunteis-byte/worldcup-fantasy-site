# Week 6 Official FIFA Fantasy Data Plan

This plan is for the Week 6 official FIFA Fantasy data sprint.

The goal is to make the official FIFA World Cup Fantasy game the source of truth for:

- player pool
- player prices
- player positions
- fantasy rules

After that, the website can add extra helper data from other sources, such as club performance, national team performance, fixtures, fixture difficulty, and simple score predictions.

## Current Project Structure

The website is currently a simple static site in the main folder of the repository.

Current main files:

- `index.html`
- `style.css`
- `script.js`
- `players.json`
- `fantasyRules.json`
- `dataSources.md`
- `rulesSources.md`
- `transfermarktPlayers.csv`
- `README.md`

There is no separate `data/` folder yet. All data files currently sit in the root folder beside the website files.

This has worked for the prototype, but Week 6 will need more data files. A `data/` folder will make the project easier to understand and safer to update.

## Current Data Files

### `players.json`

This is the main player database used by the website right now.

Current player count:

- 830 players

Current position counts:

- 96 goalkeepers
- 268 defenders
- 373 midfielders
- 93 forwards

Current country status:

- 562 players have matched country data
- 268 players still have `needs_check`

Important note:

The current players are not official FIFA World Cup Fantasy players.

They mostly come from Fantasy Premier League source data, with country data matched from `transfermarktPlayers.csv`.

### `transfermarktPlayers.csv`

This file is currently used to add country data to players from the FPL-based player list.

It helps with country matching, but it is not the official FIFA Fantasy player pool.

### `dataSources.md`

This documents the current data sources.

Right now it says the main player names, clubs, positions, and prices come from:

- FPL-Core-Insights
- `players.csv`
- `teams.csv`
- `playerstats.csv`

It also says country data comes from:

- `transfermarktPlayers.csv`

This file will need to be updated after the official FIFA Fantasy data sprint.

## Current Fantasy Rules File

### `fantasyRules.json`

This file currently stores Week 5 draft rules.

Current status:

```json
"rules_status": "Draft rules based on past tournament fantasy games. Not official FIFA World Cup 2026 fantasy rules."
```

The file currently includes:

- 15-player squad
- 2 GK, 5 DEF, 5 MID, 3 FWD
- 100 fantasy unit budget
- max 3 players per country in the group stage
- captain required
- 2x captain multiplier
- allowed formations
- validation checks

This was good for Week 5, but Week 6 should compare each rule against official FIFA Fantasy sources and update the file where official rules are available.

## Do Players Currently Use Official FIFA Fantasy Data?

No.

The current player database does not use the official FIFA Fantasy game as the source of truth.

Current fields that are not official FIFA Fantasy data:

- `price`
- `position`
- `attack_score`
- `defense_score`
- `risk_score`
- `short_reason`
- `team_elo`

Some player names, clubs, and positions come from real FPL source data, but that is still Premier League fantasy data, not World Cup fantasy data.

For Week 6, official FIFA Fantasy should replace the current player pool, prices, and positions if we can access or export the official data safely.

## Missing Data Files

These files do not exist yet but will probably be needed for Week 6:

- `data/officialFifaPlayers.json`
- `data/officialFifaRules.json`
- `data/officialFifaRawPlayers.json`
- `data/playerNameMatches.json`
- `data/clubPerformance.json`
- `data/nationalTeamPerformance.json`
- `data/fixtures.json`
- `data/matchdays.json`
- `data/fixtureDifficulty.json`
- `data/scorePredictions.json`
- `data/dataAudit.json`

The exact names can change, but the idea should stay the same:

- keep official data separate
- keep helper data separate
- keep raw downloaded/exported data separate from cleaned website data

## Proposed Data Folder Structure

Recommended Week 6 structure:

```text
data/
  raw/
    fifaFantasyPlayersRaw.json
    fifaFantasyRulesNotes.md
    espnFixturesRaw.json
    oneFootballFixturesRaw.json
    clubStatsRaw.csv
    nationalTeamStatsRaw.csv

  processed/
    officialPlayers.json
    officialRules.json
    fixtures.json
    matchdays.json
    fixtureDifficulty.json
    scorePredictions.json
    playerResearch.json

  matching/
    playerNameMatches.json
    unmatchedPlayers.json
    matchedPlayersAudit.json

  docs/
    sourceNotes.md
    dataDictionary.md
```

Simple version if we want fewer folders:

```text
data/
  officialPlayers.json
  officialRules.json
  fixtures.json
  fixtureDifficulty.json
  scorePredictions.json
  playerNameMatches.json
```

For a beginner project, the simple version is probably best.

## Official FIFA Fantasy Sources To Check

### Official FIFA Fantasy game

Source:

https://play.fifa.com/fantasy/team

Use for:

- official player pool
- official player prices
- official player positions
- official country/team for each player
- budget display
- squad limits
- formation and captain rules if available inside the game

Important note:

This page is a JavaScript app. It may not show all data in normal page source. We may need to inspect browser network requests, exported app data, or manually downloaded data if the site allows it.

### FIFA article announcing 2026 Fantasy

Source:

https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/world-cup-fantasy-game-launched

Use for:

- confirming the official game is live
- confirming the 15-player squad rule
- confirming 2 GK, 5 DEF, 5 MID, 3 FWD
- confirming the $100 million starting budget
- confirming same-country limits start at 3 players per country in the group stage
- confirming the knockout budget increase
- confirming that prices do not fluctuate during the tournament

### Official FIFA World Cup pages

Source:

https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026

Use for:

- official teams
- official fixtures
- official groups
- official standings
- tournament structure

## ESPN Sources To Check

### ESPN World Cup fixtures

Source:

https://global.espn.com/football/fixtures?league=fifa.world

Use for:

- match schedule
- dates
- kickoff times
- venues
- opponents

### ESPN team squad pages

Example source:

https://www.espn.com/soccer/team/squad/_/id/660/united-states

Use for:

- squad lists
- player ages
- player positions
- national team rosters

Important note:

Some ESPN pages may block automated access or require JavaScript. If that happens, use ESPN manually in the browser or use another source for the same information.

### ESPN team stats and player stats

Use for:

- recent team performance
- goals
- assists
- appearances
- defensive records
- form indicators

Only use ESPN data if it can be accessed clearly and documented.

## OneFootball Sources To Check

### OneFootball World Cup competition pages

Example source:

https://onefootball.com/en/competition/fifa-world-cup-12

Use for:

- fixtures
- results
- standings
- team news
- lineup/news context

### OneFootball team squad pages

Example source:

https://onefootball.com/en/team/grecia-44/squad

Use for:

- squad pages where available
- player list comparison
- team news and injury context

Important note:

OneFootball is useful as a supporting source, not the main source of truth for official fantasy prices or positions.

## Other Sources We Can Use

### Official FIFA match schedule and standings

Best for:

- official fixtures
- official groups
- official results once the tournament starts

### Football-data or open football repositories

Possible use:

- fixtures
- historical results
- team names
- group structure

Only use these if they are easier to load into the website and have clear licenses.

### Club performance sources

Possible sources:

- FBref
- Statbunker
- Kaggle datasets
- league websites
- club competition data

Use for:

- player club form
- minutes played
- goals
- assists
- clean sheets
- recent appearances

This data should be treated as helper data, not official fantasy data.

### National team performance sources

Possible sources:

- FIFA rankings
- World Cup qualifying tables
- World Cup qualifying results
- recent international fixtures

Use for:

- team strength
- attack strength
- defense strength
- fixture difficulty

### Manual CSV fallback

If official FIFA Fantasy data cannot be downloaded directly, create a manual CSV from the official game.

Possible file:

`data/officialFifaPlayersManual.csv`

Suggested columns:

- `official_id`
- `name`
- `country`
- `position`
- `price`
- `club`
- `source_url`
- `last_checked`

This is slower, but it keeps the data honest because each row still comes from the official FIFA Fantasy game.

## Exact Tasks In Order

### Task 1: Freeze the current Week 5 site

Check that the current project is saved in GitHub before changing data.

Commands to use later:

```bash
git status
git add .
git commit -m "save week 5 before official data sprint"
git push
```

Only commit if there are unsaved changes.

### Task 2: Create the Week 6 data folder

Create:

```text
data/
```

Then decide whether to use the simple structure or the larger structure.

Recommended beginner version:

```text
data/
  officialPlayers.json
  officialRules.json
  fixtures.json
  fixtureDifficulty.json
  scorePredictions.json
  playerNameMatches.json
```

### Task 3: Capture official FIFA Fantasy rules

Check the official FIFA Fantasy game and FIFA article.

Update or replace:

- `fantasyRules.json`

Possible new file:

- `data/officialRules.json`

Keep:

- `rulesSources.md`

Update it so it clearly says which rules are now official and which are still assumptions.

### Task 4: Capture official FIFA Fantasy players

Use the official FIFA Fantasy game for:

- player names
- countries
- positions
- prices

Create:

- `data/officialPlayers.json`

Do not merge helper scores yet.

First version should be clean and boring:

```json
{
  "id": "",
  "name": "",
  "country": "",
  "position": "",
  "price": 0,
  "source": "FIFA World Cup Fantasy",
  "last_checked": ""
}
```

### Task 5: Compare official players to the current `players.json`

Create a matching file:

- `data/playerNameMatches.json`

This should connect official FIFA players to the older FPL-based players where possible.

Example:

```json
{
  "official_name": "Kylian Mbappe",
  "official_country": "France",
  "matched_old_player_id": "",
  "match_status": "matched",
  "match_note": "Exact name match"
}
```

### Task 6: Replace the website player source

Change the website so it loads official players first.

The website should no longer treat FPL players as the main player pool.

Old FPL data can still be used as helper data only if matched carefully.

### Task 7: Add fixtures and matchdays

Create:

- `data/fixtures.json`
- `data/matchdays.json`

Use official FIFA fixtures first.

ESPN and OneFootball can help check the schedule, times, and team pages.

### Task 8: Add national team strength

Create:

- `data/nationalTeamPerformance.json`

Possible fields:

- `country`
- `fifa_ranking`
- `qualifying_wins`
- `qualifying_draws`
- `qualifying_losses`
- `qualifying_goals_for`
- `qualifying_goals_against`
- `recent_form_note`

Keep it simple at first.

### Task 9: Add fixture difficulty

Create:

- `data/fixtureDifficulty.json`

Simple logic:

- strong opponent = harder fixture
- weak opponent = easier fixture
- neutral venue for World Cup
- use team strength and recent form

Example scale:

- 1 = easy
- 2 = medium-easy
- 3 = medium
- 4 = hard
- 5 = very hard

### Task 10: Add simple score predictions

Create:

- `data/scorePredictions.json`

This should be simple and clearly labeled as a prediction.

Possible fields:

- `match_id`
- `home_country`
- `away_country`
- `predicted_home_goals`
- `predicted_away_goals`
- `prediction_note`

Do not present predictions as facts.

### Task 11: Rebuild player advice

After official players, fixtures, and difficulty are loaded, update the website advice.

Better player advice should consider:

- official price
- official position
- country
- fixture difficulty
- likely team strength
- club form if available
- national team performance if available

### Task 12: Update exports

The Export Team JSON button should include:

- official player data
- rules source
- fixture difficulty
- prediction source
- data warnings

### Task 13: Update documentation

Update:

- `dataSources.md`
- `rulesSources.md`
- `README.md`

The documentation should clearly explain:

- what comes from official FIFA Fantasy
- what comes from ESPN
- what comes from OneFootball
- what is estimated by the prototype

## Risks And Fallback Rules

### Risk 1: Official FIFA Fantasy data is hard to download

Fallback:

- manually export or copy the official player list into a CSV
- document the manual process
- include `last_checked`

### Risk 2: Official site data changes

Fallback:

- store the date each file was checked
- keep raw data files
- update in small commits

### Risk 3: Player names do not match across sources

Fallback:

- match by name and country first
- then use manual review
- store uncertain matches in `unmatchedPlayers.json`
- never guess silently

### Risk 4: ESPN blocks automated access

Fallback:

- use ESPN manually in the browser
- use OneFootball or FIFA pages as a backup
- document which source was used

### Risk 5: OneFootball data is incomplete

Fallback:

- use it only as a supporting source
- keep FIFA as the official source for tournament data

### Risk 6: Club performance data is not available for every player

Fallback:

- leave club form as `null`
- show a simple note like `club data unavailable`
- do not invent club form

### Risk 7: Predictions could look too official

Fallback:

- label predictions clearly as prototype estimates
- keep prediction notes visible
- do not call them official

### Risk 8: Website breaks when loading many data files

Fallback:

- load one file at a time
- test after each file
- keep the old working version in GitHub

## How To Test After Each Step

### After adding or moving data files

Run the local website:

```bash
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000/
```

Check:

- page loads
- no blank screen
- browser console has no JSON loading errors

### After updating official players

Check:

- Player Pool loads
- player count looks correct
- names look official
- positions show correctly
- prices show correctly
- country filters work

### After updating rules

Check:

- My XI builds a 15-player squad
- position counts follow the rules
- max spend is shown
- country limit works
- rule validation box shows PASS or FAIL correctly

### After adding fixtures

Check:

- fixture file loads
- matchdays are grouped correctly
- countries in fixtures match countries in player data

### After adding fixture difficulty

Check:

- each country has fixture difficulty data
- Player Picks can show easier or harder fixture notes
- missing fixture data shows a clear warning

### After adding predictions

Check:

- predictions are labeled as estimates
- no prediction is displayed as official
- player advice still loads if predictions are missing

### After each commit

Run:

```bash
git status
```

Then commit and push:

```bash
git add .
git commit -m "clear message"
git push
```

Then check:

- local website works
- GitHub repository has the new files
- GitHub Pages updates after a short wait

## Recommended Week 6 Commit Plan

Use small commits so it is easy to undo one step if needed.

Suggested commits:

1. `add week 6 official data plan`
2. `add official data folder structure`
3. `add official fifa fantasy rules`
4. `add official fifa fantasy players`
5. `match official players to helper data`
6. `load official players in website`
7. `add fixtures and matchdays`
8. `add fixture difficulty data`
9. `add simple score predictions`
10. `update data documentation`

## Week 6 Rule For Data Honesty

Official FIFA Fantasy data should be the source of truth for:

- player pool
- player prices
- player positions
- fantasy rules

Everything else should be clearly labeled as:

- helper data
- matched data
- estimated data
- prototype data

The website should never make estimated data look official.
