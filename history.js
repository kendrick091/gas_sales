import { DB_NAME, DB_VERSION } from "./app.js";

let db;

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = (event) => {
    db = event.target.result;
}

request.onerror = () => {
    console.error('Error opening DB');
}

request.onsuccess = (event) => {
    db = event.target.result;
}

const salesOverlay = document.getElementById('salesOverlay');
const salesOverlayList = document.getElementById('salesOverlayList');
const overlayTitle = document.getElementById('overlayTitle');
const closeSalesOverlay = document.getElementById('closeSalesOverlay');
const overlayTotal = document.getElementById('overlayTotal');
const btnHistory = document.getElementById('btnHistory');

btnHistory.addEventListener('click', () => {
    showHistoryOverlay();
});

function showHistoryOverlay() {
    overlayTitle.textContent = '📅 History';
    
    // Create filter controls
    overlayTotal.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 100px;">
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 0.5rem; font-weight: bold;">Year</label>
                    <select id="historyYear" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid #ddd;">
                        <option value="">-- Select Year --</option>
                    </select>
                </div>
                <div style="flex: 1; min-width: 100px;">
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 0.5rem; font-weight: bold;">Month</label>
                    <select id="historyMonth" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid #ddd;" disabled>
                        <option value="">-- Select Month --</option>
                    </select>
                </div>
                <div style="flex: 1; min-width: 100px;">
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 0.5rem; font-weight: bold;">Day</label>
                    <select id="historyDay" style="width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid #ddd;" disabled>
                        <option value="">-- Select Day --</option>
                    </select>
                </div>
            </div>
            <div id="historySummary" style="padding: 1rem; background: white; border-radius: 8px; border: 1px solid #ddd;">
                <p style="margin: 0; color: #666;">Select a period to view details</p>
            </div>
        </div>
    `;
    
    salesOverlayList.innerHTML = '';
    salesOverlay.classList.remove('hidden');
    
    // Populate years
    populateYears();
    
    // Event listeners
    document.getElementById('historyYear').addEventListener('change', (e) => {
        populateMonths(e.target.value);
        document.getElementById('historyMonth').value = '';
        document.getElementById('historyDay').value = '';
        document.getElementById('historyMonth').disabled = !e.target.value;
        document.getElementById('historyDay').disabled = true;
        updateHistoryDisplay();
    });
    
    document.getElementById('historyMonth').addEventListener('change', (e) => {
        const year = document.getElementById('historyYear').value;
        populateDays(year, e.target.value);
        document.getElementById('historyDay').value = '';
        document.getElementById('historyDay').disabled = !e.target.value;
        updateHistoryDisplay();
    });
    
    document.getElementById('historyDay').addEventListener('change', () => {
        updateHistoryDisplay();
    });
}

function populateYears() {
    const yearSelect = document.getElementById('historyYear');
    
    const tx = db.transaction(['sales', 'expense'], 'readonly');
    const salesStore = tx.objectStore('sales');
    const expenseStore = tx.objectStore('expense');
    
    const salesRequest = salesStore.getAll();
    const expenseRequest = expenseStore.getAll();
    
    let yearsSet = new Set();
    
    salesRequest.onsuccess = () => {
        salesRequest.result.forEach(sale => {
            yearsSet.add(sale.year);
        });
    };
    
    expenseRequest.onsuccess = () => {
        expenseRequest.result.forEach(expense => {
            yearsSet.add(expense.year);
        });
        
        // Sort years in descending order
        const years = Array.from(yearsSet).sort((a, b) => b - a);
        
        years.forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });
    };
}

function populateMonths(year) {
    const monthSelect = document.getElementById('historyMonth');
    monthSelect.innerHTML = '<option value="">-- Select Month --</option>';
    
    if (!year) return;
    
    const tx = db.transaction(['sales', 'expense'], 'readonly');
    const salesStore = tx.objectStore('sales');
    const expenseStore = tx.objectStore('expense');
    
    const salesRequest = salesStore.getAll();
    const expenseRequest = expenseStore.getAll();
    
    let monthsSet = new Set();
    const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    salesRequest.onsuccess = () => {
        salesRequest.result.forEach(sale => {
            if (sale.year == year) {
                monthsSet.add(sale.month);
            }
        });
    };
    
    expenseRequest.onsuccess = () => {
        expenseRequest.result.forEach(expense => {
            if (expense.year == year) {
                monthsSet.add(expense.month);
            }
        });
        
        // Sort months
        const months = Array.from(monthsSet).sort((a, b) => a - b);
        
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = monthNames[month];
            monthSelect.appendChild(option);
        });
    };
}

function populateDays(year, month) {
    const daySelect = document.getElementById('historyDay');
    daySelect.innerHTML = '<option value="">-- Select Day --</option>';
    
    if (!year || !month) return;
    
    const tx = db.transaction(['sales', 'expense'], 'readonly');
    const salesStore = tx.objectStore('sales');
    const expenseStore = tx.objectStore('expense');
    
    const salesRequest = salesStore.getAll();
    const expenseRequest = expenseStore.getAll();
    
    let daysSet = new Set();
    
    salesRequest.onsuccess = () => {
        salesRequest.result.forEach(sale => {
            if (sale.year == year && sale.month == month) {
                daysSet.add(sale.day);
            }
        });
    };
    
    expenseRequest.onsuccess = () => {
        expenseRequest.result.forEach(expense => {
            if (expense.year == year && expense.month == month) {
                daysSet.add(expense.day);
            }
        });
        
        // Sort days
        const days = Array.from(daysSet).sort((a, b) => a - b);
        
        days.forEach(day => {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = String(day).padStart(2, '0');
            daySelect.appendChild(option);
        });
    };
}

function updateHistoryDisplay() {
    const year = document.getElementById('historyYear').value;
    const month = document.getElementById('historyMonth').value;
    const day = document.getElementById('historyDay').value;
    
    if (!year) {
        document.getElementById('historySummary').innerHTML = '<p style="margin: 0; color: #666;">Select a year to view details</p>';
        salesOverlayList.innerHTML = '';
        return;
    }
    
    const tx = db.transaction(['sales', 'expense'], 'readonly');
    const salesStore = tx.objectStore('sales');
    const expenseStore = tx.objectStore('expense');
    
    const salesRequest = salesStore.getAll();
    const expenseRequest = expenseStore.getAll();
    
    let allSales = [];
    let allExpenses = [];
    
    salesRequest.onsuccess = () => {
        allSales = salesRequest.result;
    };
    
    expenseRequest.onsuccess = () => {
        allExpenses = expenseRequest.result;
        
        // Filter based on selections
        let filteredSales = allSales.filter(sale => sale.year == year);
        let filteredExpenses = allExpenses.filter(expense => expense.year == year);
        
        let periodLabel = `Year ${year}`;
        
        if (month) {
            filteredSales = filteredSales.filter(sale => sale.month == month);
            filteredExpenses = filteredExpenses.filter(expense => expense.month == month);
            
            const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            periodLabel = `${monthNames[month]} ${year}`;
            
            if (day) {
                filteredSales = filteredSales.filter(sale => sale.day == day);
                filteredExpenses = filteredExpenses.filter(expense => expense.day == day);
                periodLabel = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
            }
        }
        
        displayHistoryResults(filteredSales, filteredExpenses, periodLabel);
    };
}

function displayHistoryResults(sales, expenses, periodLabel) {
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalSalesQty = sales.reduce((sum, sale) => sum + sale.qtySold, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const profit = totalSales - totalExpenses;
    
    document.getElementById('historySummary').innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">Total Sales</p>
                <p style="margin: 0.5rem 0 0 0; font-size: 1.5rem; font-weight: bold;">₦${totalSales.toLocaleString()}</p>
            </div>
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 1.5rem; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);">
                <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">Total Expenses</p>
                <p style="margin: 0.5rem 0 0 0; font-size: 1.5rem; font-weight: bold;">₦${totalExpenses.toLocaleString()}</p>
            </div>
            <div style="background: linear-gradient(135deg, ${profit > 0 ? '#56ab2f 0%, #a8e063 100%' : profit < 0 ? '#eb3349 0%, #f45c43 100%' : '#f5a623 0%, #ffd700 100%'}); padding: 1rem; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);">
                <p style="margin: 0; font-size: 0.85rem; opacity: 0.9;">Net Profit</p>
                <p style="margin: 0.5rem 0 0 0; font-size: 1.3rem; font-weight: bold;">₦${profit.toLocaleString()}</p>
            </div>
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 1rem; border-radius: 12px; color: white; box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);">
                <p style="margin: 0; font-size: 0.85rem; opacity: 0.9;">Total Qty Sold</p>
                <p style="margin: 0.5rem 0 0 0; font-size: 1.3rem; font-weight: bold;">${totalSalesQty.toFixed(2)}</p>
            </div>
        </div>
    `;
    
    // Display transactions
    salesOverlayList.innerHTML = '<h3 style="margin-top: 1.5rem; margin-bottom: 1rem; color: #333;">📊 ' + periodLabel + '</h3>';
    
    if (sales.length === 0 && expenses.length === 0) {
        salesOverlayList.innerHTML += '<p style="color: #999;">No transactions found for this period</p>';
        return;
    }
    
    // Combine and sort all transactions by date and time
    const allTransactions = [
        ...sales.map(s => ({ ...s, type: 'sale', timestamp: new Date(s.year, s.month - 1, s.day).getTime() })),
        ...expenses.map(e => ({ ...e, type: 'expense', timestamp: new Date(e.year, e.month - 1, e.day).getTime() }))
    ].sort((a, b) => b.timestamp - a.timestamp);
    
    allTransactions.forEach(transaction => {
        const div = document.createElement('div');
        div.style.cssText = 'padding: 1rem; background: white; border-left: 4px solid ' + 
            (transaction.type === 'sale' ? '#4CAF50' : '#FF6B6B') + '; margin-bottom: 0.5rem; border-radius: 4px;';
        
        if (transaction.type === 'sale') {
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="color: #4CAF50;">📈 Sale</strong>
                        <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #666;">${transaction.dateString} ${transaction.time} | ${transaction.paymentType}</p>
                    </div>
                    <div style="text-align: right;">
                        <strong style="font-size: 1.1rem;">₦${transaction.totalAmount.toLocaleString()}</strong>
                        <p style="margin: 0.3rem 0 0 0; font-size: 0.9rem; color: #666;">${transaction.qtySold.toFixed(2)} KG</p>
                    </div>
                </div>
            `;
        } else {
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="color: #FF6B6B;">💸 Expense</strong>
                        <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: #666;">${transaction.dateString} ${transaction.time} | ${transaction.reason}</p>
                    </div>
                    <div style="text-align: right;">
                        <strong style="font-size: 1.1rem; color: #FF6B6B;">-₦${transaction.amount.toLocaleString()}</strong>
                        <p style="margin: 0.3rem 0 0 0; font-size: 0.9rem; color: #666;">${transaction.paymentType}</p>
                    </div>
                </div>
            `;
        }
        
        salesOverlayList.appendChild(div);
    });
}

// Close overlay button
closeSalesOverlay.addEventListener('click', () => {
    salesOverlay.classList.add('hidden');
});
