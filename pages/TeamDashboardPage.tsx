
import React, { useState, useMemo } from 'react';
import { useOkr } from '../App';
import { Status, KeyResult, Objective, User } from '../types';
// FIX: Import `canViewOkr` to resolve reference errors when checking user permissions.
import { calculateObjectiveProgress, calculateKrProgress, isKrAtRisk, isKrBehind, canViewOkr } from '../utils/helpers';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import { Users, Droplets, CheckCircle, AlertTriangle, Target, PlusCircle, ArrowRight } from 'lucide-react';
import PeriodFilter from '../components/shared/PeriodFilter';
import { STATUS_COLORS } from '../constants';
import OkrDetailModal from '../components/okr/OkrDetailModal';

const CompactObjectiveCard: React.FC<{ objective: Objective; users: User[]; showOwner?: boolean; onSelect: (obj: Objective) => void }> = ({ objective, users, showOwner = false, onSelect }) => {
  const progress = calculateObjectiveProgress(objective);
  const owner = showOwner ? users.find(u => u.id === objective.ownerId) : null;

  return (
    <div onClick={() => onSelect(objective)} className="cursor-pointer block w-full p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate flex-1 pr-2">{objective.title}</h3>
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_COLORS[objective.status]}`}>{objective.status}</span>
      </div>
      
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
        <span>{objective.keyResults.length} KRs</span>
        {owner && <span className="font-medium">{owner.name}</span>}
      </div>

      <div className="mt-3">
        <div className="flex justify-end items-center mb-1">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{progress}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
          <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
};


const TeamDashboardPage: React.FC = () => {
    const { objectives, users, teams, currentUser, currentYear, currentQuarter } = useOkr();
    const [selectedTeamId, setSelectedTeamId] = useState(currentUser.defaultTeamId || teams[0]?.id || 'all');
    const [selectedOkr, setSelectedOkr] = useState<Objective | null>(null);
    
    // --- Data Calculation ---
    const teamSpecificObjectives = useMemo(() => {
        return objectives.filter(o => 
            o.isTeamObjective &&
            o.year === currentYear &&
            o.quarter === currentQuarter &&
            canViewOkr(currentUser, o, users)
        );
    }, [objectives, currentYear, currentQuarter, currentUser, users]);

    const teamOkrsForDisplay = useMemo(() => {
        if (selectedTeamId === 'all') return teamSpecificObjectives;
        return teamSpecificObjectives.filter(o => o.teamId === selectedTeamId);
    }, [teamSpecificObjectives, selectedTeamId]);
    
    const personalObjectives = useMemo(() => {
        const periodFiltered = objectives.filter(o => 
            !o.isTeamObjective && 
            o.year === currentYear && 
            o.quarter === currentQuarter &&
            canViewOkr(currentUser, o, users)
        );
        const teamFiltered = selectedTeamId === 'all' ? periodFiltered : periodFiltered.filter(o => o.teamId === selectedTeamId);
        
        return teamFiltered.sort((a, b) => calculateObjectiveProgress(b) - calculateObjectiveProgress(a));
    }, [objectives, selectedTeamId, currentYear, currentQuarter, currentUser, users]);

    const teamKrs = useMemo(() => teamOkrsForDisplay.flatMap(o => o.keyResults), [teamOkrsForDisplay]);

    const teamKrSummary = useMemo(() => {
        if (teamKrs.length === 0) return { total: 0, completed: 0, inProgress: 0, behind: 0 };
        return {
            total: teamKrs.length,
            completed: teamKrs.filter(kr => kr.progress === 100).length,
            inProgress: teamKrs.filter(kr => kr.progress > 0 && kr.progress < 100).length,
            behind: teamKrs.filter(isKrBehind).length,
        }
    }, [teamKrs]);

    const personalObjectivesStats = useMemo(() => {
        const totalKrs = personalObjectives.reduce((sum, obj) => sum + obj.keyResults.length, 0);
        const overallProgress = totalKrs > 0 ? Math.round(
            personalObjectives.reduce((sum, obj) => 
                sum + obj.keyResults.reduce((krSum, kr) => krSum + calculateKrProgress(kr), 0), 0) / totalKrs
        ) : 0;
        
        const statusCounts = personalObjectives.reduce((acc, obj) => {
            acc[obj.status] = (acc[obj.status] || 0) + 1;
            return acc;
        }, {} as Record<Status, number>);

        return { overallProgress, statusCounts };
    }, [personalObjectives]);
    
    const pieData = Object.entries(personalObjectivesStats.statusCounts).map(([name, value]) => ({ name, value }));
    const COLORS: { [key in Status]: string } = {
        [Status.Done]: '#10B981',
        [Status.InProgress]: '#3B82F6',
        [Status.AtRisk]: '#F59E0B',
        [Status.Planned]: '#6B7280',
        [Status.Dropped]: '#EF4444',
    };

    const memberProgress = useMemo(() => {
        const progressByMember: { [userId: string]: { totalProgress: number; count: number; name: string } } = {};
        personalObjectives.forEach(obj => {
            const owner = users.find(u => u.id === obj.ownerId);
            if(owner) {
                if(!progressByMember[owner.id]) {
                    progressByMember[owner.id] = { totalProgress: 0, count: 0, name: owner.name };
                }
                progressByMember[owner.id].totalProgress += calculateObjectiveProgress(obj);
                progressByMember[owner.id].count += 1;
            }
        });
        return Object.values(progressByMember).map(p => ({
            ...p,
            avgProgress: p.count > 0 ? Math.round(p.totalProgress / p.count) : 0,
        })).sort((a,b) => b.avgProgress - a.avgProgress);
    }, [personalObjectives, users]);

    const atRiskKrs = useMemo(() => {
        const risks: { kr: KeyResult; objective: Objective }[] = [];
        personalObjectives.forEach(obj => {
            obj.keyResults.forEach(kr => {
                if(isKrAtRisk(kr)) {
                    risks.push({ kr, objective: obj });
                }
            })
        })
        return risks;
    }, [personalObjectives]);

    // --- Components ---
    const StatCard = ({ icon, title, value, colorClass }: { icon: React.ReactNode, title: string, value: string | number, colorClass: string }) => (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <div className={`p-3 rounded-full ${colorClass}`}>{icon}</div>
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
            </div>
        </div>
    );
    
    return (
        <div className="space-y-8">
            {/* 1. Header & Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Team Dashboard</h1>
                <div className="flex items-center gap-4">
                    <PeriodFilter />
                    <div className="flex items-center gap-2">
                      <Users size={20} className="text-slate-500"/>
                      <select
                          value={selectedTeamId}
                          onChange={e => setSelectedTeamId(e.target.value)}
                          className="w-48 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md py-2 px-3 focus:ring-brand-500 focus:border-brand-500"
                      >
                          <option value="all">All Visible Teams</option>
                          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                </div>
            </div>

            {/* 2. Team OKR Summary + KR Progress */}
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h2 className="text-xl font-semibold">Team OKR Summary & Progress</h2>
                    {currentUser?.role === 'admin' && (
                        <Link to="/okrs/new?isTeam=true" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-sm hover:shadow-md">
                            <PlusCircle size={16}/> New Team OKR
                        </Link>
                    )}
                </div>
                {teamOkrsForDisplay.length > 0 ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                           <div className="text-center"><p className="text-sm text-slate-500">KR Total</p><p className="text-2xl font-bold">{teamKrSummary.total}</p></div>
                           <div className="text-center"><p className="text-sm text-slate-500">Completed</p><p className="text-2xl font-bold text-green-500">{teamKrSummary.completed}</p></div>
                           <div className="text-center"><p className="text-sm text-slate-500">In Progress</p><p className="text-2xl font-bold text-blue-500">{teamKrSummary.inProgress}</p></div>
                           <div className="text-center"><p className="text-sm text-slate-500">Behind</p><p className="text-2xl font-bold text-amber-500">{teamKrSummary.behind}</p></div>
                        </div>
                        <div className="flex flex-wrap gap-4">
                           {teamOkrsForDisplay.map(obj => <CompactObjectiveCard key={obj.id} objective={obj} users={users} onSelect={setSelectedOkr} />)}
                        </div>
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-6">No Team OKRs defined for the selected filters.</p>
                )}
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Target size={24} className="text-white"/>} title="Member Objectives" value={personalObjectives.length} colorClass="bg-blue-500"/>
                <StatCard icon={<CheckCircle size={24} className="text-white"/>} title="Objectives Done" value={personalObjectivesStats.statusCounts[Status.Done] || 0} colorClass="bg-green-500"/>
                <StatCard icon={<AlertTriangle size={24} className="text-white"/>} title="At Risk" value={personalObjectivesStats.statusCounts[Status.AtRisk] || 0} colorClass="bg-amber-500"/>
                <StatCard icon={<Droplets size={24} className="text-white"/>} title="Avg. KR Progress" value={`${personalObjectivesStats.overallProgress}%`} colorClass="bg-purple-500"/>
            </div>

            {/* Progress Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold mb-4">Team Member Progress</h2>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={memberProgress} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                            <XAxis dataKey="name" />
                            <YAxis unit="%" />
                            <Tooltip cursor={{fill: 'rgba(100,100,100,0.1)'}} contentStyle={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(5px)', borderRadius: '0.5rem', border: '1px solid rgba(0,0,0,0.1)', color: '#000' }} />
                            <Legend />
                            <Bar dataKey="avgProgress" name="Avg. Objective Progress" fill="#3B82F6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-semibold mb-4">Status Overview</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name">
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name as Status]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(5px)', borderRadius: '0.5rem', border: '1px solid rgba(0,0,0,0.1)', color: '#000' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Team Members' Personal OKRs */}
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h2 className="text-xl font-semibold">Team Members’ Personal OKRs</h2>
                    <Link to="/okrs" className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300">
                        View All Personal OKRs <ArrowRight size={16}/>
                    </Link>
                </div>
                 {personalObjectives.length > 0 ? (
                    <div className="space-y-4">
                         {personalObjectives.slice(0, 8).map(obj => <CompactObjectiveCard key={obj.id} objective={obj} users={users} showOwner={true} onSelect={setSelectedOkr} />)}
                    </div>
                 ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-6">No Personal OKRs found for this team in the selected period.</p>
                 )}
            </div>
            
            {/* Key Results at Risk */}
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold mb-4">Key Results at Risk</h2>
                {atRiskKrs.length > 0 ? (
                    <div className="space-y-3">
                        {atRiskKrs.map(({kr, objective}) => {
                             const owner = users.find(u => u.id === (kr.ownerId || objective.ownerId));
                             const progress = calculateKrProgress(kr);
                             return (
                                <div key={kr.id} onClick={() => setSelectedOkr(objective)} className="cursor-pointer block p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex flex-wrap items-center justify-between gap-4 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors">
                                    <div className="flex-1 min-w-[200px]">
                                        <p className="font-semibold">{kr.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">From: {objective.title}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-slate-700 dark:text-slate-200">
                                        {owner && (
                                            <div className="text-center w-24">
                                                <p className="font-semibold text-sm truncate" title={owner.name}>{owner.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Owner</p>
                                            </div>
                                        )}
                                        <div className="text-center w-20">
                                            <p className="font-bold text-lg">{progress.toFixed(0)}%</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Progress</p>
                                        </div>
                                         <div className="text-center w-24">
                                            <p className="font-semibold text-sm">{new Date(kr.dueDate).toLocaleDateString('en-CA')}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Due Date</p>
                                        </div>
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-6">No Key Results are currently identified as at risk. Great job!</p>
                )}
            </div>
            {selectedOkr && (
                <OkrDetailModal
                    objective={selectedOkr}
                    onClose={() => setSelectedOkr(null)}
                />
            )}
        </div>
    );
};

export default TeamDashboardPage;
