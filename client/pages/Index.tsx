import { useState } from "react";
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
} from "lucide-react";

interface Bet {
  id: string;
  sport: string;
  team: string;
  odds: string;
  stake: number;
  result: "win" | "loss" | "pending";
  payout?: number;
  date: string;
}

export default function Index() {
  const [bets, setBets] = useState<Bet[]>([
    {
      id: "1",
      sport: "NFL",
      team: "Kansas City Chiefs",
      odds: "-110",
      stake: 100,
      result: "win",
      payout: 190.91,
      date: "2024-01-15",
    },
    {
      id: "2",
      sport: "NBA",
      team: "Los Angeles Lakers",
      odds: "+150",
      stake: 50,
      result: "loss",
      date: "2024-01-14",
    },
    {
      id: "3",
      sport: "NHL",
      team: "Boston Bruins",
      odds: "-120",
      stake: 75,
      result: "pending",
      date: "2024-01-16",
    },
  ]);

  const [newBet, setNewBet] = useState({
    sport: "",
    team: "",
    odds: "",
    stake: "",
  });

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
      const bet: Bet = {
        id: Date.now().toString(),
        sport: newBet.sport,
        team: newBet.team,
        odds: newBet.odds,
        stake: parseFloat(newBet.stake),
        result: "pending",
        date: new Date().toISOString().split("T")[0],
      };
      setBets([...bets, bet]);
      setNewBet({ sport: "", team: "", odds: "", stake: "" });
    }
  };

  const updateBetResult = (
    id: string,
    result: "win" | "loss",
    payout?: number,
  ) => {
    setBets(
      bets.map((bet) =>
        bet.id === id
          ? { ...bet, result, payout: result === "win" ? payout : undefined }
          : bet,
      ),
    );
  };

  const deleteBet = (id: string) => {
    setBets(bets.filter((bet) => bet.id !== id));
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
            Betting Tracker
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
                onChange={(e) => setNewBet({ ...newBet, team: e.target.value })}
              />

              <Input
                placeholder="Odds (e.g., -110, +150)"
                value={newBet.odds}
                onChange={(e) => setNewBet({ ...newBet, odds: e.target.value })}
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

          {/* Bet History */}
          <div className="lg:col-span-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Bet History</CardTitle>
                <CardDescription>Your recent betting activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bets.map((bet) => (
                    <div
                      key={bet.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{bet.team}</span>
                          <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                            {bet.sport}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {bet.odds} • ${bet.stake} • {bet.date}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {bet.result === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() =>
                                updateBetResult(
                                  bet.id,
                                  "win",
                                  calculatePayout(bet.odds, bet.stake),
                                )
                              }
                            >
                              Win
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateBetResult(bet.id, "loss")}
                            >
                              Loss
                            </Button>
                          </>
                        )}

                        {bet.result === "win" && (
                          <div className="text-primary font-medium">
                            +${(bet.payout! - bet.stake).toFixed(2)}
                          </div>
                        )}

                        {bet.result === "loss" && (
                          <div className="text-destructive font-medium">
                            -${bet.stake.toFixed(2)}
                          </div>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteBet(bet.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {bets.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No bets recorded yet. Add your first bet to get started!
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
