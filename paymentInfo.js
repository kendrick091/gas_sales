import { DB_NAME, DB_VERSION } from "./app.js";

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

// Show cash and transfer payment info
function showPaymentInfo(paymentType) {
  const tx = db.transaction('sales', 'readonly');
  const store = tx.objectStore('sales');
  const request = store.getAll();

  request.onsuccess = () => {
    const allSales = request.result;
    const now = new Date();
    const today = now.toLocaleDateString(); // Format: 1/21/2026

    // Filter today's sales by payment type
    const filteredSales = allSales.filter(sale => 
      sale.dateString === today && sale.paymentType === paymentType
    );

    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalQty = filteredSales.reduce((sum, sale) => sum + sale.qtySold, 0);
    const salesCount = filteredSales.length;

    // Get expenses for the payment type
    const expenseTx = db.transaction('expense', 'readonly');
    const expenseStore = expenseTx.objectStore('expense');
    const expenseRequest = expenseStore.getAll();

    expenseRequest.onsuccess = () => {
      const allExpenses = expenseRequest.result;
      const filteredExpenses = allExpenses.filter(expense => 
        expense.date === today && expense.paymentType === paymentType
      );

      const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const profit = totalSales - totalExpenses;

      const title = paymentType === 'cash' ? '💵 Cash Payments' : paymentType === 'transfer' ? '💳 Bank Transfers' : '🖥️ POS Payments';
      const bgGradient = paymentType === 'cash' 
        ? 'linear-gradient(135deg, #f5a623 0%, #ffd700 100%)' 
        : paymentType === 'transfer'
        ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

      overlayTitle.textContent = title;

      overlayTotal.innerHTML = `
        <div style="position: sticky; top: 0; z-index: 100; background: white; padding-bottom: 1rem;">
          <div style="background: ${bgGradient}; padding: 2rem; border-radius: 12px; color: white; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2); text-align: center; margin-bottom: 1rem;">
            <p style="margin: 0; font-size: 0.95rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Total ${paymentType === 'cash' ? 'Cash' : paymentType === 'transfer' ? 'Transfer' : 'POS'}</p>
            <p style="margin: 0.8rem 0 0 0; font-size: 2.5rem; font-weight: bold;">₦${totalSales.toLocaleString()}</p>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; opacity: 0.85;">Transactions: ${salesCount} | Qty: ${totalQty.toFixed(2)} KG</p>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 1rem; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4); text-align: center;">
              <p style="margin: 0; font-size: 0.85rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Expenses</p>
              <p style="margin: 0.5rem 0 0 0; font-size: 1.5rem; font-weight: bold;">₦${totalExpenses.toLocaleString()}</p>
            </div>
            <div style="background: linear-gradient(135deg, ${profit > 0 ? '#56ab2f 0%, #a8e063 100%' : profit < 0 ? '#eb3349 0%, #f45c43 100%' : '#f5a623 0%, #ffd700 100%'}); padding: 1rem; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2); text-align: center;">
              <p style="margin: 0; font-size: 0.85rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.5px;">Profit</p>
              <p style="margin: 0.5rem 0 0 0; font-size: 1.5rem; font-weight: bold;">₦${profit.toLocaleString()}</p>
            </div>
          </div>
        </div>
      `;

      // Populate sales list
      salesOverlayList.innerHTML = '';
      
      // Display sales
      if(filteredSales.length === 0 && filteredExpenses.length === 0) {
        salesOverlayList.innerHTML = `<p style="text-align: center; padding: 2rem; color: #999;">No ${paymentType === 'cash' ? 'cash' : paymentType === 'transfer' ? 'transfer' : 'POS'} transactions today</p>`;
      } else {
        // Display sales section
        if (filteredSales.length > 0) {
          const salesHeader = document.createElement('div');
          salesHeader.innerHTML = `<h3 style="margin: 1.5rem 0 1rem 0; padding: 0 1rem; color: #333; border-bottom: 2px solid ${bgGradient.includes('f5a623') ? '#f5a623' : bgGradient.includes('4facfe') ? '#4facfe' : '#667eea'};">Sales</h3>`;
          salesOverlayList.appendChild(salesHeader);

          filteredSales.forEach(sale => {
            const div = document.createElement('div');
            div.className = 'saleItem';
            div.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 600; margin-bottom: 0.3rem;">${sale.time}</div>
                  <div style="font-size: 0.9rem; color: #666;">₦${sale.pricePerKg}/kg × ${sale.qtySold.toFixed(2)} kg</div>
                </div>
                <div style="text-align: right; font-weight: bold; color: #333;">₦${sale.totalAmount.toLocaleString()}</div>
              </div>
            `;
            salesOverlayList.appendChild(div);
          });
        }

        // Display expenses section
        if (filteredExpenses.length > 0) {
          const expensesHeader = document.createElement('div');
          expensesHeader.innerHTML = `<h3 style="margin: 1.5rem 0 1rem 0; padding: 0 1rem; color: #333; border-bottom: 2px solid #f5576c;">Expenses</h3>`;
          salesOverlayList.appendChild(expensesHeader);

          filteredExpenses.forEach(expense => {
            const div = document.createElement('div');
            div.className = 'saleItem';
            div.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: 600; margin-bottom: 0.3rem;">${expense.time}</div>
                  <div style="font-size: 0.9rem; color: #666;">${expense.reason}</div>
                </div>
                <div style="text-align: right; font-weight: bold; color: #f44336;">-₦${expense.amount.toLocaleString()}</div>
              </div>
            `;
            salesOverlayList.appendChild(div);
          });
        }
      }

      // Show overlay
      salesOverlay.classList.remove('hidden');
    };
  };
}

// Close overlay
closeSalesOverlay.addEventListener('click', () => {
  salesOverlay.classList.add('hidden');
});

document.getElementById('btnCashInfo').addEventListener('click', () => {
  showPaymentInfo('cash');
});

document.getElementById('btnTransferInfo').addEventListener('click', () => {
  showPaymentInfo('transfer');
});

document.getElementById('btnPosInfo').addEventListener('click', () => {
  showPaymentInfo('pos');
});