import { useState } from "react";
import { 
  Upload, 
  BarChart3, 
  MapPin, 
  History, 
  Settings,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import Dashboard from "./Dashboard";

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const { t } = useLanguage();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const navigationItems = [
    { 
      title: t('upload_image'), 
      url: "/upload", 
      icon: Upload,
      description: "Analyze retinal images"
    },
    { 
      title: t('results'), 
      url: "/results", 
      icon: BarChart3,
      description: "View analysis results"
    },
    { 
      title: t('Doctors nearby'), 
      url: "/doctors", 
      icon: MapPin,
      description: "Find eye specialists"
    },
    { 
      title: t('history'), 
      url: "/history", 
      icon: History,
      description: "Previous scans"
    },
    { 
      title: t('Dashboard'), 
      url: "/dashboard", 
      icon: Settings,
      description: "Dashboard"
    },
    { 
      title: t('settings'), 
      url: "/settings", 
      icon: Settings,
      description: "App preferences"
    },
    
  ];

  const isActive = (path: string) => currentPath === path;
  const getNavClasses = (path: string) => 
    cn(
      "transition-all duration-300 hover:bg-sidebar-accent rounded-lg",
      isActive(path) && "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
    );

  return (
    <Sidebar 
      className={cn(
        "border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Eye className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-bold text-sidebar-foreground">EyeAnalyzer</h2>
              <p className="text-xs text-sidebar-foreground/70">AI Eye Disease Detection</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className={cn("px-3 py-2", collapsed && "sr-only")}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={cn("h-12", getNavClasses(item.url))}
                  >
                    <NavLink to={item.url} className="flex items-center gap-3 px-3 py-3">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-sidebar-foreground/70 truncate">
                            {item.description}
                          </div>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8 mx-auto hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
