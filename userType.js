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
    loadUserType(); // Load saved item type on page load
}

const itemTypeSelect = document.getElementById('itemType');
const saveItemSettingsBtn = document.getElementById('saveItemSettings');
const menuQtyInput = document.getElementById('menuQty');
const qtyLabel = document.getElementById('qtyLabel');
const remainingQtyDisplay = document.getElementById('remainingQty');
const remainingUnitDisplay = document.getElementById('remainingUnit');
const stockLabel = document.getElementById('stockLabel');
const headerElement = document.querySelector('header');
const headerTitle = document.querySelector('header h1');

const itemUnits = {
    'gas': { name: '🔥 Gas', unit: 'KG', headerColor: 'gas' },
    'egg': { name: '🥚 Egg', unit: 'Crates', headerColor: 'egg' },
    'water': { name: '💧 Water', unit: 'Packs', headerColor: 'water' }
};

// Save item type and default qty
saveItemSettingsBtn.addEventListener('click', () => {
    const itemType = itemTypeSelect.value;
    const defaultQty = parseFloat(menuQtyInput.value);
    
    if (!itemType) {
        alert('Please select an item type');
        return;
    }
    
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    
    // Save item type
    const itemTypeData = {
        key: 'itemType',
        value: itemType
    };
    
    // Save default qty
    const defaultQtyData = {
        key: 'defaultQty',
        value: defaultQty || 0
    };
    
    store.put(itemTypeData);
    store.put(defaultQtyData);
    
    tx.oncomplete = () => {
        alert(`Settings saved!\nItem: ${itemUnits[itemType].name}\nDefault Qty: ${defaultQty || 'Not set'}`);
        updateQtyLabel(itemType);
        updateStockDisplay(itemType);
        updateHeader(itemType);
    };
    
    tx.onerror = () => {
        alert('Error saving settings');
    };
});

// Load user's selected item type
function loadUserType() {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const itemTypeRequest = store.get('itemType');
    
    itemTypeRequest.onsuccess = () => {
        const itemTypeResult = itemTypeRequest.result;
        if (itemTypeResult) {
            itemTypeSelect.value = itemTypeResult.value;
            updateQtyLabel(itemTypeResult.value);
            updateStockDisplay(itemTypeResult.value);
            updateHeader(itemTypeResult.value);
        }
    };
}

// Update stock display with remaining qty
export function updateStockDisplay(itemType) {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const qtyRequest = store.get('defaultQty');
    
    qtyRequest.onsuccess = () => {
        const qtyResult = qtyRequest.result;
        const qty = qtyResult ? qtyResult.value : 0;
        const unit = itemUnits[itemType].unit;
        
        remainingQtyDisplay.textContent = qty.toFixed(2);
        remainingUnitDisplay.textContent = unit;
        stockLabel.textContent = `Remaining ${itemUnits[itemType].name}:`;
    };
}

// Update the quantity label based on item type
function updateQtyLabel(itemType) {
    const unit = itemUnits[itemType];
    qtyLabel.textContent = `${unit.name} Qty Sold (${unit.unit})`;
}

// Update header title and background color based on item type
function updateHeader(itemType) {
    const unit = itemUnits[itemType];
    headerTitle.textContent = `${unit.name} Sales Manager`;
    
    // Remove all header color classes and add the new one
    headerElement.classList.remove('header-gas', 'header-egg', 'header-water');
    headerElement.classList.add(`header-${itemType}`);
}

// Export function for other files to use
export function getCurrentUnit() {
    return new Promise((resolve) => {
        const tx = db.transaction('settings', 'readonly');
        const store = tx.objectStore('settings');
        const getRequest = store.get('itemType');
        
        getRequest.onsuccess = () => {
            const result = getRequest.result;
            const itemType = result ? result.value : 'gas';
            resolve(itemUnits[itemType]);
        };
    });
}

export function getItemUnits() {
    return itemUnits;
}
