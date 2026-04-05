export const DateTimeUtils = {
  startOfDay(date: Date | string) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  endOfDay(date: Date | string) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  },

  todayStart() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  },

  todayEnd() {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return now;
  },
};