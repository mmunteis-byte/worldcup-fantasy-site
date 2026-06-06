const helperSection = document.querySelector("#helperSection");
const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");
const teamStyleInput = document.querySelector("#teamStyle");
const riskStyleInput = document.querySelector("#riskStyle");
const favoriteCountryInput = document.querySelector("#favoriteCountry");
const formationSelect = document.querySelector("#formationSelect");
const playerSearchInput = document.querySelector("#playerSearch");
const playerSortInput = document.querySelector("#playerSort");
const customSelectionPanel = document.querySelector("#customSelectionPanel");
const customPlayerSearchInput = document.querySelector("#customPlayerSearch");
const customPlayerSortInput = document.querySelector("#customPlayerSort");
const closeSelectionButton = document.querySelector("#closeSelectionButton");
const picksCountryFilter = document.querySelector("#picksCountryFilter");
const picksPositionFilter = document.querySelector("#picksPositionFilter");
const picksMaxPriceFilter = document.querySelector("#picksMaxPriceFilter");
const poolCountryFilter = document.querySelector("#poolCountryFilter");
const poolPositionFilter = document.querySelector("#poolPositionFilter");
const poolMaxPriceFilter = document.querySelector("#poolMaxPriceFilter");
const customCountryFilter = document.querySelector("#customCountryFilter");
const customMaxPriceFilter = document.querySelector("#customMaxPriceFilter");
const fixtureCountryFilter = document.querySelector("#fixtureCountryFilter");
const fixtureMatchdayFilter = document.querySelector("#fixtureMatchdayFilter");
const heroSlides = document.querySelectorAll(".hero-slide");
const heroDots = document.querySelectorAll(".hero-dot");
const filterToggleButtons = document.querySelectorAll(".filter-toggle");
const exportTeamButton = document.querySelector("#exportTeamButton");

let allPlayers = [];
let fantasyRules = null;
let allTeams = [];
let allFixtures = [];
let allMatchdays = [];
let clubPerformance = [];
let nationalTeamPerformance = [];
let fixtureDifficulty = [];
let scorePredictions = [];
let dataMaps = {};
let customSlots = [];
let activeSlotId = null;
let activeHeroSlide = 0;
let currentTeamExport = null;
const DATA_LAST_UPDATED = "2026-06-05";

// Rotate the homepage poster every 5 seconds
function showHeroSlide(index) {
  heroSlides.forEach((slide) => slide.classList.remove("active"));
  heroDots.forEach((dot) => dot.classList.remove("active"));

  heroSlides[index].classList.add("active");
  heroDots[index].classList.add("active");
}

setInterval(() => {
  activeHeroSlide = (activeHeroSlide + 1) % heroSlides.length;
  showHeroSlide(activeHeroSlide);
}, 5000);

// Load the real player database from players.json
async function loadPlayerData() {
  const response = await fetch("data/players.json");

  if (!response.ok) {
    throw new Error("Could not load data/players.json");
  }

  return response.json();
}

// Load the draft fantasy rules from fantasyRules.json
async function loadFantasyRules() {
  const response = await fetch("data/fantasyRules.json");

  if (!response.ok) {
    throw new Error("Could not load data/fantasyRules.json");
  }

  return response.json();
}

// Load one helper JSON file. Keeping this small makes adding Week 6 data files easy.
async function loadJsonFile(filePath) {
  const response = await fetch(filePath);

  if (!response.ok) {
    throw new Error(`Could not load ${filePath}`);
  }

  return response.json();
}

// Load all Week 6 data used by the recommendation engine.
async function loadRecommendationData() {
  [
    allTeams,
    allFixtures,
    allMatchdays,
    clubPerformance,
    nationalTeamPerformance,
    fixtureDifficulty,
    scorePredictions
  ] = await Promise.all([
    loadJsonFile("data/teams.json"),
    loadJsonFile("data/fixtures.json"),
    loadJsonFile("data/matchdays.json"),
    loadJsonFile("data/playerClubPerformance.json"),
    loadJsonFile("data/playerNationalTeamPerformance.json"),
    loadJsonFile("data/fixtureDifficulty.json"),
    loadJsonFile("data/scorePredictions.json")
  ]);

  dataMaps = buildDataMaps();
}

// Create lookup maps so scoring one player stays readable and fast.
function buildDataMaps() {
  const teamById = new Map(allTeams.map((team) => [team.team_id, team]));
  const clubByPlayerId = new Map(clubPerformance.map((row) => [row.player_id, row]));
  const nationalByPlayerId = new Map(nationalTeamPerformance.map((row) => [row.player_id, row]));
  const predictionsByMatchId = new Map(scorePredictions.map((row) => [row.match_id, row]));
  const matchdayOrderByFixtureId = new Map();
  const difficultyByTeamId = new Map();

  allMatchdays.forEach((matchday, matchdayIndex) => {
    matchday.fixture_ids.forEach((fixtureId, fixtureIndex) => {
      const order = matchdayIndex * 100 + fixtureIndex;

      if (!matchdayOrderByFixtureId.has(fixtureId)) {
        matchdayOrderByFixtureId.set(fixtureId, order);
      }
    });
  });

  fixtureDifficulty.forEach((row) => {
    if (!difficultyByTeamId.has(row.team_id)) {
      difficultyByTeamId.set(row.team_id, []);
    }

    difficultyByTeamId.get(row.team_id).push(row);
  });

  return {
    teamById,
    clubByPlayerId,
    nationalByPlayerId,
    predictionsByMatchId,
    matchdayOrderByFixtureId,
    difficultyByTeamId
  };
}

// Some official rules are stored as objects with a value, status, and note.
function getRuleValue(rule) {
  if (rule && typeof rule === "object" && "value" in rule) return rule.value;
  return rule;
}

// Read official squad position requirements from data/fantasyRules.json.
function getPositionRules() {
  const positions = fantasyRules.squad.positions;

  return {
    GK: getRuleValue(positions.GK.required),
    DEF: getRuleValue(positions.DEF.required),
    MID: getRuleValue(positions.MID.required),
    FWD: getRuleValue(positions.FWD.required)
  };
}

function getPositionLabel(positionCode) {
  const labels = fantasyRules?.squad?.positions || {};
  return getRuleValue(labels[positionCode]?.label) || positionCode;
}

function getSquadSizeRule() {
  return getRuleValue(fantasyRules.squad.total_players);
}

function getStartingLineupSizeRule() {
  return getRuleValue(fantasyRules.starting_lineup.total_players);
}

function getAllowedFormations() {
  return getRuleValue(fantasyRules.starting_lineup.allowed_formations) || [];
}

function getBudgetLimit() {
  return getRuleValue(fantasyRules.budget.initial_budget);
}

function getCurrencyLabel() {
  return fantasyRules.budget.initial_budget.currency_label || fantasyRules.budget.initial_budget.display || "million dollars";
}

function getGroupStageCountryLimit() {
  return fantasyRules.nation_limits.by_round.group_stage.max_players_per_nation;
}

function isCaptainRequired() {
  const value = getRuleValue(fantasyRules.captain.captain_required);
  return value === true || value === "needs_check";
}

function getCaptainMultiplierLabel() {
  return getRuleValue(fantasyRules.captain.captain_points_multiplier);
}

// Official FIFA Fantasy data is the normal recommendation pool.
function isOfficialFantasyPlayer(player) {
  return player.roster_status === "official_fantasy_pool";
}

function getPlayerId(player) {
  return player.player_id || player.fifa_fantasy_id || player.id;
}

function getPlayerPosition(player) {
  return player.official_fantasy_position || player.position;
}

function getPlayerPrice(player) {
  if (player.official_price !== null && player.official_price !== undefined) {
    return Number(player.official_price);
  }

  return Number(player.price || 0);
}

function getPlayerClub(player) {
  return player.club || "club needs check";
}

function getPlayerReason(player) {
  if (player.short_reason) return player.short_reason;

  if (player.recommendation_status === "eligible") {
    return "Eligible for normal recommendations because official fantasy data and useful support data are available.";
  }

  if (player.recommendation_status === "caution") {
    return "Can be recommended, but some supporting club or national team data is incomplete.";
  }

  if (player.recommendation_status === "limited") {
    return "Only use this player for underdog, chaos, or country-specific teams because data is limited.";
  }

  return "Avoid normal recommendations unless there are not enough official-pool players.";
}

function getOfficialPlayerPool(players) {
  return players.filter((player) => {
    return isOfficialFantasyPlayer(player)
      && getPlayerPosition(player)
      && getPlayerPrice(player) > 0;
  });
}

// Build a 15-player squad using the position rules from fantasyRules.json
function buildFantasySquad(players) {
  const choices = getUserChoices();
  const officialPlayers = getOfficialPlayerPool(players);
  const positionRules = getPositionRules();
  const budget = getBudgetLimit();
  const squad = [];
  const countryCounts = {};

  addBudgetPicks(squad, countryCounts, getPlayersByPosition(officialPlayers, "GK"), positionRules.GK, choices, budget);
  addBudgetPicks(squad, countryCounts, getPlayersByPosition(officialPlayers, "DEF"), positionRules.DEF, choices, budget);
  addBudgetPicks(squad, countryCounts, getPlayersByPosition(officialPlayers, "MID"), positionRules.MID, choices, budget);
  addBudgetPicks(squad, countryCounts, getPlayersByPosition(officialPlayers, "FWD"), positionRules.FWD, choices, budget);

  return repairSquadBudget(squad, officialPlayers, countryCounts, choices, budget);
}

// Find players by the website's position names
function getPlayersByPosition(players, position) {
  return players.filter((player) => getPlayerPosition(player) === position);
}

// Pick strong players while trying to stay under the total budget
function addBudgetPicks(squad, countryCounts, candidates, amount, choices, budget) {
  const sortedCandidates = candidates
    .slice()
    .sort((a, b) => playerScore(b, choices) - playerScore(a, choices));

  for (let i = 0; i < amount; i++) {
    const currentTotal = getSquadTotalPrice(squad);
    const remainingSlots = getRemainingSquadSlots(squad);
    const remainingBudget = budget - currentTotal;
    const averageBudgetPerSlot = remainingBudget / remainingSlots;

    let pick = sortedCandidates.find((player) => {
      return !squad.includes(player)
        && canAddCountry(player, countryCounts)
        && getPlayerPrice(player) <= averageBudgetPerSlot + 1.5;
    });

    if (!pick) {
      pick = sortedCandidates.find((player) => {
        return !squad.includes(player) && canAddCountry(player, countryCounts);
      });
    }

    if (pick) {
      squad.push(pick);
      addCountryCount(pick, countryCounts);
    }
  }
}

// If the first pass is slightly over budget, swap to cheaper players in the same position.
function repairSquadBudget(squad, officialPlayers, countryCounts, choices, budget) {
  const repairedSquad = squad.slice();
  const repairedCountryCounts = { ...countryCounts };
  let safetyCounter = 0;

  while (getSquadTotalPrice(repairedSquad) > budget && safetyCounter < 30) {
    safetyCounter++;
    const selectedByPrice = repairedSquad
      .slice()
      .sort((a, b) => getPlayerPrice(b) - getPlayerPrice(a));
    let madeSwap = false;

    for (const selectedPlayer of selectedByPrice) {
      const replacement = getCheaperReplacement(selectedPlayer, repairedSquad, repairedCountryCounts, officialPlayers, choices);

      if (!replacement) continue;

      const selectedIndex = repairedSquad.findIndex((player) => getPlayerId(player) === getPlayerId(selectedPlayer));
      removeCountryCount(selectedPlayer, repairedCountryCounts);
      repairedSquad[selectedIndex] = replacement;
      addCountryCount(replacement, repairedCountryCounts);
      madeSwap = true;
      break;
    }

    if (!madeSwap) break;
  }

  return repairedSquad;
}

function getCheaperReplacement(selectedPlayer, squad, countryCounts, officialPlayers, choices) {
  const selectedIds = squad.map(getPlayerId);
  const selectedCountry = selectedPlayer.country || "needs_check";
  const temporaryCountryCounts = { ...countryCounts };

  temporaryCountryCounts[selectedCountry] = Math.max(0, (temporaryCountryCounts[selectedCountry] || 0) - 1);

  return officialPlayers
    .filter((player) => getPlayerPosition(player) === getPlayerPosition(selectedPlayer))
    .filter((player) => !selectedIds.includes(getPlayerId(player)))
    .filter((player) => getPlayerPrice(player) < getPlayerPrice(selectedPlayer))
    .filter((player) => canAddCountry(player, temporaryCountryCounts))
    .sort((a, b) => playerScore(b, choices) - playerScore(a, choices))[0];
}

function removeCountryCount(player, countryCounts) {
  const country = player.country || "needs_check";
  countryCounts[country] = Math.max(0, (countryCounts[country] || 0) - 1);
}

// Respect the group-stage country limit from fantasyRules.json
function canAddCountry(player, countryCounts) {
  const country = player.country || "needs_check";
  const maxPerCountry = getGroupStageCountryLimit();

  return (countryCounts[country] || 0) < maxPerCountry;
}

// Track how many selected players come from each country
function addCountryCount(player, countryCounts) {
  const country = player.country || "needs_check";
  countryCounts[country] = (countryCounts[country] || 0) + 1;
}

// Count selected players by country for display
function getCountryCounts(squad) {
  return squad.reduce((counts, player) => {
    const country = player.country || "needs_check";
    counts[country] = (counts[country] || 0) + 1;
    return counts;
  }, {});
}

// Validate the generated squad against fantasyRules.json
function validateSquad(squad, startingTeam, captain, formation, budgetInfo, countryCounts) {
  const positionRules = getPositionRules();
  const maxPerCountry = getGroupStageCountryLimit();
  const allowedFormations = getAllowedFormations();
  const officialPoolCounts = getOfficialPoolPositionCounts();
  const squadPositionCounts = {
    GK: getPlayersByPosition(squad, "GK").length,
    DEF: getPlayersByPosition(squad, "DEF").length,
    MID: getPlayersByPosition(squad, "MID").length,
    FWD: getPlayersByPosition(squad, "FWD").length
  };
  const formationParts = formation.split("-").map((part) => Number(part));
  const countryLimitPassed = Object.values(countryCounts).every((count) => count <= maxPerCountry);
  const captainInStarting11 = captain ? startingTeam.some((player) => getPlayerId(player) === getPlayerId(captain)) : false;

  return [
    {
      label: "Squad size",
      passed: squad.length === getSquadSizeRule(),
      message: `Squad has ${squad.length} players. It should have exactly ${getSquadSizeRule()}.`
    },
    {
      label: "Positions",
      passed: squadPositionCounts.GK === positionRules.GK
        && squadPositionCounts.DEF === positionRules.DEF
        && squadPositionCounts.MID === positionRules.MID
        && squadPositionCounts.FWD === positionRules.FWD,
      message: `Current positions: ${squadPositionCounts.GK} GK, ${squadPositionCounts.DEF} DEF, ${squadPositionCounts.MID} MID, ${squadPositionCounts.FWD} FWD.`
    },
    {
      label: "Budget",
      passed: budgetInfo.totalPrice <= budgetInfo.budget,
      message: `Total price is ${budgetInfo.totalPrice.toFixed(1)}. Budget limit is ${budgetInfo.budget.toFixed(1)}.`
    },
    {
      label: "Country limit",
      passed: countryLimitPassed,
      message: `No country should have more than ${maxPerCountry} players. Players marked needs_check are treated as one cautious group.`
    },
    {
      label: "Starting 11",
      passed: startingTeam.length === getStartingLineupSizeRule(),
      message: `Starting lineup has ${startingTeam.length} players. It should have exactly ${getStartingLineupSizeRule()}.`
    },
    {
      label: "Formation",
      passed: allowedFormations.includes(formation)
        && formationParts[0] >= 3
        && formationParts[1] >= 2
        && formationParts[2] >= 1,
      message: `${formation} must be in data/fantasyRules.json and include at least 3 DEF, 2 MID, and 1 FWD.`
    },
    {
      label: "Captain",
      passed: !isCaptainRequired() || (Boolean(captain) && captainInStarting11),
      message: captain ? `${captain.name} is selected from the starting 11.` : "No captain was selected."
    },
    {
      label: "Official player pool",
      passed: squad.every(isOfficialFantasyPlayer),
      message: "Normal recommendations only use players marked official_fantasy_pool."
    },
    {
      label: "Official data completeness",
      passed: officialPoolCounts.GK >= positionRules.GK
        && officialPoolCounts.DEF >= positionRules.DEF
        && officialPoolCounts.MID >= positionRules.MID
        && officialPoolCounts.FWD >= positionRules.FWD,
      message: `Official pool has ${officialPoolCounts.GK} GK, ${officialPoolCounts.DEF} DEF, ${officialPoolCounts.MID} MID, ${officialPoolCounts.FWD} FWD. It needs at least ${positionRules.GK} GK, ${positionRules.DEF} DEF, ${positionRules.MID} MID, ${positionRules.FWD} FWD to build a legal squad.`
    }
  ];
}

function getOfficialPoolPositionCounts() {
  return getOfficialPlayerPool(allPlayers).reduce((counts, player) => {
    const position = getPlayerPosition(player);
    counts[position] = (counts[position] || 0) + 1;
    return counts;
  }, {
    GK: 0,
    DEF: 0,
    MID: 0,
    FWD: 0
  });
}

// Turn validation results into an export-friendly object
function getRuleChecksObject(validationResults) {
  return validationResults.reduce((checks, result) => {
    checks[result.label] = {
      status: result.passed ? "PASS" : "FAIL",
      explanation: result.message
    };
    return checks;
  }, {});
}

// Keep the latest generated team ready for export
function saveCurrentTeamExport(squad, startingTeam, bench, captainPick, formationUsed, budgetInfo, validationResults) {
  const choices = getUserChoices();
  const ruleChecks = getRuleChecksObject(validationResults);

  currentTeamExport = {
    site_name: "World Cup Fantasy Team Helper",
    user_prompt: "Week 6 export using official FIFA Fantasy data where available plus helper performance, fixture, and prediction data.",
    team_name: "Generated Fantasy Squad",
    formation: formationUsed,
    squad: squad.map((player) => buildExportPlayer(player, choices)),
    starting_11: startingTeam.map((player) => buildExportPlayer(player, choices)),
    bench: bench.map((player) => buildExportPlayer(player, choices)),
    captain: captainPick.captain ? captainPick.captain.name : null,
    total_price: Number(budgetInfo.totalPrice.toFixed(1)),
    remaining_budget: Number(budgetInfo.remainingBudget.toFixed(1)),
    strategy: `${choices.teamStyle} team style with ${choices.riskStyle} risk style`,
    official_fantasy_rules_used: getOfficialRulesUsed(),
    rule_checks: ruleChecks,
    roster_status_summary: getRosterStatusSummary(squad),
    data_quality_summary: getDataQualitySummary(squad),
    club_performance_summary: getClubPerformanceSummary(squad),
    national_team_performance_summary: getNationalTeamPerformanceSummary(squad),
    fixture_context: getFixtureContextSummary(squad),
    expected_goals_context: getExpectedGoalsContext(squad),
    recommendation_explanation: getRecommendationExplanation(squad, choices, ruleChecks, captainPick),
    data_sources: [
      "data/players.json",
      "data/fifaFantasyPlayers.json",
      "data/teams.json",
      "data/fixtures.json",
      "data/matchdays.json",
      "data/playerClubPerformance.json",
      "data/playerNationalTeamPerformance.json",
      "data/fixtureDifficulty.json",
      "data/scorePredictions.json",
      "data/dataSources.md"
    ],
    rules_sources: [
      "data/fantasyRules.json",
      "https://play.fifa.com/fantasy/",
      "https://play.fifa.com/fantasy/help"
    ],
    last_updated: DATA_LAST_UPDATED
  };
}

function buildExportPlayer(player, choices) {
  const recommendation = getRecommendationScore(player, choices);
  const nextFixture = getNextFixtureContext(player);
  const clubRow = getClubPerformance(player);
  const nationalRow = getNationalPerformance(player);

  return {
    player_id: getPlayerId(player),
    fifa_fantasy_id: player.fifa_fantasy_id ?? null,
    name: player.name,
    country: player.country,
    team_id: player.team_id,
    club: player.club,
    league: player.league,
    official_fantasy_position: getPlayerPosition(player),
    official_price: getPlayerPrice(player),
    roster_status: player.roster_status,
    data_quality: player.data_quality,
    club_data_quality: player.club_data_quality,
    national_team_data_quality: player.national_team_data_quality,
    recommendation_status: player.recommendation_status,
    recommendation_score: Number(recommendation.total.toFixed(1)),
    recommendation_score_parts: roundScoreParts(recommendation.parts),
    next_fixture: nextFixture,
    club_performance: summarizeClubPerformanceRow(clubRow),
    national_team_performance: summarizeNationalPerformanceRow(nationalRow)
  };
}

function roundScoreParts(parts) {
  return Object.fromEntries(
    Object.entries(parts).map(([key, value]) => [key, Number(value.toFixed(1))])
  );
}

function getOfficialRulesUsed() {
  return {
    rules_version: fantasyRules.rules_version,
    rules_status: fantasyRules.rules_status,
    squad_size: getSquadSizeRule(),
    position_requirements: getPositionRules(),
    budget: {
      initial_budget: getBudgetLimit(),
      currency_label: getCurrencyLabel()
    },
    country_limit_group_stage: getGroupStageCountryLimit(),
    allowed_formations: getAllowedFormations(),
    captain_required: getRuleValue(fantasyRules.captain.captain_required),
    captain_multiplier: getCaptainMultiplierLabel(),
    transfers: fantasyRules.transfers,
    boosters: fantasyRules.boosters
  };
}

function getRosterStatusSummary(players) {
  return countByValue(players, (player) => player.roster_status || "unknown");
}

function getDataQualitySummary(players) {
  return {
    data_quality: countByValue(players, (player) => player.data_quality || "unknown"),
    club_data_quality: countByValue(players, (player) => player.club_data_quality || "unknown"),
    national_team_data_quality: countByValue(players, (player) => player.national_team_data_quality || "unknown"),
    recommendation_status: countByValue(players, (player) => player.recommendation_status || "unknown")
  };
}

function getClubPerformanceSummary(players) {
  const rows = players.map(getClubPerformance).filter(Boolean);
  const matchedRows = rows.filter((row) => !row.data_quality.includes("unmatched"));

  return {
    matched_players: matchedRows.length,
    unmatched_players: players.length - matchedRows.length,
    total_minutes: sumRows(matchedRows, "minutes"),
    total_starts: sumRows(matchedRows, "starts"),
    total_goals: sumRows(matchedRows, "goals"),
    total_assists: sumRows(matchedRows, "assists"),
    total_clean_sheets: sumRows(matchedRows, "clean_sheets"),
    note: "Club performance is included only where matched from helper data. Missing values are not invented."
  };
}

function getNationalTeamPerformanceSummary(players) {
  const rows = players.map(getNationalPerformance).filter(Boolean);

  return {
    matched_players: rows.length,
    unmatched_players: players.length - rows.length,
    total_appearances: sumRows(rows, "appearances"),
    total_minutes: sumRows(rows, "minutes"),
    total_goals: sumRows(rows, "goals"),
    total_assists: sumRows(rows, "assists"),
    note: "National team data may be complete for some UEFA players and partial for other confederations."
  };
}

function getFixtureContextSummary(players) {
  return players.map((player) => ({
    player_id: getPlayerId(player),
    name: player.name,
    team_id: player.team_id,
    next_fixture: getNextFixtureContext(player)
  }));
}

function getExpectedGoalsContext(players) {
  const contexts = players.map(getNextFixtureContext).filter(Boolean);
  const totalExpectedGoalsFor = contexts.reduce((sum, context) => sum + Number(context.expected_goals_for || 0), 0);
  const totalExpectedGoalsAgainst = contexts.reduce((sum, context) => sum + Number(context.expected_goals_against || 0), 0);

  return {
    average_expected_goals_for: contexts.length ? Number((totalExpectedGoalsFor / contexts.length).toFixed(2)) : null,
    average_expected_goals_against: contexts.length ? Number((totalExpectedGoalsAgainst / contexts.length).toFixed(2)) : null,
    players_with_fixture_context: contexts.length,
    note: "Expected goals come from the Week 6 prototype score prediction model, not betting odds."
  };
}

function getRecommendationExplanation(squad, choices, ruleChecks, captainPick) {
  const legal = Object.values(ruleChecks).every((check) => check.status === "PASS");
  const topPlayers = squad
    .slice()
    .sort((a, b) => playerScore(b, choices) - playerScore(a, choices))
    .slice(0, 5)
    .map((player) => ({
      name: player.name,
      recommendation_score: Number(playerScore(player, choices).toFixed(1)),
      reason: getPlayerReason(player),
      fixture: getNextFixtureContext(player)
    }));

  return {
    summary: legal
      ? "The squad passes the current official fantasy rule checks."
      : "The squad does not pass every rule yet, mostly because the current official player pool file is incomplete.",
    strategy_mode: choices.teamStyle,
    risk_mode: choices.riskStyle,
    captain_reason: captainPick.reason,
    scoring_formula: "fantasy_base_score + club_form_score + national_team_form_score + fixture_boost + team_strength_boost - risk_penalty - data_quality_penalty",
    top_recommendations: topPlayers
  };
}

function summarizeClubPerformanceRow(row) {
  if (!row) return null;

  return {
    season: row.season,
    minutes: row.minutes,
    starts: row.starts,
    goals: row.goals,
    assists: row.assists,
    clean_sheets: row.clean_sheets,
    yellow_cards: row.yellow_cards,
    red_cards: row.red_cards,
    data_quality: row.data_quality
  };
}

function summarizeNationalPerformanceRow(row) {
  if (!row) return null;

  return {
    competition: row.competition,
    season_or_cycle: row.season_or_cycle,
    appearances: row.appearances,
    starts: row.starts,
    minutes: row.minutes,
    goals: row.goals,
    assists: row.assists,
    clean_sheets: row.clean_sheets,
    yellow_cards: row.yellow_cards,
    red_cards: row.red_cards,
    data_quality: row.data_quality
  };
}

function countByValue(items, getValue) {
  return items.reduce((counts, item) => {
    const value = getValue(item);
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function sumRows(rows, field) {
  return rows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
}

// Average one numeric field across the squad
function getAverageScore(players, field) {
  if (players.length === 0) return 0;

  const total = players.reduce((sum, player) => {
    if (field === "attack_score") return sum + getPlayerAttackScore(player);
    if (field === "defense_score") return sum + getPlayerDefenseScore(player);
    if (field === "risk_score") return sum + getPlayerRiskScore(player);
    return sum + Number(player[field] || 0);
  }, 0);

  return total / players.length;
}

// Calculate the total price of a squad
function getSquadTotalPrice(squad) {
  return squad.reduce((total, player) => total + getPlayerPrice(player), 0);
}

// Count how many squad slots are still empty
function getRemainingSquadSlots(squad) {
  return getSquadSizeRule() - squad.length;
}

// Create simple budget information for display
function getBudgetInfo(squad) {
  const totalPrice = getSquadTotalPrice(squad);
  const budget = getBudgetLimit();

  return {
    totalPrice,
    budget,
    remainingBudget: budget - totalPrice,
    isOverBudget: totalPrice > budget
  };
}

// Pick a valid starting 11 from the full 15-player squad
function buildStartingTeam(squad) {
  const formation = getGeneratedFormation();
  const parts = formation.split("-").map((part) => Number(part));
  const choices = getUserChoices();

  return [
    ...pickBestPlayers(getPlayersByPosition(squad, "GK"), 1, choices),
    ...pickBestPlayers(getPlayersByPosition(squad, "DEF"), parts[0], choices),
    ...pickBestPlayers(getPlayersByPosition(squad, "MID"), parts[1], choices),
    ...pickBestPlayers(getPlayersByPosition(squad, "FWD"), parts[2], choices)
  ];
}

// Use one allowed formation from fantasyRules.json for the generated XI
function getGeneratedFormation() {
  const allowedFormations = getAllowedFormations();

  if (allowedFormations.includes(formationSelect.value)) {
    return formationSelect.value;
  }

  return allowedFormations.includes("4-3-3") ? "4-3-3" : allowedFormations[0];
}

// The bench is the rest of the 15-player squad after the starting 11
function buildBench(squad, startingTeam) {
  const starterIds = startingTeam.map((player) => getPlayerId(player));

  return squad.filter((player) => !starterIds.includes(getPlayerId(player)));
}

// Choose a captain from the starting 11 using simple style-based logic
function chooseCaptain(startingTeam) {
  const choices = getUserChoices();
  let reason = "";

  const captain = startingTeam
    .slice()
    .sort((a, b) => captainScore(b, choices) - captainScore(a, choices))[0];

  if (!captain) {
    return {
      captain: null,
      reason: "No captain could be selected because the starting 11 is incomplete."
    };
  }

  if (choices.teamStyle === "attacking") {
    reason = "Chosen because attacking teams give extra weight to goals, assists, attack score, and expected goals.";
  } else if (choices.teamStyle === "defensive") {
    reason = "Chosen because defensive teams give extra weight to clean sheets, defense score, and lower expected goals against.";
  } else if (choices.teamStyle === "underdog") {
    reason = "Chosen because underdog mode prefers cheaper players from weaker teams when the fixture still has upside.";
  } else if (choices.teamStyle === "chaos") {
    reason = "Chosen because chaos mode allows more risk and gives more credit for upside.";
  } else if (choices.riskStyle === "safe") {
    reason = "Chosen because safe teams avoid low data quality, low minutes, and uncertain starters.";
  } else {
    reason = "Chosen because balanced teams mix club form, national team form, fixtures, team strength, and price.";
  }

  return { captain, reason };
}

// Score captain options based on the user's selected style
function captainScore(player, choices) {
  const recommendation = getRecommendationScore(player, choices).total;
  const nationalRow = getNationalPerformance(player);
  const nationalGoals = Number(nationalRow?.goals || 0);

  if (choices.teamStyle === "attacking") {
    return recommendation + nationalGoals * 2;
  }

  if (choices.riskStyle === "safe") {
    return recommendation - getPlayerRiskScore(player) * 0.4;
  }

  return recommendation;
}

// Read the choices from the form controls
function getUserChoices() {
  return {
    teamStyle: teamStyleInput.value,
    riskStyle: riskStyleInput.value,
    favoriteCountry: favoriteCountryInput.value.trim().toLowerCase()
  };
}

// Sort players using the Week 6 recommendation score.
function pickBestPlayers(players, amount, choices = getUserChoices()) {
  return players
    .slice()
    .sort((a, b) => playerScore(b, choices) - playerScore(a, choices))
    .slice(0, amount);
}

// Score a player by combining official fantasy info, player form, fixtures, and data risk.
function playerScore(player, choices) {
  return getRecommendationScore(player, choices).total;
}

// This is the simple recommendation formula used across the website:
// recommendation_score =
// fantasy_base_score + club_form_score + national_team_form_score
// + fixture_boost + team_strength_boost - risk_penalty - data_quality_penalty.
function getRecommendationScore(player, choices = getUserChoices()) {
  const parts = getRecommendationParts(player, choices);
  let total = parts.fantasy_base_score
    + parts.club_form_score
    + parts.national_team_form_score
    + parts.fixture_boost
    + parts.team_strength_boost
    - parts.risk_penalty
    - parts.data_quality_penalty;

  if (choices.favoriteCountry && String(player.country).toLowerCase() === choices.favoriteCountry) {
    total += 12;
  }

  return {
    total,
    parts
  };
}

function getRecommendationParts(player, choices) {
  const weights = getModeWeights(choices);
  const fantasyBaseScore = getFantasyBaseScore(player, weights);
  const clubFormScore = getClubFormScore(player, weights);
  const nationalTeamFormScore = getNationalTeamFormScore(player, weights);
  const fixtureBoost = getFixtureBoost(player, weights);
  const teamStrengthBoost = getTeamStrengthBoost(player, weights);
  const riskPenalty = getRiskPenalty(player, weights);
  const dataQualityPenalty = getDataQualityPenalty(player, weights);

  return {
    fantasy_base_score: fantasyBaseScore,
    club_form_score: clubFormScore,
    national_team_form_score: nationalTeamFormScore,
    fixture_boost: fixtureBoost,
    team_strength_boost: teamStrengthBoost,
    risk_penalty: riskPenalty,
    data_quality_penalty: dataQualityPenalty
  };
}

// Style modes change what the engine cares about most.
function getModeWeights(choices) {
  const weights = {
    attack: 1,
    defense: 1,
    goals: 1,
    assists: 1,
    cleanSheets: 1,
    expectedGoalsFor: 1,
    expectedGoalsAgainst: 1,
    price: 1,
    risk: choices.riskStyle === "safe" ? 1.4 : 0.75,
    dataQuality: choices.riskStyle === "safe" ? 1.4 : 0.8,
    underdog: 0,
    chaos: 0
  };

  if (choices.teamStyle === "attacking") {
    weights.attack = 1.7;
    weights.goals = 1.8;
    weights.assists = 1.5;
    weights.expectedGoalsFor = 1.7;
    weights.cleanSheets = 0.5;
  }

  if (choices.teamStyle === "defensive") {
    weights.defense = 1.8;
    weights.cleanSheets = 1.8;
    weights.expectedGoalsAgainst = 1.7;
    weights.goals = 0.6;
    weights.assists = 0.6;
  }

  if (choices.teamStyle === "underdog") {
    weights.price = 1.8;
    weights.underdog = 1.8;
    weights.expectedGoalsFor = 1.2;
    weights.risk = choices.riskStyle === "safe" ? 1.1 : 0.6;
  }

  if (choices.teamStyle === "chaos") {
    weights.chaos = 1.8;
    weights.underdog = 1.1;
    weights.goals = 1.4;
    weights.assists = 1.2;
    weights.risk = 0.35;
    weights.dataQuality = 0.55;
  }

  return weights;
}

function getFantasyBaseScore(player, weights) {
  const officialPoolBonus = isOfficialFantasyPlayer(player) ? 30 : -80;
  const statusBonus = getRecommendationStatusScore(player.recommendation_status);
  const attack = getPlayerAttackScore(player) * 0.12 * weights.attack;
  const defense = getPlayerDefenseScore(player) * 0.09 * weights.defense;
  const priceValue = Math.max(0, 12 - getPlayerPrice(player)) * 1.4 * weights.price;

  return officialPoolBonus + statusBonus + attack + defense + priceValue;
}

function getClubFormScore(player, weights) {
  const row = getClubPerformance(player);
  if (!row) return 0;

  const goals = Number(row.goals || 0) * 2.4 * weights.goals;
  const assists = Number(row.assists || 0) * 1.8 * weights.assists;
  const cleanSheets = Number(row.clean_sheets || 0) * 0.9 * weights.cleanSheets;
  const minutes = Math.min(Number(row.minutes || 0) / 900, 4);
  const starts = Math.min(Number(row.starts || 0), 30) * 0.15;
  const cards = Number(row.yellow_cards || 0) * 0.25 + Number(row.red_cards || 0) * 1.5;

  return goals + assists + cleanSheets + minutes + starts - cards;
}

function getNationalTeamFormScore(player, weights) {
  const row = getNationalPerformance(player);
  if (!row) return 0;

  const goals = Number(row.goals || 0) * 2.8 * weights.goals;
  const assists = Number(row.assists || 0) * 2 * weights.assists;
  const cleanSheets = Number(row.clean_sheets || 0) * weights.cleanSheets;
  const appearances = Number(row.appearances || 0) * 0.5;
  const minutes = Math.min(Number(row.minutes || 0) / 450, 3);
  const cards = Number(row.yellow_cards || 0) * 0.25 + Number(row.red_cards || 0) * 1.5;

  return goals + assists + cleanSheets + appearances + minutes - cards;
}

function getFixtureBoost(player, weights) {
  const rows = getUpcomingFixtureDifficulty(player);
  if (rows.length === 0) return 0;

  const firstFixture = rows[0];
  const prediction = dataMaps.predictionsByMatchId?.get(firstFixture.match_id);
  const difficultyScore = getDifficultyValue(firstFixture.difficulty);
  const expectedGoalsFor = Number(firstFixture.expected_goals_for || 1.35);
  const expectedGoalsAgainst = Number(firstFixture.expected_goals_against || 1.35);
  const totalExpectedGoals = Number(prediction?.total_expected_goals || 2.7);
  const attackBoost = (expectedGoalsFor - 1.35) * 12 * weights.expectedGoalsFor;
  const defensiveBoost = (1.35 - expectedGoalsAgainst) * 10 * weights.expectedGoalsAgainst;
  const openMatchBoost = Math.max(0, totalExpectedGoals - 2.7) * 4 * weights.chaos;
  const underdogBoost = firstFixture.difficulty === "difficult" || firstFixture.difficulty === "very difficult"
    ? Math.max(0, expectedGoalsFor - 0.8) * 6 * weights.underdog
    : 0;

  return difficultyScore + attackBoost + defensiveBoost + openMatchBoost + underdogBoost;
}

function getTeamStrengthBoost(player, weights) {
  const team = dataMaps.teamById?.get(player.team_id);
  if (!team || team.fifa_ranking === null || team.fifa_ranking === undefined) return 0;

  const ranking = Number(team.fifa_ranking);
  const favoriteBoost = Math.max(0, 60 - ranking) * 0.18;
  const underdogBoost = ranking > 35 ? Math.min(12, (ranking - 35) * 0.3) * weights.underdog : 0;

  return favoriteBoost + underdogBoost;
}

function getRiskPenalty(player, weights) {
  const risk = getPlayerRiskScore(player) * 0.2 * weights.risk;
  const clubRow = getClubPerformance(player);
  const nationalRow = getNationalPerformance(player);
  const lowMinutesRisk = clubRow && clubRow.minutes !== null && Number(clubRow.minutes) < 450 ? 6 * weights.risk : 0;
  const uncertainStarterRisk = (!clubRow?.starts && !nationalRow?.starts) ? 4 * weights.risk : 0;

  return risk + lowMinutesRisk + uncertainStarterRisk;
}

function getDataQualityPenalty(player, weights) {
  const dataPenalty = getQualityPenalty(player.data_quality);
  const clubPenalty = getQualityPenalty(player.club_data_quality) * 0.7;
  const nationalPenalty = getQualityPenalty(player.national_team_data_quality) * 0.7;

  return (dataPenalty + clubPenalty + nationalPenalty) * weights.dataQuality;
}

function getRecommendationStatusScore(status) {
  if (status === "eligible") return 14;
  if (status === "caution") return 4;
  if (status === "limited") return -8;
  return -25;
}

function getQualityPenalty(quality) {
  if (quality === "high") return 0;
  if (quality === "medium") return 4;
  if (quality === "low") return 10;
  return 14;
}

function getDifficultyValue(difficulty) {
  if (difficulty === "easy") return 10;
  if (difficulty === "favorable") return 6;
  if (difficulty === "medium") return 1;
  if (difficulty === "difficult") return -5;
  if (difficulty === "very difficult") return -10;
  return 0;
}

function getClubPerformance(player) {
  return dataMaps.clubByPlayerId?.get(getPlayerId(player));
}

function getNationalPerformance(player) {
  return dataMaps.nationalByPlayerId?.get(getPlayerId(player));
}

function getUpcomingFixtureDifficulty(player) {
  const rows = dataMaps.difficultyByTeamId?.get(player.team_id) || [];

  return rows.slice().sort((a, b) => {
    const aOrder = dataMaps.matchdayOrderByFixtureId?.get(a.match_id) ?? 9999;
    const bOrder = dataMaps.matchdayOrderByFixtureId?.get(b.match_id) ?? 9999;
    return aOrder - bOrder;
  });
}

function getNextFixtureContext(player) {
  const nextDifficulty = getUpcomingFixtureDifficulty(player)[0];
  if (!nextDifficulty) return null;

  const fixture = allFixtures.find((item) => item.match_id === nextDifficulty.match_id);
  const opponentTeam = dataMaps.teamById?.get(nextDifficulty.opponent_team_id);

  return {
    match_id: nextDifficulty.match_id,
    opponent: opponentTeam?.country || nextDifficulty.opponent_team_id,
    difficulty: nextDifficulty.difficulty,
    expected_goals_for: nextDifficulty.expected_goals_for,
    expected_goals_against: nextDifficulty.expected_goals_against,
    matchday: fixture?.matchday || "needs_check",
    date: fixture?.date || "needs_check"
  };
}

function getClubFormText(player) {
  const row = getClubPerformance(player);
  if (!row || row.data_quality.includes("unmatched")) return "Club form: not matched yet";

  return `Club form: ${row.minutes ?? "?"} min, ${row.starts ?? "?"} starts, ${row.goals ?? 0} goals, ${row.assists ?? 0} assists`;
}

function getNationalFormText(player) {
  const row = getNationalPerformance(player);
  if (!row) return "National form: needs_check";

  return `National form: ${row.appearances ?? "?"} apps, ${row.minutes ?? "?"} min, ${row.goals ?? 0} goals, ${row.assists ?? 0} assists`;
}

function getFixtureContextText(player) {
  const context = getNextFixtureContext(player);
  if (!context) return "Next fixture: needs_check";

  return `Next opponent: ${context.opponent} | ${context.difficulty} | xG ${context.expected_goals_for}`;
}

// Week 6 official players do not always have old attack/defense fields, so use data quality as fallback.
function getQualityScore(value) {
  if (value === "high") return 85;
  if (value === "medium") return 70;
  if (value === "low") return 45;
  return 30;
}

function getPlayerAttackScore(player) {
  if (player.attack_score !== undefined) return Number(player.attack_score);
  return getQualityScore(player.national_team_data_quality);
}

function getPlayerDefenseScore(player) {
  if (player.defense_score !== undefined) return Number(player.defense_score);
  return getQualityScore(player.data_quality);
}

function getPlayerRiskScore(player) {
  if (player.risk_score !== undefined) return Number(player.risk_score);
  if (player.recommendation_status === "eligible") return 15;
  if (player.recommendation_status === "caution") return 35;
  if (player.recommendation_status === "limited") return 60;
  return 80;
}

// Fill country filter dropdowns from the loaded player data
function setupCountryFilters(players) {
  const countries = [...new Set(players.map((player) => player.country))]
    .filter((country) => country && country !== "needs_check")
    .sort();

  [picksCountryFilter, poolCountryFilter, customCountryFilter].forEach((select) => {
    select.innerHTML = `<option value="">All countries</option>`;

    countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country;
      option.textContent = country;
      select.appendChild(option);
    });
  });
}

// Fill the formation selector using fantasyRules.json
function setupFormationOptions() {
  formationSelect.innerHTML = "";

  getAllowedFormations().forEach((formation) => {
    const option = document.createElement("option");
    option.value = formation;
    option.textContent = formation;
    formationSelect.appendChild(option);
  });

  formationSelect.value = "4-3-3";
}

// Apply simple country, position, and price filters
function filterPlayers(players, filters) {
  return players.filter((player) => {
    const maxPrice = Number(filters.maxPrice);

    if (filters.country && player.country !== filters.country) return false;
    if (filters.position && getPlayerPosition(player) !== filters.position) return false;
    if (filters.maxPrice && getPlayerPrice(player) > maxPrice) return false;

    return true;
  });
}

// Create simple recommendation cards
function showCards(list, elementId) {
  const container = document.querySelector(`#${elementId}`);
  container.innerHTML = "";

  list.forEach((item) => {
    const card = document.createElement("article");
    card.className = "info-card";

    card.innerHTML = `
      <p class="card-label">${item.label}</p>
      <h3 class="card-title">${item.title}</h3>
      <p class="card-text">${item.text}</p>
      <p class="rating">${item.rating}</p>
    `;

    container.appendChild(card);
  });
}

// Build the Player Picks tab from players.json
function showSuggestions(players) {
  const choices = getUserChoices();
  const container = document.querySelector("#suggestionList");
  const filteredPlayers = filterPlayers(players, {
    country: picksCountryFilter.value,
    position: picksPositionFilter.value,
    maxPrice: picksMaxPriceFilter.value
  });
  const playerPicks = pickBestPlayers(getOfficialPlayerPool(filteredPlayers), 15, choices);

  container.innerHTML = "";

  playerPicks.forEach((player, index) => {
    const card = document.createElement("article");
    card.className = "advice-card";
    const recommendation = getRecommendationScore(player, choices);
    const parts = recommendation.parts;

    card.innerHTML = `
      <div class="advice-rank">#${index + 1}</div>
      <div>
        <h3>${player.name}</h3>
        <p><strong>Country:</strong> ${player.country}</p>
        <p><strong>Club:</strong> ${getPlayerClub(player)}</p>
        <p><strong>Position:</strong> ${getPlayerPosition(player)}</p>
        <p><strong>Official price:</strong> ${getPlayerPrice(player)}</p>
        <p><strong>Status:</strong> ${player.recommendation_status}</p>
        <p><strong>Recommendation score:</strong> ${Math.round(recommendation.total)}</p>
        <p><strong>Form:</strong> club ${Math.round(parts.club_form_score)}, national ${Math.round(parts.national_team_form_score)}</p>
        <p><strong>Fixture:</strong> ${Math.round(parts.fixture_boost)} | <strong>Risk penalty:</strong> ${Math.round(parts.risk_penalty)}</p>
        <p><strong>Data:</strong> ${player.data_quality} | Club ${player.club_data_quality} | National ${player.national_team_data_quality}</p>
        <p>${getFixtureContextText(player)}</p>
        <p>${getClubFormText(player)}</p>
        <p>${getNationalFormText(player)}</p>
        <p class="advice-reason">${getPlayerReason(player)}</p>
      </div>
    `;

    container.appendChild(card);
  });
}

// Build the captain tab from the best attacking players
function showCaptains(players) {
  const choices = getUserChoices();
  const captainPlayers = getOfficialPlayerPool(players)
    .slice()
    .sort((a, b) => {
      const bScore = captainScore(b, choices);
      const aScore = captainScore(a, choices);
      return bScore - aScore;
    })
    .slice(0, 6);

  const container = document.querySelector("#captainList");
  container.innerHTML = "";

  captainPlayers.forEach((player, index) => {
    const card = document.createElement("article");
    card.className = "captain-card";
    const captainScoreValue = Math.round(captainScore(player, choices));
    const recommendation = getRecommendationScore(player, choices);
    const fixtureRows = getUpcomingFixtureDifficulty(player);
    const firstFixture = fixtureRows[0];

    card.innerHTML = `
      <div class="captain-top">
        <p class="card-label">${index === 0 ? "Best Captain" : "Captain Option"}</p>
        <p class="captain-score">Captain score: ${captainScoreValue}</p>
      </div>
      <h3>${player.name}</h3>
      <div class="captain-data">
        <p><strong>Country:</strong> ${player.country}</p>
        <p><strong>Club:</strong> ${getPlayerClub(player)}</p>
        <p><strong>Position:</strong> ${getPlayerPosition(player)}</p>
        <p><strong>Official price:</strong> ${getPlayerPrice(player)}</p>
        <p><strong>Data quality:</strong> ${player.data_quality}</p>
        <p><strong>Club data:</strong> ${player.club_data_quality}</p>
        <p><strong>National data:</strong> ${player.national_team_data_quality}</p>
        <p><strong>Recommendation:</strong> ${Math.round(recommendation.total)}</p>
        <p><strong>Next fixture:</strong> ${firstFixture ? `${firstFixture.difficulty}, xG ${firstFixture.expected_goals_for}` : "needs_check"}</p>
        <p><strong>Club form:</strong> ${getClubFormText(player).replace("Club form: ", "")}</p>
        <p><strong>National form:</strong> ${getNationalFormText(player).replace("National form: ", "")}</p>
      </div>
      <p class="captain-reason">${getPlayerReason(player)}</p>
      <p class="captain-note">${player.data_note}</p>
    `;

    if (choices.riskStyle === "risky" && index === 0) {
      card.querySelector(".card-label").textContent = "High Upside";
    }

    container.appendChild(card);
  });
}

// Create the formation view with shirt-style player tokens
function showTeam(players) {
  const squad = buildFantasySquad(players);
  const team = buildStartingTeam(squad);
  const bench = buildBench(squad, team);
  const captainPick = chooseCaptain(team);
  const formationUsed = getGeneratedFormation();
  const benchLine = document.querySelector("#generatedBenchLine");
  const budgetSummary = document.querySelector("#squadBudgetSummary");
  const ruleChecks = document.querySelector("#squadRuleChecks");
  const formationSummary = document.querySelector("#formationSummary");
  const captainSummary = document.querySelector("#captainSummary");
  const fullSquadList = document.querySelector("#fullSquadList");
  const budgetInfo = getBudgetInfo(squad);
  const countryCounts = getCountryCounts(squad);
  const maxPerCountry = getGroupStageCountryLimit();
  const validationResults = validateSquad(squad, team, captainPick.captain, formationUsed, budgetInfo, countryCounts);
  saveCurrentTeamExport(squad, team, bench, captainPick, formationUsed, budgetInfo, validationResults);

  document.querySelectorAll(".player-line").forEach((line) => {
    line.innerHTML = "";
  });
  benchLine.innerHTML = "";
  fullSquadList.innerHTML = "";

  budgetSummary.innerHTML = `
    <div>
      <strong>Total price:</strong> ${budgetInfo.totalPrice.toFixed(1)} ${getCurrencyLabel()}
    </div>
    <div>
      <strong>Remaining budget:</strong> ${budgetInfo.remainingBudget.toFixed(1)} ${getCurrencyLabel()}
    </div>
    <div>
      <strong>Max spend:</strong> ${budgetInfo.budget.toFixed(1)} ${getCurrencyLabel()}
    </div>
  `;

  budgetSummary.classList.toggle("warning", budgetInfo.isOverBudget);

  if (budgetInfo.isOverBudget) {
    budgetSummary.innerHTML += `<p>This draft squad is over budget. The app tried to choose cheaper players, but could not build a valid squad under budget with this simple logic.</p>`;
  }

  ruleChecks.innerHTML = `
    <h3>Rule Checks</h3>
    <div class="validation-list">
      ${validationResults.map((result) => `
        <div class="validation-item ${result.passed ? "pass" : "fail"}">
          <strong>${result.passed ? "PASS" : "FAIL"}: ${result.label}</strong>
          <p>${result.message}</p>
        </div>
      `).join("")}
    </div>
    <p><strong>Country counts:</strong> no more than ${maxPerCountry} players from the same country.</p>
    <div class="country-count-list">
      ${Object.entries(countryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([country, count]) => `<span>${country}: ${count}</span>`)
        .join("")}
    </div>
    <p class="rule-note">Players marked <strong>needs_check</strong> have unknown country data. The app limits them as one cautious group, but real countries should be checked later.</p>
    <p class="rule-note">The recommendation engine uses official players, official prices, official positions, player quality labels, club and national performance, fixture difficulty, expected goals, budget, country limits, starting 11, and captain rules.</p>
    <p class="rule-note">If the official data completeness check fails, the fix is to add more official FIFA Fantasy player rows to <strong>data/fifaFantasyPlayers.json</strong> and rebuild <strong>data/players.json</strong>. The app will not fill missing official positions with prototype players.</p>
  `;

  formationSummary.innerHTML = `
    <strong>Formation used:</strong> ${formationUsed}
    <span>Built from the allowed formations in data/fantasyRules.json.</span>
  `;

  captainSummary.innerHTML = `
    <strong>Captain:</strong> ${captainPick.captain ? captainPick.captain.name : "No valid captain"}
    <span>${captainPick.reason}</span>
    <span>Captain multiplier: ${getCaptainMultiplierLabel()}.</span>
  `;

  squad.forEach((player, index) => {
    const item = document.createElement("article");
    item.className = "squad-list-item";
    const score = Math.round(playerScore(player, getUserChoices()));
    item.innerHTML = `
      <strong>#${index + 1} ${player.name}</strong>
      <span>${player.country} | ${getPlayerClub(player)} | ${getPlayerPosition(player)} | ${getPlayerPrice(player)} | score ${score}</span>
    `;
    fullSquadList.appendChild(item);
  });

  team.forEach((player, index) => {
    const line = document.querySelector(`#${getLineId(getPlayerPosition(player))}`);
    const token = document.createElement("div");
    token.className = "player-token";
    const isCaptain = captainPick.captain && getPlayerId(player) === getPlayerId(captainPick.captain);

    token.innerHTML = `
      <div class="shirt">${isCaptain ? "C" : index + 1}</div>
      <p class="token-name">${player.name}</p>
      <p class="token-position">${getPlayerPosition(player)}${isCaptain ? " | Captain" : ""}</p>
      <div class="player-details">
        <p><strong>Country:</strong> ${player.country}</p>
        <p><strong>Club:</strong> ${getPlayerClub(player)}</p>
        <p><strong>Official price:</strong> ${getPlayerPrice(player)}</p>
        <p><strong>Recommendation:</strong> ${Math.round(playerScore(player, getUserChoices()))}</p>
        <p><strong>Data quality:</strong> ${player.data_quality}</p>
        <p><strong>Status:</strong> ${player.recommendation_status}</p>
        <p><strong>Next:</strong> ${getFixtureContextText(player).replace("Next opponent: ", "")}</p>
        <p><strong>Club form:</strong> ${getClubFormText(player).replace("Club form: ", "")}</p>
        <p><strong>National form:</strong> ${getNationalFormText(player).replace("National form: ", "")}</p>
        <p class="reason">${getPlayerReason(player)}</p>
        <p class="data-note">${player.data_note}</p>
      </div>
    `;

    line.appendChild(token);
  });

  bench.forEach((player, index) => {
    benchLine.appendChild(createSimplePlayerToken(player, index + 1));
  });
}

// Create a compact pitch-style card for generated bench players
function createSimplePlayerToken(player, number) {
  const token = document.createElement("div");
  token.className = "player-token";

  token.innerHTML = `
    <div class="shirt">${number}</div>
    <p class="token-name">${player.name}</p>
    <p class="token-position">${getPlayerPosition(player)}</p>
    <div class="player-details">
      <p><strong>Country:</strong> ${player.country}</p>
      <p><strong>Club:</strong> ${getPlayerClub(player)}</p>
      <p><strong>Official price:</strong> ${getPlayerPrice(player)}</p>
      <p><strong>Recommendation:</strong> ${Math.round(playerScore(player, getUserChoices()))}</p>
      <p><strong>Next:</strong> ${getFixtureContextText(player).replace("Next opponent: ", "")}</p>
    </div>
  `;

  return token;
}

// Match positions to the correct pitch row
function getLineId(position) {
  if (position === "GK") return "keeperLine";
  if (position === "DEF") return "defenseLine";
  if (position === "MID") return "midfieldLine";
  return "forwardLine";
}

// Build the next-round outlook tab from player countries
function showOutlook(players) {
  const countries = [];

  getOfficialPlayerPool(players).forEach((player) => {
    if (!player.country || player.country === "needs_check") return;

    const existingCountry = countries.find((country) => country.name === player.country);
    const score = getPlayerAttackScore(player) + getPlayerDefenseScore(player) - getPlayerRiskScore(player);

    if (existingCountry) {
      existingCountry.playerCount++;
      existingCountry.totalScore += score;
    } else {
      countries.push({
        name: player.country,
        playerCount: 1,
        totalScore: score
      });
    }
  });

  const outlook = countries
    .map((country) => ({
      ...country,
      averageScore: Math.round(country.totalScore / country.playerCount)
    }))
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 8)
    .map((country) => ({
      label: "Country Outlook",
      title: country.name,
      text: "This country has strong players in the database, which may help when planning future fantasy selections.",
      rating: `Prototype rating: ${country.averageScore} | Players: ${country.playerCount}`
    }));

  showCards(outlook, "outlookList");
}

// Build the watchlist from cheaper official-pool players with useful recommendation scores.
function showWatchlist(players) {
  const choices = getUserChoices();
  const watchlist = getOfficialPlayerPool(players)
    .filter((player) => getPlayerPrice(player) <= 8.5)
    .sort((a, b) => playerScore(b, choices) - playerScore(a, choices))
    .slice(0, 6)
    .map((player) => ({
      label: "Watchlist",
      title: player.name,
      text: `${getPlayerClub(player)} ${getPlayerPosition(player)}. A lower-price official-pool option to watch before making transfers.`,
      rating: `Official price: ${getPlayerPrice(player)}`
    }));

  showCards(watchlist, "watchlistList");
}

// Show the full player database in a compact list
function showPlayerPool(players) {
  const count = document.querySelector("#playerPoolCount");
  const container = document.querySelector("#playerPoolList");
  const searchText = playerSearchInput.value.trim().toLowerCase();
  const sortBy = playerSortInput.value;
  const filteredPlayers = filterPlayers(players, {
    country: poolCountryFilter.value,
    position: poolPositionFilter.value,
    maxPrice: poolMaxPriceFilter.value
  })
    .filter(isOfficialFantasyPlayer)
    .filter((player) => {
      const text = `${player.name} ${getPlayerClub(player)} ${getPlayerPosition(player)}`.toLowerCase();
      return text.includes(searchText);
    })
    .sort((a, b) => sortPlayers(a, b, sortBy));

  count.textContent = `Showing ${filteredPlayers.length} of ${getOfficialPlayerPool(players).length} official FIFA Fantasy players`;
  container.innerHTML = "";

  filteredPlayers.forEach((player) => {
    const card = document.createElement("article");
    card.className = "pool-card";

    card.innerHTML = `
      <h3>${player.name}</h3>
      <p>${getPlayerClub(player)} | ${getPlayerPosition(player)} | ${player.recommendation_status}</p>
      <p>Official price: ${getPlayerPrice(player)} | Score: ${Math.round(playerScore(player, getUserChoices()))}</p>
      <p>Data: ${player.data_quality} | Club: ${player.club_data_quality} | National: ${player.national_team_data_quality}</p>
      <p>${getFixtureContextText(player)}</p>
      <p>${getClubFormText(player)}</p>
      <p>${getNationalFormText(player)}</p>
    `;

    container.appendChild(card);
  });
}

function setupFixtureFilters() {
  const countries = allTeams
    .filter((team) => team.country)
    .sort((a, b) => a.country.localeCompare(b.country));

  fixtureCountryFilter.innerHTML = `<option value="">All countries</option>`;

  countries.forEach((team) => {
    const option = document.createElement("option");
    option.value = team.team_id;
    option.textContent = team.country;
    fixtureCountryFilter.appendChild(option);
  });
}

function getTeamCountry(teamId) {
  return dataMaps.teamById?.get(teamId)?.country || teamId;
}

function showWeek6Data(players) {
  showDataFreshness();
  showOfficialDataSummary(players);
  showDataRuleValidation(players);
  showTeamDataSummary();
  showFixtures();
}

function showDataFreshness() {
  const container = document.querySelector("#dataFreshnessNote");
  container.innerHTML = `
    <strong>Last updated:</strong> June 5, 2026
    <span>Week 6 data sprint files loaded from the local data folder.</span>
  `;
}

function showOfficialDataSummary(players) {
  const officialPlayers = getOfficialPlayerPool(players);
  const positions = officialPlayers.reduce((counts, player) => {
    const position = getPlayerPosition(player);
    counts[position] = (counts[position] || 0) + 1;
    return counts;
  }, {});
  const prices = officialPlayers.map(getPlayerPrice);
  const container = document.querySelector("#officialDataSummary");

  container.innerHTML = `
    ${createDataCard("Official player pool", `${officialPlayers.length} players`, "Normal recommendations only use roster_status official_fantasy_pool.")}
    ${createDataCard("Positions", Object.entries(positions).map(([key, value]) => `${key}: ${value}`).join(" | ") || "needs_check", "Uses official_fantasy_position from data/players.json.")}
    ${createDataCard("Prices", `$${Math.min(...prices).toFixed(1)}m to $${Math.max(...prices).toFixed(1)}m`, "Uses official_price. Old prototype prices are not used when official prices exist.")}
    ${createDataCard("Rules file", fantasyRules.rules_version, fantasyRules.rules_status)}
  `;
}

function showDataRuleValidation(players) {
  const squad = buildFantasySquad(players);
  const startingTeam = buildStartingTeam(squad);
  const bench = buildBench(squad, startingTeam);
  const captainPick = chooseCaptain(startingTeam);
  const formation = getGeneratedFormation();
  const budgetInfo = getBudgetInfo(squad);
  const countryCounts = getCountryCounts(squad);
  const validationResults = validateSquad(squad, startingTeam, captainPick.captain, formation, budgetInfo, countryCounts);
  const isLegal = validationResults.every((result) => result.passed);
  const container = document.querySelector("#dataRuleValidation");

  container.innerHTML = `
    <h3>${isLegal ? "Squad is legal" : "Squad is not legal yet"}</h3>
    <div class="validation-list">
      ${validationResults.map((result) => `
        <div class="validation-item ${result.passed ? "pass" : "fail"}">
          <strong>${result.passed ? "PASS" : "FAIL"}: ${result.label}</strong>
          <p>${result.message}</p>
        </div>
      `).join("")}
    </div>
    <p><strong>Bench players:</strong> ${bench.length}</p>
    <p>The current official player file is incomplete, so this section may show failed GK or DEF requirements until more official rows are added.</p>
  `;
}

function showTeamDataSummary() {
  const container = document.querySelector("#teamDataSummary");
  const topTeams = allTeams
    .slice()
    .sort((a, b) => Number(a.fifa_ranking || 999) - Number(b.fifa_ranking || 999))
    .slice(0, 12);

  container.innerHTML = topTeams.map((team) => {
    const rating = team.team_elo || team.pele_rating || `FIFA rank ${team.fifa_ranking ?? "needs_check"}`;
    return createDataCard(team.country, `Group ${team.group}`, `Rating: ${rating}`);
  }).join("");
}

function showFixtures() {
  const container = document.querySelector("#fixtureList");
  const selectedTeamId = fixtureCountryFilter.value;
  const selectedMatchday = fixtureMatchdayFilter.value;
  const matchday = allMatchdays.find((item) => item.matchday_id === selectedMatchday);
  const fixtureIds = matchday ? new Set(matchday.fixture_ids) : new Set(allFixtures.map((fixture) => fixture.match_id));
  const fixtures = allFixtures
    .filter((fixture) => fixtureIds.has(fixture.match_id))
    .filter((fixture) => {
      if (!selectedTeamId) return true;
      return fixture.home_team_id === selectedTeamId || fixture.away_team_id === selectedTeamId;
    })
    .slice(0, 36);

  container.innerHTML = fixtures.map((fixture) => {
    const prediction = dataMaps.predictionsByMatchId.get(fixture.match_id);
    const homeDifficulty = fixtureDifficulty.find((row) => row.match_id === fixture.match_id && row.team_id === fixture.home_team_id);
    const awayDifficulty = fixtureDifficulty.find((row) => row.match_id === fixture.match_id && row.team_id === fixture.away_team_id);

    return `
      <article class="fixture-card">
        <div>
          <strong>${fixture.home_team} vs ${fixture.away_team}</strong>
          <p>${fixture.date} | ${fixture.matchday} | ${fixture.city || "venue needs_check"}</p>
        </div>
        <div class="fixture-meta">
          <span>${fixture.home_team_id}: ${homeDifficulty?.difficulty || "needs_check"} | xG ${prediction?.home_expected_goals ?? "?"}</span>
          <span>${fixture.away_team_id}: ${awayDifficulty?.difficulty || "needs_check"} | xG ${prediction?.away_expected_goals ?? "?"}</span>
          <span>${prediction?.prediction_label || "prediction needs_check"}</span>
        </div>
      </article>
    `;
  }).join("");
}

function createDataCard(title, value, text) {
  return `
    <article class="data-card">
      <p class="card-label">${title}</p>
      <h3>${value}</h3>
      <p>${text}</p>
    </article>
  `;
}

// Sort the player pool using the user's selected option
function sortPlayers(a, b, sortBy) {
  if (sortBy === "priceLow") return getPlayerPrice(a) - getPlayerPrice(b);
  if (sortBy === "priceHigh") return getPlayerPrice(b) - getPlayerPrice(a);
  if (sortBy === "club") return getPlayerClub(a).localeCompare(getPlayerClub(b));
  if (sortBy === "position") return getPlayerPosition(a).localeCompare(getPlayerPosition(b));
  if (sortBy === "attack") return getPlayerAttackScore(b) - getPlayerAttackScore(a);
  if (sortBy === "defense") return getPlayerDefenseScore(b) - getPlayerDefenseScore(a);
  if (sortBy === "risk") return getPlayerRiskScore(a) - getPlayerRiskScore(b);

  return playerScore(b, getUserChoices()) - playerScore(a, getUserChoices());
}

// Create clickable player slots for the custom team builder
function showCustomBuilder(players) {
  customSlots = [];

  getFormationPositions().forEach((group) => {
    for (let i = 1; i <= group.count; i++) {
      customSlots.push({
        id: `${group.position}-${i}`,
        label: `${group.label} ${i}`,
        position: group.position,
        playerId: null,
        isBench: false
      });
    }
  });

  getBenchPositions().forEach((group) => {
    for (let i = 1; i <= group.count; i++) {
      customSlots.push({
        id: `Bench-${group.position}-${i}`,
        label: `Bench ${group.label} ${i}`,
        position: group.position,
        playerId: null,
        isBench: true
      });
    }
  });

  activeSlotId = null;
  customSelectionPanel.classList.add("hidden");
  renderCustomSlots(players);
}

// Decide how many players each formation needs
function getFormationPositions() {
  const formation = formationSelect.value;
  const parts = formation.split("-").map((part) => Number(part));

  return [
    { label: "Goalkeeper", position: "GK", count: 1 },
    { label: "Defender", position: "DEF", count: parts[0] },
    { label: "Midfielder", position: "MID", count: parts[1] },
    { label: "Forward", position: "FWD", count: parts[2] }
  ];
}

// Build bench labels from the 15-player squad rules and chosen formation
function getBenchPositions() {
  const squadRules = getPositionRules();
  const startingPositions = getFormationPositions();
  const startingCounts = {
    GK: 1,
    DEF: startingPositions.find((group) => group.position === "DEF").count,
    MID: startingPositions.find((group) => group.position === "MID").count,
    FWD: startingPositions.find((group) => group.position === "FWD").count
  };

  return [
    { label: "Goalkeeper", position: "GK", count: squadRules.GK - startingCounts.GK },
    { label: "Defender", position: "DEF", count: squadRules.DEF - startingCounts.DEF },
    { label: "Midfielder", position: "MID", count: squadRules.MID - startingCounts.MID },
    { label: "Forward", position: "FWD", count: squadRules.FWD - startingCounts.FWD }
  ].filter((group) => group.count > 0);
}

// Draw every custom pitch and bench slot
function renderCustomSlots(players) {
  const customBudgetSummary = document.querySelector("#customBudgetSummary");
  const selectedPlayers = customSlots
    .map((slot) => players.find((item) => getPlayerId(item) === slot.playerId))
    .filter(Boolean);
  const budgetInfo = getBudgetInfo(selectedPlayers);

  document.querySelectorAll(".custom-pitch .player-line").forEach((line) => {
    line.innerHTML = "";
  });

  document.querySelector("#benchList").innerHTML = "";
  customBudgetSummary.innerHTML = `
    <div>
      <strong>Selected price:</strong> ${budgetInfo.totalPrice.toFixed(1)} ${getCurrencyLabel()}
    </div>
    <div>
      <strong>Remaining budget:</strong> ${budgetInfo.remainingBudget.toFixed(1)} ${getCurrencyLabel()}
    </div>
    <div>
      <strong>Max spend:</strong> ${budgetInfo.budget.toFixed(1)} ${getCurrencyLabel()}
    </div>
  `;
  customBudgetSummary.classList.toggle("warning", budgetInfo.isOverBudget);

  if (budgetInfo.isOverBudget) {
    customBudgetSummary.innerHTML += `<p>Your custom squad is over the max spend. Try choosing a cheaper player.</p>`;
  }

  customSlots.forEach((slot, index) => {
    const player = players.find((item) => getPlayerId(item) === slot.playerId);
    const token = createSlotToken(slot, player, index + 1);
    const line = slot.isBench
      ? document.querySelector("#benchList")
      : document.querySelector(`#${getCustomLineId(slot.position)}`);

    line.appendChild(token);
  });
}

// Match custom player positions to the correct custom pitch row
function getCustomLineId(position) {
  if (position === "GK") return "customKeeperLine";
  if (position === "DEF") return "customDefenseLine";
  if (position === "MID") return "customMidfieldLine";
  return "customForwardLine";
}

// Create one clickable pitch slot
function createSlotToken(slot, player, number) {
  const token = document.createElement("div");
  token.className = "player-token slot-token";
  token.dataset.slotId = slot.id;

  if (player) {
    token.innerHTML = `
      <div class="shirt">${number}</div>
      <p class="token-name">${player.name}</p>
      <p class="token-position">${getPlayerPosition(player)}</p>
      <div class="player-details">
        <p><strong>Country:</strong> ${player.country}</p>
        <p><strong>Club:</strong> ${getPlayerClub(player)}</p>
        <p><strong>Official price:</strong> ${getPlayerPrice(player)}</p>
        <p><strong>Recommendation:</strong> ${Math.round(playerScore(player, getUserChoices()))}</p>
        <p><strong>Status:</strong> ${player.recommendation_status}</p>
      </div>
    `;
  } else {
    token.innerHTML = `
      <div class="shirt empty-shirt">+</div>
      <p class="token-name">${slot.label}</p>
      <p class="token-position">${slot.position}</p>
      <div class="player-details">
        <p>Click to choose a ${getPositionLabel(slot.position).toLowerCase()}.</p>
      </div>
    `;
  }

  token.addEventListener("click", () => openPlayerSelection(slot.id));

  return token;
}

// Open the player list for a clicked slot
function openPlayerSelection(slotId) {
  activeSlotId = slotId;
  customPlayerSearchInput.value = "";
  customSelectionPanel.classList.remove("hidden");
  renderPlayerSelection(allPlayers);
}

// Show eligible players for the active slot
function renderPlayerSelection(players) {
  const slot = customSlots.find((item) => item.id === activeSlotId);
  const title = document.querySelector("#selectionTitle");
  const container = document.querySelector("#customPlayerOptions");
  const searchText = customPlayerSearchInput.value.trim().toLowerCase();
  const sortBy = customPlayerSortInput.value;
  const selectedIds = customSlots
    .filter((item) => item.id !== activeSlotId && item.playerId)
    .map((item) => item.playerId);

  title.textContent = `Choose ${slot.label}`;
  container.innerHTML = "";

  filterPlayers(getOfficialPlayerPool(players), {
    country: customCountryFilter.value,
    position: slot.position,
    maxPrice: customMaxPriceFilter.value
  })
    .filter((player) => !selectedIds.includes(getPlayerId(player)))
    .filter((player) => {
      const text = `${player.name} ${getPlayerClub(player)} ${getPlayerPosition(player)}`.toLowerCase();
      return text.includes(searchText);
    })
    .sort((a, b) => sortPlayers(a, b, sortBy))
    .forEach((player) => {
      const card = document.createElement("button");
      card.className = "pool-card selection-card";
      card.type = "button";

      card.innerHTML = `
        <h3>${player.name}</h3>
        <p>${getPlayerClub(player)} | ${getPlayerPosition(player)} | ${player.recommendation_status}</p>
        <p>Official price: ${getPlayerPrice(player)} | Score: ${Math.round(playerScore(player, getUserChoices()))} | Data: ${player.data_quality}</p>
      `;

      card.addEventListener("click", () => {
        slot.playerId = getPlayerId(player);
        renderCustomSlots(allPlayers);
        customSelectionPanel.classList.add("hidden");
      });

      container.appendChild(card);
    });
}

// Show a helpful message if players.json cannot load
function showLoadError() {
  showCards([
    {
      label: "Error",
      title: "The data files did not load",
      text: "Run the site with a local server so the browser can load the JSON files in the data folder.",
      rating: "Try: python3 -m http.server 8000"
    }
  ], "suggestionList");
}

// Switch tabs when a tab button is clicked
tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((tab) => tab.classList.remove("active"));
    tabPanels.forEach((panel) => panel.classList.remove("active"));

    button.classList.add("active");
    document.querySelector(`#${button.dataset.tab}`).classList.add("active");
  });
});

// Open and close compact filter panels
filterToggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.querySelector(`#${button.dataset.filterTarget}`);
    target.classList.toggle("hidden");
  });
});

// Load players.json and build the helper when the page opens
async function startWebsite() {
  try {
    // The app uses players, rules, and helper data files together.
    allPlayers = await loadPlayerData();
    fantasyRules = await loadFantasyRules();
    await loadRecommendationData();
    setupCountryFilters(allPlayers);
    setupFixtureFilters();
    setupFormationOptions();

    showSuggestions(allPlayers);
    showCaptains(allPlayers);
    showTeam(allPlayers);
    showCustomBuilder(allPlayers);
    showPlayerPool(allPlayers);
    showWeek6Data(allPlayers);
    showOutlook(allPlayers);
    showWatchlist(allPlayers);
  } catch (error) {
    showLoadError();
  }
}

startWebsite();

// Rebuild the visible results when the user changes their choices
[teamStyleInput, riskStyleInput, favoriteCountryInput].forEach((input) => {
  input.addEventListener("change", () => {
    if (allPlayers.length === 0) return;

    showSuggestions(allPlayers);
    showCaptains(allPlayers);
    showTeam(allPlayers);
    showPlayerPool(allPlayers);
    showWeek6Data(allPlayers);
    showWatchlist(allPlayers);
  });
});

// Rebuild the custom XI dropdowns when the formation changes
formationSelect.addEventListener("change", () => {
  if (allPlayers.length === 0) return;

  showCustomBuilder(allPlayers);
});

// Search and sort the full player pool
[playerSearchInput, playerSortInput].forEach((input) => {
  input.addEventListener("input", () => {
    if (allPlayers.length === 0) return;

    showPlayerPool(allPlayers);
  });
});

// Filter the Player Picks tab
[picksCountryFilter, picksPositionFilter, picksMaxPriceFilter].forEach((input) => {
  input.addEventListener("input", () => {
    if (allPlayers.length === 0) return;

    showSuggestions(allPlayers);
  });
});

// Filter the Player Pool tab
[poolCountryFilter, poolPositionFilter, poolMaxPriceFilter].forEach((input) => {
  input.addEventListener("input", () => {
    if (allPlayers.length === 0) return;

    showPlayerPool(allPlayers);
  });
});

// Filter the Week 6 fixture list
[fixtureCountryFilter, fixtureMatchdayFilter].forEach((input) => {
  input.addEventListener("input", () => {
    if (allFixtures.length === 0) return;

    showFixtures();
  });
});

// Search inside the custom player picker
[customPlayerSearchInput, customPlayerSortInput, customCountryFilter, customMaxPriceFilter].forEach((input) => {
  input.addEventListener("input", () => {
    if (allPlayers.length === 0 || !activeSlotId) return;

    renderPlayerSelection(allPlayers);
  });
});

// Close the custom player picker
closeSelectionButton.addEventListener("click", () => {
  customSelectionPanel.classList.add("hidden");
  activeSlotId = null;
});

customSelectionPanel.addEventListener("click", (event) => {
  if (event.target !== customSelectionPanel) return;

  customSelectionPanel.classList.add("hidden");
  activeSlotId = null;
});

// Download the current generated team as a JSON file
exportTeamButton.addEventListener("click", () => {
  if (!currentTeamExport) return;

  const json = JSON.stringify(currentTeamExport, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "worldcup-fantasy-team.json";
  link.click();

  URL.revokeObjectURL(url);
});
