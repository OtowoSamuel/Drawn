import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { ComingSoon } from "@/components/ComingSoon";
import { Home } from "lucide-react";

const CreateNFT = () => {
  return (
    <Layout>
      <div className="container px-4 py-20">
        <div className="max-w-2xl mx-auto">
          <ComingSoon 
            feature="NFT Creation" 
            description="Create unique NFTs from your game victories. Customize your collectibles with special traits and showcase them to the world. This feature is coming soon!"
          />
          <div className="mt-8 text-center">
            <Link to="/">
              <Button variant="neon">
                <Home className="h-5 w-5 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateNFT;
