import { createRoot } from "react-dom/client";
import 'leaflet/dist/leaflet.css';
import App from "./App.tsx";
import "./index.css";
import { ClerkProvider } from '@clerk/clerk-react';

// Import your key from .env
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("Missing Publishable Key for Clerk Authentication");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
  </ClerkProvider>
);