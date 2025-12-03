import React, { useState, useMemo } from 'react';
import OkrCard from '../components/okr/OkrCard';
import { Objective, Status } from '../types';
import { PlusCircle, Search, Users, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOkr } from '../App';
import PeriodFilter from '../components/shared/PeriodFilter';
import { canViewOkr } from '../utils/helpers';

const OkrListPage: React.FC = () => {
  const { objectives, users, teams, currentYear, currentQuarter, currentUser } = useOkr();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{
    status: string;
    teamId: string;
    ownerId: string;
  }>({
    status: 'all',
    teamId: 'all',
    ownerId: 'all',
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const allFilteredObjectives = useMemo(() => {
    return objectives
      .filter(obj => obj.year === currentYear && obj.quarter === currentQuarter)
      .filter(obj => canViewOkr(currentUser, obj, users))
      .filter(obj => {
        if (filters.status !== 'all' && obj.status !== filters.status) return false;
        if (filters.teamId !== 'all' && obj.teamId !== filters.teamId) return false;
        if (filters.ownerId !== 'all' && obj.ownerId !== filters.ownerId) return false;
        return true;
      })
      .filter(obj => {
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
          obj.title.toLowerCase().includes(lowerSearchTerm) ||
          obj.description?.toLowerCase().includes(lowerSearchTerm) ||
          obj.keyResults.some(kr => kr.title.toLowerCase().includes(lowerSearchTerm))
        );
      });
  }, [objectives, searchTerm, filters, currentYear, currentQuarter, currentUser, users]);

  const teamOkrs = useMemo(() => allFilteredObjectives.filter(obj => obj.isTeamObjective), [allFilteredObjectives]);
  const personalOkrs = useMemo(() => allFilteredObjectives.filter(obj => !obj.isTeamObjective), [allFilteredObjectives]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Objectives & Key Results</h1>
        <div className="flex items-center gap-4">
            <PeriodFilter />
            <Link to="/okrs/new" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
                <PlusCircle size={18}/> Create New OKR
            </Link>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input
              type="text"
              placeholder="Search OKRs..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-brand-500 focus:border-brand-500">
            <option value="all">All Statuses</option>
            {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select name="teamId" value={filters.teamId} onChange={handleFilterChange} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-brand-500 focus:border-brand-500">
            <option value="all">All Teams</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select name="ownerId" value={filters.ownerId} onChange={handleFilterChange} className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md focus:ring-brand-500 focus:border-brand-500">
            <option value="all">All Owners</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>
      
      {(teamOkrs.length > 0 || personalOkrs.length > 0) ? (
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-4">
              <Users className="text-brand-500" />
              <span>Team OKRs</span>
              <span className="text-sm font-medium bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">{teamOkrs.length}</span>
            </h2>
            {teamOkrs.length > 0 ? (
              <div className="space-y-4">
                {teamOkrs.map(obj => <OkrCard key={obj.id} objective={obj} />)}
              </div>
            ) : (
              <div className="text-center py-6 bg-white/40 dark:bg-slate-800/40 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                <p className="text-slate-500 dark:text-slate-400">No Team OKRs found for the selected period and filters.</p>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3 mb-4">
              <User className="text-brand-500" />
              <span>Personal OKRs</span>
              <span className="text-sm font-medium bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">{personalOkrs.length}</span>
            </h2>
            {personalOkrs.length > 0 ? (
              <div className="space-y-4">
                {personalOkrs.map(obj => <OkrCard key={obj.id} objective={obj} />)}
              </div>
            ) : (
              <div className="text-center py-6 bg-white/40 dark:bg-slate-800/40 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                <p className="text-slate-500 dark:text-slate-400">No Personal OKRs found for the selected period and filters.</p>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">No OKRs found for {currentYear} Q{currentQuarter} with the current filters.</p>
        </div>
      )}
    </div>
  );
};

export default OkrListPage;
