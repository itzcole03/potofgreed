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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Using StoredBet interface from storage.ts
type Bet = StoredBet;

interface BetHistoryCardProps {
  bet: Bet;
  onUpdateResult: (
    id: string,
    result:
      | "win"
      | "loss"
      | "pending"
      | "refund"
      | "push"
      | "cancelled"
      | "void",
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
  const isRefund =
    bet.result === "refund" ||
    bet.result === "push" ||
    bet.result === "void" ||
    bet.result === "cancelled";

  const profit = isWin && bet.payout ? bet.payout - bet.stake : 0;
  const loss = isLoss ? bet.stake : 0;
  const refunded = isRefund ? bet.stake : 0;

  const getStatusColor = () => {
    if (isWin) return "text-primary bg-primary/10";
    if (isLoss) return "text-destructive bg-destructive/10";
    if (isRefund) return "text-blue-600 bg-blue-600/10";
    return "text-yellow-600 bg-yellow-600/10";
  };

  const getStatusIcon = () => {
    if (isWin) return <TrendingUp className="h-3 w-3" />;
    if (isLoss) return <TrendingDown className="h-3 w-3" />;
    if (isRefund) return <RotateCcw className="h-3 w-3" />;
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
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs border-blue-600/20 text-blue-600 hover:bg-blue-600/10 transition-colors"
                  onClick={() => onUpdateResult(bet.id, "refund", bet.stake)}
                  title="Mark as Refund"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Refund
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

            {isRefund && (
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-blue-600 font-bold text-lg">
                    ${refunded.toFixed(2)}
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
                  {bet.result === "refund"
                    ? "Refunded"
                    : bet.result === "push"
                      ? "Push"
                      : bet.result === "void"
                        ? "Voided"
                        : "Cancelled"}
                </div>
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
        <div className="border-t border-border/30 bg-gradient-to-b from-muted/20 to-muted/10">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-base text-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Lineup Details
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {bet.prizePickDetails.players.length} picks
                </span>
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
                    className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-gradient-to-r from-card/50 to-card/30 hover:border-border transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* Player Avatar/Initial */}
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {player.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-foreground">
                            {player.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {player.sport}
                          </span>
                        </div>

                        <div className="text-xs text-muted-foreground mb-2">
                          {player.opponent && `${player.opponent} • `}
                          <span
                            className={`font-medium ${player.matchStatus === "Final" ? "text-primary" : "text-yellow-600"}`}
                          >
                            {player.matchStatus}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-foreground font-medium">
                              {player.statType}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                player.direction === "over"
                                  ? "bg-green-500/10 text-green-600"
                                  : "bg-red-500/10 text-red-600"
                              }`}
                            >
                              {player.direction.toUpperCase()}
                            </span>
                            <span className="text-foreground font-bold text-lg">
                              {player.line}
                            </span>
                          </div>
                          {player.actualValue !== undefined && (
                            <span className="text-xs px-2 py-1 rounded bg-muted/50 text-muted-foreground">
                              actual: {player.actualValue}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {playerWon && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold">
                            <Check className="h-3 w-3" />
                            HIT
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
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
                          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-destructive/15 text-destructive text-xs font-bold">
                            <X className="h-3 w-3" />
                            MISS
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
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
                          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/15 text-yellow-600 text-xs font-bold">
                            <Target className="h-3 w-3" />
                            LIVE
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-3 text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-full font-bold"
                              onClick={() => onUpdatePick(bet.id, index, true)}
                              title="Mark as Win"
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-3 text-xs bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 rounded-full font-bold"
                              onClick={() => onUpdatePick(bet.id, index, false)}
                              title="Mark as Loss"
                            >
                              ✗
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
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [pendingLineup, setPendingLineup] = useState<any>(null);
  const ocrProcessor = useRef(new OCRProcessor());

  const totalWagered = bets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalWon = bets
    .filter((bet) => bet.result === "win")
    .reduce((sum, bet) => sum + (bet.payout || 0), 0);
  const totalLost = bets
    .filter((bet) => bet.result === "loss")
    .reduce((sum, bet) => sum + bet.stake, 0);
  const netProfit = totalWon - totalLost;
  const completedBets = bets.filter(
    (bet) => bet.result === "win" || bet.result === "loss",
  );
  const winRate =
    completedBets.length > 0
      ? (
          (bets.filter((bet) => bet.result === "win").length /
            completedBets.length) *
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
        // Show correction modal for user review
        setPendingLineup(lineups[0]);
        setShowCorrectionModal(true);
        setProcessingStatus("Review and correct the detected data");
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
    result:
      | "win"
      | "loss"
      | "pending"
      | "refund"
      | "push"
      | "cancelled"
      | "void",
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

  const updatePick = (
    betId: string,
    pickIndex: number,
    isWin: boolean | undefined,
  ) => {
    const bet = bets.find((b) => b.id === betId);
    if (!bet?.prizePickDetails) return;

    const updatedLineup = {
      ...bet.prizePickDetails,
      players: bet.prizePickDetails.players.map((p, i) =>
        i === pickIndex
          ? {
              ...p,
              isWin,
              actualValue: isWin === undefined ? undefined : p.actualValue,
            }
          : p,
      ),
    };

    const updates = { prizePickDetails: updatedLineup };
    const updatedBets = betStorage.updateBet(betId, updates);
    setBets(updatedBets);
  };

  const confirmCorrectedLineup = (correctedLineup: any) => {
    const prizePickData: PrizePickData = { lineups: [correctedLineup] };
    importPrizePickData(prizePickData);
    setShowCorrectionModal(false);
    setPendingLineup(null);
    setProcessingStatus(`Successfully imported corrected lineup!`);

    setTimeout(() => {
      setProcessingStatus("");
    }, 3000);
  };

  const cancelCorrection = () => {
    setShowCorrectionModal(false);
    setPendingLineup(null);
    setProcessingStatus("");
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

                <div className="space-y-2">
                  <Button
                    onClick={importSamplePrizePickData}
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                  >
                    Or try sample data
                  </Button>

                  <div className="text-xs text-center text-muted-foreground space-y-1">
                    <div>
                      💡 <strong>Pro tip:</strong> For best results, ensure
                      screenshots are clear and well-lit
                    </div>
                    <div className="text-xs opacity-75">
                      ✨ You'll be able to review and edit the detected data
                      before importing
                    </div>
                  </div>
                </div>
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
                      onUpdatePick={updatePick}
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

      {/* Correction Modal */}
      <Dialog open={showCorrectionModal} onOpenChange={setShowCorrectionModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Review Detected PrizePick Data
            </DialogTitle>
          </DialogHeader>

          {pendingLineup && (
            <CorrectionInterface
              lineup={pendingLineup}
              onConfirm={confirmCorrectedLineup}
              onCancel={cancelCorrection}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Correction Interface Component
interface CorrectionInterfaceProps {
  lineup: any;
  onConfirm: (correctedLineup: any) => void;
  onCancel: () => void;
}

function CorrectionInterface({
  lineup,
  onConfirm,
  onCancel,
}: CorrectionInterfaceProps) {
  const [editedLineup, setEditedLineup] = useState(lineup);

  const updatePlayer = (index: number, field: string, value: any) => {
    const updatedPlayers = [...editedLineup.players];
    let updatedPlayer = { ...updatedPlayers[index], [field]: value };

    // If sport is changing, reset stat type to first valid option for new sport
    if (field === "sport") {
      const validStatTypes = getStatTypesForSport(value);
      updatedPlayer.statType = validStatTypes[0] || "Points";
    }

    updatedPlayers[index] = updatedPlayer;
    setEditedLineup({ ...editedLineup, players: updatedPlayers });
  };

  const updateLineupInfo = (field: string, value: any) => {
    setEditedLineup({ ...editedLineup, [field]: value });
  };

  // Get stat types based on selected sport
  const getStatTypesForSport = (sport: string): string[] => {
    const statTypesBySport: Record<string, string[]> = {
      WNBA: [
        "Points",
        "Rebounds",
        "Assists",
        "Pts+Rebs+Asts",
        "Pts+Rebs",
        "Pts+Asts",
        "Rebs+Asts",
        "Fantasy Score",
        "FG Made",
        "FG Attempted",
        "3PT Made",
        "FT Made",
        "Steals",
        "Blocks",
        "Turnovers",
      ],
      NBA: [
        "Points",
        "Rebounds",
        "Assists",
        "Pts+Rebs+Asts",
        "Pts+Rebs",
        "Pts+Asts",
        "Rebs+Asts",
        "Fantasy Score",
        "FG Made",
        "FG Attempted",
        "3PT Made",
        "FT Made",
        "Steals",
        "Blocks",
        "Turnovers",
      ],
      NBASLH: [
        "Points",
        "Rebounds",
        "Assists",
        "Pts+Rebs+Asts",
        "Pts+Rebs",
        "Pts+Asts",
        "Rebs+Asts",
        "Fantasy Score",
        "FG Made",
        "FG Attempted",
        "3PT Made",
        "FT Made",
        "Steals",
        "Blocks",
        "Turnovers",
      ],
      MLB: [
        "Hits",
        "Home Runs",
        "RBIs",
        "Runs",
        "Pitcher Strikeouts",
        "Hitter Fantasy Score",
        "Hits+Runs+RBIs",
        "Stolen Bases",
        "Walks",
        "Saves",
        "Innings Pitched",
        "Total Bases",
        "Doubles",
        "Triples",
      ],
      Tennis: [
        "Fantasy Score",
        "Total Games",
        "Total Games Won",
        "Double Faults",
        "Aces",
        "Break Points Won",
        "Service Games Won",
        "Return Games Won",
        "Sets Won",
      ],
      Golf: [
        "Strokes",
        "Birdies Or Better",
        "Birdies",
        "Eagles",
        "Bogeys",
        "Fairways Hit",
        "Greens In Regulation",
        "Putts",
        "Driving Distance",
      ],
      Soccer: [
        "Goals",
        "Assists",
        "Shots",
        "Shots On Target",
        "Passes Attempted",
        "Passes Completed",
        "Tackles",
        "Saves",
        "Corners",
      ],
      MMA: [
        "Significant Strikes",
        "Takedowns",
        "Fight Time (Mins)",
        "Fantasy Score",
        "Total Strikes",
        "Takedown Attempts",
        "Submission Attempts",
      ],
      NFL: [
        "Passing Yards",
        "Rushing Yards",
        "Receiving Yards",
        "Touchdowns",
        "Receptions",
        "Completions",
        "Fantasy Score",
      ],
      NHL: [
        "Goals",
        "Assists",
        "Points",
        "Shots On Goal",
        "Saves",
        "Fantasy Score",
        "Penalty Minutes",
        "Power Play Points",
      ],
    };

    return (
      statTypesBySport[sport] || [
        "Points",
        "Fantasy Score",
        "Goals",
        "Assists",
        "Rebounds",
      ]
    );
  };

  return (
    <div className="space-y-6">
      {/* Lineup Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Lineup Type
          </label>
          <Input
            value={editedLineup.type}
            onChange={(e) => updateLineupInfo("type", e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Entry Amount ($)
          </label>
          <Input
            type="number"
            value={editedLineup.entryAmount}
            onChange={(e) =>
              updateLineupInfo("entryAmount", parseFloat(e.target.value))
            }
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Potential Payout ($)
          </label>
          <Input
            type="number"
            value={editedLineup.potentialPayout}
            onChange={(e) =>
              updateLineupInfo("potentialPayout", parseFloat(e.target.value))
            }
            className="mt-1"
          />
        </div>
      </div>

      {/* Players */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          Players ({editedLineup.players.length})
        </h3>

        {editedLineup.players.map((player: any, index: number) => (
          <div
            key={index}
            className="grid grid-cols-1 lg:grid-cols-6 gap-3 p-4 border border-border rounded-lg"
          >
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Player Name
              </label>
              <Input
                value={player.name}
                onChange={(e) => updatePlayer(index, "name", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Sport
              </label>
              <Select
                value={player.sport}
                onValueChange={(value) => updatePlayer(index, "sport", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WNBA">WNBA</SelectItem>
                  <SelectItem value="NBA">NBA</SelectItem>
                  <SelectItem value="NBASLH">NBA Summer League</SelectItem>
                  <SelectItem value="NFL">NFL</SelectItem>
                  <SelectItem value="NHL">NHL</SelectItem>
                  <SelectItem value="MLB">MLB</SelectItem>
                  <SelectItem value="Tennis">Tennis</SelectItem>
                  <SelectItem value="Golf">Golf</SelectItem>
                  <SelectItem value="Soccer">Soccer</SelectItem>
                  <SelectItem value="MMA">MMA</SelectItem>
                  <SelectItem value="HRDERBY">Home Run Derby</SelectItem>
                  <SelectItem value="ALLSTAR">All-Star</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Stat Type
              </label>
              <Select
                value={player.statType}
                onValueChange={(value) =>
                  updatePlayer(index, "statType", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getStatTypesForSport(player.sport).map((statType) => (
                    <SelectItem key={statType} value={statType}>
                      {statType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Line
              </label>
              <Input
                type="number"
                step="0.5"
                value={player.line}
                onChange={(e) =>
                  updatePlayer(index, "line", parseFloat(e.target.value))
                }
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Direction
              </label>
              <Select
                value={player.direction}
                onValueChange={(value) =>
                  updatePlayer(index, "direction", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="over">Over</SelectItem>
                  <SelectItem value="under">Under</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Opponent
              </label>
              <Input
                value={player.opponent || ""}
                onChange={(e) =>
                  updatePlayer(index, "opponent", e.target.value)
                }
                className="mt-1"
                placeholder="vs Opponent"
              />
            </div>
          </div>
        ))}
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm(editedLineup)}
          className="bg-primary hover:bg-primary/90"
        >
          <Check className="h-4 w-4 mr-2" />
          Import Lineup
        </Button>
      </DialogFooter>
    </div>
  );
}
