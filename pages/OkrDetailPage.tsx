
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Objective, KeyResult, Status } from '../types';
import { calculateObjectiveProgress, getInitials } from '../utils/helpers';
import { STATUS_COLORS } from '../constants';
import { ChevronLeft, Edit, Trash2, Users, User, Calendar, BarChart2, Info } from 'lucide-react';
import CheckInModal from '../components/okr/CheckInModal';
import ConfirmationModal from '../components/shared/ConfirmationModal';
import { useOkr } from '../App';

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


const OkrDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getObjectiveById, updateKrProgress, deleteObjective, users, teams, currentUser } = useOkr();

  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [krToCheckIn, setKrToCheckIn] = useState<KeyResult | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const objective = getObjectiveById(id);

  if (!objective) {
    return <div className="text-center py-10">Objective not found.</div>;
  }

  const owner = users.find(u => u.id === objective.ownerId);
  const team = teams.find(t => t.id === objective.teamId);
  const progress = calculateObjectiveProgress(objective);
  
  const canEdit = (objective.isTeamObjective && currentUser.role === 'admin') ||
                  (!objective.isTeamObjective && objective.ownerId === currentUser.id);
  const canDelete = objective.ownerId === currentUser.id;
  const canCheckIn = objective.ownerId === currentUser.id;

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
    if (id) {
        deleteObjective(id);
        navigate('/okrs');
    }
    setIsDeleteModalOpen(false);
  };

  const backLink = objective.isTeamObjective ? "/team-dashboard" : "/okrs";

  return (
    <div className="space-y-6">
      <Link to={backLink} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 transition">
        <ChevronLeft size={18} /> Back to list
      </Link>

      {objective.isTeamObjective && (
          <div className="bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700/50 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg flex items-center gap-3">
              <Info size={20} />
              <p className="text-sm font-medium">This is a Team-level OKR. Only admins can edit or delete it.</p>
          </div>
      )}

      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[objective.status]}`}>{objective.status}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{objective.year} Q{objective.quarter}</span>
                </div>
                <h1 className="text-3xl font-bold mt-2 text-slate-800 dark:text-slate-100">{objective.title}</h1>
                <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-3xl">{objective.description}</p>
            </div>
            {(canEdit || canDelete) && (
                <div className="flex items-center gap-2">
                    {canEdit && (
                        <Link to={`/okrs/${id}/edit${objective.isTeamObjective ? '?isTeam=true' : ''}`} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                            <Edit size={20} className="text-slate-500 dark:text-slate-400"/>
                        </Link>
                    )}
                    {canDelete && (
                        <button onClick={handleDeleteClick} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                            <Trash2 size={20} className="text-red-500"/>
                        </button>
                    )}
                </div>
            )}
        </div>

        <div className="mt-6">
            <div className="flex justify-between items-center mb-1">
                <span className="text-lg font-bold text-brand-600 dark:text-brand-300">{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                <div className="bg-brand-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
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

      {showCheckInModal && krToCheckIn && (
        <CheckInModal
          kr={krToCheckIn}
          onClose={() => setShowCheckInModal(false)}
          onSave={handleCheckInSave}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Confirm ${objective.isTeamObjective ? 'Team ' : ''}Objective Deletion`}
        message={`Are you sure you want to delete the objective "${objective.title}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default OkrDetailPage;
