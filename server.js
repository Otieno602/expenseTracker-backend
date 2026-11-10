const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Temporary local storage.
// MongoDB will replace this later.
const expenses = [];

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Moneye API is running",
  });
});

// Get all expenses
app.get("/api/expenses", (req, res) => {
  res.json(expenses);
});

// Create an expense
app.post("/api/expenses", (req, res) => {
  const { amount, category, type, note, date } = req.body;

  if (!amount || !category || !type) {
    return res.status(400).json({
      message: "Amount, category and type are required.",
    });
  }

  const expense = {
    id: Date.now().toString(),
    amount: Number(amount),
    category,
    type,
    note: note?.trim() || "",
    date: date || new Date().toISOString(),
  };

  expenses.push(expense);

  res.status(201).json(expense);
});

// Update an existing expense
app.put("/api/expenses/:id", (req, res) => {
  const { amount, category, type, note } = req.body;

  if (
    amount === undefined ||
    Number(amount) <= 0 ||
    !Number.isFinite(Number(amount)) ||
    !category ||
    !type
  ) {
    return res.status(400).json({
      message: "A valid amount, category and type are required.",
    });
  }

  if (!["Need", "Want", "Growth", "Waste"].includes(type)) {
    return res.status(400).json({
      message: "Invalid spending type.",
    });
  }

  const expenseIndex = expenses.findIndex(
    (expense) => expense.id === req.params.id,
  );

  if (expenseIndex === -1) {
    return res.status(404).json({
      message: "Expense not found.",
    });
  }

  const updatedExpense = {
    ...expenses[expenseIndex],
    amount: Number(amount),
    category: category.trim(),
    type,
    note: note?.trim() || "",
  };

  expenses[expenseIndex] = updatedExpense;

  res.json(updatedExpense);
});

// Delete an expense
app.delete("/api/expenses/:id", (req, res) => {
  const expenseIndex = expenses.findIndex(
    (expense) => expense.id === req.params.id,
  );

  if (expenseIndex === -1) {
    return res.status(404).json({
      message: "Expense not found.",
    });
  }

  const deletedExpense = expenses.splice(expenseIndex, 1)[0];

  res.json({
    message: "Expense deleted successfully.",
    expense: deletedExpense,
  });
});

app.listen(PORT, () => {
  console.log(`Moneye API running on port ${PORT}`);
});
