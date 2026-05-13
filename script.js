const buildTeamButton = document.querySelector("#buildTeamButton");
const helperSection = document.querySelector("#helperSection");
const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");

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
  const goalkeepers = players.filter((player) => player.position === "Goalkeeper");
  const defenders = players.filter((player) => player.position === "Defender");
  const midfielders = players.filter((player) => player.position === "Midfielder");
  const forwards = players.filter((player) => player.position === "Forward");

  return [
    ...pickBestPlayers(goalkeepers, 1),
    ...pickBestPlayers(defenders, 4),
    ...pickBestPlayers(midfielders, 3),
    ...pickBestPlayers(forwards, 3)
  ];
}

// Sort players using the prototype scores from players.json
function pickBestPlayers(players, amount) {
  return players
    .slice()
    .sort((a, b) => playerScore(b) - playerScore(a))
    .slice(0, amount);
}

// Higher attack/defense is good, higher risk is bad
function playerScore(player) {
  return player.attack_score + player.defense_score - player.risk_score;
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
  const suggestions = pickBestPlayers(players, 6).map((player) => ({
    label: "Start",
    title: player.name,
    text: `${player.club} ${player.position}. ${player.short_reason}`,
    rating: `Attack ${player.attack_score} | Defense ${player.defense_score} | Risk ${player.risk_score}`
  }));

  showCards(suggestions, "suggestionList");
}

// Build the captain tab from the best attacking players
function showCaptains(players) {
  const captainPicks = players
    .slice()
    .sort((a, b) => b.attack_score - a.attack_score)
    .slice(0, 3)
    .map((player, index) => ({
      label: index === 0 ? "Best Pick" : "Captain Option",
      title: player.name,
      text: `${player.club} ${player.position}. Strong prototype attack score from the player database.`,
      rating: `Attack score: ${player.attack_score}`
    }));

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
  const watchlist = players
    .filter((player) => player.price <= 7.5)
    .sort((a, b) => playerScore(b) - playerScore(a))
    .slice(0, 6)
    .map((player) => ({
      label: "Watchlist",
      title: player.name,
      text: `${player.club} ${player.position}. A lower-price option to watch before making transfers.`,
      rating: `Price: ${player.price}`
    }));

  showCards(watchlist, "watchlistList");
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
    showOutlook(allPlayers);
    showWatchlist(allPlayers);

    buildTeamButton.textContent = "Rebuild My Team";
  } catch (error) {
    showLoadError();
    buildTeamButton.textContent = "Try Again";
  }
});
