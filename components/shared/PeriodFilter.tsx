import React from 'react';
import { useOkr } from '../../App';

const PeriodFilter: React.FC = () => {
    const { currentYear, setCurrentYear, currentQuarter, setCurrentQuarter } = useOkr();
    
    const years = [2025, 2024];
    const quarters = [1, 2, 3, 4];

    return (
        <div className="flex items-center gap-2 sm:gap-4">
            <select
                aria-label="Year"
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="w-24 sm:w-28 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md py-2 px-3 focus:ring-brand-500 focus:border-brand-500 text-sm"
            >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
                aria-label="Quarter"
                value={currentQuarter}
                onChange={(e) => setCurrentQuarter(Number(e.target.value))}
                className="w-20 sm:w-24 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md py-2 px-3 focus:ring-brand-500 focus:border-brand-500 text-sm"
            >
                {quarters.map(q => <option key={q} value={q}>Q{q}</option>)}
            </select>
        </div>
    );
};

export default PeriodFilter;
