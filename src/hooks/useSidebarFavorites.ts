import { useState, useEffect } from "react";

interface FavoriteItem {
  title: string;
  url: string;
  icon: string;
}

export const useSidebarFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    const stored = localStorage.getItem("sidebar-favorites");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("sidebar-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (item: FavoriteItem) => {
    setFavorites((prev) => {
      if (prev.some((fav) => fav.url === item.url)) return prev;
      return [...prev, item];
    });
  };

  const removeFavorite = (url: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.url !== url));
  };

  const isFavorite = (url: string) => {
    return favorites.some((fav) => fav.url === url);
  };

  const toggleFavorite = (item: FavoriteItem) => {
    if (isFavorite(item.url)) {
      removeFavorite(item.url);
    } else {
      addFavorite(item);
    }
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
};
