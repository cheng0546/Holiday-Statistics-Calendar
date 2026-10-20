// 后端 API 地址：部署后端后修改此处，或在页面前设置 window.API_BASE
const API_BASE = window.API_BASE || 'https://holiday-statistics-calendar.onrender.com';
const REFRESH_MS = 15000;
const COLORS = ['#e6194b', '#3cb44b', '#4363d8', '#f58231', '#911eb4', '#008080', '#9a6324', '#800000', '#808000', '#f032e6', '#000075', '#469990'];

let holidays = [];
let current = new Date();
current.setDate(1);

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');
const fmt = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

function colorFor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}

function showMessage(text) { $('message').textContent = text || ''; }

async function api(path, options) {
  const res = await fetch(API_BASE + path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '请求失败');
  return data;
}

async function load() {
  try {
    holidays = await api('/api/holidays');
    showMessage('');
    render();
  } catch (e) {
    showMessage('无法连接服务器：' + e.message);
  }
}

function render() {
  const y = current.getFullYear(), m = current.getMonth();
  $('month-title').textContent = `${y}年${m + 1}月`;
  const cal = $('calendar');
  cal.textContent = '';
  for (const d of ['日', '一', '二', '三', '四', '五', '六']) {
    const el = document.createElement('div');
    el.className = 'dow';
    el.textContent = d;
    cal.appendChild(el);
  }
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const now = new Date();
  const todayStr = fmt(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; i < first; i++) {
    const el = document.createElement('div');
    el.className = 'cell empty';
    cal.appendChild(el);
  }
  for (let d = 1; d <= days; d++) {
    const ds = fmt(y, m, d);
    const cell = document.createElement('div');
    cell.className = 'cell' + (ds === todayStr ? ' today' : '');
    const num = document.createElement('span');
    num.className = 'day';
    num.textContent = d;
    cell.appendChild(num);
    for (const h of holidays) {
      if (h.start_date <= ds && ds <= h.end_date) {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.style.background = colorFor(h.name);
        tag.textContent = h.name;
        tag.title = `${h.name}: ${h.start_date} ~ ${h.end_date}`;
        cell.appendChild(tag);
      }
    }
    cal.appendChild(cell);
  }
  renderList(fmt(y, m, 1), fmt(y, m, days));
  renderLegend();
}

function renderList(from, to) {
  const ul = $('list');
  ul.textContent = '';
  const items = holidays.filter((h) => h.start_date <= to && h.end_date >= from);
  if (!items.length) {
    const li = document.createElement('li');
    li.textContent = '本月暂无假期';
    ul.appendChild(li);
    return;
  }
  for (const h of items) {
    const li = document.createElement('li');
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = colorFor(h.name);
    const text = document.createElement('span');
    text.className = 'text';
    text.textContent = `${h.name}：${h.start_date} ~ ${h.end_date}`;
    const del = document.createElement('button');
    del.textContent = '删除';
    del.addEventListener('click', () => remove(h));
    li.append(dot, text, del);
    ul.appendChild(li);
  }
}

function renderLegend() {
  const lg = $('legend');
  lg.textContent = '';
  for (const name of [...new Set(holidays.map((h) => h.name))]) {
    const item = document.createElement('span');
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = colorFor(name);
    item.append(dot, ' ' + name);
    lg.appendChild(item);
  }
}

async function remove(h) {
  if (!confirm(`确定删除 ${h.name} 的假期？`)) return;
  try {
    await api('/api/holidays/' + h.id, { method: 'DELETE' });
    await load();
  } catch (e) { showMessage(e.message); }
}

$('holiday-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/holidays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: $('name').value, start_date: $('start').value, end_date: $('end').value }),
    });
    $('holiday-form').reset();
    await load();
  } catch (err) { showMessage(err.message); }
});

$('prev').addEventListener('click', () => { current.setMonth(current.getMonth() - 1); render(); });
$('next').addEventListener('click', () => { current.setMonth(current.getMonth() + 1); render(); });
$('today').addEventListener('click', () => { current = new Date(); current.setDate(1); render(); });

load();
setInterval(load, REFRESH_MS);
