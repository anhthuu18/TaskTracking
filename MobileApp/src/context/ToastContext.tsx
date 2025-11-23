import React, { createContext, useContext } from 'react';
import Toast from '../components/Toast';
import { useToast, ToastState } from '../hooks/useToast';

interface ToastContextType {
  toast: ToastState;
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast, showToast, showSuccess, showError, showInfo, showWarning, hideToast } = useToast();

  return (
    <ToastContext.Provider value={{ toast, showToast, showSuccess, showError, showInfo, showWarning, hideToast }}>
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};
