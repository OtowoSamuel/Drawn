import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, User, TrendingUp } from "lucide-react";
import Layout from "@/components/Layout";

interface Player {
  rank: number;
  username: string;
  xp: number;
  wins: number;
  losses: number;
  winRate: number;
  isCurrentUser?: boolean;
}

const Leaderboard = () => {
  const currentUsername = localStorage.getItem("drawn_username") || "Player";

  const players: Player[] = [
    { rank: 1, username: "CryptoKing", xp: 12450, wins: 156, losses: 23, winRate: 87 },
    { rank: 2, username: "NFTMaster", xp: 11200, wins: 142, losses: 31, winRate: 82 },
    { rank: 3, username: "DiamondHands", xp: 10800, wins: 138, losses: 35, winRate: 80 },
    { rank: 4, username: "TopRanker", xp: 9500, wins: 124, losses: 42, winRate: 75 },
    { rank: 5, username: "BattleAce", xp: 8900, wins: 118, losses: 48, winRate: 71 },
    { rank: 6, username: "ProGamer", xp: 8200, wins: 112, losses: 54, winRate: 67 },
    { rank: 7, username: "StarPlayer", xp: 7600, wins: 105, losses: 58, winRate: 64 },
    { rank: 8, username: "ChampionX", xp: 7100, wins: 98, losses: 62, winRate: 61 },
    { rank: 9, username: "VictorySeeker", xp: 6500, wins: 92, losses: 68, winRate: 58 },
    { rank: 10, username: "RisingStar", xp: 6000, wins: 86, losses: 72, winRate: 54 },
    { rank: 11, username: currentUsername, xp: 3450, wins: 45, losses: 22, winRate: 67, isCurrentUser: true },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-300" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-mono">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "default";
    if (rank <= 3) return "purple";
    if (rank <= 10) return "neon";
    return "secondary";
  };

  // Top 3 players for featured cards
  const topPlayers = players.slice(0, 3);

  return (
    <Layout>
      <div className="container px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">Top players ranked by XP</p>
        </div>

        {/* Top 3 Featured Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {topPlayers.map((player, index) => (
            <Card 
              key={player.rank} 
              className={`border-border bg-card card-glow ${
                index === 0 ? "md:order-2" : index === 1 ? "md:order-1" : "md:order-3"
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getRankIcon(player.rank)}
                    <span className={player.rank === 1 ? "text-gradient-neon" : ""}>
                      {player.username}
                    </span>
                  </CardTitle>
                  <Badge variant={getRankBadge(player.rank) as any}>
                    Rank {player.rank}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total XP</p>
                    <p className="text-xl font-bold text-primary">{player.xp.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Win Rate</p>
                    <p className="text-xl font-bold text-success">{player.winRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Leaderboard Table */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Global Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead className="text-right">XP</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Wins</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Losses</TableHead>
                  <TableHead className="text-right">Win Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow 
                    key={player.rank}
                    className={`border-border transition-colors ${
                      player.isCurrentUser 
                        ? "bg-primary/10 hover:bg-primary/15 border-l-2 border-l-primary" 
                        : "hover:bg-secondary/50"
                    }`}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center justify-center w-8">
                        {getRankIcon(player.rank)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className={player.isCurrentUser ? "text-primary font-semibold" : ""}>
                          {player.username}
                          {player.isCurrentUser && (
                            <Badge variant="neon" className="ml-2 text-xs">You</Badge>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {player.xp.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell text-success">
                      {player.wins}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell text-destructive">
                      {player.losses}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className={`h-4 w-4 ${player.winRate >= 50 ? "text-success" : "text-destructive"}`} />
                        <span className={player.winRate >= 50 ? "text-success" : "text-destructive"}>
                          {player.winRate}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Leaderboard;
