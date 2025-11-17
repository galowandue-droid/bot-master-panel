import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";
import { useSwipeableTabs } from "@/hooks/use-swipeable-tabs";

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

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex w-full max-w-full items-center justify-start gap-1 rounded-md bg-muted p-1 text-muted-foreground h-9 xs:h-10 overflow-x-auto no-scrollbar",
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
      "inline-flex flex-shrink-0 items-center justify-center whitespace-nowrap rounded-sm px-2 py-1 text-xs xs:px-3 xs:py-1.5 xs:text-sm font-medium ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, children, ...props }, ref) => {
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

  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      {...swipeHandlers}
      {...props}
    >
      {children}
    </TabsPrimitive.Content>
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
