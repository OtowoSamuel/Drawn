import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Heart, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import { ComingSoon } from "@/components/ComingSoon";

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
    {
      id: "001",
      name: "Rainbow Unicorn",
      imageUrl: "/placeholder.svg",
      likes: 234,
    },
    { id: "002", name: "Cyber Cat", imageUrl: "/placeholder.svg", likes: 189 },
    {
      id: "003",
      name: "Space Rocket",
      imageUrl: "/placeholder.svg",
      likes: 312,
    },
    {
      id: "004",
      name: "Crystal Gem",
      imageUrl: "/placeholder.svg",
      likes: 156,
    },
  ];

  return (
    <Layout username={username || "Player"}>
      <div className="container px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold mb-1">
            Welcome Back,{" "}
            <span className="text-gradient-neon">{username || "Player"}</span>
          </h1>
          <p className="text-muted-foreground">Ready to collect and compete?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="stat-card">
            <CardContent className="p-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Total XP
              </p>
              <p className="text-4xl font-bold">
                {stats.totalXP.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Global Rank
              </p>
              <p className="text-4xl font-bold">{stats.globalRank}</p>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Win Rate
              </p>
              <p className="text-4xl font-bold">{stats.winRate}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons - Disabled */}
        <div className="flex flex-wrap gap-4 mb-10">
          <Link to="/game">
            <Button variant="neon" size="lg">
              <Plus className="h-5 w-5" />
              Play Tic-Tac-Toe
            </Button>
          </Link>
        </div>

        {/* NFT Collection - Coming Soon */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">NFT Collection</h2>
            <p className="text-sm text-muted-foreground">
              Create and collect unique NFTs from your victories
            </p>
          </div>
          <ComingSoon 
            feature="NFT Collection" 
            description="Mint unique NFTs, build your collection, and showcase your achievements. This feature is under development."
          />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
