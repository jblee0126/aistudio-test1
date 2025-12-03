
import React, { useState } from 'react';
import { useOkr } from '../../App';
import { User } from '../../types';
import { X, Loader2 } from 'lucide-react';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose }) => {
    const { addUser, teams, divisions } = useOkr();
    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        email: '',
        role: 'member',
        jobTitle: '',
        position: '',
        divisionId: divisions[0]?.id || '',
        defaultTeamId: teams[0]?.id || '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        const division = divisions.find(d => d.id === formData.divisionId);
        const team = teams.find(t => t.id === formData.defaultTeamId);
        
        const newUser: User = {
            ...formData as User,
            id: `user-${Date.now()}`,
            displayName: formData.name,
            divisionName: division?.name,
            teamIds: formData.defaultTeamId ? [formData.defaultTeamId] : [],
        };

        // Simulate async
        setTimeout(() => {
            addUser(newUser);
            setIsLoading(false);
            onClose();
        }, 500);
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Add New User</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                        <X size={20}/>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input-style" placeholder="Full Name" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-style" placeholder="user@company.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Role</label>
                            <select name="role" value={formData.role} onChange={handleChange} className="input-style">
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Job Title</label>
                            <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleChange} className="input-style" placeholder="e.g. Engineer" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Division</label>
                            <select name="divisionId" value={formData.divisionId} onChange={handleChange} className="input-style">
                                <option value="">Select Division</option>
                                {divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Default Team</label>
                            <select name="defaultTeamId" value={formData.defaultTeamId} onChange={handleChange} className="input-style">
                                <option value="">Select Team</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition">Cancel</button>
                        <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition shadow-md">
                            {isLoading && <Loader2 className="animate-spin" size={16}/>}
                            Create User
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                .input-style { background-color: rgb(241 245 249 / 1); border: 1px solid rgb(226 232 240 / 1); border-radius: 0.375rem; padding: 0.5rem 0.75rem; width: 100%; }
                .dark .input-style { background-color: rgb(51 65 85 / 1); border-color: rgb(71 85 105 / 1); color: white; }
                .input-style:focus { outline: none; border-color: rgb(14 165 233); box-shadow: 0 0 0 1px rgb(14 165 233); }
            `}</style>
        </div>
    );
};

export default UserFormModal;
