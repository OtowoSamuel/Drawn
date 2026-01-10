import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Circle, RotateCcw } from "lucide-react";

type Player = "X" | "O";
type Cell = Player | null;
type Board = Cell[];
type GameStatus = "playing" | "win" | "draw";

interface TicTacToeProps {
  player1Name?: string;
  player2Name?: string;
  onGameEnd?: (result: { winner: Player | null; status: GameStatus }) => void;
}

const WINNING_COMBINATIONS = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal
  [2, 4, 6], // Anti-diagonal
];

const TicTacToe = ({ 
  player1Name = "Player 1", 
  player2Name = "Player 2",
  onGameEnd 
}: TicTacToeProps) => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [winner, setWinner] = useState<Player | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");

  const checkWinner = useCallback((squares: Board): { winner: Player | null; line: number[] | null } => {
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: combination };
      }
    }
    return { winner: null, line: null };
  }, []);

  const checkDraw = useCallback((squares: Board): boolean => {
    return squares.every((cell) => cell !== null);
  }, []);

  const handleCellClick = (index: number) => {
    if (board[index] || winner || gameStatus !== "playing") return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result.winner) {
      setWinner(result.winner);
      setWinningLine(result.line);
      setGameStatus("win");
      onGameEnd?.({ winner: result.winner, status: "win" });
    } else if (checkDraw(newBoard)) {
      setGameStatus("draw");
      onGameEnd?.({ winner: null, status: "draw" });
    } else {
      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
    setWinningLine(null);
    setGameStatus("playing");
  };

  const renderCell = (index: number) => {
    const value = board[index];
    const isWinningCell = winningLine?.includes(index);
    const isClickable = !value && gameStatus === "playing";

    return (
      <button
        key={index}
        onClick={() => handleCellClick(index)}
        disabled={!isClickable}
        className={`
          relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center
          rounded-xl border-2 transition-all duration-200
          ${isWinningCell 
            ? "border-success bg-success/20 glow-red" 
            : "border-border bg-card hover:border-primary/50 hover:bg-secondary"
          }
          ${isClickable ? "cursor-pointer hover:scale-105" : "cursor-default"}
          ${!value && isClickable ? "hover:shadow-[0_0_20px_hsl(var(--neon-red)/0.3)]" : ""}
        `}
      >
        {value === "X" && (
          <X 
            className={`h-10 w-10 sm:h-12 sm:w-12 text-primary transition-all duration-300 ${
              isWinningCell ? "animate-scale-in scale-110" : "animate-scale-in"
            }`} 
            strokeWidth={3}
          />
        )}
        {value === "O" && (
          <Circle 
            className={`h-10 w-10 sm:h-12 sm:w-12 text-accent transition-all duration-300 ${
              isWinningCell ? "animate-scale-in scale-110" : "animate-scale-in"
            }`} 
            strokeWidth={3}
          />
        )}
      </button>
    );
  };

  const getStatusMessage = () => {
    if (gameStatus === "win") {
      return winner === "X" ? `${player1Name} Wins!` : `${player2Name} Wins!`;
    }
    if (gameStatus === "draw") {
      return "It's a Draw!";
    }
    return `${currentPlayer === "X" ? player1Name : player2Name}'s Turn`;
  };

  return (
    <Card className="border-border bg-card/50 backdrop-blur card-glow">
      <CardContent className="flex flex-col items-center gap-6 p-6 sm:p-8">
        {/* Player Indicators */}
        <div className="flex w-full items-center justify-between gap-4">
          <div className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-all ${
            currentPlayer === "X" && gameStatus === "playing"
              ? "bg-primary/20 ring-2 ring-primary" 
              : "bg-secondary"
          }`}>
            <X className="h-5 w-5 text-primary" strokeWidth={3} />
            <span className="font-medium">{player1Name}</span>
          </div>
          <span className="text-muted-foreground">VS</span>
          <div className={`flex items-center gap-2 rounded-lg px-4 py-2 transition-all ${
            currentPlayer === "O" && gameStatus === "playing"
              ? "bg-accent/20 ring-2 ring-accent" 
              : "bg-secondary"
          }`}>
            <Circle className="h-5 w-5 text-accent" strokeWidth={3} />
            <span className="font-medium">{player2Name}</span>
          </div>
        </div>

        {/* Status Badge */}
        <Badge 
          variant={
            gameStatus === "win" 
              ? "success" 
              : gameStatus === "draw" 
                ? "secondary" 
                : "neon"
          }
          className="text-base px-4 py-1"
        >
          {getStatusMessage()}
        </Badge>

        {/* Game Board */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {Array.from({ length: 9 }, (_, i) => renderCell(i))}
        </div>

        {/* Reset Button */}
        {gameStatus !== "playing" && (
          <Button 
            variant="neon-outline" 
            size="lg" 
            onClick={resetGame}
            className="animate-fade-in"
          >
            <RotateCcw className="h-5 w-5" />
            Play Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TicTacToe;
