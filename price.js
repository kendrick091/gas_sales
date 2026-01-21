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
    loadSavedPrice();
}

const priceInput = document.getElementById('menuPrice');
const savePriceBtn = document.getElementById('savePrice');
const pricePerKgInput = document.getElementById('pricePerKg');

function loadSavedPrice() {
const fixPriceTx = db.transaction('fixprice', 'readonly');
const fixPriceStore = fixPriceTx.objectStore('fixprice');
const getPriceRequest = fixPriceStore.get('pricePerKg');

getPriceRequest.onsuccess = () => {
    const result = getPriceRequest.result;
    if (result) {
        priceInput.value = result.value;
        pricePerKgInput.value = result.value;
    }
};
}


savePriceBtn.addEventListener('click', () =>{
    const priceValue = parseFloat(priceInput.value);
    if (isNaN(priceValue)) {
        alert('Please enter a valid number for the price.');
        return;
    }
    const tx = db.transaction('fixprice', 'readwrite');
    const fixPriceStore = tx.objectStore('fixprice');
    
    const priceSetting = { 
        key: 'pricePerKg',
        value: priceValue 
    };

    const request = fixPriceStore.put(priceSetting);

    request.onsuccess = () => {
        alert('Price saved successfully!');
    };
    request.onerror = () => {
        alert('Error saving price.');
    };
});
