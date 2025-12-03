
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Objective, KeyResult, OkrFormData } from '../../types';
import { calculateObjectiveProgress } from '../../utils/helpers';
import { STATUS_COLORS } from '../../constants';
import { X, Edit, Trash2, Users, User, Calendar, BarChart2, Info, PlusCircle, Wand2, Loader2, ChevronLeft } from 'lucide-react';
import CheckInModal from './CheckInModal';
import ConfirmationModal from '../shared/ConfirmationModal';
import { useOkr } from '../../App';
import { suggestKeyResults } from '../../services/geminiService';

type FormErrors = {
    title?: string;
    keyResults?: string;
};

const KeyResultItem: React.FC<{ kr: KeyResult; onCheckIn: (kr: KeyResult) => void; ownerName?: string; canCheckIn: boolean }> = ({ kr, onCheckIn, ownerName, canCheckIn }) => {
    const progress = kr.progress;

    return (
        <div className="p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">{kr.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{kr.description}</p>
                </div>
                <button 
                    onClick={() => onCheckIn(kr)}
                    disabled={!canCheckIn}
                    title={!canCheckIn ? "Only the owner can check-in" : "Update Progress"}
                    className="px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300 bg-brand-100 dark:bg-brand-900/50 rounded-full hover:bg-brand-200 dark:hover:bg-brand-800/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Update Progress
                </button>
            </div>
            <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-brand-600 dark:text-brand-300">{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                </div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-3">
                <div className="flex items-center gap-1.5">
                    {ownerName && (
                        <>
                           <User size={14}/>
                           <span>{ownerName}</span>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <Calendar size={14}/>
                    <span>Due: {new Date(kr.dueDate).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
};

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: React.ReactNode }) => (
    <div className="flex items-center gap-3 text-sm">
        <div className="text-slate-500 dark:text-slate-400">{icon}</div>
        <span className="font-semibold text-slate-600 dark:text-slate-300">{label}:</span>
        <span className="text-slate-800 dark:text-slate-100">{value}</span>
    </div>
);


interface OkrDetailModalProps {
  objective: Objective;
  onClose: () => void;
}

const OkrDetailModal: React.FC<OkrDetailModalProps> = ({ objective, onClose }) => {
  const { updateKrProgress, deleteObjective, users, teams, currentUser, updateObjective, setToast } = useOkr();

  const [isEditing, setIsEditing] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [krToCheckIn, setKrToCheckIn] = useState<KeyResult | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const owner = users.find(u => u.id === objective.ownerId);
  const team = teams.find(t => t.id === objective.teamId);
  const progress = calculateObjectiveProgress(objective);
  
  const canEdit = (objective.isTeamObjective && currentUser.role === 'admin') ||
                  (!objective.isTeamObjective && objective.ownerId === currentUser.id);
  const canDelete = objective.ownerId === currentUser.id;
  const canCheckIn = objective.ownerId === currentUser.id;

  // --- View Mode Logic ---
  const handleCheckInClick = (kr: KeyResult) => {
    if (!canCheckIn) return;
    setKrToCheckIn(kr);
    setShowCheckInModal(true);
  };
  
  const handleCheckInSave = (krId: string, newProgress: number, comment?: string) => {
    updateKrProgress(objective.id, krId, newProgress, comment);
    setShowCheckInModal(false);
    setKrToCheckIn(null);
  };

  const handleDeleteClick = () => {
    if (!canDelete) return;
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteObjective(objective.id);
    setIsDeleteModalOpen(false);
    onClose();
  };

  // --- Edit Mode Logic ---
  const [formData, setFormData] = useState<OkrFormData>({
    title: '', description: '', teamId: '', year: 2025, quarter: 4, keyResults: []
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [krToDelete, setKrToDelete] = useState<{ index: number; title: string } | null>(null);

  useEffect(() => {
    if (isEditing) {
      const { id: _, changelog: __, keyResults, ownerId: ___, status: ____, ...rest } = objective;
      const krsForForm = keyResults.map(kr => {
        const { id: ___, progress: ____, progressUpdates: _____, ...krRest } = kr;
        return krRest;
      });
      setFormData({ ...rest, keyResults: krsForForm });
    }
  }, [isEditing, objective]);

  const availableTeams = useMemo(() => teams.filter(t => currentUser.teamIds.includes(t.id)), [teams, currentUser]);
  const isReadOnly = !canEdit;
  const isTeamSelectDisabled = isReadOnly || formData.isTeamObjective;

  const handleObjectiveChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'title' && value.trim()) {
      setErrors(prev => ({ ...prev, title: undefined }));
    }
  };

  const handleKrChange = (index: number, field: string, value: any) => {
    const newKrs = [...formData.keyResults];
    (newKrs[index] as any)[field] = value;
    setFormData(prev => ({ ...prev, keyResults: newKrs }));
  };

  const addKr = () => {
    setFormData(prev => ({
      ...prev,
      keyResults: [...prev.keyResults, {
        title: '', description: '', ownerId: currentUser.id,
        dueDate: new Date(formData.year, formData.quarter * 3, 0).toISOString().split('T')[0],
        confidence: 75,
      }]
    }));
    setErrors(prev => ({ ...prev, keyResults: undefined }));
  };

  const handleRemoveKrClick = (index: number) => {
    setKrToDelete({ index, title: formData.keyResults[index].title });
  };

  const handleConfirmRemoveKr = () => {
    if (krToDelete === null) return;
    setFormData(prev => ({
      ...prev,
      keyResults: prev.keyResults.filter((_, i) => i !== krToDelete.index),
    }));
    setKrToDelete(null);
  };

  const handleSuggestKrs = async () => {
    if (!formData.title) {
      setToast({ message: "Please enter an Objective title first.", type: 'error' });
      setErrors({ title: 'Objective title is required.' });
      return;
    }
    setIsLoadingAi(true);
    try {
      const suggestions = await suggestKeyResults(formData.title, formData.description);
      const newKrs = suggestions.map((s: any) => ({
        ...s, ownerId: currentUser.id,
        dueDate: new Date(formData.year, formData.quarter * 3, 0).toISOString().split('T')[0],
        confidence: 75,
      }));
      setFormData(prev => ({ ...prev, keyResults: [...prev.keyResults, ...newKrs] }));
      setErrors(prev => ({ ...prev, keyResults: undefined }));
    } catch (error) {
      setToast({ message: (error as Error).message, type: 'error' });
    } finally {
      setIsLoadingAi(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Objective title is required.';
    if (formData.keyResults.length === 0) newErrors.keyResults = 'At least one Key Result is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !canEdit) return;
    updateObjective(objective.id, formData);
    setIsEditing(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md" onClick={onClose}>
      <div 
        className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200/50 dark:border-slate-700/50"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-6 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 gap-4">
            <div className="flex items-center gap-3 overflow-hidden">
                {isEditing && (
                    <button 
                        onClick={() => setIsEditing(false)}
                        className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        aria-label="Back to details"
                    >
                        <ChevronLeft size={24} />
                    </button>
                )}
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate" title={objective.title}>
                  {isEditing ? `Edit: ${objective.title}` : 'Objective Details'}
                </h2>
            </div>
             <button onClick={onClose} className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0">
                <X size={20}/>
            </button>
        </div>
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="flex-1 contents">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* --- Form Body from OkrFormPage --- */}
              <div className={`p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl ${errors.title ? 'border border-red-500' : ''}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                          <label htmlFor="title" className="block text-sm font-medium">Title</label>
                          <input type="text" name="title" id="title" value={formData.title} onChange={handleObjectiveChange} className={`mt-1 block w-full input-style ${errors.title ? 'border-red-500' : ''}`} disabled={isReadOnly} />
                      </div>
                      <div className="md:col-span-2">
                          <label htmlFor="description" className="block text-sm font-medium">Description</label>
                          <textarea name="description" id="description" value={formData.description} onChange={handleObjectiveChange} rows={2} className="mt-1 block w-full input-style" disabled={isReadOnly}></textarea>
                      </div>
                      <div>
                          <label className="block text-sm font-medium">Team</label>
                          <select name="teamId" value={formData.teamId} onChange={handleObjectiveChange} className="mt-1 block w-full input-style" disabled={isTeamSelectDisabled}>
                              {availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium">Quarter</label>
                          <select name="quarter" value={formData.quarter} onChange={handleObjectiveChange} className="mt-1 block w-full input-style" disabled={isReadOnly}>
                              {[1, 2, 3, 4].map(q => <option key={q} value={q}>Q{q}</option>)}
                          </select>
                      </div>
                  </div>
              </div>
              <div className={`p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl ${errors.keyResults ? 'border border-red-500' : ''}`}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Key Results</h3>
                      <button type="button" onClick={handleSuggestKrs} disabled={isLoadingAi || isReadOnly} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300 bg-brand-100 dark:bg-brand-900/50 rounded-full hover:bg-brand-200 dark:hover:bg-brand-800/50 transition disabled:opacity-50">
                          {isLoadingAi ? <Loader2 className="animate-spin" size={14}/> : <Wand2 size={14}/>} Suggest with AI
                      </button>
                  </div>
                  {errors.keyResults && <p className="mb-2 text-sm text-red-500">{errors.keyResults}</p>}
                  <div className="space-y-4">
                      {formData.keyResults.map((kr, index) => (
                          <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 relative">
                              {!isReadOnly && <button type="button" onClick={() => handleRemoveKrClick(index)} className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><Trash2 size={16}/></button>}
                              <div className="space-y-4">
                                  <div>
                                      <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">KR Title</label>
                                      <input 
                                        type="text" 
                                        value={kr.title} 
                                        onChange={e => handleKrChange(index, 'title', e.target.value)} 
                                        required 
                                        className="block w-full input-style-sm" 
                                        disabled={isReadOnly} 
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Description</label>
                                      <textarea 
                                        value={kr.description || ''} 
                                        onChange={e => handleKrChange(index, 'description', e.target.value)} 
                                        rows={2} 
                                        className="block w-full input-style-sm" 
                                        disabled={isReadOnly}
                                      ></textarea>
                                  </div>
                              </div>
                          </div>
                      ))}
                      {!isReadOnly && <button type="button" onClick={addKr} className="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-300 hover:text-brand-500"><PlusCircle size={18}/> Add Key Result</button>}
                  </div>
              </div>
            </div>
            {!isReadOnly && (
              <div className="flex-shrink-0 p-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition">Save Changes</button>
              </div>
            )}
          </form>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* --- View Mode Body --- */}
            {objective.isTeamObjective && (
                <div className="bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700/50 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg flex items-center gap-3">
                    <Info size={20} />
                    <p className="text-sm font-medium">This is a Team-level OKR. Only admins can edit or delete it.</p>
                </div>
            )}
            <div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[objective.status]}`}>{objective.status}</span>
                            <span className="text-sm text-slate-500 dark:text-slate-400">{objective.year} Q{objective.quarter}</span>
                        </div>
                        <h1 className="text-2xl font-bold mt-2 text-slate-800 dark:text-slate-100">{objective.title}</h1>
                        <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-3xl">{objective.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {canEdit && <button onClick={() => setIsEditing(true)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"><Edit size={20} className="text-slate-500 dark:text-slate-400"/></button>}
                        {canDelete && <button onClick={handleDeleteClick} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"><Trash2 size={20} className="text-red-500"/></button>}
                    </div>
                </div>
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-1"><span className="text-lg font-bold text-brand-600 dark:text-brand-300">{progress}%</span></div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5"><div className="bg-brand-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
                </div>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 border-t border-slate-200 dark:border-slate-700 pt-6">
                    <DetailItem icon={<User size={18}/>} label="Owner" value={owner?.name || 'N/A'}/>
                    <DetailItem icon={<Users size={18}/>} label="Team" value={team?.name || 'N/A'}/>
                    <DetailItem icon={<BarChart2 size={18}/>} label="Key Results" value={objective.keyResults.length}/>
                </div>
            </div>
            <div>
                <h3 className="text-xl font-semibold mb-4 text-slate-700 dark:text-slate-200">Key Results</h3>
                <div className="space-y-4">
                    {objective.keyResults.map(kr => {
                        const krOwner = users.find(u => u.id === kr.ownerId);
                        return <KeyResultItem key={kr.id} kr={kr} onCheckIn={handleCheckInClick} ownerName={krOwner?.name} canCheckIn={canCheckIn} />
                    })}
                </div>
            </div>
          </div>
        )}
        {showCheckInModal && krToCheckIn && <CheckInModal kr={krToCheckIn} onClose={() => setShowCheckInModal(false)} onSave={handleCheckInSave} />}
        <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} title={`Confirm Objective Deletion`} message={`Are you sure you want to delete "${objective.title}"? This action cannot be undone.`}/>
        <ConfirmationModal isOpen={krToDelete !== null} onClose={() => setKrToDelete(null)} onConfirm={handleConfirmRemoveKr} title="Confirm Key Result Deletion" message={`Are you sure you want to delete "${krToDelete?.title}"?`}/>
      </div>
      <style>{`
        .input-style { background-color: rgb(241 245 249 / 1); border: 1px solid rgb(226 232 240 / 1); border-radius: 0.375rem; padding: 0.5rem 0.75rem; width: 100%; }
        .dark .input-style { background-color: rgb(51 65 85 / 1); border-color: rgb(71 85 105 / 1); }
        .input-style:focus { --tw-ring-color: rgb(14 165 233 / 1); border-color: rgb(14 165 233 / 1); }
        .input-style:disabled { background-color: rgb(226 232 240 / 0.5); cursor: not-allowed; }
        .dark .input-style:disabled { background-color: rgb(71 85 105 / 0.5); }
        .input-style-sm { font-size: 0.875rem; line-height: 1.25rem; background-color: rgb(248 250 252 / 1); border: 1px solid rgb(226 232 240 / 1); border-radius: 0.375rem; padding: 0.5rem 0.75rem; width: 100%; }
        .dark .input-style-sm { background-color: rgb(30 41 59 / 1); border-color: rgb(51 65 85 / 1); }
        .input-style-sm:focus { --tw-ring-color: rgb(14 165 233 / 1); border-color: rgb(14 165 233 / 1); }
      `}</style>
    </div>,
    document.body
  );
};

export default OkrDetailModal;
