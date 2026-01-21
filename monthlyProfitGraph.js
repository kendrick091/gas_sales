import { openDatabase } from "./app.js";

let db;
let currentYear = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', () => {

  const btn = document.getElementById('btnMonthlyGraph');
  const overlay = document.getElementById('monthlyGraphOverlay');
  const closeBtn = document.getElementById('closeMonthlyGraph');
  const canvas = document.getElementById('monthlyProfitChart');
  const ctx = canvas.getContext('2d');

  const yearLabel = document.getElementById('graphYear');
  const prevYearBtn = document.getElementById('prevYear');
  const nextYearBtn = document.getElementById('nextYear');

  btn.addEventListener('click', openGraph);
  closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));

  prevYearBtn.addEventListener('click', () => {
    currentYear--;
    yearLabel.textContent = currentYear;
    drawMonthlyProfit(currentYear);
  });

  nextYearBtn.addEventListener('click', () => {
    currentYear++;
    yearLabel.textContent = currentYear;
    drawMonthlyProfit(currentYear);
  });

  openDatabase().then(database => {
    db = database;
  });

  function openGraph() {
    if (!db) {
      alert('Database not ready yet');
      return;
    }
    overlay.classList.remove('hidden');
    yearLabel.textContent = currentYear;
    drawMonthlyProfit(currentYear);
  }

  btn.addEventListener('click', () => {
  console.log('Monthly graph button clicked');
  openGraph();
});

  function drawMonthlyProfit(year) {
    const salesTx = db.transaction('sales', 'readonly');
    const salesStore = salesTx.objectStore('sales');

    const expenseTx = db.transaction('expense', 'readonly');
    const expenseStore = expenseTx.objectStore('expense');

    Promise.all([
      getAll(salesStore),
      getAll(expenseStore)
    ]).then(([sales, expenses]) => {

      const monthlySales = Array(12).fill(0);
      const monthlyExpenses = Array(12).fill(0);

      sales.forEach(s => {
        if (s.year === year) {
          monthlySales[s.month - 1] += Number(s.totalAmount || 0);
        }
      });

      expenses.forEach(e => {
        if (e.year === year) {
          monthlyExpenses[e.month - 1] += Number(e.amount || 0);
        }
      });

      const profits = monthlySales.map((s, i) => s - monthlyExpenses[i]);
      renderChart(profits);
    });
  }

  function getAll(store) {
    return new Promise(resolve => {
      store.getAll().onsuccess = e => resolve(e.target.result || []);
    });
  }

  function renderChart(data) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const max = Math.max(...data.map(v => Math.abs(v)), 1);
    const barWidth = canvas.width / 14;

    data.forEach((value, i) => {
      const height = (Math.abs(value) / max) * 200;
      const x = (i + 1) * barWidth;
      const y = value >= 0 ? 250 - height : 250;

      ctx.fillStyle = value >= 0 ? '#4CAF50' : '#E53935';
      ctx.fillRect(x, y, barWidth * 0.6, height);

      ctx.fillStyle = '#555';
      ctx.font = '12px sans-serif';
      ctx.fillText(labels[i], x, 270);
    });
  }

});


