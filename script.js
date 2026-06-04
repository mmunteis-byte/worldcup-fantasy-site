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
const heroSlides = document.querySelectorAll(".hero-slide");
const heroDots = document.querySelectorAll(".hero-dot");
const filterToggleButtons = document.querySelectorAll(".filter-toggle");
const exportTeamButton = document.querySelector("#exportTeamButton");

let allPlayers = [];
let fantasyRules = null;
let customSlots = [];
let activeSlotId = null;
let activeHeroSlide = 0;
let currentTeamExport = null;

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
  const response = await fetch("players.json");

  if (!response.ok) {
    throw new Error("Could not load players.json");
  }

  return response.json();
}

// Load the draft fantasy rules from fantasyRules.json
async function loadFantasyRules() {
  const response = await fetch("fantasyRules.json");

  if (!response.ok) {
    throw new Error("Could not load fantasyRules.json");
  }

  return response.json();
}

// Build a 15-player squad using the position rules from fantasyRules.json
function buildFantasySquad(players) {
  const choices = getUserChoices();
  const positionRules = fantasyRules.squad.positions;
  const budget = fantasyRules.budget.initial_budget;
  const squad = [];
  const countryCounts = {};

  addBudgetPicks(squad, countryCounts, getPlayersByPosition(players, "Goalkeeper"), positionRules.GK, choices, budget);
  addBudgetPicks(squad, countryCounts, getPlayersByPosition(players, "Defender"), positionRules.DEF, choices, budget);
  addBudgetPicks(squad, countryCounts, getPlayersByPosition(players, "Midfielder"), positionRules.MID, choices, budget);
  addBudgetPicks(squad, countryCounts, getPlayersByPosition(players, "Forward"), positionRules.FWD, choices, budget);

  return squad;
}

// Find players by the website's position names
function getPlayersByPosition(players, position) {
  return players.filter((player) => player.position === position);
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
        && player.price <= averageBudgetPerSlot + 1.5;
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

// Respect the group-stage country limit from fantasyRules.json
function canAddCountry(player, countryCounts) {
  const country = player.country || "needs_check";
  const maxPerCountry = fantasyRules.country_limits.group_stage_max_per_country;

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
  const positionRules = fantasyRules.squad.positions;
  const maxPerCountry = fantasyRules.country_limits.group_stage_max_per_country;
  const squadPositionCounts = {
    GK: getPlayersByPosition(squad, "Goalkeeper").length,
    DEF: getPlayersByPosition(squad, "Defender").length,
    MID: getPlayersByPosition(squad, "Midfielder").length,
    FWD: getPlayersByPosition(squad, "Forward").length
  };
  const formationParts = formation.split("-").map((part) => Number(part));
  const countryLimitPassed = Object.values(countryCounts).every((count) => count <= maxPerCountry);
  const captainInStarting11 = startingTeam.some((player) => player.id === captain.id);

  return [
    {
      label: "Squad size",
      passed: squad.length === fantasyRules.squad.total_players,
      message: `Squad has ${squad.length} players. It should have exactly ${fantasyRules.squad.total_players}.`
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
      passed: startingTeam.length === fantasyRules.starting_lineup.total_players,
      message: `Starting lineup has ${startingTeam.length} players. It should have exactly ${fantasyRules.starting_lineup.total_players}.`
    },
    {
      label: "Formation",
      passed: fantasyRules.starting_lineup.allowed_formations.includes(formation)
        && formationParts[0] >= 3
        && formationParts[1] >= 2
        && formationParts[2] >= 1,
      message: `${formation} must be in fantasyRules.json and include at least 3 DEF, 2 MID, and 1 FWD.`
    },
    {
      label: "Captain",
      passed: Boolean(captain) && captainInStarting11,
      message: captain ? `${captain.name} is selected from the starting 11.` : "No captain was selected."
    }
  ];
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

  currentTeamExport = {
    site_name: "World Cup Fantasy Team Helper",
    user_prompt: "Draft Week 5 fantasy squad generated from player data and prototype rules.",
    team_name: "Generated Fantasy Squad",
    formation: formationUsed,
    players: squad,
    starting_11: startingTeam,
    bench,
    captain: captainPick.captain.name,
    total_price: Number(budgetInfo.totalPrice.toFixed(1)),
    remaining_budget: Number(budgetInfo.remainingBudget.toFixed(1)),
    strategy: `${choices.teamStyle} team style with ${choices.riskStyle} risk style`,
    risk_score: Math.round(getAverageScore(squad, "risk_score")),
    attack_score: Math.round(getAverageScore(squad, "attack_score")),
    defense_score: Math.round(getAverageScore(squad, "defense_score")),
    rule_checks: getRuleChecksObject(validationResults),
    explanation: captainPick.reason,
    data_sources: [
      "players.json",
      "dataSources.md",
      "FPL-Core-Insights",
      "transfermarktPlayers.csv"
    ],
    rules_sources: [
      "fantasyRules.json",
      "rulesSources.md",
      "FIFA World Cup 2022 fantasy",
      "UEFA EURO 2024 fantasy",
      "FIFA Club World Cup fantasy",
      "Fantasy Premier League"
    ]
  };
}

// Average one numeric field across the squad
function getAverageScore(players, field) {
  if (players.length === 0) return 0;

  const total = players.reduce((sum, player) => sum + Number(player[field] || 0), 0);
  return total / players.length;
}

// Calculate the total price of a squad
function getSquadTotalPrice(squad) {
  return squad.reduce((total, player) => total + Number(player.price || 0), 0);
}

// Count how many squad slots are still empty
function getRemainingSquadSlots(squad) {
  return fantasyRules.squad.total_players - squad.length;
}

// Create simple budget information for display
function getBudgetInfo(squad) {
  const totalPrice = getSquadTotalPrice(squad);
  const budget = fantasyRules.budget.initial_budget;

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
    ...pickBestPlayers(getPlayersByPosition(squad, "Goalkeeper"), 1, choices),
    ...pickBestPlayers(getPlayersByPosition(squad, "Defender"), parts[0], choices),
    ...pickBestPlayers(getPlayersByPosition(squad, "Midfielder"), parts[1], choices),
    ...pickBestPlayers(getPlayersByPosition(squad, "Forward"), parts[2], choices)
  ];
}

// Use one allowed formation from fantasyRules.json for the generated XI
function getGeneratedFormation() {
  const allowedFormations = fantasyRules.starting_lineup.allowed_formations;

  if (allowedFormations.includes(formationSelect.value)) {
    return formationSelect.value;
  }

  return allowedFormations.includes("4-3-3") ? "4-3-3" : allowedFormations[0];
}

// The bench is the rest of the 15-player squad after the starting 11
function buildBench(squad, startingTeam) {
  const starterIds = startingTeam.map((player) => player.id);

  return squad.filter((player) => !starterIds.includes(player.id));
}

// Choose a captain from the starting 11 using simple style-based logic
function chooseCaptain(startingTeam) {
  const choices = getUserChoices();
  let reason = "";

  const captain = startingTeam
    .slice()
    .sort((a, b) => captainScore(b, choices) - captainScore(a, choices))[0];

  if (choices.teamStyle === "attacking") {
    reason = "Chosen because attacking teams prefer the highest attack score from the starting 11.";
  } else if (choices.riskStyle === "safe") {
    reason = "Chosen because safe teams prefer a strong overall player with lower risk.";
  } else {
    reason = "Chosen because balanced teams prefer the best combined attack and defense score.";
  }

  return { captain, reason };
}

// Score captain options based on the user's selected style
function captainScore(player, choices) {
  if (choices.teamStyle === "attacking") {
    return player.attack_score * 2 - player.risk_score;
  }

  if (choices.riskStyle === "safe") {
    return player.attack_score + player.defense_score - player.risk_score * 2;
  }

  return player.attack_score + player.defense_score - player.risk_score;
}

// Read the choices from the form controls
function getUserChoices() {
  return {
    teamStyle: teamStyleInput.value,
    riskStyle: riskStyleInput.value,
    favoriteCountry: favoriteCountryInput.value.trim().toLowerCase()
  };
}

// Sort players using the prototype scores from players.json
function pickBestPlayers(players, amount, choices = getUserChoices()) {
  return players
    .slice()
    .sort((a, b) => playerScore(b, choices) - playerScore(a, choices))
    .slice(0, amount);
}

// Score a player based on the user's choices
function playerScore(player, choices) {
  let score = 0;

  if (choices.teamStyle === "attacking") {
    score += player.attack_score * 2;
    score += player.defense_score;
  } else if (choices.teamStyle === "defensive") {
    score += player.defense_score * 2;
    score += player.attack_score;
  } else {
    score += player.attack_score;
    score += player.defense_score;
  }

  if (choices.riskStyle === "safe") {
    score -= player.risk_score * 1.5;
  } else {
    score -= player.risk_score * 0.5;
  }

  if (choices.favoriteCountry && String(player.country).toLowerCase() === choices.favoriteCountry) {
    score += 12;
  }

  return score;
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

  fantasyRules.starting_lineup.allowed_formations.forEach((formation) => {
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
    if (filters.position && player.position !== filters.position) return false;
    if (filters.maxPrice && player.price > maxPrice) return false;

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
  const playerPicks = pickBestPlayers(filteredPlayers, 15, choices);

  container.innerHTML = "";

  playerPicks.forEach((player, index) => {
    const card = document.createElement("article");
    card.className = "advice-card";

    card.innerHTML = `
      <div class="advice-rank">#${index + 1}</div>
      <div>
        <h3>${player.name}</h3>
        <p><strong>Country:</strong> ${player.country}</p>
        <p><strong>Team:</strong> ${player.club}</p>
        <p><strong>Position:</strong> ${player.position}</p>
        <p><strong>Price:</strong> ${player.price}</p>
        <p><strong>Choice score:</strong> ${Math.round(playerScore(player, choices))}</p>
        <p class="advice-reason">${player.short_reason}</p>
      </div>
    `;

    container.appendChild(card);
  });
}

// Build the captain tab from the best attacking players
function showCaptains(players) {
  const choices = getUserChoices();
  const captainPlayers = players
    .slice()
    .sort((a, b) => {
      const bScore = b.attack_score * 2 - b.risk_score;
      const aScore = a.attack_score * 2 - a.risk_score;
      return bScore - aScore;
    })
    .slice(0, 6);

  const container = document.querySelector("#captainList");
  container.innerHTML = "";

  captainPlayers.forEach((player, index) => {
    const card = document.createElement("article");
    card.className = "captain-card";
    const captainScore = player.attack_score * 2 - player.risk_score;

    card.innerHTML = `
      <div class="captain-top">
        <p class="card-label">${index === 0 ? "Best Captain" : "Captain Option"}</p>
        <p class="captain-score">Captain score: ${captainScore}</p>
      </div>
      <h3>${player.name}</h3>
      <div class="captain-data">
        <p><strong>Country:</strong> ${player.country}</p>
        <p><strong>Team:</strong> ${player.club}</p>
        <p><strong>Position:</strong> ${player.position}</p>
        <p><strong>Price:</strong> ${player.price}</p>
        <p><strong>Attack:</strong> ${player.attack_score}</p>
        <p><strong>Defense:</strong> ${player.defense_score}</p>
        <p><strong>Risk:</strong> ${player.risk_score}</p>
        <p><strong>Team Elo:</strong> ${player.team_elo || "needs_check"}</p>
      </div>
      <p class="captain-reason">${player.short_reason}</p>
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
  const maxPerCountry = fantasyRules.country_limits.group_stage_max_per_country;
  const validationResults = validateSquad(squad, team, captainPick.captain, formationUsed, budgetInfo, countryCounts);
  saveCurrentTeamExport(squad, team, bench, captainPick, formationUsed, budgetInfo, validationResults);

  document.querySelectorAll(".player-line").forEach((line) => {
    line.innerHTML = "";
  });
  benchLine.innerHTML = "";
  fullSquadList.innerHTML = "";

  budgetSummary.innerHTML = `
    <div>
      <strong>Total price:</strong> ${budgetInfo.totalPrice.toFixed(1)} ${fantasyRules.budget.currency_label}
    </div>
    <div>
      <strong>Remaining budget:</strong> ${budgetInfo.remainingBudget.toFixed(1)} ${fantasyRules.budget.currency_label}
    </div>
    <div>
      <strong>Max spend:</strong> ${budgetInfo.budget.toFixed(1)} ${fantasyRules.budget.currency_label}
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
  `;

  formationSummary.innerHTML = `
    <strong>Formation used:</strong> ${formationUsed}
    <span>Built from the allowed formations in fantasyRules.json.</span>
  `;

  captainSummary.innerHTML = `
    <strong>Captain:</strong> ${captainPick.captain.name}
    <span>${captainPick.reason}</span>
    <span>Captain multiplier: ${fantasyRules.captain.captain_points_multiplier}x points.</span>
  `;

  squad.forEach((player, index) => {
    const item = document.createElement("article");
    item.className = "squad-list-item";
    item.innerHTML = `
      <strong>#${index + 1} ${player.name}</strong>
      <span>${player.country} | ${player.club} | ${player.position} | ${player.price}</span>
    `;
    fullSquadList.appendChild(item);
  });

  team.forEach((player, index) => {
    const line = document.querySelector(`#${getLineId(player.position)}`);
    const token = document.createElement("div");
    token.className = "player-token";
    const isCaptain = player.id === captainPick.captain.id;

    token.innerHTML = `
      <div class="shirt">${isCaptain ? "C" : index + 1}</div>
      <p class="token-name">${player.name}</p>
      <p class="token-position">${player.position}${isCaptain ? " | Captain" : ""}</p>
      <div class="player-details">
        <p><strong>Country:</strong> ${player.country}</p>
        <p><strong>Club:</strong> ${player.club}</p>
        <p><strong>Price:</strong> ${player.price}</p>
        <p><strong>Attack:</strong> ${player.attack_score}</p>
        <p><strong>Defense:</strong> ${player.defense_score}</p>
        <p><strong>Risk:</strong> ${player.risk_score}</p>
        <p class="reason">${player.short_reason}</p>
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
    <p class="token-position">${player.position}</p>
    <div class="player-details">
      <p><strong>Country:</strong> ${player.country}</p>
      <p><strong>Club:</strong> ${player.club}</p>
      <p><strong>Price:</strong> ${player.price}</p>
    </div>
  `;

  return token;
}

// Match positions to the correct pitch row
function getLineId(position) {
  if (position === "Goalkeeper") return "keeperLine";
  if (position === "Defender") return "defenseLine";
  if (position === "Midfielder") return "midfieldLine";
  return "forwardLine";
}

// Build the next-round outlook tab from player countries
function showOutlook(players) {
  const countries = [];

  players.forEach((player) => {
    if (!player.country || player.country === "needs_check") return;

    const existingCountry = countries.find((country) => country.name === player.country);
    const score = player.attack_score + player.defense_score - player.risk_score;

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

// Build the watchlist from cheaper players with useful prototype scores
function showWatchlist(players) {
  const choices = getUserChoices();
  const watchlist = players
    .filter((player) => player.price <= 7.5)
    .sort((a, b) => playerScore(b, choices) - playerScore(a, choices))
    .slice(0, 6)
    .map((player) => ({
      label: "Watchlist",
      title: player.name,
      text: `${player.club} ${player.position}. A lower-price option to watch before making transfers.`,
      rating: `Price: ${player.price}`
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
    .filter((player) => {
      const text = `${player.name} ${player.club} ${player.position}`.toLowerCase();
      return text.includes(searchText);
    })
    .sort((a, b) => sortPlayers(a, b, sortBy));

  count.textContent = `Showing ${filteredPlayers.length} of ${players.length} sourced players`;
  container.innerHTML = "";

  filteredPlayers.forEach((player) => {
    const card = document.createElement("article");
    card.className = "pool-card";

    card.innerHTML = `
      <h3>${player.name}</h3>
      <p>${player.club} | ${player.position}</p>
      <p>Price: ${player.price} | Attack: ${player.attack_score} | Defense: ${player.defense_score} | Risk: ${player.risk_score}</p>
    `;

    container.appendChild(card);
  });
}

// Sort the player pool using the user's selected option
function sortPlayers(a, b, sortBy) {
  if (sortBy === "priceLow") return a.price - b.price;
  if (sortBy === "priceHigh") return b.price - a.price;
  if (sortBy === "club") return a.club.localeCompare(b.club);
  if (sortBy === "position") return a.position.localeCompare(b.position);
  if (sortBy === "attack") return b.attack_score - a.attack_score;
  if (sortBy === "defense") return b.defense_score - a.defense_score;
  if (sortBy === "risk") return a.risk_score - b.risk_score;

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
    { label: "Goalkeeper", position: "Goalkeeper", count: 1 },
    { label: "Defender", position: "Defender", count: parts[0] },
    { label: "Midfielder", position: "Midfielder", count: parts[1] },
    { label: "Forward", position: "Forward", count: parts[2] }
  ];
}

// Build bench labels from the 15-player squad rules and chosen formation
function getBenchPositions() {
  const squadRules = fantasyRules.squad.positions;
  const startingPositions = getFormationPositions();
  const startingCounts = {
    Goalkeeper: 1,
    Defender: startingPositions.find((group) => group.position === "Defender").count,
    Midfielder: startingPositions.find((group) => group.position === "Midfielder").count,
    Forward: startingPositions.find((group) => group.position === "Forward").count
  };

  return [
    { label: "Goalkeeper", position: "Goalkeeper", count: squadRules.GK - startingCounts.Goalkeeper },
    { label: "Defender", position: "Defender", count: squadRules.DEF - startingCounts.Defender },
    { label: "Midfielder", position: "Midfielder", count: squadRules.MID - startingCounts.Midfielder },
    { label: "Forward", position: "Forward", count: squadRules.FWD - startingCounts.Forward }
  ].filter((group) => group.count > 0);
}

// Draw every custom pitch and bench slot
function renderCustomSlots(players) {
  const customBudgetSummary = document.querySelector("#customBudgetSummary");
  const selectedPlayers = customSlots
    .map((slot) => players.find((item) => item.id === slot.playerId))
    .filter(Boolean);
  const budgetInfo = getBudgetInfo(selectedPlayers);

  document.querySelectorAll(".custom-pitch .player-line").forEach((line) => {
    line.innerHTML = "";
  });

  document.querySelector("#benchList").innerHTML = "";
  customBudgetSummary.innerHTML = `
    <div>
      <strong>Selected price:</strong> ${budgetInfo.totalPrice.toFixed(1)} ${fantasyRules.budget.currency_label}
    </div>
    <div>
      <strong>Remaining budget:</strong> ${budgetInfo.remainingBudget.toFixed(1)} ${fantasyRules.budget.currency_label}
    </div>
    <div>
      <strong>Max spend:</strong> ${budgetInfo.budget.toFixed(1)} ${fantasyRules.budget.currency_label}
    </div>
  `;
  customBudgetSummary.classList.toggle("warning", budgetInfo.isOverBudget);

  if (budgetInfo.isOverBudget) {
    customBudgetSummary.innerHTML += `<p>Your custom squad is over the max spend. Try choosing a cheaper player.</p>`;
  }

  customSlots.forEach((slot, index) => {
    const player = players.find((item) => item.id === slot.playerId);
    const token = createSlotToken(slot, player, index + 1);
    const line = slot.isBench
      ? document.querySelector("#benchList")
      : document.querySelector(`#${getCustomLineId(slot.position)}`);

    line.appendChild(token);
  });
}

// Match custom player positions to the correct custom pitch row
function getCustomLineId(position) {
  if (position === "Goalkeeper") return "customKeeperLine";
  if (position === "Defender") return "customDefenseLine";
  if (position === "Midfielder") return "customMidfieldLine";
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
      <p class="token-position">${player.position}</p>
      <div class="player-details">
        <p><strong>Country:</strong> ${player.country}</p>
        <p><strong>Club:</strong> ${player.club}</p>
        <p><strong>Price:</strong> ${player.price}</p>
        <p><strong>Attack:</strong> ${player.attack_score}</p>
        <p><strong>Defense:</strong> ${player.defense_score}</p>
        <p><strong>Risk:</strong> ${player.risk_score}</p>
      </div>
    `;
  } else {
    token.innerHTML = `
      <div class="shirt empty-shirt">+</div>
      <p class="token-name">${slot.label}</p>
      <p class="token-position">${slot.position}</p>
      <div class="player-details">
        <p>Click to choose a ${slot.position.toLowerCase()}.</p>
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

  filterPlayers(players, {
    country: customCountryFilter.value,
    position: slot.position,
    maxPrice: customMaxPriceFilter.value
  })
    .filter((player) => !selectedIds.includes(player.id))
    .filter((player) => {
      const text = `${player.name} ${player.club} ${player.position}`.toLowerCase();
      return text.includes(searchText);
    })
    .sort((a, b) => sortPlayers(a, b, sortBy))
    .forEach((player) => {
      const card = document.createElement("button");
      card.className = "pool-card selection-card";
      card.type = "button";

      card.innerHTML = `
        <h3>${player.name}</h3>
        <p>${player.club} | ${player.position}</p>
        <p>Price: ${player.price} | Attack: ${player.attack_score} | Defense: ${player.defense_score} | Risk: ${player.risk_score}</p>
      `;

      card.addEventListener("click", () => {
        slot.playerId = player.id;
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
      title: "players.json did not load",
      text: "Run the site with a local server instead of double-clicking index.html.",
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
    // The app uses one JSON file for players and one JSON file for rules.
    allPlayers = await loadPlayerData();
    fantasyRules = await loadFantasyRules();
    setupCountryFilters(allPlayers);
    setupFormationOptions();

    showSuggestions(allPlayers);
    showCaptains(allPlayers);
    showTeam(allPlayers);
    showCustomBuilder(allPlayers);
    showPlayerPool(allPlayers);
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
