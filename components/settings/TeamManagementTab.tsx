
import React, { useState, useMemo } from 'react';
import { useOkr } from '../../App';
import TeamFormModal from './TeamFormModal';
import { Team } from '../../types';
import { PlusCircle, Users } from 'lucide-react';

const TeamManagementTab: React.FC = () => {
    const { currentUser, teams, users } = useOkr();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

    const isAdmin = currentUser.role === 'admin';

    const visibleTeams = useMemo(() => {
        if (isAdmin) return teams;
        return teams.filter(team => (team.members || []).includes(currentUser.id));
    }, [isAdmin, teams, currentUser.id]);

    const handleCreateTeam = () => {
        setSelectedTeam(null);
        setIsModalOpen(true);
    };

    const handleEditTeam = (team: Team) => {
        setSelectedTeam(team);
        setIsModalOpen(true);
    };

    return (
        <div className="p-2 md:p-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Team Management</h2>
                {isAdmin && (
                     <button onClick={handleCreateTeam} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-md hover:shadow-lg">
                        <PlusCircle size={18}/> New Team
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {visibleTeams.map(team => (
                    <div key={team.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{team.name} <span className="text-xs font-normal text-slate-400">{team.code}</span></h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{team.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                 <div className="flex items-center gap-1.5">
                                    <Users size={14}/>
                                    <span>{team.members?.length || 0} Member(s)</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => handleEditTeam(team)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-full hover:bg-slate-100 dark:hover:bg-slate-600 transition border border-slate-300 dark:border-slate-600">
                            {isAdmin ? 'Edit' : 'View'}
                        </button>
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
        </div>
    );
};

export default TeamManagementTab;
