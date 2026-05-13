const buildTeamButton = document.querySelector("#buildTeamButton");
const helperSection = document.querySelector("#helperSection");
const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");
const teamStyleInput = document.querySelector("#teamStyle");
const riskStyleInput = document.querySelector("#riskStyle");
const favoriteCountryInput = document.querySelector("#favoriteCountry");
const formationSelect = document.querySelector("#formationSelect");
const playerSearchInput = document.querySelector("#playerSearch");
const playerSortInput = document.querySelector("#playerSort");

let allPlayers = [];

// Load the real player database from players.json
async function loadPlayerData() {
  const response = await fetch("players.json");

  if (!response.ok) {
    throw new Error("Could not load players.json");
  }

  return response.json();
}

// Pick a simple 4-3-3 team from the player database
function buildStartingTeam(players) {
  const choices = getUserChoices();
  const goalkeepers = players.filter((player) => player.position === "Goalkeeper");
  const defenders = players.filter((player) => player.position === "Defender");
  const midfielders = players.filter((player) => player.position === "Midfielder");
  const forwards = players.filter((player) => player.position === "Forward");

  return [
    ...pickBestPlayers(goalkeepers, 1, choices),
    ...pickBestPlayers(defenders, 4, choices),
    ...pickBestPlayers(midfielders, 3, choices),
    ...pickBestPlayers(forwards, 3, choices)
  ];
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

// Build the "Who To Play" tab from players.json
function showSuggestions(players) {
  const choices = getUserChoices();
  const suggestions = pickBestPlayers(players, 6, choices).map((player) => ({
    label: "Start",
    title: player.name,
    text: `${player.club} ${player.position}. ${player.short_reason}`,
    rating: `Choice score: ${Math.round(playerScore(player, choices))}`
  }));

  showCards(suggestions, "suggestionList");
}

// Build the captain tab from the best attacking players
function showCaptains(players) {
  const choices = getUserChoices();
  const captainPicks = players
    .slice()
    .sort((a, b) => {
      const bScore = b.attack_score * 2 - b.risk_score;
      const aScore = a.attack_score * 2 - a.risk_score;
      return bScore - aScore;
    })
    .slice(0, 3)
    .map((player, index) => ({
      label: index === 0 ? "Best Pick" : "Captain Option",
      title: player.name,
      text: `${player.club} ${player.position}. Strong attacking option from the player database.`,
      rating: `Attack ${player.attack_score} | Risk ${player.risk_score}`
    }));

  if (choices.riskStyle === "risky") {
    captainPicks[0].label = "High Upside";
  }

  showCards(captainPicks, "captainList");
}

// Create the formation view with shirt-style player tokens
function showTeam(players) {
  const team = buildStartingTeam(players);

  document.querySelectorAll(".player-line").forEach((line) => {
    line.innerHTML = "";
  });

  team.forEach((player, index) => {
    const line = document.querySelector(`#${getLineId(player.position)}`);
    const token = document.createElement("div");
    token.className = "player-token";

    token.innerHTML = `
      <div class="shirt">${index + 1}</div>
      <p class="token-name">${player.name}</p>
      <p class="token-position">${player.position}</p>
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
}

// Match positions to the correct pitch row
function getLineId(position) {
  if (position === "Goalkeeper") return "keeperLine";
  if (position === "Defender") return "defenseLine";
  if (position === "Midfielder") return "midfieldLine";
  return "forwardLine";
}

// Build the next-round outlook tab from team Elo values
function showOutlook(players) {
  const teams = [];

  players.forEach((player) => {
    if (!player.team_elo) return;

    const existingTeam = teams.find((team) => team.name === player.club);

    if (existingTeam) {
      existingTeam.playerCount++;
    } else {
      teams.push({
        name: player.club,
        elo: player.team_elo,
        playerCount: 1
      });
    }
  });

  const outlook = teams
    .sort((a, b) => b.elo - a.elo)
    .slice(0, 5)
    .map((team) => ({
      label: "Strong Team",
      title: team.name,
      text: "This club has a strong team Elo rating in the source data, which can help with future fantasy planning.",
      rating: `Team Elo: ${team.elo}`
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
  const filteredPlayers = players
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

// Create dropdowns so the user can choose their own starting 11
function showCustomBuilder(players) {
  const builder = document.querySelector("#customBuilder");
  builder.innerHTML = "";

  const positions = getFormationPositions();

  positions.forEach((group) => {
    for (let i = 1; i <= group.count; i++) {
      const label = document.createElement("label");
      const select = document.createElement("select");
      const matchingPlayers = players.filter((player) => player.position === group.position);

      select.className = "custom-select";
      select.innerHTML = `<option value="">Choose ${group.label} ${i}</option>`;

      matchingPlayers.forEach((player) => {
        const option = document.createElement("option");
        option.value = player.id;
        option.textContent = `${player.name} - ${player.club}`;
        select.appendChild(option);
      });

      label.textContent = `${group.label} ${i}`;
      label.appendChild(select);
      builder.appendChild(label);
    }
  });

  document.querySelectorAll(".custom-select").forEach((select) => {
    select.addEventListener("change", () => showCustomTeam(players));
  });

  showCustomTeam(players);
  showBenchBuilder(players);
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

// Show the custom players the user selected
function showCustomTeam(players) {
  document.querySelectorAll(".custom-pitch .player-line").forEach((line) => {
    line.innerHTML = "";
  });

  const selectedIds = Array.from(document.querySelectorAll(".custom-select"))
    .map((select) => select.value)
    .filter((id) => id);

  selectedIds.forEach((id, index) => {
    const player = players.find((item) => item.id === id);
    const line = document.querySelector(`#${getCustomLineId(player.position)}`);
    const token = createPitchToken(player, index + 1);

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

// Create one pitch-style player card
function createPitchToken(player, number) {
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
      <p><strong>Attack:</strong> ${player.attack_score}</p>
      <p><strong>Defense:</strong> ${player.defense_score}</p>
      <p><strong>Risk:</strong> ${player.risk_score}</p>
    </div>
  `;

  return token;
}

// Create 5 bench slots from the full player database
function showBenchBuilder(players) {
  const builder = document.querySelector("#benchBuilder");
  builder.innerHTML = "";

  for (let i = 1; i <= 5; i++) {
    const label = document.createElement("label");
    const select = document.createElement("select");

    select.className = "bench-select";
    select.innerHTML = `<option value="">Choose Bench ${i}</option>`;

    players.forEach((player) => {
      const option = document.createElement("option");
      option.value = player.id;
      option.textContent = `${player.name} - ${player.club} (${player.position})`;
      select.appendChild(option);
    });

    label.textContent = `Bench ${i}`;
    label.appendChild(select);
    builder.appendChild(label);
  }

  document.querySelectorAll(".bench-select").forEach((select) => {
    select.addEventListener("change", () => showBench(players));
  });

  showBench(players);
}

// Show the bench players the user selected
function showBench(players) {
  const container = document.querySelector("#benchList");
  const selectedIds = Array.from(document.querySelectorAll(".bench-select"))
    .map((select) => select.value)
    .filter((id) => id);

  container.innerHTML = "";

  selectedIds.forEach((id) => {
    const player = players.find((item) => item.id === id);
    const card = createPitchToken(player, index + 1);

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

// Load players.json and build the helper when the button is clicked
buildTeamButton.addEventListener("click", async () => {
  helperSection.classList.remove("hidden");
  buildTeamButton.textContent = "Loading Players...";

  try {
    allPlayers = await loadPlayerData();

    showSuggestions(allPlayers);
    showCaptains(allPlayers);
    showTeam(allPlayers);
    showCustomBuilder(allPlayers);
    showPlayerPool(allPlayers);
    showOutlook(allPlayers);
    showWatchlist(allPlayers);

    buildTeamButton.textContent = "Rebuild My Team";
  } catch (error) {
    showLoadError();
    buildTeamButton.textContent = "Try Again";
  }
});

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
