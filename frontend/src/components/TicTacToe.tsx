import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { X, Circle } from "lucide-react";
import { type Cell, getCellDisplay } from "@/lib/linera";

interface TicTacToeProps {
  board: Cell[];
  onMove: (position: number) => void;
  disabled?: boolean;
  currentPlayer?: 'X' | 'O';
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

const TicTacToe = ({ board, onMove, disabled = false, currentPlayer = 'X' }: TicTacToeProps) => {
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  // Check for winner whenever board changes
  useEffect(() => {
    const checkWinner = () => {
      for (const combination of WINNING_COMBINATIONS) {
        const [a, b, c] = combination;
        if (
          board[a] !== 'EMPTY' &&
          board[a] === board[b] &&
          board[a] === board[c]
        ) {
          setWinningLine(combination);
          return;
        }
      }
      setWinningLine(null);
    };

    checkWinner();
  }, [board]);

  const handleCellClick = (index: number) => {
    if (disabled || board[index] !== 'EMPTY' || winningLine) {
      return;
    }
    onMove(index);
  };

  const renderCellContent = (cell: Cell) => {
    if (cell === 'X') {
      return <X className="h-12 w-12 sm:h-16 sm:w-16 text-primary animate-fade-in" strokeWidth={3} />;
    }
    if (cell === 'O') {
      return <Circle className="h-12 w-12 sm:h-16 sm:w-16 text-accent animate-fade-in" strokeWidth={3} />;
    }
    return null;
  };

  return (
    <div className="relative">
      {/* Game Board */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-md mx-auto">
        {board.map((cell, index) => {
          const isWinningCell = winningLine?.includes(index);
          const isEmpty = cell === 'Empty';

          return (
            <Card
              key={index}
              className={cn(
                "aspect-square flex items-center justify-center cursor-pointer transition-all duration-200",
                "hover:scale-105 hover:shadow-lg",
                isEmpty && !disabled && !winningLine && "hover:bg-secondary/80",
                isWinningCell && "bg-primary/20 ring-2 ring-primary animate-pulse",
                disabled && "cursor-not-allowed opacity-50",
                !isEmpty && "bg-secondary/50"
              )}
              onClick={() => handleCellClick(index)}
            >
              <div className="flex items-center justify-center w-full h-full">
                {renderCellContent(cell)}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Current Turn Indicator */}
      {!winningLine && !disabled && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border">
            {currentPlayer === 'X' ? (
              <X className="h-5 w-5 text-primary" />
            ) : (
              <Circle className="h-5 w-5 text-accent" />
            )}
            <span className="text-sm font-medium">
              Player {currentPlayer}'s Turn
            </span>
          </div>
        </div>
      )}

      {/* Winner Indicator */}
      {(() => {
        // Debug: verify new code is loaded
        if (winningLine) {
          console.log('🐛 Winner check:', {
            winningLine,
            firstCell: board[winningLine[0]],
            shouldShow: board[winningLine[0]] !== 'Empty'
          });
        }
        return null;
      })()}
      {winningLine && board[winningLine[0]] !== 'EMPTY' && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/20 border-2 border-primary">
            {board[winningLine[0]] === 'X' ? (
              <X className="h-6 w-6 text-primary" />
            ) : (
              <Circle className="h-6 w-6 text-accent" />
            )}
            <span className="text-lg font-bold">
              Player {board[winningLine[0]]} Wins!
            </span>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {disabled && !winningLine && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Processing move...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicTacToe;
