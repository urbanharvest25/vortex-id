import React, { createContext, useContext, useState, useEffect } from 'react';
import { StoreSettings, ThemeSettings, QrisSettings, Category, Product } from '../types/index.js';
import { fetchApi } from '../lib/api.js';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface StoreContextType {
  storeSettings: StoreSettings;
  themeSettings: ThemeSettings;
  qrisSettings: QrisSettings;
  categories: Category[];
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
}

const defaultStoreSettings: StoreSettings = {
  id: 'store-1',
  store_name: 'Vortex ID',
  tagline: 'Beli Aman, Main Nyaman.',
  phone: '085819822250',
  whatsapp_number: '085819822250',
  whatsapp_link_number: '6285819822250',
  whatsapp_default_message: 'Halo Vortex ID, saya ingin bertanya mengenai produk.',
  logo_url: '',
  favicon_url: '',
  terms_conditions: '',
  refund_policy: '',
  cancellation_policy: '',
  gaming_disclaimer: '',
  updated_at: '',
};

const defaultThemeSettings: ThemeSettings = {
  id: 'theme-1',
  theme_mode: 'DARK',
  primary_color: '#00f0ff',
  secondary_color: '#3b82f6',
  background_color: '#080c14',
  text_color: '#f8fafc',
  button_color: '#00f0ff',
  accent_color: '#06b6d4',
  banner_image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
  banner_title: 'MARKETPLACE AKUN GAMING TERPERCAYA',
  banner_subtitle: 'Beli Aman, Main Nyaman. Transaksi Instan, Garansi Penuh, & Verifikasi Data 100%.',
  updated_at: '',
};

const defaultQrisSettings: QrisSettings = {
  id: 'qris-1',
  is_active: true,
  image_url: '',
  account_name: 'VORTEX ID',
  updated_at: '',
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(defaultThemeSettings);
  const [qrisSettings, setQrisSettings] = useState<QrisSettings>(defaultQrisSettings);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('vortex_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveCart = (items: CartItem[]) => {
    setCart(items);
    localStorage.setItem('vortex_cart', JSON.stringify(items));
  };

  const addToCart = (product: Product, quantity = 1) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...cart];
      updated[existingIndex].quantity = Math.min(product.stock, updated[existingIndex].quantity + quantity);
    } else {
      updated = [...cart, { product, quantity: Math.min(product.stock, quantity) }];
    }
    saveCart(updated);
  };

  const removeFromCart = (productId: string) => {
    const updated = cart.filter((item) => item.product.id !== productId);
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const refreshSettings = async () => {
    try {
      const [settingsRes, themeRes, qrisRes, catRes] = await Promise.all([
        fetchApi<{ success: boolean; data: StoreSettings }>('/store-settings'),
        fetchApi<{ success: boolean; data: ThemeSettings }>('/theme-settings'),
        fetchApi<{ success: boolean; data: QrisSettings }>('/qris'),
        fetchApi<{ success: boolean; data: Category[] }>('/categories'),
      ]);

      if (settingsRes.success && settingsRes.data) {
        setStoreSettings(settingsRes.data);
      }
      if (themeRes.success && themeRes.data) {
        setThemeSettings(themeRes.data);
      }
      if (qrisRes.success && qrisRes.data) {
        setQrisSettings(qrisRes.data);
      }
      if (catRes.success && catRes.data) {
        setCategories(catRes.data);
      }
    } catch (err) {
      console.error('Failed to load store settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  // Sync document title and theme CSS variables
  useEffect(() => {
    if (storeSettings.store_name) {
      document.title = `${storeSettings.store_name} - ${storeSettings.tagline || 'Beli Aman, Main Nyaman'}`;
    }
    if (storeSettings.favicon_url) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) link.href = storeSettings.favicon_url;
    }

    // Apply primary colors to document styles
    const root = document.documentElement;
    if (themeSettings.primary_color) {
      root.style.setProperty('--color-primary', themeSettings.primary_color);
    }
    if (themeSettings.background_color) {
      root.style.setProperty('--color-bg', themeSettings.background_color);
    }
  }, [storeSettings, themeSettings]);

  return (
    <StoreContext.Provider
      value={{
        storeSettings,
        themeSettings,
        qrisSettings,
        categories,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        refreshSettings,
        isLoading,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
