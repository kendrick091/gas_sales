import { DB_NAME, DB_VERSION } from "./app.js";
import { refreshDailyProfit, refreshAllTimeProfit } from "./dailyProfit.js";
import { getCurrentUnit, updateStockDisplay } from "./userType.js";

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

let total = 0;

const pricePerKg = document.getElementById('pricePerKg');
const qtySold = document.getElementById('qtySold');
const totalAmount = document.getElementById('totalAmount');
const calculateBtn = document.getElementById('calculate');
const saveSaleBtn = document.getElementById('saveSale');

function calculateTotal() {
  const price = Number(pricePerKg.value);
  const qty = Number(qtySold.value);

  if (!price || !qty) {
    alert('Enter valid values');
    return;
  }

  total = price * qty;
  totalAmount.innerText = `₦${total.toLocaleString()}`;

  saveSetting('pricePerKg', price); // remember price
}

calculateBtn.addEventListener('click', calculateTotal);

function saveSetting(key, value) {
  const tx = db.transaction('fixprice', 'readwrite');
  const store = tx.objectStore('fixprice'); 

  const setting = { key, value };
  const request = store.put(setting);

  request.onsuccess = () => {
    console.log('Setting saved successfully');
  };
  request.onerror = () => {
    console.error('Error saving setting');
  };
}

saveSaleBtn.addEventListener('click', async () => {
  if (total === 0) {
    alert('Calculate total before saving');
    return;
  }
  
  const paymentTypeValue = document.getElementById('paymentType').value;
  if (!paymentTypeValue) {
    alert('Please select a payment type (Cash or Transfer)');
    return;
  }
  
  // Check if stock is available
  const checkStockTx = db.transaction('settings', 'readonly');
  const checkStockStore = checkStockTx.objectStore('settings');
  const checkStockRequest = checkStockStore.get('defaultQty');
  
  checkStockRequest.onsuccess = () => {
    const currentStock = checkStockRequest.result?.value || 0;
    
    if (currentStock === 0) {
      alert('⚠️ No stock available! Cannot make a sale.');
      return;
    }
    
    const qtyToSell = Number(qtySold.value);
    
    if (qtyToSell > currentStock) {
      alert(`⚠️ Insufficient stock! Available: ${currentStock.toFixed(2)}`);
      return;
    }
  
    const tx = db.transaction('sales', 'readwrite');
    const store = tx.objectStore('sales');
    const now = new Date();

const saleRecord = {
  id: now.getTime() + Math.random(),              // Unique ID for deletion
  year: now.getFullYear(),                       // 2026
  month: now.getMonth() + 1,                     // 1-12 (add 1 because getMonth() is 0-indexed)
  day: now.getDate(),                            // 1-31
  dateString: now.toLocaleDateString(),          // "1/20/2026" (optional for display)
  time: now.toLocaleTimeString(),                // "10:45:30 AM"
  pricePerKg: Number(pricePerKg.value),
  qtySold: qtyToSell,
  paymentType: paymentTypeValue,
  totalAmount: total
};
    const request = store.add(saleRecord);

    request.onsuccess = () => {
      console.log('Sale record saved successfully!');
      // Reset inputs
      qtySold.value = '';
      totalAmount.innerText = '₦0';
      document.getElementById('paymentType').value = '';
      total = 0;
      
      // Reduce default qty from settings
      const settingsTx = db.transaction('settings', 'readwrite');
      const settingsStore = settingsTx.objectStore('settings');
      const getRequest = settingsStore.get('defaultQty');
      
      getRequest.onsuccess = () => {
        const currentDefaultQty = getRequest.result?.value || 0;
        const newDefaultQty = currentDefaultQty - qtyToSell;
        
        const updateSetting = {
          key: 'defaultQty',
          value: newDefaultQty < 0 ? 0 : newDefaultQty
        };
        
        settingsStore.put(updateSetting).onsuccess = () => {
          // Get current item type to update stock display
          const itemTypeTx = db.transaction('settings', 'readonly');
          const itemTypeStore = itemTypeTx.objectStore('settings');
          const itemTypeRequest = itemTypeStore.get('itemType');
          
          itemTypeRequest.onsuccess = () => {
            const itemType = itemTypeRequest.result?.value || 'gas';
            updateStockDisplay(itemType);
          };
        };
      };
      
      refreshDailyProfit(); // Refresh the daily profit display
      refreshAllTimeProfit(); // Refresh the all-time profit display
    };
    request.onerror = () => {
      alert('Error saving sale record.');
    };
  };
});