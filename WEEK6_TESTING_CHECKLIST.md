# Week 6 Testing Checklist

Last updated: June 5, 2026

## Public And Data Loading

- [ ] Public site loads
- [ ] `data/fantasyRules.json` loads
- [ ] `data/fifaFantasyPlayers.json` loads
- [ ] `data/players.json` loads
- [ ] `data/teams.json` loads
- [ ] `data/fixtures.json` loads
- [ ] `data/matchdays.json` loads
- [ ] `data/playerClubPerformance.json` loads
- [ ] `data/playerNationalTeamPerformance.json` loads
- [ ] `data/fixtureDifficulty.json` loads
- [ ] `data/scorePredictions.json` loads

## Team Builder Rules

- [ ] Team builder uses official prices
- [ ] Team builder uses official positions
- [ ] Team builder uses official fantasy rules
- [ ] Team builder respects budget
- [ ] Team builder respects country limits
- [ ] Rule validation shows squad size check
- [ ] Rule validation shows position check
- [ ] Rule validation shows budget check
- [ ] Rule validation shows country limit check
- [ ] Rule validation shows captain check
- [ ] Rule validation explains whether the squad is legal

## Week 6 Features

- [ ] Matchday selector works
- [ ] Fixture difficulty appears
- [ ] Expected goals context appears
- [ ] Club performance appears where available
- [ ] National team performance appears where available
- [ ] Player data status appears
- [ ] Team data section appears
- [ ] Fixtures section appears
- [ ] Export Team JSON works

## GitHub Pages

- [ ] GitHub Pages version loads
- [ ] GitHub Pages version can load JSON data files
- [ ] GitHub Pages version matches the latest pushed code

## Week 6 Legal Squad Status

The original official FIFA Fantasy player file was incomplete. It had visible official `MID` and `FWD` rows, but not enough `GK` or `DEF` rows.

This has been improved for Week 6 testing by adding sourced goalkeeper and defender rows from RotoWire's 2026 FIFA World Cup Fantasy rankings.

These added rows still need direct FIFA-app verification.

## Data Still Needed For Full Official Verification

For a fully official final version, directly verify or replace the added RotoWire GK/DEF rows with official FIFA Fantasy player-pool rows.

The direct FIFA rows should include:

- 2 official `GK` players
- 5 official `DEF` players
- enough official `MID` and `FWD` players to keep choices flexible

Each row should come from the official FIFA Fantasy player pool and include:

- `name`
- `country`
- `team_id`
- `official_fantasy_position`
- `official_price`
- `roster_status`

Do not fill missing `GK` or `DEF` rows with unsourced prototype players unless they are clearly marked `not_in_fantasy_pool` and excluded from normal recommendations.

## Test Results From June 5, 2026

### Local File Tests

- [x] `script.js` syntax check passed
- [x] `data/fantasyRules.json` loads
- [x] `data/fifaFantasyPlayers.json` loads
- [x] `data/players.json` loads
- [x] `data/teams.json` loads
- [x] `data/fixtures.json` loads
- [x] `data/matchdays.json` loads
- [x] `data/playerClubPerformance.json` loads
- [x] `data/playerNationalTeamPerformance.json` loads
- [x] `data/fixtureDifficulty.json` loads
- [x] `data/scorePredictions.json` loads

### Local Browser Tests

- [x] Local site loads at `http://127.0.0.1:8020/`
- [x] No browser console errors on first load
- [x] Week 6 Data tab appears
- [x] Official Fantasy Data section appears
- [x] Rule Validation section appears
- [x] Team Data section appears
- [x] Fixtures section appears
- [x] Matchday selector works
- [x] Country fixture filter works
- [x] Fixture difficulty appears
- [x] Expected goals context appears
- [x] Player Picks show recommendation score
- [x] Player Picks show fixture context
- [x] Player Picks show club form where available
- [x] Player Picks show national team form where available
- [x] My XI shows official price
- [x] My XI shows official position
- [x] My XI shows rule checks
- [x] My XI shows budget check
- [x] My XI shows country limit check
- [x] Export Team JSON button appears
- [x] Export Team JSON button clicked without console errors

### Updated Rule Check Result

- [x] Budget check passes
- [x] Country limit check passes
- [x] Official player pool check passes
- [x] Official data completeness check passes after adding sourced GK/DEF rows
- [x] Squad size check passes in local logic test
- [x] Position check passes in local logic test

### GitHub Pages Tests

- [x] GitHub Pages site loads at `https://mmunteis-byte.github.io/worldcup-fantasy-site/`
- [ ] GitHub Pages version shows latest Week 6 Data tab
- [ ] GitHub Pages version shows latest Export Team JSON button

GitHub Pages loaded successfully, but it did not show the latest local Week 6 features yet. This likely means the newest local changes still need to be committed, pushed, and allowed time to deploy.
