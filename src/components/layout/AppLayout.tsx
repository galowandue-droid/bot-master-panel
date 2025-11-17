import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";
import { CommandPalette } from "@/components/CommandPalette";
import { useSwipeable } from "react-swipeable";
import { useIsMobile } from "@/hooks/use-mobile";

function AppLayoutContent() {
  const { open, setOpen } = useSidebar();
  const isMobile = useIsMobile();

  const swipeHandlers = useSwipeable({
    onSwipedRight: () => {
      if (isMobile && !open) {
        setOpen(true);
      }
    },
    onSwipedLeft: () => {
      if (isMobile && open) {
        setOpen(false);
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
  });

  return (
    <div className="flex min-h-screen w-full bg-background" {...swipeHandlers}>
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export function AppLayout() {
  return (
    <SidebarProvider defaultOpen={false}>
      <CommandPalette />
      <AppLayoutContent />
    </SidebarProvider>
  );
}
