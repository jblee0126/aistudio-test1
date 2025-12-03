
import { User, Team, Division, Objective, Status, KeyResult, ProgressUpdate, CfrSession } from '../types';
import { calculateObjectiveProgress } from '../utils/helpers';

// --- Helper Functions ---
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomDate = (year: number, quarter: number): string => {
    const startMonth = (quarter - 1) * 3;
    const day = getRandomInt(1, 28);
    const month = startMonth + getRandomInt(0, 2);
    return new Date(year, month, day).toISOString();
};

// --- New Raw Data Source ---
const rawUserData: { name: string; position: string; jobTitle: string; divisionName: string; teamName: string; role: string }[] = [
    // AD본부
    { name: '최성운', position: '본부장', jobTitle: '이사', divisionName: 'AD본부', teamName: 'AD본부', role: '관리자' },
    { name: '이제형', position: '팀장', jobTitle: '이사', divisionName: 'AD본부', teamName: 'PM1팀', role: '관리자' },
    { name: '전기욱', position: '팀장', jobTitle: '차장', divisionName: 'AD본부', teamName: 'PM2팀', role: '관리자' },
    { name: '이해랑', position: '팀장', jobTitle: '차장', divisionName: 'AD본부', teamName: 'PM3팀', role: '관리자' },
    { name: '이희창', position: '파트장', jobTitle: '과장', divisionName: 'AD본부', teamName: 'PM1팀', role: '관리자' },
    { name: '이종범', position: '팀원', jobTitle: '대리', divisionName: 'AD본부', teamName: 'PM1팀', role: '팀원' },
    { name: '권예지', position: '팀원', jobTitle: '대리', divisionName: 'AD본부', teamName: 'PM1팀', role: '팀원' },
    { name: '최현지', position: '팀원', jobTitle: '대리', divisionName: 'AD본부', teamName: 'PM1팀', role: '팀원' },
    { name: '차윤나', position: '팀원', jobTitle: '대리', divisionName: 'AD본부', teamName: 'PM1팀', role: '팀원' },
    { name: '공혜원', position: '팀원', jobTitle: '대리', divisionName: 'AD본부', teamName: 'PM1팀', role: '팀원' },
    { name: '정해민', position: '팀원', jobTitle: '사원', divisionName: 'AD본부', teamName: 'PM1팀', role: '팀원' },
    { name: '손유진', position: '팀원', jobTitle: '사원', divisionName: 'AD본부', teamName: 'PM1팀', role: '팀원' },
    { name: '한규호', position: '파트장', jobTitle: '과장', divisionName: 'AD본부', teamName: 'PM2팀', role: '관리자' },
    { name: '이은희', position: '팀원', jobTitle: '과장', divisionName: 'AD본부', teamName: 'PM2팀', role: '팀원' },
    { name: '임이주', position: '팀원', jobTitle: '대리', divisionName: 'AD본부', teamName: 'PM2팀', role: '팀원' },
    { name: '유혜영', position: '팀원', jobTitle: '대리', divisionName: 'AD본부', teamName: 'PM2팀', role: '팀원' },
    { name: '정두리', position: '팀원', jobTitle: '대리', divisionName: 'AD본부', teamName: 'PM2팀', role: '팀원' },
    { name: '김진실', position: '팀원', jobTitle: '대리', divisionName: 'AD본부', teamName: 'PM2팀', role: '팀원' },
    { name: '이직희', position: '팀원', jobTitle: '대리', divisionName: 'AD본부', teamName: 'PM2팀', role: '팀원' },
    { name: '허겸', position: '팀원', jobTitle: '사원', divisionName: 'AD본부', teamName: 'PM2팀', role: '팀원' },
    { name: '강혜빈', position: 'Partner', jobTitle: 'Partner', divisionName: 'AD본부', teamName: 'PM2팀', role: '팀원' },
    { name: '최예진', position: 'Partner', jobTitle: 'Partner', divisionName: 'AD본부', teamName: 'PM2팀', role: '팀원' },
    { name: '문수정', position: 'Partner', jobTitle: 'Partner', divisionName: 'AD본부', teamName: 'PM2팀', role: '팀원' },
    { name: '이기정', position: '파트장', jobTitle: '과장', divisionName: 'AD본부', teamName: 'PM3팀', role: '관리자' },
    { name: '최원영', position: '팀원', jobTitle: '대리', divisionName: 'AD본부', teamName: 'PM3팀', role: '팀원' },
    { name: '송찬우', position: '팀원', jobTitle: '대리', divisionName: 'AD본부', teamName: 'PM3팀', role: '팀원' },
    { name: '김유민', position: 'Partner', jobTitle: 'Partner', divisionName: 'AD본부', teamName: 'PM3팀', role: '팀원' },
    { name: '민경수', position: '파트장', jobTitle: '대리', divisionName: 'AD본부', teamName: 'PM3팀', role: '관리자' },
    { name: '염찬희', position: '팀원', jobTitle: '대리', divisionName: 'AD본부', teamName: 'PM3팀', role: '팀원' },
    { name: '박은진', position: '팀원', jobTitle: '대리', divisionName: 'AD본부', teamName: 'PM3팀', role: '팀원' },
    { name: '이자명', position: '팀원', jobTitle: '사원', divisionName: 'AD본부', teamName: 'PM3팀', role: '팀원' },
    // SI본부
    { name: '최윤희', position: '본부장', jobTitle: '이사', divisionName: 'SI본부', teamName: 'SI본부', role: '관리자' },
    { name: '전백철', position: '팀장', jobTitle: '차장', divisionName: 'SI본부', teamName: '1팀', role: '관리자' },
    { name: '윤상미', position: '팀원', jobTitle: '대리', divisionName: 'SI본부', teamName: '1팀', role: '팀원' },
    { name: '김민영', position: '팀원', jobTitle: '사원', divisionName: 'SI본부', teamName: '1팀', role: '팀원' },
    { name: '방동욱', position: '팀원', jobTitle: '사원', divisionName: 'SI본부', teamName: '1팀', role: '팀원' },
    { name: '김민경', position: '팀원', jobTitle: '사원', divisionName: 'SI본부', teamName: '1팀', role: '팀원' },
    { name: '김도현', position: '팀원', jobTitle: '사원', divisionName: 'SI본부', teamName: '1팀', role: '팀원' },
    { name: '김성현', position: '팀원', jobTitle: '대리', divisionName: 'SI본부', teamName: '2팀', role: '팀원' },
    { name: '김혜주', position: '팀원', jobTitle: '대리', divisionName: 'SI본부', teamName: '2팀', role: '팀원' },
    { name: '이지현', position: '팀원', jobTitle: '사원', divisionName: 'SI본부', teamName: '2팀', role: '팀원' },
    { name: '이소영', position: '팀원', jobTitle: '사원', divisionName: 'SI본부', teamName: '2팀', role: '팀원' },
    { name: '이건', position: '팀원', jobTitle: '사원', divisionName: 'SI본부', teamName: '2팀', role: '팀원' },
    { name: '김도현', position: '팀원', jobTitle: '사원', divisionName: 'SI본부', teamName: '2팀', role: '팀원' },
    { name: '최고려', position: '팀원', jobTitle: '사원', divisionName: 'SI본부', teamName: '2팀', role: '팀원' },
    // 개발실
    { name: '김나현', position: '실원', jobTitle: '과장', divisionName: '개발실', teamName: '개발실', role: '팀원' },
    { name: '김유진', position: '실원', jobTitle: '사원', divisionName: '개발실', teamName: '개발실', role: '팀원' },
    { name: '장준호', position: '실원', jobTitle: '대리', divisionName: '개발실', teamName: '개발실', role: '팀원' },
    { name: '김민영', position: '팀장', jobTitle: '차장', divisionName: '개발실', teamName: '개발실', role: '관리자' },
    { name: '이민석', position: '테크리드', jobTitle: '부장', divisionName: '개발실', teamName: '개발실', role: '관리자' },
    // 경영지원실 & ㈜아티언스
    { name: '양문희', position: '경영지원실장', jobTitle: '부장', divisionName: '경영지원실', teamName: '경영지원실', role: '관리자' },
    { name: '윤민정', position: '실원', jobTitle: '사원', divisionName: '경영지원실', teamName: '경영지원실', role: '팀원' },
    { name: '양문희', position: '팀장', jobTitle: '부장', divisionName: '경영지원실', teamName: '경영지원실', role: '관리자' },
    { name: '고민영', position: '실원', jobTitle: '대리', divisionName: '경영지원실', teamName: '경영지원실', role: '팀원' },
    { name: '이채연', position: '실원', jobTitle: '사원', divisionName: '경영지원실', teamName: '경영지원실', role: '팀원' },
    { name: '강무진', position: '대표이사', jobTitle: '대표이사', divisionName: '㈜아티언스', teamName: '㈜아티언스', role: '관리자' },
    { name: '김상열', position: '실원', jobTitle: '과장', divisionName: '경영지원실', teamName: '경영지원실', role: '팀원' },
    { name: '김선민', position: '실원', jobTitle: '대리', divisionName: '경영지원실', teamName: '경영지원실', role: '팀원' },
    { name: '손경호', position: '실원', jobTitle: '대리', divisionName: '경영지원실', teamName: '경영지원실', role: '팀원' },
];


// --- Random OKR Generation Logic ---
const generateRandomOkrsForUser = (user: User, division: Division, team: Team): Objective[] => {
    const objectives: Objective[] = [];
    const okrCount = 1;
    const objectiveTemplates = [
        `[${team.name}] 운영 효율성 증대`,
        `Q4 ${user.jobTitle} 핵심 역량 강화`,
        `[${division.name}] 신규 프로젝트 성공적 런칭`,
        `고객 만족도 증대를 위한 [${team.name}] 프로세스 최적화`,
        `[${division.name}] 데이터 기반 의사결정 문화 정착`,
        `[${team.name}] 배포 자동화 파이프라인 고도화`,
        `[${division.name}] 인사/총무 업무 프로세스 표준화`
    ];
    const krTitleTemplates = [
      '핵심 캠페인 ROAS 350% 달성',
      '신규 매체 테스트 5건 완료',
      '고객 유지율 5% 향상',
      '프로젝트 납기 준수율 98% 달성',
      '신규 기능 A/B 테스트 3건 진행'
    ];

    for (let i = 0; i < okrCount; i++) {
        const year = 2025;
        const quarter = 4;

        const baseObjective: Omit<Objective, 'status' | 'keyResults'> = {
            id: `obj-${user.id}-${i + 1}`,
            title: getRandomElement(objectiveTemplates),
            description: `A personal objective for ${user.name} in Q4 2025.`,
            ownerId: user.id,
            teamId: team.id,
            year,
            quarter,
            changelog: [{ timestamp: new Date().toISOString(), userId: user.id, change: 'Objective created.' }],
            isTeamObjective: false,
        };

        const keyResults: KeyResult[] = [];
        const krCount = getRandomInt(2, 4);

        for (let j = 0; j < krCount; j++) {
            const currentProgress = getRandomInt(0, 100);

            const finalKr: KeyResult = {
                id: `kr-${baseObjective.id}-${j + 1}`,
                title: getRandomElement(krTitleTemplates),
                description: 'A key result to track progress.',
                progress: currentProgress,
                ownerId: user.id,
                dueDate: getRandomDate(year, quarter + 1),
                confidence: getRandomInt(50, 100),
                progressUpdates: [],
            };
            
            const updateCount = getRandomInt(1, 3);
            let lastProgress = 0;
            for(let k = 0; k < updateCount - 1; k++) {
                lastProgress = getRandomInt(lastProgress, finalKr.progress > lastProgress ? finalKr.progress : lastProgress + 1);
                finalKr.progressUpdates.push({ id: `pu-${finalKr.id}-${k}`, krId: finalKr.id, value: lastProgress, comment: getRandomElement(['계획대로 진행 중', '초기 세팅 완료', '일부 진척 있음']), date: getRandomDate(year, quarter) });
            }
            finalKr.progressUpdates.push({ id: `pu-${finalKr.id}-${updateCount-1}`, krId: finalKr.id, value: finalKr.progress, comment: '최신 업데이트', date: getRandomDate(year, quarter) });
            
            keyResults.push(finalKr);
        }
        
        const tempObjectiveForCalc = { ...baseObjective, keyResults, status: Status.Planned };
        const progress = calculateObjectiveProgress(tempObjectiveForCalc);
        let status: Status;
        if (progress >= 100) {
            status = Status.Done;
        } else if (progress > 0) {
            status = Status.InProgress;
        } else {
            status = Status.Planned;
        }

        const finalObjective: Objective = {
            ...baseObjective,
            keyResults,
            status,
        };

        objectives.push(finalObjective);
    }
    return objectives;
}


// --- Main Seeding Function ---
const seedAll = () => {
    // 1. Reset data (by starting with empty collections)
    console.log("Seeding new mock data...");
    
    const divisions = new Map<string, Division>();
    const teams = new Map<string, Team>();
    const users = new Map<string, User>();
    let objectives: Objective[] = [];

    // 2. Create division/team/user
    const normalizedUserData = rawUserData.map(u => ({...u, teamName: u.teamName.replace(/ /g, '')}));

    normalizedUserData.forEach((data, index) => {
        // Ensure division exists
        let division = divisions.get(data.divisionName);
        if (!division) {
            division = { id: `div-${divisions.size + 1}`, name: data.divisionName, description: `The ${data.divisionName}.` };
            divisions.set(data.divisionName, division);
        }

        // Ensure team exists (key by divisionName + teamName for uniqueness)
        const teamKey = `${data.divisionName}-${data.teamName}`;
        let team = teams.get(teamKey);
        if (!team) {
            team = {
                id: `team-${teams.size + 1}`, name: data.teamName, description: `${data.teamName} of ${data.divisionName}.`,
                code: data.teamName.replace(/[^A-Z0-9]/ig, '').substring(0, 4).toUpperCase(),
                divisionId: division.id, divisionName: division.name, members: [],
            };
            teams.set(teamKey, team);
        }

        // Ensure user exists or create it, handling duplicates
        let user = users.get(data.name);
        if (!user) {
            const emailName = data.name.replace(/\s/g, '').toLowerCase();
            user = {
                id: `user-${users.size + 1}`, name: data.name, displayName: data.name,
                email: `${emailName}@artience.com`, role: data.role === '관리자' ? 'admin' : 'member',
                jobTitle: data.jobTitle, position: data.position,
                divisionId: division.id, divisionName: division.name,
                defaultTeamId: team.id, teamIds: [],
            };
            users.set(data.name, user);
        }

        // Link user and team
        if (!user.teamIds.includes(team.id)) { user.teamIds.push(team.id); }
        if (!team.members.includes(user.id)) { team.members.push(user.id); }
    });

    const finalUsers = Array.from(users.values());
    const finalDivisions = Array.from(divisions.values());
    const finalTeams = Array.from(teams.values());

    // 3. Generate user-specific OKRs
    finalUsers.forEach(user => {
        const primaryTeam = finalTeams.find(t => t.id === user.defaultTeamId);
        const primaryDivision = finalDivisions.find(d => d.id === user.divisionId);
        if (primaryTeam && primaryDivision) {
            const userOkrs = generateRandomOkrsForUser(user, primaryDivision, primaryTeam);
            objectives.push(...userOkrs);
        }
    });
    
    // 4. (Optional) Generate Team OKRs
    const adTeam = finalTeams.find(t => t.name === 'AD본부');
    const adAdmin = finalUsers.find(u => u.name === '최성운');
    if(adTeam && adAdmin) {
        objectives.push({
             id: 'obj-team-ad-1', isTeamObjective: true, title: '[AD본부] 2025년 4분기 광고 효율 15% 개선',
            description: '데이터 기반 광고 최적화를 통해 ROAS를 극대화하고 신규 고객 유입 비용을 절감한다.',
            ownerId: adAdmin.id, teamId: adTeam.id, year: 2025, quarter: 4,
            status: Status.InProgress, changelog: [],
            keyResults: [
                { id: 'kr-tad-1', title: '핵심 캠페인 ROAS 350% 달성', progress: 65, ownerId: adAdmin.id, dueDate: '2025-12-31', confidence: 90, progressUpdates: [] },
                { id: 'kr-tad-2', title: '신규 매체 테스트 5건 완료', progress: 40, ownerId: adAdmin.id, dueDate: '2025-12-31', confidence: 75, progressUpdates: [] },
            ],
        })
    }


    return {
        users: finalUsers,
        teams: finalTeams,
        divisions: finalDivisions,
        objectives: objectives,
        cfrSessions: [], // Reset CFR sessions
    };
};

// --- Exported Data ---
const seededData = seedAll();

export const mockUsers: User[] = seededData.users;
export const mockTeams: Team[] = seededData.teams;
export const mockDivisions: Division[] = seededData.divisions;
export const mockObjectives: Objective[] = seededData.objectives;
export const mockCfrSessions: CfrSession[] = seededData.cfrSessions;
