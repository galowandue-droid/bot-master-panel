import { useState, useMemo } from "react";

interface SearchResult {
  title: string;
  url: string;
  icon: string;
  path?: string; // Breadcrumb path like "Финансы → Платежи"
}

export const useSidebarSearch = (menuItems: any[]) => {
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const results: SearchResult[] = [];
    const query = searchQuery.toLowerCase();

    const searchInItems = (items: any[], parentTitle?: string) => {
      items.forEach((item) => {
        const matches = item.title.toLowerCase().includes(query);
        
        if (matches && item.url) {
          results.push({
            title: item.title,
            url: item.url,
            icon: item.icon.name || "FileText",
            path: parentTitle ? `${parentTitle} → ${item.title}` : item.title,
          });
        }

        if (item.items) {
          searchInItems(item.items, item.title);
        }
      });
    };

    searchInItems(menuItems);
    return results;
  }, [searchQuery, menuItems]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    hasResults: searchResults.length > 0,
  };
};
