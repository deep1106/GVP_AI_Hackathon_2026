import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import api from '../api/client';

export default function LoginPage() {
    const { t } = useTranslation();
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState('');
    const [googleLoading, setGoogleLoading] = useState(false);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

    // Handle Google OAuth callback (authorization code in URL)
    useEffect(() => {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code) {
            // Remove code from URL to prevent re-processing
            window.history.replaceState({}, '', '/login');
            handleGoogleCallback(code);
        }
    }, []);

    const handleGoogleCallback = async (code: string) => {
        setGoogleLoading(true);
        setError('');
        try {
            const res = await api.post('/api/auth/google', { code });
            login(res.data.access_token, res.data.user);
            navigate('/');
        } catch {
            setError('Google sign-in failed. Please try again or use email/password.');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
            showToast('Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID to frontend .env');
            return;
        }
        const redirectUri = encodeURIComponent('http://localhost:5174/login');
        const scope = encodeURIComponent('openid email profile');
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
        window.location.href = googleAuthUrl;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/api/auth/login', { email, password });
            login(res.data.access_token, res.data.user);
            navigate('/');
        } catch {
            setError(t('auth.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet><title>FleetFlow – Sign In</title></Helmet>
            <div className="flex min-h-screen">
                {/* ──────── Left Hero ──────── */}
                <div className="hidden lg:flex lg:w-1/2 login-hero-bg relative flex-col justify-between p-10 overflow-hidden">
                    {/* Logo */}
                    <div className="flex items-center gap-3 z-10">
                        <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM8 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" />
                            </svg>
                        </div>
                        <span className="text-white text-xl font-bold">FleetFlow</span>
                    </div>

                    {/* Animated geometric shapes */}
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        <motion.div
                            className="absolute w-48 h-48 rounded-2xl border border-primary-500/20 bg-primary-500/5 backdrop-blur-sm"
                            animate={{ rotate: [0, 45, 0], scale: [1, 1.05, 1] }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ top: '25%', left: '20%' }}
                        />
                        <motion.div
                            className="absolute w-32 h-32 rounded-2xl bg-primary-600/10 border border-primary-400/20 flex items-center justify-center"
                            animate={{ rotate: [45, 0, 45], y: [0, -15, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ top: '30%', left: '35%' }}
                        >
                            <svg className="w-10 h-10 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M2 12l10-8v5h10v6H12v5z" />
                            </svg>
                        </motion.div>
                        <motion.div
                            className="absolute w-20 h-20 rounded-full bg-primary-500/10 border border-primary-400/15 flex items-center justify-center"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ top: '55%', left: '30%' }}
                        >
                            <div className="grid grid-cols-3 gap-1">
                                {[...Array(9)].map((_, i) => (
                                    <div key={i} className="w-2 h-2 rounded-full bg-primary-400/60" />
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Bottom content */}
                    <div className="z-10">
                        <div className="inline-flex items-center gap-2 bg-navy-700/60 border border-navy-600/50 rounded-full px-4 py-1.5 mb-6">
                            <div className="w-2 h-2 rounded-full bg-status-active animate-pulse" />
                            <span className="text-sm text-gray-300">System Operational</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                            Orchestrate your<br />logistics with <span className="text-primary-400">precision</span>.
                        </h1>
                        <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                            Join 10,000+ enterprise fleets optimizing routes, reducing fuel costs, and ensuring timely deliveries with our AI-driven platform.
                        </p>
                    </div>
                </div>

                {/* ──────── Right Form ──────── */}
                <div className="w-full lg:w-1/2 bg-navy-800 lg:bg-navy-900 flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-md"
                    >
                        {/* Mobile logo */}
                        <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
                            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM8 18.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" />
                                </svg>
                            </div>
                            <span className="text-white text-xl font-bold">FleetFlow</span>
                        </div>

                        <div className="bg-navy-700 border border-navy-600/50 rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-white text-center mb-2">Welcome Back</h2>
                            <p className="text-gray-400 text-center mb-8">Please enter your details to sign in.</p>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                                    <div className="relative">
                                        <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="name@company.com"
                                            required
                                            className="w-full pl-10 pr-4 py-3 bg-navy-800 border border-navy-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-300">Password</label>
                                        <button type="button" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
                                            Forgot Password?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="Enter your password"
                                            required
                                            className="w-full pl-10 pr-12 py-3 bg-navy-800 border border-navy-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                                        >
                                            {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>Sign In <span className="text-lg">→</span></>
                                    )}
                                </button>
                            </form>

                            {/* Divider */}
                            <div className="flex items-center gap-4 my-6">
                                <div className="flex-1 h-px bg-navy-600" />
                                <span className="text-xs text-gray-500">Or continue with</span>
                                <div className="flex-1 h-px bg-navy-600" />
                            </div>

                            {/* Social buttons */}
                            <div className="space-y-3">
                                <button type="button" onClick={handleGoogleLogin} disabled={googleLoading}
                                    className="w-full flex items-center justify-center gap-3 py-2.5 bg-navy-800 border border-navy-600 rounded-xl text-gray-300 hover:bg-navy-600/50 transition-colors text-sm font-medium disabled:opacity-50">
                                    {googleLoading ? (
                                        <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                    )}
                                    {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
                                </button>
                            </div>

                            <p className="text-center text-sm text-gray-400 mt-6">
                                Don't have an account? <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors cursor-pointer mr-3">Sign Up</Link>
                                <span className="text-gray-600">|</span>
                                <a href="mailto:sales@fleetflow.com?subject=Enterprise Inquiry" className="text-primary-400 hover:text-primary-300 font-medium transition-colors ml-3">Contact Sales</a>
                            </p>
                        </div>

                        {/* Demo hint */}
                        <div className="mt-4 p-3 rounded-xl bg-navy-700/50 border border-navy-600/30 text-center">
                            <p className="text-xs text-gray-500 mb-1">Demo: fleet@fleetflow.com / fleet123</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Toast notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-navy-700 border border-navy-600/50 text-gray-200 text-sm shadow-2xl backdrop-blur max-w-md text-center">
                        <div className="flex items-center gap-3">
                            <span className="text-primary-400">ℹ</span>
                            <span>{toast}</span>
                            <button onClick={() => setToast('')} className="text-gray-500 hover:text-white ml-2">✕</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
