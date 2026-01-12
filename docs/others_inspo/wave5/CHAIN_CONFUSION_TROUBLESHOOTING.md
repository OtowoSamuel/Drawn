# 🆘 Common Confusion: Main Chain vs Game Chain

## **The Most Common Mistake**

### ❌ What People Do Wrong

1. See main chain from run.bash: `e8feb9b7...`
2. Use that to build URL: `http://localhost:8081/chains/e8feb9b7.../applications/...`
3. Run `start` mutation → **Success!**
4. Try to query `players` on SAME URL → **Returns `null`** 😱
5. Think: "It's broken!"

### ✅ What Actually Happened

The `start` mutation **created a NEW chain**! You're still querying the old (main) chain!

---

## **The Fix: Find Your Game Chain**

### **Step 1: After `start` mutation, check your terminal**

Look for this in the logs (it appears RIGHT AFTER you run `start`):

```bash
chain_id=abc123def456...849eb649d93965b4d4f98b49 height=0
                        ^^^^^^^^^^^^^^^^^^^^^^^^
                        This is your GAME CHAIN!
```

### **Step 2: Compare with your main chain**

```bash
Main chain:  e8feb9b7...  ← You ran start here
Game chain:  abc123de...  ← New chain created (DIFFERENT!)
```

**They will have DIFFERENT first 8 characters!**

### **Step 3: Build NEW URL with game chain**

```
http://localhost:8081/chains/abc123de.../applications/SAME_APP_ID
                                ^^^^^^^^
                                Use the NEW chain from logs!
```

---

## **Quick Diagnosis**

### **If `players` is `null`:**

🔍 **You're on the main chain!**

**What to do:**
1. Check terminal logs for `chain_id=` after your `start` mutation
2. Copy that NEW chain ID
3. Build a NEW URL with it
4. Query that URL instead

### **If `players` shows addresses:**

✅ **You're on the game chain!**

**What to do:**
- You're in the right place!
- Make moves with `makeMove` mutation
- Continue playing

---

## **Visual Flow**

```
┌─────────────────────────────────────────┐
│  Main Chain (e8feb9b7...)               │
│  ✅ Run: start mutation                 │
│  ❌ Don't: Make moves here               │
│  📝 State: players = null                │
└─────────────────┬───────────────────────┘
                  │
                  │ Creates ↓
                  │
┌─────────────────▼───────────────────────┐
│  Game Chain (abc123de...)  ← FROM LOGS! │
│  ✅ Run: makeMove mutations              │
│  ✅ Query: players, board, moves         │
│  📝 State: players = [addresses]         │
└─────────────────────────────────────────┘
```

---

## **Real Example**

### **Your Situation:**

```
Main Chain: e8feb9b73d22fca4c9e385ee8d35bb36f92dfff2667dcb24331d5b632375a05f
App ID:     ec841aa7e663e8ee37d32cf23aaf89a0998c0fb92a1ab5ae6349f315d3551eb0
```

### **What You Did:**

1. ✅ Built URL: `http://localhost:8081/chains/e8feb9b7.../applications/ec841aa7...`
2. ✅ Ran `start` mutation
3. ❌ Queried SAME URL → `players = null`

### **What You Should Do:**

1. Check terminal for `chain_id=` in logs
2. Copy that NEW chain (will be different from `e8feb9b7...`)
3. Build URL: `http://localhost:8081/chains/NEW_CHAIN_FROM_LOGS/applications/ec841aa7...`
4. Query that URL → `players = [addresses]` ✅

---

**The key: After `start`, always look in logs for the NEW chain!**
