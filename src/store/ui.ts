import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'vault' | 'blue' | 'purple' | 'green' | 'amber' | 'rose';
export type SidebarState = 'expanded' | 'icons';

interface UIState {
  theme: ThemeMode;
  accent: AccentColor;
  sidebar: SidebarState;
  sidebarOpen: boolean;
  widgetOrder: string[];
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: AccentColor) => void;
  setSidebar: (state: SidebarState) => void;
  setSidebarOpen: (open: boolean) => void;
  setWidgetOrder: (order: string[]) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      accent: 'vault',
      sidebar: 'expanded',
      sidebarOpen: false,
      widgetOrder: [],
      setTheme: (theme) => set({ theme }),
      setAccent: (accent) => set({ accent }),
      setSidebar: (state) => set({ sidebar: state }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setWidgetOrder: (order) => set({ widgetOrder: order }),
    }),
    { name: 'rinox-ui-prefs' }
  )
);
