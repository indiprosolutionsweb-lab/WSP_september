

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

export interface UnplannedTask {
  id: string;
  user_id: string;
  text: string;
  status: TaskStatus;
  time_taken: number;
  is_priority: boolean;
  created_at: string;
}

export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export type FocusItemStatus = 'red' | 'yellow' | 'green' | 'none';

export interface FocusItem {
  id: string;
  text: string;
  status: FocusItemStatus;
}

export interface FocusNote {
    user_id: string;
    focus_text: string | null; // This will now be a JSON string of FocusItem[]
    pointers_text: string | null;
}

// This represents tasks grouped by day for a single week.
export type WeekTasks = {
  [key in Day]?: Task[];
};

export interface TaskStats {
  complete_count: number;
  incomplete_count: number;
  additional_count: number;
  total_tasks: number;
  total_time: number;
  complete_time: number;
  incomplete_time: number;
  additional_time: number;
}
