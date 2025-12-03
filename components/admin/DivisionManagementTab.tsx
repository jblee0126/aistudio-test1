
import React, { useState } from 'react';
import { useOkr } from '../../App';
import { Division } from '../../types';
import { PlusCircle, Trash2, Edit, X, Loader2 } from 'lucide-react';
import ConfirmationModal from '../shared/ConfirmationModal';

const DivisionFormModal: React.FC<{ isOpen: boolean; onClose: () => void; divisionToEdit: Division | null }> = ({ isOpen, onClose, divisionToEdit }) => {
    const { addDivision, updateDivision } = useOkr();
    const [formData, setFormData] = useState<Partial<Division>>(divisionToEdit || { name: '', description: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            if (divisionToEdit) {
                updateDivision(divisionToEdit.id, { ...divisionToEdit, ...formData } as Division);
            } else {
                addDivision({ ...formData, id: `div-${Date.now()}` } as Division);
            }
            setIsLoading(false);
            onClose();
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{divisionToEdit ? 'Edit Division' : 'Add Division'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Name</label>
                        <input type="text" value={formData.name || ''} onChange={e => setFormData(prev => ({...prev, name: e.target.value}))} required className="input-style" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Description</label>
                        <input type="text" value={formData.description || ''} onChange={e => setFormData(prev => ({...prev, description: e.target.value}))} className="input-style" />
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition">Cancel</button>
                        <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition shadow-md">
                            {isLoading && <Loader2 className="animate-spin" size={16}/>} Save
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

const DivisionManagementTab: React.FC = () => {
    const { divisions, deleteDivision } = useOkr();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [divisionToDelete, setDivisionToDelete] = useState<string | null>(null);

    const handleCreate = () => {
        setSelectedDivision(null);
        setIsModalOpen(true);
    };

    const handleEdit = (division: Division) => {
        setSelectedDivision(division);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        setDivisionToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (divisionToDelete) deleteDivision(divisionToDelete);
        setIsDeleteModalOpen(false);
        setDivisionToDelete(null);
    };

    return (
        <div className="p-2 md:p-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Division Management</h2>
                 <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-md hover:shadow-lg">
                    <PlusCircle size={18}/> New Division
                </button>
            </div>
            <div className="space-y-4">
                {divisions.map(division => (
                    <div key={division.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                         <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{division.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{division.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleEdit(division)} className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">
                                <Edit size={18}/>
                            </button>
                            <button onClick={() => handleDelete(division.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    </div>
                ))}
                {divisions.length === 0 && <p className="text-center py-8 text-slate-500">No divisions found.</p>}
            </div>

            {isModalOpen && <DivisionFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} divisionToEdit={selectedDivision} />}
            <ConfirmationModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                onConfirm={confirmDelete} 
                title="Delete Division" 
                message="Are you sure you want to delete this division?" 
            />
        </div>
    );
};

export default DivisionManagementTab;
