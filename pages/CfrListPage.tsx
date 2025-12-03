import React, { useMemo } from 'react';
import { useOkr } from '../App';
import ObjectiveCfrCard from '../components/cfr/ObjectiveCfrCard';
import PeriodFilter from '../components/shared/PeriodFilter';
import { canViewCfr } from '../utils/helpers';

const CfrListPage: React.FC = () => {
  const { objectives, currentYear, currentQuarter, currentUser, users } = useOkr();

  const filteredObjectives = useMemo(() => {
    return objectives
      .filter(obj => obj.year === currentYear && obj.quarter === currentQuarter)
      .filter(obj => {
        const owner = users.find(u => u.id === obj.ownerId);
        if (!owner) {
            return false;
        }
        return canViewCfr(currentUser, owner);
      });
  }, [objectives, currentYear, currentQuarter, currentUser, users]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">CFR Sessions</h1>
        <div className="flex items-center gap-2 sm:gap-4">
            <PeriodFilter />
        </div>
      </div>
      
       {filteredObjectives.length > 0 ? (
        <div className="space-y-4">
          {filteredObjectives.map(obj => (
            <ObjectiveCfrCard 
              key={obj.id} 
              objective={obj} 
              year={currentYear}
              quarter={currentQuarter}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">No OKRs you have permission to view were found for {currentYear} Q{currentQuarter}.</p>
        </div>
      )}

    </div>
  );
};

export default CfrListPage;