import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen items-center pt-52 bg-neutral-100">
      <div className="flex flex-col items-center p-6 gap-6 w-2/5">


        <div className="flex w-full text-center text-neutral-600 items-center justify-center gap-2">
            <img src="/logo.png" alt="Seeds" className="w-6 h-6" />
            <h1 className="text-lg font-medium">Seeds</h1>
        </div>

       <div className="space-y-6">
          <p className="text-sm font-light"> Grow your routine, one seed at a time </p>
  
          <div className="flex gap-3 items-center justify-center">
            <Button variant="tertiary" size="skinny" onClick={() => navigate('/auth')}>Sign In</Button>
            <Button variant="secondary" size="skinny" className="" onClick={() => navigate('/auth')}>Create Account</Button>
          </div>
       </div>
      </div>
    </div>
  );
};
