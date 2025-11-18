
import React, { useState, useMemo, useEffect } from 'react';
import { Profile, Role, Company } from '../types.ts';
import { ExpandIcon, CollapseIcon, CalendarIcon } from './icons.tsx';

type ViewType = 'board' | 'dashboard' | 'focus' | 'management' | 'calendar' | 'upcoming' | 'tasks-list';

interface DocumentWithFullscreen extends Document {
	mozFullScreenElement?: Element;
	webkitFullscreenElement?: Element;
	mozCancelFullScreen?: () => Promise<void>;
	webkitExitFullscreen?: () => Promise<void>;
}
interface HTMLElementWithFullscreen extends HTMLElement {
	mozRequestFullScreen?: () => Promise<void>;
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
    canAccessPersonalViews: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, viewingUser, companies, viewableUsers, onLogout, onSelectViewUser, currentView, onSetCurrentView, canManageUsers, canAccessPersonalViews }) => {
    const [companyFilter, setCompanyFilter] = useState<string>('all');
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    const isSuperAdmin = currentUser.role === Role.Superadmin;

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!(document.fullscreenElement || (document as DocumentWithFullscreen).webkitFullscreenElement || (document as DocumentWithFullscreen).mozFullScreenElement));
        const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange'];
        events.forEach(e => document.addEventListener(e, handleFullscreenChange));
        return () => events.forEach(e => document.removeEventListener(e, handleFullscreenChange));
    }, []);

    const toggleFullscreen = () => {
        const doc = document as DocumentWithFullscreen;
        const elem = document.documentElement as HTMLElementWithFullscreen;
        if (!doc.fullscreenElement && !doc.webkitFullscreenElement && !doc.mozFullScreenElement) {
            (elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen)?.call(elem).catch(err => console.error(err));
        } else {
            (doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen)?.call(doc).catch(err => console.error(err));
        }
    };

    const filteredUsers = useMemo(() => {
        if (!isSuperAdmin) return viewableUsers;
        if (companyFilter === 'all') return viewableUsers;
        if (companyFilter === 'unassigned') return viewableUsers.filter(u => !u.company_id);
        return viewableUsers.filter(u => u.company_id === companyFilter);
    }, [viewableUsers, companyFilter, isSuperAdmin]);
    
    useEffect(() => {
        if (isSuperAdmin && viewingUser && !filteredUsers.some(u => u.id === viewingUser.id) && filteredUsers.length > 0) {
            onSelectViewUser(filteredUsers[0].id);
        }
    }, [filteredUsers, viewingUser, onSelectViewUser, isSuperAdmin]);
    
    const NavButton: React.FC<{ view: ViewType; label: string; colorClass?: string }> = ({ view, label, colorClass = 'blue' }) => (
        <button onClick={() => onSetCurrentView(view)} className={`px-3 py-1.5 rounded-md font-semibold text-sm transition-colors ${currentView === view ? `bg-${colorClass}-600 text-white shadow-md` : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{label}</button>
    );

    return (
        <header className="mb-4 sticky top-4 z-20">
             <div className="w-full max-w-screen-2xl mx-auto flex flex-col xl:flex-row items-center justify-between gap-4 text-sm bg-slate-800/90 backdrop-blur-sm p-2 rounded-lg border border-slate-700 shadow-sm">
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="flex flex-col items-center justify-center">
                        <svg viewBox="0 0 200 200" className="h-5 w-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none">
                            <rect x="80" y="0" width="120" height="80" fill="#F4911E"/><rect x="0" y="80" width="80" height="120" fill="#F4911E"/><rect x="80" y="80" width="120" height="120" fill="#0098DA"/>
                        </svg>
                        <span className="text-[9px] text-slate-400 font-light tracking-wider -mt-0.5">indipro</span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-sky-600">WSP</h1>
                </div>
                <nav className="flex justify-center gap-2 flex-wrap">
                    <NavButton view="board" label="Task Board" />
                    <NavButton view="dashboard" label="Dashboard" />
                    {canAccessPersonalViews && <NavButton view="tasks-list" label="Tasks List" colorClass="green" />}
                    {canAccessPersonalViews && <NavButton view="focus" label="Focus" colorClass="teal" />}
                    {canAccessPersonalViews && <NavButton view="upcoming" label="Upcoming" colorClass="amber" />}
                    {canManageUsers && <NavButton view="management" label="Management" colorClass="purple" />}
                </nav>
                <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-3 flex-wrap">
                    <span className="font-semibold text-slate-300 hidden sm:inline">Welcome, {currentUser.name}</span>
                    <button onClick={() => onSetCurrentView('calendar')} className={`p-1.5 rounded-full transition-colors ${currentView === 'calendar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-600'}`} title="Open year calendar"><CalendarIcon /></button>
                    <button onClick={toggleFullscreen} className="p-1.5 rounded-full text-slate-400 hover:bg-slate-600" title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>{isFullscreen ? <CollapseIcon /> : <ExpandIcon />}</button>
                    <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded-md transition-colors text-sm">Logout</button>
                    {isSuperAdmin ? (
                         <>
                            <div className="flex items-center gap-2">
                                <label htmlFor="company-filter" className="font-semibold text-slate-300">Co:</label>
                                <select id="company-filter" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="all">All</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    <option value="unassigned">Unassigned</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label htmlFor="view-selector" className="font-semibold text-slate-300">View:</label>
                                <select id="view-selector" value={viewingUser?.id || ''} onChange={(e) => onSelectViewUser(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={filteredUsers.length === 0}>
                                    {filteredUsers.length > 0 ? filteredUsers.map(user => (<option key={user.id} value={user.id}>{user.name}</option>)) : <option>No users</option>}
                                </select>
                            </div>
                        </>
                    ) : (currentUser.role === Role.Admin) && (
                        <div className="flex items-center gap-2">
                            <label htmlFor="view-selector" className="font-semibold text-slate-300">Viewing:</label>
                             <select id="view-selector" value={viewingUser?.id || ''} onChange={(e) => onSelectViewUser(e.target.value)} className="bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option key={currentUser.id} value={currentUser.id}>My Board</option>
                                {viewableUsers.filter(u => u.id !== currentUser.id).map(user => (<option key={user.id} value={user.id}>{user.name}</option>))}
                            </select>
                        </div>
                    )}
                </div>
             </div>
        </header>
    );
};
