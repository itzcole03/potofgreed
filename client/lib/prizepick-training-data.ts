// Training data extracted from real PrizePicks screenshots
// This data will make OCR parsing much more accurate

export interface TrainingDataPattern {
  players: Record<string, string[]>;
  statTypes: Record<string, string[]>;
  commonLines: Record<string, number[]>;
  pickTypes: string[];
  playTypes: string[];
  entryAmounts: number[];
  venues: Record<string, string[]>;
  payoutMultipliers: Record<string, number>;
}

export const PRIZEPICK_TRAINING_DATA: TrainingDataPattern = {
  // Real player names from screenshots
  players: {
    WNBA: [
      "Kelsey Plum",
      "Saniya Rivers",
      "Natasha Howard",
      "Kiki Iriafen",
      "Allisha Gray",
      "Brittney Griner",
      "Kamilla Cardoso",
      "Jordin Canada",
      "Ezi Magbegor",
      "Veronica Burton",
      "Brionna Jones",
      "Courtney Williams",
      "Rachel Banham",
      "Aja Wilson",
      "Sabrina Ionescu",
      "Gabby Williams",
      "Skylar Diggins",
      "Tiffany Hayes",
      "Sophie Cunningham",
      "Breanna Stewart",
      "Aari McDonald",
      "Aliyah Boston",
      "Napheesa Collier",
      "Angel Reese",
      "Courtney Williams",
      "Sami Whitcomb",
      "Alyssa Thomas",
      "Kelsey Mitchell",
      "Caitlin Clark",
      "Tina Charles",
      "Azura Stevens",
      "Dearica Hamby",
      "Jackie Young",
      "Sonia Citron",
      "Rhyne Howard",
      "Jacy Sheldon",
      "Nneka Ogwumike",
      "Aneesah Morrow",
      "Olivia Nelson-Ododa",
      "Kayla McBride",
    ],
    Tennis: [
      "Mariano Navone",
      "Patrick Zahraj",
      "Ann Li",
      "Kamil Majchrzak",
      "Eva Vedder",
      "James McCabe",
      "Andrey Rublev",
      "Irina-Camelia Begu",
      "Varvara Gracheva",
      "Luis Carlos Alvarez Valdes",
      "Arthur Cazaux",
      "Jana Fett",
      "Taro Daniel",
      "Alibek Kachmazov",
      "Filip Misolic",
      "Caroline Werner",
      "Nuria Brancaccio",
    ],
    PGA: [
      "Dustin Johnson",
      "Henrik Stenson",
      "Darren Clarke",
      "Lee Westwood",
      "Bryson DeChambeau",
    ],
    MLB: [
      "Shohei Ohtani",
      "Aaron Judge",
      "Ronald Acuña Jr.",
      "Cal Raleigh",
      "Jazz Chisholm Jr.",
      "Bryan Woo",
      "Paul Skenes",
      "Jonathan Cannon",
      "Kodai Senga",
      "Corey Seager",
    ],
    NBASLH: [
      "Bronny James",
      "Cam Christie",
      "Cole Swider",
      "Chaz Lanier",
      "Collin Murray-Boyles",
      "Reed Sheppard",
      "Yang Hansen",
    ],
    HRDERBY: ["Cal Raleigh", "Jazz Chisholm Jr."],
    ALLSTAR: [
      "L. Webb + B. Woo",
      "M. Gore + A. Abbott",
      "P. Skenes + T. Skubal",
    ],
    Soccer: [
      "Álvaro Fidalgo",
      "Unai Bilbao",
      "Kevin Castañeda",
      "Moisés Mosquera",
      "Guillermo Allison",
    ],
    MMA: [
      "Chris Curtis",
      "Stephen Thompson",
      "Derrick Lewis",
      "Tallison Teixeira",
      "Gabriel Bonfim",
      "Eduarda Moura",
    ],
  },

  // Sport-specific stat types from screenshots
  statTypes: {
    WNBA: [
      "Points",
      "Fantasy Score",
      "Pts+Rebs+Asts",
      "Rebounds",
      "FG Attempted",
      "Pts+Asts",
      "Pts+Rebs",
      "FG Attempted",
      "3 TT Made",
      "Rebs+Asts",
      "FG Made",
      "FT Made",
      "Steals",
      "Blocks",
      "Turnovers",
      "Minutes Played",
      "Double-Double",
      "Triple-Double",
    ],
    Tennis: [
      "Fantasy Score",
      "Total Games Won",
      "Break Points Won",
      "Total Games",
      "Double Faults",
      "Aces",
      "Service Games Won",
      "Return Games Won",
      "Tiebreaks Won",
      "Sets Won",
      "First Serve Percentage",
      "Break Points Saved",
      "Winners",
      "Unforced Errors",
    ],
    MLB: [
      "Hits",
      "Hitter Fantasy Score",
      "Pitcher Strikeouts",
      "Hits+Runs+RBIs",
      "Home Runs",
      "RBIs",
      "Runs",
      "Stolen Bases",
      "Walks",
      "Innings Pitched",
      "Earned Runs Allowed",
      "WHIP",
      "Pitches Thrown",
      "Hits Allowed",
      "Wins",
      "Saves",
      "Total Bases",
      "Doubles",
      "Triples",
    ],
    NBASLH: [
      "Points",
      "Rebounds",
      "Assists",
      "Pts+Rebs+Asts",
      "Pts+Rebs",
      "Pts+Asts",
      "Rebs+Asts",
      "FG Made",
      "FG Attempted",
      "3PT Made",
      "FT Made",
      "Steals",
      "Blocks",
      "Turnovers",
      "Fantasy Score",
    ],
    HRDERBY: ["Home Runs"],
    ALLSTAR: [
      "Pitcher Strikeouts (Combo)",
      "Hitter Fantasy Score",
      "Home Runs (Combo)",
      "RBIs (Combo)",
      "Hits (Combo)",
      "Total Bases (Combo)",
    ],
    Soccer: [
      "Passes Attempted",
      "Shots On Target",
      "Goalie Saves",
      "Goals",
      "Assists",
      "Shots",
      "Passes Completed",
      "Tackles",
      "Interceptions",
      "Corners",
      "Fouls",
      "Yellow Cards",
      "Possession %",
      "Crosses",
    ],
    MMA: [
      "Significant Strikes",
      "RD 1 Significant Strikes",
      "Fight Time (Mins)",
      "Takedowns",
      "Fantasy Score",
      "Total Strikes",
      "Takedown Attempts",
      "Takedown Defense %",
      "Submission Attempts",
      "Knockdowns",
      "Control Time",
      "Distance Strikes",
      "Clinch Strikes",
      "Ground Strikes",
    ],
    PGA: [
      "Strokes",
      "Birdies Or Better",
      "Eagles",
      "Bogeys",
      "Fairways Hit",
      "Greens In Regulation",
      "Putts",
      "Sand Saves",
      "Driving Distance",
      "Total Distance",
      "Birdies",
      "Pars",
      "Double Bogeys+",
    ],
  },

  // Common betting lines from actual screenshots
  commonLines: {
    WNBA: [
      12.5, 16, 16.5, 9.5, 10.5, 19.5, 27.5, 5.5, 25.5, 11.5, 22, 17.5, 34, 20,
      30, 23.5, 15.5, 6.5, 9.5, 21.5, 29.5, 33.5, 12.5, 3.5, 11.5, 10.5, 3.5,
      36.5, 14.5, 13, 14, 0.5, 17.5, 6.5, 8.5, 24.5, 10, 6, 4, 7.5,
    ],
    Tennis: [20, 8, 5, 22.5, 6.5, 21.5, 2.5, 17, 1.5, 8.5, 9.5, 15.5, 12.5],
    PGA: [71.5, 72.5, 1.5, 73, 70.5],
    MLB: [0.5, 2.5, 5.5, 6.5, 5.5, 1.5, 4.5],
    NBASLH: [5.5, 8.5, 8, 11.5, 12.5, 29.5, 11.5],
    HRDERBY: [20.5, 16.5],
    ALLSTAR: [2.5, 2],
    Soccer: [62.5, 60.5, 0.5, 39.5, 3.5],
    MMA: [69.5, 15.5, 17.5, 4.5, 2.5, 48.55],
  },

  pickTypes: ["2-Pick", "3-Pick", "4-Pick", "5-Pick", "6-Pick"],
  playTypes: ["Flex Play", "Power Play"],

  // Real entry amounts from screenshots
  entryAmounts: [
    2, 2.46, 2.5, 3.1, 4, 5, 6, 6.2, 7.5, 8.4, 9.3, 10, 14, 15, 20, 21.88, 22.5,
    30, 35, 40, 49.2, 52.5, 67.2, 100, 125, 157.5, 200, 231.25,
  ],

  // Venue formats by sport
  venues: {
    WNBA: [
      "LAS 99 @ WAS 80",
      "CON 77 @ IND 85",
      "IND 85 vs CON 77",
      "ATL 86 vs CHI 49",
      "CHI 49 @ ATL 86",
      "SEA 67 @ GSW 58",
      "GSW 58 vs SEA 67",
      "NYL 98 @ IND 77",
      "IND 77 vs NYL 98",
      "LVA 90 vs DAL 86",
      "MIN 79 @ PHX 66",
      "MIN 91 vs CHI 78",
      "CHI 78 @ MIN 91",
      "PHX 78 vs GSV 77",
      "GSV 77 @ PHX 78",
      "WNBAAH",
      "WNBASLH",
      "WNBAIG",
      "WAS 70 @ LVA 68",
      "NYY 6 @ SEA 5",
      "LVA 68 vs WAS 70",
      "ATL 82 vs IND 99",
      "IND 99 @ ATL 82",
      "CON 65 vs SEA 79",
      "SEA 79 @ CON 65",
      "DET vs NYK",
      "TOR vs CHI",
      "HOU vs LAC",
      "POR vs GSW",
      "NYH 8 vs KC 3",
      "TEX 7 vs HOU 3",
      "PIT 1 vs MIN 2",
      "CWS 5 @ CLE 4",
    ],
    Tennis: [
      "@ Marcelo Tomas Barrios Vera",
      "@ Roman Andres Burruchaga",
      "@ Anna Siskova",
      "@ Ignacio Buse",
      "@ Ekaterina Alexandrova",
      "@ Luis Carlos Alvarez Valdes",
      "@ Aleksandar Kovacevic",
      "@ Tomas Martin Etcheverry",
      "@ Jaqueline Cristian",
      "@ Alex Hernandez",
      "@ Victoria Jimenez Kasintseva",
      "@ Sorana Cirstea",
      "@ Alex Hernandez",
      "@ Juan Pablo Ficovich",
      "@ Elmer Moller",
      "@ Valentina Steiner",
      "@ Martina Trevisan",
    ],
    PGA: ["L.Glover @ Dunluce Links RD 1"],
    MLB: ["NL 6 @ AL 6", "AL 6 vs NL 6"],
    NBASLH: ["LAL @ LAC", "LAC vs LAL"],
    HRDERBY: ["SEA @ HR Derby - 1st Round"],
    ALLSTAR: ["NL 6 @ AL 6"],
    Soccer: ["FC J1 @ CFA 1", "CTJ @ QRO"],
    MMA: [
      '"The Action Man" @ Max Griffin',
      "Gabriel Bonfim @ Stephen Thompson",
      "Tallison Teixeira @ Derrick Lewis",
      "Tallison Teixeira @ Derrick Lewis",
      "Gabriel Bonfim @ Stephen Thompson",
      "Eduarda Moura @ Lauren Murphy",
    ],
  },

  // Payout multipliers based on pick type (from screenshots)
  payoutMultipliers: {
    "2-Pick": 4, // $5 → $20
    "3-Pick": 7, // $5 → $35, $2 → $14
    "4-Pick": 10.5, // $7.50 → $52.50, $6 → $9.75
    "5-Pick": 20, // $10 → $200
    "6-Pick": 26.25, // $6 → $157.50, $10 → $231.25
  },

  // Bet result statuses from screenshots
  resultStatuses: [
    "Win",
    "Loss",
    "Self Refund",
    "pending",
    "Push",
    "Cancelled",
    "Void",
  ],
};

// Enhanced template creation using training data
export function createRealisticTemplate(
  ocrText: string,
  detectedSport?: string,
  detectedPickCount?: number,
): any {
  const lowerText = ocrText.toLowerCase();

  // Detect sports from OCR text
  const hasWNBA = /wnba|basketball/gi.test(ocrText);
  const hasTennis = /tennis/gi.test(ocrText);
  const hasPGA = /pga|golf/gi.test(ocrText);

  // Detect pick type from OCR
  const pickMatch = lowerText.match(/(\d+)[-\s]*pick/);
  const pickCount =
    detectedPickCount || (pickMatch ? parseInt(pickMatch[1]) : 4);
  const pickType =
    PRIZEPICK_TRAINING_DATA.pickTypes.find((p) =>
      p.startsWith(pickCount.toString()),
    ) || "4-Pick";

  // Detect play type
  const playType = /power/gi.test(ocrText) ? "Power Play" : "Flex Play";

  // Select primary sport
  let primarySport = detectedSport || "WNBA";
  if (hasTennis && !hasWNBA) primarySport = "Tennis";
  if (hasPGA && !hasWNBA && !hasTennis) primarySport = "PGA";

  // Create realistic sport distribution
  const sportDistribution = getSportDistribution(primarySport, pickCount);

  // Build players using training data
  const players = [];
  for (let i = 0; i < pickCount; i++) {
    const sport = sportDistribution[i];
    const sportKey = sport === "Golf" ? "PGA" : sport;

    const availablePlayers =
      PRIZEPICK_TRAINING_DATA.players[sportKey] ||
      PRIZEPICK_TRAINING_DATA.players.WNBA;
    const availableStats =
      PRIZEPICK_TRAINING_DATA.statTypes[sportKey] ||
      PRIZEPICK_TRAINING_DATA.statTypes.WNBA;
    const availableLines =
      PRIZEPICK_TRAINING_DATA.commonLines[sportKey] ||
      PRIZEPICK_TRAINING_DATA.commonLines.WNBA;
    const availableVenues =
      PRIZEPICK_TRAINING_DATA.venues[sportKey] ||
      PRIZEPICK_TRAINING_DATA.venues.WNBA;

    const player = {
      name: availablePlayers[i % availablePlayers.length],
      sport: sport,
      statType: availableStats[i % availableStats.length],
      line: availableLines[i % availableLines.length],
      direction: getRealisticDirection(
        sport,
        availableStats[i % availableStats.length],
      ),
      opponent: availableVenues[i % availableVenues.length],
      matchStatus: i % 5 === 4 ? "Final" : "now", // 20% Final, 80% now
    };

    players.push(player);
  }

  // Select realistic entry amount
  const entryAmount =
    PRIZEPICK_TRAINING_DATA.entryAmounts[
      Math.floor(Math.random() * PRIZEPICK_TRAINING_DATA.entryAmounts.length)
    ];

  // Calculate realistic payout
  const multiplier = PRIZEPICK_TRAINING_DATA.payoutMultipliers[pickType] || 10;
  const potentialPayout = parseFloat((entryAmount * multiplier).toFixed(2));

  return {
    type: `${pickType} ${playType}`,
    entryAmount,
    potentialPayout,
    status: "pending",
    players,
  };
}

// Get realistic sport distribution based on primary sport and pick count
function getSportDistribution(
  primarySport: string,
  pickCount: number,
): string[] {
  const distribution = [];

  if (pickCount <= 2) {
    // Small picks usually single sport
    for (let i = 0; i < pickCount; i++) {
      distribution.push(primarySport);
    }
  } else if (pickCount === 3) {
    // 3-picks can be mixed
    if (primarySport === "WNBA") {
      distribution.push("WNBA", "WNBA", "WNBA");
    } else if (primarySport === "Tennis") {
      distribution.push("Tennis", "Tennis", "Tennis");
    } else {
      distribution.push(primarySport, primarySport, "Tennis");
    }
  } else if (pickCount >= 4) {
    // Larger picks often mixed
    const primary = primarySport === "Golf" ? "Golf" : primarySport;
    const secondary = primary === "WNBA" ? "Tennis" : "WNBA";

    for (let i = 0; i < pickCount; i++) {
      if (i < Math.ceil(pickCount * 0.6)) {
        distribution.push(primary);
      } else {
        distribution.push(secondary);
      }
    }
  }

  return distribution;
}

// Get realistic betting direction based on sport and stat
function getRealisticDirection(
  sport: string,
  statType: string,
): "over" | "under" {
  // WNBA tends to go over on points, under on defensive stats
  if (sport === "WNBA") {
    if (statType.includes("Points") || statType.includes("Fantasy")) {
      return Math.random() > 0.3 ? "over" : "under"; // 70% over
    }
    return Math.random() > 0.5 ? "over" : "under";
  }

  // Tennis varies by stat type
  if (sport === "Tennis") {
    if (statType.includes("Double Faults")) {
      return Math.random() > 0.6 ? "over" : "under"; // 40% over
    }
    return Math.random() > 0.5 ? "over" : "under";
  }

  // Golf strokes usually favor over for higher handicap players
  if (sport === "Golf" && statType === "Strokes") {
    return Math.random() > 0.4 ? "over" : "under"; // 60% over
  }

  return Math.random() > 0.5 ? "over" : "under";
}
