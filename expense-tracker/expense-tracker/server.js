/**
 * Personal Expense Tracker - Backend Server
 * -------------------------------------------
 * This is a lightweight Node.js server (no external frameworks) that:
 *  1. Serves the front-end files (HTML, CSS, JS) from the /public folder
 *  2. Provides a small REST API under /api/expenses to add, list,
 *     filter and delete expenses
 *  3. Stores all expense data in data/expenses.json (acts as our
 *     simple "database" for this project)
 *
 * Run with: node server.js
 * Then open: http://localhost:3000
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "expenses.json");
const PUBLIC_DIR = path.join(__dirname, "public");

// ---------------------------------------------------------------
// Data helpers: read/write the JSON file that acts as our storage
// ---------------------------------------------------------------

/**
 * Reads all expenses from the JSON data file.
 * Returns an empty array if the file doesn't exist yet or is empty.
 */
function readExpenses() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Error reading expenses file:", err.message);
    return [];
  }
}

/**
 * Saves the given array of expenses back to the JSON data file.
 */
function writeExpenses(expenses) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2), "utf-8");
}

/**
 * Generates a simple unique ID for a new expense
 * (timestamp + random suffix is enough for this project's scope).
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------------------------------------------------------------
// Static file serving (front-end: HTML, CSS, JS)
// ---------------------------------------------------------------

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".ico": "image/x-icon",
};

function serveStaticFile(req, res, pathname) {
  // Default to index.html for the root URL
  let filePath = pathname === "/" ? "/index.html" : pathname;
  filePath = path.join(PUBLIC_DIR, filePath);

  // Basic safety check: prevent escaping the public folder
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  });
}

// ---------------------------------------------------------------
// API request helpers
// ---------------------------------------------------------------

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

/**
 * Reads and parses a JSON request body (used for POST requests).
 * Returns a Promise that resolves with the parsed object.
 */
function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

// ---------------------------------------------------------------
// API route handlers
// ---------------------------------------------------------------

/**
 * GET /api/expenses
 * Supports optional query params for filtering (both dynamic
 * front-end features hit this same endpoint):
 *   ?month=YYYY-MM   -> only expenses from that month
 *   ?category=Food   -> only expenses in that category
 */
function handleGetExpenses(req, res, query) {
  let expenses = readExpenses();

  if (query.month) {
    expenses = expenses.filter((exp) => exp.date.startsWith(query.month));
  }
  if (query.category) {
    expenses = expenses.filter(
      (exp) => exp.category.toLowerCase() === query.category.toLowerCase()
    );
  }

  // Sort newest first
  expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

  const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  sendJson(res, 200, { expenses, total, count: expenses.length });
}

/**
 * POST /api/expenses
 * Adds a new expense. Expects JSON body:
 * { amount, category, date, note }
 */
async function handleAddExpense(req, res) {
  try {
    const body = await readRequestBody(req);
    const { amount, category, date, note } = body;

    // Basic server-side validation
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return sendJson(res, 400, { error: "A valid positive amount is required." });
    }
    if (!category || typeof category !== "string") {
      return sendJson(res, 400, { error: "Category is required." });
    }
    if (!date) {
      return sendJson(res, 400, { error: "Date is required." });
    }

    const newExpense = {
      id: generateId(),
      amount: Number(amount),
      category: category.trim(),
      date, // expected format: YYYY-MM-DD
      note: note ? note.trim() : "",
      createdAt: new Date().toISOString(),
    };

    const expenses = readExpenses();
    expenses.push(newExpense);
    writeExpenses(expenses);

    sendJson(res, 201, newExpense);
  } catch (err) {
    sendJson(res, 400, { error: "Invalid request body." });
  }
}

/**
 * DELETE /api/expenses/:id
 * Removes a single expense by its ID.
 */
function handleDeleteExpense(req, res, id) {
  const expenses = readExpenses();
  const filtered = expenses.filter((exp) => exp.id !== id);

  if (filtered.length === expenses.length) {
    return sendJson(res, 404, { error: "Expense not found." });
  }

  writeExpenses(filtered);
  sendJson(res, 200, { message: "Expense deleted.", id });
}

// ---------------------------------------------------------------
// Main request router
// ---------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // ---- API routes ----
  if (pathname === "/api/expenses" && req.method === "GET") {
    return handleGetExpenses(req, res, query);
  }

  if (pathname === "/api/expenses" && req.method === "POST") {
    return handleAddExpense(req, res);
  }

  if (pathname.startsWith("/api/expenses/") && req.method === "DELETE") {
    const id = pathname.split("/api/expenses/")[1];
    return handleDeleteExpense(req, res, id);
  }

  // ---- Front-end static files ----
  if (req.method === "GET") {
    return serveStaticFile(req, res, pathname);
  }

  sendJson(res, 405, { error: "Method not allowed." });
});

server.listen(PORT, () => {
  console.log(`Personal Expense Tracker running at http://localhost:${PORT}`);
});
