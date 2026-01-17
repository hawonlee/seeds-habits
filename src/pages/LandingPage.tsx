import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MoveRight } from "lucide-react";

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen items-center gap-48 bg-background">

      <div className="flex w-1/3 mt-6 mx-auto items-center justify-between p-2 pl-4 bg-neutral-200/50 backdrop-blur-md rounded-lg">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Seeds" className="w-6 h-6" />
          <h1 className="text-sm">seeds</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="skinny" className="border-none text-xxs" onClick={() => navigate('/auth')}>Log In</Button>
          <Button variant="tertiary" size="skinny" className="text-xxs" onClick={() => navigate('/auth')}>Get Started</Button>
        </div>
      </div>


      {/* <div className="flex w-full text-center text-foreground items-center justify-center gap-2">
          <img src="/logo.png" alt="Seeds" className="w-6 h-6" />
          <h1 className="text-lg">Seeds</h1>
        </div> */}


      <div className="relative space-y-6">
        <div className="w-full z-10 h-32 blur-xl hover:blur-lg backdrop-blur-md transition-all duration-300 rounded-md overflow-hidden relative">
          <div
            className="absolute inset-0 w-full h-full animate-gradient-scroll"
            style={{
              background:
                "linear-gradient(90deg, #7F704F, #D8D8E0, #718F45, #CFCA86, #E7C4BE, #7F704F)",
              backgroundSize: "300% 100%",
            }}
          />
          <style>
            {`
        @keyframes gradientScroll {
          0% { background-position: 0% 50%; }
          100% { background-position: -300% 50%; }
        }
        .animate-gradient-scroll {
          animation: gradientScroll 20s linear infinite;
        }
      `}
          </style>
        </div>


        <p className="text-sm text-muted-foreground pt-4"> Grow your routine, one seed at a time </p>
        <div className="flex gap-3 items-center justify-center">
          <Button variant="tertiary" size="skinny" className="" onClick={() => navigate('/auth')}>Get Started <MoveRight strokeWidth={1.8} className="w-4 h-4" /></Button>
        </div>
      </div>


    </div >
  );
};
