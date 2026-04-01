/**
 * Expense & Budget Visualizer
 * ===========================
 * Arsitektur: Module Pattern dengan IIFE
 * Prinsip: Single Responsibility per fungsi
 * Storage: localStorage dengan key 'expense_transactions'
 */

(() => {
  'use strict';

  // ─────────────────────────────────────────
  // KONSTANTA & KONFIGURASI
  // ─────────────────────────────────────────

  const STORAGE_KEY       = 'expense_transactions';
  const THEME_KEY         = 'expense_theme';
  const HIGH_SPEND_LIMIT  = 500_000; // Rp 500.000

  /** Palet warna untuk setiap kategori di chart */
  const CATEGORY_COLORS = {
    Makanan:       '#6366f1',
    Transportasi:  '#10b981',
    Hiburan:       '#f59e0b',
  };

  // ─────────────────────────────────────────
  // REFERENSI DOM
  // ─────────────────────────────────────────

  const dom = {
    form:            document.getElementById('expenseForm'),
    itemName:        document.getElementById('itemName'),
    itemAmount:      document.getElementById('itemAmount'),
    itemCategory:    document.getElementById('itemCategory'),
    nameError:       document.getElementById('nameError'),
    amountError:     document.getElementById('amountError'),
    categoryError:   document.getElementById('categoryError'),
    totalAmount:     document.getElementById('totalAmount'),
    transactionList: document.getElementById('transactionList'),
    emptyState:      document.getElementById('emptyState'),
    sortSelect:      document.getElementById('sortSelect'),
    themeToggle:     document.getElementById('themeToggle'),
    chartCanvas:     document.getElementById('expenseChart'),
    chartEmpty:      document.getElementById('chartEmpty'),
  };

  // ─────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────

  /** @type {Array<{id: string, name: string, amount: number, category: string, createdAt: number}>} */
  let transactions = [];

  /** Instance Chart.js — disimpan agar bisa di-update tanpa re-render penuh */
  let chartInstance = null;

  // ─────────────────────────────────────────
  // STORAGE HELPERS
  // ─────────────────────────────────────────

  /** Muat transaksi dari localStorage. Kembalikan array kosong jika belum ada. */
  const loadTransactions = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
    } catch {
      return [];
    }
  };

  /** Simpan state transaksi terkini ke localStorage. */
  const saveTransactions = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  };

  // ─────────────────────────────────────────
  // UTILITAS
  // ─────────────────────────────────────────

  /** Format angka ke format mata uang Rupiah. */
  const formatRupiah = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

  /** Buat ID unik sederhana berbasis timestamp + random. */
  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  /**
   * Hitung total pengeluaran per kategori.
   * @returns {{ labels: string[], data: number[], colors: string[] }}
   */
  const getCategoryTotals = () => {
    const totals = {};
    transactions.forEach(({ category, amount }) => {
      totals[category] = (totals[category] ?? 0) + amount;
    });
    const labels = Object.keys(totals);
    return {
      labels,
      data:   labels.map((l) => totals[l]),
      colors: labels.map((l) => CATEGORY_COLORS[l] ?? '#94a3b8'),
    };
  };

  // ─────────────────────────────────────────
  // VALIDASI FORM
  // ─────────────────────────────────────────

  /**
   * Validasi semua field form.
   * @returns {boolean} true jika valid
   */
  const validateForm = () => {
    let isValid = true;

    // Reset error sebelumnya
    [dom.nameError, dom.amountError, dom.categoryError].forEach((el) => (el.textContent = ''));
    [dom.itemName, dom.itemAmount, dom.itemCategory].forEach((el) => el.classList.remove('is-invalid'));

    if (!dom.itemName.value.trim()) {
      dom.nameError.textContent = 'Nama item wajib diisi.';
      dom.itemName.classList.add('is-invalid');
      isValid = false;
    }

    const amount = parseFloat(dom.itemAmount.value);
    if (!dom.itemAmount.value || isNaN(amount) || amount <= 0) {
      dom.amountError.textContent = 'Masukkan jumlah yang valid (> 0).';
      dom.itemAmount.classList.add('is-invalid');
      isValid = false;
    }

    if (!dom.itemCategory.value) {
      dom.categoryError.textContent = 'Pilih kategori terlebih dahulu.';
      dom.itemCategory.classList.add('is-invalid');
      isValid = false;
    }

    return isValid;
  };

  // ─────────────────────────────────────────
  // RENDER: TOTAL
  // ─────────────────────────────────────────

  /** Perbarui tampilan total pengeluaran di header. */
  const renderTotal = () => {
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    dom.totalAmount.textContent = formatRupiah(total);
  };

  // ─────────────────────────────────────────
  // RENDER: DAFTAR TRANSAKSI
  // ─────────────────────────────────────────

  /**
   * Urutkan salinan array transaksi berdasarkan pilihan sort.
   * @param {typeof transactions} list
   * @returns {typeof transactions}
   */
  const getSortedTransactions = (list) => {
    const sorted = [...list];
    switch (dom.sortSelect.value) {
      case 'amount-asc':  return sorted.sort((a, b) => a.amount - b.amount);
      case 'amount-desc': return sorted.sort((a, b) => b.amount - a.amount);
      case 'category':    return sorted.sort((a, b) => a.category.localeCompare(b.category));
      default:            return sorted.sort((a, b) => b.createdAt - a.createdAt); // terbaru
    }
  };

  /**
   * Buat elemen DOM untuk satu item transaksi.
   * @param {{ id: string, name: string, amount: number, category: string }} transaction
   * @returns {HTMLElement}
   */
  const createTransactionElement = ({ id, name, amount, category }) => {
    const isHighSpend = amount > HIGH_SPEND_LIMIT;

    const item = document.createElement('div');
    item.className = `transaction-item${isHighSpend ? ' is-high-spend' : ''}`;
    item.dataset.id = id;

    item.innerHTML = `
      <div class="item-info">
        <div class="item-name" title="${name}">${name}</div>
        <div class="item-meta">
          <span class="item-category">${category}</span>
          <span class="high-spend-badge">⚠ Pengeluaran Besar</span>
        </div>
      </div>
      <span class="item-amount">${formatRupiah(amount)}</span>
      <button class="btn-delete" data-id="${id}" aria-label="Hapus ${name}">✕</button>
    `;

    return item;
  };

  /** Render ulang seluruh daftar transaksi ke DOM. */
  const renderTransactionList = () => {
    const sorted = getSortedTransactions(transactions);

    // Tampilkan/sembunyikan empty state
    dom.emptyState.style.display = sorted.length === 0 ? 'block' : 'none';

    // Hapus item lama (kecuali empty state)
    const existingItems = dom.transactionList.querySelectorAll('.transaction-item');
    existingItems.forEach((el) => el.remove());

    // Render item baru
    const fragment = document.createDocumentFragment();
    sorted.forEach((t) => fragment.appendChild(createTransactionElement(t)));
    dom.transactionList.appendChild(fragment);
  };

  // ─────────────────────────────────────────
  // RENDER: CHART
  // ─────────────────────────────────────────

  /** Inisialisasi Chart.js Pie Chart pertama kali. */
  const initChart = () => {
    const { labels, data, colors } = getCategoryTotals();

    chartInstance = new Chart(dom.chartCanvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: 'transparent',
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              font: { size: 12, family: "'Segoe UI', system-ui, sans-serif" },
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim(),
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${formatRupiah(ctx.parsed)}`,
            },
          },
        },
      },
    });
  };

  /**
   * Perbarui data chart tanpa re-render penuh (performa optimal).
   * Dipanggil hanya saat ada perubahan data.
   */
  const updateChart = () => {
    const { labels, data, colors } = getCategoryTotals();
    const hasData = data.length > 0;

    // Tampilkan/sembunyikan pesan kosong
    dom.chartEmpty.style.display = hasData ? 'none' : 'block';
    dom.chartCanvas.style.display = hasData ? 'block' : 'none';

    if (!hasData) return;

    // Update data chart secara efisien
    chartInstance.data.labels = labels;
    chartInstance.data.datasets[0].data = data;
    chartInstance.data.datasets[0].backgroundColor = colors;

    // Sinkronkan warna label legend dengan tema aktif
    chartInstance.options.plugins.legend.labels.color =
      getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#6b7280';

    chartInstance.update('active');
  };

  // ─────────────────────────────────────────
  // AKSI: TAMBAH TRANSAKSI
  // ─────────────────────────────────────────

  /** Tangani submit form — validasi, buat objek, simpan, render. */
  const handleAddTransaction = (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const newTransaction = {
      id:        generateId(),
      name:      dom.itemName.value.trim(),
      amount:    parseFloat(dom.itemAmount.value),
      category:  dom.itemCategory.value,
      createdAt: Date.now(),
    };

    transactions.push(newTransaction);
    saveTransactions();
    renderAll();
    dom.form.reset();
    dom.itemName.focus();
  };

  // ─────────────────────────────────────────
  // AKSI: HAPUS TRANSAKSI
  // ─────────────────────────────────────────

  /**
   * Tangani klik hapus via event delegation pada container list.
   * @param {MouseEvent} event
   */
  const handleDeleteTransaction = (event) => {
    const deleteBtn = event.target.closest('.btn-delete');
    if (!deleteBtn) return;

    const { id } = deleteBtn.dataset;
    transactions = transactions.filter((t) => t.id !== id);
    saveTransactions();
    renderAll();
  };

  // ─────────────────────────────────────────
  // AKSI: DARK MODE TOGGLE
  // ─────────────────────────────────────────

  /** Terapkan tema ke <html> dan simpan preferensi. */
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    dom.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    localStorage.setItem(THEME_KEY, theme);
  };

  /** Toggle antara tema terang dan gelap. */
  const handleThemeToggle = () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
    // Perbarui warna legend chart setelah tema berubah
    if (chartInstance) updateChart();
  };

  // ─────────────────────────────────────────
  // RENDER SEMUA (ORCHESTRATOR)
  // ─────────────────────────────────────────

  /** Render ulang semua komponen UI sekaligus. */
  const renderAll = () => {
    renderTotal();
    renderTransactionList();
    updateChart();
  };

  // ─────────────────────────────────────────
  // INISIALISASI APLIKASI
  // ─────────────────────────────────────────

  const init = () => {
    // Muat data dari localStorage
    transactions = loadTransactions();

    // Terapkan tema tersimpan
    const savedTheme = localStorage.getItem(THEME_KEY) ?? 'light';
    applyTheme(savedTheme);

    // Inisialisasi chart
    initChart();

    // Render awal
    renderAll();

    // Pasang event listeners
    dom.form.addEventListener('submit', handleAddTransaction);
    dom.transactionList.addEventListener('click', handleDeleteTransaction); // event delegation
    dom.sortSelect.addEventListener('change', renderTransactionList);
    dom.themeToggle.addEventListener('click', handleThemeToggle);
  };

  // Jalankan saat DOM siap
  document.addEventListener('DOMContentLoaded', init);

})();
