import { DB_NAME, DB_VERSION } from "./app.js";
import { refreshDailyProfit, refreshAllTimeProfit } from "./dailyProfit.js";

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

// Show expenses form
const salesOverlay = document.getElementById('salesOverlay');
const salesOverlayList = document.getElementById('salesOverlayList');
const overlayTitle = document.getElementById('overlayTitle');
const closeSalesOverlay = document.getElementById('closeSalesOverlay');
const overlayTotal = document.getElementById('overlayTotal');

const expensesBtn = document.getElementById('btnExpenses');
expensesBtn.addEventListener('click', () => showExpensesMenu());

function showExpensesMenu() {
  overlayTitle.textContent = "Expenses";
  overlayTotal.innerHTML = '';
  
  salesOverlayList.innerHTML = `
    <div style="padding: 1rem; text-align: center;">
      <button id="viewExpenses" style="width: 100%; padding: 0.75rem; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; margin-bottom: 0.5rem;">View All Expenses</button>
      <button id="addExpense" style="width: 100%; padding: 0.75rem; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;">Add New Expense</button>
    </div>
  `;
  
  salesOverlay.classList.remove('hidden');
  
  document.getElementById('viewExpenses').addEventListener('click', showExpensesList);
  document.getElementById('addExpense').addEventListener('click', showExpensesForm);
}

function showExpensesList() {
  overlayTitle.textContent = "All Expenses";
  
  const tx = db.transaction('expense', 'readonly');
  const store = tx.objectStore('expense');
  const request = store.getAll();
  
  request.onsuccess = () => {
    const allExpenses = request.result;
    const totalExpense = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    overlayTotal.innerHTML = `<p>Total Expenses: ₦${totalExpense.toLocaleString()}</p>`;
    
    salesOverlayList.innerHTML = '';
    
    if (allExpenses.length === 0) {
      salesOverlayList.innerHTML = '<p>No expenses recorded</p>';
    } else {
      // Sort newest first
      allExpenses.sort((a, b) => b.timestamp - a.timestamp);
      
      allExpenses.forEach(expense => {
        const div = document.createElement('div');
        div.className = 'saleItem';
        const paymentBadge = expense.paymentType === 'cash' ? '💵 Cash' : expense.paymentType === 'transfer' ? '💳 Transfer' : expense.paymentType === 'pos' ? '🖥️ POS' : 'Unknown';
        const bgColor = expense.paymentType === 'cash' ? '#fff3cd' : expense.paymentType === 'transfer' ? '#cfe2ff' : '#e7f3ff';
        const textColor = expense.paymentType === 'cash' ? '#856404' : '#084298';
        div.innerHTML = `
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
    <span style="font-size: 0.9rem; color: #666;">
      ${expense.date}
    </span>
    <span style="background-color: ${bgColor}; padding: 0.3rem 0.8rem; 
    border-radius: 20px; font-size: 0.8rem; font-weight: bold; color: ${textColor};">
      ${paymentBadge}
    </span>
  </div>

  <div style="display: flex; justify-content: space-between;">
    <span style="font-weight: 500;">${expense.reason}</span> <span style="color: #f44336; font-weight: bold;">
      ₦${expense.amount.toLocaleString()}
    </span>
  </div>

  <button 
    style="margin-top: 0.5rem; width: 80px; background: #e53935; 
    color: white; border: none; padding: 0.5rem; border-radius: 4px; cursor: pointer;"
    onclick="deleteExpense(${expense.id})">
    🗑 Delete
  </button>
`;
        salesOverlayList.appendChild(div);
      });
    }
  };
}

function showExpensesForm() {
  overlayTitle.textContent = "Add Expense";
  overlayTotal.innerHTML = '';
  
  salesOverlayList.innerHTML = `
    <div style="padding: 1rem;">
      <div class="form-group" style="margin-bottom: 1rem;">
        <label for="expenseReason">Reason for Expense</label>
        <input type="text" id="expenseReason" placeholder="e.g. Transportation, Maintenance" style="width: 100%; padding: 0.5rem; margin-top: 0.5rem;">
      </div>
      <div class="form-group" style="margin-bottom: 1rem;">
        <label for="paymentType">Payment Type</label>
        <select id="transactionType" style="width: 100%; padding: 0.5rem; margin-top: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
          <option value="">-- Select Payment Type --</option>
          <option value="cash">💵 Cash</option>
          <option value="transfer">💳 Bank Transfer</option>
          <option value="pos">🖥️ POS</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom: 1rem;">
        <label for="expenseAmount">Expense Amount (₦)</label>
        <input type="number" id="expenseAmount" placeholder="e.g. 5000" style="width: 100%; padding: 0.5rem; margin-top: 0.5rem;">
      </div>
      <button id="submitExpense" style="width: 100%; padding: 0.75rem; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;">Submit Expense</button>
    </div>
  `;
  
  salesOverlay.classList.remove('hidden');
  
  document.getElementById('submitExpense').addEventListener('click', submitExpense);
}

// Submit expense
function submitExpense() {
  const reason = document.getElementById('expenseReason').value.trim();
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  const paymentType = document.getElementById('transactionType').value;
  
  if (!reason) {
    alert('Please enter a reason for the expense');
    return;
  }
  
  if (!paymentType) {
    alert('Please select a payment type');
    return;
  }
  
  if (!amount || amount <= 0) {
    alert('Please enter a valid amount');
    return;
  }
  
  // Save expense to IndexedDB
  const tx = db.transaction('expense', 'readwrite');
  const store = tx.objectStore('expense');
  
  const now = new Date();
  const expense = {
    reason: reason,
    paymentType: paymentType,
    amount: amount,
    year: now.getFullYear(),                       // 2026
    month: now.getMonth() + 1,                     // 1-12 (add 1 because getMonth() is 0-indexed)
    day: now.getDate(),
    date: now.toLocaleDateString(),
    dateString: now.toISOString().split('T')[0], // "2026-01-20"
    timestamp: now.getTime()
  };
  
  store.add(expense);
  
  tx.oncomplete = () => {
    alert('Expense saved successfully');
    document.getElementById('expenseReason').value = '';
    document.getElementById('paymentType').value = '';
    document.getElementById('expenseAmount').value = '';
    salesOverlay.classList.add('hidden');
    refreshDailyProfit(); // Refresh the daily profit display
    refreshAllTimeProfit(); // Refresh the all-time profit display
  };
  
  tx.onerror = () => {
    alert('Error saving expense');
  };
}

//code to delete expense
window.deleteExpense = function(id) {
  if (!confirm('Are you sure you want to delete this expense?')) {
    return;
  }
  const tx = db.transaction('expense', 'readwrite');
  const store = tx.objectStore('expense');
  store.delete(id);
  tx.oncomplete = () => {
    alert('Expense deleted successfully');
    showExpensesList();
    refreshDailyProfit(); // Refresh the daily profit display
    refreshAllTimeProfit(); // Refresh the all-time profit display
  };
  tx.onerror = () => {
    alert('Error deleting expense');
  };
}
