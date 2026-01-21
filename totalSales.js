import { DB_NAME, DB_VERSION } from "./app.js";
import { deleteSale } from "./deleteSales.js";

let db;

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = (event)=>{
    db = event.target.result;
}

request.onerror = () =>{
    console.error('Error opening DB')
}

request.onsuccess = (event) =>{
    db = event.target.result
}

const salesOverlay = document.getElementById('salesOverlay');
const salesOverlayList = document.getElementById('salesOverlayList');
const overlayTitle = document.getElementById('overlayTitle');
const closeSalesOverlay = document.getElementById('closeSalesOverlay');
const overlayTotal = document.getElementById('overlayTotal');

// Show sales in overlay

function showSalesOverlay(period) {
  const tx = db.transaction('sales', 'readonly');
  const store = tx.objectStore('sales');
  const request = store.getAll();

  request.onsuccess = () => {
    const allSales = request.result;
    const now = new Date();

    let filtered = [];
    let expenseFilter = {};
    
    switch(period) {
      case 'today':
        filtered = allSales.filter(sale => sale.dateString === now.toLocaleDateString());
        overlayTitle.textContent = "Today's Sales";
        expenseFilter = { date: now.toLocaleDateString() };
        break;
      case 'month':
        filtered = allSales.filter(sale => sale.year === now.getFullYear() && sale.month === (now.getMonth()+1));
        overlayTitle.textContent = "This Month's Sales";
        expenseFilter = { year: now.getFullYear(), month: (now.getMonth()+1) };
        break;
      case 'year':
        filtered = allSales.filter(sale => sale.year === now.getFullYear());
        overlayTitle.textContent = "This Year's Sales";
        expenseFilter = { year: now.getFullYear() };
        break;
    }

    // Calculate total amount and total qty
    const totalAmount = filtered.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalQty = filtered.reduce((sum, sale) => sum + sale.qtySold, 0);

    // Get expenses for the period
    const expenseTx = db.transaction('expense', 'readonly');
    const expenseStore = expenseTx.objectStore('expense');
    const expenseRequest = expenseStore.getAll();

    expenseRequest.onsuccess = () => {
      const allExpenses = expenseRequest.result;
      let filteredExpenses = [];

      if (period === 'today') {
        filteredExpenses = allExpenses.filter(expense => expense.date === now.toLocaleDateString());
      } else if (period === 'month') {
        filteredExpenses = allExpenses.filter(expense => expense.year === now.getFullYear() && expense.month === (now.getMonth()+1));
      } else if (period === 'year') {
        filteredExpenses = allExpenses.filter(expense => expense.year === now.getFullYear());
      }

      const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const profit = totalAmount - totalExpenses;

      overlayTotal.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            <p style="margin: 0; font-size: 0.9rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Total Sales</p>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.8rem; font-weight: bold;">₦${totalAmount.toLocaleString()}</p>
          </div>
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 1.5rem; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);">
            <p style="margin: 0; font-size: 0.9rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Total Expenses</p>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.8rem; font-weight: bold;">₦${totalExpenses.toLocaleString()}</p>
          </div>
        </div>
        <div style="background: linear-gradient(135deg, ${profit > 0 ? '#56ab2f 0%, #a8e063 100%' : profit < 0 ? '#eb3349 0%, #f45c43 100%' : '#f5a623 0%, #ffd700 100%'}); padding: 2rem; border-radius: 12px; color: white; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2); margin-bottom: 1.5rem; text-align: center;">
          <p style="margin: 0; font-size: 0.95rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Net Profit</p>
          <p style="margin: 0.8rem 0 0 0; font-size: 2.5rem; font-weight: bold;">₦${profit.toLocaleString()}</p>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; opacity: 0.85;">${profit > 0 ? '✓ Profitable' : profit < 0 ? '✗ Loss' : '= Break Even'}</p>
        </div>
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 1.5rem; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4); text-align: center;">
          <p style="margin: 0; font-size: 0.9rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Total Weight Sold</p>
            <p style="margin: 0.5rem 0 0 0; font-size: 1.8rem; font-weight: bold;">${totalQty.toFixed(2)} KG</p>
        </div>
      `;

      // Populate sales list
      salesOverlayList.innerHTML = '';
      if(filtered.length === 0) {
        salesOverlayList.innerHTML = '<p>No sales found</p>';
      } else {
        // Sort newest first (optional)
        filtered.sort((a,b) => new Date(b.year,b.month-1,b.day) - new Date(a.year,a.month-1,a.day));

        const today = new Date().toLocaleDateString();

        filtered.forEach((sale, index) => {
          const div = document.createElement('div');
          div.className = 'saleItem';
          div.style.display = 'flex';
          div.style.justifyContent = 'space-between';
          div.style.alignItems = 'center';
          
          const saleInfo = document.createElement('div');
          saleInfo.style.flex = '1';
          saleInfo.innerHTML = `
            <span style="display: block;">${sale.dateString} ${sale.time} | ${sale.paymentType}</span>
            <span style="display: block;">₦${sale.totalAmount.toLocaleString()} | ${sale.qtySold.toFixed(2)} KG</span>
          `;
          
          // Only show delete button for today's sales
          if (sale.dateString === today) {
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '🗑️ Delete';
            deleteBtn.style.padding = '0.5rem 0.8rem';
            deleteBtn.style.marginLeft = '1rem';
            deleteBtn.style.background = '#ff4444';
            deleteBtn.style.color = 'white';
            deleteBtn.style.border = 'none';
            deleteBtn.style.borderRadius = '6px';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.fontSize = '0.85rem';
            deleteBtn.style.fontWeight = 'bold';
            deleteBtn.style.whiteSpace = 'nowrap';
            deleteBtn.onclick = () => {
              deleteSale(sale);
            };
            div.appendChild(saleInfo);
            div.appendChild(deleteBtn);
          } else {
            div.appendChild(saleInfo);
          }
          
          salesOverlayList.appendChild(div);
        });
      }

      // Show overlay
      salesOverlay.classList.remove('hidden');
    };
  };
}

// Button event listeners
document.getElementById('btnToday').addEventListener('click', () => {
  showSalesOverlay('today');
});
document.getElementById('btnMonth').addEventListener('click', () => {
  showSalesOverlay('month');
});
document.getElementById('btnYear').addEventListener('click', () => {
  showSalesOverlay('year');
});


