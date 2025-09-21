import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Outlet } from "react-router-dom"
import horseIcon from "@/assets/horse.svg"

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <header className="h-12 flex items-center border-b border-border bg-card px-6">
            <div className="flex items-center space-x-3">
              <img 
                src={horseIcon} 
                alt="Norfolk Southern Logo" 
                className="h-8 w-8"
              />
              <h1 className="font-semibold text-card-foreground">
                Norfolk Southern - NOC Dispatch Scheduler
              </h1>
            </div>
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}