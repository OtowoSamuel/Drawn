# Game Chain Tracking Pattern - Microchess vs Drawn

## **How Microchess Tracks Game Chains**

### **Key Discovery**

Microchess **returns the chain ID directly** from the operation!

```rust
// From microchess contract.rs:545-550
let game_chain = GameChain {
    chain_id,      // ← The newly created chain
    timestamp,
};

Ok(game_chain)  // ← RETURNS the chain ID!
```

### **Their Flow**

1. **Create chain:**
   ```rust
   let chain_id = self.runtime.open_chain(ownership, permissions, fee);
   ```

2. **Send initialization message:**
   ```rust
   self.runtime.send_message(
       chain_id,
       Message::Start { players, match_id, timer, match_type }
   );
   ```

3. **Return chain ID to caller:**
   ```rust
   Ok(GameChain { chain_id, timestamp })
   ```

4. **Also notify players via messages:**
   ```rust
   // Line 555: send_game_chain_data_2players
   self.runtime.send_message(
       player_1.chain_id,
       Message::GameChainData { game_chain_data }
   );
   ```

---

## **Our Current Implementation**

### **What We Do**

```rust
// From our contract.rs:85-111
async fn execute_start(&mut self, players: [AccountOwner; 2]) -> GameResult {
    let chain_id = self.runtime.open_chain(...).await.unwrap();
    
    // Send init message
    self.runtime
        .prepare_message(Message::Start { players })
        .send_to(chain_id);
    
    GameResult::Continue  // ❌ Doesn't return chain ID!
}
```

**Problem:** We return `GameResult::Continue` instead of the actual chain ID!

---

## **The Fix We Need**

### **Option 1: Return Chain ID (Microchess Pattern)**

Change our response type:

```rust
pub enum GameResult {
    Winner(Player),
    Draw,
    Continue,
    Started(ChainId),  // ← Add this variant!
}
```

Then:

```rust
async fn execute_start(&mut self, players: [AccountOwner; 2]) -> GameResult {
    let chain_id = self.runtime.open_chain(...).await.unwrap();
    
    // ... send messages ...
    
    GameResult::Started(chain_id)  // ✅ Return the chain ID!
}
```

### **Option 2: Store in State (Query Pattern)**

Add to `TicTacToeState`:

```rust
pub struct TicTacToeState {
    pub game_chains: MapView<AccountOwner, Set<GameChain>>,  // ← Already have this!
    // ...
}
```

Frontend queries main chain:

```graphql
query {
  state {
    game_chains  # Returns all game chains for owner
  }
}
```

---

## **Recommended Approach for Drawn**

### **Use Both Patterns!**

**1. Return Chain ID from mutation** (Immediate feedback)
```rust
GameResult::Started(chain_id)
```

**2. Store in game_chains map** (Persistence, can query later)
```rust
self.state
    .game_chains
    .get_mut_or_default(player)
    .await
    .unwrap()
    .insert(GameChain { chain_id });
```

**3. Frontend gets chain ID directly from mutation response:**
```typescript
const result = await startGame([player1, player2]);
// result = { Started: "abc123def456..." }
const gameChainId = result.Started;
// Navigate to: `/game/${gameChainId}`
```

**Fallback:** If mutation response is lost, query `game_chains`:
```graphql
query {
  state {
    game_chains
  }
}
```

---

## **Implementation Steps**

### **Step 1: Update GameResult enum**

`contracts/src/lib.rs`:
```rust
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum GameResult {
    Winner(Player),
    Draw,
    Continue,
    Started(String),  // Chain ID as string for GraphQL
}
```

### **Step 2: Return chain ID from execute_start**

`contracts/src/contract.rs`:
```rust
async fn execute_start(&mut self, players: [AccountOwner; 2]) -> GameResult {
    let chain_id = self
        .runtime
        .open_chain(
            ChainOwnership::single(players[0]),
            ApplicationPermissions::default(),
            Amount::ZERO,
        )
        .await
        .unwrap();

    // Store in game_chains map
    for player in &players {
        self.state
            .game_chains
            .get_mut_or_default(player)
            .await
            .unwrap()
            .insert(GameChain { chain_id });
    }

    // Send init message
    self.runtime
        .prepare_message(Message::Start { players })
        .send_to(chain_id);

    // Return the chain ID!
    GameResult::Started(chain_id.to_string())
}
```

### **Step 3: Frontend extracts chain ID**

`frontend/src/lib/linera.ts`:
```typescript
export async function startGame(players: [string, string]): Promise<string> {
  const mutation = `
    mutation($players: [AccountOwner!]!) {
      start(players: $players)
    }
  `;

  const response = await graphQLRequest(mutation, { players });
  
  // Response will be { Started: "chain_id" } or "Continue"
  if (typeof response.start === 'object' && response.start.Started) {
    return response.start.Started;  // ✅ Got the chain ID!
  }
  
  throw new Error('Failed to extract game chain ID');
}
```

### **Step 4: Navigate to game automatically**

`frontend/src/pages/Game.tsx`:
```typescript
const gameChainId = await startGame([ownerAddress, ownerAddress]);
// Redirect to game with chain ID
navigate(`/game/${gameChainId}`);
```

---

## **Benefits of This Approach**

✅ **Frontend gets chain ID immediately** (no log parsing!)  
✅ **Can query game_chains as fallback** (if mutation response lost)  
✅ **Follows microchess pattern** (proven to work)  
✅ **Enables automatic navigation** (better UX)  
✅ **Supports game history** (query all past games)

---

## **Comparison Table**

| Feature | Microchess | Our Current | Recommended |
|---------|------------|-------------|-------------|
| **Return chain ID** | ✅ Yes | ❌ No | ✅ Yes |
| **Store in state** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Frontend gets ID** | Mutation response | ❌ Logs only | Mutation response |
| **Query games** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Auto-navigate** | ✅ Yes | ❌ No | ✅ Yes |

---

## **Next Steps**

1. Update `GameResult` enum to include `Started(String)` variant
2. Modify `execute_start` to return chain ID
3. Update frontend to extract chain ID from mutation response
4. Add automatic navigation to game chain
5. Test full flow without checking logs!

---

**This is the missing piece for seamless frontend integration!** 🎯
