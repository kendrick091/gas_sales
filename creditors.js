import { DB_NAME, DB_VERSION } from "./app.js";

let db;

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onsuccess = (event) => {
  db = event.target.result;
};

const btnCreditors = document.getElementById('btnCreditors');
const salesOverlay = document.getElementById('salesOverlay');
const salesOverlayList = document.getElementById('salesOverlayList');
const overlayTitle = document.getElementById('overlayTitle');
const overlayTotal = document.getElementById('overlayTotal');

btnCreditors.addEventListener('click', showCreditorsMenu);

/* ===============================
   CREDITORS MENU
================================ */
function showCreditorsMenu() {
  overlayTitle.textContent = "Creditors";
  overlayTotal.innerHTML = '';

  salesOverlayList.innerHTML = `
    <div style="padding:1rem">
      <button id="viewCreditors" style="width:100%;padding:.75rem;background:#2196F3;color:#fff;border:none;border-radius:4px;margin-bottom:.5rem">
        View Creditors
      </button>
      <button id="addCreditor" style="width:100%;padding:.75rem;background:#4CAF50;color:#fff;border:none;border-radius:4px">
        Add Creditor
      </button>
    </div>
  `;

  salesOverlay.classList.remove('hidden');

  document.getElementById('viewCreditors').onclick = showCreditorsList;
  document.getElementById('addCreditor').onclick = showAddCreditorForm;
}

/* ===============================
   ADD CREDITOR FORM
================================ */
function showAddCreditorForm() {
  overlayTitle.textContent = "Add Creditor";

  salesOverlayList.innerHTML = `
    <div style="padding:1rem">
      <input id="creditorName" placeholder="Customer Name" style="width:100%;margin-bottom:.5rem;padding:.5rem">
      
      <select id="creditItem" style="width:100%;margin-bottom:.5rem;padding:.5rem">
        <option value="gas">Gas</option>
        <option value="egg">Egg</option>
        <option value="water">Water</option>
      </select>

      <input id="creditQty" type="number" placeholder="Quantity" style="width:100%;margin-bottom:.5rem;padding:.5rem">
      <input id="creditAmount" type="number" placeholder="Amount Owed (₦)" style="width:100%;margin-bottom:.5rem;padding:.5rem">

      <button id="saveCreditor" style="width:100%;background:#4CAF50;color:white;border:none;padding:.75rem;border-radius:4px">
        Save Creditor
      </button>
    </div>
  `;

  document.getElementById('saveCreditor').onclick = saveCreditor;
}

/* ===============================
   SAVE CREDITOR
================================ */
function saveCreditor() {
  const name = creditorName.value.trim();
  const item = creditItem.value;
  const qty = Number(creditQty.value);
  const amount = Number(creditAmount.value);

  if (!name || !item || qty <= 0 || amount <= 0) {
    alert('Please fill all fields correctly');
    return;
  }

  const tx = db.transaction('creditors', 'readwrite');
  const store = tx.objectStore('creditors');

  const now = new Date();

  store.add({
    name,
    item,
    qty,
    amount,
    date: now.toLocaleDateString(),
    timestamp: now.getTime(),
    paid: false
  });

  tx.oncomplete = () => {
    alert('Creditor saved');
    showCreditorsList();
  };
}

/* ===============================
   VIEW CREDITORS
================================ */
function showCreditorsList() {
  overlayTitle.textContent = "All Creditors";

  const tx = db.transaction('creditors', 'readonly');
  const store = tx.objectStore('creditors');
  const req = store.getAll();

  req.onsuccess = () => {
    const creditors = req.result;

    salesOverlayList.innerHTML = '';
    overlayTotal.innerHTML = `Total Owed: ₦${creditors.reduce((s,c)=>s+c.amount,0).toLocaleString()}`;

    if (!creditors.length) {
      salesOverlayList.innerHTML = '<p>No creditors found</p>';
      return;
    }

    creditors.sort((a,b)=>b.timestamp-a.timestamp);

    creditors.forEach(c => {
      const div = document.createElement('div');
      div.className = 'saleItem';

      div.innerHTML = `
      <span style="color:#ee45dd; font-weight:bold">
          ${c.date.toLocaleString()}
        </span>
        <strong>${c.name}</strong><br>
        ${c.item.toUpperCase()} • Qty: ${c.qty}<br>
        <span style="color:#e53935;font-weight:bold">
          ₦${c.amount.toLocaleString()}
        </span>
        
        <button style="margin-top:.5rem;width: 75px;
        background:#e53935;color:#fff;border:none;padding:.4rem"
          onclick="deleteCreditor(${c.id})">
          🗑 Delete
        </button>
      `;

      salesOverlayList.appendChild(div);
    });
  };
}

/* ===============================
   DELETE CREDITOR (GLOBAL)
================================ */
window.deleteCreditor = function(id) {
  if (!confirm('Delete this creditor?')) return;

  const tx = db.transaction('creditors','readwrite');
  tx.objectStore('creditors').delete(id);

  tx.oncomplete = showCreditorsList;
};
