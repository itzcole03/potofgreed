export interface PrizePickPlayer {
  name: string;
  sport: string;
  statType: string;
  line: number;
  direction: "over" | "under";
  actualValue?: number;
  isWin?: boolean;
  opponent?: string;
  matchStatus?: string;
}

export interface PrizePickLineup {
  type: string; // e.g., "6-Pick Flex Play"
  entryAmount: number;
  potentialPayout: number;
  actualPayout?: number;
  players: PrizePickPlayer[];
  date?: string;
  status: "pending" | "win" | "loss";
}

export interface PrizePickData {
  lineups: PrizePickLineup[];
}

// Sample PrizePick data based on the screenshots
export const samplePrizePickData: PrizePickData = {
  lineups: [
    {
      type: "6-Pick Flex Play",
      entryAmount: 5,
      potentialPayout: 120,
      status: "pending",
      players: [
        {
          name: "Doug Ghim",
          sport: "Golf",
          statType: "Strokes",
          line: 68,
          direction: "over",
          opponent: "PGA Old Greenwood RD 1",
          matchStatus: "now",
        },
        {
          name: "Kurt Kitayama",
          sport: "Golf",
          statType: "Strokes",
          line: 68,
          direction: "over",
          opponent: "PGA Old Greenwood RD 1",
          matchStatus: "now",
        },
        {
          name: "Nick Dunlap",
          sport: "Golf",
          statType: "Strokes",
          line: 69.5,
          direction: "under",
          opponent: "PGA Old Greenwood RD 1",
          matchStatus: "now",
        },
        {
          name: "Francesco Passaro",
          sport: "Tennis",
          statType: "Fantasy Score",
          line: 16.5,
          direction: "over",
          opponent: "vs J. Kym",
          matchStatus: "now",
        },
        {
          name: "Ekaterina Alexandrova",
          sport: "Tennis",
          statType: "Total Games",
          line: 18,
          direction: "over",
          opponent: "vs C. Werner",
          matchStatus: "Final",
        },
        {
          name: "Damir Dzumhur",
          sport: "Tennis",
          statType: "Total Games",
          line: 22.5,
          direction: "over",
          opponent: "vs H. Gaston",
          matchStatus: "now",
        },
      ],
    },
    {
      type: "3-Pick Flex Play",
      entryAmount: 2,
      potentialPayout: 2,
      actualPayout: 2,
      status: "win",
      date: "Jul 17, 2025 @ 12:03 PM",
      players: [
        {
          name: "Andrey Rublev",
          sport: "Tennis",
          statType: "Double Faults",
          line: 2.5,
          direction: "over",
          actualValue: 6,
          isWin: true,
          opponent: "vs A. Hernandez",
          matchStatus: "Final",
        },
        {
          name: "Varvara Gracheva",
          sport: "Tennis",
          statType: "Double Faults",
          line: 1.5,
          direction: "over",
          actualValue: 0,
          isWin: false,
          opponent: "vs S. Cirstea",
          matchStatus: "Final",
        },
        {
          name: "Irina-Camelia Begu",
          sport: "Tennis",
          statType: "Fantasy Score",
          line: 17,
          direction: "under",
          actualValue: 14.5,
          isWin: true,
          opponent: "vs V. Kasintseva",
          matchStatus: "Final",
        },
      ],
    },
  ],
};

export function parsePrizePickLineupsToBets(data: PrizePickData) {
  return data.lineups.map((lineup) => {
    const playersText = lineup.players
      .map((p) => `${p.name} ${p.direction} ${p.line} ${p.statType}`)
      .join(", ");

    const sport =
      lineup.players.length > 0 ? lineup.players[0].sport : "PrizePicks";

    return {
      id: `pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sport: `PrizePicks`,
      team: `${lineup.type} - ${playersText.slice(0, 50)}${playersText.length > 50 ? "..." : ""}`,
      odds: calculatePrizePickOdds(lineup.entryAmount, lineup.potentialPayout),
      stake: lineup.entryAmount,
      result: lineup.status as "win" | "loss" | "pending",
      payout:
        lineup.actualPayout ||
        (lineup.status === "win" ? lineup.potentialPayout : undefined),
      date: lineup.date
        ? formatPrizePickDate(lineup.date)
        : new Date().toISOString().split("T")[0],
      // Store the full PrizePick lineup details for expanded view
      prizePickDetails: lineup,
    };
  });
}

function calculatePrizePickOdds(
  entryAmount: number,
  potentialPayout: number,
): string {
  const profit = potentialPayout - entryAmount;
  const percentage = (profit / entryAmount) * 100;

  if (percentage > 0) {
    return `+${Math.round(percentage)}`;
  } else {
    return `${Math.round(percentage)}`;
  }
}

function formatPrizePickDate(dateString: string): string {
  try {
    // Parse "Jul 17, 2025 @ 12:03 PM" format
    const cleanDate = dateString.replace(" @ ", " ");
    const date = new Date(cleanDate);
    return date.toISOString().split("T")[0];
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

// Function to parse text input (for manual entry)
export function parsePrizePickText(text: string): PrizePickLineup[] {
  // This would parse text descriptions of PrizePick lineups
  // For now, returns sample data
  return samplePrizePickData.lineups;
}

// Function to validate PrizePick data structure
export function validatePrizePickData(data: any): data is PrizePickData {
  if (!data || !Array.isArray(data.lineups)) return false;

  return data.lineups.every(
    (lineup: any) =>
      typeof lineup.type === "string" &&
      typeof lineup.entryAmount === "number" &&
      typeof lineup.potentialPayout === "number" &&
      Array.isArray(lineup.players) &&
      lineup.players.every(
        (player: any) =>
          typeof player.name === "string" &&
          typeof player.sport === "string" &&
          typeof player.statType === "string" &&
          typeof player.line === "number" &&
          (player.direction === "over" || player.direction === "under"),
      ),
  );
}
