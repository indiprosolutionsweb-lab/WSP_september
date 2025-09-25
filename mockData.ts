import { Company, Profile, Role, Task, TaskStatus, UnplannedTask } from './types.ts';
import { getWeekNumber } from './dateUtils.ts';

// --- MOCK USERS & COMPANIES ---

export const MOCK_SUPERADMIN_USER: Profile = {
    id: 'superadmin-001',
    name: 'Super Admin',
    email: 'super@wsp.local',
    role: Role.Superadmin,
    company_id: null,
};

export const MOCK_COMPANIES: Company[] = [
    { id: 'company-a', name: 'Innovate Inc.', created_at: new Date().toISOString(), calendar_start_month: 'April' },
    { id: 'company-b', name: 'Synergy Solutions', created_at: new Date().toISOString(), calendar_start_month: 'January' },
];

export const MOCK_PROFILES: Profile[] = [
    MOCK_SUPERADMIN_USER,
    { id: 'admin-001', name: 'Alice Admin', email: 'alice@innovate.local', role: Role.Admin, company_id: 'company-a' },
    { id: 'user-001', name: 'Bob Builder', email: 'bob@innovate.local', role: Role.User, company_id: 'company-a' },
    { id: 'user-002', name: 'Charlie Crew', email: 'charlie@innovate.local', role: Role.User, company_id: 'company-a' },
    { id: 'admin-002', name: 'Diana Director', email: 'diana@synergy.local', role: Role.Admin, company_id: 'company-b' },
    { id: 'user-003', name: 'Eve Employee', email: 'eve@synergy.local', role: Role.User, company_id: 'company-b' },
    { id: 'user-004', name: 'Frank Field', email: 'frank@unassigned.local', role: Role.User, company_id: null },
    // Added for pagination testing
    { id: 'user-a-01', name: 'Grace Green', email: 'grace@innovate.local', role: Role.User, company_id: 'company-a' },
    { id: 'user-a-02', name: 'Henry Hopper', email: 'henry@innovate.local', role: Role.User, company_id: 'company-a' },
    { id: 'user-a-03', name: 'Ivy Irvine', email: 'ivy@innovate.local', role: Role.User, company_id: 'company-a' },
    { id: 'user-a-04', name: 'Jack Jones', email: 'jack@innovate.local', role: Role.User, company_id: 'company-a' },
    { id: 'user-a-05', name: 'Kate King', email: 'kate@innovate.local', role: Role.User, company_id: 'company-a' },
    { id: 'user-a-06', name: 'Leo Lewis', email: 'leo@innovate.local', role: Role.User, company_id: 'company-a' },
    { id: 'user-a-07', name: 'Mia Miller', email: 'mia@innovate.local', role: Role.User, company_id: 'company-a' },
    { id: 'user-a-08', name: 'Noah North', email: 'noah@innovate.local', role: Role.User, company_id: 'company-a' },
    { id: 'user-a-09', name: 'Olivia Owen', email: 'olivia@innovate.local', role: Role.User, company_id: 'company-a' },
    { id: 'user-a-10', name: 'Paul Piper', email: 'paul@innovate.local', role: Role.User, company_id: 'company-a' }, // Page 2 starts here
    { id: 'user-a-11', name: 'Quinn Queen', email: 'quinn@innovate.local', role: Role.User, company_id: 'company-a' },
    
    { id: 'user-b-01', name: 'Rachel Ross', email: 'rachel@synergy.local', role: Role.User, company_id: 'company-b' },
    { id: 'user-b-02', name: 'Sam Smith', email: 'sam@synergy.local', role: Role.User, company_id: 'company-b' },
    { id: 'user-b-03', name: 'Tina Turner', email: 'tina@synergy.local', role: Role.User, company_id: 'company-b' },
    { id: 'user-b-04', name: 'Uma Underwood', email: 'uma@synergy.local', role: Role.User, company_id: 'company-b' },
    { id: 'user-b-05', name: 'Victor Vance', email: 'victor@synergy.local', role: Role.User, company_id: 'company-b' },
    { id: 'user-b-06', name: 'Wendy White', email: 'wendy@synergy.local', role: Role.User, company_id: 'company-b' },
    { id: 'user-b-07', name: 'Xavier Xylos', email: 'xavier@synergy.local', role: Role.User, company_id: 'company-b' },
    { id: 'user-b-08', name: 'Yara Young', email: 'yara@synergy.local', role: Role.User, company_id: 'company-b' },
    { id: 'user-b-09', name: 'Zane Ziegler', email: 'zane@synergy.local', role: Role.User, company_id: 'company-b' },

    { id: 'user-u-01', name: 'Una Usher', email: 'una@unassigned.local', role: Role.User, company_id: null },
    { id: 'user-u-02', name: 'Vince Vaughn', email: 'vince@unassigned.local', role: Role.User, company_id: null },
];

// --- DYNAMIC MOCK TASKS ---

const generateDynamicMockTasks = (): Task[] => {
    const today = new Date();
    const aprilStartWeek = getWeekNumber(today, 'April');
    const januaryStartWeek = getWeekNumber(today, 'January');

    const innovateWeeks = [aprilStartWeek - 1, aprilStartWeek, aprilStartWeek + 1];
    const synergyWeeks = [januaryStartWeek - 1, januaryStartWeek, januaryStartWeek + 1];

    let tasks: Task[] = [
        // Bob Builder (user-001)
        { id: 'task-bob-curr-1', user_id: 'user-001', week_number: innovateWeeks[1], day: 'Monday', text: 'Begin development of the new reporting module.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: false, created_at: new Date().toISOString() },
        { id: 'task-bob-curr-2', user_id: 'user-001', week_number: innovateWeeks[1], day: 'Tuesday', text: 'Prepare technical specification for API endpoint.', status: TaskStatus.Incomplete, time_taken: 90, is_priority: false, created_at: new Date().toISOString() },
        
        // Charlie Crew (user-002)
        { id: 'task-charlie-curr-1', user_id: 'user-002', week_number: innovateWeeks[1], day: 'Tuesday', text: 'Take meeting minutes for the all-hands call.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: true, created_at: new Date().toISOString() },
        { id: 'task-charlie-curr-2', user_id: 'user-002', week_number: innovateWeeks[1], day: 'Wednesday', text: 'Assist marketing with proofreading brochure content.', status: TaskStatus.Additional, time_taken: 40, is_priority: false, created_at: new Date().toISOString() },
        
        // Eve Employee (user-003)
        { id: 'task-eve-curr-1', user_id: 'user-003', week_number: synergyWeeks[1], day: 'Tuesday', text: 'Review and approve expense reports.', status: TaskStatus.Complete, time_taken: 60, is_priority: false, created_at: new Date().toISOString() },
        { id: 'task-eve-curr-2', user_id: 'user-003', week_number: synergyWeeks[1], day: 'Thursday', text: 'Conduct performance review check-ins.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: true, created_at: new Date().toISOString() },
        
        // Frank Field (user-004)
        { id: 'task-frank-curr-1', user_id: 'user-004', week_number: innovateWeeks[1], day: 'Monday', text: 'Update Salesforce with new contacts.', status: TaskStatus.Complete, time_taken: 45, is_priority: false, created_at: new Date().toISOString() },
        { id: 'task-frank-curr-2', user_id: 'user-004', week_number: innovateWeeks[1], day: 'Wednesday', text: 'Present Q2 marketing plan to management.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: true, created_at: new Date().toISOString() },

        // Add some tasks for new users to test switching
        { id: 'task-grace-1', user_id: 'user-a-01', week_number: innovateWeeks[1], day: 'Monday', text: 'Review Q3 budget proposals.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: true, created_at: new Date().toISOString() },
        { id: 'task-grace-2', user_id: 'user-a-01', week_number: innovateWeeks[1], day: 'Friday', text: 'Team retrospective meeting.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: false, created_at: new Date().toISOString() },
        { id: 'task-rachel-1', user_id: 'user-b-01', week_number: synergyWeeks[1], day: 'Tuesday', text: 'Client follow-up calls.', status: TaskStatus.Complete, time_taken: 120, is_priority: false, created_at: new Date().toISOString() },
    ];
    return tasks;
};

export const MOCK_TASKS: Task[] = generateDynamicMockTasks();

export const MOCK_UNPLANNED_TASKS: UnplannedTask[] = [
    {
        id: 'unplanned-001',
        user_id: 'user-001', // Bob Builder
        text: 'Research new frontend frameworks for Project X.',
        status: TaskStatus.Incomplete,
        time_taken: 0,
        is_priority: false,
        created_at: new Date().toISOString(),
    },
    {
        id: 'unplanned-002',
        user_id: 'user-001', // Bob Builder
        text: 'Draft the initial architecture diagram for the new microservice.',
        status: TaskStatus.Incomplete,
        time_taken: 0,
        is_priority: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 'unplanned-003',
        user_id: 'user-003', // Eve Employee
        text: 'Schedule a team-building event for Q3.',
        status: TaskStatus.Incomplete,
        time_taken: 0,
        is_priority: false,
        created_at: new Date().toISOString(),
    }
];
