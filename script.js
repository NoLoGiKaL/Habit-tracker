// ===== DOM =====

const yearSelect = document.getElementById('yearSelect');
const monthSelect = document.getElementById('monthSelect');
const tableHead = document.getElementById('tableHead');
const tableBody = document.getElementById('tableBody');
const actionBtn = document.getElementById('actionBtn');
const actionMenu = document.getElementById('actionMenu');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const todayBtn = document.getElementById('todayBtn');
const statsBar = document.getElementById('statsBar');

// Modals
const dayModalOverlay = document.getElementById('dayModalOverlay');
const historyModalOverlay = document.getElementById('historyModalOverlay');
const addHabitModalOverlay = document.getElementById('addHabitModalOverlay');
const editHabitModalOverlay = document.getElementById('editHabitModalOverlay');
const deleteHabitModalOverlay = document.getElementById('deleteHabitModalOverlay');
const dailyHoursModalOverlay = document.getElementById('dailyHoursModalOverlay');

// Day modal
const dayHabitName = document.getElementById('dayHabitName');
const dayDate = document.getElementById('dayDate');
const daySummary = document.getElementById('daySummary');
const remainingLabel = document.getElementById('remainingLabel');
const remainingHours = document.getElementById('remainingHours');
const timeHours = document.getElementById('timeHours');
const timeMinutes = document.getElementById('timeMinutes');
const dayComment = document.getElementById('dayComment');
const openHistoryBtn = document.getElementById('openHistoryBtn');
const resetDayBtn = document.getElementById('resetDayBtn');
const saveDayBtn = document.getElementById('saveDayBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const timerDisplay = document.getElementById('timerDisplay');
const timerStartBtn = document.getElementById('timerStartBtn');
const timerPauseBtn = document.getElementById('timerPauseBtn');
const timerResetBtn = document.getElementById('timerResetBtn');

// History modal
const historyContent = document.getElementById('historyContent');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');

// Add/configure habit modal
const addHabitBtn = document.getElementById('addHabitBtn');
const closeAddHabitBtn = document.getElementById('closeAddHabitBtn');
const cancelAddHabitBtn = document.getElementById('cancelAddHabitBtn');
const createHabitBtn = document.getElementById('createHabitBtn');
const habitNameInput = document.getElementById('habitNameInput');
const durationMonths = document.getElementById('durationMonths');
const durationDays = document.getElementById('durationDays');
const durationHours = document.getElementById('durationHours');
const goalTypeSelect = document.getElementById('goalTypeSelect');
const goalValueInput = document.getElementById('goalValueInput');
const habitCommentInput = document.getElementById('habitCommentInput');
const habitFormTitle = addHabitModalOverlay.querySelector('.modal-title');

// Quick add form
const quickAddForm = document.getElementById('quickAddForm');
const quickHabitNameInput = document.getElementById('quickHabitNameInput');
const quickGoalTypeSelect = document.getElementById('quickGoalTypeSelect');
const quickGoalValueInput = document.getElementById('quickGoalValueInput');

// Edit habit name modal
const closeEditHabitBtn = document.getElementById('closeEditHabitBtn');
const cancelEditHabitBtn = document.getElementById('cancelEditHabitBtn');
const editHabitNameInput = document.getElementById('editHabitNameInput');
const saveHabitEditBtn = document.getElementById('saveHabitEditBtn');
const deleteHabitFromEditBtn = document.getElementById('deleteHabitFromEditBtn');

// Delete habit modal
const deleteHabitBtn = document.getElementById('deleteHabitBtn');
const closeDeleteHabitBtn = document.getElementById('closeDeleteHabitBtn');
const cancelDeleteHabitBtn = document.getElementById('cancelDeleteHabitBtn');
const deleteHabitSearchInput = document.getElementById('deleteHabitSearchInput');
const deleteHabitInfo = document.getElementById('deleteHabitInfo');
const confirmDeleteHabitBtn = document.getElementById('confirmDeleteHabitBtn');

// Daily hours modal
const dailyHoursBtn = document.getElementById('dailyHoursBtn');
const closeDailyHoursBtn = document.getElementById('closeDailyHoursBtn');
const cancelDailyHoursBtn = document.getElementById('cancelDailyHoursBtn');
const dailyHoursInput = document.getElementById('dailyHoursInput');
const saveDailyHoursBtn = document.getElementById('saveDailyHoursBtn');

// ===== State =====

const STORAGE_KEYS = {
  habits: 'habits',
  dailyHours: 'dailyHours'
};

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

let habits = loadHabits();
let dailyHours = parsePositiveNumber(localStorage.getItem(STORAGE_KEYS.dailyHours), 8);
let currentDayContext = null; // { habitId, dateKey, dateObj }
let currentHistoryHabitId = null;
let selectedDeleteId = null;
let editingHabitId = null;
let habitFormMode = 'create';
let openHabitMenuEl = null;

// Timer
let timerInterval = null;
let timerStartTime = null;
let timerAccumulatedMs = 0;

// ===== Storage & normalization =====

function loadHabits() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.habits) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeHabit).filter(Boolean);
  } catch (error) {
    console.warn('Не удалось прочитать сохраненные привычки:', error);
    return [];
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.habits, JSON.stringify(habits));
  localStorage.setItem(STORAGE_KEYS.dailyHours, String(dailyHours));
}

function normalizeHabit(rawHabit, index) {
  if (!rawHabit || typeof rawHabit !== 'object') return null;

  const habit = { ...rawHabit };
  habit.id = String(habit.id || createId(index));
  habit.name = String(habit.name || '').trim() || 'Без названия';
  if (!habit.createdAt || !isValidDate(new Date(habit.createdAt))) {
    delete habit.createdAt;
  }
  habit.durationMonths = clampInteger(habit.durationMonths, 0, 120);
  habit.durationDays = clampInteger(habit.durationDays, 0, 3660);
  habit.durationHours = clampNumber(habit.durationHours, 0, 24 * 3660);
  habit.goalType = ['daysPerWeek', 'daysTotal', 'hoursTotal', 'hoursPerDay'].includes(habit.goalType)
    ? habit.goalType
    : inferGoalType(habit);
  habit.comment = String(habit.comment || '');

  const normalizedDays = {};
  Object.entries(habit.days || {}).forEach(([key, entry]) => {
    const normalized = normalizeDayEntry(entry, key);
    if (normalized && normalized.minutes > 0) {
      normalizedDays[key] = normalized;
    }
  });
  habit.days = normalizedDays;

  ['goalDaysPerWeek', 'goalDays', 'goalHours', 'goalHoursPerDay'].forEach(prop => {
    const value = parsePositiveNumber(habit[prop], 0);
    if (value > 0) habit[prop] = value;
    else delete habit[prop];
  });

  return habit;
}

function normalizeDayEntry(entry, dateKey) {
  if (!entry || typeof entry !== 'object') return null;

  const dateObj = getDateFromKey(dateKey);
  const minutes = Math.max(0, Math.round(parsePositiveNumber(entry.minutes, 0)));
  const fallbackDate = dateObj ? formatDateLabel(dateObj) : '';

  return {
    minutes,
    comment: String(entry.comment || ''),
    date: String(entry.date || fallbackDate),
    dateKey
  };
}

function inferGoalType(habit) {
  if (parsePositiveNumber(habit.goalDaysPerWeek, 0) > 0) return 'daysPerWeek';
  if (parsePositiveNumber(habit.goalDays, 0) > 0) return 'daysTotal';
  if (parsePositiveNumber(habit.goalHoursPerDay, 0) > 0) return 'hoursPerDay';
  if (parsePositiveNumber(habit.goalHours, 0) > 0) return 'hoursTotal';
  return 'daysPerWeek';
}

function createId(index = 0) {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${index}`;
}

// ===== Utils =====

function parsePositiveNumber(value, fallback = 0) {
  const number = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function clampNumber(value, min, max) {
  const number = parsePositiveNumber(value, min);
  return Math.min(Math.max(number, min), max);
}

function clampInteger(value, min, max) {
  return Math.round(clampNumber(value, min, max));
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getDateKey(year, month, day) {
  return `${year}-${month}-${day}`;
}

function getDateFromKey(key) {
  const parts = String(key).split('-').map(value => parseInt(value, 10));
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
  const [year, month, day] = parts;
  const date = new Date(year, month, day);
  return isValidDate(date) ? date : null;
}

function getIsoWeekInfo(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const weekYear = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { week, weekYear, key: `${weekYear}-${week}` };
}

function formatDateLabel(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function formatHours(hours) {
  const normalized = Number.isFinite(hours) ? Math.max(0, hours) : 0;
  return normalized % 1 === 0 ? String(normalized) : normalized.toFixed(1);
}

function formatDuration(minutes) {
  const safeMinutes = Math.max(0, Math.round(minutes || 0));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  if (hours && mins) return `${hours} ч ${mins} мин`;
  if (hours) return `${hours} ч`;
  if (mins) return `${mins} мин`;
  return '0 мин';
}

function getMonthDaysData(year, month) {
  const daysInMonth = getDaysInMonth(year, month);
  const dayOfWeekNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const daysData = [];
  const weekMap = new Map();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const weekInfo = getIsoWeekInfo(date);
    const dowIdx = date.getDay();
    const dayName = dayOfWeekNames[dowIdx === 0 ? 6 : dowIdx - 1];

    if (!weekMap.has(weekInfo.key)) {
      weekMap.set(weekInfo.key, {
        key: weekInfo.key,
        week: weekInfo.week,
        weekYear: weekInfo.weekYear,
        count: 0
      });
    }
    weekMap.get(weekInfo.key).count++;

    daysData.push({
      day,
      date,
      dateKey: getDateKey(year, month, day),
      dayName,
      weekKey: weekInfo.key
    });
  }

  return { daysInMonth, daysData, weeks: Array.from(weekMap.values()) };
}

function openModal(overlay) {
  if (!overlay) return;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
}

function closeModal(overlay) {
  if (!overlay) return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
}

function closeAllModals() {
  [
    dayModalOverlay,
    historyModalOverlay,
    addHabitModalOverlay,
    editHabitModalOverlay,
    deleteHabitModalOverlay,
    dailyHoursModalOverlay
  ].forEach(closeModal);
  resetTransientState();
}

function resetTransientState() {
  resetTimer();
  closeHabitContextMenu();
  currentDayContext = null;
  currentHistoryHabitId = null;
  selectedDeleteId = null;
  editingHabitId = null;
  habitFormMode = 'create';
}

// ===== Timer =====

function updateTimerDisplay(ms) {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  timerDisplay.value =
    String(h).padStart(2, '0') + ':' +
    String(m).padStart(2, '0') + ':' +
    String(s).padStart(2, '0');
}

function setTimerControls(isRunning) {
  timerStartBtn.disabled = isRunning;
  timerPauseBtn.disabled = !isRunning;
}

function startTimer() {
  if (timerInterval) return;
  timerStartTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - timerStartTime + timerAccumulatedMs;
    updateTimerDisplay(elapsed);
  }, 500);
  setTimerControls(true);
}

function pauseTimer() {
  if (!timerInterval) return;
  clearInterval(timerInterval);
  timerInterval = null;
  timerAccumulatedMs += Date.now() - timerStartTime;
  timerStartTime = null;
  setTimerControls(false);
}

function resetTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerStartTime = null;
  timerAccumulatedMs = 0;
  if (timerDisplay) updateTimerDisplay(0);
  if (timerStartBtn && timerPauseBtn) setTimerControls(false);
}

function getTimerMinutes() {
  const elapsedMs = timerAccumulatedMs + (timerInterval ? Date.now() - timerStartTime : 0);
  if (elapsedMs <= 0) return 0;
  return Math.max(1, Math.round(elapsedMs / 60000));
}

// ===== Init year/month =====

function initYearSelect() {
  const currentYear = new Date().getFullYear();
  yearSelect.innerHTML = '';

  for (let y = currentYear - 5; y <= currentYear + 5; y++) {
    const opt = document.createElement('option');
    opt.value = String(y);
    opt.textContent = String(y);
    if (y === currentYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
}

function initMonthSelect() {
  const currentMonth = new Date().getMonth();
  monthSelect.innerHTML = '';

  monthNames.forEach((name, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = name;
    if (idx === currentMonth) opt.selected = true;
    monthSelect.appendChild(opt);
  });
}

function goToToday() {
  const now = new Date();
  yearSelect.value = String(now.getFullYear());
  monthSelect.value = String(now.getMonth());
  renderTable();
}

// ===== Habit lifetime =====

function getHabitInterval(habit) {
  if (!habit.createdAt) return null;

  const start = new Date(habit.createdAt);
  if (!isValidDate(start)) return null;

  const monthsTotal = clampInteger(habit.durationMonths, 0, 120);
  const daysTotal = clampInteger(habit.durationDays, 0, 3660);
  const hoursTotal = clampNumber(habit.durationHours, 0, 24 * 3660);

  if (!monthsTotal && !daysTotal && !hoursTotal) {
    return { start, end: null };
  }

  const end = new Date(start);
  if (monthsTotal) end.setMonth(end.getMonth() + monthsTotal);
  if (daysTotal) end.setDate(end.getDate() + daysTotal);
  if (hoursTotal) end.setHours(end.getHours() + hoursTotal);

  return { start, end };
}

function isHabitActiveOnDate(habit, date) {
  const interval = getHabitInterval(habit);
  if (!interval) return true;

  const dayEnd = new Date(date);
  dayEnd.setDate(dayEnd.getDate() + 1);

  if (dayEnd <= interval.start) return false;
  if (interval.end && date >= interval.end) return false;
  return true;
}

function isHabitActiveInMonth(habit, year, month) {
  const interval = getHabitInterval(habit);
  if (!interval) return true;

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  if (monthEnd <= interval.start) return false;
  if (interval.end && monthStart >= interval.end) return false;
  return true;
}

function getActiveDaysForMonth(habit, daysData) {
  return daysData.filter(({ date }) => isHabitActiveOnDate(habit, date));
}

// ===== Summary & progress =====

function getGoalValue(habit) {
  if (habit.goalType === 'daysPerWeek') return parsePositiveNumber(habit.goalDaysPerWeek, 0);
  if (habit.goalType === 'daysTotal') return parsePositiveNumber(habit.goalDays, 0);
  if (habit.goalType === 'hoursTotal') return parsePositiveNumber(habit.goalHours, 0);
  if (habit.goalType === 'hoursPerDay') return parsePositiveNumber(habit.goalHoursPerDay, 0);
  return 0;
}

function setGoalValue(habit, goalType, value) {
  delete habit.goalDaysPerWeek;
  delete habit.goalDays;
  delete habit.goalHours;
  delete habit.goalHoursPerDay;

  if (goalType === 'daysPerWeek') habit.goalDaysPerWeek = value;
  else if (goalType === 'daysTotal') habit.goalDays = value;
  else if (goalType === 'hoursTotal') habit.goalHours = value;
  else if (goalType === 'hoursPerDay') habit.goalHoursPerDay = value;
}

function getGoalLabel(habit) {
  const goalValue = getGoalValue(habit);
  if (goalValue <= 0) return 'Без цели';

  if (habit.goalType === 'daysPerWeek') return `${formatHours(goalValue)} дн/нед`;
  if (habit.goalType === 'daysTotal') return `${formatHours(goalValue)} дн`;
  if (habit.goalType === 'hoursTotal') return `${formatHours(goalValue)} ч`;
  if (habit.goalType === 'hoursPerDay') return `${formatHours(goalValue)} ч/день`;
  return 'Без цели';
}

function calcHabitSummary(habit, year, month, daysData) {
  const days = habit.days || {};
  const activeDays = getActiveDaysForMonth(habit, daysData);
  const activeDayKeys = new Set(activeDays.map(day => day.dateKey));

  let totalMinutes = 0;
  let doneDaysCount = 0;

  daysData.forEach(({ dateKey }) => {
    const entry = days[dateKey];
    if (!entry) return;

    const minutes = Math.max(0, Math.round(parsePositiveNumber(entry.minutes, 0)));
    if (minutes > 0) {
      doneDaysCount++;
      totalMinutes += minutes;
    }
  });

  const totalHours = totalMinutes / 60;
  const goalValue = getGoalValue(habit);
  let target = 0;
  let progressBase = doneDaysCount;
  let remainingText = '-';

  if (habit.goalType === 'daysPerWeek' && goalValue > 0) {
    const activeWeeks = new Set(activeDays.map(day => day.weekKey)).size || 1;
    target = Math.min(activeDayKeys.size || daysData.length, goalValue * activeWeeks);
    remainingText = `${formatHours(Math.max(target - doneDaysCount, 0))} дн`;
  } else if (habit.goalType === 'daysTotal' && goalValue > 0) {
    target = goalValue;
    remainingText = `${formatHours(Math.max(target - doneDaysCount, 0))} дн`;
  } else if (habit.goalType === 'hoursTotal' && goalValue > 0) {
    target = goalValue;
    progressBase = totalHours;
    remainingText = `${formatHours(Math.max(target - totalHours, 0))} ч`;
  } else if (habit.goalType === 'hoursPerDay' && goalValue > 0) {
    target = goalValue * (activeDayKeys.size || daysData.length);
    progressBase = totalHours;
    remainingText = `${formatHours(Math.max(target - totalHours, 0))} ч`;
  }

  const percent = target > 0 ? Math.min(999, (progressBase / target) * 100) : 0;

  return {
    doneDaysCount,
    totalMinutes,
    totalHours,
    target,
    remainingText,
    goalText: getGoalLabel(habit),
    percent
  };
}

function buildGoalSummaryForModal(habit, dateObj) {
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const { daysData } = getMonthDaysData(year, month);
  const summary = calcHabitSummary(habit, year, month, daysData);
  const goalValue = getGoalValue(habit);

  if (goalValue <= 0) {
    return {
      labelText: 'Цель:',
      valueText: 'Цель не задана'
    };
  }

  if (habit.goalType === 'hoursPerDay') {
    const keyToday = getDateKey(year, month, dateObj.getDate());
    const entryToday = habit.days?.[keyToday];
    const minutesToday = entryToday ? parsePositiveNumber(entryToday.minutes, 0) : 0;
    const remainingToday = Math.max(goalValue - minutesToday / 60, 0);

    return {
      labelText: 'Цель на день:',
      valueText: `${formatHours(goalValue)} ч/день, осталось сегодня ${formatHours(remainingToday)} ч`
    };
  }

  return {
    labelText: 'Цель на месяц:',
    valueText: `${summary.goalText}, осталось ${summary.remainingText}`
  };
}

// ===== Day modal open/save =====

function openDayModalForDate(habit, year, month, day, dateObj) {
  const key = getDateKey(year, month, day);
  currentDayContext = { habitId: habit.id, dateKey: key, dateObj };

  dayHabitName.value = habit.name || 'Без названия';
  dayDate.value = formatDateLabel(dateObj);

  const existing = habit.days?.[key];
  const usedMinutes = existing ? Math.max(0, Math.round(parsePositiveNumber(existing.minutes, 0))) : 0;

  timeHours.value = usedMinutes ? String(Math.floor(usedMinutes / 60)) : '';
  timeMinutes.value = usedMinutes ? String(usedMinutes % 60) : '';
  dayComment.value = existing?.comment || '';

  resetTimer();
  daySummary.value = usedMinutes
    ? `Проведено: ${formatDuration(usedMinutes)}`
    : 'Активности по этой привычке пока нет';

  const goalInfo = buildGoalSummaryForModal(habit, dateObj);
  remainingLabel.textContent = goalInfo.labelText;
  remainingHours.value = goalInfo.valueText;

  currentHistoryHabitId = habit.id;
  openModal(dayModalOverlay);
}

function persistDayFromModal() {
  if (!currentDayContext) return;
  const habit = habits.find(h => h.id === currentDayContext.habitId);
  if (!habit) return;

  const hours = clampNumber(timeHours.value, 0, 999);
  const minutes = clampInteger(timeMinutes.value, 0, 59);
  const manualMinutes = Math.round(hours * 60 + minutes);
  const timerMinutes = getTimerMinutes();
  const totalMinutes = Math.max(0, manualMinutes + timerMinutes);

  if (!habit.days) habit.days = {};

  const key = currentDayContext.dateKey;
  if (totalMinutes > 0) {
    habit.days[key] = {
      minutes: totalMinutes,
      comment: dayComment.value.trim(),
      date: formatDateLabel(currentDayContext.dateObj),
      dateKey: key
    };
  } else {
    delete habit.days[key];
  }

  resetTimer();
  saveState();
  renderTable();
}

function closeDayModal() {
  resetTimer();
  closeModal(dayModalOverlay);
  currentDayContext = null;
  currentHistoryHabitId = null;
}

function resetCurrentDay() {
  if (!currentDayContext) return;

  const habit = habits.find(h => h.id === currentDayContext.habitId);
  if (!habit) return;

  if (!habit.days) habit.days = {};
  delete habit.days[currentDayContext.dateKey];

  timeHours.value = '';
  timeMinutes.value = '';
  dayComment.value = '';
  daySummary.value = 'Активности по этой привычке пока нет';

  resetTimer();
  saveState();
  renderTable();
  closeDayModal();
}

// ===== Render table =====

function renderStats(activeHabits, daysData, year, month) {
  if (!statsBar) return;

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayKey = getDateKey(year, month, today.getDate());
  const completedToday = isCurrentMonth
    ? activeHabits.filter(habit => parsePositiveNumber(habit.days?.[todayKey]?.minutes, 0) > 0).length
    : 0;

  const progressValues = activeHabits
    .map(habit => calcHabitSummary(habit, year, month, daysData).percent)
    .filter(percent => percent > 0);
  const averageProgress = progressValues.length
    ? Math.round(progressValues.reduce((sum, value) => sum + Math.min(value, 100), 0) / progressValues.length)
    : 0;
  const monthHours = activeHabits.reduce((sum, habit) => {
    return sum + calcHabitSummary(habit, year, month, daysData).totalHours;
  }, 0);

  const stats = [
    ['Активных привычек', activeHabits.length],
    ['Отмечено сегодня', isCurrentMonth ? completedToday : '-'],
    ['Часов за месяц', formatHours(monthHours)],
    ['Средний прогресс', `${averageProgress}%`]
  ];

  statsBar.replaceChildren(
    ...stats.map(([label, value]) => {
      const item = document.createElement('div');
      item.className = 'stat-item';

      const valueEl = document.createElement('strong');
      valueEl.textContent = String(value);

      const labelEl = document.createElement('span');
      labelEl.textContent = label;

      item.append(valueEl, labelEl);
      return item;
    })
  );
}

function renderTable() {
  const year = parseInt(yearSelect.value, 10);
  const month = parseInt(monthSelect.value, 10);
  const { daysData, weeks } = getMonthDaysData(year, month);
  const today = new Date();
  const todayKey = getDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const activeHabits = habits.filter(habit => isHabitActiveInMonth(habit, year, month));

  renderStats(activeHabits, daysData, year, month);

  tableHead.innerHTML = '';
  const weekRow = document.createElement('tr');

  const leftServiceCells = [
    { text: 'Привычка', className: 'left' },
    { text: 'Цель' }
  ];

  leftServiceCells.forEach(cfg => {
    const th = document.createElement('th');
    th.textContent = cfg.text;
    if (cfg.className) th.className = cfg.className;
    th.rowSpan = 2;
    weekRow.appendChild(th);
  });

  weeks.forEach(week => {
    const th = document.createElement('th');
    th.textContent = `Неделя ${week.week}`;
    th.className = 'week-header';
    th.colSpan = week.count;
    weekRow.appendChild(th);
  });

  const rightServiceCells = [
    { text: 'Сделано' },
    { text: 'Осталось' },
    { text: 'Часы' },
    { text: 'Прогресс' },
    { text: '%' }
  ];

  rightServiceCells.forEach(cfg => {
    const th = document.createElement('th');
    th.textContent = cfg.text;
    th.rowSpan = 2;
    weekRow.appendChild(th);
  });

  tableHead.appendChild(weekRow);

  const daysRow = document.createElement('tr');
  daysData.forEach(({ day, dayName, dateKey }) => {
    const th = document.createElement('th');
    th.className = dateKey === todayKey ? 'is-today' : '';

    const dayNumber = document.createElement('span');
    dayNumber.textContent = String(day);
    const weekday = document.createElement('span');
    weekday.className = 'weekday-label';
    weekday.textContent = dayName;

    th.append(dayNumber, weekday);
    daysRow.appendChild(th);
  });
  tableHead.appendChild(daysRow);

  tableBody.innerHTML = '';

  if (!activeHabits.length) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.className = 'empty-state-cell';
    emptyCell.colSpan = leftServiceCells.length + daysData.length + rightServiceCells.length;
    emptyCell.textContent = habits.length
      ? 'В этом месяце нет активных привычек. Выберите другой месяц или добавьте новую привычку.'
      : 'Пока нет привычек. Нажмите «Действия» → «Добавить привычку».';
    emptyRow.appendChild(emptyCell);
    tableBody.appendChild(emptyRow);
    return;
  }

  activeHabits.forEach(habit => {
    const row = document.createElement('tr');
    const summary = calcHabitSummary(habit, year, month, daysData);

    const nameTd = document.createElement('td');
    nameTd.className = 'left sticky-col';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'habit-name';
    nameSpan.textContent = habit.name || 'Без названия';
    nameSpan.title = 'Двойной клик для быстрого переименования';

    const menuBtn = document.createElement('button');
    menuBtn.type = 'button';
    menuBtn.className = 'habit-menu-btn';
    menuBtn.textContent = '⋯';
    menuBtn.setAttribute('aria-label', `Меню привычки ${habit.name || 'Без названия'}`);

    const wrapper = document.createElement('div');
    wrapper.className = 'habit-name-wrapper';
    wrapper.append(nameSpan, menuBtn);
    nameTd.appendChild(wrapper);
    row.appendChild(nameTd);

    nameSpan.addEventListener('dblclick', () => openRenameHabitModal(habit));
    menuBtn.addEventListener('click', e => {
      e.stopPropagation();
      openHabitContextMenu(e.currentTarget, habit);
    });

    const goalTd = document.createElement('td');
    goalTd.textContent = summary.goalText;
    row.appendChild(goalTd);

    daysData.forEach(({ day, date, dateKey }) => {
      const entry = habit.days?.[dateKey];
      const minutes = entry ? Math.round(parsePositiveNumber(entry.minutes, 0)) : 0;
      const isActiveDay = isHabitActiveOnDate(habit, date);

      const td = document.createElement('td');
      td.className = 'day-checkbox-cell';
      if (dateKey === todayKey) td.classList.add('is-today');
      if (!isActiveDay) td.classList.add('is-inactive-day');

      const button = document.createElement('button');
      button.type = 'button';
      button.className = minutes > 0 ? 'day-toggle is-done' : 'day-toggle';
      button.dataset.habitId = habit.id;
      button.dataset.dateKey = dateKey;
      button.disabled = !isActiveDay;
      button.textContent = minutes > 0 ? '✓' : '';
      button.title = minutes > 0
        ? `${formatDateLabel(date)}: ${formatDuration(minutes)}`
        : `${formatDateLabel(date)}: добавить время`;
      button.setAttribute('aria-label', `${habit.name}, ${day} ${monthNames[month]}: ${minutes > 0 ? 'отмечено' : 'не отмечено'}`);

      button.addEventListener('click', () => {
        if (!isActiveDay) return;
        openDayModalForDate(habit, year, month, day, date);
      });

      td.appendChild(button);
      row.appendChild(td);
    });

    const doneTd = document.createElement('td');
    doneTd.textContent = String(summary.doneDaysCount);
    row.appendChild(doneTd);

    const remainingTd = document.createElement('td');
    remainingTd.textContent = summary.remainingText;
    row.appendChild(remainingTd);

    const hoursTd = document.createElement('td');
    hoursTd.textContent = formatHours(summary.totalHours);
    row.appendChild(hoursTd);

    const progressTd = document.createElement('td');
    progressTd.className = 'progress-cell';

    const progressBg = document.createElement('div');
    progressBg.className = 'progress-bar-bg';
    progressBg.setAttribute('aria-label', `Прогресс ${Math.round(summary.percent)}%`);

    const progressFill = document.createElement('div');
    progressFill.className = summary.percent >= 100
      ? 'progress-bar-fill-days is-complete'
      : 'progress-bar-fill-days';
    progressFill.style.width = `${Math.min(100, summary.percent)}%`;

    progressBg.appendChild(progressFill);
    progressTd.appendChild(progressBg);
    row.appendChild(progressTd);

    const percentTd = document.createElement('td');
    percentTd.className = 'percent-cell';
    percentTd.textContent = `${Math.round(summary.percent)}%`;
    row.appendChild(percentTd);

    tableBody.appendChild(row);
  });
}

// ===== Habit menus/forms =====

function closeHabitContextMenu() {
  if (openHabitMenuEl && openHabitMenuEl.parentNode) {
    openHabitMenuEl.parentNode.removeChild(openHabitMenuEl);
  }
  openHabitMenuEl = null;
}

function createContextMenuItem(icon, text, onClick) {
  const item = document.createElement('button');
  item.type = 'button';
  item.className = 'habit-context-item';

  const iconEl = document.createElement('span');
  iconEl.className = 'habit-context-item-icon';
  iconEl.textContent = icon;

  const textEl = document.createElement('span');
  textEl.textContent = text;

  item.append(iconEl, textEl);
  item.addEventListener('click', onClick);
  return item;
}

function openHabitContextMenu(buttonEl, habit) {
  closeHabitContextMenu();

  const menu = document.createElement('div');
  menu.className = 'habit-context-menu';

  const rect = buttonEl.getBoundingClientRect();
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  menu.style.top = `${rect.bottom + scrollY + 4}px`;
  menu.style.left = `${rect.left + scrollX}px`;

  menu.append(
    createContextMenuItem('✎', 'Переименовать', () => {
      openRenameHabitModal(habit);
      closeHabitContextMenu();
    }),
    createContextMenuItem('⚙', 'Настроить', () => {
      openHabitForm('edit', habit);
      closeHabitContextMenu();
    }),
    createContextMenuItem('×', 'Удалить', () => {
      deleteHabitById(habit.id);
      closeHabitContextMenu();
    })
  );

  document.body.appendChild(menu);
  openHabitMenuEl = menu;
}

function openRenameHabitModal(habit) {
  editingHabitId = habit.id;
  editHabitNameInput.value = habit.name || '';
  openModal(editHabitModalOverlay);
  editHabitNameInput.focus();
}

function openHabitForm(mode, habit = null) {
  habitFormMode = mode;
  editingHabitId = mode === 'edit' && habit ? habit.id : null;

  habitFormTitle.textContent = mode === 'edit' ? 'Настроить привычку' : 'Добавить привычку';
  createHabitBtn.textContent = mode === 'edit' ? 'Сохранить' : 'Создать';

  habitNameInput.value = habit?.name || '';
  durationMonths.value = String(habit?.durationMonths ?? 0);
  durationDays.value = String(habit?.durationDays ?? 0);
  durationHours.value = String(habit?.durationHours ?? 0);
  goalTypeSelect.value = habit?.goalType || 'daysPerWeek';
  goalValueInput.value = habit ? String(getGoalValue(habit) || '') : '3';
  habitCommentInput.value = habit?.comment || '';

  updateGoalInputHints();
  openModal(addHabitModalOverlay);
  habitNameInput.focus();
}

function closeHabitForm() {
  closeModal(addHabitModalOverlay);
  editingHabitId = null;
  habitFormMode = 'create';
}

function updateGoalInputHints() {
  updateGoalInputHintsFor(goalTypeSelect, goalValueInput);
}

function updateQuickGoalInputHints() {
  updateGoalInputHintsFor(quickGoalTypeSelect, quickGoalValueInput);
}

function updateGoalInputHintsFor(typeSelect, valueInput) {
  const type = typeSelect.value;
  valueInput.max = '';
  valueInput.step = type === 'daysPerWeek' || type === 'daysTotal' ? '1' : '0.25';

  if (type === 'daysPerWeek') {
    valueInput.placeholder = 'например, 3';
    valueInput.max = '7';
  } else if (type === 'daysTotal') {
    valueInput.placeholder = 'например, 20';
  } else if (type === 'hoursTotal') {
    valueInput.placeholder = 'например, 40';
  } else if (type === 'hoursPerDay') {
    valueInput.placeholder = `например, ${formatHours(dailyHours)}`;
    if (!valueInput.value) valueInput.value = String(dailyHours);
  }
}

function getValidatedGoalValue(goalType, rawValue, focusInput) {
  let goalValue = parsePositiveNumber(rawValue, 0);
  if (goalType === 'daysPerWeek') goalValue = clampInteger(goalValue, 1, 7);
  if (goalType === 'daysTotal') goalValue = clampInteger(goalValue, 1, 3660);

  if (goalValue <= 0) {
    alert('Введите значение цели больше 0');
    focusInput.focus();
    return null;
  }

  return goalValue;
}

function readHabitForm() {
  const name = habitNameInput.value.trim();
  if (!name) {
    alert('Введите название привычки');
    habitNameInput.focus();
    return null;
  }

  const goalType = goalTypeSelect.value;
  const goalValue = getValidatedGoalValue(goalType, goalValueInput.value, goalValueInput);
  if (goalValue === null) return null;

  return {
    name,
    goalType,
    goalValue,
    durationMonths: clampInteger(durationMonths.value, 0, 120),
    durationDays: clampInteger(durationDays.value, 0, 3660),
    durationHours: clampNumber(durationHours.value, 0, 24 * 3660),
    comment: habitCommentInput.value.trim()
  };
}

function readQuickHabitForm() {
  const name = quickHabitNameInput.value.trim();
  if (!name) {
    alert('Введите название привычки');
    quickHabitNameInput.focus();
    return null;
  }

  const goalType = quickGoalTypeSelect.value;
  const goalValue = getValidatedGoalValue(goalType, quickGoalValueInput.value, quickGoalValueInput);
  if (goalValue === null) return null;

  return {
    name,
    goalType,
    goalValue,
    durationMonths: 0,
    durationDays: 0,
    durationHours: 0,
    comment: ''
  };
}

function persistHabitFormData(form, habit = null) {
  const isNewHabit = !habit;
  const targetHabit = habit || {
    id: createId(habits.length),
    createdAt: new Date().toISOString(),
    days: {}
  };

  targetHabit.name = form.name;
  targetHabit.createdAt = targetHabit.createdAt || new Date().toISOString();
  targetHabit.durationMonths = form.durationMonths;
  targetHabit.durationDays = form.durationDays;
  targetHabit.durationHours = form.durationHours;
  targetHabit.goalType = form.goalType;
  targetHabit.comment = form.comment;
  if (!targetHabit.days) targetHabit.days = {};
  setGoalValue(targetHabit, form.goalType, form.goalValue);

  if (isNewHabit) habits.push(targetHabit);

  saveState();
  renderTable();
  return targetHabit;
}

function saveHabitForm() {
  const form = readHabitForm();
  if (!form) return;

  const habit = habitFormMode === 'edit' && editingHabitId
    ? habits.find(item => item.id === editingHabitId)
    : null;

  if (habitFormMode === 'edit' && !habit) return;

  persistHabitFormData(form, habit);
  closeHabitForm();
}

function saveQuickHabitForm() {
  const form = readQuickHabitForm();
  if (!form) return;

  persistHabitFormData(form);
  quickHabitNameInput.value = '';
  quickGoalTypeSelect.value = 'daysPerWeek';
  quickGoalValueInput.value = '3';
  updateQuickGoalInputHints();
  quickHabitNameInput.focus();
}

function deleteHabitById(habitId, options = {}) {
  const habit = habits.find(item => item.id === habitId);
  if (!habit) return;

  const shouldConfirm = options.confirmDelete !== false;
  if (shouldConfirm && !confirm(`Удалить привычку "${habit.name || 'Без названия'}"?`)) return;

  habits = habits.filter(item => item.id !== habitId);
  saveState();
  renderTable();
  closeModal(editHabitModalOverlay);
  closeModal(deleteHabitModalOverlay);
  selectedDeleteId = null;
  editingHabitId = null;
}

// ===== History =====

function renderEmptyHistory() {
  historyContent.replaceChildren();
  const empty = document.createElement('p');
  empty.className = 'empty-history';
  empty.textContent = 'История пуста';
  historyContent.appendChild(empty);
}

function openHistoryModal() {
  if (!currentHistoryHabitId) return;

  const habit = habits.find(h => h.id === currentHistoryHabitId);
  if (!habit || !habit.days || !Object.keys(habit.days).length) {
    renderEmptyHistory();
    openModal(historyModalOverlay);
    return;
  }

  const entries = Object.entries(habit.days)
    .map(([dateKey, entry]) => ({ dateKey, ...entry }))
    .filter(entry => parsePositiveNumber(entry.minutes, 0) > 0)
    .sort((a, b) => {
      const aDate = getDateFromKey(a.dateKey);
      const bDate = getDateFromKey(b.dateKey);
      return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
    });

  if (!entries.length) {
    renderEmptyHistory();
    openModal(historyModalOverlay);
    return;
  }

  const table = document.createElement('table');
  table.className = 'history-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['Дата', 'Время', 'Комментарий'].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  const tbody = document.createElement('tbody');
  entries.forEach(entry => {
    const tr = document.createElement('tr');
    const dateCell = document.createElement('td');
    const minutesCell = document.createElement('td');
    const commentCell = document.createElement('td');

    const dateObj = getDateFromKey(entry.dateKey);
    dateCell.textContent = entry.date || (dateObj ? formatDateLabel(dateObj) : '');
    minutesCell.textContent = formatDuration(entry.minutes);
    commentCell.textContent = entry.comment || '-';

    tr.append(dateCell, minutesCell, commentCell);
    tbody.appendChild(tr);
  });

  table.append(thead, tbody);
  historyContent.replaceChildren(table);
  openModal(historyModalOverlay);
}

// ===== Delete search =====

function setDeleteInfo(kind, text) {
  deleteHabitInfo.replaceChildren();
  if (!text) return;

  const info = document.createElement('div');
  info.className = `delete-info delete-info--${kind}`;
  info.textContent = text;
  deleteHabitInfo.appendChild(info);
}

function updateDeleteSearch() {
  const query = deleteHabitSearchInput.value.trim().toLowerCase();
  selectedDeleteId = null;

  if (!query) {
    setDeleteInfo('muted', 'Введите название привычки для поиска.');
    return;
  }

  const matches = habits.filter(habit => {
    return String(habit.name || '').toLowerCase().includes(query);
  });

  if (matches.length === 0) {
    setDeleteInfo('warning', 'Привычка не найдена.');
  } else if (matches.length === 1) {
    selectedDeleteId = matches[0].id;
    setDeleteInfo('success', `Найдена привычка: ${matches[0].name}`);
  } else {
    setDeleteInfo('warning', `Найдено несколько привычек: ${matches.map(habit => habit.name).join(', ')}. Уточните поиск.`);
  }
}

// ===== Events =====

timerStartBtn.addEventListener('click', startTimer);
timerPauseBtn.addEventListener('click', pauseTimer);
timerResetBtn.addEventListener('click', resetTimer);

actionBtn.addEventListener('click', () => {
  actionMenu.classList.toggle('hidden');
});

closeMenuBtn?.addEventListener('click', () => {
  actionMenu.classList.add('hidden');
});

[addHabitBtn, deleteHabitBtn, dailyHoursBtn].forEach(btn => {
  btn.addEventListener('click', () => {
    actionMenu.classList.add('hidden');
  });
});

document.addEventListener('click', e => {
  if (!e.target.closest('.actions-wrapper') && e.target !== actionBtn) {
    actionMenu.classList.add('hidden');
  }

  if (
    openHabitMenuEl &&
    !e.target.closest('.habit-context-menu') &&
    !e.target.closest('.habit-menu-btn')
  ) {
    closeHabitContextMenu();
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeAllModals();
    actionMenu.classList.add('hidden');
  }
});

yearSelect.addEventListener('change', renderTable);
monthSelect.addEventListener('change', renderTable);
todayBtn?.addEventListener('click', goToToday);

closeModalBtn.addEventListener('click', closeDayModal);
resetDayBtn.addEventListener('click', resetCurrentDay);
saveDayBtn.addEventListener('click', () => {
  persistDayFromModal();
  closeDayModal();
});

openHistoryBtn.addEventListener('click', openHistoryModal);
closeHistoryBtn.addEventListener('click', () => closeModal(historyModalOverlay));

addHabitBtn.addEventListener('click', () => openHabitForm('create'));
[closeAddHabitBtn, cancelAddHabitBtn].forEach(btn => {
  btn.addEventListener('click', closeHabitForm);
});
createHabitBtn.addEventListener('click', saveHabitForm);
goalTypeSelect.addEventListener('change', updateGoalInputHints);
quickAddForm?.addEventListener('submit', e => {
  e.preventDefault();
  saveQuickHabitForm();
});
quickGoalTypeSelect?.addEventListener('change', updateQuickGoalInputHints);

saveHabitEditBtn.addEventListener('click', () => {
  if (editingHabitId === null) return;

  const habit = habits.find(h => h.id === editingHabitId);
  if (!habit) return;

  const newName = editHabitNameInput.value.trim();
  if (!newName) {
    alert('Введите название привычки');
    editHabitNameInput.focus();
    return;
  }

  habit.name = newName;
  saveState();
  renderTable();
  closeModal(editHabitModalOverlay);
  editingHabitId = null;
});

deleteHabitFromEditBtn.addEventListener('click', () => {
  if (editingHabitId === null) return;
  deleteHabitById(editingHabitId);
});

[closeEditHabitBtn, cancelEditHabitBtn].forEach(btn => {
  btn.addEventListener('click', () => {
    closeModal(editHabitModalOverlay);
    editingHabitId = null;
  });
});

deleteHabitBtn.addEventListener('click', () => {
  deleteHabitSearchInput.value = '';
  selectedDeleteId = null;
  setDeleteInfo('muted', 'Введите название привычки для поиска.');
  openModal(deleteHabitModalOverlay);
  deleteHabitSearchInput.focus();
});

deleteHabitSearchInput.addEventListener('input', updateDeleteSearch);
confirmDeleteHabitBtn.addEventListener('click', () => {
  if (!selectedDeleteId) {
    alert('Пожалуйста, сначала найдите одну привычку');
    deleteHabitSearchInput.focus();
    return;
  }

  deleteHabitById(selectedDeleteId, { confirmDelete: false });
});

[closeDeleteHabitBtn, cancelDeleteHabitBtn].forEach(btn => {
  btn.addEventListener('click', () => {
    closeModal(deleteHabitModalOverlay);
    selectedDeleteId = null;
  });
});

dailyHoursBtn.addEventListener('click', () => {
  dailyHoursInput.value = String(dailyHours);
  openModal(dailyHoursModalOverlay);
  dailyHoursInput.focus();
});

[closeDailyHoursBtn, cancelDailyHoursBtn].forEach(btn => {
  btn.addEventListener('click', () => closeModal(dailyHoursModalOverlay));
});

saveDailyHoursBtn.addEventListener('click', () => {
  dailyHours = clampNumber(dailyHoursInput.value, 0, 24);
  saveState();
  updateGoalInputHints();
  updateQuickGoalInputHints();
  closeModal(dailyHoursModalOverlay);
});

[
  dayModalOverlay,
  historyModalOverlay,
  addHabitModalOverlay,
  editHabitModalOverlay,
  deleteHabitModalOverlay,
  dailyHoursModalOverlay
].forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) closeAllModals();
  });
});

// ===== Init =====

initYearSelect();
initMonthSelect();
updateQuickGoalInputHints();
habits = habits.map(normalizeHabit).filter(Boolean);
saveState();
renderTable();
