
import React, { useState, useEffect } from 'react';
import { useOkr } from '../../App';
import { Team, User } from '../../types';
import { X, Loader2, Search } from 'lucide-react';
import { mockDivisions } from '../../data/mockData';

interface TeamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamToEdit: Team | null;
}

const TeamFormModal: React.FC<TeamFormModalProps> = ({ isOpen, onClose, teamToEdit }) => {
    const { currentUser, users, addTeam, updateTeam, setToast } = useOkr();
    const isEditing = Boolean(teamToEdit);
    const isAdmin = currentUser.role === 'admin';
    
    const [formData, setFormData] = useState<Omit<Team, 'id'>>({
        name: '',
        description: '',
        code: '',
        divisionId: mockDivisions[0]?.id || '',
        divisionName: mockDivisions[0]?.name || '',
        members: []
    });
    const [isLoading, setIsLoading] = useState(false);
    const [memberSearchTerm, setMemberSearchTerm] = useState('');

    useEffect(() => {
        if (isEditing && teamToEdit) {
            const { id, ...data } = teamToEdit;
            // Ensure members is at least an empty array
            setFormData({ ...data, members: data.members || [] });
        } else {
            setFormData({
                name: '',
                description: '',
                code: '',
                divisionId: mockDivisions[0]?.id || '',
                divisionName: mockDivisions[0]?.name || '',
                members: []
            });
        }
    }, [isEditing, teamToEdit]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'divisionId') {
            const selectedDivision = mockDivisions.find(d => d.id === value);
            setFormData(prev => ({
                ...prev,
                divisionId: value,
                divisionName: selectedDivision?.name || ''
            }));
        } else {
            setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
        }
    };

    const toggleUserSelection = (userId: string) => {
        if (!isAdmin) return;
        setFormData(prev => {
            const currentList = prev.members || [];
            const newList = currentList.includes(userId)
                ? currentList.filter(id => id !== userId)
                : [...currentList, userId];
            return { ...prev, members: newList };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAdmin) {
            setToast({ message: "You don't have permission.", type: 'error' });
            return;
        }
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            if (isEditing && teamToEdit) {
                updateTeam(teamToEdit.id, { ...formData, id: teamToEdit.id });
            } else {
                addTeam(formData);
            }
            setIsLoading(false);
            onClose();
        }, 500);
    };

    const renderUserSelector = (
        label: string,
        searchTerm: string,
        setSearchTerm: (term: string) => void
    ) => {
        const filteredUsers = users.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className="space-y-2">
                <label className="input-label">{label}</label>
                <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                    {/* Search Bar */}
                    <div className="flex items-center px-3 py-2 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900">
                        <Search size={14} className="text-slate-400 mr-2" />
                        <input
                            type="text"
                            placeholder={`Search ${label.toLowerCase()}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={!isAdmin}
                            className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 disabled:cursor-not-allowed"
                        />
                    </div>
                    
                    {/* User List */}
                    <div className="max-h-48 overflow-y-auto p-1 custom-scrollbar">
                        {filteredUsers.length > 0 ? (
                            <div className="space-y-0.5">
                                {filteredUsers.map(user => {
                                    const isSelected = (formData.members || []).includes(user.id);
                                    return (
                                        <label 
                                            key={user.id} 
                                            className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                                                isSelected 
                                                    ? 'bg-brand-50 dark:bg-brand-900/20' 
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                                            } ${!isAdmin ? 'cursor-not-allowed opacity-60' : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleUserSelection(user.id)}
                                                disabled={!isAdmin}
                                                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 focus:ring-offset-0"
                                            />
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-medium ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-200'}`}>
                                                    {user.name}
                                                </span>
                                                <span className="text-xs text-slate-500">{user.email}</span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm">
                                No users found matching "{searchTerm}"
                            </div>
                        )}
                    </div>
                    
                    {/* Footer Count */}
                    <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-600 text-xs text-slate-500 text-right font-medium">
                        {(formData.members || []).length} selected
                    </div>
                </div>
            </div>
        );
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex-shrink-0 p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {isEditing ? `Edit Team: ${teamToEdit?.name}` : 'Create New Team'}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                        <X size={20}/>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="input-label">Team Name</label>
                            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="input-style" disabled={!isAdmin} required placeholder="e.g. Product Design Team" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="description" className="input-label">Description</label>
                            <input type="text" id="description" name="description" value={formData.description} onChange={handleChange} className="input-style" disabled={!isAdmin} placeholder="Briefly describe the team's purpose" />
                        </div>
                        <div>
                            <label htmlFor="code" className="input-label">Team Code</label>
                            <input type="text" id="code" name="code" value={formData.code} onChange={handleChange} className="input-style" disabled={!isAdmin} placeholder="e.g. PROD" />
                        </div>
                        <div>
                            <label htmlFor="divisionId" className="input-label">Division</label>
                            <select id="divisionId" name="divisionId" value={formData.divisionId} onChange={handleChange} className="input-style" disabled={!isAdmin} required>
                                {mockDivisions.map(division => <option key={division.id} value={division.id}>{division.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1">
                        {renderUserSelector('Team Members', memberSearchTerm, setMemberSearchTerm)}
                    </div>
                </form>

                <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition">
                      Close
                    </button>
                    {isAdmin && (
                        <button type="button" onClick={handleSubmit} disabled={isLoading} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition disabled:bg-brand-400 shadow-md">
                             {isLoading && <Loader2 className="animate-spin" size={18}/>}
                             {isEditing ? 'Save Changes' : 'Create Team'}
                        </button>
                    )}
                </div>
            </div>
             <style>{`
                .input-label { display: block; margin-bottom: 0.375rem; font-size: 0.875rem; font-weight: 600; color: #475569; }
                .dark .input-label { color: #d1d5db; }
                .input-style { background-color: rgb(241 245 249); border: 1px solid rgb(203 213 225); border-radius: 0.5rem; padding: 0.5rem 0.75rem; width: 100%; font-size: 0.875rem; transition: all 0.2s; }
                .dark .input-style { background-color: rgb(30 41 59); border-color: rgb(71 85 105); color: white; }
                .input-style:focus { --tw-ring-color: rgb(14 165 233); border-color: rgb(14 165 233); box-shadow: 0 0 0 1px rgb(14 165 233); outline: none; }
                .input-style:disabled { background-color: rgb(226 232 240 / 0.5); cursor: not-allowed; opacity: 0.7; }
                .dark .input-style:disabled { background-color: rgb(71 85 105 / 0.3); }
                
                /* Custom Scrollbar for user list */
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 20px; }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(75, 85, 99, 0.5); }
            `}</style>
        </div>
    );
};

export default TeamFormModal;
