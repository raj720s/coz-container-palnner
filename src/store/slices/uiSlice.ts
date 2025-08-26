import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ar';

export interface UIState {
  // Theme  
  theme: Theme;
  isDarkMode: boolean;
  
  // Layout
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  
  // Language & Localization
  language: Language;
  
  // Loading states
  globalLoading: boolean;
  loadingMessage: string | null;
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
  }>;
  
  // Modals
  modals: {
    [key: string]: {
      isOpen: boolean;
      data?: any;
    };
  };
  
  // Page preferences
  pageSize: number;
  defaultPageSize: number;
  
  // Search
  globalSearch: string;
  
  // Breadcrumbs
  breadcrumbs: Array<{
    label: string;
    href?: string;
  }>;
}

const initialState: UIState = {
  theme: 'system',
  isDarkMode: false,
  sidebarCollapsed: false,
  sidebarOpen: false,
  language: 'en',
  globalLoading: false,
  loadingMessage: null,
  notifications: [],
  modals: {},
  pageSize: 20,
  defaultPageSize: 20,
  globalSearch: '',
  breadcrumbs: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme actions
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
    
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
    },
    
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
    
    // Sidebar actions
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    
    // Language actions
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
    },
    
    // Loading actions
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
      if (!action.payload) {
        state.loadingMessage = null;
      }
    },
    
    setLoadingMessage: (state, action: PayloadAction<string | null>) => {
      state.loadingMessage = action.payload;
    },
    
    // Notification actions
    addNotification: (state, action: PayloadAction<Omit<UIState['notifications'][0], 'id' | 'timestamp' | 'read'>>) => {
      const notification = {
        ...action.payload,
        id: `notification-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        read: false,
      };
      state.notifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(n => n.read = true);
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Modal actions
    openModal: (state, action: PayloadAction<{ modalId: string; data?: any }>) => {
      state.modals[action.payload.modalId] = {
        isOpen: true,
        data: action.payload.data,
      };
    },
    
    closeModal: (state, action: PayloadAction<string>) => {
      if (state.modals[action.payload]) {
        state.modals[action.payload].isOpen = false;
        state.modals[action.payload].data = undefined;
      }
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modalId => {
        state.modals[modalId].isOpen = false;
        state.modals[modalId].data = undefined;
      });
    },
    
    // Page preferences
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
    },
    
    setDefaultPageSize: (state, action: PayloadAction<number>) => {
      state.defaultPageSize = action.payload;
      state.pageSize = action.payload;
    },
    
    // Search actions
    setGlobalSearch: (state, action: PayloadAction<string>) => {
      state.globalSearch = action.payload;
    },
    
    clearGlobalSearch: (state) => {
      state.globalSearch = '';
    },
    
    // Breadcrumb actions
    setBreadcrumbs: (state, action: PayloadAction<UIState['breadcrumbs']>) => {
      state.breadcrumbs = action.payload;
    },
    
    addBreadcrumb: (state, action: PayloadAction<{ label: string; href?: string }>) => {
      state.breadcrumbs.push(action.payload);
    },
    
    clearBreadcrumbs: (state) => {
      state.breadcrumbs = [];
    },
  },
});

export const {
  setTheme,
  setDarkMode,
  toggleDarkMode,
  setSidebarCollapsed,
  toggleSidebar,
  setSidebarOpen,
  setLanguage,
  setGlobalLoading,
  setLoadingMessage,
  addNotification,
  removeNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  openModal,
  closeModal,
  closeAllModals,
  setPageSize,
  setDefaultPageSize,
  setGlobalSearch,
  clearGlobalSearch,
  setBreadcrumbs,
  addBreadcrumb,
  clearBreadcrumbs,
} = uiSlice.actions;

// Selectors
export const selectUI = (state: { ui: UIState }) => state.ui;
export const selectTheme = (state: { ui: UIState }) => state.ui.theme;
export const selectIsDarkMode = (state: { ui: UIState }) => state.ui.isDarkMode;
export const selectSidebarCollapsed = (state: { ui: UIState }) => state.ui.sidebarCollapsed;
export const selectSidebarOpen = (state: { ui: UIState }) => state.ui.sidebarOpen;
export const selectLanguage = (state: { ui: UIState }) => state.ui.language;
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.globalLoading;
export const selectLoadingMessage = (state: { ui: UIState }) => state.ui.loadingMessage;
export const selectNotifications = (state: { ui: UIState }) => state.ui.notifications;
export const selectUnreadNotifications = (state: { ui: UIState }) => 
  state.ui.notifications.filter(n => !n.read);
export const selectModal = (modalId: string) => (state: { ui: UIState }) => 
  state.ui.modals[modalId] || { isOpen: false, data: undefined };
export const selectPageSize = (state: { ui: UIState }) => state.ui.pageSize;
export const selectGlobalSearch = (state: { ui: UIState }) => state.ui.globalSearch;
export const selectBreadcrumbs = (state: { ui: UIState }) => state.ui.breadcrumbs;

export default uiSlice.reducer;
