import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { HabitCompletionsProvider } from "@/components/HabitCompletionsProvider";
import { TasksAnnouncementPopup } from "@/components/TasksAnnouncementPopup";
import { useTasksAnnouncement } from "@/hooks/useTasksAnnouncement";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DiaryEditPage from "./pages/DiaryEdit";
import TasksPage from "./pages/Tasks";
import KnowledgeGraph from "./pages/KnowledgeGraph";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { showAnnouncement, loading, markAnnouncementAsSeen } = useTasksAnnouncement();

  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/list" element={<Index />} />
        <Route path="/calendar" element={<Index />} />
        <Route path="/diary" element={<Index />} />
        <Route path="/tasks" element={<Index />} />
        <Route path="/knowledge" element={<KnowledgeGraph />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/diary/edit/:id" element={<DiaryEditPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Show tasks announcement popup if needed */}
      {!loading && showAnnouncement && (
        <TasksAnnouncementPopup onClose={markAnnouncementAsSeen} />
      )}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <HabitCompletionsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </HabitCompletionsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
