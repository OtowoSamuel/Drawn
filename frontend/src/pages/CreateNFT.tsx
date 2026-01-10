import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, RefreshCw, Check, Lock, Wand2 } from "lucide-react";
import Layout from "@/components/Layout";

const CreateNFT = () => {
  const navigate = useNavigate();
  const [selectedTheme, setSelectedTheme] = useState("creature");
  const [nftName, setNftName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNFT, setGeneratedNFT] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const activeNFTCount = 1;
  const maxActiveNFTs = 1;
  const isLimitReached = activeNFTCount >= maxActiveNFTs;

  const themes = [
    { id: "creature", label: "Creature", description: "Mythical beings and creatures" },
    { id: "object", label: "Object", description: "Unique items and artifacts" },
    { id: "abstract", label: "Abstract", description: "Abstract patterns and shapes" },
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate generation
    setTimeout(() => {
      setGeneratedNFT("generated");
      setIsGenerating(false);
    }, 2000);
  };

  const handleConfirm = () => {
    setShowConfirmDialog(false);
    navigate("/dashboard");
  };

  return (
    <Layout>
      <div className="container px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center animate-fade-in">
            <h1 className="text-3xl font-bold mb-2">Create Your NFT</h1>
            <p className="text-muted-foreground">Generate a unique digital collectible</p>
          </div>

          {/* NFT Limit Badge */}
          <div className="flex justify-center mb-6">
            <Badge variant={isLimitReached ? "destructive" : "neon"} className="px-4 py-1.5">
              {isLimitReached ? (
                <>
                  <Lock className="h-3 w-3 mr-1.5" />
                  Active NFT Limit Reached ({activeNFTCount}/{maxActiveNFTs})
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  {activeNFTCount}/{maxActiveNFTs} Active NFT Slots
                </>
              )}
            </Badge>
          </div>

          {/* Theme Selection */}
          <Card className="mb-6 border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Select Theme</CardTitle>
              <CardDescription>Choose a style for your NFT</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedTheme} onValueChange={setSelectedTheme}>
                <TabsList className="grid w-full grid-cols-3 bg-secondary">
                  {themes.map((theme) => (
                    <TabsTrigger 
                      key={theme.id} 
                      value={theme.id}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {theme.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {themes.map((theme) => (
                  <TabsContent key={theme.id} value={theme.id} className="mt-4">
                    <p className="text-sm text-muted-foreground text-center py-2">
                      {theme.description}
                    </p>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* NFT Preview Card */}
          <Card className="mb-6 border-border bg-card overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">NFT Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square rounded-lg bg-secondary flex items-center justify-center relative overflow-hidden">
                {generatedNFT ? (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/30 to-neon-blue/30 flex items-center justify-center">
                    <div className="text-center">
                      <Sparkles className="h-16 w-16 text-foreground mx-auto mb-4 animate-float" />
                      <p className="text-sm text-muted-foreground">Generated NFT</p>
                    </div>
                  </div>
                ) : isGenerating ? (
                  <div className="flex flex-col items-center">
                    <RefreshCw className="h-12 w-12 text-primary animate-spin mb-4" />
                    <p className="text-sm text-muted-foreground">Generating...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <Wand2 className="h-12 w-12 mb-4" />
                    <p className="text-sm">Click Generate to create your NFT</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Name Input */}
          <Card className="mb-6 border-border bg-card">
            <CardContent className="pt-6">
              <label className="text-sm font-medium text-muted-foreground block mb-2">
                NFT Name
              </label>
              <Input
                placeholder="Enter a name for your NFT"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                disabled={!generatedNFT}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="neon-outline"
              size="lg"
              className="flex-1"
              onClick={handleGenerate}
              disabled={isGenerating || isLimitReached}
            >
              <RefreshCw className={`h-5 w-5 ${isGenerating ? "animate-spin" : ""}`} />
              {isGenerating ? "Generating..." : "Generate NFT"}
            </Button>
            <Button
              variant="neon"
              size="lg"
              className="flex-1"
              onClick={() => setShowConfirmDialog(true)}
              disabled={!generatedNFT || !nftName.trim()}
            >
              <Check className="h-5 w-5" />
              Confirm NFT
            </Button>
          </div>

          {/* Unlock Hint */}
          {isLimitReached && (
            <Card className="mt-6 border-dashed border-2 border-primary/30 bg-transparent">
              <CardContent className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 mr-2 text-primary" />
                Unlock additional NFT slots with coins
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Confirm Your NFT</DialogTitle>
            <DialogDescription>
              You are about to create "{nftName}" as your active NFT. This action will register it in your collection.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="aspect-video rounded-lg bg-secondary flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="h-10 w-10 text-primary mx-auto mb-2" />
                <p className="font-semibold">{nftName}</p>
                <Badge variant="muted" className="mt-2">
                  {selectedTheme.charAt(0).toUpperCase() + selectedTheme.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="neon" onClick={handleConfirm}>
              <Check className="h-4 w-4" />
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CreateNFT;
