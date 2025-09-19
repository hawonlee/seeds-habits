import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen items-center pt-40 bg-neutral-100">
      <div className="flex flex-col items-start p-6 gap-8 w-2/5">
        <img src="/logo.png" alt="Seeds" className="w-8 h-8" />
        
        <div className="w-full text-left text-neutral-600 items-center justify-center space-y-2">
          <h1 className="text-sm font-medium">Seeds</h1>
          <p className="text-sm font-light">
          {/* The habit tracker that remembers when you don’t
            <br /> */}
            Grow your routine, one seed at a time 🌱
          </p>
        </div>

        <div className="flex gap-3 items-center justify-start">
            <Button variant="tertiary" size="skinny" onClick={() => navigate('/auth')}>Sign In</Button>
            <Button variant="secondary" size="skinny" className="" onClick={() => navigate('/auth')}>Create Account</Button>
          </div>
      </div>
    </div>
  );
};
