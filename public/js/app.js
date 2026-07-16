/**
 * Personal Expense Tracker - Front-end logic
 * -------------------------------------------
 * Handles two dynamic, backend-driven interactions:
 *   1. Adding a new expense (POST /api/expenses)
 *   2. Filtering expenses by month/category (GET /api/expenses?...)
 * Plus supporting features: loading the list, showing totals,
 * and deleting an expense (DELETE /api/expenses/:id).
 */

// ---- Element references ----
const form = document.getElementById("expense-form");
const formMessage = document.getElementById("form-message");
const expenseList = document.getElementById("expense-list");
const totalAmountEl = document.getElementById("total-amount");
const expenseCountEl = document.getElementById("expense-count");

const filterMonth = document.getElementById("filter-month");
const filterCategory = document.getElementById("filter-category");
const clearFiltersBtn = document.getElementById("clear-filters");

// ---- Helpers ----

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Builds the query string from the current filter inputs.
 */
function buildFilterQuery() {
  const params = new URLSearchParams();
  if (filterMonth.value) params.set("month", filterMonth.value);
  if (filterCategory.value) params.set("category", filterCategory.value);
  return params.toString();
}

// ---------------------------------------------------------------
// DYNAMIC FEATURE 1: Fetch + render expenses (also powers filtering)
// ---------------------------------------------------------------

async function loadExpenses() {
  const query = buildFilterQuery();
  const response = await fetch(`/api/expenses${query ? "?" + query : ""}`);
  const data = await response.json();
  renderExpenses(data.expenses, data.total);
}

function renderExpenses(expenses, total) {
  expenseCountEl.textContent = expenses.length;
  totalAmountEl.textContent = formatCurrency(total || 0);

  if (!expenses.length) {
    expenseList.innerHTML = `<p class="empty-state">No expenses found for this filter.</p>`;
    return;
  }

  expenseList.innerHTML = expenses
    .map(
      (exp) => `
      <div class="expense-item" data-id="${exp.id}">
        <div class="expense-info">
          <span class="expense-category">${exp.category}</span>
          ${exp.note ? `<span class="expense-note">${exp.note}</span>` : ""}
          <span class="expense-date">${formatDate(exp.date)}</span>
        </div>
        <div class="expense-amount">${formatCurrency(exp.amount)}</div>
        <button class="btn-delete" title="Delete expense" data-id="${exp.id}">✕</button>
      </div>
    `
    )
    .join("");
}

// ---------------------------------------------------------------
// DYNAMIC FEATURE 2: Add a new expense
// ---------------------------------------------------------------

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    amount: document.getElementById("amount").value,
    category: document.getElementById("category").value,
    date: document.getElementById("date").value,
    note: document.getElementById("note").value,
  };

  try {
    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Could not add expense.");
    }

    form.reset();
    showFormMessage("Expense added successfully.", "success");
    loadExpenses(); // refresh the list without reloading the page
  } catch (err) {
    showFormMessage(err.message, "error");
  }
});

function showFormMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = `form-message ${type}`;
  setTimeout(() => {
    formMessage.textContent = "";
    formMessage.className = "form-message";
  }, 3000);
}

// ---------------------------------------------------------------
// Filtering: re-fetch whenever filter inputs change
// ---------------------------------------------------------------

filterMonth.addEventListener("change", loadExpenses);
filterCategory.addEventListener("change", loadExpenses);

clearFiltersBtn.addEventListener("click", () => {
  filterMonth.value = "";
  filterCategory.value = "";
  loadExpenses();
});

// ---------------------------------------------------------------
// Delete an expense (event delegation, since items are rendered dynamically)
// ---------------------------------------------------------------

expenseList.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("btn-delete")) return;

  const id = e.target.dataset.id;
  const confirmed = confirm("Delete this expense?");
  if (!confirmed) return;

  await fetch(`/api/expenses/${id}`, { method: "DELETE" });
  loadExpenses();
});

// ---------------------------------------------------------------
// Initial load
// ---------------------------------------------------------------

document.addEventListener("DOMContentLoaded", loadExpenses);
