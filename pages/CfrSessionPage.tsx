
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useOkr } from '../App';
import { CfrSession, Recognition } from '../types';
import { generateCfrSummary, suggestCfrRisks, suggestCfrNextPlans } from '../services/geminiService';
import { ChevronLeft, Wand2, Loader2, PlusCircle, Trash2, User } from 'lucide-react';

const CfrSessionPage: React.FC = () => {
    const { objectiveId, year, month } = useParams<{ objectiveId: string, year: string, month: string }>();
    const navigate = useNavigate();
    const { getObjectiveById, getCfrSessionForMonth, addOrUpdateCfrSession, users, currentUser } = useOkr();

    const objective = getObjectiveById(objectiveId);
    const numericYear = Number(year);
    const numericMonth = Number(month);

    const [sessionData, setSessionData] = useState<Omit<CfrSession, 'id' | 'createdAt' | 'updatedAt'>>({
        objectiveId: objectiveId || '',
        authorId: currentUser.id,
        year: numericYear,
        quarter: objective?.quarter || 1,
        month: numericMonth,
        whatHappened: '',
        challenges: '',
        nextPlans: '',
        recognitions: [],
        managerFeedback: '',
    });
    const [isLoadingAi, setIsLoadingAi] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (objectiveId && numericYear && numericMonth) {
            const existingSession = getCfrSessionForMonth(objectiveId, numericYear, numericMonth);
            if (existingSession) {
                const { id, createdAt, updatedAt, ...data } = existingSession;
                setSessionData(data);
            }
        }
    }, [objectiveId, numericYear, numericMonth, getCfrSessionForMonth]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setSessionData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleGenerateWithAi = async (field: 'whatHappened' | 'challenges' | 'nextPlans') => {
        if (!objective) return;
        setIsLoadingAi(prev => ({...prev, [field]: true}));
        try {
            let result = '';
            if (field === 'whatHappened') {
                result = await generateCfrSummary(objective, 'No progress data connected yet.');
            } else if (field === 'challenges') {
                result = await suggestCfrRisks(objective);
            } else if (field === 'nextPlans') {
                result = await suggestCfrNextPlans(objective);
            }
            setSessionData(prev => ({ ...prev, [field]: result }));
        } catch (error) {
            alert((error as Error).message);
        } finally {
            setIsLoadingAi(prev => ({...prev, [field]: false}));
        }
    };
    
    const addRecognition = () => {
        setSessionData(prev => ({
            ...prev,
            recognitions: [...prev.recognitions, { memberId: '', comment: '' }]
        }));
    };
    
    const updateRecognition = (index: number, field: 'memberId' | 'comment', value: string) => {
        const newRecognitions = [...sessionData.recognitions];
        newRecognitions[index][field] = value;
        setSessionData(prev => ({ ...prev, recognitions: newRecognitions }));
    };

    const removeRecognition = (index: number) => {
        setSessionData(prev => ({
            ...prev,
            recognitions: prev.recognitions.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addOrUpdateCfrSession(sessionData);
        navigate('/cfr');
    };

    if (!objective) {
        return <div className="text-center py-10">Objective not found.</div>;
    }
    
    const getMonthName = (monthNumber: number) => new Date(0, monthNumber - 1).toLocaleString('en-US', { month: 'long' });

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Link to="/cfr" className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 transition">
                <ChevronLeft size={18} /> Back to CFR List
            </Link>
            <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">CFR Session: {getMonthName(numericMonth)} {numericYear}</h1>
                <p className="mt-1 text-lg text-slate-500 dark:text-slate-400">{objective.title}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg">
                    <label className="text-xl font-semibold mb-4 block">What Happened This Month?</label>
                    <textarea name="whatHappened" value={sessionData.whatHappened} onChange={handleTextChange} rows={5} className="w-full input-style" />
                    <button type="button" onClick={() => handleGenerateWithAi('whatHappened')} disabled={isLoadingAi.whatHappened} className="ai-button">
                        {isLoadingAi.whatHappened ? <Loader2 className="animate-spin" size={14}/> : <Wand2 size={14}/>}
                        {isLoadingAi.whatHappened ? 'Generating...' : 'Generate Summary with AI'}
                    </button>
                </div>
                
                <div className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg">
                    <label className="text-xl font-semibold mb-4 block">Challenges / Risks</label>
                    <textarea name="challenges" value={sessionData.challenges} onChange={handleTextChange} rows={5} className="w-full input-style" />
                     <button type="button" onClick={() => handleGenerateWithAi('challenges')} disabled={isLoadingAi.challenges} className="ai-button">
                        {isLoadingAi.challenges ? <Loader2 className="animate-spin" size={14}/> : <Wand2 size={14}/>}
                         {isLoadingAi.challenges ? 'Suggesting...' : 'Suggest Risks with AI'}
                    </button>
                </div>

                <div className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg">
                    <label className="text-xl font-semibold mb-4 block">Next Month's Plans</label>
                    <textarea name="nextPlans" value={sessionData.nextPlans} onChange={handleTextChange} rows={5} className="w-full input-style" />
                     <button type="button" onClick={() => handleGenerateWithAi('nextPlans')} disabled={isLoadingAi.nextPlans} className="ai-button">
                        {isLoadingAi.nextPlans ? <Loader2 className="animate-spin" size={14}/> : <Wand2 size={14}/>}
                         {isLoadingAi.nextPlans ? 'Drafting...' : 'Draft Plans with AI'}
                    </button>
                </div>

                <div className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Recognition</h2>
                    <div className="space-y-4">
                        {sessionData.recognitions.map((rec, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                <User size={18} className="text-slate-400" />
                                <select value={rec.memberId} onChange={e => updateRecognition(index, 'memberId', e.target.value)} className="input-style-sm flex-shrink-0 w-1/3">
                                    <option value="">Select Member</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                                <input type="text" placeholder="For their contribution..." value={rec.comment} onChange={e => updateRecognition(index, 'comment', e.target.value)} className="input-style-sm w-full" />
                                <button type="button" onClick={() => removeRecognition(index)} className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                     <button type="button" onClick={addRecognition} className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-300 hover:text-brand-500">
                           <PlusCircle size={18}/> Add Recognition
                    </button>
                </div>

                <div className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg">
                    <label htmlFor="managerFeedback" className="text-xl font-semibold mb-4 block">Admin Feedback</label>
                    <textarea 
                        name="managerFeedback" 
                        id="managerFeedback"
                        value={sessionData.managerFeedback || ''} 
                        onChange={handleTextChange} 
                        rows={5} 
                        className="w-full input-style disabled:bg-slate-200/50 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed"
                        disabled={currentUser.role !== 'admin'}
                        placeholder={currentUser.role !== 'admin' ? "Only administrators can write feedback." : "Provide your feedback as a manager..."}
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <button type="submit" className="px-6 py-2.5 rounded-lg font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
                        Save Session
                    </button>
                </div>
            </form>
             <style>{`
                .input-style {
                    background-color: rgb(241 245 249 / 1);
                    border: 1px solid rgb(226 232 240 / 1);
                    border-radius: 0.375rem;
                    padding: 0.5rem 0.75rem;
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
                }
                .dark .input-style-sm {
                    background-color: rgb(30 41 59 / 1);
                    border-color: rgb(51 65 85 / 1);
                }
                 .input-style-sm:focus {
                    --tw-ring-color: rgb(14 165 233 / 1);
                    border-color: rgb(14 165 233 / 1);
                }
                .ai-button {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 0.75rem;
                    padding: 0.375rem 0.75rem;
                    font-size: 0.75rem;
                    line-height: 1rem;
                    font-semibold: 600;
                    color: #0284c7; /* brand-600 */
                    background-color: #e0f2fe; /* brand-100 */
                    border-radius: 9999px;
                    transition: background-color 0.2s;
                }
                .dark .ai-button {
                    color: #7dd3fc; /* brand-300 */
                    background-color: rgb(12 74 110 / 0.5); /* brand-900/50 */
                }
                .ai-button:hover {
                    background-color: #bae6fd; /* brand-200 */
                }
                .dark .ai-button:hover {
                    background-color: rgb(7 89 133 / 0.5); /* brand-800/50 */
                }
                .ai-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default CfrSessionPage;
