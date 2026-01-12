# 🔗 URL Format Quick Reference

## **Step-by-Step: From run.bash to Playing**

### **Step 1: Start `run.bash` → Get Main Chain Info**

```bash
./run.bash
```

**Extract these 3 values from output:**
```
✅ Main Chain:  6b3f4a6eee371657a006de9daa96bc719fa2d648d40e6e5a464f37e591154213  ← COPY THIS
✅ Application: 0d1afc648786fe5664627a8aee7dabbccf7c8cc93f71eb570209721bdbbf7113  ← COPY THIS
✅ Owner:       0xf0d3966ac9b5a862e05ec10df83374ff26ed86185b95bf9fb6ffdd60dbf181a5  ← COPY THIS
```

---

### **Step 2: Build Main Chain URL**

**Template:**
```
http://localhost:8081/chains/<MAIN_CHAIN>/applications/<APP_ID>
```

**Your URL:**
```
http://localhost:8081/chains/6b3f4a6e.../applications/0d1afc64...
```

---

### **Step 3: Run `start` Mutation on Main Chain**

Open the main chain URL, then run:

```graphql
mutation {
  start(players: [
    "0xf0d3966ac9b5a862e05ec10df83374ff26ed86185b95bf9fb6ffdd60dbf181a5",
    "0xf0d3966ac9b5a862e05ec10df83374ff26ed86185b95bf9fb6ffdd60dbf181a5"
  ])
}
```

---

### **Step 4: Find Game Chain in Terminal Logs**

**Look for NEW chain ID (different from main chain):**

```bash
chain_id=070a78f3d18369372bd5a5d8846c908b8dafc4c79ed215cdbbc607c2442071cb  ← GAME CHAIN!
         ^^^^^^^^                                                  ^^^^^^^^
         Different prefix!                                         Different!

done processing inbox chain_id=070a78f3... created_block_count=1  ← MESSAGE PROCESSED!
```

**Compare:**
- Main chain: `6b3f4a6e...` ❌
- Game chain: `070a78f3...` ✅ **Use this!**

---

### **Step 5: Build Game Chain URL**

**Template (SAME as before, just different chain ID!):**
```
http://localhost:8081/chains/<GAME_CHAIN>/applications/<SAME_APP_ID>
```

**Your URL:**
```
http://localhost:8081/chains/070a78f3.../applications/0d1afc64...
                                ^^^^^^^^                ^^^^^^^^
                                NEW!                    SAME!
```

---

### **Step 6: Query & Play on Game Chain**

Now `players` will NOT be null! 🎉

```graphql
query {
  state {
    players  # ✅ Shows addresses now!
    board {
      cells
      movesCount
      finished
    }
  }
}
```

Then make moves:
```graphql
mutation { makeMove(position: 4) }
```

---

## **GraphQL URL Structure**

```
http://localhost:<PORT>/chains/<CHAIN_ID>/applications/<APP_ID>
```

## **Visual Breakdown**

```
http://localhost:8081/chains/c89420ca749b77403c0c04c6361d1bb2e7c89c97aa742714ae523915ebfc6d76/applications/8337f9c34eac2b6e793e5f6de36dc005502dbcaa6e31e6e2dd9e55bec05e894c
                ^^^^          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                PORT          CHAIN_ID (64 hex chars)                                           APPLICATION_ID (64 hex chars)
```

---

## **How to Find Each Component**

### **1. PORT** → From `run.bash` output

```bash
GraphQL Service:
http://localhost:8081    ← Port is 8081
```

---

### **2. CHAIN_ID** → Two sources:

#### **Main Chain (from run.bash output):**

```bash
✅ Main Chain: fb1b8a01348ea219d3eaad889da941d3b4be4397bb32c53a457c89a960af5bcd
               ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
               Copy this entire 64-character hex string
```

#### **Game Chain (from terminal logs after `start` mutation):**

```bash
chain_id=d996dfc880936dccc99159921fafd07cdbcc2249849eb649d93965b4d4f98b49
         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
         Copy this 64-character hex string (different prefix from main!)
```

**How to spot it:**
- Look for `chain_id=` in logs
- Compare first 8 characters with main chain
- If different → it's a new game chain!

**Example:**
- Main chain: `fb1b8a01...` ← starts with `fb1b8a01`
- Game chain: `d996dfc8...` ← starts with `d996dfc8` (different!)

---

### **3. APP_ID** → From `run.bash` output

```bash
✅ Application: 8337f9c34eac2b6e793e5f6de36dc005502dbcaa6e31e6e2dd9e55bec05e894c
                ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                Copy this entire 64-character hex string
```

**This stays the SAME for all URLs!**

---

## **Template for Quick Copy**

```
http://localhost:8081/chains/PASTE_CHAIN_ID_HERE/applications/PASTE_APP_ID_HERE
```

**Steps:**
1. Copy the template above
2. Replace `PASTE_CHAIN_ID_HERE` with:
   - Main chain ID (from run.bash) for creating games
   - Game chain ID (from logs) for playing
3. Replace `PASTE_APP_ID_HERE` with application ID (from run.bash)

---

## **Two URL Types**

### **Main Chain URL** (for creating games)

```
http://localhost:8081/chains/<MAIN_CHAIN_FROM_RUNBASH>/applications/<APP_ID>
```

**Used for:**
✅ Querying main chain (check `game_chains` map)  
✅ Creating new games (`start` mutation)

---

### **Game Chain URL** (for playing)

```
http://localhost:8081/chains/<GAME_CHAIN_FROM_LOGS>/applications/<APP_ID>
```

**Used for:**
✅ Querying game state (`players`, `board`)  
✅ Making moves (`makeMove` mutation)  
✅ Checking winners

---

## **Complete Example**

### **From `run.bash` output:**
```bash
✅ Main Chain:  fb1b8a01348ea219d3eaad889da941d3b4be4397bb32c53a457c89a960af5bcd
✅ Application: 8337f9c34eac2b6e793e5f6de36dc005502dbcaa6e31e6e2dd9e55bec05e894c
```

### **Main Chain URL:**
```
http://localhost:8081/chains/fb1b8a01348ea219d3eaad889da941d3b4be4397bb32c53a457c89a960af5bcd/applications/8337f9c34eac2b6e793e5f6de36dc005502dbcaa6e31e6e2dd9e55bec05e894c
```

### **After running `start` mutation, from logs:**
```bash
chain_id=d996dfc880936dccc99159921fafd07cdbcc2249849eb649d93965b4d4f98b49
```

### **Game Chain URL:**
```
http://localhost:8081/chains/d996dfc880936dccc99159921fafd07cdbcc2249849eb649d93965b4d4f98b49/applications/8337f9c34eac2b6e793e5f6de36dc005502dbcaa6e31e6e2dd9e55bec05e894c
```

**Notice:** Only the chain ID changed! Port and App ID stay the same.

---

## **Quick Decision Tree**

**Want to create a game?**
→ Use **Main Chain URL** (with main chain ID from run.bash)

**Want to play/make moves?**
→ Use **Game Chain URL** (with game chain ID from logs)

**Still confused?**
→ Check if `players` in query response is `null`:
- `null` = You're on main chain
- `[addresses]` = You're on game chain

---

**See [GRAPHQL_TESTING_GUIDE.md](./GRAPHQL_TESTING_GUIDE.md) for full testing instructions!**
