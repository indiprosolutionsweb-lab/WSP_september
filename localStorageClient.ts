import { MOCK_COMPANIES, MOCK_PROFILES, MOCK_TASKS, MOCK_UNPLANNED_TASKS, MOCK_SUPERADMIN_USER } from './mockData.ts';
import { Company, Profile, Task, FocusNote, UnplannedTask, TaskStats, TaskStatus } from './types.ts';

// --- USER SWITCH FOR LOCAL DEVELOPMENT ---
// FIX: Corrected typo in constant name from DEV_USER_OVERRRIDE_KEY to DEV_USER_OVERRIDE_KEY
const DEV_USER_OVERRIDE_KEY = 'wsp_dev_user_override';
const getMockUserId = (): string | null => {
    const override = localStorage.getItem(DEV_USER_OVERRIDE_KEY);
    return override === 'null' ? null : (override || 'superadmin-001');
};
const CURRENT_MOCK_USER_ID = getMockUserId();

const MOCK_USER_SESSION = (() => {
    if (!CURRENT_MOCK_USER_ID) return null;
    const userProfile = MOCK_PROFILES.find(p => p.id === CURRENT_MOCK_USER_ID);
    if (!userProfile) {
        console.error(`Mock user with ID "${CURRENT_MOCK_USER_ID}" not found.`);
        return { user: MOCK_SUPERADMIN_USER };
    }
    return { user: userProfile };
})();

// --- UTILITY FUNCTIONS ---
const generateUUID = () => crypto.randomUUID();

const TABLE_KEYS = {
    profiles: 'wsp_profiles',
    companies: 'wsp_companies',
    tasks: 'wsp_tasks',
    focus_notes: 'wsp_focus_notes',
    unplanned_tasks: 'wsp_unplanned_tasks',
};

const readTable = <T,>(key: string): T[] => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error(`Error reading table ${key}`, error);
        return [];
    }
};

const writeTable = <T,>(key: string, data: T[]): void => {
    try {
        localStorage.setItem(key, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing table ${key}`, error);
    }
};

const seedData = () => {
    if (!localStorage.getItem(TABLE_KEYS.profiles)) {
        console.log('Seeding mock data into localStorage...');
        writeTable<Profile>(TABLE_KEYS.profiles, MOCK_PROFILES);
        writeTable<Company>(TABLE_KEYS.companies, MOCK_COMPANIES);
        writeTable<Task>(TABLE_KEYS.tasks, MOCK_TASKS);
        writeTable<FocusNote>(TABLE_KEYS.focus_notes, []);
        writeTable<UnplannedTask>(TABLE_KEYS.unplanned_tasks, MOCK_UNPLANNED_TASKS);
    }
};

seedData();

// --- NEW MOCK QUERY BUILDER ---
class MockQueryBuilder {
    private tableName: keyof typeof TABLE_KEYS;
    private filters: { type: 'eq' | 'neq' | 'is', column: string, value: any }[] = [];
    // FIX: Renamed property from 'range' to '_range' to avoid conflict with the 'range' method.
    private _range: { from: number, to: number } | null = null;
    private _order: { column: string, options: { ascending: boolean } } | null = null;
    private options: { count?: 'exact' } = {};

    constructor(tableName: keyof typeof TABLE_KEYS) {
        this.tableName = tableName;
    }

    select(columns: string = '*', options: { count?: 'exact' } = {}) {
        this.options = options;
        return this;
    }

    eq(column: string, value: any) {
        this.filters.push({ type: 'eq', column, value });
        return this;
    }
    
    neq(column: string, value: any) {
        this.filters.push({ type: 'neq', column, value });
        return this;
    }

    is(column: string, value: any) {
        this.filters.push({ type: 'is', column, value });
        return this;
    }

    order(column: string, options: { ascending: boolean } = { ascending: true }) {
        this._order = { column, options };
        return this;
    }

    range(from: number, to: number) {
        this._range = { from, to };
        return this;
    }

    maybeSingle() {
        // This is a special case of `then` for a single record.
        const promise = this.executeQuery();
        return promise.then(result => {
             if (result.error) return { data: null, error: result.error };
             const data = result.data && result.data.length > 0 ? result.data[0] : null;
             return { data, error: null };
        });
    }

    then(onfulfilled: (value: any) => any, onrejected?: (reason: any) => any) {
        return this.executeQuery().then(onfulfilled, onrejected);
    }

    private async executeQuery() {
        try {
            let tableData = readTable(TABLE_KEYS[this.tableName]);

            this.filters.forEach(filter => {
                tableData = tableData.filter((row: any) => {
                    switch (filter.type) {
                        case 'eq': return row[filter.column] === filter.value;
                        case 'neq': return row[filter.column] !== filter.value;
                        case 'is': return row[filter.column] === filter.value;
                        default: return true;
                    }
                });
            });

            if (this._order) {
                const { column, options } = this._order;
                tableData.sort((a: any, b: any) => {
                    const valA = a[column];
                    const valB = b[column];
                    if (valA === null || valA === undefined) return options.ascending ? -1 : 1;
                    if (valB === null || valB === undefined) return options.ascending ? 1 : -1;
                    if (valA < valB) return options.ascending ? -1 : 1;
                    if (valA > valB) return options.ascending ? 1 : -1;
                    return 0;
                });
            }

            const count = this.options.count === 'exact' ? tableData.length : null;

            if (this._range) {
                tableData = tableData.slice(this._range.from, this._range.to + 1);
            }

            return { data: tableData, error: null, count };
        } catch (error) {
            console.error("Mock query execution error:", error);
            return { data: null, error, count: null };
        }
    }
}

// --- MOCK SUPABASE CLIENT ---

const from = (tableName: keyof typeof TABLE_KEYS) => {
    const tableKey = TABLE_KEYS[tableName];

    return {
        select: (columns = '*', options = {}) => new MockQueryBuilder(tableName).select(columns, options),

        insert: (newData: any) => ({
            select: async () => {
                const dataWithId = { ...newData, id: newData.id || generateUUID(), created_at: new Date().toISOString() };
                const table = readTable(tableKey);
                table.push(dataWithId);
                writeTable(tableKey, table);
                return { data: [dataWithId], error: null };
            },
        }),
        
        update: (updateData: any) => ({
            eq: async (column: string, value: any) => {
                const table = readTable(tableKey);
                const newTable = table.map((row: any) => (row[column] === value) ? { ...row, ...updateData } : row);
                writeTable(tableKey, newTable);
                return { data: null, error: null };
            },
        }),

        delete: () => ({
            eq: async (column: string, value: any) => {
                const table = readTable(tableKey);
                const newTable = table.filter((row: any) => row[column] !== value);
                writeTable(tableKey, newTable);
                return { data: null, error: null };
            },
        }),

        upsert: (newData: any) => ({
             select: () => ({
                single: async () => {
                    const table = readTable(tableKey);
                    const pkColumn = tableName === 'focus_notes' ? 'user_id' : 'id';
                    const existingIndex = (newData[pkColumn] !== undefined) ? table.findIndex((row: any) => row && row[pkColumn] === newData[pkColumn]) : -1;
                    
                    let resultData;
                    if (existingIndex > -1) {
                        // FIX: Cast both existing and new data to `object` to prevent "Spread types may only be created from object types" error.
                        table[existingIndex] = { ...(table[existingIndex] as object), ...(newData as object), updated_at: new Date().toISOString() };
                        resultData = table[existingIndex];
                    } else {
                        // FIX: Cast `newData` to `object` to prevent "Spread types may only be created from object types" error.
                        const newEntry = { ...(newData as object), created_at: new Date().toISOString(), id: (newData as any)?.id || generateUUID() };
                        table.push(newEntry);
                        resultData = newEntry;
                    }
                    writeTable(tableKey, table);
                    return { data: resultData, error: null };
                }
            })
        }),
    };
};

const auth = {
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
        setTimeout(() => callback(MOCK_USER_SESSION ? 'SIGNED_IN' : 'SIGNED_OUT', MOCK_USER_SESSION), 0);
        return { data: { subscription: { unsubscribe: () => {} } } };
    },
    getSession: async () => ({ data: { session: MOCK_USER_SESSION } }),
    signOut: async () => ({ error: null }),
    signInWithPassword: async ({ email }) => {
        const user = MOCK_PROFILES.find(p => p.email.toLowerCase() === email.toLowerCase());
        if(user) {
            alert(`DEV MODE LOGIN:\nSuccessfully signed in as ${user.name}.\n\nThe page will now reload.`);
            localStorage.setItem(DEV_USER_OVERRIDE_KEY, user.id);
            window.location.reload();
            return { error: null };
        }
        return { error: { message: "User not found in mock data. Use the Dev User Switcher instead." } };
    },
    signUp: async ({ email }) => ({ data: { user: { id: generateUUID(), email, created_at: new Date().toISOString() } }, error: null }),
    setSession: async () => ({ data: null, error: null }),
    resetPasswordForEmail: async (email: string) => {
        console.log(`Mock password reset requested for ${email}`);
        return { data: {}, error: null };
    },
    updateUser: async () => {
        console.log(`Mock user password updated.`);
        return { data: {}, error: null };
    }
};

const rpc = async (functionName: string, params: any) => {
    if (functionName === 'get_task_stats_for_range') {
        const { p_user_id, p_start_week, p_end_week } = params;
        const allTasks = readTable<Task>(TABLE_KEYS.tasks);

        const tasksInRange = allTasks.filter(task => 
            task.user_id === p_user_id &&
            task.week_number >= p_start_week &&
            task.week_number <= p_end_week
        );

        const stats: TaskStats = {
            complete_count: 0,
            incomplete_count: 0,
            additional_count: 0,
            total_tasks: 0,
            total_time: 0,
            complete_time: 0,
            incomplete_time: 0,
            additional_time: 0,
        };

        for (const task of tasksInRange) {
            stats.total_tasks++;
            const time = task.time_taken || 0;
            stats.total_time += time;

            if (task.status === TaskStatus.Complete) {
                stats.complete_count++;
                stats.complete_time += time;
            } else if (task.status === TaskStatus.Incomplete) {
                stats.incomplete_count++;
                stats.incomplete_time += time;
            } else if (task.status === TaskStatus.Additional) {
                stats.additional_count++;
                stats.additional_time += time;
            }
        }

        return { data: stats, error: null };
    }

    console.error(`Mock RPC function "${functionName}" is not implemented.`);
    return { data: null, error: { message: `RPC function "${functionName}" not found.` } };
};

export const mockSupa = { from, auth, rpc };
