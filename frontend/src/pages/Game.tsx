import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Trophy, AlertCircle } from "lucide-react";
import Layout from "@/components/Layout";
import TicTacToe from "@/components/TicTacToe";
import { 
  startGame, 
  makeMove, 
  pollGameState,
  parseGameResult,
  getCurrentPlayer,
  type GameState,
  ENV 
} from "@/lib/linera";
import { useToast } from "@/hooks/use-toast";

const Game = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Game state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Game result
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<'X' | 'O' | 'Draw' | null>(null);

  // Poll for game state updates
  useEffect(() => {
    const stopPolling = pollGameState(
      (state) => {
        setGameState(state);
        // Only check game over from finished flag
        if (state.board.finished) {
          setGameOver(true);
        }
      },
      (error) => {
        console.error('Polling error:', error);
      },
      1000 // Poll every second
    );

    return stopPolling;
  }, []);

  const handleStartGame = async () => {
    setLoading(true);
    try {
      // Get owner address from environment
      const ownerAddress = import.meta.env.VITE_OWNER_ADDRESS;
      
      console.log("=== Starting Game ===");
      console.log("Owner Address:", ownerAddress);
      console.log("Main Chain URL:", ENV.MAIN_CHAIN_URL);
      
      if (!ownerAddress) {
        throw new Error("Owner address not configured. Check .env file");
      }
      
      // For demo: same owner plays both sides
      console.log("Calling startGame mutation...");
      const result = await startGame([ownerAddress, ownerAddress]);
      console.log("Start game result:", result);
      
      toast({
        title: "Game Started!",
        description: "Make your move!",
      });
      
      setGameOver(false);
      setWinner(null);
      
    } catch (error: any) {
      console.error("=== Start Game Error ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      toast({
        title: "Error Starting Game",
        description: error.message || "Failed to start game",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (position: number) => {
    if (processing || gameOver) return;

    try {
      setProcessing(true);
      console.log(`Making move at position ${position}`);
      
      // Mutation returns transaction hash, game state updates via polling
      await makeMove(position);
      console.log("Move submitted successfully");
      
    } catch (error: any) {
      toast({
        title: "Move Failed",
        description: error.message || "Failed to make move",
        variant: "destructive",
      });
      console.error("Move error:", error);
    } finally {
      setProcessing(false);
    }
  };

  // Show start screen if no game active
  if (!gameState || !gameState.players) {
    return (
      <Layout>
        <div className="container max-w-2xl mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">Tic-Tac-Toe</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="text-6xl">🎮</div>
                <h2 className="text-xl font-semibold">Single Player Demo</h2>
                <p className="text-muted-foreground">
                  Play Tic-Tac-Toe against yourself on the blockchain!
                </p>
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>ℹ️ Single player mode.</strong> You control both the X and O.
                  </p>
                </div>
                
                <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                  <div><strong>Chain:</strong> {ENV.MAIN_CHAIN_ID?.slice(0, 8)}...</div>
                  <div><strong>App:</strong> {ENV.APP_ID?.slice(0, 8)}...</div>
                </div>
                
                <Button 
                  onClick={handleStartGame} 
                  disabled={loading}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      Start Single Player Game
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Game active - show board
  const currentPlayer = getCurrentPlayer(gameState.board.movesCount);
  
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Tic-Tac-Toe - Single Player Demo</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Game Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                {gameOver ? (
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold">
                      {winner === 'Draw' ? 'Draw!' : `Player ${winner} Wins!`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Current Turn: Player {currentPlayer}
                    </Badge>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Moves: {gameState.board.movesCount}
                </div>
              </div>
            </div>

            {/* Game Board */}
            <div className="flex justify-center">
              <TicTacToe
                board={gameState.board.cells}
                onMove={handleMove}
                disabled={processing || gameOver}
                currentPlayer={currentPlayer}
              />
            </div>

            {/* Processing Indicator */}
            {processing && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing move...</span>
              </div>
            )}

            {/* Play Again Button */}
            {gameOver && (
              <div className="text-center">
                <Button onClick={handleStartGame} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    'Play Again'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Game;
