import { KeyResult, Objective, User } from '../types';

export const calculateKrProgress = (kr: KeyResult): number => {
  // KR model is now a simple 0-100 progress value.
  return kr.progress;
};

export const calculateObjectiveProgress = (objective: Objective): number => {
  if (objective.keyResults.length === 0) return 0;
  const totalProgress = objective.keyResults.reduce((acc, kr) => acc + kr.progress, 0);
  return Math.round(totalProgress / objective.keyResults.length);
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Determines if a Key Result is at risk based on due date and progress.
 * @param kr The Key Result to analyze.
 * @returns boolean indicating if the KR is at risk.
 */
export const isKrAtRisk = (kr: KeyResult): boolean => {
    const today = new Date();
    const progress = calculateKrProgress(kr);

    // Rule 1: Due date is approaching but progress is low.
    const dueDate = new Date(kr.dueDate);
    const daysRemaining = (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24);
    if (daysRemaining < 30 && progress < 50) {
        return true;
    }

    // Rule 2: No updates for a long time and not complete.
    if (kr.progressUpdates.length > 0) {
        // Find the most recent update
        const lastUpdateDate = new Date(
            Math.max(...kr.progressUpdates.map(p => new Date(p.date).getTime()))
        );
        const daysSinceUpdate = (today.getTime() - lastUpdateDate.getTime()) / (1000 * 3600 * 24);
        if (daysSinceUpdate > 30 && progress < 100) {
            return true;
        }
    }

    return false;
};

/**
 * Gets the last update date of a Key Result.
 * @param kr The Key Result.
 * @returns The date of the last update, or null if no updates exist.
 */
export const getLastUpdateDate = (kr: KeyResult): Date | null => {
  if (!kr.progressUpdates || kr.progressUpdates.length === 0) {
    return null;
  }
  const lastUpdateTimestamp = Math.max(...kr.progressUpdates.map(p => new Date(p.date).getTime()));
  return new Date(lastUpdateTimestamp);
};

/**
 * Determines if a Key Result is behind schedule.
 * A KR is behind if its progress is less than 50% OR it hasn't been updated in over 2 weeks.
 * @param kr The Key Result to analyze.
 * @returns boolean indicating if the KR is behind.
 */
export const isKrBehind = (kr: KeyResult): boolean => {
    if (kr.progress >= 100) {
        return false;
    }

    const lastUpdate = getLastUpdateDate(kr);
    let daysSinceUpdate = Infinity;

    if (lastUpdate) {
        const today = new Date();
        daysSinceUpdate = (today.getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24);
    }
    
    return kr.progress < 50 || daysSinceUpdate > 14;
};


/**
 * Checks if a user (viewer) has permission to view an OKR.
 * @param viewer The user trying to view the OKR.
 * @param objective The OKR being viewed.
 * @param users A list of all users to find the owner.
 * @returns boolean indicating if the viewer has permission.
 */
export const canViewOkr = (viewer: User, objective: Objective, users: User[]): boolean => {
  const owner = users.find(u => u.id === objective.ownerId);
  if (!owner) return false;

  // Using 'target' as per user's prompt example for clarity
  const target = owner;
  
  // A user can always view their own OKRs.
  if (viewer.id === target.id) {
    return true;
  }

  // Rule 1: 대표이사 (CEO) can view all.
  if (viewer.position === "대표이사") {
    return true;
  }

  // Rule 2: 본부장 / 테크리드 / 경영지원실장 (Division Heads) can view their division.
  const highPositions = ["본부장", "테크리드", "경영지원실장"];
  if (highPositions.includes(viewer.position || '')) {
    return viewer.divisionId === target.divisionId;
  }

  // Rule 3: 이사 (Director), if not covered above, can view their division.
  if (viewer.jobTitle === "이사") {
    return viewer.divisionId === target.divisionId;
  }

  // Rule 4: All other users can view OKRs within their own team.
  // Using defaultTeamId for primaryTeamId as per data model.
  return viewer.defaultTeamId === target.defaultTeamId;
};


/**
 * Checks if a user (viewer) has permission to view a CFR for an OKR owned by another user (owner).
 * @param viewer The user trying to view the CFR.
 * @param owner The owner of the OKR associated with the CFR.
 * @returns boolean indicating if the viewer has permission.
 */
export const canViewCfr = (viewer: User, owner: User): boolean => {
  // Rule 1: CEO can see everything.
  if (viewer.position === "대표이사") {
    return true;
  }

  // Rule 2: Division-level access for specific positions.
  const highPositions = ["본부장", "테크리드", "경영지원실장"];
  if (highPositions.includes(viewer.position || '')) {
    return viewer.divisionId === owner.divisionId;
  }

  // Rule 3: Division-level access for Directors (if not a higher position).
  if (viewer.jobTitle === "이사") {
    return viewer.divisionId === owner.divisionId;
  }

  // Rule 4: Team-level access for Admins (if not a higher position).
  if (viewer.role === "admin") {
    // Using defaultTeamId as a proxy for primaryTeamId as per spec.
    return viewer.defaultTeamId === owner.defaultTeamId;
  }

  // Rule 5: Members can only see their own.
  return viewer.id === owner.id;
};

/**
 * Checks if a user has permission to create a Team OKR based on their position and job title.
 * @param viewer The user attempting to create the OKR.
 * @returns boolean indicating if the user has permission.
 */
export const canCreateTeamOkr = (viewer: User): boolean => {
  const highPositions = ["본부장", "테크리드", "경영지원실장"];

  // 1. 대표이사 (CEO)
  if (viewer.position === "대표이사") {
    return true;
  }

  // 2. 본부장 / 테크리드 / 경영지원실장 (Division/Functional Heads)
  if (viewer.position && highPositions.includes(viewer.position)) {
    return true;
  }

  // 3. 이사 (Director), if not covered by a higher position
  if (viewer.jobTitle === "이사") {
    return true;
  }

  // 4. All other users cannot create Team OKRs.
  return false;
};
