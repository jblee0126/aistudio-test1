import React from 'react';
import { Link } from 'react-router-dom';
import { Objective } from '../../types';
import { useOkr } from '../../App';
import { getInitials, calculateObjectiveProgress } from '../../utils/helpers';
import { STATUS_COLORS } from '../../constants';
import { Edit, CheckCircle } from 'lucide-react';

interface ObjectiveCfrCardProps {
  objective: Objective;
  year: number;
  quarter: number;
}

const ObjectiveCfrCard: React.FC<ObjectiveCfrCardProps> = ({ objective, year, quarter }) => {
  const { users, getCfrSessionForMonth } = useOkr();
  const owner = users.find(u => u.id === objective.ownerId);
  const progress = calculateObjectiveProgress(objective);

  const quarterMonthsMap: { [key: number]: number[] } = { 1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12] };
  const monthsForQuarter = quarterMonthsMap[quarter] || [];
  
  const getMonthName = (monthNumber: number) => new Date(0, monthNumber - 1).toLocaleString('en-US', { month: 'short' });

  return (
    <div className="p-5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-slate-200/80 dark:border-slate-700/80 rounded-xl shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[objective.status]}`}>
              {objective.status}
            </span>
            {owner && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                 <div className="flex-shrink-0 w-6 h-6 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center text-xs font-bold text-brand-600 dark:text-brand-300">
                    {getInitials(owner.name)}
                </div>
                <span>{owner.name}</span>
              </div>
            )}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-100 leading-tight">{objective.title}</h3>
          
          <div className="mt-3">
             <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-300">OKR PROGRESS</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Q{quarter} CFR Sessions</span>
            <div className="flex items-center gap-2">
            {monthsForQuarter.map(month => {
                const session = getCfrSessionForMonth(objective.id, year, month);
                const sessionLink = `/cfr/${objective.id}/${year}/${month}`;
                return (
                    <Link 
                        key={month}
                        to={sessionLink} 
                        className={`flex flex-col items-center justify-center w-20 h-14 text-xs font-semibold rounded-lg transition-colors text-center ${
                            session
                            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-800/50'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:hover:bg-slate-600/50'
                        }`}
                    >
                       {session ? (
                           <CheckCircle size={16} className="mb-1"/>
                       ) : (
                           <Edit size={16} className="mb-1 text-brand-500 dark:text-brand-400"/>
                       )}
                       <span>{getMonthName(month)}</span>
                    </Link>
                )
            })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ObjectiveCfrCard;