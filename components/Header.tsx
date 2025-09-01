
import React, { useState, useMemo, useEffect } from 'react';
import { Profile, Role, Company } from '../types';
import { ExpandIcon, CollapseIcon } from './icons';

type ViewType = 'board' | 'dashboard' | 'focus' | 'management' | 'calendar';

// Define interfaces for vendor-prefixed properties to satisfy TypeScript
interface DocumentWithFullscreen extends Document {
	mozFullScreenElement?: Element;
	msFullscreenElement?: Element;
	webkitFullscreenElement?: Element;
	mozCancelFullScreen?: () => Promise<void>;
	msExitFullscreen?: () => Promise<void>;
	webkitExitFullscreen?: () => Promise<void>;
}

interface HTMLElementWithFullscreen extends HTMLElement {
	mozRequestFullScreen?: () => Promise<void>;
	msRequestFullscreen?: () => Promise<void>;
	webkitRequestFullscreen?: () => Promise<void>;
}

interface HeaderProps {
    currentUser: Profile;
    viewingUser: Profile | null;
    allProfiles: Profile[];
    companies: Company[];
    viewableUsers: Profile[];
    onLogout: () => void;
    onSelectViewUser: (userId: string) => void;
    currentView: ViewType;
    onSetCurrentView: (view: ViewType) => void;
    canManageUsers: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    currentUser,
    viewingUser,
    companies,
    viewableUsers,
    onLogout,
    onSelectViewUser,
    currentView,
    onSetCurrentView,
    canManageUsers,
    allProfiles
}) => {
    const [companyFilter, setCompanyFilter] = useState<string>('all');
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    const isSuperAdmin = currentUser.role === Role.Superadmin;
    const showViewSelector = currentUser.role === Role.Admin || isSuperAdmin;

    useEffect(() => {
        const getFullscreenElement = (): Element | null => {
            const doc = document as DocumentWithFullscreen;
            return doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement || null;
        }

        const handleFullscreenChange = () => {
            setIsFullscreen(!!getFullscreenElement());
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = () => {
        const doc = document as DocumentWithFullscreen;
        const element = document.documentElement as HTMLElementWithFullscreen;

        const isFullscreenActive = () => !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);

        if (!isFullscreenActive()) {
            // Enter fullscreen
            const requestMethod = element.requestFullscreen || element.webkitRequestFullscreen || element.mozRequestFullScreen || element.msRequestFullscreen;
            if (typeof requestMethod === 'function') {
                requestMethod.call(element).catch(err => console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`));
            }
        } else {
            // Exit fullscreen
            const exitMethod = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
            if (typeof exitMethod === 'function') {
                exitMethod.call(doc).catch(err => console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`));
            }
        }
    };

    const filteredUsers = useMemo(() => {
        if (!isSuperAdmin) return viewableUsers;
        if (companyFilter === 'all') {
            return viewableUsers;
        }
        if (companyFilter === 'unassigned') {
            return viewableUsers.filter(u => !u.company_id);
        }
        return viewableUsers.filter(u => u.company_id === companyFilter);
    }, [viewableUsers, companyFilter, isSuperAdmin]);
    
    useEffect(() => {
        if (isSuperAdmin) {
            const isViewingUserInList = viewingUser && filteredUsers.some(u => u.id === viewingUser.id);
            if (!isViewingUserInList && filteredUsers.length > 0) {
                onSelectViewUser(filteredUsers[0].id);
            }
        }
    }, [filteredUsers, viewingUser, onSelectViewUser, isSuperAdmin]);
    
    const handleCompanyFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCompanyFilter(e.target.value);
    };
    
    const NavButton: React.FC<{ view: ViewType; label: string; colorClass?: string }> = ({ view, label, colorClass = 'blue' }) => {
        const activeClasses = `bg-${colorClass}-600 text-white shadow-md`;
        const inactiveClasses = 'bg-slate-700 text-slate-300 hover:bg-slate-600';
        return (
            <button
                onClick={() => onSetCurrentView(view)}
                className={`px-3 py-1.5 rounded-md font-semibold text-sm transition-colors ${currentView === view ? activeClasses : inactiveClasses}`}
            >
                {label}
            </button>
        );
    };

    return (
        <header className="mb-4">
             <div className="w-full max-w-screen-2xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-4 text-sm bg-slate-800/50 p-2 rounded-lg">
                {/* Left: Title */}
                <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 flex-shrink-0">
                    WSP
                </h1>

                {/* Center: Main Navigation */}
                <nav className="flex justify-center gap-2 flex-wrap">
                    <NavButton view="board" label="Task Board" />
                    <NavButton view="dashboard" label="Dashboard" />
                    <NavButton view="focus" label="Focus" colorClass="teal" />
                    <NavButton view="calendar" label="Year Calendar" />
                    {canManageUsers && (
                         <NavButton view="management" label="Management" colorClass="purple" />
                    )}
                </nav>

                 {/* Right: User Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-3 flex-wrap">
                    <span className="font-semibold text-slate-300 hidden sm:inline">Welcome, {currentUser.name}</span>
                    <button 
                        onClick={toggleFullscreen}
                        className="p-1.5 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                        {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
                    </button>
                    <button 
                        onClick={onLogout}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded-md transition-colors text-sm"
                    >
                        Logout
                    </button>

                    {isSuperAdmin ? (
                         <>
                            <div className="flex items-center gap-2">
                                <label htmlFor="company-filter" className="font-semibold text-slate-300">Co:</label>
                                <select
                                    id="company-filter"
                                    value={companyFilter}
                                    onChange={handleCompanyFilterChange}
                                    className="bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    <option value="unassigned">Unassigned</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="view-selector" className="font-semibold text-slate-300">View:</label>
                                <select
                                    id="view-selector"
                                    value={viewingUser?.id || ''}
                                    onChange={(e) => onSelectViewUser(e.target.value)}
                                    className="bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={filteredUsers.length === 0}
                                >
                                    {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    )) : <option>No users</option>}
                                </select>
                            </div>
                        </>
                    ) : showViewSelector && (
                        <div className="flex items-center gap-2">
                            <label htmlFor="view-selector" className="font-semibold text-slate-300">Viewing:</label>
                             <select
                                id="view-selector"
                                value={viewingUser?.id || ''}
                                onChange={(e) => onSelectViewUser(e.target.value)}
                                className="bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option key={currentUser.id} value={currentUser.id}>My Board</option>
                                {viewableUsers.filter(u => u.id !== currentUser.id).map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
             </div>
        </header>
    );
};
