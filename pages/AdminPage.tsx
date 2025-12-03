
import React, { useState } from 'react';
import UserManagementTab from '../components/admin/UserManagementTab';
import TeamManagementTab from '../components/admin/TeamManagementTab';
import DivisionManagementTab from '../components/admin/DivisionManagementTab';
import { Users, ShieldCheck, Building } from 'lucide-react';

type Tab = 'users' | 'teams' | 'divisions';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('users');

  const tabClass = (tabName: Tab) => 
    `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
      activeTab === tabName
        ? 'border-brand-500 text-brand-600 dark:text-brand-300'
        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
    }`;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Admin Dashboard</h1>
      
      <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
              <button onClick={() => setActiveTab('users')} className={tabClass('users')}>
                  <ShieldCheck size={16}/>
                  <span>User Management</span>
              </button>
              <button onClick={() => setActiveTab('teams')} className={tabClass('teams')}>
                  <Users size={16}/>
                  <span>Team Management</span>
              </button>
              <button onClick={() => setActiveTab('divisions')} className={tabClass('divisions')}>
                  <Building size={16}/>
                  <span>Division Management</span>
              </button>
          </nav>
      </div>

      <div className="p-1 md:p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg min-h-[400px]">
        {activeTab === 'users' && <UserManagementTab />}
        {activeTab === 'teams' && <TeamManagementTab />}
        {activeTab === 'divisions' && <DivisionManagementTab />}
      </div>
    </div>
  );
};

export default AdminPage;
