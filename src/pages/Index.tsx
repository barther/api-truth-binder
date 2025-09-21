import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { DeskBoard } from "@/components/DeskBoard"

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <header className="h-12 flex items-center border-b border-border bg-card">
            <SidebarTrigger className="ml-4" />
            <h1 className="ml-4 font-semibold text-card-foreground">
              Norfolk Southern - NOC Dispatch Scheduler
            </h1>
          </header>
          <div className="p-6">
            <DeskBoard />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;