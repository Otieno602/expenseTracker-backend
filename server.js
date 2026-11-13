const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const Expense = require("./models/Expense");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  }),
);

app.use(express.json());

// Keep the API response compatible with our existing frontend.
const formatExpense = (expense) => ({
  id: expense._id.toString(),
  amount: expense.amount,
  category: expense.category,
  type: expense.type,
  note: expense.note,
  date: expense.date,
  createdAt: expense.createdAt,
  updatedAt: expense.updatedAt,
});

app.get("/", (req, res) => {
  res.json({
    message: "Moneye API is running",
  });
});

// Get all expenses
app.get("/api/expenses", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });

    res.json(expenses.map(formatExpense));
  } catch (error) {
    console.error("Fetch expenses error:", error);

    res.status(500).json({
      message: "Failed to fetch expenses.",
    });
  }
});

// Create an expense
app.post("/api/expenses", async (req, res) => {
  try {
    const { amount, category, type, note, date } = req.body;

    if (
      amount === undefined ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      !category?.trim() ||
      !["Need", "Want", "Growth", "Waste"].includes(type)
    ) {
      return res.status(400).json({
        message: "A valid amount, category and spending type are required.",
      });
    }

    const expense = await Expense.create({
      amount: Number(amount),
      category: category.trim(),
      type,
      note: note?.trim() || "",
      date: date || new Date(),
    });

    res.status(201).json(formatExpense(expense));
  } catch (error) {
    console.error("Create expense error:", error);

    res.status(500).json({
      message: "Failed to save expense.",
    });
  }
});

// Update an expense
app.put("/api/expenses/:id", async (req, res) => {
  try {
    const { amount, category, type, note } = req.body;

    if (
      amount === undefined ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      !category?.trim() ||
      !["Need", "Want", "Growth", "Waste"].includes(type)
    ) {
      return res.status(400).json({
        message: "A valid amount, category and type are required.",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid expense ID.",
      });
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        amount: Number(amount),
        category: category.trim(),
        type,
        note: note?.trim() || "",
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found.",
      });
    }

    res.json(formatExpense(expense));
  } catch (error) {
    console.error("Update expense error:", error);

    res.status(500).json({
      message: "Failed to update expense.",
    });
  }
});

// Delete an expense
app.delete("/api/expenses/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid expense ID.",
      });
    }

    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found.",
      });
    }

    res.json({
      message: "Expense deleted successfully.",
      expense: formatExpense(expense),
    });
  } catch (error) {
    console.error("Delete expense error:", error);

    res.status(500).json({
      message: "Failed to delete expense.",
    });
  }
});

// Connect to MongoDB before starting the API.
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB Atlas");

    app.listen(PORT, () => {
      console.log(`Moneye API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
