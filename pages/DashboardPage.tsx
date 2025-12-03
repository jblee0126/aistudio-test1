import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { Target, AlertTriangle, Activity, TrendingUp, Clock, Eye } from 'lucide-react';
import { Status, KeyResult, Objective } from '../types';
import { calculateObjectiveProgress, getLastUpdateDate, isKrBehind } from '../utils/helpers';
import { useOkr } from '../App';
import PeriodFilter from '../components/shared/PeriodFilter';
import CheckInModal from '../components/okr/CheckInModal';
import { Link } from 'react-router-dom';
import { STATUS_COLORS } from '../constants';
import OkrDetailModal from '../components/okr/OkrDetailModal';

type KrWithObjective = {
  kr: KeyResult;
  objective: Objective;
};

// --- Sub-components for the new dashboard ---

const CompactObjectiveCard: React.FC<{ objective: Objective; onSelect: (obj: Objective) => void }> = ({ objective, onSelect }) => {
    const progress = calculateObjectiveProgress(objective);

    return (
        <div onClick={() => onSelect(objective)} className="cursor-pointer flex-1 min-w-[300px] p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/80 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex justify-between items-start">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate flex-1 pr-2">{objective.title}</h3>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[objective.status]}`}>{objective.status}</span>
            </div>
            
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{objective.keyResults.length} KRs</p>

            <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-brand-600 dark:text-brand-300">PROGRESS</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, title, value, colorClass }: { icon: React.ReactNode, title: string, value: string | number, colorClass: string }) => (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-4">
        <div className={`p-3 rounded-full ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        </div>
    </div>
);

const KrActionList: React.FC<{ krs: KrWithObjective[], onUpdateClick: (kr: KeyResult) => void, onSelectObjective: (obj: Objective) => void }> = ({ krs, onUpdateClick, onSelectObjective }) => {
  return (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 h-full">
      <h2 className="text-xl font-semibold mb-4">This Week’s KR Actions</h2>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
        {krs.length > 0 ? krs.map(({ kr, objective }) => {
          const lastUpdate = getLastUpdateDate(kr);
          const daysSinceUpdate = lastUpdate ? Math.floor((new Date().getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24)) : null;
          const needsUpdate = daysSinceUpdate !== null && daysSinceUpdate > 14;

          return (
            <div key={kr.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-start">
                  <p className="font-semibold text-sm flex-1 pr-2">{kr.title}</p>
                  <div className="flex gap-1">
                      <button onClick={() => onUpdateClick(kr)} className="px-2 py-1 text-xs font-semibold text-brand-600 bg-brand-100 rounded-full hover:bg-brand-200 dark:bg-brand-900/50 dark:text-brand-300 dark:hover:bg-brand-800/50">Update Progress</button>
                      <button onClick={() => onSelectObjective(objective)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                          <Eye size={14} /> View Details
                      </button>
                  </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="font-bold text-brand-500">{kr.progress}%</div>
                  <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {lastUpdate ? `${daysSinceUpdate} day(s) ago` : 'No updates yet'}
                      {/* FIX: The 'title' prop is not valid on lucide-react icons. Wrap the icon in a span with a title attribute for the tooltip. */}
                      {needsUpdate && <span title="Update overdue"><AlertTriangle size={12} className="text-amber-500" /></span>}
                  </div>
              </div>
            </div>
          );
        }) : <p className="text-center py-10 text-slate-500 dark:text-slate-400">All KRs are up-to-date. Great job!</p>}
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
  const { objectives, currentUser, currentYear, currentQuarter, updateKrProgress } = useOkr();
  const [krToCheckIn, setKrToCheckIn] = useState<KeyResult | null>(null);
  const [selectedOkr, setSelectedOkr] = useState<Objective | null>(null);

  const myOkrs = useMemo(() => objectives.filter(o => 
    o.ownerId === currentUser.id &&
    o.year === currentYear &&
    o.quarter === currentQuarter
  ), [objectives, currentUser.id, currentYear, currentQuarter]);

  const myKrs = useMemo(() => myOkrs.flatMap(o => o.keyResults), [myOkrs]);

  const { krTotal, krOnTrack, krBehind, avgKrProgress } = useMemo(() => {
    const total = myKrs.length;
    if (total === 0) return { krTotal: 0, krOnTrack: 0, krBehind: 0, avgKrProgress: 0 };
    
    const onTrack = myKrs.filter(kr => kr.progress >= 50).length;
    const behind = myKrs.filter(isKrBehind).length;
    const avgProgress = Math.round(myKrs.reduce((sum, kr) => sum + kr.progress, 0) / total);
    
    return { krTotal: total, krOnTrack: onTrack, krBehind: behind, avgKrProgress: avgProgress };
  }, [myKrs]);

  const progressDistributionData = useMemo(() => {
    const bands = [
        { name: '0-25%', count: 0, color: '#fca5a5' }, // red-300
        { name: '26-50%', count: 0, color: '#fdba74' }, // orange-300
        { name: '51-75%', count: 0, color: '#fde047' }, // yellow-300
        { name: '76-99%', count: 0, color: '#86efac' }, // green-300
        { name: '100%', count: 0, color: '#4ade80' },   // green-400
    ];
    myKrs.forEach(kr => {
        if (kr.progress <= 25) bands[0].count++;
        else if (kr.progress <= 50) bands[1].count++;
        else if (kr.progress <= 75) bands[2].count++;
        else if (kr.progress < 100) bands[3].count++;
        else if (kr.progress === 100) bands[4].count++;
    });
    return bands;
  }, [myKrs]);

  const actionableKrs = useMemo(() => {
    const krWithObjectives = myOkrs.flatMap(obj => obj.keyResults.map(kr => ({ kr, objective: obj })));
    return krWithObjectives
      .filter(({ kr }) => kr.progress < 100)
      .sort((a, b) => {
        const dateA = getLastUpdateDate(a.kr)?.getTime() || 0;
        const dateB = getLastUpdateDate(b.kr)?.getTime() || 0;
        if (dateA !== dateB) return dateA - dateB;
        return a.kr.progress - b.kr.progress;
      });
  }, [myOkrs]);

  const handleCheckInSave = (krId: string, newProgress: number, comment?: string) => {
    const krWithOwner = actionableKrs.find(k => k.kr.id === krId);
    if(krWithOwner) {
        updateKrProgress(krWithOwner.objective.id, krId, newProgress, comment);
    }
    setKrToCheckIn(null);
  };
  
  if (myOkrs.length === 0) {
      return (
           <div className="space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">My OKR</h1>
                    <PeriodFilter />
                </div>
                <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <Target size={48} className="mx-auto text-slate-400" />
                    <h2 className="mt-4 text-xl font-semibold">No OKRs Found</h2>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">You have not created any OKRs for {currentYear} Q{currentQuarter}.</p>
                    <Link to="/okrs/new" className="mt-6 inline-block px-4 py-2 rounded-lg text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-md hover:shadow-lg">
                        Create Your First OKR
                    </Link>
                </div>
            </div>
      );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">My OKR</h1>
        <PeriodFilter />
      </div>

      <div className="space-y-4">
          <h2 className="text-xl font-semibold">My Current Objectives</h2>
          <div className="flex flex-wrap gap-4">
              {myOkrs.map(obj => (
                  <CompactObjectiveCard key={obj.id} objective={obj} onSelect={setSelectedOkr} />
              ))}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={<Target size={24} className="text-white"/>} title="KR Total" value={krTotal} colorClass="bg-blue-500"/>
          <StatCard icon={<TrendingUp size={24} className="text-white"/>} title="KR On Track" value={krOnTrack} colorClass="bg-green-500"/>
          <StatCard icon={<AlertTriangle size={24} className="text-white"/>} title="KR Behind" value={krBehind} colorClass="bg-amber-500"/>
          <StatCard icon={<Activity size={24} className="text-white"/>} title="My Avg KR Progress" value={`${avgKrProgress}%`} colorClass="bg-purple-500"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
            <KrActionList krs={actionableKrs} onUpdateClick={setKrToCheckIn} onSelectObjective={setSelectedOkr} />
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold mb-4">My KR Progress Distribution</h2>
          <ResponsiveContainer width="100%" height={320}>
              <BarChart data={progressDistributionData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.2} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'rgba(241, 245, 249, 0.5)'}} contentStyle={{
                      background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(5px)',
                      borderRadius: '0.5rem', border: '1px solid rgba(0,0,0,0.1)', color: '#000'
                  }}/>
                  <Bar dataKey="count" name="KR Count" barSize={20}>
                      {progressDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                  </Bar>
              </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {krToCheckIn && (
        <CheckInModal
          kr={krToCheckIn}
          onClose={() => setKrToCheckIn(null)}
          onSave={handleCheckInSave}
        />
      )}

      {selectedOkr && (
        <OkrDetailModal
          objective={selectedOkr}
          onClose={() => setSelectedOkr(null)}
        />
      )}
    </div>
  );
};

export default DashboardPage;