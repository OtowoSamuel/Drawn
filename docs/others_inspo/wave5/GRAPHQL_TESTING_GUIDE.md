# GraphQL Testing Guide - Drawn Tic-Tac-Toe

> Complete guide for testing the Linera blockchain backend using GraphQL IDE

---

## 🎯 **Understanding the Chain Architecture**

### **Two Types of Chains**

#### **1. Main Chain** (Application Chain)
- **Purpose:** Entry point, game registry
- **Created by:** `run.bash` (from faucet)
- **Stores:** `game_chains` map (tracks all active games)
- **GraphQL State:** `players` = `null`, `board` exists but not used
- **Mutations:** `start` (create new game)

#### **2. Game Chains** (Temporary Chains)
- **Purpose:** Individual game instances
- **Created by:** `start` mutation on main chain
- **Stores:** `players`, `board`, game state
- **GraphQL State:** `players` = `[address1, address2]`, `board` = actual game
- **Mutations:** `makeMove` (play the game)

---

## 🔍 **Reading Terminal Logs**

### **Key Log Patterns**

When `run.bash` starts or you create games, watch for these:

```bash
# Main chain creation (from run.bash)
✅ Main Chain: fb1b8a01348ea219d3eaad889da941d3b4be4397bb32c53a457c89a960af5bcd
✅ Application: 8337f9c34eac2b6e793e5f6de36dc005502dbcaa6e31e6e2dd9e55bec05e894c
✅ Owner Address: 0x2dad95b1a1ae70a94d0213afcee8ff0dc2a2dec1d6b843ec525c1e24fb9ae1b7
```

**What each means:**
- **Main Chain:** Your application's home chain (64 hex chars)
- **Application:** Your deployed app ID (64 hex chars)
- **Owner:** The wallet address that can interact (66 chars with `0x` prefix)

```bash
# Game chain creation (after calling start mutation)
chain_id=d996dfc880936dccc99159921fafd07cdbcc2249849eb649d93965b4d4f98b49 height=0
done processing inbox chain_id=d996dfc8... created_block_count=1
```

**How to identify:**
- New chains appear after mutations
- Look for `chain_id=` with a **different prefix** than your main chain
- `height=0` means new chain
- `created_block_count=1` confirms message processed

---

## 📝 **Step-by-Step Testing Guide**

### **Prerequisites**

1. **Start the network:**
   ```bash
   ./run.bash
   ```

2. **Note the output:**
   ```
   Main Chain:  <MAIN_CHAIN_ID>
   Application: <APP_ID>
   Owner:       <OWNER_ADDRESS>
   GraphQL Service: http://localhost:8081
   ```

---

### **Step 1: Open Main Chain GraphQL IDE**

**URL Format:**
```
http://localhost:<SERVICE_PORT>/chains/<MAIN_CHAIN_ID>/applications/<APP_ID>
```

**Example:**
```
http://localhost:8081/chains/fb1b8a01348ea219d3eaad889da941d3b4be4397bb32c53a457c89a960af5bcd/applications/8337f9c34eac2b6e793e5f6de36dc005502dbcaa6e31e6e2dd9e55bec05e894c
```

---

### **Step 2: Query Main Chain State**

**Query:**
```graphql
query {
  state {
    players
    board {
      cells
      movesCount
      finished
    }
  }
}
```

**Expected Response:**
```json
{
  "data": {
    "state": {
      "players": null,          // ✅ Main chain has no players
      "board": {
        "cells": ["EMPTY", "EMPTY", ...],
        "movesCount": 0,
        "finished": false
      }
    }
  }
}
```

---

### **Step 3: Create a New Game**

**Mutation:**
```graphql
mutation {
  start(players: [
    "<OWNER_ADDRESS>",
    "<OWNER_ADDRESS>"
  ])
}
```

**Example (replace with your owner from run.bash):**
```graphql
mutation {
  start(players: [
    "0x2dad95b1a1ae70a94d0213afcee8ff0dc2a2dec1d6b843ec525c1e24fb9ae1b7",
    "0x2dad95b1a1ae70a94d0213afcee8ff0dc2a2dec1d6b843ec525c1e24fb9ae1b7"
  ])
}
```

**Expected Response:**
```json
{
  "data": {
    "start": "Continue"
  }
}
```

---

### **Step 4: Find the Game Chain ID**

**Check your terminal for new chain:**
```bash
chain_id=d996dfc880936dccc99159921fafd07cdbcc2249849eb649d93965b4d4f98b49
```

**Copy the 64-character chain ID!**

---

### **Step 5: Open Game Chain GraphQL IDE**

**URL Format:**
```
http://localhost:<SERVICE_PORT>/chains/<GAME_CHAIN_ID>/applications/<APP_ID>
```

**Example:**
```
http://localhost:8081/chains/d996dfc880936dccc99159921fafd07cdbcc2249849eb649d93965b4d4f98b49/applications/8337f9c34eac2b6e793e5f6de36dc005502dbcaa6e31e6e2dd9e55bec05e894c
```

---

### **Step 6: Verify Game Initialization**

**⚠️ CRITICAL:** Wait 2-3 seconds after creating the game!

**Query:**
```graphql
query {
  state {
    players
    board {
      cells
      movesCount
      finished
    }
  }
}
```

**Expected Response:**
```json
{
  "data": {
    "state": {
      "players": [
        "0x2dad95b1a1ae70a94d0213afcee8ff0dc2a2dec1d6b843ec525c1e24fb9ae1b7",
        "0x2dad95b1a1ae70a94d0213afcee8ff0dc2a2dec1d6b843ec525c1e24fb9ae1b7"
      ],
      "board": {
        "cells": ["EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY"],
        "movesCount": 0,
        "finished": false
      }
    }
  }
}
```

**If `players` is `null`:**
- ⏰ Wait 2-3 seconds
- 🔄 Query again
- The `Message::Start` is still processing

---

### **Step 7: Make Your First Move**

**Board Position Reference:**
```
0 | 1 | 2
---------
3 | 4 | 5
---------
6 | 7 | 8
```

**Mutation (Player X - position 4 = center):**
```graphql
mutation {
  makeMove(position: 4)
}
```

**Expected Response:**
```json
{
  "data": {
    "makeMove": "Continue"
  }
}
```

---

### **Step 8: Verify Move Was Recorded**

**Query:**
```graphql
query {
  state {
    board {
      cells
      movesCount
      finished
    }
  }
}
```

**Expected Response:**
```json
{
  "data": {
    "state": {
      "board": {
        "cells": ["EMPTY", "EMPTY", "EMPTY", "EMPTY", "X", "EMPTY", "EMPTY", "EMPTY", "EMPTY"],
        "movesCount": 1,
        "finished": false
      }
    }
  }
}
```

✅ Position 4 now shows `"X"`  
✅ Move count incremented to `1`

---

### **Step 9: Continue Playing**

**Moves alternate automatically (X, O, X, O...):**

```graphql
# Move 2 - O's turn
mutation { makeMove(position: 0) }

# Move 3 - X's turn  
mutation { makeMove(position: 1) }

# Move 4 - O's turn
mutation { makeMove(position: 2) }

# Move 5 - X's turn
mutation { makeMove(position: 7) }

# Move 6 - O's turn
mutation { makeMove(position: 3) }

# Move 7 - X's turn (WINS - middle column!)
mutation { makeMove(position: 5) }
```

---

### **Step 10: Check Win Condition**

After the winning move, the **mutation response** shows the winner:

**Response:**
```json
{
  "data": {
    "makeMove": {
      "Winner": "X"
    }
  }
}
```

**Query the final state:**
```graphql
query {
  state {
    board {
      cells
      movesCount
      finished
    }
  }
}
```

**Expected:**
```json
{
  "data": {
    "state": {
      "board": {
        "cells": ["O", "X", "O", "O", "X", "X", "EMPTY", "X", "EMPTY"],
        "movesCount": 7,
        "finished": true    // ✅ Game is over!
      }
    }
  }
}
```

---

### **Step 11: Test Game-Over Protection**

**Try to make another move:**
```graphql
mutation {
  makeMove(position: 6)
}
```

**Expected Error:**
```json
{
  "error": "...Game is already over..."
}
```

✅ **Players cannot play after the game ends!**

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: "No players set on this chain"**

**Problem:** You tried to make a move before `Message::Start` was processed.

**Solution:**
1. Wait 2-3 seconds after creating game
2. Query `state.players` first
3. Only proceed when `players` is NOT `null`

---

### **Issue 2: "It's not your turn"**

**Problem:** Turn alternation - X goes first, then O, then X...

**Solution:**
- Check `movesCount`:
  - Even number (0, 2, 4...) = X's turn
  - Odd number (1, 3, 5...) = O's turn

---

### **Issue 3: "Cell must be empty"**

**Problem:** Tried to play in an occupied position.

**Solution:**
- Query the board first
- Pick a position showing `"EMPTY"`

---

### **Issue 4: Can't find game chain ID**

**Problem:** Logs scrolled away or unclear.

**Solution:**
- Look for lines with `chain_id=` after your mutation
- Find one with a **different prefix** than your main chain
- Example:
  - Main chain: `fb1b8a01...`
  - Game chain: `d996dfc8...` ← Different prefix!

---

## 📚 **Quick Reference**

### **GraphQL Endpoints**

| Purpose | URL Template |
|---------|-------------|
| **Main Chain** | `http://localhost:8081/chains/<MAIN_CHAIN>/applications/<APP_ID>` |
| **Game Chain** | `http://localhost:8081/chains/<GAME_CHAIN>/applications/<APP_ID>` |

### **Queries**

```graphql
# Get full state
query {
  state {
    players
    board {
      cells
      movesCount
      finished
    }
  }
}
```

### **Mutations**

```graphql
# Create game (on MAIN chain)
mutation {
  start(players: ["<ADDRESS1>", "<ADDRESS2>"])
}

# Make move (on GAME chain)
mutation {
  makeMove(position: 0)  # 0-8
}
```

### **Board Positions**

```
0 | 1 | 2
---------
3 | 4 | 5
---------
6 | 7 | 8
```

---

## 🎮 **What You're Testing**

✅ **Chain Creation:** Main chain → Game chains  
✅ **Message Passing:** `Message::Start`, `Message::End`  
✅ **Turn Logic:** Alternating X/O  
✅ **Win Detection:** Rows, columns, diagonals  
✅ **Draw Detection:** All cells filled, no winner  
✅ **Game-Over Protection:** Can't play after game ends  
✅ **Blockchain Persistence:** State survives across queries  
✅ **Authentication:** Turn enforcement (single-player demo bypasses this)

---

## 🔗 **Next Steps**

Once manual testing works:
1. **Frontend Integration:** Connect React app to these GraphQL endpoints
2. **Auto Chain ID Extraction:** Parse `start` mutation response
3. **Real-time Updates:** Replace polling with GraphQL subscriptions
4. **Multi-Player:** Use different wallets for Player 1 and Player 2

---

**You now have a fully functional Linera blockchain game backend!** 🎉
