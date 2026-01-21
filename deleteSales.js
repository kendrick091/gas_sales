import { DB_NAME, DB_VERSION } from "./app.js";
import { refreshDailyProfit } from "./dailyProfit.js";
import { updateStockDisplay } from "./userType.js";

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

export function deleteSale(sale) {
    const today = new Date().toLocaleDateString();
    
    // Check if the sale is from today
    if (sale.dateString !== today) {
        alert('⚠️ You can only delete today\'s sales!');
        return;
    }
    
    const confirmDelete = confirm('⚠️ Are you sure you want to delete this sale? This will restore the stock.');
    
    if (!confirmDelete) {
        return;
    }

    const qtyToRestore = sale.qtySold;
    const saleId = sale.id;

    // Delete the sale using the unique ID
    const tx = db.transaction('sales', 'readwrite');
    const store = tx.objectStore('sales');
    
    // Use openCursor to find and delete by ID
    const cursorRequest = store.openCursor();
    let found = false;

    cursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            if (cursor.value.id === saleId) {
                found = true;
                cursor.delete();
                
                // After deletion, restore the stock
                const settingsTx = db.transaction('settings', 'readwrite');
                const settingsStore = settingsTx.objectStore('settings');
                const getRequest = settingsStore.get('defaultQty');

                getRequest.onsuccess = () => {
                    const currentStock = getRequest.result?.value || 0;
                    const restoredStock = currentStock + qtyToRestore;

                    const updateSetting = {
                        key: 'defaultQty',
                        value: restoredStock
                    };

                    settingsStore.put(updateSetting).onsuccess = () => {
                        // Get current item type to update stock display
                        const itemTypeTx = db.transaction('settings', 'readonly');
                        const itemTypeStore = itemTypeTx.objectStore('settings');
                        const itemTypeRequest = itemTypeStore.get('itemType');

                        itemTypeRequest.onsuccess = () => {
                            const itemType = itemTypeRequest.result?.value || 'gas';
                            updateStockDisplay(itemType);
                            
                            // Refresh daily profit
                            refreshDailyProfit();
                            
                            alert(`✓ Sale deleted successfully!\nStock restored: +${qtyToRestore.toFixed(2)}`);
                        };
                    };
                };
            } else {
                cursor.continue();
            }
        } else {
            if (!found) {
                alert('Sale not found');
            }
        }
    };

    cursorRequest.onerror = () => {
        alert('Error deleting sale');
    };
}
