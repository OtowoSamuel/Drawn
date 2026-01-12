// Linera GraphQL Client for Tic-Tac-Toe (Single-Chain Version)

// Environment variables
const APP_ID = import.meta.env.VITE_APP_ID || '';
const MAIN_CHAIN_ID = import.meta.env.VITE_CHAIN_ID || '';
const GRAPHQL_BASE_URL = import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:8081';

// Main chain GraphQL URL
export const MAIN_CHAIN_URL = `${GRAPHQL_BASE_URL}/chains/${MAIN_CHAIN_ID}/applications/${APP_ID}`;

// Types matching backend
export type Cell = 'EMPTY' | 'X' | 'O';
export type GameResult = 'Continue' | { Winner: 'X' | 'O' } | 'Draw';

export interface Board {
  cells: Cell[];
  movesCount: number;
  finished: boolean;  // Added - was missing!
}

export interface GameState {
  players: [string, string] | null;
  board: Board;
}

// GraphQL request helper
async function graphQLRequest(url: string, query: string, variables?: Record<string, any>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

// Main Chain Operations (Simplified - no game chains!)

/**
 * Start a new game on the main chain
 */
export async function startGame(players: [string, string]): Promise<string> {
  const mutation = `
    mutation StartGame($players: [AccountOwner!]!) {
      start(players: $players)
    }
  `;

  const data = await graphQLRequest(MAIN_CHAIN_URL, mutation, { players });
  // Linera returns just the hash string directly
  return data;
}

/**
 * Make a move on the main chain
 */
export async function makeMove(position: number): Promise<string> {
  const mutation = `
    mutation MakeMove($position: Int!) {
      makeMove(position: $position)
    }
  `;

  const data = await graphQLRequest(MAIN_CHAIN_URL, mutation, { position });
  // Linera returns just the hash string directly
  return data;
}

/**
 * Query game state from the main chain
 */
export async function getGameState(): Promise<GameState> {
  const query = `
    query GetGameState {
      state {
        players
        board {
          cells
          movesCount
          finished
        }
      }
    }
  `;

  const data = await graphQLRequest(MAIN_CHAIN_URL, query);
  return data.state;
}

/**
 * Poll for game state updates
 */
export function pollGameState(
  onUpdate: (state: GameState) => void,
  onError?: (error: Error) => void,
  intervalMs: number = 1000
): () => void {
  const interval = setInterval(async () => {
    try {
      const state = await getGameState();
      onUpdate(state);
    } catch (error) {
      console.error('Polling error:', error);
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }, intervalMs);

  return () => clearInterval(interval);
}

// Utility functions

/**
 * Check if a cell is playable
 */
export function isCellPlayable(cell: Cell): boolean {
  return cell === 'EMPTY';
}

/**
 * Get cell display value
 */
export function getCellDisplay(cell: Cell): string {
  switch (cell) {
    case 'X':
      return '❌';
    case 'O':
      return '⭕';
    default:
      return '';
  }
}

/**
 * Parse GameResult to determine winner
 */
export function parseGameResult(result: GameResult): {
  gameOver: boolean;
  winner: 'X' | 'O' | 'Draw' | null;
} {
  if (result === 'Continue') {
    return { gameOver: false, winner: null };
  }
  
  if (result === 'Draw') {
    return { gameOver: true, winner: 'Draw' };
  }
  
  if (typeof result === 'object' && 'Winner' in result) {
    return { gameOver: true, winner: result.Winner };
  }
  
  return { gameOver: false, winner: null };
}

/**
 * Get current player based on move count
 */
export function getCurrentPlayer(movesCount: number): 'X' | 'O' {
  return movesCount % 2 === 0 ? 'X' : 'O';
}

// Export all environment variables for debugging
export const ENV = {
  APP_ID,
  MAIN_CHAIN_ID,
  GRAPHQL_BASE_URL,
  MAIN_CHAIN_URL,
};
