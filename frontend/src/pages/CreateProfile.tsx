import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { ComingSoon } from "@/components/ComingSoon";
import { Home } from "lucide-react";

const CreateProfile = () => {
  return (
    <Layout>
      <div className="container px-4 py-20">
        <div className="max-w-2xl mx-auto">
          <ComingSoon 
            feature="Player Profiles" 
            description="Create your unique player profile with custom avatars, bios, and stats tracking. Build your reputation in the Drawn community!"
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

export default CreateProfile;
