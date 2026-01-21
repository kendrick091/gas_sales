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

const todaySalesList = document.getElementById('todaySalesList');

function getTodaySales() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    const salesTx = db.transaction('sales', 'readonly');
    const salesStore = salesTx.objectStore('sales');
    const dateIndex = salesStore.index('date');
    const range = IDBKeyRange.only(todayStr);
    const getRequest = dateIndex.openCursor(range);
    const sales = [];

    getRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            sales.push(cursor.value);
            cursor.continue();
        } else {
            displayTodaySales(sales);
        }
    };
    getRequest.onerror = () => {
        console.error('Error fetching today\'s sales');
    };
}

function displayTodaySales(sales) {
    todaySalesList.innerHTML = '';
    if (sales.length === 0) {
        todaySalesList.innerHTML = '<p>No sales yet</p>';
        return;
    }
    sales.forEach(sale => {
        const saleItem = document.createElement('div');
        saleItem.className = 'sale-item';
        saleItem.innerHTML = `
            <p><strong>Time:</strong> ${new Date(sale.dateTime).toLocaleTimeString()}</p>
            <p><strong>Weight Sold:</strong> ${sale.qtySold} kg</p>
            <p><strong>Total Amount:</strong> ₦${sale.totalAmount.toLocaleString()}</p>
            <hr>
        `;
        todaySalesList.appendChild(saleItem);
    });
}
