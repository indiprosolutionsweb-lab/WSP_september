
export enum Role {
  User = 'user',
  Admin = 'admin',
  Superadmin = 'superadmin',
}

export interface Company {
  id: string;
  name: string;
  created_at: string;
  calendar_start_month: 'January' | 'April';
}

// This represents the public `profiles` table, not the `auth.users` table
export interface Profile {
  id: string; // This is a UUID that must match the auth.users id
  name: string;
  email: string; // Added for display and management
  role: Role;
  company_id: string | null;
}

export enum TaskStatus {
  Incomplete = 'Incomplete',
  Complete = 'Complete',
  Additional = 'Additional',
}

export interface Task {
  id: string;
  user_id: string;
  week_number: number;
  day: Day;
  text: string;
  status: TaskStatus;
  time_taken: number; // Time in minutes
  is_priority: boolean;
  created_at: string;
}

export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface FocusNote {
    user_id: string;
    focus_text: string | null;
    pointers_text: string | null;
}

// This represents tasks grouped by day for a single week.
export type WeekTasks = {
  [key in Day]?: Task[];
};
