/**
 * Expensio — app.js
 * TC-1: Vanilla JS only, no frameworks
 * TC-2: localStorage persistence
 * TC-3: Chrome, Firefox, Edge, Safari (modern versions)
 */
(function () {
  'use strict';

  /* ── Constants ── */
  var STORAGE_KEY = 'evb_transactions';
  var THEME_KEY   = 'evb_theme';
  var HIGH_LIMIT  = 500;

  var CAT = {
    Food:           { color: '#22d3ee', emoji: '🍔' },
    Transportation: { color: '#a3e635', emoji: '🚗' },
    Fun:            { color: '#c084fc', emoji: '🎮' }
  };

  var TIPS = [
    'Tip: Small daily expenses add up fast — keep tracking!',
    'Tip: Transport costs often exceed Food budgets.',
    'Tip: Fun spending tends to spike on weekends.',
    'Tip: Try to keep any single category under 40% of total.'
  ];

  /* ── DOM helpers ── */
  function el(id) { return document.getElementById(id); }

  var dom = {
    form:         el('expenseForm'),
    itemName:     el('itemName'),
    itemAmount:   el('itemAmount'),
    itemCategory: el('itemCategory'),
    catPills:     el('categoryPills'),
    nameErr:      el('nameError'),
    amountErr:    el('amountError'),
    catErr:       el('categoryError'),
    totalAmount:  el('totalAmount'),
    txList:       el('transactionList'),
    emptyState:   el('emptyState'),
    sortSelect:   el('sortSelect'),
    themeToggle:  el('themeToggle'),
    themeIcon:    el('themeIcon'),
    chartCanvas:  el('expenseChart'),
    chartEmpty:   el('chartEmpty'),
    chartCenter:  el('chartCenterLabel'),
    chartTotal:   el('chartCenterTotal'),
    toast:        el('toast'),
    statFood:     el('statMakanan'),
    statTrans:    el('statTransportasi'),
    statFun:      el('statHiburan'),
    statCount:    el('statCount'),
    pageDate:     el('pageDate'),
    tipText:      el('tipText')
  };

  /* ── State ── */
  var transactions = [];
  var chart        = null;
  var toastTimer   = null;

  /* ── Storage ── */
  function loadTransactions() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
      // Migrate old "Entertainment" key to "Fun"
      return data.map(function (t) {
        return Object.assign({}, t, {
          category: t.category === 'Entertainment' ? 'Fun' : t.category
        });
      });
    } catch (e) {
      return [];
    }
  }

  function saveTransactions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }

  /* ── Utils ── */
  function usd(n) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2
    }).format(n);
  }

  // Compact format — manual fallback for Safari < 14.1
  function usdCompact(n) {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(n);
    } catch (e) {
      if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
      if (n >= 1000)    return '$' + (n / 1000).toFixed(1) + 'K';
      return usd(n);
    }
  }

  function uid() {
    return Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  }

  function getCatTotals() {
    var t = {};
    transactions.forEach(function (tx) {
      t[tx.category] = (t[tx.category] || 0) + tx.amount;
    });
    var labels = Object.keys(t);
    return {
      labels: labels,
      data:   labels.map(function (l) { return t[l]; }),
      colors: labels.map(function (l) { return (CAT[l] && CAT[l].color) || '#94a3b8'; })
    };
  }

  function getLegendColor() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--t2').trim() || '#7b8db0';
  }

  /* ── Toast ── */
  function showToast(msg) {
    clearTimeout(toastTimer);
    dom.toast.textContent = msg;
    dom.toast.classList.add('show');
    toastTimer = setTimeout(function () {
      dom.toast.classList.remove('show');
    }, 2400);
  }

  /* ── Date ── */
  function renderDate() {
    if (!dom.pageDate) return;
    dom.pageDate.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  /* ── Category pills ── */
  function initPills() {
    dom.catPills.addEventListener('click', function (e) {
      var pill = e.target.closest('.cat-btn');
      if (!pill) return;
      dom.catPills.querySelectorAll('.cat-btn').forEach(function (p) {
        p.setAttribute('aria-pressed', 'false');
      });
      pill.setAttribute('aria-pressed', 'true');
      dom.itemCategory.value = pill.dataset.value;
      dom.catErr.textContent = '';
    });
  }

  function resetPills() {
    dom.catPills.querySelectorAll('.cat-btn').forEach(function (p) {
      p.setAttribute('aria-pressed', 'false');
    });
    dom.itemCategory.value = '';
  }

  /* ── Validation ── */
  function validate() {
    var ok = true;
    [dom.nameErr, dom.amountErr, dom.catErr].forEach(function (e) {
      e.textContent = '';
    });
    [dom.itemName, dom.itemAmount].forEach(function (e) {
      e.classList.remove('is-invalid');
    });

    if (!dom.itemName.value.trim()) {
      dom.nameErr.textContent = 'Item name is required.';
      dom.itemName.classList.add('is-invalid');
      ok = false;
    }

    var amt = parseFloat(dom.itemAmount.value);
    if (!dom.itemAmount.value || isNaN(amt) || amt <= 0) {
      dom.amountErr.textContent = 'Enter a valid amount (> 0).';
      dom.itemAmount.classList.add('is-invalid');
      ok = false;
    }

    if (!dom.itemCategory.value) {
      dom.catErr.textContent = 'Please select a category.';
      ok = false;
    }

    return ok;
  }

  /* ── Render: Total ── */
  function renderTotal() {
    var total = transactions.reduce(function (s, t) { return s + t.amount; }, 0);
    dom.totalAmount.textContent = usd(total);
    dom.totalAmount.classList.remove('bump');
    void dom.totalAmount.offsetWidth; // force reflow
    dom.totalAmount.classList.add('bump');
    setTimeout(function () { dom.totalAmount.classList.remove('bump'); }, 200);

    if (dom.chartTotal) {
      dom.chartTotal.textContent = total > 0 ? usdCompact(total) : '$0';
    }
  }

  /* ── Render: Stats ── */
  function renderStats() {
    var t = { Food: 0, Transportation: 0, Fun: 0 };
    transactions.forEach(function (tx) {
      if (t[tx.category] !== undefined) t[tx.category] += tx.amount;
    });
    dom.statCount.textContent = transactions.length;
    dom.statFood.textContent  = usd(t.Food);
    dom.statTrans.textContent = usd(t.Transportation);
    dom.statFun.textContent   = usd(t.Fun);
  }

  /* ── Render: Tip ── */
  function renderTip() {
    if (!dom.tipText) return;
    if (!transactions.length) {
      dom.tipText.textContent = 'Start tracking to get spending insights.';
      return;
    }
    var t = { Food: 0, Transportation: 0, Fun: 0 };
    transactions.forEach(function (tx) {
      if (t[tx.category] !== undefined) t[tx.category] += tx.amount;
    });
    var entries = Object.keys(t).map(function (k) { return [k, t[k]]; });
    entries.sort(function (a, b) { return b[1] - a[1]; });
    var top = entries[0][0];
    var map = { Food: TIPS[0], Transportation: TIPS[1], Fun: TIPS[2] };
    dom.tipText.textContent = map[top] || TIPS[3];
  }

  /* ── Render: List ── */
  function getSorted(list) {
    var c = list.slice();
    var val = dom.sortSelect.value;
    if (val === 'amount-asc')  return c.sort(function (a, b) { return a.amount - b.amount; });
    if (val === 'amount-desc') return c.sort(function (a, b) { return b.amount - a.amount; });
    if (val === 'category')    return c.sort(function (a, b) { return a.category.localeCompare(b.category, 'en'); });
    return c.sort(function (a, b) { return b.createdAt - a.createdAt; });
  }

  function makeTxEl(tx) {
    var isHigh = tx.amount > HIGH_LIMIT;
    var item = document.createElement('div');
    item.className = 'tx-item' + (isHigh ? ' is-high' : '');
    item.setAttribute('role', 'listitem');
    item.dataset.id = tx.id;

    var catMeta = CAT[tx.category] || { emoji: '💰' };

    // Build inner HTML safely
    var icon = document.createElement('div');
    icon.className = 'tx-icon';
    icon.setAttribute('data-cat', tx.category);
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = catMeta.emoji;

    var info = document.createElement('div');
    info.className = 'tx-info';

    var name = document.createElement('div');
    name.className = 'tx-name';
    name.textContent = tx.name; // XSS-safe

    var meta = document.createElement('div');
    meta.className = 'tx-meta';

    var catBadge = document.createElement('span');
    catBadge.className = 'tx-cat';
    catBadge.setAttribute('data-cat', tx.category);
    catBadge.textContent = tx.category;

    var highBadge = document.createElement('span');
    highBadge.className = 'tx-high-badge';
    highBadge.textContent = '⚠ High Spend';

    meta.appendChild(catBadge);
    meta.appendChild(highBadge);
    info.appendChild(name);
    info.appendChild(meta);

    var right = document.createElement('div');
    right.className = 'tx-right';

    var amount = document.createElement('span');
    amount.className = 'tx-amount';
    amount.textContent = usd(tx.amount);

    var delBtn = document.createElement('button');
    delBtn.className = 'btn-del';
    delBtn.type = 'button';
    delBtn.dataset.id = tx.id;
    delBtn.setAttribute('aria-label', 'Delete ' + tx.name);
    delBtn.textContent = '✕';

    right.appendChild(amount);
    right.appendChild(delBtn);

    item.appendChild(icon);
    item.appendChild(info);
    item.appendChild(right);

    return item;
  }

  function renderList() {
    var list = getSorted(transactions);
    dom.emptyState.style.display = list.length ? 'none' : 'flex';
    dom.txList.querySelectorAll('.tx-item').forEach(function (e) { e.remove(); });
    if (!list.length) return;
    var frag = document.createDocumentFragment();
    list.forEach(function (t) { frag.appendChild(makeTxEl(t)); });
    dom.txList.appendChild(frag);
  }

  /* ── Render: Chart ── */
  function initChart() {
    chart = new Chart(dom.chartCanvas, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 11, family: "'Inter', system-ui, sans-serif", weight: '600' },
              color: getLegendColor()
            }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) { return '  ' + usd(ctx.parsed); }
            }
          }
        },
        animation: { duration: 450, easing: 'easeInOutQuart' }
      }
    });
  }

  function updateChart() {
    var totals = getCatTotals();
    var has = totals.data.length > 0;

    dom.chartEmpty.style.display  = has ? 'none'  : 'block';
    dom.chartCanvas.style.display = has ? 'block' : 'none';
    dom.chartCenter.style.display = has ? 'block' : 'none';

    if (!has) return;

    chart.data.labels                         = totals.labels;
    chart.data.datasets[0].data              = totals.data;
    chart.data.datasets[0].backgroundColor   = totals.colors;
    chart.options.plugins.legend.labels.color = getLegendColor();
    chart.update('active');
  }

  /* ── Actions ── */
  function onAdd(e) {
    e.preventDefault();
    if (!validate()) return;

    var tx = {
      id:        uid(),
      name:      dom.itemName.value.trim(),
      amount:    parseFloat(dom.itemAmount.value),
      category:  dom.itemCategory.value,
      createdAt: Date.now()
    };

    transactions.push(tx);
    saveTransactions();
    renderAll();

    showToast(tx.amount > HIGH_LIMIT
      ? '⚠ High spend — "' + tx.name + '" added'
      : '✓ "' + tx.name + '" added'
    );

    dom.form.reset();
    resetPills();
    dom.itemName.focus();
  }

  function onDelete(e) {
    var btn = e.target.closest('.btn-del');
    if (!btn) return;
    var id = btn.dataset.id;
    var deleted = null;
    transactions = transactions.filter(function (t) {
      if (t.id === id) { deleted = t; return false; }
      return true;
    });
    saveTransactions();
    renderAll();
    if (deleted) showToast('🗑 "' + deleted.name + '" removed');
  }

  /* ── Theme ── */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    dom.themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    dom.themeToggle.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    );
    localStorage.setItem(THEME_KEY, theme);
  }

  /* ── Orchestrator ── */
  function renderAll() {
    renderTotal();
    renderStats();
    renderList();
    updateChart();
    renderTip();
  }

  /* ── Init ── */
  function init() {
    transactions = loadTransactions();
    applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
    renderDate();
    initChart();
    initPills();
    renderAll();

    dom.form.addEventListener('submit', onAdd);
    dom.txList.addEventListener('click', onDelete);
    dom.sortSelect.addEventListener('change', renderList);
    dom.themeToggle.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      applyTheme(cur === 'dark' ? 'light' : 'dark');
      if (chart) updateChart();
    });
  }

  document.addEventListener('DOMContentLoaded', init);

}());
