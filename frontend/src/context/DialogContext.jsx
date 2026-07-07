import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle2, HelpCircle, X } from 'lucide-react';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { title, message, type, isConfirm, isPrompt, isAlert, defaultValue, placeholder, confirmLabel, cancelLabel, resolve }
  const [promptValue, setPromptValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (dialog?.isPrompt) {
      setPromptValue(dialog.defaultValue || '');
      // Focus the input field after render
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [dialog]);

  const showAlert = (title, message, options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        title,
        message,
        type: options.type || 'info',
        isAlert: true,
        resolve,
        confirmLabel: options.confirmLabel || 'OK',
      });
    });
  };

  const showConfirm = (title, message, options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        title,
        message,
        type: options.type || 'warning',
        isConfirm: true,
        resolve,
        confirmLabel: options.confirmLabel || 'Confirm',
        cancelLabel: options.cancelLabel || 'Cancel',
      });
    });
  };

  const showPrompt = (title, message, defaultValue = '', options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        title,
        message,
        type: options.type || 'info',
        isPrompt: true,
        defaultValue,
        placeholder: options.placeholder || '',
        resolve,
        confirmLabel: options.confirmLabel || 'Submit',
        cancelLabel: options.cancelLabel || 'Cancel',
      });
    });
  };

  const handleConfirm = () => {
    if (!dialog) return;
    const res = dialog.isPrompt ? promptValue : true;
    dialog.resolve(res);
    setDialog(null);
  };

  const handleCancel = () => {
    if (!dialog) return;
    dialog.resolve(dialog.isPrompt ? null : false);
    setDialog(null);
  };

  // Close dialog on ESC keypress
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && dialog) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog]);

  // Determine Icon and color scheme based on dialog type
  const getIcon = (type) => {
    switch (type) {
      case 'danger':
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />,
          bgColor: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50',
          btnColor: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 dark:shadow-none'
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50',
          btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 dark:shadow-none'
        };
      case 'info':
      default:
        return {
          icon: <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
          bgColor: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50',
          btnColor: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none'
        };
    }
  };

  const scheme = dialog ? getIcon(dialog.type) : null;

  return (
    <DialogContext.Provider value={{ alert: showAlert, confirm: showConfirm, prompt: showPrompt }}>
      {children}

      {/* Custom Dialog Backdrop */}
      {dialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          {/* Dialog Container Card */}
          <div 
            role="alertdialog"
            className="bg-card w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button (for safety) */}
            <button 
              onClick={handleCancel}
              className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Dialog Content Header */}
            <div className="flex gap-4 items-start pr-6">
              <div className={`p-3 rounded-2xl border ${scheme.bgColor} shrink-0`}>
                {scheme.icon}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground leading-snug">
                  {dialog.title}
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {dialog.message}
                </p>
              </div>
            </div>

            {/* Prompt Input Field */}
            {dialog.isPrompt && (
              <div className="mt-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder={dialog.placeholder}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirm();
                  }}
                  className="w-full h-11 px-3 py-2 bg-background border border-border focus:border-primary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
                />
              </div>
            )}

            {/* Dialog Actions Footer */}
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
              {!dialog.isAlert && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-semibold border border-border hover:bg-muted rounded-xl transition-all cursor-pointer text-foreground"
                >
                  {dialog.cancelLabel}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-sm ${scheme.btnColor}`}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
