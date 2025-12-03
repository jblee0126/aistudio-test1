
import React, { useState, createContext, useMemo, useContext, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import OkrListPage from './pages/OkrListPage';
import OkrDetailPage from './pages/OkrDetailPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/layout/Layout';
import OkrFormPage from './pages/OkrFormPage';
import CfrListPage from './pages/CfrListPage';
import CfrSessionPage from './pages/CfrSessionPage';
import TeamDashboardPage from './pages/TeamDashboardPage';
import AdminPage from './pages/AdminPage';
import { Objective, OkrFormData, User, Team, CfrSession, Division, Status } from './types';
import { mockObjectives, mockUsers, mockTeams, mockCfrSessions, mockDivisions } from './data/mockData';
import { calculateObjectiveProgress, canCreateTeamOkr } from './utils/helpers';
import * as db from './services/firestoreService';
import { Loader2 } from 'lucide-react';

type Theme = 'light' | 'dark';
type ToastMessage = { message: string; type: 'success' | 'error' };

export const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: 'light',
  toggleTheme: () => {},
});

// OKR & App-wide Context for state management
interface OkrContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  objectives: Objective[];
  users: User[];
  teams: Team[];
  divisions: Division[];
  cfrSessions: CfrSession[];
  toast: ToastMessage | null;
  setToast: (toast: ToastMessage | null) => void;
  getObjectiveById: (id: string | undefined) => Objective | undefined;
  addObjective: (formData: OkrFormData) => void;
  updateObjective: (id: string, formData: OkrFormData) => void;
  deleteObjective: (id: string) => void;
  updateKrProgress: (objectiveId: string, krId: string, newProgress: number, comment?: string) => void;
  getCfrSessionForMonth: (objectiveId: string, year: number, month: number) => CfrSession | undefined;
  addOrUpdateCfrSession: (sessionData: Omit<CfrSession, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUserProfile: (userId: string, profileData: Partial<User>) => void;
  addUser: (userData: User) => void;
  deleteUser: (userId: string) => void;
  addTeam: (teamData: Omit<Team, 'id'>) => void;
  updateTeam: (teamId: string, teamData: Team) => void;
  deleteTeam: (teamId: string) => void;
  addDivision: (divisionData: Division) => void;
  updateDivision: (divisionId: string, divisionData: Division) => void;
  deleteDivision: (divisionId: string) => void;
  currentYear: number;
  setCurrentYear: (year: number) => void;
  currentQuarter: number;
  setCurrentQuarter: (quarter: number) => void;
}

const OkrContext = createContext<OkrContextType | undefined>(undefined);

export const useOkr = () => {
  const context = useContext(OkrContext);
  if (context === undefined) {
    throw new Error('useOkr must be used within an OkrProvider');
  }
  return context;
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
      return 'dark';
    }
    return 'light';
  });

  // Initial State is now empty
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [cfrSessions, setCfrSessions] = useState<CfrSession[]>([]);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [currentYear, setCurrentYear] = useState(2025);
  const [currentQuarter, setCurrentQuarter] = useState(4);

  const showToast = (toastMessage: ToastMessage) => {
    setToast(toastMessage);
    setTimeout(() => setToast(null), 3000);
  };

  // --- Data Loading & Seeding ---
  useEffect(() => {
    const loadData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Users
            // If this throws (e.g. 403 Permission Denied), we skip to catch block and fallback to mock data
            let fetchedUsers = await db.fetchCollection<User>('users');
            
            // Sanitize users: Ensure teamIds is always an array
            fetchedUsers = fetchedUsers.map(u => ({ ...u, teamIds: u.teamIds || (u.defaultTeamId ? [u.defaultTeamId] : []) }));

            // 2. Seed if empty (and we have permission)
            if (fetchedUsers.length === 0) {
                console.log("Database empty. Seeding mock data...");
                await db.seedBatch('divisions', mockDivisions);
                await db.seedBatch('teams', mockTeams);
                await db.seedBatch('users', mockUsers);
                await db.seedBatch('objectives', mockObjectives);
                // Reload
                fetchedUsers = await db.fetchCollection<User>('users');
                fetchedUsers = fetchedUsers.map(u => ({ ...u, teamIds: u.teamIds || (u.defaultTeamId ? [u.defaultTeamId] : []) })); // Sanitize again

                setDivisions(await db.fetchCollection<Division>('divisions'));
                
                let fetchedTeams = await db.fetchCollection<Team>('teams');
                fetchedTeams = fetchedTeams.map(t => ({ ...t, members: t.members || [] })); // Sanitize teams
                setTeams(fetchedTeams);

                setObjectives(await db.fetchCollection<Objective>('objectives'));
                // cfrSessions empty initially
            } else {
                setUsers(fetchedUsers);
                let [fetchedTeams, fetchedDivs, fetchedObjs, fetchedCfr] = await Promise.all([
                    db.fetchCollection<Team>('teams'),
                    db.fetchCollection<Division>('divisions'),
                    db.fetchCollection<Objective>('objectives'),
                    db.fetchCollection<CfrSession>('cfr_sessions')
                ]);
                
                // Sanitize teams
                fetchedTeams = fetchedTeams.map(t => ({ ...t, members: t.members || [] }));

                setTeams(fetchedTeams);
                setDivisions(fetchedDivs);
                setObjectives(fetchedObjs);
                setCfrSessions(fetchedCfr);
            }

            // Set Default User
            if (fetchedUsers.length > 0) {
                // Changed default from '최성운' to '이종범'
                const defaultUser = fetchedUsers.find(u => u.name === '이종범') || fetchedUsers[0];
                setCurrentUser(defaultUser);
            }

        } catch (error) {
            console.error("Firestore connection failed, falling back to mock data:", error);
            showToast({ message: 'Could not connect to Firestore. Using local demo data.', type: 'error' });
            
            // --- FALLBACK TO MOCK DATA ---
            setUsers(mockUsers);
            setTeams(mockTeams);
            setDivisions(mockDivisions);
            setObjectives(mockObjectives);
            setCfrSessions(mockCfrSessions);
            
            // Set default user from mock
            // Changed default from '최성운' to '이종범'
            const defaultUser = mockUsers.find(u => u.name === '이종범') || mockUsers[0];
            setCurrentUser(defaultUser);

        } finally {
            setIsLoading(false);
        }
    };
    loadData();
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const getObjectiveById = (id: string | undefined) => {
    if (!id) return undefined;
    return objectives.find(o => o.id === id);
  };
  
  const getCfrSessionForMonth = (objectiveId: string, year: number, month: number) => {
    return cfrSessions.find(s => 
      s.objectiveId === objectiveId && s.year === year && s.month === month
    );
  };
  
  const addOrUpdateCfrSession = async (sessionData: Omit<CfrSession, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser) return;
    try {
        const existingSession = getCfrSessionForMonth(sessionData.objectiveId, sessionData.year, sessionData.month);
        if(existingSession) {
            const updatedSession = { ...existingSession, ...sessionData, updatedAt: new Date().toISOString() };
            // Optimistic Update
            setCfrSessions(prev => prev.map(s => s.id === existingSession.id ? updatedSession : s));
            // API Call
            await db.updateDocument('cfr_sessions', existingSession.id, updatedSession);
            showToast({ message: 'CFR Session saved!', type: 'success' });
        } else {
            const newSession: CfrSession = { 
                ...sessionData, 
                id: `cfr-${Date.now()}`, 
                createdAt: new Date().toISOString(), 
                updatedAt: new Date().toISOString() 
            };
            // Optimistic
            setCfrSessions(prev => [...prev, newSession]);
            // API Call
            await db.createDocument('cfr_sessions', newSession);
            showToast({ message: 'CFR Session created!', type: 'success' });
        }
    } catch (e) {
        showToast({ message: 'Failed to save CFR session to server.', type: 'error' });
    }
  };


  const addObjective = async (formData: OkrFormData) => {
    if (!currentUser) return;

    if (formData.isTeamObjective) {
        if (!canCreateTeamOkr(currentUser)) {
            showToast({ message: "You don't have permission to create Team OKRs.", type: 'error' });
            return;
        }
    }
    
    const team = teams.find(t => t.id === formData.teamId);
    if (team?.divisionId !== currentUser.divisionId) {
        showToast({ message: "본인이 속한 본부와 팀에 대해서만 OKR을 만들 수 있습니다.", type: 'error' });
        return;
    }
    if (!formData.title.trim()) {
        showToast({ message: "Objective title is required.", type: 'error' });
        return;
    }
    if (formData.keyResults.length === 0) {
        showToast({ message: "At least one Key Result is required.", type: 'error' });
        return;
    }
    
    const newObjective: Objective = {
      ...formData,
      id: `obj-${Date.now()}`,
      ownerId: currentUser.id,
      teamId: formData.isTeamObjective ? currentUser.defaultTeamId : formData.teamId,
      status: Status.Planned,
      year: currentYear,
      quarter: currentQuarter,
      changelog: [{ timestamp: new Date().toISOString(), userId: currentUser.id, change: 'Objective created.' }],
      keyResults: formData.keyResults.map((kr, index) => ({
        ...kr,
        id: `kr-${Date.now()}-${index}`,
        ownerId: currentUser.id,
        progress: 0,
        progressUpdates: [],
      })),
    };

    // Optimistic
    setObjectives(prev => [newObjective, ...prev]);
    showToast({ message: 'Creating Objective...', type: 'success' });

    try {
        await db.createDocument('objectives', newObjective);
        showToast({ message: 'Objective created successfully!', type: 'success' });
    } catch (e) {
        showToast({ message: 'Failed to create Objective on server (Offline mode).', type: 'error' });
        // Rollback (omitted for brevity)
    }
  };

  const updateObjective = async (id: string, formData: OkrFormData) => {
    if (!currentUser) return;
    const originalObjective = getObjectiveById(id);
    if (!originalObjective) return;

    // Permission Check
    if (originalObjective.isTeamObjective) {
        if (currentUser.role !== 'admin') {
            showToast({ message: "Only admins can edit Team OKRs.", type: 'error' });
            return;
        }
    } else { // It's a personal OKR
        if (originalObjective.ownerId !== currentUser.id) {
            showToast({ message: "You can only edit your own OKRs.", type: 'error' });
            return;
        }
    }

    const updatedKrs = formData.keyResults.map((formKr, index) => {
        const originalKr = originalObjective.keyResults.find(okr => okr.title === formKr.title) || originalObjective.keyResults[index];
        return {
            ...(originalKr || {}),
            ...formKr,
            id: originalKr?.id || `kr-${Date.now()}-${index}`,
            progress: originalKr?.progress ?? 0,
            progressUpdates: originalKr?.progressUpdates ?? [],
            ownerId: originalKr?.ownerId || currentUser.id
        };
    });

    const { ownerId, status, ...restOfFormData } = formData as any; 
    const updatedObjective = {
      ...originalObjective,
      ...restOfFormData,
      keyResults: updatedKrs,
      changelog: [ ...originalObjective.changelog, { timestamp: new Date().toISOString(), userId: currentUser.id, change: 'Objective updated.' }]
    };

    // Optimistic
    setObjectives(prev => prev.map(obj => obj.id === id ? updatedObjective : obj));
    showToast({ message: 'Updating...', type: 'success' });

    try {
        await db.updateDocument('objectives', id, updatedObjective);
        showToast({ message: 'Objective updated successfully!', type: 'success' });
    } catch (e) {
        showToast({ message: 'Failed to update Objective on server.', type: 'error' });
    }
  };
  
  const deleteObjective = async (id: string) => {
    if (!currentUser) return;
    const objectiveToDelete = getObjectiveById(id);
    if (objectiveToDelete?.ownerId !== currentUser.id) {
        showToast({ message: "You can only delete your own OKRs.", type: 'error' });
        return;
    }
    
    setObjectives(prev => prev.filter(obj => obj.id !== id));
    
    try {
        await db.deleteDocument('objectives', id);
        showToast({ message: 'Objective deleted.', type: 'success' });
    } catch (e) {
         showToast({ message: 'Failed to delete from server.', type: 'error' });
    }
  };

  const updateKrProgress = async (objectiveId: string, krId: string, newProgress: number, comment?: string) => {
    if (!currentUser) return;
    const objectiveToUpdate = objectives.find(o => o.id === objectiveId);
    if (objectiveToUpdate?.ownerId !== currentUser.id) {
        showToast({ message: "본인이 소유한 OKR만 체크인할 수 있습니다.", type: 'error' });
        return;
    }

    const validatedProgress = Math.max(0, Math.min(100, newProgress));
    let updatedObjState: Objective | null = null;

    setObjectives(prevObjs => prevObjs.map(obj => {
        if (obj.id === objectiveId) {
          const newKeyResults = obj.keyResults.map(kr => {
            if (kr.id === krId) {
              return { ...kr, progress: validatedProgress, progressUpdates: [ ...kr.progressUpdates, { id: `pu-${Date.now()}`, krId, value: validatedProgress, comment, date: new Date().toISOString() }] };
            }
            return kr;
          });
          
          const tempObjective = { ...obj, keyResults: newKeyResults };
          const newOverallProgress = calculateObjectiveProgress(tempObjective);
          
          let newStatus = obj.status;
          if (newOverallProgress >= 100) {
            newStatus = Status.Done;
          } else if (newOverallProgress > 0) {
            newStatus = Status.InProgress;
          } else {
             newStatus = Status.Planned;
          }
          
          updatedObjState = { ...tempObjective, status: newStatus };
          return updatedObjState;
        }
        return obj;
      })
    );

    if (updatedObjState) {
        try {
            await db.updateDocument('objectives', objectiveId, updatedObjState);
        } catch (e) {
            showToast({ message: 'Failed to save progress to server.', type: 'error' });
        }
    }
  };

  const updateUserProfile = async (userId: string, profileData: Partial<User>) => {
      // Check if team assignment is changing
      const currentUserData = users.find(u => u.id === userId);
      
      if (currentUserData && profileData.defaultTeamId !== undefined && profileData.defaultTeamId !== currentUserData.defaultTeamId) {
          const oldTeamId = currentUserData.defaultTeamId;
          const newTeamId = profileData.defaultTeamId;
          
          // 1. Remove user from old team's member list
          if (oldTeamId) {
              const oldTeam = teams.find(t => t.id === oldTeamId);
              if (oldTeam) {
                  const updatedMembers = (oldTeam.members || []).filter(mId => mId !== userId);
                  const updatedTeam = { ...oldTeam, members: updatedMembers };
                  setTeams(prev => prev.map(t => t.id === oldTeamId ? updatedTeam : t));
                  try {
                      await db.updateDocument('teams', oldTeamId, { members: updatedMembers });
                  } catch(e) { console.error("Failed to remove member from old team", e); }
              }
          }

          // 2. Add user to new team's member list
          if (newTeamId) {
              const newTeam = teams.find(t => t.id === newTeamId);
              if (newTeam) {
                  const updatedMembers = Array.from(new Set([...(newTeam.members || []), userId]));
                  const updatedTeam = { ...newTeam, members: updatedMembers };
                  setTeams(prev => prev.map(t => t.id === newTeamId ? updatedTeam : t));
                  try {
                      await db.updateDocument('teams', newTeamId, { members: updatedMembers });
                  } catch(e) { console.error("Failed to add member to new team", e); }
              }
          }
          
          // 3. Update User's teamIds to align with default team (Remove old default, add new default)
          // Logic: Ensure the new default team is in teamIds, and remove the old default team from teamIds.
          let newTeamIds = (currentUserData.teamIds || []).filter(tid => tid !== oldTeamId);
          if (newTeamId && !newTeamIds.includes(newTeamId)) {
              newTeamIds.push(newTeamId);
          }
          profileData.teamIds = newTeamIds;
      }

      // Update Local User State
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...profileData } : u));
      if (userId === currentUser?.id) {
          setCurrentUser(prev => prev ? ({ ...prev, ...profileData }) : null);
      }
      
      try {
        await db.updateDocument('users', userId, profileData);
        showToast({ message: 'Profile updated successfully!', type: 'success' });
      } catch (e) {
        showToast({ message: 'Failed to update profile on server.', type: 'error' });
      }
  };
  
  // --- CRUD for Admin ---

  const addUser = async (userData: User) => {
      // 1. Update local users state
      setUsers(prev => [...prev, userData]);

      // 2. If user has a default team, add them to that team's member list
      if (userData.defaultTeamId) {
          const teamId = userData.defaultTeamId;
          const teamToUpdate = teams.find(t => t.id === teamId);
          
          if (teamToUpdate) {
              // Add user ID to members array, avoiding duplicates
              const updatedMembers = Array.from(new Set([...(teamToUpdate.members || []), userData.id]));
              const updatedTeam = { ...teamToUpdate, members: updatedMembers };

              // Update local Teams state
              setTeams(prev => prev.map(t => t.id === teamId ? updatedTeam : t));
              
              // Update Firestore Team
              try {
                  await db.updateDocument('teams', teamId, { members: updatedMembers });
              } catch (e) {
                  console.error("Failed to update team members on server:", e);
              }
          }
      }

      // 3. Create User in Firestore
      try {
          await db.createDocument('users', userData);
          showToast({ message: 'User added successfully!', type: 'success' });
      } catch (e) {
          showToast({ message: 'Failed to add user on server.', type: 'error' });
      }
  };

  const deleteUser = async (userId: string) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
      try {
          await db.deleteDocument('users', userId);
          showToast({ message: 'User deleted.', type: 'success' });
      } catch (e) {
          showToast({ message: 'Failed to delete user on server.', type: 'error' });
      }
  };

  const addTeam = async (teamData: Omit<Team, 'id'>) => {
      const newTeam: Team = { ...teamData, id: `team-${Date.now()}` };
      setTeams(prev => [...prev, newTeam]);
      
      try {
          await db.createDocument('teams', newTeam);
          showToast({ message: 'Team created successfully!', type: 'success' });
      } catch (e) {
          showToast({ message: 'Failed to create team on server.', type: 'error' });
      }
  };

  const updateTeam = async (teamId: string, teamData: Team) => {
      setTeams(prev => prev.map(t => t.id === teamId ? teamData : t));
      
      try {
          await db.updateDocument('teams', teamId, teamData);
          showToast({ message: 'Team updated successfully!', type: 'success' });
      } catch (e) {
          showToast({ message: 'Failed to update team on server.', type: 'error' });
      }
  };
  
  const deleteTeam = async (teamId: string) => {
      setTeams(prev => prev.filter(t => t.id !== teamId));
      try {
          await db.deleteDocument('teams', teamId);
          showToast({ message: 'Team deleted.', type: 'success' });
      } catch (e) {
          showToast({ message: 'Failed to delete team on server.', type: 'error' });
      }
  };

  const addDivision = async (divisionData: Division) => {
      setDivisions(prev => [...prev, divisionData]);
      try {
          await db.createDocument('divisions', divisionData);
          showToast({ message: 'Division added successfully!', type: 'success' });
      } catch (e) {
          showToast({ message: 'Failed to add division on server.', type: 'error' });
      }
  };
  
  const updateDivision = async (divisionId: string, divisionData: Division) => {
      setDivisions(prev => prev.map(d => d.id === divisionId ? divisionData : d));
      try {
          await db.updateDocument('divisions', divisionId, divisionData);
          showToast({ message: 'Division updated.', type: 'success' });
      } catch (e) {
          showToast({ message: 'Failed to update division.', type: 'error' });
      }
  };

  const deleteDivision = async (divisionId: string) => {
      setDivisions(prev => prev.filter(d => d.id !== divisionId));
      try {
          await db.deleteDocument('divisions', divisionId);
          showToast({ message: 'Division deleted.', type: 'success' });
      } catch (e) {
          showToast({ message: 'Failed to delete division.', type: 'error' });
      }
  };

  const okrContextValue = {
    currentUser: currentUser!, setCurrentUser, objectives, users, teams, divisions, cfrSessions, toast, setToast: showToast,
    getObjectiveById, addObjective, updateObjective, deleteObjective, updateKrProgress,
    getCfrSessionForMonth, addOrUpdateCfrSession,
    updateUserProfile, addUser, deleteUser, 
    addTeam, updateTeam, deleteTeam,
    addDivision, updateDivision, deleteDivision,
    currentYear, setCurrentYear, currentQuarter, setCurrentQuarter
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newTheme;
    });
  };

  const themeValue = useMemo(() => ({ theme, toggleTheme }), [theme]);
  
  if (isLoading || !currentUser) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
              <div className="flex flex-col items-center gap-4">
                <Loader2 size={48} className="animate-spin text-brand-500"/>
                <p className="text-lg font-semibold">Loading OKR Studio...</p>
              </div>
          </div>
      )
  }

  return (
    <OkrContext.Provider value={okrContextValue}>
      <ThemeContext.Provider value={themeValue}>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/okrs" element={isAdmin ? <OkrListPage /> : <Navigate to="/dashboard" replace />} />
              <Route path="/okrs/new" element={<OkrFormPage />} />
              <Route path="/okrs/:id" element={<OkrDetailPage />} />
              <Route path="/okrs/:id/edit" element={<OkrFormPage />} />
              <Route path="/cfr" element={<CfrListPage />} />
              <Route path="/cfr/:objectiveId/:year/:month" element={<CfrSessionPage />} />
              <Route path="/team-dashboard" element={<TeamDashboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </Layout>
        </HashRouter>
      </ThemeContext.Provider>
    </OkrContext.Provider>
  );
};

export default App;
