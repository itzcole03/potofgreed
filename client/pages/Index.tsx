import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Plus,
  Trash2,
  Upload,
  Zap,
  Calendar,
  Trophy,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
} from "lucide-react";
import {
  samplePrizePickData,
  parsePrizePickLineupsToBets,
  validatePrizePickData,
  type PrizePickData,
} from "@/lib/prizepick-parser";
import {
  OCRProcessor,
  parseAdvancedPrizePickFromOCR,
} from "@/lib/ocr-processor";
import { betStorage, type StoredBet } from "@/lib/storage";

// Using StoredBet interface from storage.ts
type Bet = StoredBet;

interface BetHistoryCardProps {
  bet: Bet;
  onUpdateResult: (
    id: string,
    result: "win" | "loss" | "pending",
    payout?: number,
  ) => void;
  onDelete: (id: string) => void;
  calculatePayout: (odds: string, stake: number) => number;
  onUpdatePick: (
    betId: string,
    pickIndex: number,
    isWin: boolean | undefined,
  ) => void;
}

function BetHistoryCard({
  bet,
  onUpdateResult,
  onDelete,
  calculatePayout,
  onUpdatePick,
}: BetHistoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isPrizePick = bet.sport === "PrizePicks";
  const isWin = bet.result === "win";
  const isLoss = bet.result === "loss";
  const isPending = bet.result === "pending";

  const profit = isWin && bet.payout ? bet.payout - bet.stake : 0;
  const loss = isLoss ? bet.stake : 0;

  const getStatusColor = () => {
    if (isWin) return "text-primary bg-primary/10";
    if (isLoss) return "text-destructive bg-destructive/10";
    return "text-yellow-600 bg-yellow-600/10";
  };

  const getStatusIcon = () => {
    if (isWin) return <TrendingUp className="h-3 w-3" />;
    if (isLoss) return <TrendingDown className="h-3 w-3" />;
    return <Target className="h-3 w-3" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const parseTeamDetails = (teamString: string) => {
    // For PrizePick entries, extract meaningful details
    if (isPrizePick) {
      const parts = teamString.split(" - ");
      if (parts.length > 1) {
        return {
          title: parts[0],
          details: parts[1],
        };
      }
    }
    return {
      title: teamString,
      details: null,
    };
  };

  const { title, details } = parseTeamDetails(bet.team);
  const hasPrizePickDetails = isPrizePick && bet.prizePickDetails;

  return (
    <div className="group border border-border/50 rounded-xl bg-gradient-to-r from-card to-card/50 hover:border-border transition-all duration-200 hover:shadow-md">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            {/* Title and Sport Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground leading-tight">
                {title}
              </h3>
              <div className="flex items-center gap-1">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    isPrizePick
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {bet.sport}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${getStatusColor()}`}
                >
                  {getStatusIcon()}
                  {bet.result.charAt(0).toUpperCase() + bet.result.slice(1)}
                </span>
              </div>
            </div>

            {/* Details */}
            {details && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {details}
              </p>
            )}

            {/* Bet Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                <span className="font-medium">${bet.stake}</span>
                {bet.odds && <span className="text-xs">({bet.odds})</span>}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(bet.date)}</span>
              </div>
            </div>
          </div>

          {/* Actions and Result */}
          <div className="flex items-center gap-2 ml-4">
            {isPending && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 px-3 text-xs bg-primary hover:bg-primary/90 transition-colors"
                  onClick={() =>
                    onUpdateResult(
                      bet.id,
                      "win",
                      calculatePayout(bet.odds, bet.stake),
                    )
                  }
                  title="Mark as Win"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Win
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 px-3 text-xs hover:bg-destructive/90 transition-colors"
                  onClick={() => onUpdateResult(bet.id, "loss")}
                  title="Mark as Loss"
                >
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Loss
                </Button>
              </div>
            )}

            {isWin && (
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-primary font-bold text-lg">
                    +${profit.toFixed(2)}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
                    onClick={() => onUpdateResult(bet.id, "pending")}
                    title="Revert to Pending"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  ${bet.payout?.toFixed(2)} total
                </div>
              </div>
            )}

            {isLoss && (
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-destructive font-bold text-lg">
                    -${loss.toFixed(2)}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
                    onClick={() => onUpdateResult(bet.id, "pending")}
                    title="Revert to Pending"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">Lost stake</div>
              </div>
            )}

            {hasPrizePickDetails && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 opacity-70 group-hover:opacity-100 transition-opacity"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Hide details" : "Show details"}
              >
                {isExpanded ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onDelete(bet.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded PrizePick Details */}
      {isExpanded && hasPrizePickDetails && (
        <div className="border-t border-border/30 bg-muted/20">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-foreground">
                Lineup Details
              </h4>
              <div className="text-xs text-muted-foreground">
                {bet.prizePickDetails.players.length} picks
              </div>
            </div>

            <div className="space-y-2">
              {bet.prizePickDetails.players.map((player, index) => {
                const playerWon = player.isWin;
                const playerLost = player.isWin === false;
                const playerPending = player.isWin === undefined;

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-card/30"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-foreground">
                          {player.name}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                          {player.sport}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground mb-1">
                        {player.opponent && `${player.opponent} • `}
                        {player.matchStatus}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-foreground">
                          {player.statType} {player.direction} {player.line}
                        </span>
                        {player.actualValue !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            (actual: {player.actualValue})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      {playerWon && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-primary text-xs font-medium">
                            <TrendingUp className="h-3 w-3" />
                            Win
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 opacity-60 hover:opacity-100"
                            onClick={() =>
                              onUpdatePick(bet.id, index, undefined)
                            }
                            title="Reset to Pending"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {playerLost && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-destructive text-xs font-medium">
                            <TrendingDown className="h-3 w-3" />
                            Loss
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 opacity-60 hover:opacity-100"
                            onClick={() =>
                              onUpdatePick(bet.id, index, undefined)
                            }
                            title="Reset to Pending"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {playerPending && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-yellow-600 text-xs font-medium">
                            <Target className="h-3 w-3" />
                            Pending
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 px-2 text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                              onClick={() => onUpdatePick(bet.id, index, true)}
                              title="Mark as Win"
                            >
                              W
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 px-2 text-xs bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20"
                              onClick={() => onUpdatePick(bet.id, index, false)}
                              title="Mark as Loss"
                            >
                              L
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border/30">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Potential Payout:</span>
                <span className="font-medium text-foreground">
                  ${bet.prizePickDetails.potentialPayout.toFixed(2)}
                </span>
              </div>
              {bet.prizePickDetails.actualPayout && (
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-muted-foreground">Actual Payout:</span>
                  <span className="font-medium text-primary">
                    ${bet.prizePickDetails.actualPayout.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Index() {
  const [bets, setBets] = useState<Bet[]>([]);

  // Load bets from localStorage on component mount
  useEffect(() => {
    const storedBets = betStorage.loadBets();
    setBets(storedBets);
  }, []);

  const [newBet, setNewBet] = useState({
    sport: "",
    team: "",
    odds: "",
    stake: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const ocrProcessor = useRef(new OCRProcessor());

  const totalWagered = bets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalWon = bets
    .filter((bet) => bet.result === "win")
    .reduce((sum, bet) => sum + (bet.payout || 0), 0);
  const totalLost = bets
    .filter((bet) => bet.result === "loss")
    .reduce((sum, bet) => sum + bet.stake, 0);
  const netProfit = totalWon - totalLost;
  const winRate =
    bets.filter((bet) => bet.result !== "pending").length > 0
      ? (
          (bets.filter((bet) => bet.result === "win").length /
            bets.filter((bet) => bet.result !== "pending").length) *
          100
        ).toFixed(1)
      : 0;

  const addBet = () => {
    if (newBet.sport && newBet.team && newBet.odds && newBet.stake) {
      const bet = {
        id: Date.now().toString(),
        sport: newBet.sport,
        team: newBet.team,
        odds: newBet.odds,
        stake: parseFloat(newBet.stake),
        result: "pending" as const,
        date: new Date().toISOString().split("T")[0],
      };
      const updatedBets = betStorage.addBet(bet);
      setBets(updatedBets);
      setNewBet({ sport: "", team: "", odds: "", stake: "" });
    }
  };

  const importPrizePickData = (data: PrizePickData) => {
    if (validatePrizePickData(data)) {
      const newBets = parsePrizePickLineupsToBets(data);
      const updatedBets = betStorage.addBets(newBets);
      setBets(updatedBets);
    }
  };

  const importSamplePrizePickData = () => {
    importPrizePickData(samplePrizePickData);
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    setIsProcessing(true);
    setProcessingStatus("Initializing OCR...");

    try {
      const ocrText = await ocrProcessor.current.processImage(
        file,
        (progress) => {
          setProcessingStatus(progress.status);
        },
      );

      setProcessingStatus("Parsing PrizePick data...");

      const lineups = parseAdvancedPrizePickFromOCR(ocrText);

      if (lineups.length > 0) {
        const prizePickData: PrizePickData = { lineups };
        importPrizePickData(prizePickData);
        setProcessingStatus(
          `Successfully imported ${lineups.length} lineup(s)!`,
        );

        setTimeout(() => {
          setProcessingStatus("");
        }, 3000);
      } else {
        setProcessingStatus(
          "No PrizePick data detected. Try sample data instead.",
        );
        setTimeout(() => {
          setProcessingStatus("");
        }, 3000);
      }
    } catch (error) {
      console.error("OCR processing failed:", error);
      setProcessingStatus("Failed to process image. Try sample data instead.");
      setTimeout(() => {
        setProcessingStatus("");
      }, 3000);
    } finally {
      setIsProcessing(false);

      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const updateBetResult = (
    id: string,
    result: "win" | "loss" | "pending",
    payout?: number,
  ) => {
    const updates = {
      result,
      payout:
        result === "win"
          ? payout
          : result === "pending"
            ? undefined
            : undefined,
    };
    const updatedBets = betStorage.updateBet(id, updates);
    setBets(updatedBets);
  };

  const deleteBet = (id: string) => {
    const updatedBets = betStorage.deleteBet(id);
    setBets(updatedBets);
  };

  const calculatePayout = (odds: string, stake: number) => {
    const oddsNum = parseFloat(odds);
    if (oddsNum > 0) {
      return stake + stake * (oddsNum / 100);
    } else {
      return stake + stake * (100 / Math.abs(oddsNum));
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            Pot of Greed
            <br />
          </h1>
          <p className="text-xl text-muted-foreground">
            Track your sports betting performance and maximize your edge
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${netProfit >= 0 ? "text-primary" : "text-destructive"}`}
              >
                ${netProfit.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{winRate}%</div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Wagered
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalWagered.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Won</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ${totalWon.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Import PrizePicks */}
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Import PrizePicks
                </CardTitle>
                <CardDescription>
                  Import your PrizePick lineups automatically
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Import sample PrizePick data to see how it works, or connect
                  your PrizePick account data.
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  onClick={handleImageUpload}
                  variant="outline"
                  className="w-full"
                  disabled={isProcessing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isProcessing
                    ? "Processing..."
                    : "Upload PrizePick Screenshot"}
                </Button>

                {processingStatus && (
                  <div className="text-xs text-center p-2 rounded bg-muted/50">
                    <div
                      className={`${processingStatus.includes("Success") ? "text-primary" : processingStatus.includes("Failed") || processingStatus.includes("No PrizePick") ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {processingStatus}
                    </div>
                  </div>
                )}

                {!processingStatus && (
                  <div className="text-xs text-muted-foreground text-center">
                    Select a PrizePick screenshot to import lineup data
                  </div>
                )}

                <Button
                  onClick={importSamplePrizePickData}
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                >
                  Or try sample data
                </Button>
              </CardContent>
            </Card>

            {/* Add New Bet */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Bet
                </CardTitle>
                <CardDescription>Record your latest sports bet</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={newBet.sport}
                  onValueChange={(value) =>
                    setNewBet({ ...newBet, sport: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NFL">NFL</SelectItem>
                    <SelectItem value="NBA">NBA</SelectItem>
                    <SelectItem value="NHL">NHL</SelectItem>
                    <SelectItem value="MLB">MLB</SelectItem>
                    <SelectItem value="Soccer">Soccer</SelectItem>
                    <SelectItem value="Tennis">Tennis</SelectItem>
                    <SelectItem value="Boxing">Boxing</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Team/Player"
                  value={newBet.team}
                  onChange={(e) =>
                    setNewBet({ ...newBet, team: e.target.value })
                  }
                />

                <Input
                  placeholder="Odds (e.g., -110, +150)"
                  value={newBet.odds}
                  onChange={(e) =>
                    setNewBet({ ...newBet, odds: e.target.value })
                  }
                />

                <Input
                  type="number"
                  placeholder="Stake Amount ($)"
                  value={newBet.stake}
                  onChange={(e) =>
                    setNewBet({ ...newBet, stake: e.target.value })
                  }
                />

                <Button onClick={addBet} className="w-full">
                  Add Bet
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Bet History */}
          <div className="lg:col-span-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Bet History
                </CardTitle>
                <CardDescription>Your recent betting activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bets.map((bet) => (
                    <BetHistoryCard
                      key={bet.id}
                      bet={bet}
                      onUpdateResult={updateBetResult}
                      onDelete={deleteBet}
                      calculatePayout={calculatePayout}
                    />
                  ))}

                  {bets.length === 0 && (
                    <div className="text-center py-12">
                      <div className="mx-auto w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                        <Trophy className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        No bets recorded yet
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Add your first bet or import PrizePick data to get
                        started!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
