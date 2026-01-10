import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Heart, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";

interface NFTItem {
  id: string;
  name: string;
  imageUrl: string;
  likes: number;
}

const Dashboard = () => {
  const [username, setUsername] = useState("");
  
  useEffect(() => {
    const storedUsername = localStorage.getItem("drawn_username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Mock data
  const stats = {
    totalXP: 3450,
    globalRank: 12,
    winRate: 67,
  };

  const nftCollection: NFTItem[] = [
    { id: "001", name: "Rainbow Unicorn", imageUrl: "/placeholder.svg", likes: 234 },
    { id: "002", name: "Cyber Cat", imageUrl: "/placeholder.svg", likes: 189 },
    { id: "003", name: "Space Rocket", imageUrl: "/placeholder.svg", likes: 312 },
    { id: "004", name: "Crystal Gem", imageUrl: "/placeholder.svg", likes: 156 },
  ];

  return (
    <Layout username={username || "Player"}>
      <div className="container px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold mb-1">
            Welcome Back, <span className="text-gradient-neon">{username || "Player"}</span>
          </h1>
          <p className="text-muted-foreground">Ready to collect and compete?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="stat-card">
            <CardContent className="p-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total XP</p>
              <p className="text-4xl font-bold">{stats.totalXP.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Global Rank</p>
              <p className="text-4xl font-bold">{stats.globalRank}</p>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Win Rate</p>
              <p className="text-4xl font-bold">{stats.winRate}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-10">
          <Link to="/create-nft">
            <Button variant="neon" size="lg">
              <Plus className="h-5 w-5" />
              Create New Sticker
            </Button>
          </Link>
          <Button variant="neon-destructive" size="lg">
            <Trash2 className="h-5 w-5" />
            Delete Sticker
          </Button>
        </div>

        {/* NFT Collection */}
        <div>
          <h2 className="text-xl font-bold mb-6">My Collection</h2>
          
          {nftCollection.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {nftCollection.map((nft, index) => (
                <Card 
                  key={nft.id} 
                  className="nft-card group cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="aspect-square bg-secondary relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                      <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1">{nft.name}</h3>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>#{nft.id}</span>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-primary" />
                        <span>{nft.likes}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 border-border bg-transparent">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No NFTs in your collection yet</p>
                <Link to="/create-nft">
                  <Button variant="neon">Create Your First NFT</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
