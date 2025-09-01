
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Day, Task, TaskStatus, Profile, Role, Company, FocusNote } from './types';
import { TOTAL_WEEKS } from './constants';
import { WeekSelector } from './components/WeekSelector';
import { TaskBoard } from './components/TaskBoard';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';
import { ManagementView } from './components/ManagementView';
import { YearCalendarView } from './components/YearCalendarView';
import { DownloadTasks } from './components/DownloadTasks';
import { LoginPage } from './components/LoginPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { FocusView } from './components/FocusView';
import { apiClient, DEV_MODE } from './apiClient';
import { getWeekNumber, getFinancialYearDetailsForDate } from './dateUtils';
import { DevUserSwitcher } from './components/DevUserSwitcher';


// WeekRangeSelector Component defined locally to avoid creating a new file
interface WeekRangeSelectorProps {
    weekRange: { start: number; end: number };
    setWeekRange: (range: { start: number; end: number }) => void;
}
const WeekRangeSelector: React.FC<WeekRangeSelectorProps> = ({ weekRange, setWeekRange }) => {
    const [startInput, setStartInput] = useState(weekRange.start.toString());
    const [endInput, setEndInput] = useState(weekRange.end.toString());

    useEffect(() => {
        setStartInput(weekRange.start.toString());
        setEndInput(weekRange.end.toString());
    }, [weekRange]);

    const handleUpdate = (type: 'start' | 'end', value: string) => {
        let week = parseInt(value, 10);
        if (isNaN(week)) {
            if (type === 'start') setStartInput(weekRange.start.toString());
            else setEndInput(weekRange.end.toString());
            return;
        }

        if (week < 1) week = 1;
        if (week > TOTAL_WEEKS) week = TOTAL_WEEKS;

        const newRange = { ...weekRange };
        if (type === 'start') {
            newRange.start = week;
            if (week > newRange.end) newRange.end = week;
        } else {
            newRange.end = week;
            if (week < newRange.start) newRange.start = week;
        }
        setWeekRange(newRange);
    };
    
    const createHandler = (type: 'start' | 'end') => ({
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            if (type === 'start') setStartInput(e.target.value);
            else setEndInput(e.target.value);
        },
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                handleUpdate(type, e.currentTarget.value);
                e.currentTarget.blur();
            }
        },
        onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
            handleUpdate(type, e.currentTarget.value);
        }
    });

    return (
        <div className="flex items-center justify-center space-x-2 p-2">
            <label htmlFor="start-week-input" className="text-base font-bold text-slate-200 tracking-wide">
                Weeks
            </label>
            <input
                id="start-week-input"
                type="number"
                value={startInput}
                {...createHandler('start')}
                className={`w-16 bg-slate-700 border border-slate-600 rounded-lg px-2 py-0.5 text-slate-100 text-center text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500`}
                min="1" max={TOTAL_WEEKS} aria-label="Start week for analysis"
            />
            <span className="text-slate-400">to</span>
            <input
                id="end-week-input"
                type="number"
                value={endInput}
                {...createHandler('end')}
                className={`w-16 bg-slate-700 border border-slate-600 rounded-lg px-2 py-0.5 text-slate-100 text-center text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500`}
                min="1" max={TOTAL_WEEKS} aria-label="End week for analysis"
            />
            <span className="text-base text-slate-400 font-normal">of {TOTAL_WEEKS}</span>
        </div>
    );
};


const App: React.FC = () => {
    // Data states
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [focusNote, setFocusNote] = useState<FocusNote | null>(null);
    
    // App states
    const [session, setSession] = useState<any | null>(null);
    const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
    const [viewingUser, setViewingUser] = useState<Profile | null>(null);
    const [currentWeek, setCurrentWeek] = useState<number>(1);
    const [weekRange, setWeekRange] = useState({ start: 1, end: 1 });
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [currentView, setCurrentView] = useState<'board' | 'dashboard' | 'focus' | 'management' | 'calendar'>('board');
    const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);

    // Derived state for calendar settings based on the user being viewed
    const viewingCompany = useMemo(() => {
        return companies.find(c => c.id === viewingUser?.company_id);
    }, [companies, viewingUser]);
    const calendarStartMonth = useMemo(() => viewingCompany?.calendar_start_month || 'April', [viewingCompany]);
    
    // Authentication
    useEffect(() => {
        const { data: { subscription } } = apiClient.auth.onAuthStateChange((event: string, session: any) => {
             if (event === 'PASSWORD_RECOVERY') {
                setIsPasswordRecovery(true);
            }
            setSession(session);
        });

        apiClient.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Sync current week with the viewing user's calendar system
    useEffect(() => {
        // This effect ensures that when the viewingUser changes (e.g., by a Superadmin),
        // the current week is recalculated based on that user's company's calendar.
        if (viewingUser && companies.length > 0) {
            const userCompany = companies.find(c => c.id === viewingUser.company_id);
            const userCalendarStart = userCompany?.calendar_start_month || 'April';
            const newCurrentWeek = getWeekNumber(new Date(), userCalendarStart);
            setCurrentWeek(newCurrentWeek);
            // Also reset the dashboard week range for consistency
            setWeekRange({ start: newCurrentWeek, end: newCurrentWeek });
        }
    }, [viewingUser, companies]);

    // Fetch data on session change
    useEffect(() => {
        const fetchAllData = async (userId: string) => {
            try {
                // Fetch companies first to determine calendar settings
                const { data: companyData, error: companyError } = await apiClient.from('companies').select('*');
                if (companyError) throw companyError;
                setCompanies(companyData || []);

                const { data: profileData, error: profileError } = await apiClient.from('profiles').select('*');
                if (profileError) throw profileError;
                setProfiles(profileData || []);
                
                const userProfile = profileData?.find(p => p.id === userId);
                if (userProfile) {
                     setCurrentUserProfile(userProfile);
                     if (userProfile.role === Role.Superadmin) {
                        // For Superadmin, default to viewing the first non-superadmin user
                        const firstUserToView = profileData.find(p => p.id !== userProfile.id);
                        setViewingUser(firstUserToView || null);
                    } else {
                        setViewingUser(userProfile);
                    }
                } else {
                    console.error("Current user's profile not found!");
                    await apiClient.auth.signOut();
                }

                const { data: taskData, error: taskError } = await apiClient.from('tasks').select('*');
                if (taskError) throw taskError;
                setTasks(taskData || []);

                const { data: focusData, error: focusError } = await apiClient.from('focus_notes').select('*').eq('user_id', userId).maybeSingle();
                if (focusError) throw focusError;
                setFocusNote(focusData);


            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoaded(true);
            }
        };

        if (session?.user) {
            fetchAllData(session.user.id);
        } else {
            setIsLoaded(true); // Nothing to load, show login page
        }
    }, [session]);
    
    const { financialYearStart, financialYearLabel } = useMemo(
        () => getFinancialYearDetailsForDate(new Date(), calendarStartMonth),
        [calendarStartMonth]
    );

    const handleLogout = async () => {
        await apiClient.auth.signOut();
        setSession(null);
        setCurrentUserProfile(null);
    };

    const handleSetViewingUser = (userId: string) => {
        const userToView = profiles.find(p => p.id === userId);
        if (userToView) {
            setViewingUser(userToView);
            const validViews = ['board', 'dashboard', 'calendar'];
            if (!validViews.includes(currentView)) {
                 setCurrentView('board');
            }
        }
    };

    const handleSetCurrentView = (view: 'board' | 'dashboard' | 'focus' | 'management' | 'calendar') => {
        if (view === 'dashboard' && currentView !== 'dashboard') {
            setWeekRange({ start: currentWeek, end: currentWeek });
        }
        setCurrentView(view);
    };

    const handleAddTask = async (userId: string, week: number, day: Day, taskText: string) => {
        const newTaskPayload = {
            user_id: userId,
            week_number: week,
            day: day,
            text: taskText,
            status: TaskStatus.Incomplete,
            time_taken: 0,
            is_priority: false,
        };

        const { data, error } = await apiClient.from('tasks').insert(newTaskPayload).select();
        
        if (error) {
            console.error("Error adding task:", error);
        } else if (data) {
            setTasks(prevTasks => [...prevTasks, data[0] as Task]);
        }
    };
    
    const handleUpdateTask = async (updatedTask: Task) => {
        const { id, ...updateData } = updatedTask;
        const { error } = await apiClient.from('tasks').update(updateData).eq('id', id);
        if (error) {
            console.error("Error updating task:", error);
        } else {
            setTasks(prevTasks => prevTasks.map(t => t.id === id ? updatedTask : t));
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        const { error } = await apiClient.from('tasks').delete().eq('id', taskId);
        if (error) {
            console.error("Error deleting task:", error);
        } else {
            setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
        }
    };

    const handleDeleteUser = async (profileId: string) => {
        const { error: taskError } = await apiClient.from('tasks').delete().eq('user_id', profileId);
        if (taskError) {
             alert(`Could not delete user's tasks: ${taskError.message}`);
             return;
        }
        
        const { error: profileError } = await apiClient.from('profiles').delete().eq('id', profileId);
        if (profileError) {
             alert(`Could not delete user's profile: ${profileError.message}`);
             return;
        }

        setTasks(prev => prev.filter(t => t.user_id !== profileId));
        const remainingProfiles = profiles.filter(p => p.id !== profileId);
        setProfiles(remainingProfiles);

        if (viewingUser?.id === profileId) {
            const nextUserToView = remainingProfiles.find(p => p.role !== Role.Superadmin) || null;
            setViewingUser(nextUserToView);
        }
    };
    
    const handleAddCompany = async (companyName: string, calendarStartMonth: 'January' | 'April') => {
        const { data, error } = await apiClient.from('companies').insert({ name: companyName, calendar_start_month: calendarStartMonth }).select();
        if (error) {
            alert(`Error adding company: ${error.message}`);
        } else if (data) {
            setCompanies(prev => [...prev, data[0]]);
        }
    };
    
    const handleUpdateUserProfile = async (profile: Profile) => {
        const { id, ...updateData } = profile;
        const { error } = await apiClient.from('profiles').update(updateData).eq('id', id);
        if (error) {
            alert(`Error updating profile: ${error.message}`);
        } else {
            setProfiles(prev => prev.map(p => p.id === id ? profile : p));
        }
    };

    const handleDeleteCompany = async (companyId: string) => {
        const hasUsers = profiles.some(p => p.company_id === companyId);
        if (hasUsers) {
            alert("Cannot delete a company that still has users assigned to it.");
            return;
        }
        const { error } = await apiClient.from('companies').delete().eq('id', companyId);
        if (error) {
            alert(`Error deleting company: ${error.message}`);
        } else {
            setCompanies(prev => prev.filter(c => c.id !== companyId));
        }
    };
    
    const handleUpdateFocusNote = async (note: { focus_text: string | null; pointers_text: string | null; }) => {
        if (!currentUserProfile) return;
        
        const noteToSave = {
            user_id: currentUserProfile.id,
            focus_text: note.focus_text,
            pointers_text: note.pointers_text,
        };

        const { data, error } = await apiClient.from('focus_notes').upsert(noteToSave).select().single();
        
        if (error) {
            console.error("Error saving focus note:", error);
        } else if (data) {
            setFocusNote(data);
        }
    };

    const handleCreateUser = async (newUser: { name: string; email: string; password: string; role: Role.User | Role.Admin; companyId: string | null }) => {
        const { data: { session: adminSession } } = await apiClient.auth.getSession();
        if (!adminSession) {
            alert("Your session has expired. Please log in again to create a user.");
            handleLogout();
            return;
        }

        const { data: signUpData, error: signUpError } = await apiClient.auth.signUp({
            email: newUser.email,
            password: newUser.password,
        });

        const { error: sessionError } = await apiClient.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
        });

        if (sessionError) {
            alert("Critical error: Could not restore your session after user creation attempt. Please log in again.");
            handleLogout();
            return;
        }

        if (signUpError) {
            alert(`Failed to create user: ${signUpError.message}`);
            return;
        }

        if (!signUpData.user) {
            alert("An unknown error occurred during user creation.");
            return;
        }
        
        const newProfile = {
            id: signUpData.user.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            company_id: newUser.companyId,
        };

        const { data: profileData, error: profileError } = await apiClient.from('profiles').insert(newProfile).select();

        if (profileError) {
            alert(`Authentication account for ${newUser.email} was created, but their profile could not be saved due to an error: ${profileError.message}. Please delete the user from Supabase Authentication and try again.`);
            return;
        }
        
        if (profileData) {
            setProfiles(prev => [...prev, profileData[0]]);
            alert(`Successfully created user: ${newUser.name}`);
        }
    };

    const permissions = useMemo(() => {
        if (!currentUserProfile) {
            return { canEditTasks: false, canAddTask: false, canManageUsers: false, viewableUsers: [] };
        }
        
        const isViewingOwnBoard = viewingUser ? currentUserProfile.id === viewingUser.id : false;
        const isSuperAdmin = currentUserProfile.role === Role.Superadmin;
        const isAdmin = currentUserProfile.role === Role.Admin;

        const viewableUsers = profiles.filter(p => {
            if (isSuperAdmin) return p.id !== currentUserProfile.id;
            if (isAdmin) {
                return p.company_id === currentUserProfile.company_id;
            }
            return p.id === currentUserProfile.id;
        });
        
        const isAdminViewingCompanyUser = isAdmin && viewingUser && viewingUser.company_id === currentUserProfile.company_id && !isViewingOwnBoard;
        const isSuperAdminViewingAnyone = isSuperAdmin && viewingUser && viewingUser.id !== currentUserProfile.id;

        return {
            canEditTasks: isViewingOwnBoard,
            canAddTask: isViewingOwnBoard || isAdminViewingCompanyUser || isSuperAdminViewingAnyone,
            canManageUsers: isSuperAdmin,
            viewableUsers,
        };
    }, [currentUserProfile, viewingUser, profiles]);

    const footerText = useMemo(() => {
        if (currentView === 'focus') return "You are viewing your personal focus notes. This is only visible to you.";
        if (currentView === 'management') return "You are in the system management view.";
        if (!viewingUser) return "Select a user to begin.";

        if (currentView === 'dashboard') {
            return weekRange.start === weekRange.end
                ? `You are viewing analysis for Week ${weekRange.start} / ${TOTAL_WEEKS} for ${viewingUser.name}.`
                : `You are viewing analysis for Weeks ${weekRange.start}-${weekRange.end} for ${viewingUser.name}.`;
        }
        return `You are viewing Week ${currentWeek} / ${TOTAL_WEEKS} for ${viewingUser.name}.`;
    }, [currentView, currentWeek, weekRange, viewingUser]);

    if (!isLoaded) {
        return <div className="flex items-center justify-center h-screen text-2xl font-semibold text-slate-400">Loading WSP...</div>;
    }

    if (!session?.user) {
        const page = isPasswordRecovery
            ? <ResetPasswordPage onResetSuccess={() => setIsPasswordRecovery(false)} />
            : <LoginPage />;
        return (
            <>
                {page}
                {DEV_MODE && <DevUserSwitcher />}
            </>
        );
    }
    
    if (!currentUserProfile) {
        return (
            <>
                <div className="flex items-center justify-center h-screen text-2xl font-semibold text-slate-400">Loading Profile...</div>
                {DEV_MODE && <DevUserSwitcher />}
            </>
        );
    }

    return (
        <>
            <div className="min-h-screen flex flex-col p-4 bg-slate-900 font-sans">
                <Header
                    currentUser={currentUserProfile}
                    viewingUser={viewingUser}
                    allProfiles={profiles}
                    companies={companies}
                    viewableUsers={permissions.viewableUsers}
                    onLogout={handleLogout}
                    onSelectViewUser={handleSetViewingUser}
                    currentView={currentView}
                    onSetCurrentView={handleSetCurrentView}
                    canManageUsers={permissions.canManageUsers}
                />

                <main className="flex flex-col flex-grow w-full max-w-screen-2xl mx-auto">
                    <div className="flex-shrink-0">
                        {(currentView === 'board' || currentView === 'dashboard') && viewingUser && (
                            <div className="relative flex flex-col sm:flex-row flex-wrap items-center justify-center bg-slate-800/50 rounded-lg mb-4 p-1 gap-2">
                                {currentView === 'board' ? (
                                    <WeekSelector currentWeek={currentWeek} setCurrentWeek={setCurrentWeek} />
                                ) : (
                                    <WeekRangeSelector weekRange={weekRange} setWeekRange={setWeekRange} />
                                )}
                                <div className="sm:absolute sm:right-2 sm:top-1/2 sm:-translate-y-1/2">
                                    <DownloadTasks 
                                        allTasks={tasks.filter(t => t.user_id === viewingUser.id)}
                                        viewingUser={viewingUser}
                                        initialStartWeek={currentView === 'board' ? currentWeek : weekRange.start}
                                        initialEndWeek={currentView === 'board' ? currentWeek : weekRange.end}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {currentView === 'focus' ? (
                        <FocusView note={focusNote} onSave={handleUpdateFocusNote} />
                    ) : currentView === 'management' && permissions.canManageUsers ? (
                        <ManagementView
                            profiles={profiles}
                            companies={companies}
                            currentUser={currentUserProfile}
                            onAddCompany={handleAddCompany}
                            onDeleteCompany={handleDeleteCompany}
                            onUpdateUserProfile={handleUpdateUserProfile}
                            onDeleteUser={handleDeleteUser}
                            onCreateUser={handleCreateUser}
                        />
                    ) : currentUserProfile.role === Role.Superadmin && !viewingUser ? (
                        <div className="flex flex-col flex-grow items-center justify-center">
                            <div className="text-center p-10 bg-slate-800/50 rounded-xl">
                                <h2 className="text-2xl font-bold text-slate-300">Welcome, Super Admin!</h2>
                                <p className="mt-4 text-slate-400">There are no other users in the system to view.</p>
                                <p className="mt-2 text-slate-400">Go to the 'Management' view to add companies and manage users.</p>
                            </div>
                        </div>
                    ) : !viewingUser ? (
                        <div className="flex items-center justify-center h-full text-2xl font-semibold text-slate-400">Loading user data...</div>
                    ) : (
                        <>
                            {currentView === 'board' && (
                                <TaskBoard
                                    currentWeek={currentWeek}
                                    tasks={tasks.filter(t => t.user_id === viewingUser.id)}
                                    onAddTask={(week, day, text) => handleAddTask(viewingUser.id, week, day, text)}
                                    onUpdateTask={handleUpdateTask}
                                    onDeleteTask={handleDeleteTask}
                                    canEditTasks={permissions.canEditTasks}
                                    canAddTask={permissions.canAddTask}
                                />
                            )}

                            {currentView === 'dashboard' && (
                                <Dashboard
                                    startWeek={weekRange.start}
                                    endWeek={weekRange.end}
                                    userTasks={tasks.filter(t => t.user_id === viewingUser.id)}
                                    viewingUser={viewingUser}
                                />
                            )}
                            
                            {currentView === 'calendar' && (
                                <YearCalendarView
                                    financialYearStartDate={financialYearStart}
                                    financialYearString={financialYearLabel}
                                />
                            )}
                        </>
                    )}
                </main>

                <footer className="flex items-center justify-between py-4 text-slate-500 text-sm mt-auto border-t border-slate-800">
                    <p>{footerText}</p>
                    <div className="flex items-center justify-end gap-1 opacity-60">
                        <svg width="12" height="12" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <rect x="80" y="0" width="120" height="80" fill="#F4911E"/>
                            <rect x="0" y="80" width="80" height="120" fill="#F4911E"/>
                            <rect x="80" y="80" width="120" height="120" fill="#0098DA"/>
                            <text x="140" y="140" fontFamily="sans-serif" fontSize="36" fontWeight="300" fill="white" textAnchor="middle" dominantBaseline="middle" letterSpacing="1">IndiPro</text>
                        </svg>
                        <span className="text-slate-500" style={{ fontSize: '0.65rem' }}>Indipro skill and services private limited</span>
                    </div>
                </footer>
            </div>
            {DEV_MODE && <DevUserSwitcher />}
        </>
    );
};

export default App;
