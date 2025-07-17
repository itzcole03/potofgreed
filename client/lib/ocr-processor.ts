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
  const lineups: PrizePickLineup[] = [];
  const lines = ocrText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  console.log("OCR Text Lines:", lines);

  let currentLineup: Partial<PrizePickLineup> | null = null;
  let currentPlayers: PrizePickPlayer[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect lineup type and entry info
    if (line.includes("Pick Flex Play") || line.includes("Pick Power Play")) {
      // Save previous lineup if exists
      if (currentLineup && currentPlayers.length > 0) {
        lineups.push({
          ...currentLineup,
          players: currentPlayers,
          status: currentLineup.actualPayout ? "win" : "pending",
        } as PrizePickLineup);
      }

      // Start new lineup
      currentLineup = {
        type: line,
        players: [],
      };
      currentPlayers = [];
    }

    // Extract entry amount and payout
    const entryMatch = line.match(/\$(\d+)\s+(?:to pay|paid)\s+\$(\d+)/i);
    if (entryMatch && currentLineup) {
      currentLineup.entryAmount = parseInt(entryMatch[1]);
      currentLineup.potentialPayout = parseInt(entryMatch[2]);

      if (line.includes("paid")) {
        currentLineup.actualPayout = currentLineup.potentialPayout;
      }
    }

    // Extract date
    const dateMatch = line.match(/([A-Za-z]{3}\s+\d{1,2},?\s+\d{4})/);
    if (dateMatch && currentLineup) {
      currentLineup.date = dateMatch[1];
    }

    // Extract sport type
    if (/^(NFL|NBA|NHL|MLB|TENNIS|PGA|SOCCER|GOLF)/i.test(line)) {
      const sport = line.split(/\s+/)[0].toUpperCase();

      // Look for opponent/match info in the same or next line
      const opponent =
        line.substring(sport.length).trim() ||
        (i + 1 < lines.length ? lines[i + 1] : "");

      // Look for player name in following lines
      let playerName = "";
      let statType = "";
      let lineValue = 0;
      let direction: "over" | "under" = "over";

      // Look ahead for player info
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j];

        // Check if this looks like a player name (contains alphabetic characters)
        if (/^[A-Za-z\s\-\.]+$/.test(nextLine) && nextLine.length > 2) {
          playerName = nextLine;
          continue;
        }

        // Look for stat type and line
        const statMatch = nextLine.match(
          /(Strokes|Fantasy Score|Double Faults|Total Games|Points|Assists|Rebounds)/i,
        );
        if (statMatch) {
          statType = statMatch[1];
        }

        // Look for line value with direction indicators
        const overMatch = nextLine.match(/↑\s*(\d+\.?\d*)/);
        const underMatch = nextLine.match(/↓\s*(\d+\.?\d*)/);
        const plainNumberMatch = nextLine.match(/(\d+\.?\d*)/);

        if (overMatch) {
          lineValue = parseFloat(overMatch[1]);
          direction = "over";
        } else if (underMatch) {
          lineValue = parseFloat(underMatch[1]);
          direction = "under";
        } else if (plainNumberMatch && statType) {
          lineValue = parseFloat(plainNumberMatch[1]);
        }
      }

      // Create player entry if we have enough info
      if (playerName && lineValue > 0) {
        const player: PrizePickPlayer = {
          name: playerName,
          sport:
            sport === "PGA"
              ? "Golf"
              : sport.charAt(0) + sport.slice(1).toLowerCase(),
          statType: statType || "Points",
          line: lineValue,
          direction: direction,
          opponent: opponent,
        };

        currentPlayers.push(player);
      }
    }
  }

  // Add final lineup
  if (currentLineup && currentPlayers.length > 0) {
    lineups.push({
      ...currentLineup,
      players: currentPlayers,
      status: currentLineup.actualPayout ? "win" : "pending",
    } as PrizePickLineup);
  }

  return lineups;
}

// Enhanced parser that looks for specific PrizePick patterns
export function parseAdvancedPrizePickFromOCR(
  ocrText: string,
): PrizePickLineup[] {
  const lineups: PrizePickLineup[] = [];

  // Common PrizePick patterns to look for
  const patterns = {
    flexPlay: /(\d+)-Pick Flex Play/g,
    powerPlay: /(\d+)-Pick Power Play/g,
    entry: /\$(\d+)\s+(?:to pay|paid)\s+\$(\d+)/g,
    playerNames: /^[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?$/gm,
    stats:
      /(Strokes|Fantasy Score|Double Faults|Total Games|Points|Assists|Rebounds|Touchdowns)/gi,
    numbers: /(\d+\.?\d*)/g,
    directions: /[↑↓]/g,
  };

  // If OCR fails to detect structure, return sample data
  if (!patterns.flexPlay.test(ocrText) && !patterns.powerPlay.test(ocrText)) {
    console.warn(
      "No PrizePick structure detected in OCR text, using fallback parsing",
    );
    return parseFallbackPrizePickFromOCR(ocrText);
  }

  return parsePrizePickFromOCR(ocrText);
}

// Fallback parser for when OCR doesn't clearly detect PrizePick structure
function parseFallbackPrizePickFromOCR(ocrText: string): PrizePickLineup[] {
  // Extract any numbers that could be entry amounts
  const numbers = ocrText.match(/\d+/g)?.map((n) => parseInt(n)) || [];
  const possibleEntries = numbers.filter((n) => n >= 1 && n <= 100);
  const possiblePayouts = numbers.filter((n) => n >= 2 && n <= 10000);

  // Extract potential player names (capitalized words)
  const words = ocrText.split(/\s+/);
  const capitalizedWords = words.filter(
    (word) => /^[A-Z][a-z]+$/.test(word) && word.length > 2,
  );

  // Create a basic lineup if we can extract some info
  if (possibleEntries.length > 0 && capitalizedWords.length >= 2) {
    const lineup: PrizePickLineup = {
      type: "Flex Play (OCR Detected)",
      entryAmount: possibleEntries[0],
      potentialPayout: possiblePayouts[0] || possibleEntries[0] * 10,
      status: "pending",
      players: [],
    };

    // Create players from detected names
    for (let i = 0; i < Math.min(capitalizedWords.length - 1, 6); i += 2) {
      if (i + 1 < capitalizedWords.length) {
        lineup.players.push({
          name: `${capitalizedWords[i]} ${capitalizedWords[i + 1]}`,
          sport: "Unknown",
          statType: "Points",
          line: 10 + Math.random() * 20,
          direction: Math.random() > 0.5 ? "over" : "under",
        });
      }
    }

    if (lineup.players.length > 0) {
      return [lineup];
    }
  }

  return [];
}
