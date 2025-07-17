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
        onProgress({ status: "Processing image...", progress: 0 });
      }

      const {
        data: { text },
      } = await worker.recognize(imageFile, {
        rectangle: undefined,
      });

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

  // Always try main parser first - it's now much more flexible
  let lineups = parsePrizePickFromOCR(ocrText);

  // If main parser doesn't find anything, try fallback
  if (lineups.length === 0) {
    console.log("Main parser found nothing, trying fallback...");
    lineups = parseFallbackPrizePickFromOCR(ocrText);
  }

  return lineups;
}

// Fallback parser for when OCR doesn't clearly detect PrizePick structure
function parseFallbackPrizePickFromOCR(ocrText: string): PrizePickLineup[] {
  console.log("Fallback parser processing:", ocrText);

  // Be much more aggressive in finding any useful data
  const text = ocrText.toLowerCase();

  // Look for ANY indication this might be PrizePicks
  const prizePickIndicators = [
    "prizepicks",
    "pick",
    "flex",
    "power",
    "lineup",
    "pay",
    "paid",
    "tennis",
    "golf",
    "nfl",
    "nba",
    "pga",
    "strokes",
    "fantasy",
  ];

  const hasIndicator = prizePickIndicators.some((indicator) =>
    text.includes(indicator),
  );

  if (!hasIndicator) {
    console.log("No PrizePick indicators found");
    return [];
  }

  // Extract any numbers
  const numbers =
    ocrText.match(/\d+(?:\.\d+)?/g)?.map((n) => parseFloat(n)) || [];
  const smallNumbers = numbers.filter((n) => n >= 1 && n <= 100); // Possible entry amounts
  const largeNumbers = numbers.filter((n) => n > 100); // Possible payouts
  const lineNumbers = numbers.filter((n) => n >= 0.5 && n <= 50); // Possible betting lines

  // Extract words that could be player names
  const words = ocrText.match(/[A-Za-z]+/g) || [];
  const capitalWords = ocrText.match(/[A-Z][a-z]+/g) || [];

  // Look for name patterns
  const possibleNames: string[] = [];
  for (let i = 0; i < capitalWords.length - 1; i++) {
    const firstName = capitalWords[i];
    const lastName = capitalWords[i + 1];
    if (firstName.length > 2 && lastName.length > 2) {
      possibleNames.push(`${firstName} ${lastName}`);
    }
  }

  // Extract sports
  const sports = ["Tennis", "Golf", "NFL", "NBA", "NHL", "PGA", "Soccer"];
  const foundSports = sports.filter(
    (sport) =>
      text.includes(sport.toLowerCase()) || text.includes(sport.toUpperCase()),
  );

  // If we have at least some data, create a lineup
  if (
    possibleNames.length > 0 ||
    foundSports.length > 0 ||
    numbers.length > 0
  ) {
    const lineup: PrizePickLineup = {
      type: "PrizePick Lineup (OCR)",
      entryAmount: smallNumbers[0] || 5,
      potentialPayout: largeNumbers[0] || smallNumbers[0] * 20 || 100,
      status: text.includes("paid") ? "win" : "pending",
      players: [],
    };

    // Create players
    const numPlayers = Math.max(
      1,
      Math.min(6, possibleNames.length, foundSports.length || 3),
    );

    for (let i = 0; i < numPlayers; i++) {
      lineup.players.push({
        name: possibleNames[i] || `Player ${i + 1}`,
        sport: foundSports[i % foundSports.length] || "Unknown",
        statType: "Points",
        line: lineNumbers[i % lineNumbers.length] || 10 + Math.random() * 15,
        direction: Math.random() > 0.5 ? "over" : "under",
      });
    }

    console.log("Fallback created lineup:", lineup);
    return [lineup];
  }

  return [];
}
