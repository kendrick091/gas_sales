const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');
const menuOverlay = document.getElementById('menuOverlay');

const priceInput = document.getElementById('pricePerKg');
const menuPrice = document.getElementById('menuPrice');

function openMenu() {
  sideMenu.classList.remove('hidden');
  menuOverlay.classList.remove('hidden');
}

function closeMenu() {
  sideMenu.classList.add('hidden');
  menuOverlay.classList.add('hidden');
}

// Toggle menu
menuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = !sideMenu.classList.contains('hidden');
  isOpen ? closeMenu() : openMenu();
});

// Click overlay closes menu
menuOverlay.addEventListener('click', closeMenu);

// Prevent clicks inside menu from closing it
sideMenu.addEventListener('click', (e) => e.stopPropagation());

