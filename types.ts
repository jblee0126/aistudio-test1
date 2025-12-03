
export enum Status {
  Planned = 'Planned',
  InProgress = 'In Progress',
  Done = 'Done',
  // FIX: Add 'AtRisk' and 'Dropped' to the enum.
  AtRisk = 'At Risk',
  Dropped = 'Dropped',
}

export interface Division {
  id: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'admin' | 'member';
  displayName?: string;
  position?: string; // 직위
  jobTitle?: string;
  divisionId?: string;
  divisionName?: string;
  defaultTeamId?: string;
  teamIds: string[]; // 사용자가 속한 모든 팀 ID 배열
  timezone?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  code?: string;
  divisionId: string;
  divisionName: string;
  members: string[]; // array of user IDs
}

export interface ProgressUpdate {
  id: string;
  krId: string;
  value: number; // Represents progress % (0-100)
  comment?: string;
  date: string;
}

export interface KeyResult {
  id: string;
  title: string;
  description?: string;
  progress: number; // 0-100
  ownerId?: string;
  dueDate: string;
  confidence: number; // 0-100%
  progressUpdates: ProgressUpdate[];
}

export interface Objective {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  teamId?: string;
  year: number;
  quarter: number;
  status: Status;
  keyResults: KeyResult[];
  changelog: {
    timestamp: string;
    userId: string;
    change: string;
  }[];
  isTeamObjective?: boolean;
}

export interface OkrFormData {
    title: string;
    description?: string;
    teamId?: string;
    year: number;
    quarter: number;
    keyResults: Omit<KeyResult, 'id' | 'progress' | 'progressUpdates'>[];
    isTeamObjective?: boolean;
}

export interface Recognition {
    memberId: string;
    comment: string;
}

export interface CfrSession {
    id: string;
    objectiveId: string;
    authorId: string;
    year: number;
    quarter: number;
    month: number; // 1-12
    whatHappened: string;
    challenges: string;
    nextPlans: string;
    recognitions: Recognition[];
    managerFeedback?: string;
    createdAt: string;
    updatedAt: string;
}
