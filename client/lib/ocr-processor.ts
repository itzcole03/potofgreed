import Tesseract from "tesseract.js";
import { PrizePickLineup, PrizePickPlayer } from "./prizepick-parser";

export interface OCRProgress {
  status: string;
  progress: number;
}

export class OCRProcessor {
  private worker: Tesseract.Worker | null = null;

  async initialize() {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker("eng", 1, {
        logger: (m) => console.log("OCR:", m),
      });

      // Configure OCR for better mobile screenshot recognition
      await this.worker.setParameters({
        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .$-",
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
        preserve_interword_spaces: "1",
      });
    }
    return this.worker;
  }

  async processImage(
    imageFile: File,
    onProgress?: (progress: OCRProgress) => void,
  ): Promise<string> {
    try {
      const worker = await this.initialize();

      if (onProgress) {
        onProgress({ status: "Processing image...", progress: 25 });
      }

      // Enhanced recognition with better parameters for mobile screenshots
      const {
        data: { text, confidence },
      } = await worker.recognize(imageFile, {
        rectangle: undefined,
      });

      console.log(`OCR completed with confidence: ${confidence}%`);
      console.log("Raw OCR text:", text);

      if (onProgress) {
        onProgress({ status: "Text extraction complete", progress: 100 });
      }

      return text;
    } catch (error) {
      console.error("OCR processing error:", error);
      throw new Error("Failed to process image");
    }
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export function parsePrizePickFromOCR(ocrText: string): PrizePickLineup[] {
  console.log("Raw OCR Text:", ocrText);

  const lineups: PrizePickLineup[] = [];
  const text = ocrText.toLowerCase();

  // More flexible pattern matching
  const pickPatterns = [
    /([0-9]+)\s*[-]*\s*pick\s+flex\s+play/gi,
    /([0-9]+)\s*[-]*\s*pick\s+power\s+play/gi,
    /([0-9]+)\s*pick/gi,
  ];

  const moneyPatterns = [
    /\$([0-9]+)\s*(?:to\s+pay|paid)\s*\$([0-9]+)/gi,
    /([0-9]+)\s*to\s+pay\s*([0-9]+)/gi,
    /([0-9]+)\s*paid\s*([0-9]+)/gi,
  ];

  // Find pickup type
  let pickType = "Flex Play";
  let pickCount = 3;

  for (const pattern of pickPatterns) {
    const match = pattern.exec(text);
    if (match) {
      pickCount = parseInt(match[1]);
      pickType = match[0].includes("power") ? "Power Play" : "Flex Play";
      break;
    }
  }

  // Find money amounts
  let entryAmount = 5;
  let potentialPayout = 25;
  let isPaid = false;

  for (const pattern of moneyPatterns) {
    const match = pattern.exec(text);
    if (match) {
      entryAmount = parseInt(match[1]);
      potentialPayout = parseInt(match[2]);
      isPaid = match[0].includes("paid");
      break;
    }
  }

  // Extract all potential player names (capitalized words)
  const namePattern = /[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?/g;
  const names = [...ocrText.matchAll(namePattern)].map((m) => m[0]);

  // Extract numbers that could be lines
  const numberPattern = /\b(\d+(?:\.\d+)?)\b/g;
  const numbers = [...ocrText.matchAll(numberPattern)]
    .map((m) => parseFloat(m[1]))
    .filter((n) => n > 0.5 && n < 100); // Reasonable range for sport lines

  // Extract sports
  const sportPattern = /(NFL|NBA|NHL|MLB|TENNIS|PGA|GOLF|SOCCER)/gi;
  const sports = [...ocrText.matchAll(sportPattern)].map((m) => {
    const sport = m[1].toLowerCase();
    return sport === "pga"
      ? "Golf"
      : sport.charAt(0).toUpperCase() + sport.slice(1);
  });

  // Extract stat types
  const statPattern =
    /(strokes|fantasy\s+score|double\s+faults|total\s+games|points|assists|rebounds|touchdowns)/gi;
  const stats = [...ocrText.matchAll(statPattern)].map((m) =>
    m[1]
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" "),
  );

  // Create players from extracted data
  const players: PrizePickPlayer[] = [];
  const maxPlayers = Math.min(pickCount, names.length, 6);

  for (let i = 0; i < maxPlayers; i++) {
    const player: PrizePickPlayer = {
      name: names[i] || `Player ${i + 1}`,
      sport: sports[i % sports.length] || "Unknown",
      statType: stats[i % stats.length] || "Points",
      line: numbers[i % numbers.length] || 10 + Math.random() * 20,
      direction: Math.random() > 0.5 ? "over" : "under",
    };
    players.push(player);
  }

  // Only create lineup if we found meaningful data
  if (players.length > 0 && (names.length > 0 || sports.length > 0)) {
    const lineup: PrizePickLineup = {
      type: `${pickCount}-Pick ${pickType}`,
      entryAmount,
      potentialPayout,
      actualPayout: isPaid ? potentialPayout : undefined,
      status: isPaid ? "win" : "pending",
      players,
    };

    lineups.push(lineup);
  }

  console.log("Parsed lineups:", lineups);
  return lineups;
}

// Enhanced parser that looks for specific PrizePick patterns
export function parseAdvancedPrizePickFromOCR(
  ocrText: string,
): PrizePickLineup[] {
  console.log("Advanced parsing OCR text:", ocrText);

  // Try structured parsing first, then fall back to aggressive
  const structuredLineups = parseStructuredPrizePickFromOCR(ocrText);
  if (structuredLineups.length > 0) {
    console.log("Structured parsing successful:", structuredLineups);
    return structuredLineups;
  }

  // Fall back to aggressive parsing
  const lineups = parseAggressivePrizePickFromOCR(ocrText);
  console.log("Fallback parsing result:", lineups);
  return lineups;
}

// Structured parser for mobile PrizePicks interface
function parseStructuredPrizePickFromOCR(ocrText: string): PrizePickLineup[] {
  console.log("Structured parsing OCR text:", ocrText);

  const lines = ocrText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  console.log("OCR Lines:", lines);

  // Parse header information
  const headerInfo = parseLineupHeader(lines);
  if (!headerInfo) {
    console.log("Could not parse lineup header");
    return [];
  }

  console.log("Header info:", headerInfo);

  // Parse player sections
  const players = parsePlayerSections(lines);
  console.log("Parsed players:", players);

  if (players.length === 0) {
    console.log("No players found");
    return [];
  }

  const lineup: PrizePickLineup = {
    type: headerInfo.type,
    entryAmount: headerInfo.entryAmount,
    potentialPayout: headerInfo.potentialPayout,
    status: "pending",
    players,
  };

  return [lineup];
}

// Parse the header section to get lineup type and money info
function parseLineupHeader(lines: string[]) {
  let pickCount = 3;
  let type = "Flex Play";
  let entryAmount = 5;
  let potentialPayout = 25;

  for (const line of lines) {
    // Look for "6-Pick Flex Play" pattern
    const pickMatch = line.match(/(\d+)[-\s]*Pick\s+(Flex|Power)\s+Play/i);
    if (pickMatch) {
      pickCount = parseInt(pickMatch[1]);
      type = `${pickCount}-Pick ${pickMatch[2]} Play`;
      console.log("Found pick type:", type);
      continue;
    }

    // Look for "$5 to pay $120" pattern
    const moneyMatch = line.match(/\$(\d+)\s+to\s+pay\s+\$(\d+)/i);
    if (moneyMatch) {
      entryAmount = parseInt(moneyMatch[1]);
      potentialPayout = parseInt(moneyMatch[2]);
      console.log("Found money:", { entryAmount, potentialPayout });
      continue;
    }
  }

  return { type, entryAmount, potentialPayout };
}

// Parse individual player sections
function parsePlayerSections(lines: string[]): PrizePickPlayer[] {
  const players: PrizePickPlayer[] = [];
  const sportContexts: string[] = [];
  let currentSport = "Unknown";
  let currentOpponent = "";
  let currentStatus = "now";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect sport context lines (PGA, TENNIS, etc.)
    const sportMatch = line.match(
      /^(PGA|TENNIS|NBA|NFL|NHL|MLB|SOCCER)\s+(.*?)(?:\s+(now|Final|\d+:\d+))?$/i,
    );
    if (sportMatch) {
      currentSport =
        sportMatch[1].toUpperCase() === "PGA"
          ? "Golf"
          : sportMatch[1].charAt(0).toUpperCase() +
            sportMatch[1].slice(1).toLowerCase();
      currentOpponent = sportMatch[2] || "";
      currentStatus = sportMatch[3] || "now";
      console.log("Found sport context:", {
        currentSport,
        currentOpponent,
        currentStatus,
      });
      continue;
    }

    // Look for player names (usually capitalized)
    const nameMatch = line.match(
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*([A-Z])?\s*$/i,
    );
    if (nameMatch) {
      const playerName = nameMatch[1];

      // Look ahead for stat information
      const statInfo = findPlayerStatInfo(lines, i + 1);
      if (statInfo) {
        const player: PrizePickPlayer = {
          name: playerName,
          sport: currentSport,
          statType: statInfo.statType,
          line: statInfo.line,
          direction: statInfo.direction,
          opponent: currentOpponent,
          matchStatus: currentStatus,
        };

        players.push(player);
        console.log("Added player:", player);
      }
    }
  }

  return players;
}

// Find stat information for a player by looking at subsequent lines
function findPlayerStatInfo(
  lines: string[],
  startIndex: number,
): {
  statType: string;
  line: number;
  direction: "over" | "under";
} | null {
  // Look at next few lines for stat patterns
  for (let i = startIndex; i < Math.min(startIndex + 3, lines.length); i++) {
    const line = lines[i];

    // Look for patterns like "↑ 68 Strokes", "↓ 69.5 Strokes", "↑ 16.5 Fantasy Score"
    const statMatch = line.match(
      /[↑↓⬆⬇]?\s*(\d+(?:\.\d+)?)\s*(Strokes|Fantasy\s+Score|Total\s+Games|Double\s+Faults|Points|Assists|Rebounds)/i,
    );
    if (statMatch) {
      const line_value = parseFloat(statMatch[1]);
      const statType = statMatch[2];

      // Determine direction from arrow or common patterns
      const direction =
        line.includes("↓") || line.includes("⬇") || line.includes("under")
          ? "under"
          : "over";

      return {
        statType: statType
          .split(" ")
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(" "),
        line: line_value,
        direction,
      };
    }

    // Alternative pattern: look for number patterns without arrows
    const numberMatch = line.match(/(\d+(?:\.\d+)?)/);
    if (numberMatch) {
      const line_value = parseFloat(numberMatch[1]);

      // Look for stat type in context
      const contextLine = lines[i + 1] || lines[i - 1] || "";
      let statType = "Points";

      if (contextLine.match(/strokes?/i)) statType = "Strokes";
      else if (contextLine.match(/fantasy|score/i)) statType = "Fantasy Score";
      else if (contextLine.match(/total.*games?/i)) statType = "Total Games";
      else if (contextLine.match(/double.*faults?/i))
        statType = "Double Faults";

      return {
        statType,
        line: line_value,
        direction: Math.random() > 0.5 ? "over" : "under", // Default random when unclear
      };
    }
  }

  return null;
}

// Aggressive parser for messy OCR text
function parseAggressivePrizePickFromOCR(ocrText: string): PrizePickLineup[] {
  console.log("Aggressive parser processing:", ocrText);

  // Clean up the text
  const cleanText = ocrText
    .replace(/[^a-zA-Z0-9\s\$\.\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const text = cleanText.toLowerCase();

  console.log("Cleaned text:", cleanText);

  // Very loose indicators - if it's a screenshot, assume it's PrizePicks
  const hasAnyText = text.length > 10;

  if (!hasAnyText) {
    console.log("Not enough text found");
    return [];
  }

  // Extract ALL numbers
  const allNumbers =
    cleanText.match(/\d+(?:\.\d+)?/g)?.map((n) => parseFloat(n)) || [];
  console.log("Found numbers:", allNumbers);

  // Extract ALL words
  const allWords = cleanText.match(/[A-Za-z]+/g) || [];
  console.log("Found words:", allWords);

  // Look for money patterns more aggressively
  let entryAmount = 5;
  let potentialPayout = 50;
  let isPaid = false;

  // Find entry/payout amounts
  for (let i = 0; i < allNumbers.length - 1; i++) {
    const first = allNumbers[i];
    const second = allNumbers[i + 1];

    // Look for reasonable entry/payout combinations
    if (first >= 1 && first <= 100 && second > first && second <= 10000) {
      entryAmount = first;
      potentialPayout = second;
      break;
    }
  }

  // Check if it's a winning ticket
  isPaid =
    text.includes("paid") || text.includes("won") || text.includes("win");

  // Extract potential names from consecutive capitalized words
  const words = cleanText.split(" ");
  const possibleNames: string[] = [];

  for (let i = 0; i < words.length - 1; i++) {
    const word1 = words[i];
    const word2 = words[i + 1];

    // Look for patterns like "FirstName LastName"
    if (/^[A-Z][a-z]{2,}$/.test(word1) && /^[A-Z][a-z]{2,}$/.test(word2)) {
      possibleNames.push(`${word1} ${word2}`);
    }

    // Also try common name patterns
    if (/^[A-Z][a-z]+$/.test(word1) && word1.length > 2) {
      for (let j = i + 1; j < Math.min(i + 3, words.length); j++) {
        const nextWord = words[j];
        if (/^[A-Z][a-z]+$/.test(nextWord) && nextWord.length > 2) {
          possibleNames.push(`${word1} ${nextWord}`);
          break;
        }
      }
    }
  }

  // Remove duplicates
  const uniqueNames = [...new Set(possibleNames)];
  console.log("Found possible names:", uniqueNames);

  // Extract sports
  const sportsMapping = {
    tennis: "Tennis",
    golf: "Golf",
    pga: "Golf",
    nfl: "NFL",
    nba: "NBA",
    nhl: "NHL",
    mlb: "MLB",
    soccer: "Soccer",
    football: "NFL",
  };

  const foundSports: string[] = [];
  Object.entries(sportsMapping).forEach(([key, value]) => {
    if (text.includes(key)) {
      foundSports.push(value);
    }
  });

  console.log("Found sports:", foundSports);

  // Extract stat types
  const statMapping = {
    strokes: "Strokes",
    fantasy: "Fantasy Score",
    score: "Fantasy Score",
    double: "Double Faults",
    faults: "Double Faults",
    total: "Total Games",
    games: "Total Games",
    points: "Points",
    assists: "Assists",
    rebounds: "Rebounds",
  };

  const foundStats: string[] = [];
  Object.entries(statMapping).forEach(([key, value]) => {
    if (text.includes(key) && !foundStats.includes(value)) {
      foundStats.push(value);
    }
  });

  console.log("Found stats:", foundStats);

  // Get numbers that could be betting lines (0.5 to 100)
  const possibleLines = allNumbers.filter((n) => n >= 0.5 && n <= 100);

  // Enhanced name extraction using common PrizePicks player patterns
  const enhancedNames = extractPlayerNamesEnhanced(cleanText);
  const finalNames = enhancedNames.length > 0 ? enhancedNames : uniqueNames;

  console.log("Enhanced names:", enhancedNames);
  console.log("Final names:", finalNames);

  // Create lineup if we have ANY useful data
  if (
    finalNames.length > 0 ||
    foundSports.length > 0 ||
    allNumbers.length > 0
  ) {
    // Determine number of picks
    let pickCount = 3;
    const pickMatch = text.match(/(\d+)\s*pick/);
    if (pickMatch) {
      pickCount = parseInt(pickMatch[1]);
    } else if (uniqueNames.length > 0) {
      pickCount = Math.min(6, Math.max(3, uniqueNames.length));
    }

    const lineup: PrizePickLineup = {
      type: `${pickCount}-Pick Flex Play (OCR)`,
      entryAmount,
      potentialPayout,
      actualPayout: isPaid ? potentialPayout : undefined,
      status: isPaid ? "win" : "pending",
      players: [],
    };

    // Create players
    const numPlayers = Math.max(
      1,
      Math.min(pickCount, uniqueNames.length || 3),
    );

    for (let i = 0; i < numPlayers; i++) {
      const player: PrizePickPlayer = {
        name: finalNames[i] || `Player ${i + 1}`,
        sport: foundSports[i % Math.max(1, foundSports.length)] || "Unknown",
        statType: foundStats[i % Math.max(1, foundStats.length)] || "Points",
        line:
          possibleLines[i % Math.max(1, possibleLines.length)] ||
          15 + Math.random() * 10,
        direction: determineBetDirection(
          ocrText,
          finalNames[i],
          possibleLines[i],
        ),
      };

      lineup.players.push(player);
    }

    console.log("Created lineup from OCR:", lineup);
    return [lineup];
  }

  console.log("Could not extract enough data from OCR");
  return [];
}

// Enhanced name extraction for common player name patterns
function extractPlayerNamesEnhanced(text: string): string[] {
  const names: string[] = [];

  // Common player name patterns
  const patterns = [
    // Full names like "Doug Ghim", "Kurt Kitayama"
    /\b([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})\b/g,
    // Names with middle initial like "John F. Smith"
    /\b([A-Z][a-z]{2,})\s+([A-Z]\.)\s+([A-Z][a-z]{2,})\b/g,
    // Three part names like "Luis Garcia Santos"
    /\b([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})\b/g,
  ];

  patterns.forEach((pattern) => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[3]) {
        // Three part name
        names.push(`${match[1]} ${match[2]} ${match[3]}`);
      } else if (match[2]) {
        // Two part name
        names.push(`${match[1]} ${match[2]}`);
      }
    }
  });

  // Remove common false positives
  const filtered = names.filter((name) => {
    const lower = name.toLowerCase();
    return (
      !lower.includes("prizepick") &&
      !lower.includes("lineup") &&
      !lower.includes("flex play") &&
      !lower.includes("power play") &&
      name.length > 4
    );
  });

  // Remove duplicates
  return [...new Set(filtered)];
}

// Determine bet direction based on context clues
function determineBetDirection(
  text: string,
  playerName?: string,
  line?: number,
): "over" | "under" {
  const lowerText = text.toLowerCase();

  // Look for direction indicators near the player name
  if (playerName) {
    const playerIndex = lowerText.indexOf(playerName.toLowerCase());
    if (playerIndex !== -1) {
      const surrounding = lowerText.substring(
        Math.max(0, playerIndex - 50),
        Math.min(lowerText.length, playerIndex + playerName.length + 50),
      );

      // Check for arrow indicators or text
      if (
        surrounding.includes("↓") ||
        surrounding.includes("⬇") ||
        surrounding.includes("under")
      ) {
        return "under";
      }
      if (
        surrounding.includes("↑") ||
        surrounding.includes("⬆") ||
        surrounding.includes("over")
      ) {
        return "over";
      }
    }
  }

  // Default based on line value patterns
  if (line) {
    // Lower numbers often go over, higher numbers often go under
    return line < 20 ? "over" : "under";
  }

  // Random fallback
  return Math.random() > 0.5 ? "over" : "under";
}

// Keep the old fallback for backwards compatibility
function parseFallbackPrizePickFromOCR(ocrText: string): PrizePickLineup[] {
  return parseAggressivePrizePickFromOCR(ocrText);
}
