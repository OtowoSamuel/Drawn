import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Users, Swords, Trophy, Coins, LogIn } from "lucide-react";
import Layout from "@/components/Layout";

interface Room {
  id: string;
  name: string;
  host: string;
  stake: number;
  status: "waiting" | "in-progress" | "full";
}

const Lobby = () => {
  const [activeTab, setActiveTab] = useState("lobby");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [stake, setStake] = useState("10");

  const rooms: Room[] = [
    { id: "1", name: "Beginner Arena", host: "CryptoKing", stake: 10, status: "waiting" },
    { id: "2", name: "Pro League", host: "NFTMaster", stake: 50, status: "waiting" },
    { id: "3", name: "High Stakes", host: "DiamondHands", stake: 100, status: "in-progress" },
    { id: "4", name: "Friendly Match", host: "NewPlayer42", stake: 5, status: "waiting" },
    { id: "5", name: "Champion Room", host: "TopRanker", stake: 200, status: "full" },
  ];

  const getStatusBadge = (status: Room["status"]) => {
    switch (status) {
      case "waiting":
        return <Badge variant="success">Open</Badge>;
      case "in-progress":
        return <Badge variant="purple">In Progress</Badge>;
      case "full":
        return <Badge variant="muted">Full</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Battle Lobby</h1>
          <p className="text-muted-foreground">Find or create a match</p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-secondary p-1 rounded-lg">
            <TabsTrigger value="create-nft" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Create NFT
            </TabsTrigger>
            <TabsTrigger value="lobby" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Lobby
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="rewards" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Rewards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lobby" className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-wrap gap-4">
              <Button variant="neon" size="lg" onClick={() => setShowCreateRoom(true)}>
                <Plus className="h-5 w-5" />
                Create Room
              </Button>
              <Button variant="neon-outline" size="lg">
                <Swords className="h-5 w-5" />
                Quick Match
              </Button>
            </div>

            {/* Room List */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Available Rooms
              </h2>
              
              <div className="grid gap-3">
                {rooms.map((room, index) => (
                  <Card 
                    key={room.id} 
                    className="border-border bg-card hover:border-primary/30 transition-all duration-200"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                          <Swords className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{room.name}</h3>
                          <p className="text-sm text-muted-foreground">Host: {room.host}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Badge variant="neon" className="flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          {room.stake}
                        </Badge>
                        {getStatusBadge(room.status)}
                        <Button 
                          variant={room.status === "waiting" ? "neon" : "ghost"}
                          size="sm"
                          disabled={room.status !== "waiting"}
                        >
                          <LogIn className="h-4 w-4" />
                          Join
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="create-nft">
            <Card className="border-border bg-card text-center py-12">
              <CardContent>
                <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Create Your NFT First</h3>
                <p className="text-muted-foreground mb-4">You need an active NFT to enter battles</p>
                <Button variant="neon" asChild>
                  <a href="/create-nft">Go to NFT Creator</a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card className="border-border bg-card text-center py-12">
              <CardContent>
                <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">View Full Leaderboard</h3>
                <p className="text-muted-foreground mb-4">See the top players and rankings</p>
                <Button variant="neon" asChild>
                  <a href="/leaderboard">Open Leaderboard</a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards">
            <Card className="border-border bg-card text-center py-12">
              <CardContent>
                <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Check Your Rewards</h3>
                <p className="text-muted-foreground mb-4">View achievements and claim rewards</p>
                <Button variant="neon" asChild>
                  <a href="/rewards">Open Rewards</a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Room Dialog */}
      <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create a Room</DialogTitle>
            <DialogDescription>
              Set up your battle room and wait for an opponent
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Room Name</label>
              <Input
                placeholder="Enter room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Stake Amount</label>
              <div className="flex gap-2">
                {["5", "10", "25", "50", "100"].map((amount) => (
                  <Button
                    key={amount}
                    variant={stake === amount ? "neon" : "secondary"}
                    size="sm"
                    onClick={() => setStake(amount)}
                  >
                    <Coins className="h-3 w-3 mr-1" />
                    {amount}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowCreateRoom(false)}>
              Cancel
            </Button>
            <Button variant="neon" disabled={!roomName.trim()}>
              <Plus className="h-4 w-4" />
              Create Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Lobby;
