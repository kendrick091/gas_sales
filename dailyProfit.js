import { DB_NAME, DB_VERSION } from "./app.js";

let db;

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = (event) => {
    db = event.target.result;
}

request.onerror = () => {
    console.error('Error opening DB')
}

request.onsuccess = (event) => {
    db = event.target.result;
    calculateDailyProfit(); // Calculate on page load
}

function calculateDailyProfit() {
    const today = new Date();
    const todayStr = today.toLocaleDateString(); // Format: 1/21/2026

    // Get today's sales
    const salesTx = db.transaction('sales', 'readonly');
    const salesStore = salesTx.objectStore('sales');
    const salesRequest = salesStore.getAll();

    salesRequest.onsuccess = () => {
        const allSales = salesRequest.result;
        const todaySales = allSales.filter(sale => sale.dateString === todayStr);
        const totalSales = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalQty = todaySales.reduce((sum, sale) => sum + sale.qtySold, 0);

        // Get today's expenses
        const expenseTx = db.transaction('expense', 'readonly');
        const expenseStore = expenseTx.objectStore('expense');
        const expenseRequest = expenseStore.getAll();

        expenseRequest.onsuccess = () => {
            const allExpenses = expenseRequest.result;
            const todayExpenses = allExpenses.filter(expense => expense.date === todayStr);
            const totalExpenses = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

            // Calculate profit
            const netProfit = totalSales - totalExpenses;

            // Update UI
            document.getElementById('todayTotalSales').textContent = `₦${totalSales.toLocaleString()}`;
            document.getElementById('todayTotalExpenses').textContent = `₦${totalExpenses.toLocaleString()}`;
            document.getElementById('todayTotalQty').textContent = totalQty.toFixed(2);
            document.getElementById('netProfit').textContent = `₦${netProfit.toLocaleString()}`;

            // Color code the profit
            const profitElement = document.getElementById('netProfit');
            if (netProfit > 0) {
                profitElement.parentElement.style.color = '#4CAF50'; // Green
            } else if (netProfit < 0) {
                profitElement.parentElement.style.color = '#f44336'; // Red
            } else {
                profitElement.parentElement.style.color = '#ff9800'; // Orange
            }
        };
    };
}

// Export function so it can be called from other files when sales/expenses are saved
export function refreshDailyProfit() {
    calculateDailyProfit();
}
