
import React, { useState } from 'react';
import { apiClient } from '../apiClient';

interface ResetPasswordPageProps {
    onResetSuccess: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onResetSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!password || !confirmPassword) {
            setError('Please fill in both password fields.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        const { error: updateError } = await apiClient.auth.updateUser({ password });

        if (updateError) {
            setError(updateError.message || 'Failed to reset password. Please try again.');
        } else {
            setMessage('Your password has been successfully updated! You can now log in with your new password.');
            setTimeout(() => {
                onResetSuccess(); // This will switch the view back to the login page
            }, 3000); // Give user time to read the message
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                     <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
                        WSP
                    </h1>
                    <p className="text-slate-400 mt-2">Create a new password for your account.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 shadow-2xl rounded-xl p-8 space-y-6">
                    <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-slate-400 mb-2">
                            New Password
                        </label>
                        <input
                            id="new-password"
                            name="new-password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-900 border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            placeholder="••••••••"
                            disabled={loading || !!message}
                        />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-400 mb-2">
                            Confirm New Password
                        </label>
                        <input
                            id="confirm-password"
                            name="confirm-password"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-900 border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            placeholder="••••••••"
                            disabled={loading || !!message}
                        />
                    </div>
                    
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    {message && <p className="text-sm text-green-500 text-center">{message}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading || !!message}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-500 transition-colors disabled:bg-slate-600 disabled:cursor-wait"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
