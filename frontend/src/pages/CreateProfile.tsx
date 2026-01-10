import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { User, Users, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";

const CreateProfile = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [playerType, setPlayerType] = useState<"player1" | "player2" | null>(
    null
  );

  const handleContinue = () => {
    if (username && playerType) {
      // In a real app, save to state/backend
      localStorage.setItem("drawn_username", username);
      localStorage.setItem("drawn_playerType", playerType);
      navigate("/dashboard");
    }
  };

  const isFormValid = username.trim().length >= 3 && playerType !== null;

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="border-border bg-card card-glow">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
                <User className="h-8 w-8 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold">
                Create Your Profile
              </CardTitle>
              <CardDescription>
                Enter the arena with your unique identity
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
              {/* Username Input */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Username
                </label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-secondary"
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 3 characters
                </p>
              </div>

              {/* Player Type Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">
                  Select Your Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPlayerType("player1")}
                    className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                      playerType === "player1"
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                        : "border-border bg-secondary hover:border-primary/50"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`p-2 rounded-lg ${
                          playerType === "player1" ? "bg-primary" : "bg-muted"
                        }`}
                      >
                        <User
                          className={`h-5 w-5 ${
                            playerType === "player1"
                              ? "text-primary-foreground"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <span
                        className={`font-medium ${
                          playerType === "player1"
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        Player 1
                      </span>
                      <Badge
                        variant={playerType === "player1" ? "neon" : "muted"}
                        className="text-xs"
                      >
                        X Moves First
                      </Badge>
                    </div>
                    {playerType === "player1" && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
                    )}
                  </button>

                  <button
                    onClick={() => setPlayerType("player2")}
                    className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                      playerType === "player2"
                        ? "border-accent bg-accent/10 shadow-lg shadow-accent/20"
                        : "border-border bg-secondary hover:border-accent/50"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`p-2 rounded-lg ${
                          playerType === "player2" ? "bg-accent" : "bg-muted"
                        }`}
                      >
                        <Users
                          className={`h-5 w-5 ${
                            playerType === "player2"
                              ? "text-accent-foreground"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <span
                        className={`font-medium ${
                          playerType === "player2"
                            ? "text-accent"
                            : "text-foreground"
                        }`}
                      >
                        Player 2
                      </span>
                      <Badge
                        variant={playerType === "player2" ? "purple" : "muted"}
                        className="text-xs"
                      >
                        O Counter
                      </Badge>
                    </div>
                    {playerType === "player2" && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent animate-pulse" />
                    )}
                  </button>
                </div>
              </div>

              {/* Continue Button */}
              <Button
                variant="neon"
                size="xl"
                className="w-full"
                disabled={!isFormValid}
                onClick={handleContinue}
              >
                Continue to Arena
                <ArrowRight className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CreateProfile;
