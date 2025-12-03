
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { OkrFormData, KeyResult } from '../types';
import { suggestKeyResults } from '../services/geminiService';
import { PlusCircle, Trash2, Wand2, Loader2, ChevronLeft } from 'lucide-react';
import { useOkr } from '../App';
import ConfirmationModal from '../components/shared/ConfirmationModal';
import { canCreateTeamOkr } from '../utils/helpers';

type FormErrors = {
    title?: string;
    keyResults?: string;
};

const OkrFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const isEditing = Boolean(id);
    
    const { getObjectiveById, addObjective, updateObjective, teams, currentUser, setToast, currentYear, currentQuarter } = useOkr();
    
    const hasTeamOkrPermission = useMemo(() => canCreateTeamOkr(currentUser), [currentUser]);
    const queryIsTeam = new URLSearchParams(location.search).get('isTeam') === 'true';
    const initialIsTeamObjective = !isEditing && queryIsTeam && hasTeamOkrPermission;

    const [formData, setFormData] = useState<OkrFormData>({
        title: '',
        description: '',
        teamId: currentUser.defaultTeamId || '',
        year: currentYear,
        quarter: currentQuarter,
        keyResults: [],
        isTeamObjective: initialIsTeamObjective,
    });
    
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const [krToDelete, setKrToDelete] = useState<{ index: number; title: string } | null>(null);

    const existingOkr = useMemo(() => {
        if (isEditing && id) {
            return getObjectiveById(id);
        }
        return null;
    }, [id, isEditing, getObjectiveById]);
    
    useEffect(() => {
        if (!isEditing) { // Only for new OKRs
            if (formData.isTeamObjective) {
                setFormData(prev => ({ ...prev, teamId: currentUser.defaultTeamId || '' }));
            }
        }
    }, [formData.isTeamObjective, isEditing, currentUser.defaultTeamId]);

    const isReadOnly = useMemo(() => {
        if (!isEditing || !existingOkr) {
            return false;
        }
        if (existingOkr.isTeamObjective) {
            return currentUser.role !== 'admin';
        }
        return existingOkr.ownerId !== currentUser.id;
    }, [isEditing, existingOkr, currentUser]);
    
    const isTeamSelectDisabled = isReadOnly || formData.isTeamObjective;

    const availableTeams = useMemo(() => teams.filter(t => (currentUser.teamIds || []).includes(t.id)), [teams, currentUser]);

    useEffect(() => {
        if (isEditing && existingOkr) {
             const { id: _, changelog: __, keyResults, ownerId: ___, status: ____, ...rest } = existingOkr;
             const krsForForm = keyResults.map(kr => {
                 const {id: _, progress: __, progressUpdates: ___, ...krRest} = kr;
                 return krRest;
             });
             setFormData({...rest, keyResults: krsForForm });
        }
    }, [isEditing, existingOkr]);

    const handleObjectiveChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'isTeamObjective' ? value === 'true' : value }));
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
                title: '',
                description: '',
                ownerId: currentUser.id,
                dueDate: new Date(formData.year, formData.quarter * 3, 0).toISOString().split('T')[0],
                confidence: 75,
            }]
        }));
        setErrors(prev => ({...prev, keyResults: undefined }));
    };

    const handleRemoveKrClick = (index: number) => {
        const kr = formData.keyResults[index];
        setKrToDelete({ index, title: kr.title });
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
                ...s,
                ownerId: currentUser.id,
                dueDate: new Date(formData.year, formData.quarter * 3, 0).toISOString().split('T')[0],
                confidence: 75,
            }));
            setFormData(prev => ({...prev, keyResults: [...prev.keyResults, ...newKrs]}));
            setErrors(prev => ({...prev, keyResults: undefined }));
        } catch (error) {
            setToast({ message: (error as Error).message, type: 'error' });
        } finally {
            setIsLoadingAi(false);
        }
    };
    
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.title.trim()) {
            newErrors.title = 'Objective title is required.';
        }
        if (formData.keyResults.length === 0) {
            newErrors.keyResults = 'At least one Key Result is required.';
        }
        
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            if (newErrors.title) setToast({ message: 'Objective 제목을 입력해주세요.', type: 'error' });
            else if (newErrors.keyResults) setToast({ message: '최소 1개 이상의 Key Result를 추가해야 합니다.', type: 'error' });
            return false;
        }
        return true;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        if (isReadOnly) {
            setToast({ message: "You do not have permission to perform this action.", type: 'error' });
            return;
        }
        if (isEditing && id) {
            updateObjective(id, formData);
            navigate(`/okrs/${id}`);
        } else {
            addObjective(formData);
            navigate(formData.isTeamObjective ? '/team-dashboard' : '/dashboard');
        }
    };
    
    const pageTitle = isEditing 
        ? `Edit ${existingOkr?.isTeamObjective ? 'Team ' : ''}Objective` 
        : `Create New ${formData.isTeamObjective ? 'Team ' : ''}Objective`;
    const backLink = isEditing && id ? `/okrs/${id}` : (formData.isTeamObjective ? '/team-dashboard' : '/okrs');

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link to={backLink} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 transition">
                <ChevronLeft size={18} /> Cancel
            </Link>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{pageTitle}</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                { !isEditing && hasTeamOkrPermission && (
                    <div className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border rounded-2xl shadow-lg border-slate-200 dark:border-slate-700">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">OKR Type</label>
                        <div className="flex space-x-2 rounded-lg bg-slate-200 dark:bg-slate-700 p-1">
                            <button
                                type="button"
                                className={`w-full rounded-md py-2 text-sm font-medium transition-all ${!formData.isTeamObjective ? 'bg-white dark:bg-slate-800 text-brand-600 shadow' : 'text-slate-600 dark:text-slate-300'}`}
                                onClick={() => setFormData(prev => ({ ...prev, isTeamObjective: false }))}
                                >
                                Personal OKR
                            </button>
                            <button
                                type="button"
                                className={`w-full rounded-md py-2 text-sm font-medium transition-all ${formData.isTeamObjective ? 'bg-white dark:bg-slate-800 text-brand-600 shadow' : 'text-slate-600 dark:text-slate-300'}`}
                                onClick={() => setFormData(prev => ({ ...prev, isTeamObjective: true }))}
                                >
                                Team OKR
                            </button>
                        </div>
                    </div>
                )}
                
                <div className={`p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border rounded-2xl shadow-lg ${errors.title ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}>
                    <h2 className="text-xl font-semibold mb-4">Objective Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                            <input type="text" name="title" id="title" value={formData.title} onChange={handleObjectiveChange} className={`mt-1 block w-full input-style ${errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`} disabled={isReadOnly} />
                             {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                            <textarea name="description" id="description" value={formData.description} onChange={handleObjectiveChange} rows={3} className="mt-1 block w-full input-style" disabled={isReadOnly}></textarea>
                        </div>
                        <div>
                            <label htmlFor="divisionName" className="block text-sm font-medium">Division</label>
                            <input type="text" name="divisionName" id="divisionName" value={currentUser.divisionName || ''} className="mt-1 block w-full input-style" disabled />
                        </div>
                        <div>
                            <label htmlFor="teamId" className="block text-sm font-medium">Team</label>
                            <select name="teamId" id="teamId" value={formData.teamId} onChange={handleObjectiveChange} className="mt-1 block w-full input-style" disabled={isTeamSelectDisabled}>
                                {availableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="year" className="block text-sm font-medium">Year</label>
                            <input type="number" name="year" id="year" value={formData.year} onChange={handleObjectiveChange} className="mt-1 block w-full input-style" disabled={isReadOnly} />
                        </div>
                        <div>
                            <label htmlFor="quarter" className="block text-sm font-medium">Quarter</label>
                            <select name="quarter" id="quarter" value={formData.quarter} onChange={handleObjectiveChange} className="mt-1 block w-full input-style" disabled={isReadOnly}>
                                <option value={1}>Q1</option><option value={2}>Q2</option><option value={3}>Q3</option><option value={4}>Q4</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className={`p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border rounded-2xl shadow-lg ${errors.keyResults ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Key Results</h2>
                        <button type="button" onClick={handleSuggestKrs} disabled={isLoadingAi || isReadOnly} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300 bg-brand-100 dark:bg-brand-900/50 rounded-full hover:bg-brand-200 dark:hover:bg-brand-800/50 transition disabled:opacity-50">
                            {isLoadingAi ? <Loader2 className="animate-spin" size={14}/> : <Wand2 size={14}/>}
                            Suggest with AI
                        </button>
                    </div>
                     {errors.keyResults && <p className="mb-4 text-sm text-red-500">{errors.keyResults}</p>}
                    
                    <div className="space-y-6">
                        {formData.keyResults.map((kr, index) => {
                             return (
                                <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 relative">
                                    {!isReadOnly && (
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveKrClick(index)} 
                                            className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"
                                            title="Remove Key Result"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    )}
                                    <div className="space-y-4">
                                         <div>
                                            <label className="block text-sm font-medium">KR Title</label>
                                            <input type="text" value={kr.title} onChange={e => handleKrChange(index, 'title', e.target.value)} required className="mt-1 block w-full input-style-sm" disabled={isReadOnly} />
                                        </div>
                                         <div>
                                            <label className="block text-sm font-medium">Description</label>
                                            <textarea value={kr.description || ''} onChange={e => handleKrChange(index, 'description', e.target.value)} rows={2} className="mt-1 block w-full input-style-sm" disabled={isReadOnly}></textarea>
                                        </div>
                                    </div>
                                </div>
                             )
                        })}
                        {!isReadOnly && (
                            <button type="button" onClick={addKr} className="flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-300 hover:text-brand-500">
                               <PlusCircle size={18}/> Add Key Result
                            </button>
                        )}
                    </div>
                </div>

                {!isReadOnly && (
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="px-6 py-2.5 rounded-lg font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
                            {isEditing ? 'Save Changes' : 'Create Objective'}
                        </button>
                    </div>
                )}
            </form>
            <ConfirmationModal
                isOpen={krToDelete !== null}
                onClose={() => setKrToDelete(null)}
                onConfirm={handleConfirmRemoveKr}
                title="Confirm Key Result Deletion"
                message={`Are you sure you want to delete the key result "${krToDelete?.title}"? This action cannot be undone.`}
            />
            <style>{`
                .input-style:disabled, .input-style-sm:disabled, textarea:disabled {
                    background-color: rgb(226 232 240 / 0.5);
                    cursor: not-allowed;
                }
                .dark .input-style:disabled, .dark .input-style-sm:disabled, .dark textarea:disabled {
                    background-color: rgb(71 85 105 / 0.5);
                }
                .input-style {
                    background-color: rgb(241 245 249 / 1);
                    border: 1px solid rgb(226 232 240 / 1);
                    border-radius: 0.375rem;
                    padding: 0.5rem 0.75rem;
                    width: 100%;
                }
                .dark .input-style {
                    background-color: rgb(51 65 85 / 1);
                    border-color: rgb(71 85 105 / 1);
                }
                .input-style:focus {
                    --tw-ring-color: rgb(14 165 233 / 1);
                    border-color: rgb(14 165 233 / 1);
                }
                 .input-style-sm {
                    font-size: 0.875rem;
                    line-height: 1.25rem;
                    background-color: rgb(248 250 252 / 1);
                    border: 1px solid rgb(226 232 240 / 1);
                    border-radius: 0.375rem;
                    padding: 0.5rem 0.75rem;
                    width: 100%;
                }
                .dark .input-style-sm {
                    background-color: rgb(30 41 59 / 1);
                    border-color: rgb(51 65 85 / 1);
                }
                 .input-style-sm:focus {
                    --tw-ring-color: rgb(14 165 233 / 1);
                    border-color: rgb(14 165 233 / 1);
                }
            `}</style>
        </div>
    );
};

export default OkrFormPage;
