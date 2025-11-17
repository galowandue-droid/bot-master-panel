import { useSwipeable } from "react-swipeable";
import { useIsMobile } from "./use-mobile";

interface UseSwipeableTabsProps {
  currentValue: string;
  values: string[];
  onValueChange: (value: string) => void;
  enabled?: boolean;
}

export function useSwipeableTabs({
  currentValue,
  values,
  onValueChange,
  enabled = true,
}: UseSwipeableTabsProps) {
  const isMobile = useIsMobile();

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (!enabled || !isMobile) return;
      const currentIndex = values.indexOf(currentValue);
      const nextIndex = currentIndex + 1;
      if (nextIndex < values.length) {
        onValueChange(values[nextIndex]);
      }
    },
    onSwipedRight: () => {
      if (!enabled || !isMobile) return;
      const currentIndex = values.indexOf(currentValue);
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        onValueChange(values[prevIndex]);
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    preventScrollOnSwipe: false,
  });

  return isMobile && enabled ? handlers : {};
}
