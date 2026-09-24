const STORAGE_KEY = "patient-address-book:v1";

const state = {
  patients: loadPatients(),
  editingId: null,
  sortAscending: true
};

const els = {
  list: document.getElementById("patientList"),
  empty: document.getElementById("emptyState"),
  search: document.getElementById("searchInput"),
  clearSearch: document.getElementById("clearSearch"),
  count: document.getElementById("patientCount"),
  addressCount: document.getElementById("withAddressCount"),
  dialog: document.getElementById("patientDialog"),
  form: document.getElementById("patientForm"),
  dialogTitle: document.getElementById("dialogTitle"),
  dialogEyebrow: document.getElementById("dialogEyebrow"),
  saveText: document.getElementById("saveButtonText"),
  id: document.getElementById("patientId"),
  name: document.getElementById("nameInput"),
  country: document.getElementById("countryCode"),
  phone: document.getElementById("phoneInput"),
  address: document.getElementById("addressInput"),
  warning: document.getElementById("formDuplicateWarning"),
  banner: document.getElementById("duplicateBanner"),
  toast: document.getElementById("toast")
};

function loadPatients() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.patients));
}

function normalizeName(value) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizePhone(raw, countryCode = "+91") {
  const text = String(raw || "").trim();
  if (!text) return "";
  if (text.startsWith("+")) return digitsOnly(text);
  const localDigits = digitsOnly(text);
  const codeDigits = digitsOnly(countryCode);
  return codeDigits + localDigits;
}

function displayPhone(patient) {
  return patient.displayPhone || patient.phone;
}

function whatsappUrl(patient) {
  const digits = patient.phone;
  if (!digits || digits.length < 8) return null;
  return "https://wa.me/" + digits;
}

function findDuplicates(name, phone, excludeId = null) {
  const n = normalizeName(name);
  const p = digitsOnly(phone);
  return state.patients.filter(patient => {
    if (patient.id === excludeId) return false;
    return normalizeName(patient.name) === n || digitsOnly(patient.phone) === p;
  });
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function render() {
  const query = els.search.value.trim().toLocaleLowerCase();
  const queryDigits = digitsOnly(query);

  let patients = state.patients.filter(patient => {
    if (!query) return true;
    return normalizeName(patient.name).includes(query) ||
      digitsOnly(patient.phone).includes(queryDigits);
  });

  patients.sort((a, b) => {
    const comparison = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    return state.sortAscending ? comparison : -comparison;
  });

  els.list.innerHTML = patients.map(patientCard).join("");
  els.empty.classList.toggle("hidden", state.patients.length > 0 || query.length > 0);
  if (state.patients.length === 0 || (query && patients.length === 0)) {
    els.list.innerHTML = "";
  }

  if (query && patients.length === 0 && state.patients.length > 0) {
    els.list.innerHTML = `
      <div class="empty glass">
        <div class="empty-icon">⌕</div>
        <h3>No matching patients</h3>
        <p>Try another part of the name or phone number.</p>
      </div>`;
  }

  els.count.textContent = state.patients.length;
  els.addressCount.textContent = state.patients.filter(p => p.address?.trim()).length;
  els.clearSearch.classList.toggle("hidden", !els.search.value);
  updateDuplicateBanner();
}

function patientCard(patient) {
  const wa = whatsappUrl(patient);
  return `
    <article class="patient-card glass">
      <div class="avatar">${escapeHtml(initials(patient.name))}</div>
      <div class="patient-main">
        <h3 class="patient-name">${escapeHtml(patient.name)}</h3>
        <div class="patient-meta">
          <span>☎ ${escapeHtml(displayPhone(patient))}</span>
          ${wa ? "<span>WhatsApp ready</span>" : ""}
        </div>
        ${patient.address ? `<p class="address">${escapeHtml(patient.address)}</p>` : ""}
      </div>
      <div class="card-actions">
        ${wa ? `<button class="action whatsapp" data-action="whatsapp" data-id="${patient.id}" title="Open WhatsApp">WhatsApp</button>` : ""}
        <button class="action" data-action="edit" data-id="${patient.id}" title="Edit patient">Edit</button>
        <button class="action delete" data-action="delete" data-id="${patient.id}" title="Delete patient">Delete</button>
      </div>
    </article>`;
}

function updateDuplicateBanner() {
  const name = els.name.value;
  const phone = normalizePhone(els.phone.value, els.country.value);
  const matches = name || phone ? findDuplicates(name, phone, state.editingId) : [];
  if (matches.length) {
    els.banner.classList.remove("hidden");
    els.banner.textContent = `Possible duplicate: ${matches.map(m => m.name).join(", ")}. Check the existing record before adding another.`;
  } else {
    els.banner.classList.add("hidden");
  }
}

function updateFormWarning() {
  const name = els.name.value;
  const phone = normalizePhone(els.phone.value, els.country.value);
  const matches = name || phone ? findDuplicates(name, phone, state.editingId) : [];
  if (!matches.length) {
    els.warning.classList.add("hidden");
    els.warning.textContent = "";
    return;
  }
  const nameMatch = matches.find(m => normalizeName(m.name) === normalizeName(name));
  const phoneMatch = matches.find(m => digitsOnly(m.phone) === digitsOnly(phone));
  const reasons = [];
  if (nameMatch) reasons.push(`same name as “${nameMatch.name}”`);
  if (phoneMatch) reasons.push(`same number as “${phoneMatch.name}”`);
  els.warning.classList.remove("hidden");
  els.warning.textContent = "Possible duplicate — " + reasons.join(" and ") + ". Saving is still allowed.";
}

function openAdd() {
  state.editingId = null;
  els.form.reset();
  els.id.value = "";
  els.country.value = "+91";
  els.dialogTitle.textContent = "Add patient";
  els.dialogEyebrow.textContent = "NEW PATIENT";
  els.saveText.textContent = "Save patient";
  els.warning.classList.add("hidden");
  els.dialog.showModal();
  setTimeout(() => els.name.focus(), 50);
}

function openEdit(id) {
  const patient = state.patients.find(p => p.id === id);
  if (!patient) return;
  state.editingId = id;
  els.id.value = id;
  els.name.value = patient.name;
  els.phone.value = patient.inputPhone || patient.displayPhone || patient.phone;
  els.country.value = patient.countryCode || "+91";
  els.address.value = patient.address || "";
  els.dialogTitle.textContent = "Edit patient";
  els.dialogEyebrow.textContent = "EDIT PATIENT";
  els.saveText.textContent = "Save changes";
  updateFormWarning();
  els.dialog.showModal();
  setTimeout(() => els.name.focus(), 50);
}

function closeDialog() {
  els.dialog.close();
  state.editingId = null;
}

function savePatient(event) {
  event.preventDefault();
  const name = els.name.value.trim().replace(/\s+/g, " ");
  const rawPhone = els.phone.value.trim();
  const phone = normalizePhone(rawPhone, els.country.value);
  const address = els.address.value.trim();

  if (!name || !phone) return;

  const existing = state.patients.find(p => p.id === state.editingId);
  const patient = {
    id: state.editingId || crypto.randomUUID(),
    name,
    phone,
    inputPhone: rawPhone,
    displayPhone: rawPhone.startsWith("+") ? rawPhone : `${els.country.value} ${rawPhone}`,
    countryCode: rawPhone.startsWith("+") ? "" : els.country.value,
    address,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const duplicateMatches = findDuplicates(name, phone, state.editingId);
  if (duplicateMatches.length) {
    const names = duplicateMatches.map(p => p.name).join(", ");
    const proceed = window.confirm(`Possible duplicate found: ${names}.\\n\\nDo you want to save this record anyway?`);
    if (!proceed) return;
  }

  if (state.editingId) {
    state.patients = state.patients.map(p => p.id === state.editingId ? patient : p);
    showToast("Patient updated");
  } else {
    state.patients.push(patient);
    showToast("Patient saved");
  }

  persist();
  closeDialog();
  render();
}

function deletePatient(id) {
  const patient = state.patients.find(p => p.id === id);
  if (!patient) return;
  if (!window.confirm(`Delete “${patient.name}” from this device?`)) return;
  state.patients = state.patients.filter(p => p.id !== id);
  persist();
  render();
  showToast("Patient deleted");
}

function openWhatsApp(id) {
  const patient = state.patients.find(p => p.id === id);
  const url = patient && whatsappUrl(patient);
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("show"), 2200);
}

document.getElementById("addTopBtn").addEventListener("click", openAdd);
document.getElementById("emptyAddBtn").addEventListener("click", openAdd);
document.getElementById("closeDialog").addEventListener("click", closeDialog);
document.getElementById("cancelBtn").addEventListener("click", closeDialog);
document.getElementById("sortBtn").addEventListener("click", () => {
  state.sortAscending = !state.sortAscending;
  document.getElementById("sortBtn").innerHTML = state.sortAscending ? "A–Z <span>↕</span>" : "Z–A <span>↕</span>";
  render();
});

els.form.addEventListener("submit", savePatient);
els.search.addEventListener("input", render);
els.clearSearch.addEventListener("click", () => {
  els.search.value = "";
  els.search.focus();
  render();
});
[els.name, els.phone, els.country].forEach(el => el.addEventListener("input", updateFormWarning));
els.country.addEventListener("change", updateFormWarning);

els.phone.addEventListener("input", () => {
  if (els.phone.value.trim().startsWith("+")) {
    els.country.value = "+other";
  }
  updateFormWarning();
});

els.list.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const id = button.dataset.id;
  if (button.dataset.action === "edit") openEdit(id);
  if (button.dataset.action === "delete") deletePatient(id);
  if (button.dataset.action === "whatsapp") openWhatsApp(id);
});

els.dialog.addEventListener("click", event => {
  if (event.target === els.dialog) closeDialog();
});

render();