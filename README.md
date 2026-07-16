# Personal Expense Tracker

A simple web application to track personal expenses (monthly and yearly), built for the course *Project Java and Web Development (DLBCSPJWD01)*.

## Features

- Add an expense (amount, category, date, note)
- View all expenses in a list, newest first
- Filter expenses by month and/or category (dynamic, talks to the backend)
- See a running total and expense count for the current filter
- Delete an expense
- Responsive design (desktop, tablet, mobile)

## Technology Stack

| Layer        | Technology                     |
|--------------|---------------------------------|
| Front-end    | HTML, CSS, JavaScript (vanilla) |
| Back-end     | Node.js (built-in `http` module, no external framework) |
| Data storage | JSON file (`data/expenses.json`) |

## Prerequisites

You need **Node.js** installed (version 16 or later is fine).
Check if you already have it by running:

```bash
node --version
```

If you don't have it, download it from [nodejs.org](https://nodejs.org).

## Installation & Running the App

No external packages are required — the backend uses only Node's built-in modules, so there is no `npm install` step.

1. Open a terminal in this project folder.
2. Start the server:

   ```bash
   node server.js
   ```

   (or `npm start`)

3. You should see:

   ```
   Personal Expense Tracker running at http://localhost:3000
   ```

4. Open your browser and go to: **http://localhost:3000**

That's it — the app is running locally.

## Project Structure

```
expense-tracker/
├── server.js              # Backend server (routing, API, static file serving)
├── package.json
├── data/
│   └── expenses.json      # Stores all expense data
└── public/                # Front-end files served to the browser
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

## API Endpoints

| Method | Endpoint                          | Description                          |
|--------|------------------------------------|---------------------------------------|
| GET    | `/api/expenses`                    | Get all expenses                     |
| GET    | `/api/expenses?month=YYYY-MM`      | Filter expenses by month             |
| GET    | `/api/expenses?category=Food`      | Filter expenses by category          |
| POST   | `/api/expenses`                    | Add a new expense (JSON body)        |
| DELETE | `/api/expenses/:id`                | Delete an expense by its ID          |

## Notes

- Data is stored server-side in `data/expenses.json`, so it persists between restarts of the server.
- To reset all data, simply replace the contents of `data/expenses.json` with `[]`.
