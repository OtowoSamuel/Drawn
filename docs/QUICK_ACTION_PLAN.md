# ⚡ Quick Action Plan - Get Started NOW

> **Goal:** Get you building within the next hour  
> **Audience:** Developers who want to START immediately

---

## 🎯 Pick Your Starting Point (2 minutes)

### Option A: "I want to see it work FAST" 🏃‍♂️
**Time:** 1-2 days  
**Skills:** TypeScript, GraphQL basics  
**Reward:** Working game end-to-end

→ **Go to Section 1: Connect Frontend**

### Option B: "I want to learn multiplayer patterns" 📚
**Time:** 1 week  
**Skills:** Rust, Linera concepts  
**Reward:** Production-ready architecture

→ **Go to Section 2: Study References**

### Option C: "I want both, step by step" 🎓
**Time:** 3-4 weeks  
**Skills:** Both of above  
**Reward:** Complete mastery

→ **Go to Section 3: Hybrid Approach**

---

## Section 1: Connect Frontend (Quick Win Path)

### ⏱️ Hour 1: Setup

**Terminal 1 - Start Backend:**
```bash
cd /home/dinahmaccodes/Documents/codes-spare-github/Drawn/contracts

# Build contract
cargo build --release --target wasm32-unknown-unknown

# Publish and create application
linera project publish-and-create \
  --required-application-ids [] \
  --json-argument ""

# IMPORTANT: Copy the output!
# You'll see something like:
# Chain ID: e476187f6ddfeb9d588c7b45d3df334d5501d6499b3f9ad5595cae86cce16a65
# Application ID: e476187f6ddfeb9d588c7b45d3df334d5501d6499b3f9ad5595cae86cce16a65abc...

# Start service
linera service --port 8080
```

**Terminal 2 - Test Backend:**
```bash
# Open GraphiQL in browser:
# http://localhost:8080/chains/YOUR_CHAIN_ID/applications/YOUR_APP_ID

# Try this mutation:
mutation {
  createGame(playerX: "alice", playerO: "bob")
}

# Should return a number (game ID)
```

### ⏱️ Hour 2-3: Frontend Setup

**Create environment file:**
```bash
cd /home/dinahmaccodes/Documents/codes-spare-github/Drawn/frontend

# Create .env file
cat > .env << EOF
VITE_GRAPHQL_ENDPOINT=http://localhost:8080/chains/YOUR_CHAIN_ID/applications/YOUR_APP_ID
VITE_CHAIN_ID=YOUR_CHAIN_ID
VITE_APP_ID=YOUR_APP_ID
EOF

# Replace YOUR_CHAIN_ID and YOUR_APP_ID with actual values!
```

**Install and start:**
```bash
npm install
npm run dev

# Open http://localhost:5173
```

### ⏱️ Hour 4-5: Create GraphQL Client

**Create file: `frontend/src/lib/linera-client.ts`**

```typescript
const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT;

export interface CreateGameResult {
  data: {
    createGame: number;
  };
}

export interface MakeMoveResult {
  data: {
    makeMove: string;
  };
}

export const lineraClient = {
  async createGame(playerX: string, playerO?: string): Promise<number> {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation {
            createGame(playerX: "${playerX}", playerO: "${playerO || "AI"}")
          }
        `
      })
    });

    const result: CreateGameResult = await response.json();
    
    if (result.data?.createGame !== undefined) {
      return result.data.createGame;
    }
    
    throw new Error('Failed to create game');
  },

  async makeMove(gameId: number, player: string, position: number): Promise<void> {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          mutation {
            makeMove(gameId: ${gameId}, player: "${player}", position: ${position})
          }
        `
      })
    });

    const result: MakeMoveResult = await response.json();
    
    if (!result.data?.makeMove) {
      throw new Error('Failed to make move');
    }
  }
};
```

### ⏱️ Hour 6-8: Update Game Component

**Update file: `frontend/src/pages/Game.tsx`**

Add at the top:
```typescript
import { lineraClient } from '@/lib/linera-client';
import { useEffect, useState } from 'react';

// Add state
const [gameId, setGameId] = useState<number | null>(null);
const [currentPlayer, setCurrentPlayer] = useState<string>('alice');
```

Add game initialization:
```typescript
useEffect(() => {
  // Create game when component mounts
  const initGame = async () => {
    try {
      const id = await lineraClient.createGame('alice', 'bob');
      setGameId(id);
      console.log('Game created:', id);
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };
  
  initGame();
}, []);
```

**Update file: `frontend/src/components/TicTacToe.tsx`**

Find the `handleCellClick` function and update it:
```typescript
const handleCellClick = async (index: number) => {
  if (board[index] || winner || !gameId) return;

  try {
    // Make move on blockchain
    await lineraClient.makeMove(gameId, currentPlayer, index);
    
    // Update local state
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    
    // Check winner
    const winnerResult = checkWinner(newBoard);
    if (winnerResult) {
      setWinner(winnerResult);
      onGameEnd?.({ winner: winnerResult, status: 'win' });
    } else if (newBoard.every(cell => cell !== null)) {
      onGameEnd?.({ winner: null, status: 'draw' });
    } else {
      // Switch player
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  } catch (error) {
    console.error('Failed to make move:', error);
  }
};
```

### ✅ Test It!

1. Backend running on port 8080? ✓
2. Frontend running on port 5173? ✓
3. Can create game? ✓
4. Can make moves? ✓
5. Win detection works? ✓

**Congratulations! You have a working blockchain game!** 🎉

---

## Section 2: Study References (Deep Learning Path)

### Day 1: Read Documentation (4 hours)

**Morning (2 hours):**
```bash
cd /home/dinahmaccodes/Documents/codes-spare-github/Drawn/docs

# Read in this order:
1. EXECUTIVE_SUMMARY.md       # 15 min
2. QUICK_START_LINERA.md       # 20 min
3. CODEBASE_ANALYSIS.md        # 30 min - START HERE!
4. VISUAL_ARCHITECTURE_MAP.md  # 30 min
```

**Afternoon (2 hours):**
```bash
# Deep dive
5. BACKEND_ANALYSIS.md                    # 45 min
6. LINERA_INTEGRATION_COMPLETE_GUIDE.md   # 1 hour
```

### Day 2: Study linot-card-game (6 hours)

**Morning (3 hours): Backend Deep Dive**
```bash
cd /home/dinahmaccodes/Documents/codes-spare-github/Drawn/inspo/linot-card-game

# Read documentation
cat docs/WORKING_FLOW_BACKEND.md  # THE GOLD STANDARD!
cat docs/GAME_LOGIC_ANALYSIS.md
cat docs/FRONTEND_INTEGRATION.md

# Study contract structure
code backend/src/lib.rs          # Message, UserStatus, GameEvent enums
code backend/src/contract.rs     # execute_operation, execute_message
```

**Focus on these patterns:**
1. **UserStatus enum** - How it tracks player state
2. **Message flow** - Request → Confirmation → Subscribe
3. **handle_join_confirmed** - The critical subscription pattern
4. **Event emissions** - How PLAY_CHAIN broadcasts updates

**Afternoon (3 hours): Hands-on Exploration**
```bash
# Find key patterns
grep -n "subscribe_to_events" backend/src/chains/user_chain.rs
grep -n "emit" backend/src/chains/play_chain.rs
grep -n "WaitingToJoin" backend/src/lib.rs

# Trace a complete flow
echo "1. Find Operation::JoinMatch"
echo "2. See it send Message::RequestJoin"
echo "3. Find handle on PLAY_CHAIN"
echo "4. See JoinConfirmed sent back"
echo "5. Find handle_join_confirmed"
echo "6. See subscribe_to_events called"
```

### Day 3: Create Migration Plan (4 hours)

**Task: Document YOUR migration**

Create file: `MIGRATION_PLAN.md`
```markdown
# My Drawn Multiplayer Migration

## Phase 1: Add Types (Est: 4 hours)
- [ ] Add Message enum to lib.rs
- [ ] Add GameEvent enum to lib.rs
- [ ] Add UserStatus enum to lib.rs
- [ ] Update Contract trait types

## Phase 2: Update State (Est: 2 hours)
- [ ] Add user_status field
- [ ] Add subscribed_play_chain field
- [ ] Add is_play_chain field
- [ ] Initialize in instantiate()

## Phase 3: Implement Handlers (Est: 8 hours)
- [ ] handle_join_game (USER_CHAIN)
- [ ] handle_join_confirmed (USER_CHAIN)
- [ ] handle_request_join (PLAY_CHAIN)
- [ ] Same for CreateGame
- [ ] Same for MakeMove

## Phase 4: Test (Est: 4 hours)
- [ ] Local deployment with 2 wallets
- [ ] Test join flow
- [ ] Test game creation
- [ ] Test moves sync between players

## Phase 5: Frontend (Est: 6 hours)
- [ ] Support multiple endpoints
- [ ] Poll PLAY_CHAIN for state
- [ ] Update on events
```

### Day 4: Small Test Implementation

**Goal: Just test the subscribe pattern**

```bash
cd /home/dinahmaccodes/Documents/codes-spare-github/Drawn

# Create branch
git checkout -b test-subscribe-pattern

# Make minimal changes
# 1. Add UserStatus enum
# 2. Add just subscribe operation
# 3. Test it works

# Then commit and review
```

**Deliverable:** You understand the patterns deeply.

---

## Section 3: Hybrid Approach (Best of Both Worlds)

### Week 1: Quick Win (Section 1)
- **Mon-Tue:** Setup + GraphQL client
- **Wed-Thu:** Connect Game.tsx
- **Fri:** Test and polish
- **Weekend:** Demo for friends! 🎮

### Week 2: Deep Study (Section 2)
- **Mon-Tue:** Read all docs
- **Wed-Thu:** Study linot deeply
- **Fri:** Create migration plan
- **Weekend:** Rest and reflect

### Week 3: Backend Migration
- **Mon:** Add enums (Message, GameEvent, UserStatus)
- **Tue:** Update State
- **Wed:** Implement USER_CHAIN handlers
- **Thu:** Implement PLAY_CHAIN handlers
- **Fri:** Write tests

### Week 4: Frontend + Polish
- **Mon:** Update frontend for multiplayer
- **Tue:** Test with 2 browsers
- **Wed:** Polish and bug fixes
- **Thu:** Deploy to testnet
- **Fri:** Final demo! 🚀

---

## 📋 Daily Checklist Template

```markdown
## Day X: [Task]

### Morning
- [ ] Task 1 (Est: X hours)
  - Sub-task a
  - Sub-task b
  
### Afternoon  
- [ ] Task 2 (Est: X hours)
  - Sub-task a
  - Sub-task b

### Evening Review
- What worked:
- What didn't:
- Tomorrow's focus:
- Blockers:
```

---

## 🆘 Common Issues & Quick Fixes

### Issue: "Cannot find module linera-client"
```bash
# Fix:
cd frontend/src
mkdir -p lib
# Then create linera-client.ts
```

### Issue: "CORS error from GraphQL"
```bash
# Fix: Restart linera service with CORS enabled
linera service --port 8080 --external-signing
```

### Issue: "Game ID returns undefined"
```bash
# Debug in browser console:
console.log(await fetch(GRAPHQL_ENDPOINT, {
  method: 'POST',
  body: JSON.stringify({ query: '{ totalMinted nextTokenId }' })
}).then(r => r.json()))

# If error: Check GRAPHQL_ENDPOINT is correct
```

### Issue: "Frontend shows old data"
```bash
# Clear cache
localStorage.clear()
# Hard refresh: Ctrl+Shift+R
```

---

## 💡 Pro Tips

1. **Use Git Branches**
   ```bash
   git checkout -b feature/connect-frontend
   git checkout -b feature/multiplayer-migration
   ```

2. **Test in GraphiQL First**
   - Always test mutations in GraphiQL before frontend
   - Copy working queries to frontend
   - This isolates frontend vs backend issues

3. **Console.log Everything**
   ```typescript
   console.log('Game ID:', gameId);
   console.log('Move result:', result);
   console.log('Board state:', board);
   ```

4. **Small Commits**
   ```bash
   git commit -m "Add GraphQL client"
   git commit -m "Connect Game.tsx to backend"
   git commit -m "Add move validation"
   ```

5. **Document Decisions**
   ```markdown
   ## Why I chose Path A
   - Need demo by Friday
   - Can migrate to multiplayer later
   - Low risk, high reward
   ```

---

## 📞 Next Steps RIGHT NOW

1. **Choose your path** (A, B, or C)
2. **Set a timer for 1 hour**
3. **Start executing**

### If Path A:
```bash
cd contracts
cargo build --release --target wasm32-unknown-unknown
# Continue with Hour 1 above
```

### If Path B:
```bash
cd docs
cat EXECUTIVE_SUMMARY.md
# Start reading
```

### If Path C:
```bash
# Do Path A first, then B
cd contracts
cargo build --release --target wasm32-unknown-unknown
```

---

## ✅ Success Metrics

### After 1 Day (Path A)
- [ ] Backend running
- [ ] GraphiQL working
- [ ] Frontend running
- [ ] .env configured

### After 3 Days (Path A)
- [ ] GraphQL client created
- [ ] Game.tsx connected
- [ ] Can create games
- [ ] Can make moves

### After 1 Week (Path B)
- [ ] All docs read
- [ ] linot patterns understood
- [ ] Migration plan documented
- [ ] Test implementation done

### After 4 Weeks (Path C)
- [ ] Working single-chain demo
- [ ] Multiplayer implemented
- [ ] Frontend updated
- [ ] End-to-end tested

---

## 🎯 Focus Areas by Skill Level

### Beginner (New to Linera)
**Focus:** Path A → Connect frontend
- GraphQL basics
- React integration
- Testing workflow

### Intermediate (Know Linera basics)
**Focus:** Path B → Study multiplayer
- Message patterns
- Chain separation
- Event streams

### Advanced (Ready to ship)
**Focus:** Path C → Full implementation
- Complete migration
- Production deployment
- Advanced features

---

## 🚀 GO BUILD!

**Stop reading. Start coding.** ⌨️

You have:
- ✅ Beautiful frontend
- ✅ Working backend
- ✅ Complete documentation
- ✅ Reference implementations
- ✅ This action plan

**Everything you need is ready.**

**Pick your path and START NOW!** 🏃‍♂️💨

---

**Questions during implementation?**
1. Check `docs/CODEBASE_ANALYSIS.md`
2. Review `inspo/linot-card-game/docs/WORKING_FLOW_BACKEND.md`
3. Test in GraphiQL to isolate issues
4. Console.log everything

**You got this!** 💪🎮🚀
