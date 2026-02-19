import React, { useState } from "react";
import { User, Lock, ArrowRight, UserPlus, Loader2 } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";
import { toast, Toaster } from "react-hot-toast";
import { authService } from "../../config/apiConfig";

const Signup = ({ onSignup, onSwitchToLogin }) => {
    const { isDarkMode, theme } = useTheme();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        userName: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            toast.error("Passwords do not match!");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await authService.register(formData.userName, formData.password);

            toast.success("Admin account created successfully!");

            // Auto login after registration
            const loginData = await authService.login(formData.userName, formData.password);
            onSignup(loginData.admin || loginData.user);
        } catch (err) {
            console.error("Signup error:", err);
            const errorMessage = err.message || "Something went wrong. Please try again.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6 transition-colors duration-500"
            style={{ backgroundColor: theme.bg }}
        >
            <div
                className="w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-300"
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}
            >
                {/* Left Side - Brand / Info */}
                <div className="md:w-2/5 p-12 text-white flex flex-col relative overflow-hidden bg-[var(--color-primary)]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-hover)] opacity-90"></div>

                    {/* Decorative Circles */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex-1 flex flex-col justify-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 shadow-lg">
                            <UserPlus size={32} className="text-white" />
                        </div>

                        <h2 className="text-3xl font-bold mb-4 tracking-tight">Join the Platform.</h2>
                        <p className="text-white/80 text-lg leading-relaxed mb-8">
                            Create your admin account to manage labels, users, and print jobs seamlessly.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-white/90">
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                <span className="text-sm font-semibold tracking-wide">Enterprise Grade Security</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/90">
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                <span className="text-sm font-semibold tracking-wide">Cloud-Native Architecture</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-12 pt-8 border-t border-white/20">
                        <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-3">Already have an account?</p>
                        <button
                            onClick={onSwitchToLogin}
                            className="flex items-center gap-2 text-white font-bold hover:text-white/80 transition-colors group"
                        >
                            <span>Back to Login</span>
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="md:w-3/5 p-12 md:p-16 flex flex-col justify-center bg-white dark:bg-gray-900">
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: theme.text }}>{t.signup}</h1>
                        <p className="text-sm" style={{ color: theme.textMuted }}>
                            Fill in your details to create a new workspace admin account.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                                Username
                            </label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" size={18} />
                                <input
                                    required
                                    type="text"
                                    name="userName"
                                    value={formData.userName}
                                    onChange={handleChange}
                                    placeholder="Enter username"
                                    className="input pl-11 py-3"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                                {t.password}
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" size={18} />
                                <input
                                    required
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="input pl-11 py-3"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                                {t.confirmPassword}
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" size={18} />
                                <input
                                    required
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="input pl-11 py-3"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2 animate-in slide-in-from-left-2">
                                <span className="font-bold">Error:</span> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-4 text-sm font-bold uppercase tracking-widest shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-3 group"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span>{t.createAccount}</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                    <Toaster position="top-right" />
                </div>
            </div>
        </div>
    );
};

export default Signup;
