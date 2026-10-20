const STORAGE_KEY = "holiday-statistics-calendar.records";
const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];
const COLORS = ["#79b7a0", "#e8a06f", "#8e9de0", "#e37e8a", "#d3ad52", "#8baf75", "#b584c4"];

const calendar = document.querySelector("#calendar");
const monthTitle = document.querySelector("#month-title");
const recordList = document.querySelector("#record-list");
const recordCount = document.querySelector("#record-count");
const form = document.querySelector("#holiday-form");
const nameInput = document.querySelector("#name");
const startInput = document.querySelector("#start-date");
const endInput = document.querySelector("#end-date");
const formError = document.querySelector("#form-error");
const submitButton = document.querySelector("#submit-button");
const cancelButton = document.querySelector("#cancel-edit");

let currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let editingId = null;
let records = loadRecords();

function loadRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter((record) => record && typeof record.id === "string"
        && typeof record.name === "string" && typeof record.startDate === "string"
        && typeof record.endDate === "string" && record.startDate <= record.endDate)
      : [];
  } catch {
    return [];
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

function colorFor(record) {
  let hash = 0;
  for (const character of record.name) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

function makeButton(text, label, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.setAttribute("aria-label", label);
  button.addEventListener("click", action);
  return button;
}

function renderCalendar() {
  calendar.replaceChildren();
  monthTitle.textContent = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
  }).format(currentMonth);

  WEEKDAYS.forEach((weekday) => {
    const heading = document.createElement("div");
    heading.className = "weekday";
    heading.setAttribute("role", "columnheader");
    heading.textContent = `周${weekday}`;
    calendar.append(heading);
  });

  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));
  const today = dateKey(new Date());

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const key = dateKey(date);
    const day = document.createElement("div");
    day.className = "day";
    day.setAttribute("role", "gridcell");
    if (date.getMonth() !== currentMonth.getMonth()) day.classList.add("outside");
    if (key === today) day.classList.add("today");

    const number = document.createElement("div");
    number.className = "day-number";
    number.textContent = String(date.getDate());
    day.append(number);

    const holidays = records.filter((record) => record.startDate <= key && record.endDate >= key);
    holidays.slice(0, 3).forEach((record) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "holiday-chip";
      chip.textContent = record.name;
      chip.title = `${record.name}：${formatDate(record.startDate)} 至 ${formatDate(record.endDate)}`;
      chip.style.backgroundColor = `${colorFor(record)}30`;
      chip.addEventListener("click", () => beginEdit(record));
      day.append(chip);
    });
    if (holidays.length > 3) {
      const more = document.createElement("div");
      more.className = "more-holidays";
      more.textContent = `+${holidays.length - 3} 人`;
      day.append(more);
    }
    calendar.append(day);
  }
}

function renderRecords() {
  const monthStart = dateKey(currentMonth);
  const monthEnd = dateKey(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0));
  const visibleRecords = records
    .filter((record) => record.endDate >= monthStart && record.startDate <= monthEnd)
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name, "zh-CN"));

  recordCount.textContent = `${visibleRecords.length} 条`;
  recordList.replaceChildren();
  if (visibleRecords.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "这个月还没有假期安排，添加一条记录吧。";
    recordList.append(empty);
    return;
  }

  visibleRecords.forEach((record) => {
    const card = document.createElement("article");
    card.className = "record-card";
    const main = document.createElement("div");
    main.className = "record-main";
    const mark = document.createElement("span");
    mark.className = "person-mark";
    mark.style.backgroundColor = colorFor(record);
    mark.setAttribute("aria-hidden", "true");

    const details = document.createElement("div");
    const name = document.createElement("p");
    name.className = "record-name";
    name.textContent = record.name;
    const dates = document.createElement("p");
    dates.className = "record-dates";
    dates.textContent = `${formatDate(record.startDate)} — ${formatDate(record.endDate)}`;
    details.append(name, dates);
    main.append(mark, details);

    const actions = document.createElement("div");
    actions.className = "record-actions";
    actions.append(
      makeButton("编辑", `编辑${record.name}的假期`, () => beginEdit(record)),
      makeButton("删除", `删除${record.name}的假期`, () => deleteRecord(record.id)),
    );
    card.append(main, actions);
    recordList.append(card);
  });
}

function render() {
  renderCalendar();
  renderRecords();
}

function beginEdit(record) {
  editingId = record.id;
  nameInput.value = record.name;
  startInput.value = record.startDate;
  endInput.value = record.endDate;
  submitButton.textContent = "保存修改";
  cancelButton.hidden = false;
  formError.textContent = "";
  nameInput.focus();
}

function resetForm() {
  editingId = null;
  form.reset();
  submitButton.textContent = "保存假期";
  cancelButton.hidden = true;
  formError.textContent = "";
}

function deleteRecord(id) {
  const record = records.find((item) => item.id === id);
  if (!record || !window.confirm(`确定删除 ${record.name} 的假期记录吗？`)) return;
  records = records.filter((item) => item.id !== id);
  saveRecords();
  if (editingId === id) resetForm();
  render();
}

document.querySelector("#previous-month").addEventListener("click", () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
  render();
});

document.querySelector("#next-month").addEventListener("click", () => {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  render();
});

document.querySelector("#go-today").addEventListener("click", () => {
  currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  render();
});

cancelButton.addEventListener("click", resetForm);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  if (startInput.value > endInput.value) {
    formError.textContent = "结束日期不能早于开始日期。";
    endInput.focus();
    return;
  }
  if (!name) {
    formError.textContent = "请填写姓名。";
    nameInput.focus();
    return;
  }

  const item = {
    id: editingId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    name,
    startDate: startInput.value,
    endDate: endInput.value,
  };
  records = editingId
    ? records.map((record) => record.id === editingId ? item : record)
    : [...records, item];
  saveRecords();
  currentMonth = new Date(Number(item.startDate.slice(0, 4)), Number(item.startDate.slice(5, 7)) - 1, 1);
  resetForm();
  render();
});

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY || event.key === null) {
    records = loadRecords();
    render();
  }
});

render();
