require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

// Импорт роутов
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const deviceRoutes = require("./routes/device.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Логирование запросов (для отладки)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/devices", deviceRoutes);

// Статические файлы (фронтенд) - должно быть ПОСЛЕ API routes
app.use(express.static(path.join(__dirname, "public")));

// Главная страница - для всех остальных путей отдаем index.html
app.get("*", (req, res) => {
  // Исключаем API пути
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: "API маршрут не найден",
    });
  }

  // Для всех остальных путей отдаем index.html (SPA режим)
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Внутренняя ошибка сервера",
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на https://tamada-games.lol (port ${PORT})`);
  console.log(`📊 Prisma Studio: npx prisma studio`);
  console.log(`🔑 JWT_SECRET установлен:`, !!process.env.JWT_SECRET);
  console.log(`📁 Статические файлы из: ${path.join(__dirname, "public")}`);
});
