
export const getFinancialYearStartDate = (year: number, startMonth: 'January' | 'April'): Date => {
    const monthIndex = startMonth === 'January' ? 0 : 3; // 0 for Jan, 3 for Apr
    const firstDayOfMonth = new Date(year, monthIndex, 1);
    const dayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    // Formula to find the date of the first Monday of a month.
    const dateOfMonth = 1 + ((1 - dayOfWeek + 7) % 7);
    return new Date(year, monthIndex, dateOfMonth);
};

export const getFinancialYearDetailsForDate = (d: Date, startMonth: 'January' | 'April') => {
    const today = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const currentYear = today.getFullYear();
    const startForThisCalendarYear = getFinancialYearStartDate(currentYear, startMonth);
    
    let financialYearStart: Date;
    let financialYearLabel: string;

    if (today < startForThisCalendarYear) {
        // Belongs to the previous financial year
        financialYearStart = getFinancialYearStartDate(currentYear - 1, startMonth);
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

export const getWeekNumber = (d: Date, startMonth: 'January' | 'April'): number => {
    const today = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const { financialYearStart } = getFinancialYearDetailsForDate(d, startMonth);
    
    // Calculate the difference in days. Use UTC to avoid daylight saving issues.
    const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const utcStart = Date.UTC(financialYearStart.getFullYear(), financialYearStart.getMonth(), financialYearStart.getDate());
    
    const diffDays = (utcToday - utcStart) / (1000 * 60 * 60 * 24);

    // Week number is the number of full weeks passed (floor) + 1
    const weekNumber = Math.floor(diffDays / 7) + 1;

    return weekNumber > 0 ? weekNumber : 1;
};
