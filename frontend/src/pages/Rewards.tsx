import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, Target, Package, Swords, Flame, Lock } from "lucide-react";
import Layout from "@/components/Layout";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  unlocked: boolean;
}

const Rewards = () => {
  const currentLevel = 3;
  const currentXP = 3450;
  const nextLevelXP = 4000;
  const progressPercent = ((currentXP % 1000) / 1000) * 100;
  const xpToNextLevel = nextLevelXP - currentXP;

  const achievements: Achievement[] = [
    { id: "1", name: "First Steps", description: "Mint your first sticker", icon: Target, unlocked: true },
    { id: "2", name: "Collector", description: "Own 10 stickers", icon: Package, unlocked: true },
    { id: "3", name: "Battle Master", description: "Win 50 battles", icon: Swords, unlocked: true },
    { id: "4", name: "Unstoppable", description: "Win 10 battles in a row", icon: Flame, unlocked: true },
    { id: "5", name: "Champion", description: "Reach top 10 in leaderboard", icon: Star, unlocked: false },
    { id: "6", name: "Legend", description: "Win 500 battles", icon: Star, unlocked: false },
  ];

  return (
    <Layout>
      <div className="container px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">Your Rewards</h1>
          <p className="text-muted-foreground">Level up and unlock achievements</p>
        </div>

        {/* Level Progress Card */}
        <Card className="mb-8 border-border bg-card card-glow">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-5xl font-bold">{currentLevel}</span>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary">
                <Star className="h-8 w-8 text-primary" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-primary font-medium">{currentXP.toLocaleString()} XP</span>
                <span className="text-muted-foreground">{nextLevelXP.toLocaleString()} XP</span>
              </div>
              <div className="progress-neon">
                <div 
                  className="progress-neon-fill" 
                  style={{ width: `${(currentXP / nextLevelXP) * 100}%` }} 
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {xpToNextLevel.toLocaleString()} XP until Level {currentLevel + 1}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Achievements Section */}
        <div>
          <h2 className="text-xl font-bold mb-6">Achievements</h2>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement, index) => (
              <Card 
                key={achievement.id}
                className={`border-border bg-card transition-all duration-200 ${
                  achievement.unlocked 
                    ? "achievement-card unlocked" 
                    : "opacity-60"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                    achievement.unlocked 
                      ? "bg-gradient-to-br from-primary/20 to-accent/20" 
                      : "bg-secondary"
                  }`}>
                    {achievement.unlocked ? (
                      <achievement.icon className="h-6 w-6 text-primary" />
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{achievement.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{achievement.description}</p>
                    <Badge 
                      variant={achievement.unlocked ? "success" : "muted"} 
                      className="mt-1"
                    >
                      {achievement.unlocked ? "Unlocked" : "Locked"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* XP Multipliers Section */}
        <Card className="mt-8 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              Active Bonuses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">
                  <Star className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium">Win Streak Bonus</p>
                  <p className="text-sm text-success">+25% XP</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                  <Flame className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Daily Login</p>
                  <p className="text-sm text-accent">+10% XP</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Rewards;
