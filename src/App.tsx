import React from "react";
import { Toaster } from "react-hot-toast";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { Menu, LogIn } from "lucide-react";

// Pages
import Dashboard from "@/components/Dashboard";
import Home from "./pages/Home";
import UploadPage from "./pages/UploadPage";
import ResultsPage from "./pages/ResultsPage";
import DoctorsPage from "./pages/DoctorsPage";
import HistoryPage from "./pages/HistoryPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

import Footer from "@/components/Footer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster position="top-right" />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* --- PUBLIC HOME PAGE --- */}
              <Route path="/" element={
                <div className="min-h-screen flex flex-col bg-white text-slate-900">
                  <header className="p-4 flex justify-between items-center bg-white border-b border-slate-100 sticky top-0 z-50">
                    <h1 className="font-bold text-xl text-blue-700">Clarity Scan Aid</h1>
                    <div className="flex gap-4 items-center">
                      <a href="/dashboard" className="text-sm font-medium hover:underline text-slate-600">
                        Try as Guest
                      </a>
                      <SignedOut>
                        <SignInButton mode="modal">
                          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                            Sign In
                          </button>
                        </SignInButton>
                      </SignedOut>
                      <SignedIn>
                        <UserButton />
                      </SignedIn>
                    </div>
                  </header>

                  <main className="flex-grow">
                    <Home />
                  </main>

                  <Footer />
                </div>
              } />
              
              {/* --- APP ROUTES (OPEN TO ALL) --- */}
              <Route path="/*" element={
                <SidebarProvider>
                  <div className="flex min-h-screen w-full bg-gray-50 dark:bg-slate-950">
                    
                    <AppSidebar />
                    
                    <main className="flex-1 flex flex-col h-screen overflow-hidden text-slate-900 dark:text-slate-50">
                       
                       {/* Sticky Mobile Header */}
                       <header className="flex h-14 items-center gap-4 border-b bg-white dark:bg-slate-900 px-4 shadow-sm shrink-0 z-40">
                         <SidebarTrigger className="p-2 hover:bg-slate-100 rounded-md">
                            <Menu className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                         </SidebarTrigger>
                         
                         <div className="flex-1 font-semibold text-slate-700 dark:text-slate-200">
                           Dashboard
                         </div>
                         
                         {/* Conditional Header Actions */}
                         <SignedOut>
                            <SignInButton mode="modal">
                              <button className="flex items-center gap-2 text-sm bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-800">
                                <LogIn size={14} /> Sign In
                              </button>
                            </SignInButton>
                         </SignedOut>
                         <SignedIn>
                            <UserButton afterSignOutUrl="/" />
                         </SignedIn>
                       </header>
                       
                       {/* Scrollable Content */}
                       <div className="flex-1 overflow-auto p-4 md:p-6">
                          <div className="flex-grow min-h-[calc(100vh-10rem)]">
                            <Routes>
                              <Route path="upload" element={<UploadPage />} />
                              <Route path="results" element={<ResultsPage />} />
                              <Route path="doctors" element={<DoctorsPage />} />
                              <Route path="history" element={<HistoryPage />} />
                              <Route path="settings" element={<SettingsPage />} />
                              <Route path="dashboard" element={<Dashboard />} />

                              <Route path="index" element={<Navigate to="/dashboard" replace />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </div>
                          
                          <div className="mt-8">
                            <Footer />
                          </div>
                       </div>
                    </main>
                  </div>
                </SidebarProvider>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
