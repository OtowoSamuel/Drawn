require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 3001

app.use(express.json())

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Example endpoint: returns metadata for a token (placeholder)
app.get('/api/metadata/:tokenId', (req, res) => {
  const { tokenId } = req.params
  res.json({
    name: `Drawn Sticker #${tokenId}`,
    description: 'Placeholder metadata. Replace with IPFS/Pinata links.',
    image: `https://ipfs.example/${tokenId}.png`
  })
})

app.listen(port, () => {
  console.log(`Drawn backend listening on ${port}`)
})
