'use strict';

/* ── Data ──────────────────────────────────────────────── */
const ROOMS = {
  deluxe:    { label: 'Deluxe Room',      price: 280  },
  suite:     { label: 'Suite',            price: 520  },
  penthouse: { label: 'Penthouse Suite',  price: 1200 },
};

/* ── State ─────────────────────────────────────────────── */
const state = {
  roomKey:  'deluxe',
  guests:   2,
  checkin:  '',
  checkout: '',
};

/* ── DOM refs ──────────────────────────────────────────── */
const body           = document.body;
const themeToggle    = document.getElementById('themeToggle');
const themeLabel     = document.getElementById('themeLabel');
const roomsList      = document.getElementById('roomsList');
const roomSelector   = document.getElementById('roomSelector');
const checkinEl      = document.getElementById('checkin');
const checkoutEl     = document.getElementById('checkout');
const guestCountEl   = document.getElementById('guestCount');
const guestMinusBtn  = document.getElementById('guestMinus');
const guestPlusBtn   = document.getElementById('guestPlus');
const widgetPriceEl  = document.getElementById('widgetPrice');
const breakdownLabel = document.getElementById('breakdownLabel');
const breakdownSub   = document.getElementById('breakdownSubtotal');
const breakdownTax   = document.getElementById('breakdownTax');
const breakdownTotal = document.getElementById('breakdownTotal');
const bookingForm    = document.getElementById('bookingForm');
const overlay        = document.getElementById('confirmationOverlay');
const btnDone        = document.getElementById('btnDone');
const confirmIdEl    = document.getElementById('confirmId');
const confirmRoomEl  = document.getElementById('confirmRoom');
const confirmCheckin = document.getElementById('confirmCheckin');
const confirmCheckout= document.getElementById('confirmCheckout');
const confirmGuests  = document.getElementById('confirmGuests');
const confirmTotal   = document.getElementById('confirmTotal');

/* ── Theme ─────────────────────────────────────────────── */
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);
}

function applyTheme(theme) {
  body.setAttribute('data-theme', theme);
  themeLabel.textContent = theme === 'dark' ? 'Light' : 'Dark';
}

themeToggle.addEventListener('click', () => {
  const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
});

/* ── Room Selection ────────────────────────────────────── */
function selectRoom(key) {
  state.roomKey = key;

  /* Update detail cards */
  roomsList.querySelectorAll('.room-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.room === key);
  });

  /* Update radio options */
  roomSelector.querySelectorAll('.radio-option').forEach(opt => {
    const radio = opt.querySelector('input[type="radio"]');
    const isMatch = radio.value === key;
    radio.checked = isMatch;
    opt.classList.toggle('selected', isMatch);
  });

  updatePriceDisplay();
}

/* Click on room cards (left column) */
roomsList.addEventListener('click', e => {
  const card = e.target.closest('.room-card');
  if (!card) return;
  selectRoom(card.dataset.room);
});

/* Click on radio options inside widget */
roomSelector.addEventListener('change', e => {
  if (e.target.name === 'roomType') selectRoom(e.target.value);
});

/* ── Guest Counter ─────────────────────────────────────── */
function updateGuestButtons() {
  guestMinusBtn.disabled = state.guests <= 1;
  guestPlusBtn.disabled  = state.guests >= 10;
  guestCountEl.textContent = state.guests;
}

guestMinusBtn.addEventListener('click', () => {
  if (state.guests > 1) { state.guests--; updateGuestButtons(); }
});

guestPlusBtn.addEventListener('click', () => {
  if (state.guests < 10) { state.guests++; updateGuestButtons(); }
});

/* ── Date Inputs ───────────────────────────────────────── */
function todayStr() {
  /* toISOString يرجّع تاريخ UTC — بعد منتصف الليل محليًا يعطي تاريخ الأمس */
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function setDateMin() {
  const today = todayStr();
  checkinEl.min = today;
  checkoutEl.min = today;
}

checkinEl.addEventListener('change', () => {
  state.checkin = checkinEl.value;
  /* Ensure checkout is after checkin */
  if (state.checkin) {
    checkoutEl.min = state.checkin;
    if (state.checkout && state.checkout <= state.checkin) {
      checkoutEl.value = '';
      state.checkout = '';
    }
  }
  updatePriceDisplay();
});

checkoutEl.addEventListener('change', () => {
  state.checkout = checkoutEl.value;
  updatePriceDisplay();
});

/* ── Price Calculation ─────────────────────────────────── */
function getNights() {
  if (!state.checkin || !state.checkout) return 1;
  const diff = (new Date(state.checkout) - new Date(state.checkin)) / 86400000;
  return diff > 0 ? diff : 1;
}

function fmt(n) {
  return '$' + n.toLocaleString('en-US');
}

function updatePriceDisplay() {
  const room   = ROOMS[state.roomKey];
  const nights = getNights();
  const sub    = room.price * nights;
  const tax    = Math.round(sub * 0.15);
  const total  = sub + tax;

  widgetPriceEl.textContent     = fmt(room.price);
  breakdownLabel.textContent    = `${fmt(room.price)} × ${nights} night${nights !== 1 ? 's' : ''}`;
  breakdownSub.textContent      = fmt(sub);
  breakdownTax.textContent      = fmt(tax);
  breakdownTotal.textContent    = fmt(total);
}

/* ── Form Validation ───────────────────────────────────── */
function validate() {
  let valid = true;

  const fieldCheckin  = document.getElementById('fieldCheckin');
  const fieldCheckout = document.getElementById('fieldCheckout');
  const fieldGuests   = document.getElementById('fieldGuests');

  /* Check-in */
  if (!checkinEl.value) {
    fieldCheckin.classList.add('has-error');
    valid = false;
  } else {
    fieldCheckin.classList.remove('has-error');
  }

  /* Check-out */
  if (!checkoutEl.value) {
    fieldCheckout.classList.add('has-error');
    valid = false;
  } else {
    fieldCheckout.classList.remove('has-error');
  }

  /* Guests (can't really be zero given counter, but guard anyway) */
  if (state.guests < 1) {
    fieldGuests.classList.add('has-error');
    valid = false;
  } else {
    fieldGuests.classList.remove('has-error');
  }

  return valid;
}

/* Clear error on input */
checkinEl.addEventListener('change',  () => document.getElementById('fieldCheckin').classList.remove('has-error'));
checkoutEl.addEventListener('change', () => document.getElementById('fieldCheckout').classList.remove('has-error'));

/* ── Form Submit ───────────────────────────────────────── */
bookingForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!validate()) return;
  showConfirmation();
});

/* ── Confirmation ──────────────────────────────────────── */
function generateBookingId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'OBH-';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m,10)-1]} ${parseInt(d,10)}, ${y}`;
}

function showConfirmation() {
  const room   = ROOMS[state.roomKey];
  const nights = getNights();
  const sub    = room.price * nights;
  const tax    = Math.round(sub * 0.15);
  const total  = sub + tax;

  confirmIdEl.textContent      = generateBookingId();
  confirmRoomEl.textContent    = room.label;
  confirmCheckin.textContent   = formatDate(state.checkin);
  confirmCheckout.textContent  = formatDate(state.checkout);
  confirmGuests.textContent    = `${state.guests} guest${state.guests !== 1 ? 's' : ''}`;
  confirmTotal.textContent     = fmt(total);

  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  btnDone.focus();
}

function closeConfirmation() {
  overlay.hidden = true;
  document.body.style.overflow = '';
  bookingForm.reset();
  state.checkin  = '';
  state.checkout = '';
  /* reset() ما يمسّ العدّاد ولا roomKey لأنهما خارج حقول النموذج */
  state.guests  = 2;
  state.roomKey = 'deluxe';
  updateGuestButtons();
  checkoutEl.min = todayStr();
  selectRoom(state.roomKey); /* يحدّث الاختيار والسعر معًا */
}

btnDone.addEventListener('click', closeConfirmation);

/* Close on backdrop click */
overlay.addEventListener('click', e => {
  if (e.target === overlay) closeConfirmation();
});

/* Close on Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !overlay.hidden) closeConfirmation();
});

/* ── Init ──────────────────────────────────────────────── */
initTheme();
setDateMin();
updateGuestButtons();
updatePriceDisplay();
