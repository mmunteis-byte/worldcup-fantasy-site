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

let allPlayers = [];
let customSlots = [];
let activeSlotId = null;
let activeHeroSlide = 0;

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

  for (let i = 1; i <= 5; i++) {
    customSlots.push({
      id: `Bench-${i}`,
      label: `Bench ${i}`,
      position: "Any",
      playerId: null,
      isBench: true
    });
  }

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

// Draw every custom pitch and bench slot
function renderCustomSlots(players) {
  document.querySelectorAll(".custom-pitch .player-line").forEach((line) => {
    line.innerHTML = "";
  });

  document.querySelector("#benchList").innerHTML = "";

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
        <p>Click to choose a ${slot.position === "Any" ? "bench player" : slot.position.toLowerCase()}.</p>
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
    position: slot.position === "Any" ? "" : slot.position,
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
    allPlayers = await loadPlayerData();
    setupCountryFilters(allPlayers);

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
