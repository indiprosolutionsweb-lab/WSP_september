import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
    const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [viewingUserTasks, setViewingUserTasks] = useState<Task[]>([]);
    const [unplannedTasks, setUnplannedTasks] = useState<UnplannedTask[]>([]);
    const [focusNote, setFocusNote] = useState<FocusNote | null>(null);
    
    // App states
    const [session, setSession] = useState<any | null>(null);
    const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
    const [viewingUser, setViewingUser] = useState<Profile | null>(null);
    
    // Persisted states
    const [currentView, setCurrentView] = useState<'board' | 'dashboard' | 'focus' | 'management' | 'calendar' | 'upcoming' | 'tasks-list'>(() => {
        const saved = sessionStorage.getItem('wsp_current_view');
        const validViews = ['board', 'dashboard', 'focus', 'management', 'calendar', 'upcoming', 'tasks-list'];
        return (saved && validViews.includes(saved) ? saved : 'board') as 'board' | 'dashboard' | 'focus' | 'management' | 'calendar' | 'upcoming' | 'tasks-list';
    });
    
    const [currentWeek, setCurrentWeek] = useState<number>(() => {
        const saved = sessionStorage.getItem('wsp_current_week');
        return saved ? parseInt(saved, 10) : 0; // Use 0 as a sentinel for "not yet calculated"
    });

    const [weekRange, setWeekRange] = useState(() => {
        const saved = sessionStorage.getItem('wsp_week_range');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { /* ignore corrupted data */ }
        }
        const savedWeek = sessionStorage.getItem('wsp_current_week');
        const week = savedWeek ? parseInt(savedWeek, 10) : 1;
        return { start: week, end: week };
    });

    const [isLoaded, setIsLoaded] = useState<boolean>(false); // For initial profile/company load
    const [isTasksLoading, setIsTasksLoading] = useState<boolean>(true); // For user-specific task loading
    const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);
    const isPerformingAdminActionRef = useRef(false); // Ref to prevent session switch during admin actions

    // Derived state for calendar settings based on the user being viewed
    const viewingCompany = useMemo(() => {
        return companies.find(c => c.id === viewingUser?.company_id);
    }, [companies, viewingUser]);
    const calendarStartMonth = useMemo(() => viewingCompany?.calendar_start_month || 'April', [viewingCompany]);
    
    // Authentication
    useEffect(() => {
        const { data: { subscription } } = apiClient.auth.onAuthStateChange((event: string, session: any) => {
             if (isPerformingAdminActionRef.current) {
                return; // Ignore auth state changes during admin actions
             }
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
    
    // State persistence effects
    useEffect(() => {
        if (currentWeek > 0) {
            sessionStorage.setItem('wsp_current_week', currentWeek.toString());
        }
    }, [currentWeek]);

    useEffect(() => {
        if (viewingUser) {
            sessionStorage.setItem('wsp_viewing_user_id', viewingUser.id);
        }
    }, [viewingUser]);

    useEffect(() => {
        sessionStorage.setItem('wsp_week_range', JSON.stringify(weekRange));
    }, [weekRange]);

    useEffect(() => {
        sessionStorage.setItem('wsp_current_view', currentView);
    }, [currentView]);

    // Calculate initial week only if not already set from session storage
    useEffect(() => {
        if (currentWeek === 0 && viewingUser && companies.length > 0) {
            const userCompany = companies.find(c => c.id === viewingUser.company_id);
            const userCalendarStart = userCompany?.calendar_start_month || 'April';
            const newCurrentWeek = getWeekNumber(new Date(), userCalendarStart, userCompany?.name);
            setCurrentWeek(newCurrentWeek);
            setWeekRange({ start: newCurrentWeek, end: newCurrentWeek });
        }
    }, [viewingUser, companies, currentWeek]);

    // Fetch initial non-task data on session change
    useEffect(() => {
        const fetchInitialData = async (userId: string) => {
            try {
                const { data: companyData, error: companyError } = await apiClient.from('companies').select('*');
                if (companyError) throw companyError;
                setCompanies(companyData || []);

                const { data: profileData, error: profileError } = await apiClient.from('profiles').select('*');
                if (profileError) throw profileError;
                setAllProfiles(profileData || []);
                
                const userProfile = profileData?.find(p => p.id === userId);
                if (userProfile) {
                     setCurrentUserProfile(userProfile);

                     // --- START: MODIFIED USER VIEWING LOGIC ---
                     const savedViewingUserId = sessionStorage.getItem('wsp_viewing_user_id');
                     const isSuperAdmin = userProfile.role === Role.Superadmin;
                     const isAdmin = userProfile.role === Role.Admin;

                     const potentialUserToView = savedViewingUserId ? profileData.find(p => p.id === savedViewingUserId) : undefined;
                     
                     let userIsValidAndPermitted = false;
                     if (potentialUserToView) {
                        if (isSuperAdmin) {
                            userIsValidAndPermitted = true;
                        } else if (isAdmin) {
                            userIsValidAndPermitted = potentialUserToView.company_id === userProfile.company_id;
                        } else { // is User
                            userIsValidAndPermitted = potentialUserToView.id === userProfile.id;
                        }
                     }

                     if (potentialUserToView && userIsValidAndPermitted) {
                        setViewingUser(potentialUserToView);
                     } else {
                        // Fallback logic
                        if (isSuperAdmin) {
                            const firstUserToView = profileData.find(p => p.id !== userProfile.id);
                            setViewingUser(firstUserToView || null);
                        } else {
                            setViewingUser(userProfile);
                        }
                     }
                     // --- END: MODIFIED USER VIEWING LOGIC ---

                } else {
                    console.error("Current user's profile not found!");
                    await apiClient.auth.signOut();
                }

                // Fetch personal data only for the logged-in user
                const { data: unplannedData, error: unplannedError } = await apiClient.from('unplanned_tasks').select('*').eq('user_id', userId);
                if (unplannedError) throw unplannedError;
                setUnplannedTasks(unplannedData || []);

                const { data: focusData, error: focusError } = await apiClient.from('focus_notes').select('*').eq('user_id', userId).maybeSingle();
                if (focusError) throw focusError;
                setFocusNote(focusData);

            } catch (error) {
                console.error("Error fetching initial data:", error);
            } finally {
                setIsLoaded(true);
            }
        };

        if (session?.user) {
            fetchInitialData(session.user.id);
        } else {
            setIsLoaded(true); 
        }
    }, [session]);

    // Fetch tasks for the specific user being viewed
    useEffect(() => {
        const fetchTasksForUser = async (userId: string) => {
            setIsTasksLoading(true);
            try {
                const { data, error } = await apiClient.from('tasks').select('*').eq('user_id', userId);
                if (error) throw error;
                setViewingUserTasks(data || []);
            } catch (error) {
                console.error("Error fetching tasks for user:", error);
                setViewingUserTasks([]); // Clear tasks on error
            } finally {
                setIsTasksLoading(false);
            }
        };

        if (viewingUser) {
            fetchTasksForUser(viewingUser.id);
        } else {
            setViewingUserTasks([]); // Clear tasks if no user is being viewed
            setIsTasksLoading(false);
        }
    }, [viewingUser]);
    
    const { financialYearStart, financialYearLabel } = useMemo(
        () => getFinancialYearDetailsForDate(new Date(), calendarStartMonth, viewingCompany?.name),
        [calendarStartMonth, viewingCompany]
    );

    const handleLogout = async () => {
        sessionStorage.removeItem('wsp_current_week');
        sessionStorage.removeItem('wsp_week_range');
        sessionStorage.removeItem('wsp_current_view');
        sessionStorage.removeItem('wsp_viewing_user_id');
        await apiClient.auth.signOut();
        setSession(null);
        setCurrentUserProfile(null);
    };

    const handleSetViewingUser = (userId: string) => {
        const userToView = allProfiles.find(p => p.id === userId);
        if (userToView && currentUserProfile) {
            setViewingUser(userToView);
            
            // When switching users, recalculate the current week based on the new user's company calendar.
            const userCompany = companies.find(c => c.id === userToView.company_id);
            const userCalendarStart = userCompany?.calendar_start_month || 'April'; // Default to April if no company
            const newCurrentWeek = getWeekNumber(new Date(), userCalendarStart, userCompany?.name);
            setCurrentWeek(newCurrentWeek);

            // Also reset the dashboard range to the new current week
            if (currentView === 'dashboard') {
                setWeekRange({ start: newCurrentWeek, end: newCurrentWeek });
            }
            
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
        // Optimistic Update for faster UI response
        if (!viewingUser || userId !== viewingUser.id) return;

        const tempId = `temp-${crypto.randomUUID()}`;
        const optimisticTask: Task = {
            id: tempId,
            user_id: userId,
            week_number: week,
            day: day,
            text: taskText,
            status: TaskStatus.Incomplete,
            time_taken: 0,
            is_priority: false,
            created_at: new Date().toISOString(),
        };

        setViewingUserTasks(prev => [...prev, optimisticTask]);

        const newTaskPayload = { user_id: userId, week_number: week, day: day, text: taskText, status: TaskStatus.Incomplete, time_taken: 0, is_priority: false };
        const { data, error } = await apiClient.from('tasks').insert(newTaskPayload).select();
        
        if (error) {
            console.error("Error adding task:", error);
            alert("Failed to add the task. Please try again.");
            // Rollback on error
            setViewingUserTasks(prev => prev.filter(t => t.id !== tempId));
        } else if (data) {
            // Replace temporary task with real one from DB
            const savedTask = data[0] as Task;
            setViewingUserTasks(prev => prev.map(t => t.id === tempId ? savedTask : t));
        }
    };
    
    const handleUpdateTask = async (updatedTask: Task) => {
        const { id, ...updateData } = updatedTask;
        const { error } = await apiClient.from('tasks').update(updateData).eq('id', id);
        if (error) console.error("Error updating task:", error);
        else if (viewingUser && updatedTask.user_id === viewingUser.id) {
            setViewingUserTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        const { error } = await apiClient.from('tasks').delete().eq('id', taskId);
        if (error) console.error("Error deleting task:", error);
        else setViewingUserTasks(prev => prev.filter(t => t.id !== taskId));
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
        if (viewingUser && taskToPlan.user_id === viewingUser.id) {
            setViewingUserTasks(prev => [...prev, data[0] as Task]);
        }
        await handleDeleteUnplannedTask(taskToPlan.id);
    };

    const handleDeleteUser = async (profileId: string) => {
        await apiClient.from('tasks').delete().eq('user_id', profileId);
        await apiClient.from('profiles').delete().eq('id', profileId);
        const remainingProfiles = allProfiles.filter(p => p.id !== profileId);
        setAllProfiles(remainingProfiles);
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
        else setAllProfiles(prev => prev.map(p => p.id === id ? profile : p));
    };

    const handleDeleteCompany = async (companyId: string) => {
        if (allProfiles.some(p => p.company_id === companyId)) {
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
        isPerformingAdminActionRef.current = true;
        try {
            const { data: { session: adminSession } } = await apiClient.auth.getSession();
            if (!adminSession) {
                alert("Session expired. Please log in again.");
                handleLogout();
                return;
            }

            const { data: signUpData, error: signUpError } = await apiClient.auth.signUp({ email: newUser.email, password: newUser.password });
            
            // Immediately restore the admin's session.
            const { error: sessionError } = await apiClient.auth.setSession({ access_token: adminSession.access_token, refresh_token: adminSession.refresh_token });
            if (sessionError) {
                alert("Could not restore your admin session. Please log in again.");
                handleLogout();
                return;
            }

            if (signUpError) {
                alert(`Failed to create user: ${signUpError.message}`);
                return;
            }
            if (!signUpData.user) {
                alert("Unknown error during user creation.");
                return;
            }

            const newProfile = { id: signUpData.user.id, name: newUser.name, email: newUser.email, role: newUser.role, company_id: newUser.companyId };
            const { data: profileData, error: profileError } = await apiClient.from('profiles').insert(newProfile).select();
            if (profileError) {
                alert(`Auth account created, but profile could not be saved: ${profileError.message}. Please delete user from Supabase Auth and try again.`);
                return;
            }
            if (profileData) {
                setAllProfiles(prev => [...prev, profileData[0]]);
                alert(`Successfully created user: ${newUser.name}`);
            }
        } finally {
            isPerformingAdminActionRef.current = false;
        }
    };

    const permissions = useMemo(() => {
        if (!currentUserProfile) return { canEditTasks: false, canAddTask: false, canManageUsers: false, viewableUsers: [] };
        const isViewingOwnBoard = viewingUser ? currentUserProfile.id === viewingUser.id : false;
        const isSuperAdmin = currentUserProfile.role === Role.Superadmin;
        const isAdmin = currentUserProfile.role === Role.Admin;
        const viewableUsers = allProfiles.filter(p => isSuperAdmin ? p.id !== currentUserProfile.id : isAdmin ? p.company_id === currentUserProfile.company_id : p.id === currentUserProfile.id);
        const isAdminViewingCompanyUser = isAdmin && viewingUser && viewingUser.company_id === currentUserProfile.company_id && !isViewingOwnBoard;
        const isSuperAdminViewingAnyone = isSuperAdmin && viewingUser && viewingUser.id !== currentUserProfile.id;
        return { canEditTasks: isViewingOwnBoard, canAddTask: isViewingOwnBoard || isAdminViewingCompanyUser || isSuperAdminViewingAnyone, canManageUsers: isSuperAdmin, viewableUsers };
    }, [currentUserProfile, viewingUser, allProfiles]);

    const footerText = useMemo(() => {
        if (currentView === 'upcoming') return "You are viewing your upcoming tasks. This is only visible to you.";
        if (currentView === 'focus') return "You are viewing your personal focus notes. This is only visible to you.";
        if (currentView === 'management') return "You are in the system management view.";
        if (!viewingUser) return "Select a user to begin.";
        if (currentView === 'tasks-list') return `You are viewing a filterable list of tasks for ${viewingUser.name}.`;
        if (currentView === 'dashboard') return `Viewing analysis for Weeks ${weekRange.start}-${weekRange.end} for ${viewingUser.name}.`;
        return `You are viewing Week ${currentWeek} / ${TOTAL_WEEKS} for ${viewingUser.name}.`;
    }, [currentView, currentWeek, weekRange, viewingUser]);
    
    const renderContent = () => {
        if (isTasksLoading && viewingUser) {
            return <div className="flex-grow flex items-center justify-center text-xl text-slate-400">Loading tasks for {viewingUser.name}...</div>;
        }
        if (currentView === 'upcoming') return <UnplannedTasksView unplannedTasks={unplannedTasks} onAddTask={handleAddUnplannedTask} onUpdateTask={handleUpdateUnplannedTask} onDeleteTask={handleDeleteUnplannedTask} onPlanTask={handlePlanTask} currentWeek={currentWeek} />;
        if (currentView === 'focus') return <FocusView note={focusNote} onSave={handleUpdateFocusNote} />;
        if (currentView === 'management' && permissions.canManageUsers) return <ManagementView companies={companies} currentUser={currentUserProfile} onAddCompany={handleAddCompany} onDeleteCompany={handleDeleteCompany} onUpdateUserProfile={handleUpdateUserProfile} onDeleteUser={handleDeleteUser} onCreateUser={handleCreateUser} />;
        if (currentView === 'tasks-list' && viewingUser) return <TasksListView userTasks={viewingUserTasks} viewingUser={viewingUser} initialWeek={currentWeek} />;
        if (currentUserProfile.role === Role.Superadmin && !viewingUser) return <div className="flex flex-col flex-grow items-center justify-center"><div className="text-center p-10 bg-slate-800/50 rounded-xl"><h2 className="text-2xl font-bold text-slate-300">Welcome, Super Admin!</h2><p className="mt-4 text-slate-400">There are no other users to view. Go to 'Management' to add companies and users.</p></div></div>;
        if (!viewingUser) return <div className="flex items-center justify-center h-full text-2xl font-semibold text-slate-400">Loading user data...</div>;
        
        return <>
            {currentView === 'board' && <TaskBoard currentWeek={currentWeek} tasks={viewingUserTasks} onAddTask={(week, day, text) => handleAddTask(viewingUser.id, week, day, text)} onUpdateTask={handleUpdateTask} onDeleteTask={handleDeleteTask} canEditTasks={permissions.canEditTasks} canAddTask={permissions.canAddTask} />}
            {currentView === 'dashboard' && <Dashboard startWeek={weekRange.start} endWeek={weekRange.end} viewingUser={viewingUser} />}
            {currentView === 'calendar' && <YearCalendarView financialYearStartDate={financialYearStart} financialYearString={financialYearLabel} />}
        </>;
    }


    if (!isLoaded) return <div className="flex items-center justify-center h-screen text-2xl font-semibold text-slate-400">Loading WSP...</div>;
    if (!session?.user) return <>{isPasswordRecovery ? <ResetPasswordPage onResetSuccess={() => setIsPasswordRecovery(false)} /> : <LoginPage />}{DEV_MODE && <DevUserSwitcher />}</>;
    if (!currentUserProfile) return <>{<div className="flex items-center justify-center h-screen text-2xl font-semibold text-slate-400">Loading Profile...</div>}{DEV_MODE && <DevUserSwitcher />}</>;

    return (
        <div className="min-h-screen flex flex-col p-4 bg-slate-900 font-sans">
            <Header
                currentUser={currentUserProfile}
                viewingUser={viewingUser}
                allProfiles={allProfiles}
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
                                <DownloadTasks allTasks={viewingUserTasks} viewingUser={viewingUser} initialStartWeek={currentView === 'board' ? currentWeek : weekRange.start} initialEndWeek={currentView === 'board' ? currentWeek : weekRange.end} />
                            </div>
                        </div>
                    )}
                </div>
                {renderContent()}
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
