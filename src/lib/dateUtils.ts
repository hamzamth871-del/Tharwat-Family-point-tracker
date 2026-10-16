export interface WeekRange {
  startDate: Date;
  endDate: Date;
  startFormatted: string; // YYYY-MM-DD
  endFormatted: string; // YYYY-MM-DD
  displayRange: string;
  isCurrentWeek: boolean;
  days: {
    date: Date;
    dateString: string; // YYYY-MM-DD
    dayName: string; // "Mon", "Tue"
    dayNumber: number; // 1-31
    display: string; // "Mon, Oct 12"
    isToday: boolean;
  }[];
}

export function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekRange(referenceDate: Date = new Date(), weekStartDay: 0 | 1 = 1): WeekRange {
  const d = new Date(referenceDate);
  d.setHours(0, 0, 0, 0);

  // current day of week: 0 (Sun) to 6 (Sat)
  const currentDay = d.getDay();

  // calculate difference from weekStartDay
  let diff = currentDay - weekStartDay;
  if (diff < 0) {
    diff += 7;
  }

  const startDate = new Date(d);
  startDate.setDate(d.getDate() - diff);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  const todayStr = formatDateToYYYYMMDD(new Date());

  const days: WeekRange['days'] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + i);
    const dateString = formatDateToYYYYMMDD(dayDate);
    const dayName = dayNames[dayDate.getDay()];
    const dayNumber = dayDate.getDate();

    days.push({
      date: dayDate,
      dateString,
      dayName,
      dayNumber,
      display: dayDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      isToday: dateString === todayStr,
    });
  }

  const sameYear = startDate.getFullYear() === endDate.getFullYear();
  const sameMonth = sameYear && startDate.getMonth() === endDate.getMonth();

  let displayRange = '';
  if (sameMonth) {
    const month = startDate.toLocaleDateString(undefined, { month: 'short' });
    displayRange = `${month} ${startDate.getDate()} – ${endDate.getDate()}, ${startDate.getFullYear()}`;
  } else if (sameYear) {
    const m1 = startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const m2 = endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    displayRange = `${m1} – ${m2}, ${startDate.getFullYear()}`;
  } else {
    const d1 = startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const d2 = endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    displayRange = `${d1} – ${d2}`;
  }

  const now = new Date();
  const isCurrentWeek = now >= startDate && now <= endDate;

  return {
    startDate,
    endDate,
    startFormatted: formatDateToYYYYMMDD(startDate),
    endFormatted: formatDateToYYYYMMDD(endDate),
    displayRange,
    isCurrentWeek,
    days,
  };
}

export function isDateInWeek(dateInput: string | Date, week: WeekRange): boolean {
  const d = new Date(dateInput);
  return d >= week.startDate && d <= week.endDate;
}

export function formatTimeAgo(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
