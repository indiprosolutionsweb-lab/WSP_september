import React, { useState, useMemo, useEffect } from 'react';
import { Profile, Role, Company } from '../types.ts';
import { TrashIcon, DownloadIcon } from './icons.tsx';
import { ConfirmationModal } from './ConfirmationModal.tsx';
import { Pagination } from './Pagination.tsx';
import { apiClient } from '../apiClient.ts';

interface ManagementViewProps {
    // profiles is no longer passed; this component fetches its own data.
    companies: Company[];
    currentUser: Profile;
    onAddCompany: (companyName: string, calendarStartMonth: 'January' | 'April') => Promise<void>;
    onDeleteCompany: (companyId: string) => Promise<void>;
    onUpdateUserProfile: (profile: Profile) => Promise<void>;
    onDeleteUser: (profileId: string) => Promise<void>;
    onCreateUser: (newUser: { name: string; email: string; password: string; role: Role.User | Role.Admin; companyId: string | null }) => Promise<void>;
}

const escapeCsvField = (field: string | null | undefined): string => {
    const str = String(field || '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        const escapedStr = str.replace(/"/g, '""');
        return `"${escapedStr}"`;
    }
    return str;
};

const USERS_PER_PAGE = 10;

export const ManagementView: React.FC<ManagementViewProps> = ({ companies, currentUser, onAddCompany, onDeleteCompany, onUpdateUserProfile, onDeleteUser, onCreateUser }) => {
    const [newCompanyName, setNewCompanyName] = useState('');
    const [newCompanyCalendar, setNewCompanyCalendar] = useState<'January' | 'April'>('April');

    // New User Form State
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<Role.User | Role.Admin>(Role.User);
    const [newUserCompanyId, setNewUserCompanyId] = useState<string>('');
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [creationError, setCreationError] = useState('');

    const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || 'unassigned');
    const [currentPage, setCurrentPage] = useState(1);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    // State to hold fetched users, loading status, and total count
    const [viewState, setViewState] = useState<{
        users: Profile[];
        isLoading: boolean;
        totalUsers: number;
        error: string | null;
    }>({ users: [], isLoading: true, totalUsers: 0, error: null });

    const [modalState, setModalState] = useState<{
        isOpen: boolean; type: 'user' | 'company' | null; id: string | null; name: string | null;
    }>({ isOpen: false, type: null, id: null, name: null });

    // Reset to page 1 when the company filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCompanyId]);

    // Effect to fetch users when filters or page change
    useEffect(() => {
        const fetchUsers = async () => {
            setViewState(prev => ({ ...prev, isLoading: true, error: null }));
            const from = (currentPage - 1) * USERS_PER_PAGE;
            const to = from + USERS_PER_PAGE - 1;

            let query = apiClient
                .from('profiles')
                .select('*', { count: 'exact' })
                .neq('role', Role.Superadmin) // Don't show superadmin in the list
                .order('name', { ascending: true });

            if (selectedCompanyId === 'unassigned') {
                query = query.is('company_id', null);
            } else {
                query = query.eq('company_id', selectedCompanyId);
            }
            
            const { data, error, count } = await query.range(from, to);

            if (error) {
                console.error("Error fetching users:", error);
                setViewState({ users: [], isLoading: false, totalUsers: 0, error: "Failed to fetch users." });
            } else {
                setViewState({ users: data || [], isLoading: false, totalUsers: count || 0, error: null });
            }
        };

        fetchUsers();
    }, [selectedCompanyId, currentPage, refetchTrigger]);


    const handleAddCompany = async () => {
        if (!newCompanyName.trim()) return;
        await onAddCompany(newCompanyName.trim(), newCompanyCalendar);
        setNewCompanyName('');
        setNewCompanyCalendar('April');
    };
    
    // This is now a simplified example. A full implementation would need to fetch ALL users for the selected company.
    const handleDownloadUsersCsv = async () => { alert("Download functionality is being updated for scalability."); };

    const handleUserCompanyChange = async (profile: Profile, companyId: string) => {
        await onUpdateUserProfile({ ...profile, company_id: companyId || null });
        setRefetchTrigger(c => c + 1); // Trigger a refetch
    };

    const openConfirmationModal = (type: 'user' | 'company', id: string, name: string) => setModalState({ isOpen: true, type, id, name });
    const closeConfirmationModal = () => setModalState({ isOpen: false, type: null, id: null, name: null });
    
    const handleConfirmDelete = async () => {
        if (modalState.type === 'user' && modalState.id) {
            await onDeleteUser(modalState.id);
            setRefetchTrigger(c => c + 1);
        } else if (modalState.type === 'company' && modalState.id) {
            await onDeleteCompany(modalState.id);
        }
        closeConfirmationModal();
    };

     const handleCreateUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
            setCreationError("All fields are required.");
            return;
        }
        setIsCreatingUser(true);
        setCreationError('');
        try {
            await onCreateUser({
                name: newUserName.trim(), email: newUserEmail.trim(), password: newUserPassword,
                role: newUserRole, companyId: newUserCompanyId || null
            });
            // Reset form and refetch if the new user is in the current view
            if ((newUserCompanyId || 'unassigned') === selectedCompanyId) {
                setRefetchTrigger(c => c + 1);
            }
            setNewUserName(''); setNewUserEmail(''); setNewUserPassword(''); setNewUserRole(Role.User); setNewUserCompanyId('');
        } catch (error: any) {
            setCreationError(error.message || "An unexpected error occurred.");
        } finally {
            setIsCreatingUser(false);
        }
    };

    return (
        <div className="bg-slate-800/50 rounded-xl p-6 md:p-8 mt-4">
            <h2 className="text-3xl font-bold text-slate-200 mb-6 text-center">Management</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Management Panel */}
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                        <h3 className="text-xl font-semibold text-blue-300">Users</h3>
                        <button onClick={handleDownloadUsersCsv} className="px-3 py-1.5 rounded-md font-semibold text-sm transition-colors bg-teal-600 text-white shadow-md hover:bg-teal-700 flex items-center gap-2" aria-label="Download user list as CSV">
                            <DownloadIcon /><span>Download List</span>
                        </button>
                    </div>
                    
                    <div className="bg-slate-700/50 p-4 rounded-md mb-6">
                        <h4 className="font-semibold text-slate-200 mb-3">Create New User</h4>
                        <form onSubmit={handleCreateUserSubmit} className="space-y-3">
                            {/* Form fields remain the same */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="new-user-name" className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                                    <input id="new-user-name" type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} required className="w-full bg-slate-600 border border-slate-500 rounded-md px-3 py-1.5 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label htmlFor="new-user-role" className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                                    <select id="new-user-role" value={newUserRole} onChange={e => setNewUserRole(e.target.value as Role.User | Role.Admin)} className="w-full bg-slate-600 border border-slate-500 rounded-md px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                        <option value={Role.User}>User</option>
                                        <option value={Role.Admin}>Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="new-user-company" className="block text-sm font-medium text-slate-300 mb-1">Company (Optional)</label>
                                <select id="new-user-company" value={newUserCompanyId} onChange={e => setNewUserCompanyId(e.target.value)} className="w-full bg-slate-600 border border-slate-500 rounded-md px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500">
                                    <option value="">Unassigned</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="new-user-email" className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
                                <input id="new-user-email" type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} required className="w-full bg-slate-600 border border-slate-500 rounded-md px-3 py-1.5 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label htmlFor="new-user-password" className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                                <input id="new-user-password" type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required className="w-full bg-slate-600 border border-slate-500 rounded-md px-3 py-1.5 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                            </div>
                            {creationError && <p className="text-sm text-red-400">{creationError}</p>}
                            <div className="flex justify-end">
                                <button type="submit" disabled={isCreatingUser} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-wait">
                                    {isCreatingUser ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <div className="mb-4">
                        <label htmlFor="company-filter" className="font-semibold text-slate-300 mr-2 block mb-1 sm:inline-block">Filter by Company:</label>
                        <select id="company-filter" value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)} className="w-full sm:w-auto bg-slate-600 border border-slate-500 rounded-md px-2 py-1 text-white focus:outline-none">
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            <option value="unassigned">Unassigned Users</option>
                        </select>
                    </div>
                    
                    <div className="space-y-3 min-h-[300px]">
                        {viewState.isLoading ? (
                            <div className="flex justify-center items-center h-full text-slate-400">Loading users...</div>
                        ) : viewState.error ? (
                            <div className="flex justify-center items-center h-full text-red-400">{viewState.error}</div>
                        ) : viewState.users.length > 0 ? viewState.users.map(user => (
                            <div key={user.id} className="flex flex-wrap items-center justify-between gap-2 bg-slate-700/50 p-3 rounded-md">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-200 font-medium">{user.name}</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user.role === Role.Admin ? 'bg-indigo-500' : 'bg-gray-500'}`}>{user.role}</span>
                                    </div>
                                    <span className="text-xs text-slate-400 block mt-1">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select value={user.company_id || ''} onChange={(e) => handleUserCompanyChange(user, e.target.value)} className="bg-slate-600 border border-slate-500 rounded-md px-2 py-1 text-white text-sm">
                                        <option value="">No Company</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <button onClick={() => openConfirmationModal('user', user.id, user.name)} className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-900/50 rounded-full transition-colors" aria-label={`Delete ${user.name}`}>
                                        <TrashIcon />
                                    </button>
                                </div>
                            </div>
                        )) : <p className="text-slate-400 text-center py-4">No users found for this selection.</p>}
                    </div>
                     <Pagination
                        currentPage={currentPage}
                        totalItems={viewState.totalUsers}
                        itemsPerPage={USERS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                </div>

                <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-purple-300 mb-4 border-b border-slate-700 pb-2">Companies</h3>
                    <div className="bg-slate-700/50 p-4 rounded-md mb-6">
                        <h4 className="font-semibold text-slate-200 mb-2">Onboard New Company</h4>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input type="text" placeholder="New Company Name" value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} className="flex-grow bg-slate-600 border border-slate-500 rounded-md px-3 py-1.5 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500" />
                            <select value={newCompanyCalendar} onChange={e => setNewCompanyCalendar(e.target.value as 'January' | 'April')} className="bg-slate-600 border border-slate-500 rounded-md px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500">
                                <option value="April">Starts April</option><option value="January">Starts January</option>
                            </select>
                            <button onClick={handleAddCompany} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-1.5 rounded-md transition-colors">Add Company</button>
                        </div>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {companies.map(company => (
                            <div key={company.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-md">
                                <div>
                                    <p className="text-slate-200 font-medium">{company.name}</p>
                                    <p className="text-xs text-slate-400">Year starts in {company.calendar_start_month}</p>
                                </div>
                                <button onClick={() => openConfirmationModal('company', company.id, company.name)} className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-900/50 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed" title={"Delete company"} aria-label={`Delete ${company.name}`}>
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <ConfirmationModal isOpen={modalState.isOpen} onClose={closeConfirmationModal} onConfirm={handleConfirmDelete} title={`Delete ${modalState.type === 'user' ? 'User' : 'Company'}`} message={<p>Are you sure you want to permanently delete <strong className="font-bold text-slate-100">{modalState.name}</strong>?{modalState.type === 'user' && ' All associated tasks will also be deleted.'} This action cannot be undone.</p>} />
        </div>
    );
};
