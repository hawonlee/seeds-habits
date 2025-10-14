import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// import './styles/knowledge-theme.css'
import { ThemeProvider } from './hooks/useTheme'

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="system" storageKey="seeds-habits-theme">
    <App />
  </ThemeProvider>
);
