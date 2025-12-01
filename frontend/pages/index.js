import { useEffect, useState } from 'react'

export default function Home() {
  const [contractInfo, setContractInfo] = useState(null)
  const [totalMinted, setTotalMinted] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get contract info from env
    const graphqlEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT
    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
    const appId = process.env.NEXT_PUBLIC_APP_ID

    setContractInfo({ graphqlEndpoint, chainId, appId })

    // Fetch contract state
    if (graphqlEndpoint) {
      fetch(graphqlEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: '{ totalMinted nextTokenId }'
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.data) {
            setTotalMinted(data.data.totalMinted)
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="max-w-2xl w-full mx-4 p-8 bg-white shadow-2xl rounded-2xl">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🎨 Drawn
        </h1>
        <p className="text-center text-gray-600 mb-8">NFT Sticker Collection Game</p>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading contract...</p>
          </div>
        ) : contractInfo?.graphqlEndpoint ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h2 className="font-semibold text-green-800 mb-2">✅ Contract Connected</h2>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Chain ID:</strong> <code className="text-xs bg-green-100 px-2 py-1 rounded">{contractInfo.chainId?.slice(0, 16)}...</code></p>
                <p><strong>App ID:</strong> <code className="text-xs bg-green-100 px-2 py-1 rounded">{contractInfo.appId?.slice(0, 16)}...</code></p>
              </div>
            </div>

            {totalMinted !== null && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h2 className="font-semibold text-purple-800 mb-2">📊 Contract Stats</h2>
                <p className="text-3xl font-bold text-purple-600">{totalMinted}</p>
                <p className="text-sm text-purple-700">Total Stickers Minted</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-semibold text-blue-800 mb-2">🔗 GraphiQL Interface</h2>
              <a 
                href={contractInfo.graphqlEndpoint}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm break-all underline"
              >
                {contractInfo.graphqlEndpoint}
              </a>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h2 className="font-semibold text-gray-800 mb-3">🎮 Try These Queries</h2>
              <div className="space-y-2 text-sm">
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-600 mb-1">Mint a sticker:</p>
                  <code className="text-xs text-purple-600 block">
                    mutation &#123; mintSticker(owner: "alice", metadataUri: "ipfs://QmTest", stickerType: "rare") &#125;
                  </code>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="text-gray-600 mb-1">Check stats:</p>
                  <code className="text-xs text-purple-600 block">
                    query &#123; totalMinted nextTokenId &#125;
                  </code>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="font-semibold text-yellow-800 mb-2">⚠️ Contract Not Connected</h2>
            <p className="text-sm text-yellow-700">
              Make sure the Docker container is running and the contract is deployed.
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t text-center text-sm text-gray-600">
          <p>Built with Next.js + Tailwind + Linera</p>
          <p className="mt-2">See <code className="bg-gray-100 px-2 py-1 rounded">contracts/EXAMPLES.md</code> for more queries</p>
        </div>
      </div>
    </main>
  )
}
