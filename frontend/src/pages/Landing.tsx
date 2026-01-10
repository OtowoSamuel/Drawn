import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Swords, Trophy, TrendingUp, ArrowRight, Gamepad2 } from "lucide-react";
import Layout from "@/components/Layout";

const Landing = () => {
  const steps = [
    {
      icon: Sparkles,
      title: "Create Your NFT",
      description: "Generate a unique digital collectible to represent you in battle.",
    },
    {
      icon: Swords,
      title: "Battle Opponents",
      description: "Challenge rivals in strategic Tic-Tac-Toe matches with stakes.",
    },
    {
      icon: Trophy,
      title: "Win or Lose",
      description: "Victory evolves your NFT. Defeat means learning and growth.",
    },
    {
      icon: TrendingUp,
      title: "Rank Up",
      description: "Climb the leaderboard and earn exclusive rewards.",
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        
        <div className="container relative z-10 px-4 py-20 text-center">
          <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
            {/* Headline */}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="text-gradient-neon">Create. Battle.</span>
              <br />
              <span className="text-foreground">Evolve Your NFTs.</span>
            </h1>
            
            {/* Subheadline */}
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Join a global community of creators. Mint unique collectibles, 
              challenge rivals in strategic battles, and climb the ranks.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/create-profile">
                <Button variant="neon" size="xl" className="group">
                  Get Started
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/lobby">
                <Button variant="neon-outline" size="xl">
                  <Gamepad2 className="h-5 w-5" />
                  Open Lobby
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How to Play Section */}
      <section className="py-20 bg-gradient-to-b from-transparent via-secondary/30 to-transparent">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How to Play</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Jump into the arena in four simple steps
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <Card 
                key={step.title} 
                className="border-border bg-card card-glow group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary group-hover:bg-primary/20 transition-colors">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg text-primary">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground">
                    {step.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Preview */}
      <section className="py-20">
        <div className="container px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center p-8 rounded-2xl bg-card border border-border">
              <div className="text-4xl font-bold text-gradient-neon mb-2">10K+</div>
              <div className="text-muted-foreground">Active Players</div>
            </div>
            <div className="text-center p-8 rounded-2xl bg-card border border-border">
              <div className="text-4xl font-bold text-gradient-neon mb-2">50K+</div>
              <div className="text-muted-foreground">NFTs Created</div>
            </div>
            <div className="text-center p-8 rounded-2xl bg-card border border-border">
              <div className="text-4xl font-bold text-gradient-neon mb-2">100K+</div>
              <div className="text-muted-foreground">Battles Fought</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>Drawn - Built for the competitive spirit</p>
        </div>
      </footer>
    </Layout>
  );
};

export default Landing;
