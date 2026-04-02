/**
 * Expensio — app.js
 * TC-1: Vanilla JS  TC-2: localStorage  TC-3: All modern browsers
 */
(() => {
  'use strict';

  /* ── Constants ── */
  const STORAGE_KEY = 'evb_transactions';
  const THEME_KEY   = 'evb_theme';
  const HIGH_LIMIT  = 500;

  const CAT = {
    Food:           { color: '#22d3ee', emoji: '🍔' },
    Transportation: { color: '#a3e635', emoji: '🚗' },
    Fun:  { color: '#c084fc', emoji: '🎮' },
  };

  const TIPS = [
    'Tip: Small daily expenses add up fast — keep tracking!',
    'Tip: Transport costs often exceed Food budgets.',
    'Tip: Fun spending tends to spike on weekends.',
    'Tip: Try to keep any single category under 40% of total.',
  ];

  /* ── DOM ── */
  const $ = id => document.getElementById(id);
  const dom = {
    form:         $('expenseForm'),
    itemName:     $('itemName'),
    itemAmount:   $('itemAmount'),
    itemCategory: $('itemCategory'),
    catPills:     $('categoryPills'),
    nameErr:      $('nameError'),
    amountErr:    $('amountError'),
    catErr:       $('categoryError'),
    totalAmount:  $('totalAmount'),
    txList:       $('transactionList'),
    emptyState:   $('emptyState'),
    sortSelect:   $('sortSelect'),
    themeToggle:  $('themeToggle'),
    themeIcon:    $('themeIcon'),
    chartCanvas:  $('expenseChart'),
    chartEmpty:   $('chartEmpty'),
    chartCenter:  $('chartCenterLabel'),
    chartTotal:   $('chartCenterTotal'),
    toast:        $('toast'),
    statFood:     $('statMakanan'),
    statTrans:    $('statTransportasi'),
    statFun:      $('statHiburan'),
    statCount:    $('statCount'),
    pageDate:     $('pageDate'),
    tipText:      $('tipText'),
  };

  /* ── State ── */
  let transactions = [];
  let chart        = null;
  let toastTimer   = null;

  /* ── Storage ── */
  const load = () => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
      // Migrate old "Entertainment" key to "Fun"
      return data.map(t => ({
        ...t,
        category: t.category === 'Entertainment' ? 'Fun' : t.category
      }));
    } catch { return []; }
  };
  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));

  /* ── Utils ── */
  const usd = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
  const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

  const catTotals = () => {
    const t = {};
    transactions.forEach(({ category, amount }) => { t[category] = (t[category] ?? 0) + amount; });
    const labels = Object.keys(t);
    return { labels, data: labels.map(l => t[l]), colors: labels.map(l => CAT[l]?.color ?? '#94a3b8') };
  };

  const legendColor = () =>
    getComputedStyle(document.documentElement).getPropertyValue('--t2').trim() || '#7b8db0';

  /* ── Toast ── */
  const toast = (msg, ms = 2400) => {
    clearTimeout(toastTimer);
    dom.toast.textContent = msg;
    dom.toast.classList.add('show');
    toastTimer = setTimeout(() => dom.toast.classList.remove('show'), ms);
  };

  /* ── Date ── */
  const renderDate = () => {
    if (dom.pageDate) dom.pageDate.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  /* ── Category pills ── */
  const initPills = () => {
    dom.catPills.addEventListener('click', e => {
      const pill = e.target.closest('.cat-btn');
      if (!pill) return;
      dom.catPills.querySelectorAll('.cat-btn').forEach(p => p.setAttribute('aria-pressed', 'false'));
      pill.setAttribute('aria-pressed', 'true');
      dom.itemCategory.value = pill.dataset.value;
      dom.catErr.textContent = '';
    });
  };

  const resetPills = () => {
    dom.catPills.querySelectorAll('.cat-btn').forEach(p => p.setAttribute('aria-pressed', 'false'));
    dom.itemCategory.value = '';
  };

  /* ── Validation ── */
  const validate = () => {
    let ok = true;
    [dom.nameErr, dom.amountErr, dom.catErr].forEach(e => e.textContent = '');
    [dom.itemName, dom.itemAmount].forEach(e => e.classList.remove('is-invalid'));

    if (!dom.itemName.value.trim()) {
      dom.nameErr.textContent = 'Item name is required.';
      dom.itemName.classList.add('is-invalid'); ok = false;
    }
    const amt = parseFloat(dom.itemAmount.value);
    if (!dom.itemAmount.value || isNaN(amt) || amt <= 0) {
      dom.amountErr.textContent = 'Enter a valid amount (> 0).';
      dom.itemAmount.classList.add('is-invalid'); ok = false;
    }
    if (!dom.itemCategory.value) {
      dom.catErr.textContent = 'Please select a category.'; ok = false;
    }
    return ok;
  };

  /* ── Render: Total ── */
  const renderTotal = () => {
    const total = transactions.reduce((s, t) => s + t.amount, 0);
    dom.totalAmount.textContent = usd(total);
    dom.totalAmount.classList.remove('bump');
    void dom.totalAmount.offsetWidth;
    dom.totalAmount.classList.add('bump');
    setTimeout(() => dom.totalAmount.classList.remove('bump'), 200);

    if (dom.chartTotal) {
      dom.chartTotal.textContent = total > 0
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(total)
        : '$0';
    }
  };

  /* ── Render: Stats ── */
  const renderStats = () => {
    const t = { Food: 0, Transportation: 0, Fun: 0 };
    transactions.forEach(({ category, amount }) => { if (t[category] !== undefined) t[category] += amount; });
    dom.statCount.textContent = transactions.length;
    dom.statFood.textContent  = usd(t.Food);
    dom.statTrans.textContent = usd(t.Transportation);
    dom.statFun.textContent   = usd(t.Fun);
  };

  /* ── Render: Tip ── */
  const renderTip = () => {
    if (!dom.tipText) return;
    if (!transactions.length) { dom.tipText.textContent = 'Start tracking to get spending insights.'; return; }
    const t = { Food: 0, Transportation: 0, Fun: 0 };
    transactions.forEach(({ category, amount }) => { if (t[category] !== undefined) t[category] += amount; });
    const top = Object.entries(t).sort((a,b) => b[1]-a[1])[0][0];
    const map = { Food: TIPS[0], Transportation: TIPS[1], Fun: TIPS[2] };
    dom.tipText.textContent = map[top] ?? TIPS[3];
  };

  /* ── Render: List ── */
  const sorted = list => {
    const c = [...list];
    switch (dom.sortSelect.value) {
      case 'amount-asc':  return c.sort((a,b) => a.amount - b.amount);
      case 'amount-desc': return c.sort((a,b) => b.amount - a.amount);
      case 'category':    return c.sort((a,b) => a.category.localeCompare(b.category,'en'));
      default:            return c.sort((a,b) => b.createdAt - a.createdAt);
    }
  };

  const makeTxEl = ({ id, name, amount, category }) => {
    const isHigh = amount > HIGH_LIMIT;
    const el = document.createElement('div');
    el.className = `tx-item${isHigh ? ' is-high' : ''}`;
    el.setAttribute('role', 'listitem');
    el.dataset.id = id;

    // safe name
    const safe = document.createElement('span');
    safe.textContent = name;
    const safeName = safe.innerHTML;

    el.innerHTML = `
      <div class="tx-icon" data-cat="${category}" aria-hidden="true">${CAT[category]?.emoji ?? '💰'}</div>
      <div class="tx-info">
        <div class="tx-name"></div>
        <div class="tx-meta">
          <span class="tx-cat" data-cat="${category}">${category}</span>
          <span class="tx-high-badge">⚠ High Spend</span>
        </div>
      </div>
      <div class="tx-right">
        <span class="tx-amount">${usd(amount)}</span>
        <button class="btn-del" data-id="${id}" aria-label="Delete ${safeName}" type="button">✕</button>
      </div>`;

    el.querySelector('.tx-name').textContent = name;
    return el;
  };

  const renderList = () => {
    const list = sorted(transactions);
    dom.emptyState.style.display = list.length ? 'none' : 'flex';
    dom.txList.querySelectorAll('.tx-item').forEach(e => e.remove());
    if (!list.length) return;
    const frag = document.createDocumentFragment();
    list.forEach(t => frag.appendChild(makeTxEl(t)));
    dom.txList.appendChild(frag);
  };

  /* ── Render: Chart ── */
  const initChart = () => {
    chart = new Chart(dom.chartCanvas, {
      type: 'doughnut',
      data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderWidth: 0, hoverOffset: 10 }] },
      options: {
        responsive: true, maintainAspectRatio: true, cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 11, family: "'Inter', sans-serif", weight: '600' }, color: legendColor() }
          },
          tooltip: { callbacks: { label: ctx => `  ${usd(ctx.parsed)}` } }
        },
        animation: { duration: 450, easing: 'easeInOutQuart' }
      }
    });
  };

  const updateChart = () => {
    const { labels, data, colors } = catTotals();
    const has = data.length > 0;
    dom.chartEmpty.style.display         = has ? 'none'  : 'block';
    dom.chartCanvas.style.display        = has ? 'block' : 'none';
    dom.chartCenter.style.display        = has ? 'block' : 'none';
    if (!has) return;
    chart.data.labels                         = labels;
    chart.data.datasets[0].data              = data;
    chart.data.datasets[0].backgroundColor   = colors;
    chart.options.plugins.legend.labels.color = legendColor();
    chart.update('active');
  };

  /* ── Actions ── */
  const onAdd = e => {
    e.preventDefault();
    if (!validate()) return;
    const tx = {
      id: uid(), name: dom.itemName.value.trim(),
      amount: parseFloat(dom.itemAmount.value),
      category: dom.itemCategory.value, createdAt: Date.now()
    };
    transactions.push(tx);
    save(); renderAll();
    toast(tx.amount > HIGH_LIMIT ? `⚠ High spend — "${tx.name}" added` : `✓ "${tx.name}" added`);
    dom.form.reset(); resetPills(); dom.itemName.focus();
  };

  const onDelete = e => {
    const btn = e.target.closest('.btn-del');
    if (!btn) return;
    const del = transactions.find(t => t.id === btn.dataset.id);
    transactions = transactions.filter(t => t.id !== btn.dataset.id);
    save(); renderAll();
    if (del) toast(`🗑 "${del.name}" removed`);
  };

  /* ── Theme ── */
  const applyTheme = theme => {
    document.documentElement.setAttribute('data-theme', theme);
    dom.themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    dom.themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    localStorage.setItem(THEME_KEY, theme);
  };

  /* ── Orchestrator ── */
  const renderAll = () => { renderTotal(); renderStats(); renderList(); updateChart(); renderTip(); };

  /* ── Init ── */
  const init = () => {
    transactions = load();
    applyTheme(localStorage.getItem(THEME_KEY) ?? 'dark');
    renderDate();
    initChart();
    initPills();
    renderAll();

    dom.form.addEventListener('submit', onAdd);
    dom.txList.addEventListener('click', onDelete);
    dom.sortSelect.addEventListener('change', renderList);
    dom.themeToggle.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      applyTheme(cur === 'dark' ? 'light' : 'dark');
      if (chart) updateChart();
    });
  };

  document.addEventListener('DOMContentLoaded', init);
})();
