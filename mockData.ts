
import { Company, Profile, Role, Task, TaskStatus } from './types';

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

// --- MOCK TASKS ---

export const MOCK_TASKS: Task[] = [
    // Tasks for Bob Builder (user-001)
    {
        id: 'task-001',
        user_id: 'user-001',
        week_number: 10,
        day: 'Monday',
        text: 'Review project proposal and provide feedback.',
        status: TaskStatus.Complete,
        time_taken: 60,
        is_priority: true,
        created_at: new Date().toISOString(),
    },
    {
        id: 'task-002',
        user_id: 'user-001',
        week_number: 10,
        day: 'Tuesday',
        text: 'Prepare presentation for the client meeting.',
        status: TaskStatus.Incomplete,
        time_taken: 90,
        is_priority: false,
        created_at: new Date().toISOString(),
    },
     {
        id: 'task-009',
        user_id: 'user-001',
        week_number: 11,
        day: 'Wednesday',
        text: 'Follow up on previous action items.',
        status: TaskStatus.Incomplete,
        time_taken: 0,
        is_priority: false,
        created_at: new Date().toISOString(),
    },
    // Tasks for Eve Employee (user-003)
    {
        id: 'task-003',
        user_id: 'user-003',
        week_number: 10,
        day: 'Monday',
        text: 'Onboard new team member and set up their accounts.',
        status: TaskStatus.Complete,
        time_taken: 120,
        is_priority: false,
        created_at: new Date().toISOString(),
    },
    {
        id: 'task-004',
        user_id: 'user-003',
        week_number: 10,
        day: 'Wednesday',
        text: 'Draft the quarterly report.',
        status: TaskStatus.Additional,
        time_taken: 45,
        is_priority: false,
        created_at: new Date().toISOString(),
    },
    {
        id: 'task-005',
        user_id: 'user-003',
        week_number: 10,
        day: 'Friday',
        text: 'Finalize sprint planning for next week.',
        status: TaskStatus.Incomplete,
        time_taken: 30,
        is_priority: true,
        created_at: new Date().toISOString(),
    },
    // Tasks for Frank Field (user-004)
     {
        id: 'task-006',
        user_id: 'user-004',
        week_number: 10,
        day: 'Thursday',
        text: 'Analyze competitor marketing strategies.',
        status: TaskStatus.Complete,
        time_taken: 150,
        is_priority: false,
        created_at: new Date().toISOString(),
    },
    {
        id: 'task-007',
        user_id: 'user-004',
        week_number: 10,
        day: 'Thursday',
        text: 'Create ad copy for the new campaign.',
        status: TaskStatus.Incomplete,
        time_taken: 0,
        is_priority: false,
        created_at: new Date().toISOString(),
    },
     {
        id: 'task-008',
        user_id: 'user-004',
        week_number: 9,
        day: 'Tuesday',
        text: 'A task from a previous week.',
        status: TaskStatus.Complete,
        time_taken: 25,
        is_priority: false,
        created_at: new Date().toISOString(),
    },
];
