import React from 'react';
import { Link } from 'react-router-dom';
import { Objective } from '../../types';
import { useOkr } from '../../App';
import { calculateObjectiveProgress, getInitials } from '../../utils/helpers';
import { STATUS_COLORS } from '../../constants';
import { CheckSquare, Users } from 'lucide-react';

const OkrCard: React.FC<{ objective: Objective }> = ({ objective }) => {
  const { users } = useOkr();
  const progress = calculateObjectiveProgress(objective);
  const owner = users.find(u => u.id === objective.ownerId);

  return (
    <Link to={`/okrs/${objective.id}`} className="block">
      <div className="p-5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-slate-200/80 dark:border-slate-700/80 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
               <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[objective.status]}`}>
                  {objective.status}
              </span>
              {owner && (
                <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex-shrink-0 w-5 h-5 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-300">
                        {getInitials(owner.name)}
                    </div>
                    <span className="text-xs font-medium">{owner.name}</span>
                </div>
              )}
              {objective.isTeamObjective && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                  <Users size={12} /> Team OKR
                </span>
              )}
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight">{objective.title}</h3>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-300">PROGRESS</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
                <CheckSquare size={16}/>
                <span>{objective.keyResults.length} Key Results</span>
            </div>
        </div>
      </div>
    </Link>
  );
};

export default OkrCard;