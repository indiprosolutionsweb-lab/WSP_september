
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Day, Task, TaskStatus, Profile, Role, Company, FocusNote, UnplannedTask } from './types.ts';
import { TOTAL_WEEKS } from './constants.ts';
import { WeekSelector } from './components/WeekSelector.tsx';
import { TaskBoard } from './components/TaskBoard.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Header } from './components/Header.tsx';
import { ManagementView } from './components/ManagementView.tsx';
import { YearCalendarView } from './components/YearCalendarView.tsx';
import { DownloadTasks } from './components/DownloadTasks.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { ResetPasswordPage } from './components/ResetPasswordPage.tsx';
import { FocusView } from './components/FocusView.tsx';
import { UnplannedTasksView } from './components/UnplannedTasksView.tsx';
import { apiClient, DEV_MODE } from './apiClient.ts';
import { getWeekNumber, getFinancialYearDetailsForDate } from './dateUtils.ts';
import { DevUserSwitcher } from './components/DevUserSwitcher.tsx';
import { WeekRangeSelector } from './components/WeekRangeSelector.tsx';
import { TasksListView } from './components/TasksListView.tsx';


const App: React.FC = () => {
    // Data states
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [unplannedTasks, setUnplannedTasks] = useState<UnplannedTask[]>([]);
    const [focusNote, setFocusNote] = useState<FocusNote | null>(null);
    
    // App states
    const [session, setSession] = useState<any | null>(null);
    const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
    const [viewingUser, setViewingUser] = useState<Profile | null>(null);
    const [currentWeek, setCurrentWeek] = useState<number>(1);
    const [weekRange, setWeekRange] = useState({ start: 1, end: 1 });
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [currentView, setCurrentView] = useState<'board' | 'dashboard' | 'focus' | 'management' | 'calendar' | 'upcoming' | 'tasks-list'>('board');
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
        if (viewingUser && companies.length > 0) {
            const userCompany = companies.find(c => c.id === viewingUser.company_id);
            const userCalendarStart = userCompany?.calendar_start_month || 'April';
            const newCurrentWeek = getWeekNumber(new Date(), userCalendarStart);
            setCurrentWeek(newCurrentWeek);
            setWeekRange({ start: newCurrentWeek, end: newCurrentWeek });
        }
    }, [viewingUser, companies]);

    // Fetch data on session change
    useEffect(() => {
        const fetchAllData = async (userId: string) => {
            try {
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

                // Fetch personal data only for the logged-in user
                const { data: unplannedData, error: unplannedError } = await apiClient.from('unplanned_tasks').select('*').eq('user_id', userId);
                if (unplannedError) throw unplannedError;
                setUnplannedTasks(unplannedData || []);

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
            setIsLoaded(true); 
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
        if (userToView && currentUserProfile) {
            setViewingUser(userToView);
            
            if (userToView.id !== currentUserProfile.id) {
                const personalViews: typeof currentView[] = ['tasks-list', 'focus', 'upcoming'];
                if (personalViews.includes(currentView)) {
                    setCurrentView('board');
                }
            }
        }
    };

    const handleSetCurrentView = (view: 'board' | 'dashboard' | 'focus' | 'management' | 'calendar' | 'upcoming' | 'tasks-list') => {
        if (view === 'dashboard' && currentView !== 'dashboard') {
            setWeekRange({ start: currentWeek, end: currentWeek });
        }
        setCurrentView(view);
    };

    const handleAddTask = async (userId: string, week: number, day: Day, taskText: string) => {
        const newTaskPayload = { user_id: userId, week_number: week, day: day, text: taskText, status: TaskStatus.Incomplete, time_taken: 0, is_priority: false };
        const { data, error } = await apiClient.from('tasks').insert(newTaskPayload).select();
        if (error) console.error("Error adding task:", error);
        else if (data) setTasks(prev => [...prev, data[0] as Task]);
    };
    
    const handleUpdateTask = async (updatedTask: Task) => {
        const { id, ...updateData } = updatedTask;
        const { error } = await apiClient.from('tasks').update(updateData).eq('id', id);
        if (error) console.error("Error updating task:", error);
        else setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    };

    const handleDeleteTask = async (taskId: string) => {
        const { error } = await apiClient.from('tasks').delete().eq('id', taskId);
        if (error) console.error("Error deleting task:", error);
        else setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const handleAddUnplannedTask = async (text: string) => {
        if (!currentUserProfile) return;
        const newTaskPayload = { user_id: currentUserProfile.id, text: text, status: TaskStatus.Incomplete, time_taken: 0, is_priority: false };
        const { data, error } = await apiClient.from('unplanned_tasks').insert(newTaskPayload).select();
        if (error) console.error("Error adding unplanned task:", error);
        else if (data) setUnplannedTasks(prev => [...prev, data[0] as UnplannedTask]);
    };

    const handleUpdateUnplannedTask = async (updatedTask: UnplannedTask) => {
        const { id, ...updateData } = updatedTask;
        const { error } = await apiClient.from('unplanned_tasks').update(updateData).eq('id', id);
        if (error) console.error("Error updating unplanned task:", error);
        else setUnplannedTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    };

    const handleDeleteUnplannedTask = async (taskId: string) => {
        const { error } = await apiClient.from('unplanned_tasks').delete().eq('id', taskId);
        if (error) console.error("Error deleting unplanned task:", error);
        else setUnplannedTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const handlePlanTask = async (taskToPlan: UnplannedTask, week: number, day: Day) => {
        const newPlannedTaskPayload = { user_id: taskToPlan.user_id, week_number: week, day: day, text: taskToPlan.text, status: taskToPlan.status, time_taken: taskToPlan.time_taken, is_priority: taskToPlan.is_priority };
        const { data, error } = await apiClient.from('tasks').insert(newPlannedTaskPayload).select();
        if (error || !data) {
            console.error("Error creating planned task:", error);
            alert("Could not plan the task. Please try again.");
            return;
        }
        setTasks(prev => [...prev, data[0] as Task]);
        await handleDeleteUnplannedTask(taskToPlan.id);
    };

    const handleDeleteUser = async (profileId: string) => {
        await apiClient.from('tasks').delete().eq('user_id', profileId);
        await apiClient.from('profiles').delete().eq('id', profileId);
        setTasks(prev => prev.filter(t => t.user_id !== profileId));
        const remainingProfiles = profiles.filter(p => p.id !== profileId);
        setProfiles(remainingProfiles);
        if (viewingUser?.id === profileId) setViewingUser(remainingProfiles.find(p => p.role !== Role.Superadmin) || null);
    };
    
    const handleAddCompany = async (companyName: string, calendarStartMonth: 'January' | 'April') => {
        const { data, error } = await apiClient.from('companies').insert({ name: companyName, calendar_start_month: calendarStartMonth }).select();
        if (error) alert(`Error adding company: ${error.message}`);
        else if (data) setCompanies(prev => [...prev, data[0]]);
    };
    
    const handleUpdateUserProfile = async (profile: Profile) => {
        const { id, ...updateData } = profile;
        const { error } = await apiClient.from('profiles').update(updateData).eq('id', id);
        if (error) alert(`Error updating profile: ${error.message}`);
        else setProfiles(prev => prev.map(p => p.id === id ? profile : p));
    };

    const handleDeleteCompany = async (companyId: string) => {
        if (profiles.some(p => p.company_id === companyId)) {
            alert("Cannot delete a company that still has users assigned to it.");
            return;
        }
        const { error } = await apiClient.from('companies').delete().eq('id', companyId);
        if (error) alert(`Error deleting company: ${error.message}`);
        else setCompanies(prev => prev.filter(c => c.id !== companyId));
    };
    
    const handleUpdateFocusNote = async (note: { focus_text: string | null; pointers_text: string | null; }) => {
        if (!currentUserProfile) return;
        const noteToSave = { user_id: currentUserProfile.id, focus_text: note.focus_text, pointers_text: note.pointers_text };
        const { data, error } = await apiClient.from('focus_notes').upsert(noteToSave).select().single();
        if (error) console.error("Error saving focus note:", error);
        else if (data) setFocusNote(data);
    };

    const handleCreateUser = async (newUser: { name: string; email: string; password: string; role: Role.User | Role.Admin; companyId: string | null }) => {
        const { data: { session: adminSession } } = await apiClient.auth.getSession();
        if (!adminSession) { alert("Session expired. Please log in again."); handleLogout(); return; }
        const { data: signUpData, error: signUpError } = await apiClient.auth.signUp({ email: newUser.email, password: newUser.password });
        const { error: sessionError } = await apiClient.auth.setSession({ access_token: adminSession.access_token, refresh_token: adminSession.refresh_token });
        if (sessionError) { alert("Could not restore session. Please log in again."); handleLogout(); return; }
        if (signUpError) { alert(`Failed to create user: ${signUpError.message}`); return; }
        if (!signUpData.user) { alert("Unknown error during user creation."); return; }
        const newProfile = { id: signUpData.user.id, name: newUser.name, email: newUser.email, role: newUser.role, company_id: newUser.companyId };
        const { data: profileData, error: profileError } = await apiClient.from('profiles').insert(newProfile).select();
        if (profileError) { alert(`Auth account created, but profile could not be saved: ${profileError.message}. Please delete user from Supabase Auth and try again.`); return; }
        if (profileData) { setProfiles(prev => [...prev, profileData[0]]); alert(`Successfully created user: ${newUser.name}`); }
    };

    const permissions = useMemo(() => {
        if (!currentUserProfile) return { canEditTasks: false, canAddTask: false, canManageUsers: false, viewableUsers: [] };
        const isViewingOwnBoard = viewingUser ? currentUserProfile.id === viewingUser.id : false;
        const isSuperAdmin = currentUserProfile.role === Role.Superadmin;
        const isAdmin = currentUserProfile.role === Role.Admin;
        const viewableUsers = profiles.filter(p => isSuperAdmin ? p.id !== currentUserProfile.id : isAdmin ? p.company_id === currentUserProfile.company_id : p.id === currentUserProfile.id);
        const isAdminViewingCompanyUser = isAdmin && viewingUser && viewingUser.company_id === currentUserProfile.company_id && !isViewingOwnBoard;
        const isSuperAdminViewingAnyone = isSuperAdmin && viewingUser && viewingUser.id !== currentUserProfile.id;
        return { canEditTasks: isViewingOwnBoard, canAddTask: isViewingOwnBoard || isAdminViewingCompanyUser || isSuperAdminViewingAnyone, canManageUsers: isSuperAdmin, viewableUsers };
    }, [currentUserProfile, viewingUser, profiles]);

    const footerText = useMemo(() => {
        if (currentView === 'upcoming') return "You are viewing your upcoming tasks. This is only visible to you.";
        if (currentView === 'focus') return "You are viewing your personal focus notes. This is only visible to you.";
        if (currentView === 'management') return "You are in the system management view.";
        if (!viewingUser) return "Select a user to begin.";
        if (currentView === 'tasks-list') return `You are viewing a filterable list of tasks for ${viewingUser.name}.`;
        if (currentView === 'dashboard') return `Viewing analysis for Weeks ${weekRange.start}-${weekRange.end} for ${viewingUser.name}.`;
        return `You are viewing Week ${currentWeek} / ${TOTAL_WEEKS} for ${viewingUser.name}.`;
    }, [currentView, currentWeek, weekRange, viewingUser]);

    if (!isLoaded) return <div className="flex items-center justify-center h-screen text-2xl font-semibold text-slate-400">Loading WSP...</div>;
    if (!session?.user) return <>{isPasswordRecovery ? <ResetPasswordPage onResetSuccess={() => setIsPasswordRecovery(false)} /> : <LoginPage />}{DEV_MODE && <DevUserSwitcher />}</>;
    if (!currentUserProfile) return <>{<div className="flex items-center justify-center h-screen text-2xl font-semibold text-slate-400">Loading Profile...</div>}{DEV_MODE && <DevUserSwitcher />}</>;

    return (
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
                            {currentView === 'board' ? <WeekSelector currentWeek={currentWeek} setCurrentWeek={setCurrentWeek} /> : <WeekRangeSelector weekRange={weekRange} setWeekRange={setWeekRange} />}
                            <div className="sm:absolute sm:right-2 sm:top-1/2 sm:-translate-y-1/2">
                                <DownloadTasks allTasks={tasks.filter(t => t.user_id === viewingUser.id)} viewingUser={viewingUser} initialStartWeek={currentView === 'board' ? currentWeek : weekRange.start} initialEndWeek={currentView === 'board' ? currentWeek : weekRange.end} />
                            </div>
                        </div>
                    )}
                </div>
                {currentView === 'upcoming' ? <UnplannedTasksView unplannedTasks={unplannedTasks} onAddTask={handleAddUnplannedTask} onUpdateTask={handleUpdateUnplannedTask} onDeleteTask={handleDeleteUnplannedTask} onPlanTask={handlePlanTask} currentWeek={currentWeek} />
                : currentView === 'focus' ? <FocusView note={focusNote} onSave={handleUpdateFocusNote} />
                : currentView === 'management' && permissions.canManageUsers ? <ManagementView profiles={profiles} companies={companies} currentUser={currentUserProfile} onAddCompany={handleAddCompany} onDeleteCompany={handleDeleteCompany} onUpdateUserProfile={handleUpdateUserProfile} onDeleteUser={handleDeleteUser} onCreateUser={handleCreateUser} />
                : currentView === 'tasks-list' && viewingUser ? <TasksListView userTasks={tasks.filter(t => t.user_id === viewingUser.id)} viewingUser={viewingUser} initialWeek={currentWeek} />
                : currentUserProfile.role === Role.Superadmin && !viewingUser ? <div className="flex flex-col flex-grow items-center justify-center"><div className="text-center p-10 bg-slate-800/50 rounded-xl"><h2 className="text-2xl font-bold text-slate-300">Welcome, Super Admin!</h2><p className="mt-4 text-slate-400">There are no other users to view. Go to 'Management' to add companies and users.</p></div></div>
                : !viewingUser ? <div className="flex items-center justify-center h-full text-2xl font-semibold text-slate-400">Loading user data...</div>
                : <>
                    {currentView === 'board' && <TaskBoard currentWeek={currentWeek} tasks={tasks.filter(t => t.user_id === viewingUser.id)} onAddTask={(week, day, text) => handleAddTask(viewingUser.id, week, day, text)} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} canEditTasks={permissions.canEditTasks} canAddTask={permissions.canAddTask} />}
                    {currentView === 'dashboard' && <Dashboard startWeek={weekRange.start} endWeek={weekRange.end} userTasks={tasks.filter(t => t.user_id === viewingUser.id)} viewingUser={viewingUser} />}
                    {currentView === 'calendar' && <YearCalendarView financialYearStartDate={financialYearStart} financialYearString={financialYearLabel} />}
                </>}
            </main>
            <footer className="flex items-center justify-between py-4 text-slate-500 text-sm mt-auto border-t border-slate-800">
                <p>{footerText}</p>
                 <div className="flex items-center justify-end gap-1 opacity-60">
                    <svg width="12" height="12" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <rect x="80" y="0" width="120" height="80" fill="#F4911E"/>
                        <rect x="0" y="80" width="80" height="120" fill="#F4911E"/>
                        <rect x="80" y="80" width="120" height="120" fill="#0098DA"/>
                    </svg>
                    <span className="text-slate-500" style={{ fontSize: '0.65rem' }}>Indipro skill and services private limited</span>
                </div>
            </footer>
            {DEV_MODE && <DevUserSwitcher />}
        </div>
    );
};

export default App;
