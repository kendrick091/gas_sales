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
