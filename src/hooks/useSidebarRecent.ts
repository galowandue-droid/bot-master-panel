import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

interface RecentItem {
  title: string;
  url: string;
  icon: string;
  timestamp: number;
}

const MAX_RECENT = 5;

export const useSidebarRecent = (menuItems: any[]) => {
  const location = useLocation();
  const [recent, setRecent] = useState<RecentItem[]>(() => {
    const stored = localStorage.getItem("sidebar-recent");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("sidebar-recent", JSON.stringify(recent));
  }, [recent]);

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Find current page in menuItems
    const findMenuItem = (items: any[]): any => {
      for (const item of items) {
        if (item.url === currentPath) return item;
        if (item.items) {
          const found = findMenuItem(item.items);
          if (found) return found;
        }
      }
      return null;
    };

    const currentItem = findMenuItem(menuItems);
    if (!currentItem || !currentItem.url) return;

    setRecent((prev) => {
      const filtered = prev.filter((item) => item.url !== currentPath);
      const newItem: RecentItem = {
        title: currentItem.title,
        url: currentItem.url,
        icon: currentItem.icon.name || "FileText",
        timestamp: Date.now(),
      };
      return [newItem, ...filtered].slice(0, MAX_RECENT);
    });
  }, [location.pathname, menuItems]);

  return { recent };
};
