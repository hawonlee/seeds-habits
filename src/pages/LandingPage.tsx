import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex justify-center p-6 pt-60">
      <div className="w-full max-w-md text-center items-center justify-center">
        <h1 className="text-2xl font-bold mb-2">Seeds</h1>
        <p className="text-sm text-muted-foreground mb-6">Build habits</p>
        <div className="flex gap-3 items-center justify-center">
          <Button className="w-32" onClick={() => navigate('/auth')}>Sign In</Button>
          <Button variant="outline" className="w-32 rounded-md" onClick={() => navigate('/auth')}>Create Account</Button>
        </div>
      </div>
    </div>
  );
};
