
import { MOCK_COMPANIES, MOCK_PROFILES, MOCK_TASKS, MOCK_UNPLANNED_TASKS, MOCK_SUPERADMIN_USER } from './mockData.ts';
import { Company, Profile, Task, FocusNote, UnplannedTask } from './types.ts';

// --- USER SWITCH FOR LOCAL DEVELOPMENT ---
// The current user is now controlled by the DevUserSwitcher component,
// which writes to localStorage. This section is no longer edited directly.

const DEV_USER_OVERRIDE_KEY = 'wsp_dev_user_override';

const getMockUserId = (): string | null => {
    const override = localStorage.getItem(DEV_USER_OVERRIDE_KEY);
    if (override !== null) {
        // If the stored value is the string 'null', treat as logged out.
        return override === 'null' ? null : override;
    }
    // Default to Super Admin if no override is set in localStorage.
    return 'superadmin-001'; 
};

const CURRENT_MOCK_USER_ID = getMockUserId();


// --- DO NOT EDIT BELOW THIS LINE ---

const MOCK_USER_SESSION = (() => {
    if (!CURRENT_MOCK_USER_ID) {
        return null; // No user logged in, will show login page
    }
    const userProfile = MOCK_PROFILES.find(p => p.id === CURRENT_MOCK_USER_ID);
    if (!userProfile) {
        console.error(`Mock user with ID "${CURRENT_MOCK_USER_ID}" not found. Defaulting to Super Admin.`);
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
        console.error(`Error reading table ${key} from localStorage`, error);
        return [];
    }
};

const writeTable = <T,>(key: string, data: T[]): void => {
    try {
        localStorage.setItem(key, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing table ${key} to localStorage`, error);
    }
};

const seedData = () => {
    if (!localStorage.getItem(TABLE_KEYS.profiles)) {
        console.log('Seeding mock data into localStorage...');
        writeTable<Profile>(TABLE_KEYS.profiles, MOCK_PROFILES);
        writeTable<Company>(TABLE_KEYS.companies, MOCK_COMPANIES);
        writeTable<Task>(TABLE_KEYS.tasks, MOCK_TASKS);
        writeTable<FocusNote>(TABLE_KEYS.focus_notes, []); // Start with empty focus notes
        writeTable<UnplannedTask>(TABLE_KEYS.unplanned_tasks, MOCK_UNPLANNED_TASKS);
    }
};

// Initialize data on load
seedData();

// --- MOCK SUPABASE CLIENT ---

const from = (tableName: keyof typeof TABLE_KEYS) => {
    const tableKey = TABLE_KEYS[tableName];

    return {
        select: (columns = '*') => ({
            eq: async (column: string, value: any) => {
                const data = readTable(tableKey).filter((row: any) => row[column] === value);
                return { data, error: null };
            },
            maybeSingle: async () => {
                // This is a simplified version of maybeSingle, assuming it's chained after an `eq`
                // In a real scenario, this would be more complex. The `select` itself doesn't have eq.
                // It should be select().eq().maybeSingle(). This mock fakes it.
                const mockLastQuery = (from(tableName).select(columns) as any)._lastQuery; // This is a fake property
                 if (mockLastQuery && mockLastQuery.column) {
                    const data = readTable(tableKey).find((row: any) => row[mockLastQuery.column] === mockLastQuery.value);
                    return { data: data || null, error: null };
                }
                 console.warn("maybeSingle() mock called without a preceding .eq() - returning null");
                return { data: null, error: null };
            },
            // Add a base select function if not chained
            then: async (resolve: any) => {
                 const data = readTable(tableKey);
                 resolve({ data, error: null });
            }
        }),

        insert: (newData: any) => {
            const dataWithId = {
                ...newData,
                id: newData.id || generateUUID(),
                created_at: new Date().toISOString(),
            };
            const table = readTable(tableKey);
            table.push(dataWithId);
            writeTable(tableKey, table);
            return {
                select: async () => ({ data: [dataWithId], error: null }),
            };
        },
        
        update: (updateData: any) => ({
            eq: async (column: string, value: any) => {
                const table = readTable(tableKey);
                let updated = false;
                const newTable = table.map((row: any) => {
                    if (row[column] === value) {
                        updated = true;
                        return { ...row, ...updateData };
                    }
                    return row;
                });
                if (updated) {
                    writeTable(tableKey, newTable);
                }
                return { data: null, error: null };
            },
        }),

        delete: () => ({
            eq: async (column: string, value: any) => {
                const table = readTable(tableKey);
                const newTable = table.filter((row: any) => row[column] !== value);
                if (newTable.length < table.length) {
                    writeTable(tableKey, newTable);
                }
                return { data: null, error: null };
            },
        }),

        upsert: (newData: any) => ({
             select: () => ({
                single: async () => {
                    const table = readTable(tableKey);
                    const pkColumn = tableName === 'focus_notes' ? 'user_id' : 'id';
                    
                    const safeNewData = typeof newData === 'object' && newData ? newData : {};

                    const existingIndex = (safeNewData[pkColumn] !== undefined)
                        ? table.findIndex((row: any) => row && row[pkColumn] === safeNewData[pkColumn])
                        : -1;
                    
                    let resultData;
                    if (existingIndex > -1) {
                        const existingItem = table[existingIndex];
                        // Using Object.assign ensures both are treated as objects before being merged.
                        table[existingIndex] = { ...Object.assign({}, existingItem), ...Object.assign({}, safeNewData), updated_at: new Date().toISOString() };
                        resultData = table[existingIndex];
                    } else {
                        const newEntry = { ...Object.assign({}, safeNewData), created_at: new Date().toISOString(), id: (newData as any)?.id || generateUUID() };
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
// Add a passthrough for the base select call
(from as any).select = async (columns = '*') => {
    // This part is tricky to mock perfectly. Assuming a generic 'profiles' call if no table specified.
    const data = readTable(TABLE_KEYS.profiles);
    return { data, error: null };
};


const auth = {
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
        // Immediately call back with a mock session to auto-login, or null to show login page
        setTimeout(() => {
            if (MOCK_USER_SESSION) {
                callback('SIGNED_IN', MOCK_USER_SESSION);
            } else {
                callback('SIGNED_OUT', null);
            }
        }, 0);
        return { data: { subscription: { unsubscribe: () => {} } } };
    },
    getSession: async () => {
        return { data: { session: MOCK_USER_SESSION } };
    },
    signOut: async () => {
        // In local mode, sign out does nothing but allows the app to proceed.
        // Reloading will just sign back in automatically.
        return { error: null };
    },
    signInWithPassword: async ({ email, password }) => {
        const user = MOCK_PROFILES.find(p => p.email.toLowerCase() === email.toLowerCase());
        if(user) {
            alert(`DEV MODE LOGIN:\nSuccessfully signed in as ${user.name}.\n\nThe page will now reload.`);
            // A real app would check a password, here we just find the user
            // To make this work, we'd need a way to tell the app which user to be on next load.
            // For now, we'll just log and let the user manually change the switch.
            console.log(`Login successful for ${user.name}. Please set CURRENT_MOCK_USER_ID to '${user.id}' in localStorageClient.ts and refresh.`);
            return { error: null };
        }
        return { error: { message: "User not found in mock data. Log in by changing the USER SWITCH at the top of localStorageClient.ts" } };
    },
    signUp: async ({ email, password }) => {
        // This is a simplified signUp for user creation by an admin
        const newUser = { id: generateUUID(), email, created_at: new Date().toISOString() };
        return { data: { user: newUser }, error: null };
    },
    setSession: async ({ access_token, refresh_token }) => {
        // No-op in mock mode
        return { data: null, error: null };
    },
     resetPasswordForEmail: async (email: string, options: any) => {
        console.log(`Mock password reset requested for ${email}`);
        return { data: {}, error: null };
    },
    updateUser: async ({ password }) => {
        console.log(`Mock user password updated.`);
        return { data: {}, error: null };
    }
};

// A small hack to make from('...').select() work as well as from('...').select().eq()
const enhancedFrom = (tableName: keyof typeof TABLE_KEYS) => {
    const baseFrom = from(tableName);
    const originalSelect = baseFrom.select;

    (baseFrom as any).select = (columns = '*') => {
        const selectResult = originalSelect(columns);
        // Add a .then method to the result of select() to handle queries without .eq()
        (selectResult as any).then = async (callback: any) => {
            const data = readTable(TABLE_KEYS[tableName]);
            callback({ data, error: null });
        };

        (selectResult as any).maybeSingle = async () => {
             console.warn("maybeSingle() mock called without a preceding .eq() - returning null");
             return { data: null, error: null };
        };

        const originalEq = selectResult.eq;
        (selectResult as any).eq = (column: string, value: any) => {
            const eqResultPromise = originalEq(column, value);

            const builder = {
                maybeSingle: () => {
                    return eqResultPromise.then(eqResult => {
                        if (eqResult.error) {
                            return { data: null, error: eqResult.error };
                        }
                        return { data: eqResult.data?.length > 0 ? eqResult.data[0] : null, error: null };
                    });
                },
                then: (onfulfilled: any, onrejected: any) => {
                    return eqResultPromise.then(onfulfilled, onrejected);
                },
            };

            return builder;
        };
        
        return selectResult;
    };
    return baseFrom;
};


export const mockSupa = {
    from: enhancedFrom,
    auth,
};
