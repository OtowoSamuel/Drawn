import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Swords, Trophy, Clock, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import TicTacToe from "@/components/TicTacToe";

type Player = "X" | "O";
type GameStatus = "playing" | "win" | "draw";

const Game = () => {
  const navigate = useNavigate();
  const [gameEnded, setGameEnded] = useState(false);
  const [gameResult, setGameResult] = useState<{ winner: Player | null; status: GameStatus } | null>(null);

  // Mock match data
  const matchData = {
    player1: { name: "NeonKnight", nft: "Cyber Warrior", stake: 100 },
    player2: { name: "ShadowByte", nft: "Phantom Striker", stake: 100 },
    totalStake: 200,
  };

  const handleGameEnd = (result: { winner: Player | null; status: GameStatus }) => {
    setGameEnded(true);
    setGameResult(result);
    
    // Navigate to match result after a short delay
    setTimeout(() => {
      navigate("/match-result", { 
        state: { 
          result: result.winner === "X" ? "win" : result.winner === "O" ? "loss" : "draw",
          opponent: matchData.player2.name,
          stake: matchData.totalStake
        } 
      });
    }, 2000);
  };

  return (
    <Layout>
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate("/lobby")}>
              <ArrowLeft className="h-4 w-4" />
              Back to Lobby
            </Button>
            <Badge variant="neon" className="flex items-center gap-2">
              <Swords className="h-4 w-4" />
              Live Match
            </Badge>
          </div>

          {/* Match Info Header */}
          <Card className="border-border bg-gradient-to-r from-primary/10 via-card to-accent/10">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                {/* Player 1 */}
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 ring-2 ring-primary">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{matchData.player1.name}</p>
                    <p className="text-sm text-muted-foreground">{matchData.player1.nft}</p>
                  </div>
                </div>

                {/* VS Badge */}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary border-2 border-border">
                    <span className="text-lg font-bold text-gradient-neon">VS</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Trophy className="h-3 w-3 mr-1" />
                    {matchData.totalStake} XP
                  </Badge>
                </div>

                {/* Player 2 */}
                <div className="flex items-center gap-4 flex-row-reverse">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/20 ring-2 ring-accent">
                    <Sparkles className="h-7 w-7 text-accent" />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{matchData.player2.name}</p>
                    <p className="text-sm text-muted-foreground">{matchData.player2.nft}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Game Board */}
          <div className="flex justify-center">
            <TicTacToe
              player1Name={matchData.player1.name}
              player2Name={matchData.player2.name}
              onGameEnd={handleGameEnd}
            />
          </div>

          {/* Game Result Overlay */}
          {gameEnded && gameResult && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
              <Card className="border-border bg-card max-w-sm w-full mx-4 animate-scale-in">
                <CardContent className="flex flex-col items-center gap-4 p-8">
                  <div className={`flex h-20 w-20 items-center justify-center rounded-full ${
                    gameResult.status === "draw" 
                      ? "bg-secondary" 
                      : gameResult.winner === "X" 
                        ? "bg-success/20 animate-glow-pulse" 
                        : "bg-accent/20"
                  }`}>
                    {gameResult.status === "draw" ? (
                      <Swords className="h-10 w-10 text-muted-foreground" />
                    ) : (
                      <Trophy className={`h-10 w-10 ${
                        gameResult.winner === "X" ? "text-success" : "text-accent"
                      }`} />
                    )}
                  </div>
                  <CardTitle className={`text-2xl ${
                    gameResult.status === "draw" 
                      ? "text-muted-foreground" 
                      : gameResult.winner === "X" 
                        ? "text-success" 
                        : "text-accent"
                  }`}>
                    {gameResult.status === "draw" 
                      ? "It's a Draw!" 
                      : `${gameResult.winner === "X" ? matchData.player1.name : matchData.player2.name} Wins!`
                    }
                  </CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Redirecting to results...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Game;
