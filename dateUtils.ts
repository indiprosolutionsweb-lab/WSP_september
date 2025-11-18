

export const getFinancialYearStartDate = (year: number, startMonth: 'January' | 'April', companyName?: string): Date => {
    // Special rule for Decathlon: Year starts on Jan 1st exactly.
    if (companyName === 'Decathlon' && startMonth === 'January') {
        return new Date(year, 0, 1); // January is month 0
    }

    const monthIndex = startMonth === 'January' ? 0 : 3; // 0 for Jan, 3 for Apr
    const firstDayOfMonth = new Date(year, monthIndex, 1);
    const dayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    // Formula to find the date of the first Monday of a month.
    // If dayOfWeek is Sunday (0), it needs 1 day to get to Monday.
    // If dayOfWeek is Monday (1), it needs 0 days.
    // If dayOfWeek is Tuesday (2), it needs 6 days to get to the *next* Monday.
    const dateOfMonth = 1 + ((1 - dayOfWeek + 7) % 7);
    return new Date(year, monthIndex, dateOfMonth);
};

export const getFinancialYearDetailsForDate = (d: Date, startMonth: 'January' | 'April', companyName?: string) => {
    const today = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const currentYear = today.getFullYear();
    const startForThisCalendarYear = getFinancialYearStartDate(currentYear, startMonth, companyName);
    
    let financialYearStart: Date;
    let financialYearLabel: string;

    if (today < startForThisCalendarYear) {
        // Belongs to the previous financial year
        financialYearStart = getFinancialYearStartDate(currentYear - 1, startMonth, companyName);
        if (startMonth === 'January') {
             financialYearLabel = `Jan ${currentYear - 1} - Dec ${currentYear - 1}`;
        } else {
             financialYearLabel = `April ${currentYear - 1} - March ${currentYear}`;
        }
    } else {
        // Belongs to the current financial year
        financialYearStart = startForThisCalendarYear;
         if (startMonth === 'January') {
             financialYearLabel = `Jan ${currentYear} - Dec ${currentYear}`;
        } else {
             financialYearLabel = `April ${currentYear} - March ${currentYear + 1}`;
        }
    }

    return { financialYearStart, financialYearLabel };
};

export const getWeekNumber = (d: Date, startMonth: 'January' | 'April', companyName?: string): number => {
    const today = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const { financialYearStart } = getFinancialYearDetailsForDate(d, startMonth, companyName);
    
    // Calculate the difference in days. Use UTC to avoid daylight saving issues.
    const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const utcStart = Date.UTC(financialYearStart.getFullYear(), financialYearStart.getMonth(), financialYearStart.getDate());
    
    const diffDays = (utcToday - utcStart) / (1000 * 60 * 60 * 24);

    // Week number is the number of full weeks passed (floor) + 1
    const weekNumber = Math.floor(diffDays / 7) + 1;

    return weekNumber > 0 ? weekNumber : 1;
};
