import { createContext, useContext, useState } from 'react';

export type HistoryItem = {
  id: string;
  date: string;
  items: string[];
  total: number;
};

type ShoppingContextType = {
  history: HistoryItem[];
  addToHistory: (items: string[]) => void;
};

const ShoppingContext = createContext<ShoppingContextType | undefined>(undefined);

export function ShoppingProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const addToHistory = (items: string[]) => {
    const newHistoryItem: HistoryItem = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      items,
      total: Math.floor(Math.random() * 100) + 1, // Mock total for demo
    };

    setHistory(prevHistory => [newHistoryItem, ...prevHistory]);
  };

  return (
    <ShoppingContext.Provider value={{ history, addToHistory }}>
      {children}
    </ShoppingContext.Provider>
  );
}

export function useShoppingContext() {
  const context = useContext(ShoppingContext);
  if (context === undefined) {
    throw new Error('useShoppingContext must be used within a ShoppingProvider');
  }
  return context;
}