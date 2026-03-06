import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, HelpCircle, CheckCircle, Info, X } from 'lucide-react';
import { useTheme } from './ThemeContext';

const AlertContext = createContext();

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) throw new Error('useAlert must be used within an AlertProvider');
    return context;
};

export const AlertProvider = ({ children }) => {
    const { theme, isDarkMode } = useTheme();
    const [popup, setPopup] = useState(null);

    const showAlert = useCallback((message, title = 'Notification') => {
        return new Promise((resolve) => {
            setPopup({ type: 'alert', title, message, resolve });
        });
    }, []);

    const showConfirm = useCallback((message, title = 'Confirm Action') => {
        return new Promise((resolve) => {
            setPopup({ type: 'confirm', title, message, resolve });
        });
    }, []);

    const showPrompt = useCallback((message, defaultValue = '', title = 'Input Required') => {
        return new Promise((resolve) => {
            setPopup({ type: 'prompt', title, message, defaultValue, resolve, value: defaultValue });
        });
    }, []);

    const handleAction = (result) => {
        const resolve = popup.resolve;
        setPopup(null);
        if (resolve) resolve(result);
    };

    return (
        <AlertContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
            {children}
            {popup && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                        onClick={() => popup.type === 'alert' && handleAction(true)}
                    />

                    {/* Modal */}
                    <div
                        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 fade-in duration-200"
                        style={{ backgroundColor: theme.surface, borderColor: theme.border }}
                    >
                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${popup.type === 'alert' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' :
                                    popup.type === 'confirm' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' :
                                        'bg-purple-50 dark:bg-purple-900/20 text-purple-500'
                                    }`}>
                                    {popup.type === 'alert' && <Info size={24} />}
                                    {popup.type === 'confirm' && <AlertCircle size={24} />}
                                    {popup.type === 'prompt' && <HelpCircle size={24} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-black tracking-tight mb-1" style={{ color: theme.text }}>
                                        {popup.title}
                                    </h3>
                                    <div className="text-sm leading-relaxed opacity-70" style={{ color: theme.text }}>
                                        {popup.message}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAction(popup.type === 'confirm' ? false : (popup.type === 'prompt' ? null : true))}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors opacity-40 hover:opacity-100"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {popup.type === 'prompt' && (
                                <div className="mb-6">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={popup.value}
                                        onChange={(e) => setPopup({ ...popup, value: e.target.value })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAction(popup.value);
                                            if (e.key === 'Escape') handleAction(null);
                                        }}
                                        className="w-full px-4 py-3 rounded-xl border-2 transition-all outline-none focus:ring-4 focus:ring-primary/10"
                                        style={{
                                            backgroundColor: theme.bg,
                                            borderColor: theme.border,
                                            color: theme.text,
                                        }}
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-end gap-3 mt-2">
                                {(popup.type === 'confirm' || popup.type === 'prompt') && (
                                    <button
                                        onClick={() => handleAction(popup.type === 'confirm' ? false : null)}
                                        className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95"
                                        style={{ color: theme.textMuted }}
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={() => handleAction(popup.type === 'prompt' ? popup.value : true)}
                                    className={`px-8 py-2.5 rounded-xl text-sm font-black text-white shadow-lg transition-all active:scale-95 flex items-center gap-2 ${popup.type === 'alert' ? 'bg-blue-500 hover:bg-blue-600' :
                                        popup.type === 'confirm' ? 'bg-amber-500 hover:bg-amber-600' :
                                            'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'
                                        }`}
                                >
                                    {popup.type === 'alert' ? 'Got it' :
                                        popup.type === 'confirm' ? 'Confirm' : 'Continue'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AlertContext.Provider>
    );
};
