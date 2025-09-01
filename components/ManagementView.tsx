
import React, { useState, useMemo, useEffect } from 'react';
import { Profile, Role, Company } from '../types';
import { TrashIcon, DownloadIcon } from './icons';
import { ConfirmationModal } from './ConfirmationModal';

interface ManagementViewProps {
    profiles: Profile[];
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


export const ManagementView: React.FC<ManagementViewProps> = ({ profiles, companies, currentUser, onAddCompany, onDeleteCompany, onUpdateUserProfile, onDeleteUser, onCreateUser }) => {
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

    const isSuperAdmin = currentUser.role === Role.Superadmin;
    const isAdmin = currentUser.role === Role.Admin;

    const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
        isSuperAdmin ? (companies[0]?.id || 'unassigned') : ''
    );
    
     const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type: 'user' | 'company' | null;
        id: string | null;
        name: string | null;
    }>({ isOpen: false, type: null, id: null, name: null });

    const handleAddCompany = () => {
        if (!newCompanyName.trim()) return;
        onAddCompany(newCompanyName.trim(), newCompanyCalendar);
        setNewCompanyName('');
        setNewCompanyCalendar('April');
    };
    
    const handleDownloadUsersCsv = () => {
        const allProfiles = profiles;

        const sortedCompanies = [...companies].sort((a, b) => a.name.localeCompare(b.name));
        
        const usersByCompany = new Map<string, Profile[]>();
        sortedCompanies.forEach(c => usersByCompany.set(c.id, []));
        usersByCompany.set('unassigned', []);

        allProfiles.forEach(profile => {
            if (profile.role === Role.Superadmin) return;
            const companyId = profile.company_id || 'unassigned';
            const userList = usersByCompany.get(companyId);
            if (userList) {
                userList.push(profile);
            }
        });

        usersByCompany.forEach((userList) => {
            userList.sort((a, b) => a.name.localeCompare(b.name));
        });

        const companyColumnOrder: {id: string, name: string}[] = [
            ...sortedCompanies.map(c => ({ id: c.id, name: c.name })),
            { id: 'unassigned', name: 'Unassigned' }
        ];

        const headerRow1: string[] = [];
        const headerRow2: string[] = [];
        companyColumnOrder.forEach(c => {
            headerRow1.push(escapeCsvField(c.name), '', ''); 
            headerRow2.push(escapeCsvField('Name'), escapeCsvField('Email'), escapeCsvField('Role'));
        });

        let maxRows = 0;
        usersByCompany.forEach(userList => {
            if (userList.length > maxRows) maxRows = userList.length;
        });

        const dataRows: string[][] = [];
        for (let i = 0; i < maxRows; i++) {
            const row: string[] = [];
            companyColumnOrder.forEach(col => {
                const user = usersByCompany.get(col.id)?.[i];
                if (user) {
                    row.push(escapeCsvField(user.name));
                    row.push(escapeCsvField(user.email));
                    row.push(escapeCsvField(user.role));
                } else {
                    row.push('', '', '');
                }
            });
            dataRows.push(row);
        }

        const csvRows = [headerRow1, headerRow2, ...dataRows];
        const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        
        const today = new Date().toISOString().split('T')[0];
        const fileName = `wsp_user_list_${today}.csv`;
        link.setAttribute("download", fileName);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const handleUserCompanyChange = (profileId: string, companyId: string) => {
        const profile = profiles.find(p => p.id === profileId);
        if (profile) {
            onUpdateUserProfile({ ...profile, company_id: companyId || null });
        }
    };

    const openConfirmationModal = (type: 'user' | 'company', id: string, name: string) => {
        setModalState({ isOpen: true, type, id, name });
    };

    const closeConfirmationModal = () => {
        setModalState({ isOpen: false, type: null, id: null, name: null });
    };
    
    const handleConfirmDelete = () => {
        if (modalState.type === 'user' && modalState.id) {
            onDeleteUser(modalState.id);
        } else if (modalState.type === 'company' && modalState.id) {
            onDeleteCompany(modalState.id);
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
                name: newUserName.trim(),
                email: newUserEmail.trim(),
                password: newUserPassword,
                role: newUserRole,
                companyId: newUserCompanyId || null
            });
            // Reset form on success
            setNewUserName('');
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserRole(Role.User);
            setNewUserCompanyId('');
        } catch (error: any) {
            setCreationError(error.message || "An unexpected error occurred.");
        } finally {
            setIsCreatingUser(false);
        }
    };

    const usersToDisplay = useMemo(() => {
        let filteredUsers: Profile[];
        if (isSuperAdmin) {
            if (selectedCompanyId === 'unassigned') {
                 filteredUsers = profiles.filter(u => !u.company_id && u.role !== Role.Superadmin);
            } else {
                filteredUsers = profiles.filter(u => u.company_id === selectedCompanyId);
            }
        } else if (isAdmin) {
            filteredUsers = profiles.filter(u => u.company_id === currentUser.company_id);
        } else {
            filteredUsers = [];
        }

        return filteredUsers.sort((a, b) => {
            if (a.role === Role.Admin && b.role !== Role.Admin) return -1;
            if (a.role !== Role.Admin && b.role === Role.Admin) return 1;
            return a.name.localeCompare(b.name);
        });

    }, [profiles, isSuperAdmin, isAdmin, currentUser.company_id, selectedCompanyId]);

    const getCompanyName = (companyId: string | null) => {
        if (!companyId) return 'N/A';
        return companies.find(c => c.id === companyId)?.name || 'Unknown';
    }

    return (
        <div className="bg-slate-800/50 rounded-xl p-6 md:p-8 mt-4">
            <h2 className="text-3xl font-bold text-slate-200 mb-6 text-center">Management</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Management Panel */}
                <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                    <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                        <h3 className="text-xl font-semibold text-blue-300">Users</h3>
                        {isSuperAdmin && (
                             <button
                                onClick={handleDownloadUsersCsv}
                                className="px-3 py-1.5 rounded-md font-semibold text-sm transition-colors bg-teal-600 text-white shadow-md hover:bg-teal-700 flex items-center gap-2"
                                aria-label="Download user list as CSV"
                            >
                                <DownloadIcon />
                                <span>Download List</span>
                            </button>
                        )}
                    </div>
                    
                    {isSuperAdmin && (
                        <div className="bg-slate-700/50 p-4 rounded-md mb-6">
                            <h4 className="font-semibold text-slate-200 mb-3">Create New User</h4>
                            <form onSubmit={handleCreateUserSubmit} className="space-y-3">
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
                    )}

                     {isSuperAdmin && (
                        <div className="mb-4">
                            <label htmlFor="company-filter" className="font-semibold text-slate-300 mr-2 block mb-1 sm:inline-block">Filter by Company:</label>
                            <select
                                id="company-filter"
                                value={selectedCompanyId}
                                onChange={e => setSelectedCompanyId(e.target.value)}
                                className="w-full sm:w-auto bg-slate-600 border border-slate-500 rounded-md px-2 py-1 text-white focus:outline-none"
                            >
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({profiles.filter(u => u.company_id === c.id).length})
                                    </option>
                                ))}
                                <option value="unassigned">
                                    Unassigned Users ({profiles.filter(u => !u.company_id && u.role !== Role.Superadmin).length})
                                </option>
                            </select>
                        </div>
                    )}


                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {usersToDisplay.length > 0 ? usersToDisplay.map(user => (
                            <div key={user.id} className="flex flex-wrap items-center justify-between gap-2 bg-slate-700/50 p-3 rounded-md">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-200 font-medium">{user.name}</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${user.role === Role.Admin ? 'bg-indigo-500' : 'bg-gray-500'}`}>{user.role}</span>
                                    </div>
                                    <span className="text-xs text-slate-400 block mt-1">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isSuperAdmin ? (
                                        <select value={user.company_id || ''} onChange={(e) => handleUserCompanyChange(user.id, e.target.value)} className="bg-slate-600 border border-slate-500 rounded-md px-2 py-1 text-white text-sm">
                                            <option value="">No Company</option>
                                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    ) : (
                                        <span>{getCompanyName(user.company_id)}</span>
                                    )}
                                     {isSuperAdmin && (
                                        <button
                                            onClick={() => openConfirmationModal('user', user.id, user.name)}
                                            className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-900/50 rounded-full transition-colors"
                                            aria-label={`Delete ${user.name}`}
                                        >
                                            <TrashIcon />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )) : <p className="text-slate-400 text-center py-4">No users found for this selection.</p>}
                    </div>
                </div>

                {isSuperAdmin && (
                    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold text-purple-300 mb-4 border-b border-slate-700 pb-2">Companies</h3>
                        
                        <div className="bg-slate-700/50 p-4 rounded-md mb-6">
                            <h4 className="font-semibold text-slate-200 mb-2">Onboard New Company</h4>
                            <div className="flex flex-col sm:flex-row gap-2">
                               <input
                                    type="text"
                                    placeholder="New Company Name"
                                    value={newCompanyName}
                                    onChange={(e) => setNewCompanyName(e.target.value)}
                                    className="flex-grow bg-slate-600 border border-slate-500 rounded-md px-3 py-1.5 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                                <select 
                                    value={newCompanyCalendar} 
                                    onChange={e => setNewCompanyCalendar(e.target.value as 'January' | 'April')}
                                    className="bg-slate-600 border border-slate-500 rounded-md px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                >
                                    <option value="April">Starts April</option>
                                    <option value="January">Starts January</option>
                                </select>
                                <button onClick={handleAddCompany} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-1.5 rounded-md transition-colors">
                                    Add Company
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {companies.map(company => {
                                const userCount = profiles.filter(u => u.company_id === company.id).length;
                                return (
                                <div key={company.id} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-md">
                                    <div>
                                        <p className="text-slate-200 font-medium">{company.name}</p>
                                        <p className="text-xs text-slate-400">Year starts in {company.calendar_start_month}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-slate-400 text-sm">
                                            {userCount} users
                                        </span>
                                        <button
                                            onClick={() => openConfirmationModal('company', company.id, company.name)}
                                            disabled={userCount > 0}
                                            className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-900/50 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                                            title={userCount > 0 ? "Cannot delete: reassign users first." : "Delete company"}
                                            aria-label={`Delete ${company.name}`}
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={closeConfirmationModal}
                onConfirm={handleConfirmDelete}
                title={`Delete ${modalState.type === 'user' ? 'User' : 'Company'}`}
                message={
                    <p>
                        Are you sure you want to permanently delete{' '}
                        <strong className="font-bold text-slate-100">{modalState.name}</strong>?
                        {modalState.type === 'user' && ' All associated tasks will also be deleted.'} This action cannot be undone.
                    </p>
                }
            />
        </div>
    );
};
