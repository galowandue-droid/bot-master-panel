import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";
import { useSwipeableTabs } from "@/hooks/use-swipeable-tabs";
import { SwipeIndicator } from "./swipe-indicator";

interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  enableSwipe?: boolean;
}

const TabsContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  enableSwipe?: boolean;
}>({});

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ enableSwipe = true, value, onValueChange, ...props }, ref) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange, enableSwipe }}>
      <TabsPrimitive.Root
        ref={ref}
        value={value}
        onValueChange={onValueChange}
        {...props}
      />
    </TabsContext.Provider>
  );
});
Tabs.displayName = "Tabs";

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  showSwipeIndicator?: boolean;
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, showSwipeIndicator = true, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex w-full max-w-full items-center justify-center gap-1 xs:gap-2 rounded-md bg-muted p-1 text-muted-foreground h-9 xs:h-10 overflow-x-auto no-scrollbar",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, value, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    value={value}
    data-value={value}
    className={cn(
      "inline-flex flex-1 flex-shrink-0 items-center justify-center whitespace-nowrap rounded-sm px-2 py-1 text-xs xs:px-3 xs:py-1.5 xs:text-sm font-medium ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  showSwipeIndicator?: boolean;
}

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, children, showSwipeIndicator = true, ...props }, ref) => {
  const context = React.useContext(TabsContext);
  const [tabValues, setTabValues] = React.useState<string[]>([]);

  // Collect all tab values from TabsTrigger children
  React.useEffect(() => {
    const root = document.querySelector('[role="tablist"]');
    if (root) {
      const triggers = root.querySelectorAll('[role="tab"]');
      const values = Array.from(triggers)
        .map((trigger) => trigger.getAttribute('data-value'))
        .filter(Boolean) as string[];
      setTabValues(values);
    }
  }, []);

  const swipeHandlers = useSwipeableTabs({
    currentValue: context.value || "",
    values: tabValues,
    onValueChange: context.onValueChange || (() => {}),
    enabled: context.enableSwipe,
  });

  const currentIndex = tabValues.indexOf(context.value || "");

  return (
    <>
      {showSwipeIndicator && <SwipeIndicator currentIndex={currentIndex} totalCount={tabValues.length} />}
      <TabsPrimitive.Content
        ref={ref}
        className={cn(
          "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 animate-fade-in",
          className,
        )}
        {...swipeHandlers}
        {...props}
      >
        {children}
      </TabsPrimitive.Content>
    </>
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
