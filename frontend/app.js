const RESOURCE_CATEGORIES = [
  "Camera & AV Equipment",
  "Musical Instrument",
  "Tool",
  "Stationery",
  "Sports Equipment",
  "Other",
];

const CONDITIONS = ["Excellent", "Good", "Fair", "Needs Repair"];

const VIEWS = {
  dashboard: { title: "Dashboard", el: document.getElementById("view-dashboard") },
  resources: { title: "Resources", el: document.getElementById("view-resources") },
  borrow: { title: "Request borrow", el: document.getElementById("view-borrow") },
  borrowings: { title: "All borrowings", el: document.getElementById("view-borrowings") },
  "my-loans": { title: "My loans", el: document.getElementById("view-my-loans") },
  overdue: { title: "Overdue", el: document.getElementById("view-overdue") },
};

const pageTitle = document.getElementById("pageTitle");
const toastEl = document.getElementById("toast");
const studentIdInput = document.getElementById("studentId");
const dialogNotes = document.getElementById("dialogNotes");
const dialogNotesTitle = document.getElementById("dialogNotesTitle");
const dialogNotesText = document.getElementById("dialogNotesText");

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDatetimeLocalValue(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(
    d.getMinutes()
  )}`;
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const body =
    options.body !== undefined && typeof options.body === "object" && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body;
  const res = await fetch(path, { ...options, headers, body });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && (data.message || data.error)) ||
      (typeof data === "string" ? data : null) ||
      res.statusText;
    throw new Error(msg);
  }
  return data;
}

function showToast(message, kind = "success") {
  toastEl.hidden = false;
  toastEl.textContent = message;
  toastEl.dataset.kind = kind;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toastEl.hidden = true;
  }, 4200);
}

function showError(err) {
  showToast(err.message || String(err), "error");
}

function formatDate(d) {
  if (!d) return "—";
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? "—" : x.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function statusBadge(status) {
  const map = {
    Pending: "badge-pending",
    Approved: "badge-approved",
    Returned: "badge-returned",
    Overdue: "badge-overdue",
    Rejected: "badge-rejected",
  };
  const cls = map[status] || "";
  return `<span class="badge ${cls}">${status}</span>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function populateCategorySelects() {
  const addForm = document.getElementById("formAddResource");
  const sel = addForm.querySelector('[name="category"]');
  sel.innerHTML = RESOURCE_CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");

  const cond = addForm.querySelector('[name="condition"]');
  cond.innerHTML = CONDITIONS.map((c) => `<option value="${c}">${c}</option>`).join("");
  cond.value = "Good";

  const filter = document.getElementById("filterCategory");
  filter.innerHTML =
    `<option value="">All categories</option>` +
    RESOURCE_CATEGORIES.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
}

function setActiveView(id) {
  document.querySelectorAll(".nav-item").forEach((b) => {
    b.classList.toggle("active", b.dataset.view === id);
  });
  Object.entries(VIEWS).forEach(([key, v]) => {
    v.el.classList.toggle("active", key === id);
  });
  pageTitle.textContent = VIEWS[id]?.title || "URBS";
}

function promptAdminNotes(title) {
  return new Promise((resolve) => {
    dialogNotesTitle.textContent = title;
    dialogNotesText.value = "";
    const onClose = () => {
      dialogNotes.removeEventListener("close", onClose);
      if (dialogNotes.returnValue === "confirm") {
        const t = dialogNotesText.value.trim();
        resolve(t || undefined);
      } else {
        resolve(null);
      }
    };
    dialogNotes.addEventListener("close", onClose, { once: true });
    dialogNotes.showModal();
  });
}

async function loadResourcesTable() {
  const tbody = document.querySelector("#resourcesTable tbody");
  const filter = document.getElementById("filterCategory").value;
  let list;
  try {
    if (filter) {
      try {
        list = await api(`/api/resources/category/${encodeURIComponent(filter)}`);
      } catch (e) {
        if (e.message && e.message.includes("No resources")) list = [];
        else throw e;
      }
    } else {
      list = await api("/api/resources/getall");
    }
  } catch (e) {
    showError(e);
    list = [];
  }

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No resources yet. Add one to get started.</td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map(
      (r) => `
    <tr data-id="${r._id}">
      <td><strong>${escapeHtml(r.name)}</strong><br><span class="muted" style="font-size:0.8rem">${escapeHtml(
        r.description || ""
      )}</span></td>
      <td>${escapeHtml(r.category)}</td>
      <td>${r.availableQuantity}</td>
      <td>${r.totalQuantity}</td>
      <td>${escapeHtml(r.location || "—")}</td>
      <td class="row-actions">
        <button type="button" class="btn btn-danger btn-sm btn-delete-resource">Delete</button>
      </td>
    </tr>`
    )
    .join("");

  tbody.querySelectorAll(".btn-delete-resource").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const tr = btn.closest("tr");
      const id = tr?.dataset.id;
      if (!id || !confirm("Delete this resource from inventory?")) return;
      try {
        await api(`/api/resources/delete/${id}`, { method: "DELETE" });
        showToast("Resource deleted.");
        await refreshAll();
      } catch (e) {
        showError(e);
      }
    });
  });
}

async function fillBorrowResourceSelect() {
  const sel = document.querySelector('#formBorrow [name="resourceId"]');
  let list = [];
  try {
    list = await api("/api/resources/getall");
  } catch (e) {
    showError(e);
  }
  const withStock = list.filter((r) => r.availableQuantity > 0);
  sel.innerHTML =
    `<option value="">Select a resource…</option>` +
    withStock
      .map(
        (r) =>
          `<option value="${r._id}">${escapeHtml(r.name)} — ${r.availableQuantity} available (${escapeHtml(
            r.category
          )})</option>`
      )
      .join("");
  if (!withStock.length) {
    sel.innerHTML = `<option value="">No resources currently available</option>`;
  }
}

async function loadBorrowingsTable() {
  const tbody = document.querySelector("#borrowingsTable tbody");
  let list = [];
  try {
    list = await api("/api/borrowings/getall");
  } catch (e) {
    showError(e);
  }

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No borrowing records.</td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((b) => {
      const res = b.resourceId;
      const resName = res && typeof res === "object" ? res.name : "Resource";
      const resMeta =
        res && typeof res === "object"
          ? `${res.category || ""}${res.location ? ` · ${res.location}` : ""}`
          : "";
      return `
    <tr data-id="${b._id}">
      <td>
        <strong>${escapeHtml(b.studentName)}</strong><br>
        <span class="muted" style="font-size:0.8rem">${escapeHtml(b.studentId)} · ${escapeHtml(
        b.studentEmail
      )}</span>
      </td>
      <td>${escapeHtml(resName)}<br><span class="muted" style="font-size:0.8rem">${escapeHtml(
        resMeta
      )}</span></td>
      <td>${b.quantityBorrowed}</td>
      <td>${formatDate(b.expectedReturnDate)}</td>
      <td>${statusBadge(b.status)}</td>
      <td class="row-actions">
        ${
          b.status === "Pending"
            ? `<button type="button" class="btn btn-primary btn-sm btn-approve">Approve</button>
               <button type="button" class="btn btn-secondary btn-sm btn-reject">Reject</button>`
            : ""
        }
        ${["Approved", "Overdue"].includes(b.status) ? `<button type="button" class="btn btn-primary btn-sm btn-return">Return</button>` : ""}
        ${
          ["Rejected", "Returned"].includes(b.status)
            ? `<button type="button" class="btn btn-ghost btn-sm btn-del-borrow">Remove</button>`
            : ""
        }
      </td>
    </tr>`;
    })
    .join("");

  tbody.querySelectorAll(".btn-approve").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.closest("tr").dataset.id;
      const notes = await promptAdminNotes("Approve borrowing (optional note)");
      if (notes === null) return;
      try {
        await api(`/api/borrowings/approve/${id}`, {
          method: "PUT",
          body: notes ? { adminNotes: notes } : {},
        });
        showToast("Borrowing approved.");
        await refreshAll();
      } catch (e) {
        showError(e);
      }
    });
  });

  tbody.querySelectorAll(".btn-reject").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.closest("tr").dataset.id;
      const notes = await promptAdminNotes("Reject borrowing (optional note)");
      if (notes === null) return;
      try {
        await api(`/api/borrowings/reject/${id}`, {
          method: "PUT",
          body: notes ? { adminNotes: notes } : {},
        });
        showToast("Request rejected.");
        await refreshAll();
      } catch (e) {
        showError(e);
      }
    });
  });

  tbody.querySelectorAll(".btn-return").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.closest("tr").dataset.id;
      const notes = await promptAdminNotes("Confirm return (optional note)");
      if (notes === null) return;
      try {
        await api(`/api/borrowings/return/${id}`, {
          method: "PUT",
          body: notes ? { adminNotes: notes } : {},
        });
        showToast("Item marked returned.");
        await refreshAll();
      } catch (e) {
        showError(e);
      }
    });
  });

  tbody.querySelectorAll(".btn-del-borrow").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.closest("tr").dataset.id;
      if (!confirm("Remove this borrowing record?")) return;
      try {
        await api(`/api/borrowings/delete/${id}`, { method: "DELETE" });
        showToast("Record removed.");
        await refreshAll();
      } catch (e) {
        showError(e);
      }
    });
  });
}

async function loadOverdueTable() {
  const tbody = document.querySelector("#overdueTable tbody");
  const summary = document.getElementById("overdueSummary");
  let data = { count: 0, overdueBorrowings: [] };
  try {
    data = await api("/api/borrowings/overdue");
  } catch (e) {
    showError(e);
  }
  summary.textContent =
    data.count === 0
      ? "No overdue items right now."
      : `${data.count} record(s) past expected return (status updated to Overdue where applicable).`;

  const list = data.overdueBorrowings || [];
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">All clear.</td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((b) => {
      const res = b.resourceId;
      const resName = res && typeof res === "object" ? res.name : "Resource";
      return `
    <tr>
      <td><strong>${escapeHtml(b.studentName)}</strong><br><span class="muted" style="font-size:0.8rem">${escapeHtml(
        b.studentId
      )}</span></td>
      <td>${escapeHtml(resName)}</td>
      <td>${b.quantityBorrowed}</td>
      <td>${formatDate(b.expectedReturnDate)}</td>
      <td>${statusBadge(b.status)}</td>
    </tr>`;
    })
    .join("");
}

async function loadMyLoans() {
  const sid = studentIdInput.value.trim();
  const tbody = document.querySelector("#myLoansTable tbody");
  if (!sid) {
    showToast("Enter your student ID in the sidebar first.", "error");
    tbody.innerHTML = "";
    return;
  }
  let list = [];
  try {
    list = await api(`/api/borrowings/student/${encodeURIComponent(sid)}`);
  } catch (e) {
    if (e.message && e.message.includes("No borrowing")) {
      list = [];
    } else {
      showError(e);
      tbody.innerHTML = "";
      return;
    }
  }

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">No borrowings for this student ID.</td></tr>`;
    return;
  }

  tbody.innerHTML = list
    .map((b) => {
      const res = b.resourceId;
      const resName = res && typeof res === "object" ? res.name : "Resource";
      return `
    <tr>
      <td>${escapeHtml(resName)}</td>
      <td>${b.quantityBorrowed}</td>
      <td>${formatDate(b.borrowDate)}</td>
      <td>${formatDate(b.expectedReturnDate)}</td>
      <td>${statusBadge(b.status)}</td>
    </tr>`;
    })
    .join("");
}

async function loadDashboard() {
  const grid = document.getElementById("statsGrid");
  let resources = [];
  let borrowings = [];
  let overdueCount = 0;
  try {
    resources = await api("/api/resources/getall");
  } catch {
    resources = [];
  }
  try {
    borrowings = await api("/api/borrowings/getall");
  } catch {
    borrowings = [];
  }
  try {
    const o = await api("/api/borrowings/overdue");
    overdueCount = o.count || 0;
  } catch {
    overdueCount = 0;
  }

  const totalAvail = resources.reduce((s, r) => s + (r.availableQuantity || 0), 0);
  const pending = borrowings.filter((b) => b.status === "Pending").length;
  const out = borrowings.filter((b) => ["Approved", "Overdue"].includes(b.status)).length;

  grid.innerHTML = `
    <div class="stat-card"><div class="label">Resource types</div><p class="value">${resources.length}</p></div>
    <div class="stat-card"><div class="label">Units available</div><p class="value">${totalAvail}</p></div>
    <div class="stat-card"><div class="label">Pending requests</div><p class="value">${pending}</p></div>
    <div class="stat-card"><div class="label">Checked out</div><p class="value">${out}</p></div>
    <div class="stat-card"><div class="label">Overdue</div><p class="value">${overdueCount}</p></div>
  `;
}

async function refreshAll() {
  await loadDashboard();
  await loadResourcesTable();
  await fillBorrowResourceSelect();
  await loadBorrowingsTable();
  await loadOverdueTable();
}

document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.view;
    setActiveView(id);
    if (id === "resources") loadResourcesTable();
    if (id === "borrow") {
      fillBorrowResourceSelect();
      syncBorrowStudentFields();
      bumpReturnDateMin();
    }
    if (id === "borrowings") loadBorrowingsTable();
    if (id === "dashboard") loadDashboard();
    if (id === "overdue") loadOverdueTable();
  });
});

document.querySelectorAll("[data-go]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.go;
    setActiveView(id);
    document.querySelector(`.nav-item[data-view="${id}"]`)?.click();
  });
});

document.getElementById("filterCategory").addEventListener("change", () => loadResourcesTable());

document.getElementById("btnToggleAddResource").addEventListener("click", () => {
  document.getElementById("formAddResource").classList.toggle("hidden");
});

document.getElementById("btnCancelAddResource").addEventListener("click", () => {
  document.getElementById("formAddResource").classList.add("hidden");
});

document.getElementById("formAddResource").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = {
    name: fd.get("name").trim(),
    category: fd.get("category"),
    description: (fd.get("description") || "").trim() || undefined,
    totalQuantity: Number(fd.get("totalQuantity")),
    condition: fd.get("condition"),
    location: (fd.get("location") || "").trim() || undefined,
  };
  try {
    await api("/api/resources/add", { method: "POST", body });
    showToast("Resource added.");
    e.target.reset();
    document.querySelector('#formAddResource [name="condition"]').value = "Good";
    document.getElementById("formAddResource").classList.add("hidden");
    await refreshAll();
  } catch (err) {
    showError(err);
  }
});

function syncBorrowStudentFields() {
  const form = document.getElementById("formBorrow");
  const sid = studentIdInput.value.trim();
  if (sid) form.querySelector('[name="studentId"]').value = sid;
}

function bumpReturnDateMin() {
  const input = document.querySelector('#formBorrow [name="expectedReturnDate"]');
  const d = new Date(Date.now() + 120000);
  d.setSeconds(0, 0);
  input.min = toDatetimeLocalValue(d);
  if (!input.value || new Date(input.value) <= new Date()) {
    input.value = toDatetimeLocalValue(d);
  }
}

studentIdInput.addEventListener("change", () => {
  localStorage.setItem("urbs_studentId", studentIdInput.value.trim());
  syncBorrowStudentFields();
});

document.getElementById("formBorrow").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = {
    studentName: fd.get("studentName").trim(),
    studentId: fd.get("studentId").trim(),
    studentEmail: fd.get("studentEmail").trim(),
    resourceId: fd.get("resourceId"),
    quantityBorrowed: Number(fd.get("quantityBorrowed")),
    expectedReturnDate: new Date(fd.get("expectedReturnDate")).toISOString(),
    purpose: (fd.get("purpose") || "").trim() || undefined,
  };
  if (!body.resourceId) {
    showToast("Choose a resource.", "error");
    return;
  }
  try {
    await api("/api/borrowings/request", { method: "POST", body });
    showToast("Borrow request submitted.");
    localStorage.setItem("urbs_studentId", body.studentId);
    studentIdInput.value = body.studentId;
    e.target.reset();
    syncBorrowStudentFields();
    bumpReturnDateMin();
    await refreshAll();
  } catch (err) {
    showError(err);
  }
});

document.getElementById("btnRefreshBorrowings").addEventListener("click", () => loadBorrowingsTable());
document.getElementById("btnRefreshOverdue").addEventListener("click", () => loadOverdueTable());
document.getElementById("btnLoadMyLoans").addEventListener("click", () => loadMyLoans());

populateCategorySelects();
studentIdInput.value = localStorage.getItem("urbs_studentId") || "";
setActiveView("dashboard");
refreshAll().catch(showError);
