const STORAGE_KEY = "studyflow_tasks";
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const $ = id => document.getElementById(id);
const form = $("taskForm");
const taskName = $("taskName");
const subject = $("subject");
const priority = $("priority");
const dueDate = $("dueDate");
const taskId = $("taskId");

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDate(value) {
  return new Date(value + "T00:00:00").toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric"
  });
}

function isOverdue(task) {
  if (task.completed) return false;
  return task.dueDate < new Date().toISOString().slice(0, 10);
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  $("totalCount").textContent = total;
  $("completedCount").textContent = completed;
  $("pendingCount").textContent = total - completed;
  $("completionRate").textContent = total ? Math.round(completed / total * 100) + "%" : "0%";
}

function render() {
  updateStats();
  const query = $("search").value.toLowerCase().trim();
  const filter = $("filter").value;

  const visible = tasks.filter(t => {
    const matchesSearch = `${t.name} ${t.subject}`.toLowerCase().includes(query);
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && !t.completed) ||
      (filter === "completed" && t.completed) ||
      (filter === "high" && t.priority === "High") ||
      (filter === "overdue" && isOverdue(t));
    return matchesSearch && matchesFilter;
  });

  $("taskList").innerHTML = visible.map(t => `
    <article class="task ${t.completed ? "done" : ""}">
      <button class="check ${t.completed ? "done" : ""}" onclick="toggleTask('${t.id}')" aria-label="Complete task">
        ${t.completed ? "✓" : ""}
      </button>
      <div>
        <h4>${escapeHtml(t.name)}</h4>
        <div class="meta">
          <span class="badge">${escapeHtml(t.subject)}</span>
          <span class="badge ${t.priority.toLowerCase()}">${t.priority}</span>
          <span class="${isOverdue(t) ? "overdue" : ""}">
            ${isOverdue(t) ? "Overdue • " : "Due • "}${formatDate(t.dueDate)}
          </span>
        </div>
      </div>
      <div class="task-actions">
        <button class="small-btn" onclick="editTask('${t.id}')" title="Edit">✎</button>
        <button class="small-btn" onclick="deleteTask('${t.id}')" title="Delete">✕</button>
      </div>
    </article>
  `).join("");

  $("emptyState").classList.toggle("hidden", visible.length !== 0);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const data = {
    name: taskName.value.trim(),
    subject: subject.value,
    priority: priority.value,
    dueDate: dueDate.value
  };
  if (!data.name || !data.dueDate) return;

  if (taskId.value) {
    const task = tasks.find(t => t.id === taskId.value);
    Object.assign(task, data);
  } else {
    tasks.unshift({ id: crypto.randomUUID(), ...data, completed: false });
  }

  save();
  resetForm();
  render();
});

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  taskId.value = task.id;
  taskName.value = task.name;
  subject.value = task.subject;
  priority.value = task.priority;
  dueDate.value = task.dueDate;
  $("formTitle").textContent = "Edit task";
  $("saveBtn").textContent = "Update Task";
  $("cancelBtn").classList.remove("hidden");
  taskName.focus();
}

function resetForm() {
  form.reset();
  taskId.value = "";
  priority.value = "Medium";
  $("formTitle").textContent = "Add a new task";
  $("saveBtn").textContent = "Add Task";
  $("cancelBtn").classList.add("hidden");
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.completed = !task.completed;
  save();
  render();
}

function deleteTask(id) {
  if (!confirm("Delete this task?")) return;
  tasks = tasks.filter(t => t.id !== id);
  save();
  render();
}

$("cancelBtn").addEventListener("click", resetForm);
$("clearCompleted").addEventListener("click", () => {
  tasks = tasks.filter(t => !t.completed);
  save();
  render();
});
$("search").addEventListener("input", render);
$("filter").addEventListener("change", render);

$("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  $("themeBtn").textContent = document.body.classList.contains("dark") ? "☀" : "☾";
  localStorage.setItem("studyflow_theme", document.body.classList.contains("dark") ? "dark" : "light");
});

if (localStorage.getItem("studyflow_theme") === "dark") {
  document.body.classList.add("dark");
  $("themeBtn").textContent = "☀";
}

$("today").textContent = new Date().toLocaleDateString(undefined, {
  weekday: "long", day: "numeric", month: "long", year: "numeric"
});

const quotes = [
  "Small progress every day.",
  "Focus on the next task.",
  "Consistency beats last-minute effort.",
  "Plan it. Do it. Complete it."
];
$("quote").textContent = quotes[new Date().getDate() % quotes.length];

dueDate.min = new Date().toISOString().slice(0, 10);
render();
