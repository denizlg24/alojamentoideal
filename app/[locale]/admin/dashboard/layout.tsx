import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <main className="w-full relative">
        <SidebarTrigger className="absolute top-1/2 -translate-y-1/2 md:-left-4 left-0 z-95 bg-background border shadow" />
        {children}
      </main>
    </SidebarProvider>
  );
}
