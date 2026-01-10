import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Skull, ArrowUp, ArrowDown, RotateCcw, BarChart2, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";

type MatchResult = "win" | "loss";

const MatchResultPage = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  
  // Mock match result data
  const result: MatchResult = "win";
  const xpChange = result === "win" ? 150 : -50;
  const previousRank = 15;
  const newRank = result === "win" ? 12 : 16;
  const rankChange = previousRank - newRank;
  const previousXP = 3300;
  const newXP = previousXP + xpChange;

  const handleClose = () => {
    setIsOpen(false);
    navigate("/lobby");
  };

  return (
    <Layout>
      <div className="container px-4 py-8">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader className="text-center">
              {/* Result Icon */}
              <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
                result === "win" 
                  ? "bg-success/20 animate-glow-pulse" 
                  : "bg-destructive/20"
              }`}>
                {result === "win" ? (
                  <Trophy className="h-10 w-10 text-success" />
                ) : (
                  <Skull className="h-10 w-10 text-destructive" />
                )}
              </div>
              
              <DialogTitle className={`text-3xl font-bold ${
                result === "win" ? "text-success" : "text-destructive"
              }`}>
                {result === "win" ? "Victory!" : "Defeat"}
              </DialogTitle>
              <DialogDescription>
                {result === "win" 
                  ? "Congratulations! You dominated the arena." 
                  : "Better luck next time. Keep practicing!"}
              </DialogDescription>
            </DialogHeader>

            {/* Stats Cards */}
            <div className="space-y-4 py-4">
              {/* XP Change */}
              <Card className="border-border bg-secondary">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="font-medium">XP Change</span>
                  </div>
                  <Badge variant={result === "win" ? "success" : "destructive"} className="text-base px-3">
                    {xpChange > 0 ? "+" : ""}{xpChange} XP
                  </Badge>
                </CardContent>
              </Card>

              {/* Rank Change */}
              <Card className="border-border bg-secondary">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <BarChart2 className="h-5 w-5 text-primary" />
                    <span className="font-medium">Rank</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">#{previousRank}</span>
                    {rankChange !== 0 && (
                      <>
                        {rankChange > 0 ? (
                          <ArrowUp className="h-4 w-4 text-success" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-destructive" />
                        )}
                      </>
                    )}
                    <Badge variant={rankChange > 0 ? "success" : rankChange < 0 ? "destructive" : "secondary"}>
                      #{newRank}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* NFT Status */}
              <Card className="border-border bg-secondary">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Your NFT</p>
                      <p className="text-sm text-muted-foreground">Battle status</p>
                    </div>
                  </div>
                  <Badge variant={result === "win" ? "success" : "destructive"}>
                    {result === "win" ? "Victorious" : "Defeated"}
                  </Badge>
                </CardContent>
              </Card>

              {/* XP Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress to next level</span>
                  <span className="text-primary">{newXP.toLocaleString()} XP</span>
                </div>
                <div className="progress-neon">
                  <div 
                    className="progress-neon-fill" 
                    style={{ width: `${(newXP % 1000) / 10}%` }} 
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button variant="neon" size="lg" className="w-full" onClick={handleClose}>
                <RotateCcw className="h-5 w-5" />
                Play Again
              </Button>
              <Button variant="ghost" size="lg" className="w-full" onClick={() => navigate("/leaderboard")}>
                <BarChart2 className="h-5 w-5" />
                View Leaderboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default MatchResultPage;
