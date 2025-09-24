
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
    {
        id: 'admin-001',
        name: 'Alice Admin',
        email: 'alice@innovate.local',
        role: Role.Admin,
        company_id: 'company-a',
    },
    {
        id: 'user-001',
        name: 'Bob Builder',
        email: 'bob@innovate.local',
        role: Role.User,
        company_id: 'company-a',
    },
    {
        id: 'user-002',
        name: 'Charlie Crew',
        email: 'charlie@innovate.local',
        role: Role.User,
        company_id: 'company-a',
    },
    {
        id: 'admin-002',
        name: 'Diana Director',
        email: 'diana@synergy.local',
        role: Role.Admin,
        company_id: 'company-b',
    },
    {
        id: 'user-003',
        name: 'Eve Employee',
        email: 'eve@synergy.local',
        role: Role.User,
        company_id: 'company-b',
    },
    {
        id: 'user-004',
        name: 'Frank Field',
        email: 'frank@unassigned.local',
        role: Role.User,
        company_id: null,
    },
];

// --- DYNAMIC MOCK TASKS ---

const generateDynamicMockTasks = (): Task[] => {
    const today = new Date();

    // Determine the "current" week for each calendar system
    const aprilStartWeek = getWeekNumber(today, 'April');
    const januaryStartWeek = getWeekNumber(today, 'January');

    // Define the weeks for which we'll generate data
    const innovateWeeks = [aprilStartWeek - 1, aprilStartWeek, aprilStartWeek + 1];
    const synergyWeeks = [januaryStartWeek - 1, januaryStartWeek, januaryStartWeek + 1];

    const tasks: Task[] = [
        // === Bob Builder (user-001) - Innovate Inc. (April Calendar) ===
        // Week: Current - 1
        { id: 'task-bob-prev-1', user_id: 'user-001', week_number: innovateWeeks[0], day: 'Monday', text: 'Review project proposal for Project Phoenix.', status: TaskStatus.Complete, time_taken: 60, is_priority: true, created_at: new Date().toISOString() },
        { id: 'task-bob-prev-2', user_id: 'user-001', week_number: innovateWeeks[0], day: 'Wednesday', text: 'Debug and fix the authentication issue on staging.', status: TaskStatus.Complete, time_taken: 120, is_priority: true, created_at: new Date().toISOString() },
        { id: 'task-bob-prev-3', user_id: 'user-001', week_number: innovateWeeks[0], day: 'Friday', text: 'Team code review session.', status: TaskStatus.Complete, time_taken: 45, is_priority: false, created_at: new Date().toISOString() },
        
        // Week: Current
        { id: 'task-bob-curr-1', user_id: 'user-001', week_number: innovateWeeks[1], day: 'Monday', text: 'Begin development of the new reporting module.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: false, created_at: new Date().toISOString() },
        { id: 'task-bob-curr-2', user_id: 'user-001', week_number: innovateWeeks[1], day: 'Tuesday', text: 'Prepare technical specification for API endpoint.', status: TaskStatus.Incomplete, time_taken: 90, is_priority: false, created_at: new Date().toISOString() },
        { id: 'task-bob-curr-3', user_id: 'user-001', week_number: innovateWeeks[1], day: 'Thursday', text: 'Write unit tests for the user service.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: false, created_at: new Date().toISOString() },
        
        // Week: Current + 1
        { id: 'task-bob-next-1', user_id: 'user-001', week_number: innovateWeeks[2], day: 'Tuesday', text: 'Deploy latest build to the QA environment.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: true, created_at: new Date().toISOString() },
        { id: 'task-bob-next-2', user_id: 'user-001', week_number: innovateWeeks[2], day: 'Friday', text: 'Sprint planning and grooming for the next sprint.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: false, created_at: new Date().toISOString() },

        // === Charlie Crew (user-002) - Innovate Inc. (April Calendar) ===
        // Week: Current - 1
        { id: 'task-charlie-prev-1', user_id: 'user-002', week_number: innovateWeeks[0], day: 'Monday', text: 'Compile weekly progress report for client A.', status: TaskStatus.Complete, time_taken: 50, is_priority: false, created_at: new Date().toISOString() },
        { id: 'task-charlie-prev-2', user_id: 'user-002', week_number: innovateWeeks[0], day: 'Thursday', text: 'Organize the shared drive and archive old files.', status: TaskStatus.Complete, time_taken: 75, is_priority: false, created_at: new Date().toISOString() },
        
        // Week: Current
        { id: 'task-charlie-curr-1', user_id: 'user-002', week_number: innovateWeeks[1], day: 'Tuesday', text: 'Take meeting minutes for the all-hands call.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: true, created_at: new Date().toISOString() },
        { id: 'task-charlie-curr-2', user_id: 'user-002', week_number: innovateWeeks[1], day: 'Wednesday', text: 'Assist marketing with proofreading brochure content.', status: TaskStatus.Additional, time_taken: 40, is_priority: false, created_at: new Date().toISOString() },
        { id: 'task-charlie-curr-3', user_id: 'user-002', week_number: innovateWeeks[1], day: 'Friday', text: 'Update the internal team contact list.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: false, created_at: new Date().toISOString() },
        
        // Week: Current + 1
        { id: 'task-charlie-next-1', user_id: 'user-002', week_number: innovateWeeks[2], day: 'Monday', text: 'Gather feedback from the team on the new workflow.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: false, created_at: new Date().toISOString() },
        { id: 'task-charlie-next-2', user_id: 'user-002', week_number: innovateWeeks[2], day: 'Thursday', text: 'Prepare onboarding materials for the new hire.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: false, created_at: new Date().toISOString() },

        // === Eve Employee (user-003) - Synergy Solutions (January Calendar) ===
        // Week: Current - 1
        { id: 'task-eve-prev-1', user_id: 'user-003', week_number: synergyWeeks[0], day: 'Monday', text: 'Onboard new team member and set up accounts.', status: TaskStatus.Complete, time_taken: 120, is_priority: false, created_at: new Date().toISOString() },
        { id: 'task-eve-prev-2', user_id: 'user-003', week_number: synergyWeeks[0], day: 'Wednesday', text: 'Draft the quarterly HR report.', status: TaskStatus.Additional, time_taken: 45, is_priority: false, created_at: new Date().toISOString() },
        { id: 'task-eve-prev-3', user_id: 'user-003', week_number: synergyWeeks[0], day: 'Friday', text: 'Finalize sprint planning with department heads.', status: TaskStatus.Complete, time_taken: 30, is_priority: true, created_at: new Date().toISOString() },
        
        // Week: Current
        { id: 'task-eve-curr-1', user_id: 'user-003', week_number: synergyWeeks[1], day: 'Tuesday', text: 'Review and approve expense reports.', status: TaskStatus.Complete, time_taken: 60, is_priority: false, created_at: new Date().toISOString() },
        { id: 'task-eve-curr-2', user_id: 'user-003', week_number: synergyWeeks[1], day: 'Thursday', text: 'Conduct performance review check-ins.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: true, created_at: new Date().toISOString() },
        
        // Week: Current + 1
        { id: 'task-eve-next-1', user_id: 'user-003', week_number: synergyWeeks[2], day: 'Wednesday', text: 'Plan agenda for the management offsite.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: false, created_at: new Date().toISOString() },
        { id: 'task-eve-next-2', user_id: 'user-003', week_number: synergyWeeks[2], day: 'Friday', text: 'Submit payroll data to finance.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: true, created_at: new Date().toISOString() },

        // === Frank Field (user-004) - Unassigned (April Calendar) ===
        // Week: Current - 1
        { id: 'task-frank-prev-1', user_id: 'user-004', week_number: innovateWeeks[0], day: 'Tuesday', text: 'Analyze competitor marketing strategies from Q1.', status: TaskStatus.Complete, time_taken: 150, is_priority: false, created_at: new Date().toISOString() },
        { id: 'task-frank-prev-2', user_id: 'user-004', week_number: innovateWeeks[0], day: 'Thursday', text: 'Create ad copy for new social media campaign.', status: TaskStatus.Complete, time_taken: 80, is_priority: false, created_at: new Date().toISOString() },
        
        // Week: Current
        { id: 'task-frank-curr-1', user_id: 'user-004', week_number: innovateWeeks[1], day: 'Monday', text: 'Update Salesforce with new contacts.', status: TaskStatus.Complete, time_taken: 45, is_priority: false, created_at: new Date().toISOString() },
        { id: 'task-frank-curr-2', user_id: 'user-004', week_number: innovateWeeks[1], day: 'Wednesday', text: 'Present Q2 marketing plan to management.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: true, created_at: new Date().toISOString() },
        { id: 'task-frank-curr-3', user_id: 'user-004', week_number: innovateWeeks[1], day: 'Friday', text: 'Follow up with leads from the conference.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: true, created_at: new Date().toISOString() },
        
        // Week: Current + 1
        { id: 'task-frank-next-1', user_id: 'user-004', week_number: innovateWeeks[2], day: 'Tuesday', text: 'Client call with Innovate Inc. to discuss renewal.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: true, created_at: new Date().toISOString() },
        { id: 'task-frank-next-2', user_id: 'user-004', week_number: innovateWeeks[2], day: 'Thursday', text: 'A/B test email subject lines for newsletter.', status: TaskStatus.Incomplete, time_taken: 0, is_priority: false, created_at: new Date().toISOString() },
    ];
    return tasks;
};

export const MOCK_TASKS: Task[] = generateDynamicMockTasks();


// --- MOCK UNPLANNED TASKS ---
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
