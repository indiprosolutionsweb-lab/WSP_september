
import React, { useState, useEffect } from 'react';
import { MOCK_PROFILES } from '../mockData.ts';
import { Role } from '../types.ts';

const DEV_USER_OVERRIDE_KEY = 'wsp_dev_user_override';

const roleColors: { [key in Role]: string } = {
    [Role.Superadmin]: 'bg-red-500',
    [Role.Admin]: 'bg-indigo-500',
    [Role.User]: 'bg-gray-500',
};

export const DevUserSwitcher: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem(DEV_USER_OVERRIDE_KEY));

    useEffect(() => {
        // Handle case where key might not exist on initial load
        if (currentUser === null) {
            setCurrentUser(localStorage.getItem(DEV_USER_OVERRIDE_KEY));
        }
    }, []);

    const handleSwitch = (userId: string | null) => {
        localStorage.setItem(DEV_USER_OVERRIDE_KEY, userId === null ? 'null' : userId);
        window.location.reload();
    };

    const currentProfile = MOCK_PROFILES.find(p => p.id === currentUser);
    const buttonText = currentProfile ? `${currentProfile.name.split(' ')[0]} (${currentProfile.role})` : 'Logged Out';

    return (
        <div className="fixed bottom-4 right-4 z-50 font-sans">
            {isOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-700 border border-slate-600 rounded-lg shadow-2xl p-2 max-h-80 overflow-y-auto">
                    <h3 className="text-sm font-bold text-slate-200 px-2 pb-1 border-b border-slate-600">Switch User</h3>
                    <ul className="mt-1">
                        {MOCK_PROFILES.map(profile => (
                            <li key={profile.id}>
                                <button
                                    onClick={() => handleSwitch(profile.id)}
                                    className={`w-full text-left text-sm px-2 py-1.5 rounded-md flex items-center justify-between gap-2 ${
                                        currentUser === profile.id 
                                        ? 'bg-blue-600 font-semibold text-white' 
                                        : 'text-slate-300 hover:bg-slate-600'
                                    }`}
                                >
                                    <span>{profile.name}</span>
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full text-white ${roleColors[profile.role]}`}>{profile.role}</span>
                                </button>
                            </li>
                        ))}
                         <li>
                            <button
                                onClick={() => handleSwitch(null)}
                                className={`w-full text-left text-sm px-2 py-1.5 rounded-md mt-1 border-t border-slate-600 ${
                                    currentUser === 'null'
                                    ? 'bg-blue-600 font-semibold text-white'
                                    : 'text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                Show Login Page
                            </button>
                        </li>
                    </ul>
                </div>
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-purple-600 text-white font-bold text-sm px-4 py-2 rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                title="Open Dev User Switcher"
            >
                DEV: {buttonText}
            </button>
        </div>
    );
};
