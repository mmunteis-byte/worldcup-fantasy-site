// Fake starting 11 for the formation tab
const players = [
  { number: 1, name: "Alisson Becker", position: "GK", line: "keeperLine" },
  { number: 2, name: "Achraf Hakimi", position: "DEF", line: "defenseLine" },
  { number: 3, name: "Virgil van Dijk", position: "DEF", line: "defenseLine" },
  { number: 4, name: "Marquinhos", position: "DEF", line: "defenseLine" },
  { number: 5, name: "Theo Hernandez", position: "DEF", line: "defenseLine" },
  { number: 6, name: "Jude Bellingham", position: "MID", line: "midfieldLine" },
  { number: 7, name: "Kevin De Bruyne", position: "MID", line: "midfieldLine" },
  { number: 8, name: "Federico Valverde", position: "MID", line: "midfieldLine" },
  { number: 9, name: "Kylian Mbappe", position: "FWD", line: "forwardLine" },
  { number: 10, name: "Lionel Messi", position: "FWD", line: "forwardLine" },
  { number: 11, name: "Vinicius Junior", position: "FWD", line: "forwardLine" }
];

// Simple fantasy recommendations
const suggestions = [
  {
    label: "Start",
    title: "Kylian Mbappe",
    text: "High goal threat, penalty potential, and usually central to his team's attack.",
    rating: "Confidence: High"
  },
  {
    label: "Start",
    title: "Jude Bellingham",
    text: "A strong pick because he can earn points from goals, assists, and midfield involvement.",
    rating: "Confidence: High"
  },
  {
    label: "Risky",
    title: "Rotation Defender",
    text: "Avoid defenders from teams that may rotate. Clean sheet points disappear fast if they do not start.",
    rating: "Confidence: Medium"
  }
];

// Captain options with short reasons
const captainPicks = [
  {
    label: "Best Pick",
    title: "Kylian Mbappe",
    text: "Captain him when he faces a weaker defense because his scoring ceiling is huge.",
    rating: "Upside: Very High"
  },
  {
    label: "Safe Pick",
    title: "Lionel Messi",
    text: "A good captain if you want creativity, set pieces, and goal involvement.",
    rating: "Upside: High"
  },
  {
    label: "Differential",
    title: "Kevin De Bruyne",
    text: "Useful when you want a less obvious captain who can still deliver assists and bonus points.",
    rating: "Upside: Medium"
  }
];

// Teams that could be useful for future fantasy planning
const outlookTeams = [
  {
    label: "Strong Outlook",
    title: "France",
    text: "Deep squad, strong attack, and likely to create fantasy value across multiple rounds.",
    rating: "Future Value: High"
  },
  {
    label: "Strong Outlook",
    title: "Brazil",
    text: "Good attacking options and clean sheet potential make them useful for long-term planning.",
    rating: "Future Value: High"
  },
  {
    label: "Watch Closely",
    title: "England",
    text: "Lots of fantasy options, but choosing nailed starters matters because the squad is deep.",
    rating: "Future Value: Medium"
  }
];

// Extra tab idea: players to monitor before making transfers
const watchlist = [
  {
    label: "Transfer Target",
    title: "Attacking Fullbacks",
    text: "Look for defenders who cross often. They can get clean sheets and attacking returns.",
    rating: "Priority: High"
  },
  {
    label: "Value Pick",
    title: "Budget Midfielders",
    text: "Cheap midfielders who start every match help you spend more on premium forwards.",
    rating: "Priority: Medium"
  },
  {
    label: "Avoid",
    title: "Injury Doubts",
    text: "Do not waste transfers on players who may only play limited minutes.",
    rating: "Priority: High"
  }
];

const buildTeamButton = document.querySelector("#buildTeamButton");
const helperSection = document.querySelector("#helperSection");
const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");

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

// Create the formation view with shirt-style player tokens
function showTeam() {
  document.querySelectorAll(".player-line").forEach((line) => {
    line.innerHTML = "";
  });

  players.forEach((player) => {
    const line = document.querySelector(`#${player.line}`);
    const token = document.createElement("div");
    token.className = "player-token";

    token.innerHTML = `
      <div class="shirt">${player.number}</div>
      <p class="token-name">${player.name}</p>
      <p class="token-position">${player.position}</p>
    `;

    line.appendChild(token);
  });
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

// Show the full helper when the button is clicked
buildTeamButton.addEventListener("click", () => {
  helperSection.classList.remove("hidden");

  showCards(suggestions, "suggestionList");
  showCards(captainPicks, "captainList");
  showCards(outlookTeams, "outlookList");
  showCards(watchlist, "watchlistList");
  showTeam();
});
