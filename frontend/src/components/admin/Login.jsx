import React, { useState } from "react";
import { Lock, ArrowRight, LogIn, Loader2, Mail, Eye, EyeOff } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";
import { toast, Toaster } from "react-hot-toast";
import { authService } from "../../config/apiConfig";

const Login = ({ onLogin, onSwitchToSignup }) => {
    const { isDarkMode, theme } = useTheme();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [forgotMode, setForgotMode] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [superAdminExists, setSuperAdminExists] = useState(false);
    const [needsForceLogin, setNeedsForceLogin] = useState(false);

    React.useEffect(() => {
        const checkStatus = async () => {
            const status = await authService.checkSystemStatus();
            if (status && status.superAdminExists) {
                setSuperAdminExists(true);
            }
        };
        checkStatus();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const data = await authService.login(formData.email, formData.password, needsForceLogin);
            toast.success("Login successful!");
            setNeedsForceLogin(false);
            onLogin(data.user);
        } catch (err) {
            console.error("Login error:", err);

            if (err.needsForceLogin) {
                setNeedsForceLogin(true);
            } else {
                setNeedsForceLogin(false);
            }

            const errorMessage = err.message || "Invalid email or password.";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        if (!forgotEmail) return;

        setLoading(true);
        setError("");

        try {
            await authService.forgotPassword(forgotEmail);
            toast.success("Reset link sent! Please check your email and log in to set a new password.");
            setForgotMode(false);
        } catch (err) {
            const msg = err.message || "Failed to initiate reset.";
            setError(msg);
            toast.error(msg);
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
                            <LogIn size={32} className="text-white" />
                        </div>

                        <h2 className="text-3xl font-bold mb-4 tracking-tight">
                            {forgotMode ? "Reset Access." : "Welcome Back."}
                        </h2>
                        <p className="text-white/80 text-lg leading-relaxed mb-8">
                            {forgotMode
                                ? "Enter your email addresses to get back into your account and manage your workspace."
                                : "Sign in to access your dashboard, manage labels, and monitor print jobs."}
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-white/90">
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                <span className="text-sm font-semibold tracking-wide">Secure Access</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/90">
                                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                <span className="text-sm font-semibold tracking-wide">Real-time Analytics</span>
                            </div>
                        </div>
                    </div>

                    {/* Show toggle only if we are in forgot mode, OR if super admin does not exist. 
                        If super admin exists and we are not in forgot mode, standard users cannot register from login screen. */}
                    {(forgotMode || !superAdminExists) && (
                        <div className="relative z-10 mt-12 pt-8 border-t border-white/20">
                            <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-3">
                                {forgotMode ? "Remembered your password?" : "New to the platform?"}
                            </p>
                            <button
                                onClick={forgotMode ? () => setForgotMode(false) : onSwitchToSignup}
                                className="flex items-center gap-2 text-white font-bold hover:text-white/80 transition-colors group"
                            >
                                <span>{forgotMode ? "Back to Login" : "Create an Account"}</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Side - Form */}
                <div className="md:w-3/5 p-12 md:p-16 flex flex-col justify-center bg-white dark:bg-gray-900">
                    <div className="mb-10">
                        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: theme.text }}>
                            {forgotMode ? "Reset Password" : t.login}
                        </h1>
                        <p className="text-sm" style={{ color: theme.textMuted }}>
                            {forgotMode
                                ? "We'll help you get back into your account."
                                : "Enter your credentials to access your account."}
                        </p>
                    </div>

                    {!forgotMode ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" size={18} />
                                    <input
                                        required
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email"
                                        className="input pl-11 py-3"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                                        {t.password}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setForgotMode(true)}
                                        className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" size={18} />
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="input pl-11 pr-11 py-3"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2 animate-in slide-in-from-left-2">
                                    <span className="font-bold">Error:</span> {error}
                                </div>
                            )}

                            {needsForceLogin ? (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-warning w-full py-4 text-sm font-bold uppercase tracking-widest bg-yellow-500 hover:bg-yellow-600 focus:ring-4 focus:ring-yellow-500/20 text-white rounded-xl shadow-lg flex items-center justify-center gap-3 transition-all"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <span>Logout Previous Session & Login</span>
                                    )}
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary w-full py-4 text-sm font-bold uppercase tracking-widest shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-3 group"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            <span>{t.login}</span>
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            )}
                        </form>
                    ) : (
                        <form onSubmit={handleForgotSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" size={18} />
                                    <input
                                        required
                                        type="email"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        placeholder="Enter your registered email"
                                        className="input pl-11 py-3"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                                    <span className="font-bold">Error:</span> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full py-4 text-sm font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 group"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        <span>Send Reset Link</span>
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setForgotMode(false)}
                                className="w-full text-sm font-bold uppercase tracking-wider text-center py-2 hover:opacity-80 transition-opacity"
                                style={{ color: theme.textMuted }}
                            >
                                Back to Login
                            </button>
                        </form>
                    )}
                    <Toaster position="top-right" />
                </div>
            </div>
        </div>
    );
};

export default Login;
