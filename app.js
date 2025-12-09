const STORAGE_KEY = "listBookData_v1";

let state = {
  notebooks: [],
  selectedNotebookId: null,
};

// DOM elements
const notebookListEl = document.getElementById("notebook-list");
const newNotebookForm = document.getElementById("new-notebook-form");
const newNotebookInput = document.getElementById("new-notebook-input");

const notebookTitleEl = document.getElementById("notebook-title");
const notebookMetaEl = document.getElementById("notebook-meta");
const renameNotebookBtn = document.getElementById("rename-notebook-btn");
const deleteNotebookBtn = document.getElementById("delete-notebook-btn");

const newItemForm = document.getElementById("new-item-form");
const newItemInput = document.getElementById("new-item-input");
const itemsListEl = document.getElementById("items-list");
const emptyStateEl = document.getElementById("empty-state");

// ---------- Storage ----------

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      state.notebooks = [];
      state.selectedNotebookId = null;
      return;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.notebooks)) {
      throw new Error("Invalid data");
    }
    state.notebooks = parsed.notebooks;
    state.selectedNotebookId = parsed.selectedNotebookId || null;
  } catch (err) {
    console.error("Error loading data:", err);
    state.notebooks = [];
    state.selectedNotebookId = null;
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      notebooks: state.notebooks,
      selectedNotebookId: state.selectedNotebookId,
    })
  );
}

// ---------- Helpers ----------

function createId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

function getSelectedNotebook() {
  return state.notebooks.find(
    (n) => n.id === state.selectedNotebookId
  );
}

// ---------- Notebooks ----------

function createNotebook(name) {
  const notebook = {
    id: createId(),
    name: name.trim() || "Untitled",
    createdAt: new Date().toISOString(),
    items: [],
  };
  state.notebooks.unshift(notebook);
  state.selectedNotebookId = notebook.id;
  saveState();
  render();
}

function renameNotebook(newName) {
  const notebook = getSelectedNotebook();
  if (!notebook) return;
  notebook.name = newName.trim() || notebook.name;
  saveState();
  render();
}

function deleteNotebook() {
  if (!state.selectedNotebookId) return;
  const idx = state.notebooks.findIndex(
    (n) => n.id === state.selectedNotebookId
  );
  if (idx === -1) return;

  state.notebooks.splice(idx, 1);
  if (state.notebooks.length > 0) {
    state.selectedNotebookId = state.notebooks[0].id;
  } else {
    state.selectedNotebookId = null;
  }
  saveState();
  render();
}

function selectNotebook(id) {
  state.selectedNotebookId = id;
  saveState();
  render();
}

// ---------- Items ----------

function addItem(text) {
  const notebook = getSelectedNotebook();
  if (!notebook) return;
  const cleanText = text.trim();
  if (!cleanText) return;
  notebook.items.unshift({
    id: createId(),
    text: cleanText,
    done: false,
    createdAt: new Date().toISOString(),
  });
  saveState();
  render();
}

function toggleItemDone(itemId) {
  const notebook = getSelectedNotebook();
  if (!notebook) return;
  const item = notebook.items.find((i) => i.id === itemId);
  if (!item) return;
  item.done = !item.done;
  saveState();
  render();
}

function editItem(itemId, newText) {
  const notebook = getSelectedNotebook();
  if (!notebook) return;
  const item = notebook.items.find((i) => i.id === itemId);
  if (!item) return;
  const cleanText = newText.trim();
  if (!cleanText) return;
  item.text = cleanText;
  saveState();
  render();
}

function deleteItem(itemId) {
  const notebook = getSelectedNotebook();
  if (!notebook) return;
  const idx = notebook.items.findIndex((i) => i.id === itemId);
  if (idx === -1) return;
  notebook.items.splice(idx, 1);
  saveState();
  render();
}

// ---------- Rendering ----------

function renderNotebooks() {
  notebookListEl.innerHTML = "";

  if (state.notebooks.length === 0) {
    const li = document.createElement("li");
    li.style.fontSize = "12px";
    li.style.color = "var(--text-soft)";
    li.textContent = "No notebooks yet. Start by adding one below.";
    notebookListEl.appendChild(li);
    return;
  }

  state.notebooks.forEach((nb) => {
    const li = document.createElement("li");

    const btn = document.createElement("button");
    btn.className = "notebook-btn";
    btn.dataset.id = nb.id;
    if (nb.id === state.selectedNotebookId) {
      btn.classList.add("active");
    }

    const left = document.createElement("div");
    left.className = "notebook-main";

    const dot = document.createElement("div");
    dot.className = "notebook-dot";

    const nameSpan = document.createElement("span");
    nameSpan.className = "notebook-name";
    nameSpan.textContent = nb.name;

    left.appendChild(dot);
    left.appendChild(nameSpan);

    const metaSpan = document.createElement("span");
    metaSpan.className = "notebook-meta-small";
    metaSpan.textContent = `${nb.items.length} item${nb.items.length === 1 ? "" : "s"}`;

    btn.appendChild(left);
    btn.appendChild(metaSpan);
    li.appendChild(btn);
    notebookListEl.appendChild(li);
  });
}

function formatDateShort(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderMain() {
  const notebook = getSelectedNotebook();

  if (!notebook) {
    notebookTitleEl.textContent = "Select or create a notebook";
    notebookMetaEl.textContent = "No notebook selected.";
    renameNotebookBtn.disabled = true;
    deleteNotebookBtn.disabled = true;
    newItemInput.disabled = true;
    itemsListEl.innerHTML = "";
    emptyStateEl.style.display = "block";
    return;
  }

  renameNotebookBtn.disabled = false;
  deleteNotebookBtn.disabled = false;
  newItemInput.disabled = false;

  notebookTitleEl.textContent = notebook.name;
  const created = formatDateShort(notebook.createdAt);
  notebookMetaEl.textContent = created
    ? `Created ${created} • ${notebook.items.length} item${notebook.items.length === 1 ? "" : "s"}`
    : `${notebook.items.length} item${notebook.items.length === 1 ? "" : "s"}`;

  itemsListEl.innerHTML = "";

  if (notebook.items.length === 0) {
    emptyStateEl.style.display = "block";
  } else {
    emptyStateEl.style.display = "none";
  }

  notebook.items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "item";
    li.dataset.id = item.id;

    const left = document.createElement("div");
    left.className = "item-left";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "item-checkbox";
    checkbox.checked = item.done;

    const textSpan = document.createElement("span");
    textSpan.className = "item-text";
    if (item.done) textSpan.classList.add("completed");
    textSpan.textContent = item.text;

    left.appendChild(checkbox);
    left.appendChild(textSpan);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-ghost";
    editBtn.textContent = "Edit";
    editBtn.dataset.action = "edit";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.dataset.action = "delete";

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(left);
    li.appendChild(actions);

    itemsListEl.appendChild(li);
  });
}

function render() {
  renderNotebooks();
  renderMain();
}

// ---------- Events ----------

// Create notebook
newNotebookForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!newNotebookInput.value.trim()) return;
  createNotebook(newNotebookInput.value);
  newNotebookInput.value = "";
});

// Click notebook (event delegation)
notebookListEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".notebook-btn");
  if (!btn) return;
  const id = btn.dataset.id;
  if (!id) return;
  selectNotebook(id);
});

// Rename notebook
renameNotebookBtn.addEventListener("click", () => {
  const notebook = getSelectedNotebook();
  if (!notebook) return;
  const newName = window.prompt("Rename notebook:", notebook.name);
  if (newName === null) return; // cancelled
  if (!newName.trim()) return;
  renameNotebook(newName);
});

// Delete notebook
deleteNotebookBtn.addEventListener("click", () => {
  const notebook = getSelectedNotebook();
  if (!notebook) return;
  const ok = window.confirm(
    `Delete notebook "${notebook.name}" and all its items?`
  );
  if (!ok) return;
  deleteNotebook();
});

// Add item
newItemForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!state.selectedNotebookId) return;
  const text = newItemInput.value;
  if (!text.trim()) return;
  addItem(text);
  newItemInput.value = "";
});

// Items actions (toggle, edit, delete)
itemsListEl.addEventListener("click", (e) => {
  const li = e.target.closest(".item");
  if (!li) return;
  const itemId = li.dataset.id;

  if (e.target.matches(".item-checkbox")) {
    toggleItemDone(itemId);
    return;
  }

  const actionBtn = e.target.closest("button[data-action]");
  if (!actionBtn) return;

  const action = actionBtn.dataset.action;
  if (action === "delete") {
    deleteItem(itemId);
  } else if (action === "edit") {
    const notebook = getSelectedNotebook();
    if (!notebook) return;
    const item = notebook.items.find((i) => i.id === itemId);
    if (!item) return;
    const newText = window.prompt("Edit item:", item.text);
    if (newText === null) return;
    if (!newText.trim()) return;
    editItem(itemId, newText);
  }
});

// ---------- Init ----------

loadState();
render();
