
import React, { useState } from 'react';
import { useOkr } from '../../App';
import { Search, Shield, User as UserIcon, Users, Trash2, PlusCircle } from 'lucide-react';
import { getInitials } from '../../utils/helpers';
import ConfirmationModal from '../shared/ConfirmationModal';
import UserFormModal from './UserFormModal';

const UserManagementTab: React.FC = () => {
    const { users, teams, updateUserProfile, deleteUser, currentUser } = useOkr();
    const [searchTerm, setSearchTerm] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<string | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteClick = (userId: string) => {
        setUserToDelete(userId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (userToDelete) {
            deleteUser(userToDelete);
        }
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    return (
        <div className="p-2 md:p-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">User Management</h2>
                <button onClick={() => setIsFormModalOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-md hover:shadow-lg">
                    <PlusCircle size={18}/> Add User
                </button>
            </div>
            
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input 
                    type="text" 
                    placeholder="Search users by name or email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-brand-500 outline-none transition"
                />
            </div>

            <div className="space-y-3">
                {filteredUsers.map(user => (
                    <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl gap-4 transition-colors hover:border-slate-300 dark:hover:border-slate-600">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                user.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                                {getInitials(user.name)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
                                    {user.id === currentUser.id && <span className="text-xs bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 px-2 py-0.5 rounded-full">You</span>}
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <select
                                    value={user.role}
                                    onChange={(e) => updateUserProfile(user.id, { role: e.target.value as 'admin' | 'member' })}
                                    disabled={user.id === currentUser.id}
                                    className={`appearance-none pl-9 pr-8 py-2 rounded-lg text-sm font-medium border focus:ring-2 focus:ring-offset-0 outline-none cursor-pointer transition-all ${
                                        user.role === 'admin'
                                            ? 'bg-purple-50 border-purple-200 text-purple-700 focus:ring-purple-500 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300'
                                            : 'bg-white border-slate-200 text-slate-700 focus:ring-brand-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200'
                                    } ${user.id === currentUser.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
                                    user.role === 'admin' ? 'text-purple-500' : 'text-slate-400'
                                }`}>
                                    {user.role === 'admin' ? <Shield size={14} /> : <UserIcon size={14} />}
                                </div>
                            </div>

                            <div className="relative">
                                <select
                                    value={user.defaultTeamId || ''}
                                    onChange={(e) => updateUserProfile(user.id, { defaultTeamId: e.target.value })}
                                    className="appearance-none pl-9 pr-8 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none cursor-pointer transition-all"
                                >
                                    <option value="">No Team</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <Users size={14} />
                                </div>
                            </div>

                            {user.id !== currentUser.id && (
                                <button 
                                    onClick={() => handleDeleteClick(user.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Delete User"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {filteredUsers.length === 0 && (
                    <p className="text-center py-8 text-slate-500 dark:text-slate-400">No users found.</p>
                )}
            </div>
            
            <ConfirmationModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                onConfirm={confirmDelete} 
                title="Delete User" 
                message="Are you sure you want to delete this user? This action cannot be undone." 
            />
            
            {isFormModalOpen && (
                <UserFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} />
            )}
        </div>
    );
};

export default UserManagementTab;
