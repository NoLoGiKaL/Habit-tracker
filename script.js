// ===== DOM =====

const yearSelect = document.getElementById('yearSelect');
const monthSelect = document.getElementById('monthSelect');
const tableHead = document.getElementById('tableHead');
const tableBody = document.getElementById('tableBody');
const actionBtn = document.getElementById('actionBtn');
const actionMenu = document.getElementById('actionMenu');
const closeMenuBtn = document.getElementById('closeMenuBtn');

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

// Add habit modal
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

// Edit habit modal
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
const saveDailyHoursBtn = document.getElementById('saveDailyHoursBtn');// ===== State =====

let habits = JSON.parse(localStorage.getItem('habits') || '[]');
let dailyHours = parseFloat(localStorage.getItem('dailyHours') || '8');

const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

let currentDayContext = null; // { habitId, dateKey, dateObj }
let currentHistoryHabitId = null;
let selectedDeleteIndex = null;
let editingHabitId = null;

// Timer
let timerInterval = null;
let timerStartTime = null;
let timerAccumulatedMs = 0;

// ===== Utils =====

function saveState() {
  localStorage.setItem('habits', JSON.stringify(habits));
  localStorage.setItem('dailyHours', String(dailyHours));
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function formatDateLabel(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
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
  currentDayContext = null;
  currentHistoryHabitId = null;
  selectedDeleteIndex = null;
  editingHabitId = null;
}

// ===== Timer =====

function updateTimerDisplay(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  timerDisplay.value =
    String(h).padStart(2, '0') + ':' +
    String(m).padStart(2, '0') + ':' +
    String(s).padStart(2, '0');
}

function startTimer() {
  if (timerInterval) return;
  timerStartTime = Date.now();
  timerInterval = setInterval(() => {
    const now = Date.now();
    const elapsed = now - timerStartTime + timerAccumulatedMs;
    updateTimerDisplay(elapsed);
  }, 500);
}

function pauseTimer() {
  if (!timerInterval) return;
  clearInterval(timerInterval);
  timerInterval = null;
  const now = Date.now();
  timerAccumulatedMs += now - timerStartTime;
  timerStartTime = null;
}
deleteHabitFromEditBtn.addEventListener('click', () => {
  if (editingHabitId === null) return;

  const habitIndex = habits.findIndex(h => h.id === editingHabitId);
  if (habitIndex === -1) return;

  const habitName = habits[habitIndex].name || 'Без названия';
  if (!confirm(`Удалить привычку "${habitName}"?`)) return;

  habits.splice(habitIndex, 1);
  saveState();
  renderTable();
  closeModal(editHabitModalOverlay);
  editingHabitId = null;
});
function resetTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerStartTime = null;
  timerAccumulatedMs = 0;
  if (timerDisplay) updateTimerDisplay(0);
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

// ===== Summary & progress =====

function calcHabitSummary(habit, year, month, daysInMonth) {
  const days = habit.days || {};
  let totalHours = 0;
  let doneDaysCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${month}-${d}`;
    const entry = days[key];
    if (!entry) continue;

    const minutes = typeof entry.minutes === 'number'
      ? entry.minutes
      : parseInt(entry.minutes || '0', 10);

    if (minutes > 0) {
      doneDaysCount++;
      totalHours += minutes / 60;
    }
  }

  const doneSummary = `${doneDaysCount}`;
  const remainingSummary =
    typeof habit.goalDays === 'number'
      ? Math.max(habit.goalDays - doneDaysCount, 0)
      : '-';

  return { doneSummary, remainingSummary, totalHours };
}

function calcProgressPercent(habit, year, month, daysInMonth) {
  const { doneSummary, totalHours } = calcHabitSummary(habit, year, month, daysInMonth);
  const doneDays = parseInt(doneSummary, 10) || 0;
  
  let daysPercent = 0;
  let timePercent = 0;
  
  const goalType = habit.goalType;
  
  if (goalType === 'daysPerWeek' && habit.goalDaysPerWeek > 0) {
    const weeksInMonth = daysInMonth / 7;
    const targetDaysMonth = habit.goalDaysPerWeek * weeksInMonth;
    daysPercent = (doneDays / targetDaysMonth) * 100;
  } else if (goalType === 'daysTotal' && habit.goalDays > 0) {
    daysPercent = (doneDays / habit.goalDays) * 100;
  } else if (goalType === 'hoursTotal' && habit.goalHours > 0) {
    timePercent = (totalHours / habit.goalHours) * 100;
    daysPercent = timePercent;
  } else if (goalType === 'hoursPerDay' && habit.goalHoursPerDay > 0) {
    // Используем durationDays вместо daysInMonth!
    const activeDays = habit.durationDays || daysInMonth;
    const targetHoursTotal = habit.goalHoursPerDay * activeDays;
    timePercent = (totalHours / targetHoursTotal) * 100;
    daysPercent = timePercent;
  } else {
    // Fallback для старых записей
    if (typeof habit.goalDays === 'number' && habit.goalDays > 0) {
      daysPercent = (doneDays / habit.goalDays) * 100;
    }
    if (typeof habit.goalHours === 'number' && habit.goalHours > 0) {
      timePercent = (totalHours / habit.goalHours) * 100;
    }
  }
  
  return { daysPercent, timePercent };
}



// ===== Goal summary for modal =====

function buildGoalSummaryForModal(habit, dateObj) {
  const days = habit.days || {};
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const daysInMonth = getDaysInMonth(year, month);

  let usedDaysCount = 0;
  let usedHoursTotal = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${month}-${d}`;
    const entry = days[key];
    if (!entry) continue;

    const minutes = typeof entry.minutes === 'number'
      ? entry.minutes
      : parseInt(entry.minutes || '0', 10);

    if (minutes > 0) {
      usedDaysCount++;
      usedHoursTotal += minutes / 60;
    }
  }

  const goalType = habit.goalType;
  const goalDays = habit.goalDays || 0;
  const goalHours = habit.goalHours || 0;
  const goalDaysPerWeek = habit.goalDaysPerWeek || 0;
  const goalHoursPerDay = habit.goalHoursPerDay || 0;

  let labelText = 'Цель по времени:';
  let valueText = '';

  if (goalType === 'daysPerWeek' && goalDaysPerWeek > 0) {
    const weeksApprox = daysInMonth / 7;
    const targetDaysMonth = goalDaysPerWeek * weeksApprox;
    const remainingDays = Math.max(targetDaysMonth - usedDaysCount, 0);
    labelText = 'Цель по дням в неделю:';
    valueText = `${goalDaysPerWeek} дн/нед (≈ ${targetDaysMonth.toFixed(1)} дн в месяц) / ещё осталось ≈ ${remainingDays.toFixed(1)} дн`;
  } else if (goalType === 'daysTotal' && goalDays > 0) {
    const remainingDays = Math.max(goalDays - usedDaysCount, 0);
    labelText = 'Цель по дням:';
    valueText = `${goalDays} дн / ещё осталось ${remainingDays} дн`;
  } else if (goalType === 'hoursTotal' && goalHours > 0) {
    const remainingHoursVal = Math.max(goalHours - usedHoursTotal, 0);
    labelText = 'Цель по времени:';
    valueText = `${goalHours} ч / ещё осталось ${remainingHoursVal.toFixed(1)} ч`;
  } else if (goalType === 'hoursPerDay' && goalHoursPerDay > 0) {
    const keyToday = `${year}-${month}-${dateObj.getDate()}`;
    const entryToday = days[keyToday];
    const minutesToday = entryToday
      ? typeof entryToday.minutes === 'number'
        ? entryToday.minutes
        : parseInt(entryToday.minutes || '0', 10)
      : 0;
    const hoursToday = minutesToday / 60;
    const remainingToday = Math.max(goalHoursPerDay - hoursToday, 0);
    labelText = 'Цель по времени в день:';
    valueText = `${goalHoursPerDay} ч/день / ещё осталось ${remainingToday.toFixed(1)} ч сегодня`;
  } else if (goalHours > 0) {
    const remainingHoursVal = Math.max(goalHours - usedHoursTotal, 0);
    labelText = 'Цель по времени:';
    valueText = `${goalHours} ч / ещё осталось ${remainingHoursVal.toFixed(1)} ч`;
  } else {
    labelText = 'Цель по времени не задана';
    valueText = '';
  }

  return { labelText, valueText };
}

// ===== Habit lifetime =====

function isHabitActiveInMonth(habit, year, month) {
  if (!habit.createdAt) return true;

  const start = new Date(habit.createdAt);
  const end = new Date(start);

  const monthsTotal = parseInt(habit.durationMonths || 0, 10);
  const daysTotal = parseInt(habit.durationDays || 0, 10);

  if (monthsTotal) {
    end.setMonth(end.getMonth() + monthsTotal);
  }
  if (daysTotal) {
    end.setDate(end.getDate() + daysTotal);
  }

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  return end > monthStart && start < monthEnd;
}

// ===== Day modal open/save =====

function openDayModalForDate(habit, year, month, day, dateObj) {
  const key = `${year}-${month}-${day}`;
  currentDayContext = { habitId: habit.id, dateKey: key, dateObj };

  dayHabitName.value = habit.name || 'Без названия';
  dayDate.value = formatDateLabel(dateObj);

  const days = habit.days || {};
  const existing = days[key];
  const usedMinutes = existing ? existing.minutes || 0 : 0;
  const hours = Math.floor(usedMinutes / 60);
  const minutes = usedMinutes % 60;

  timeHours.value = hours ? String(hours) : '';
  timeMinutes.value = minutes ? String(minutes) : '';
  dayComment.value = existing && existing.comment ? existing.comment : '';

  resetTimer();

  if (usedMinutes) {
    daySummary.value = `Проведено времени: ${hours} ч ${minutes} мин`;
  } else {
    daySummary.value = 'Ещё не было активности по этой привычке';
  }

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

  const hours = parseFloat(timeHours.value || '0');
  const minutes = parseFloat(timeMinutes.value || '0');

  let timerMinutes = 0;
  if (timerAccumulatedMs > 0 || timerInterval) {
    const now = Date.now();
    const totalMs = timerAccumulatedMs + (timerInterval ? now - timerStartTime : 0);
    timerMinutes = totalMs / 1000 / 60;
  }

  const totalMinutes = timerMinutes > 0
    ? timerMinutes
    : Math.max(hours * 60 + minutes, 0);

  if (!habit.days) habit.days = {};

  const key = currentDayContext.dateKey;

  if (totalMinutes > 0) {
    habit.days[key] = {
      minutes: Math.max(totalMinutes, 0),
      comment: dayComment.value.trim(),
      date: formatDateLabel(currentDayContext.dateObj)
    };
  } else {
    delete habit.days[key];
  }

  resetTimer();
  saveState();
  renderTable();
}

// ===== Render table =====

function renderTable() {
  const year = parseInt(yearSelect.value);
  const month = parseInt(monthSelect.value);
  const daysInMonth = getDaysInMonth(year, month);
  const dayOfWeekNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const weeks = new Set();
  const dayToWeek = {};
  const daysData = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const week = getWeekNumber(date);
    weeks.add(week);
    dayToWeek[d] = week;

    const dowIdx = date.getDay();
    const dayName = dayOfWeekNames[dowIdx === 0 ? 6 : dowIdx - 1];

    daysData.push({ day: d, week, dayName, date });
  }

  const sortedWeeks = Array.from(weeks).sort((a, b) => a - b);
  const daysPerWeek = {};
  sortedWeeks.forEach(w => (daysPerWeek[w] = 0));

  for (let d = 1; d <= daysInMonth; d++) {
    daysPerWeek[dayToWeek[d]]++;
  }

  // THEAD
  tableHead.innerHTML = '';
  const weekRow = document.createElement('tr');

  const leftServiceCells = [
    { text: 'Привычка', className: 'left' },
    { text: 'Цель (дни)' },
    { text: 'Цель (часы)' }
  ];

  leftServiceCells.forEach(cfg => {
    const th = document.createElement('th');
    th.textContent = cfg.text;
    if (cfg.className) th.className = cfg.className;
    th.rowSpan = 2;
    weekRow.appendChild(th);
  });

  sortedWeeks.forEach(w => {
    const th = document.createElement('th');
    th.textContent = `Неделя ${w}`;
    th.className = 'week-header';
    th.colSpan = daysPerWeek[w];
    th.style.textAlign = 'center';
    th.style.padding = '6px';
    weekRow.appendChild(th);
  });

  const rightServiceCells = [
    { text: 'Сделано (дней)' },
    { text: 'Осталось (дней)' },
    { text: 'Итого часов' },
    { text: 'Прогресс' },
    { text: 'Проценты' }
  ];

  rightServiceCells.forEach(cfg => {
    const th = document.createElement('th');
    th.textContent = cfg.text;
    th.rowSpan = 2;
    weekRow.appendChild(th);
  });

  tableHead.appendChild(weekRow);

  // Days header
  const daysRow = document.createElement('tr');

  daysData.forEach(({ day, dayName }) => {
    const th = document.createElement('th');
    
    th.style.fontSize = 'var(--font-size-xs)';
    th.innerHTML = `${day}<br/>${dayName}`;
    daysRow.appendChild(th);
  });

  tableHead.appendChild(daysRow);

  // TBODY
  tableBody.innerHTML = '';

  habits
    .filter(habit => isHabitActiveInMonth(habit, year, month))
    .forEach(habit => {
      const row = document.createElement('tr');

      // Name + edit
      const nameTd = document.createElement('td');
nameTd.className = 'left';

// Название привычки
const nameSpan = document.createElement('span');
nameSpan.textContent = habit.name || 'Без названия';

// Кнопка-троеточие
const menuBtn = document.createElement('button');
menuBtn.type = 'button';
menuBtn.className = 'habit-menu-btn';
menuBtn.innerHTML = '⋯'; // троеточие
menuBtn.setAttribute('aria-label', 'Меню привычки');

// Контейнер для названия + троеточия
const wrapper = document.createElement('div');
wrapper.className = 'habit-name-wrapper';
wrapper.appendChild(nameSpan);
wrapper.appendChild(menuBtn);
nameTd.appendChild(wrapper);
row.appendChild(nameTd);

// Двойной клик по названию — как раньше «Редактировать»
nameSpan.addEventListener('dblclick', () => {
  editingHabitId = habit.id;
  editHabitNameInput.value = habit.name || '';
  openModal(editHabitModalOverlay);
});

// Клик по троеточию — открыть мини-меню
menuBtn.addEventListener('click', e => {
  e.stopPropagation();
  openHabitContextMenu(e.currentTarget, habit);
});

      // Goal days
      const goalDaysTd = document.createElement('td');
      goalDaysTd.textContent = typeof habit.goalDays === 'number' ? habit.goalDays : '-';
      row.appendChild(goalDaysTd);

      // Goal hours
      const goalHoursTd = document.createElement('td');
      goalHoursTd.textContent = typeof habit.goalHours === 'number' ? habit.goalHours : '-';
      row.appendChild(goalHoursTd);

      // Days
      const days = habit.days || {};
      let doneDaysCount = 0;
      let totalHours = 0;

      daysData.forEach(({ day, date }) => {
        const dateKey = `${year}-${month}-${day}`;
        const entry = days[dateKey];

        const td = document.createElement('td');
        td.className = 'day-checkbox-cell';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'day-checkbox';

        const minutes = entry ? entry.minutes || 0 : 0;
        checkbox.checked = minutes > 0;

        checkbox.addEventListener('click', e => {
          e.preventDefault();
          openDayModalForDate(habit, year, month, day, date);
        });

        td.appendChild(checkbox);
        row.appendChild(td);

        if (minutes > 0) {
          doneDaysCount++;
          totalHours += minutes / 60;
        }
      });

      const { doneSummary, remainingSummary } = calcHabitSummary(
        habit,
        year,
        month,
        daysInMonth
      );

      const { daysPercent } = calcProgressPercent(
        habit,
        year,
        month,
        daysInMonth
      );

      // Done days
      const doneTd = document.createElement('td');
      doneTd.textContent = doneSummary;
      row.appendChild(doneTd);

      // Remaining days
      const remainingTd = document.createElement('td');
      remainingTd.textContent = remainingSummary;
      row.appendChild(remainingTd);

      // Total hours
      const hoursTd = document.createElement('td');
      hoursTd.textContent = totalHours.toFixed(1);
      row.appendChild(hoursTd);

      // Progress bar
      const progressTd = document.createElement('td');
      progressTd.className = 'progress-cell';

      const progressBg = document.createElement('div');
      progressBg.className = 'progress-bar-bg';

      const progressFill = document.createElement('div');
      progressFill.className = 'progress-bar-fill-days';
      progressFill.style.width = Math.min(100, daysPercent) + '%';

      progressBg.appendChild(progressFill);
      progressTd.appendChild(progressBg);
      row.appendChild(progressTd);

      // Percentage
      const percentTd = document.createElement('td');
      percentTd.className = 'percent-cell';
      percentTd.textContent = `${Math.round(daysPercent)}%`;
      row.appendChild(percentTd);

      tableBody.appendChild(row);
    });
}
let openHabitMenuEl = null;

function closeHabitContextMenu() {
  if (openHabitMenuEl && openHabitMenuEl.parentNode) {
    openHabitMenuEl.parentNode.removeChild(openHabitMenuEl);
  }
  openHabitMenuEl = null;
}

function openHabitContextMenu(buttonEl, habit) {
  // Закрыть старое меню, если есть
  closeHabitContextMenu();

  const menu = document.createElement('div');
  menu.className = 'habit-context-menu';

  // Позиционирование рядом с кнопкой
  const rect = buttonEl.getBoundingClientRect();
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  menu.style.top = rect.bottom + scrollY + 'px';
  menu.style.left = rect.left + scrollX + 'px';

  // Пункт "Редактировать"
  const editItem = document.createElement('button');
  editItem.className = 'habit-context-item';
  editItem.innerHTML = `
    <span class="habit-context-item-icon">✏️</span>
    <span>Редактировать</span>
  `;
  editItem.addEventListener('click', () => {
    editingHabitId = habit.id;
    editHabitNameInput.value = habit.name || '';
    openModal(editHabitModalOverlay);
    closeHabitContextMenu();
  });

  // Пункт "Настроить привычку"
  const configItem = document.createElement('button');
  configItem.className = 'habit-context-item';
  configItem.innerHTML = `
    <span class="habit-context-item-icon">⚙️</span>
    <span>Настроить привычку</span>
  `;
  configItem.addEventListener('click', () => {
    // Заполнить форму как при редактировании, но через модалку добавления
    habitNameInput.value = habit.name || '';
    durationMonths.value = habit.durationMonths || 0;
    durationDays.value = habit.durationDays || 0;
    durationHours.value = habit.durationHours || 0;
    goalTypeSelect.value = habit.goalType || 'daysPerWeek';
    goalValueInput.value =
      habit.goalDaysPerWeek ??
      habit.goalDays ??
      habit.goalHoursPerDay ??
      habit.goalHours ??
      0;
    habitCommentInput.value = habit.comment || '';

    // Можно завести отдельную переменную, чтобы понимать, что это «редактирование настроек», а не создание
    editingHabitId = habit.id;
    openModal(addHabitModalOverlay);
    closeHabitContextMenu();
  });

  menu.appendChild(editItem);
  menu.appendChild(configItem);

  document.body.appendChild(menu);
  openHabitMenuEl = menu;
}

// ===== Events =====

timerStartBtn.addEventListener('click', startTimer);
timerPauseBtn.addEventListener('click', pauseTimer);
timerResetBtn.addEventListener('click', resetTimer);
actionBtn.addEventListener('click', () => {
  actionMenu.classList.toggle('hidden');
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
});
// Year / month
yearSelect.addEventListener('change', renderTable);
monthSelect.addEventListener('change', renderTable);

// Day modal
closeModalBtn.addEventListener('click', () => closeModal(dayModalOverlay));

resetDayBtn.addEventListener('click', () => {
  if (!currentDayContext) return;

  const habit = habits.find(h => h.id === currentDayContext.habitId);
  if (!habit || !habit.days) return;

  delete habit.days[currentDayContext.dateKey];

  timeHours.value = '';
  timeMinutes.value = '';
  dayComment.value = '';

  resetTimer();
  saveState();
  renderTable();
  closeModal(dayModalOverlay);
  currentDayContext = null;
});

saveDayBtn.addEventListener('click', () => {
  persistDayFromModal();
  closeModal(dayModalOverlay);
});

// History
openHistoryBtn.addEventListener('click', () => {
  if (!currentHistoryHabitId) return;

  const habit = habits.find(h => h.id === currentHistoryHabitId);
  if (!habit || !habit.days) {
    historyContent.innerHTML = 'История пуста';
    openModal(historyModalOverlay);
    return;
  }

  const entries = Object.values(habit.days).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  if (!entries.length) {
    historyContent.innerHTML = 'История пуста';
    openModal(historyModalOverlay);
    return;
  }

  let html = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: var(--color-secondary);">
          <th style="border: 1px solid var(--color-border); padding: 8px;">Дата</th>
          <th style="border: 1px solid var(--color-border); padding: 8px;">Время</th>
          <th style="border: 1px solid var(--color-border); padding: 8px;">Комментарий</th>
        </tr>
      </thead>
      <tbody>
  `;

  entries.forEach(entry => {
    const minutes = typeof entry.minutes === 'number'
      ? entry.minutes
      : parseInt(entry.minutes || '0', 10);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const hh = String(hours).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');

    html += `
      <tr>
        <td style="border: 1px solid var(--color-border); padding: 8px;">${entry.date || ''}</td>
        <td style="border: 1px solid var(--color-border); padding: 8px;">${hh}:${mm}</td>
        <td style="border: 1px solid var(--color-border); padding: 8px;">${entry.comment || '-'}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  historyContent.innerHTML = html;
  openModal(historyModalOverlay);
});


closeHistoryBtn.addEventListener('click', () => closeModal(historyModalOverlay));

// Add habit
addHabitBtn.addEventListener('click', () => {
  habitNameInput.value = '';
  durationMonths.value = '0';
  durationDays.value = '0';
  durationHours.value = '0';
  goalTypeSelect.value = 'daysPerWeek';
  goalValueInput.value = '';
  habitCommentInput.value = '';
  openModal(addHabitModalOverlay);
});

[closeAddHabitBtn, cancelAddHabitBtn].forEach(btn => {
  btn.addEventListener('click', () => closeModal(addHabitModalOverlay));
});

createHabitBtn.addEventListener('click', () => {
  const name = habitNameInput.value.trim();
  if (!name) {
    alert('Введите название привычки');
    return;
  }

  const goalType = goalTypeSelect.value;
  const goalValue = parseFloat(goalValueInput.value) || 0;

  const durationMonthsVal = parseInt(durationMonths.value || '0', 10);
  const durationDaysVal = parseInt(durationDays.value || '0', 10);
  const durationHoursVal = parseFloat(durationHours.value || '0');

  if (editingHabitId) {
    const habit = habits.find(h => h.id === editingHabitId);
    if (habit) {
      habit.name = name;
      habit.createdAt = habit.createdAt || new Date().toISOString();
      habit.durationMonths = durationMonthsVal;
      habit.durationDays = durationDaysVal;
      habit.durationHours = durationHoursVal;
      habit.goalType = goalType;
      habit.comment = habitCommentInput.value.trim();

      habit.goalDaysPerWeek = undefined;
      habit.goalDays = undefined;
      habit.goalHours = undefined;
      habit.goalHoursPerDay = undefined;

      if (goalType === 'daysPerWeek') habit.goalDaysPerWeek = goalValue;
      else if (goalType === 'daysTotal') habit.goalDays = goalValue;
      else if (goalType === 'hoursTotal') habit.goalHours = goalValue;
      else if (goalType === 'hoursPerDay') habit.goalHoursPerDay = goalValue;
    }
  } else {
    const habit = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
      durationMonths: durationMonthsVal,
      durationDays: durationDaysVal,
      durationHours: durationHoursVal,
      goalType,
      comment: habitCommentInput.value.trim(),
      days: {}
    };

    if (goalType === 'daysPerWeek') habit.goalDaysPerWeek = goalValue;
    else if (goalType === 'daysTotal') habit.goalDays = goalValue;
    else if (goalType === 'hoursTotal') habit.goalHours = goalValue;
    else if (goalType === 'hoursPerDay') habit.goalHoursPerDay = goalValue;

    habits.push(habit);
  }

  saveState();
  renderTable();
  closeModal(addHabitModalOverlay);
  editingHabitId = null;
});

  
// Edit habit
saveHabitEditBtn.addEventListener('click', () => {
  if (editingHabitId === null) return;

  const habit = habits.find(h => h.id === editingHabitId);
  if (!habit) return;

  const newName = editHabitNameInput.value.trim();
  if (!newName) {
    alert('Введите название привычки');
    return;
  }

  habit.name = newName;
  saveState();
  renderTable();
  closeModal(editHabitModalOverlay);
  editingHabitId = null;
});

[closeEditHabitBtn, cancelEditHabitBtn].forEach(btn => {
  btn.addEventListener('click', () => closeModal(editHabitModalOverlay));
});

// Delete habit
deleteHabitBtn.addEventListener('click', () => {
  deleteHabitSearchInput.value = '';
  deleteHabitInfo.innerHTML = '';
  openModal(deleteHabitModalOverlay);
});

deleteHabitSearchInput.addEventListener('input', () => {
  const query = deleteHabitSearchInput.value.trim().toLowerCase();
  deleteHabitInfo.innerHTML = '';

  if (!query) {
    selectedDeleteIndex = null;
    return;
  }

  // FIXED: Use template literals for string interpolation
  const matches = habits.filter(h =>
    h.name.toLowerCase().includes(query)
  );

  if (matches.length === 0) {
    deleteHabitInfo.innerHTML = '<em>Привычка не найдена</em>';
    selectedDeleteIndex = null;
  } else if (matches.length === 1) {
    selectedDeleteIndex = habits.indexOf(matches[0]);
    deleteHabitInfo.innerHTML = `<strong>Найдена привычка:</strong> ${matches[0].name}`;
  } else {
    deleteHabitInfo.innerHTML = `<strong>Найдено нескольких привычек:</strong> ${matches.map(h => h.name).join(', ')}<br/>Пожалуйста, уточните поиск.`;
  }
});

confirmDeleteHabitBtn.addEventListener('click', () => {
  if (
    selectedDeleteIndex === null ||
    selectedDeleteIndex < 0 ||
    selectedDeleteIndex >= habits.length
  ) {
    alert('Пожалуйста, сначала найдите привычку');
    return;
  }

  if (
    confirm(
      `Вы уверены, что хотите удалить привычку "${habits[selectedDeleteIndex].name}"?`
    )
  ) {
    habits.splice(selectedDeleteIndex, 1);
    saveState();
    renderTable();
    closeModal(deleteHabitModalOverlay);
    selectedDeleteIndex = null;
  }
});

[closeDeleteHabitBtn, cancelDeleteHabitBtn].forEach(btn => {
  btn.addEventListener('click', () => closeModal(deleteHabitModalOverlay));
});

// Daily hours
dailyHoursBtn.addEventListener('click', () => {
  dailyHoursInput.value = dailyHours;
  openModal(dailyHoursModalOverlay);
});

[closeDailyHoursBtn, cancelDailyHoursBtn].forEach(btn => {
  btn.addEventListener('click', () => closeModal(dailyHoursModalOverlay));
});

saveDailyHoursBtn.addEventListener('click', () => {
  const hours = parseFloat(dailyHoursInput.value) || 8;
  dailyHours = Math.max(0, hours);
  saveState();
  closeModal(dailyHoursModalOverlay);
});

// Outside clicks
[
  dayModalOverlay,
  historyModalOverlay,
  addHabitModalOverlay,
  editHabitModalOverlay,
  deleteHabitModalOverlay,
  dailyHoursModalOverlay
].forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      closeModal(modal);
      closeAllModals();
    }
  });
});

document.addEventListener('click', e => {
  // Верхнее меню действий
  if (!e.target.closest('.actions-wrapper') && e.target !== actionBtn) {
    actionMenu.classList.add('hidden');
  }

  // Контекстное меню привычки
  if (
    openHabitMenuEl &&
    !e.target.closest('.habit-context-menu') &&
    !e.target.closest('.habit-menu-btn')
  ) {
    closeHabitContextMenu();
  }
});
// ===== Init =====

initYearSelect();
initMonthSelect();
renderTable();
