
import React, { useState } from 'react';
import { useOkr } from '../../App';
import TeamFormModal from '../settings/TeamFormModal';
import { Team } from '../../types';
import { PlusCircle, Users, Trash2 } from 'lucide-react';
import ConfirmationModal from '../shared/ConfirmationModal';

const TeamManagementTab: React.FC = () => {
    const { teams, deleteTeam } = useOkr();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

    const handleCreateTeam = () => {
        setSelectedTeam(null);
        setIsModalOpen(true);
    };

    const handleEditTeam = (team: Team) => {
        setSelectedTeam(team);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (e: React.MouseEvent, teamId: string) => {
        e.stopPropagation();
        setTeamToDelete(teamId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (teamToDelete) {
            deleteTeam(teamToDelete);
        }
        setIsDeleteModalOpen(false);
        setTeamToDelete(null);
    };

    return (
        <div className="p-2 md:p-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Team Management</h2>
                 <button onClick={handleCreateTeam} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-md hover:shadow-lg">
                    <PlusCircle size={18}/> New Team
                </button>
            </div>

            <div className="space-y-4">
                {teams.map(team => (
                    <div key={team.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center hover:border-slate-300 dark:hover:border-slate-600 transition">
                        <div className="flex-1 cursor-pointer" onClick={() => handleEditTeam(team)}>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{team.name} <span className="text-xs font-normal text-slate-400">{team.code}</span></h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{team.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                 <div className="flex items-center gap-1.5">
                                    <Users size={14}/>
                                    <span>{team.members?.length || 0} Member(s)</span>
                                </div>
                                <span>{team.divisionName}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleEditTeam(team)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600 transition border border-slate-300 dark:border-slate-600">
                                Edit
                            </button>
                            <button onClick={(e) => handleDeleteClick(e, team.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <TeamFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    teamToEdit={selectedTeam}
                />
            )}
            <ConfirmationModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                onConfirm={confirmDelete} 
                title="Delete Team" 
                message="Are you sure you want to delete this team? Users in this team will need to be reassigned." 
            />
        </div>
    );
};

export default TeamManagementTab;
