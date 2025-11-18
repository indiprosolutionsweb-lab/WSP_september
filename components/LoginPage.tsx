
import React, { useState } from 'react';
import { apiClient } from '../apiClient.ts';

interface LoginPageProps {
    // This component now handles its own logic and will trigger a page refresh on success.
}

export const LoginPage: React.FC<LoginPageProps> = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage(''); // Clear message on new submission
        setLoading(true);

        if (!email || !password) {
            setError('Please enter both email and password.');
            setLoading(false);
            return;
        }

        const { error } = await apiClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            setError(error.message || 'Invalid credentials. Please try again.');
        } else {
            // onAuthStateChange in App.tsx will handle the rest.
            window.location.reload();
        }
        setLoading(false);
    };

    const handlePasswordReset = async () => {
        setError('');
        setMessage('');
        if (!email) {
            setError('Please enter your email address to reset your password.');
            return;
        }
        setLoading(true);
        const { error: resetError } = await apiClient.auth.resetPasswordForEmail(email, {
             redirectTo: window.location.origin, // Redirect user to the app's homepage after password reset
        });
        setLoading(false);

        // For security, always show a generic message to prevent user enumeration attacks
        if (resetError) {
            console.error("Password reset error:", resetError);
        }
        setMessage('If an account with that email exists, a password reset link has been sent.');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                     <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                        WSP
                    </h1>
                    <p className="text-slate-400 mt-2">Sign in to continue to your dashboard.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 shadow-2xl rounded-xl p-8 space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-400 mb-2">
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            placeholder="you@example.com"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="block text-sm font-medium text-slate-400">
                                Password
                            </label>
                            <div className="text-sm">
                                <button
                                    type="button"
                                    onClick={handlePasswordReset}
                                    disabled={loading}
                                    className="font-medium text-blue-400 hover:text-blue-300 focus:outline-none focus:underline disabled:opacity-50"
                                >
                                    Forgot password?
                                </button>
                            </div>
                        </div>
                        <div className="mt-2">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>
                    </div>
                    
                    {error && (
                        <p className="text-sm text-red-500 text-center">{error}</p>
                    )}
                    {message && (
                        <p className="text-sm text-green-500 text-center">{message}</p>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-500 transition-colors disabled:bg-slate-600 disabled:cursor-wait"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
