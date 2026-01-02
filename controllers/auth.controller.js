const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const {
  generateDeviceFingerprint,
  parseUserAgent,
} = require("../utils/device.utils");

const prisma = new PrismaClient();
const MAX_DEVICES = parseInt(process.env.MAX_DEVICES_PER_USER) || 2;

// Регистрация
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Валидация
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email и пароль обязательны",
      });
    }

    // Проверка существующего пользователя
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Пользователь с таким email уже существует",
      });
    }

    // Хеширование пароля
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Регистрация успешна",
      user,
    });
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при регистрации",
    });
  }
};

// Логин
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userAgent = req.headers["user-agent"] || "Unknown";
    const clientIp = req.ip || req.connection.remoteAddress || "Unknown";
    
    console.log("Login attempt:", { email, ip: clientIp, ua: userAgent });

    // Валидация
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email и пароль обязательны",
      });
    }

    // Поиск пользователя
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        createdAt: true,
        devices: {
          orderBy: {
            lastUsedAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Неверный email или пароль",
      });
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Неверный email или пароль",
      });
    }

    // Генерация отпечатка устройства
    const deviceFingerprint = generateDeviceFingerprint(userAgent, clientIp);

    // Проверка существующего устройства
    let device = await prisma.device.findUnique({
      where: { fingerprint: deviceFingerprint },
    });

    // Если устройство новое
    if (!device) {
      // Проверка лимита устройств
      if (user.devices.length >= MAX_DEVICES) {
        return res.status(403).json({
          success: false,
          message: `Превышен лимит устройств (максимум ${MAX_DEVICES}). Удалите старое устройство для входа с нового.`,
          devices: user.devices.map((d) => ({
            id: d.id,
            name: d.deviceName,
            lastUsed: d.lastUsedAt,
          })),
        });
      }

      // Создание нового устройства
      const deviceInfo = parseUserAgent(userAgent);
      device = await prisma.device.create({
        data: {
          userId: user.id,
          deviceName: deviceInfo.name,
          userAgent: userAgent,
          fingerprint: deviceFingerprint,
        },
      });
    } else {
      // Обновление времени использования
      device = await prisma.device.update({
        where: { id: device.id },
        data: { lastUsedAt: new Date() },
      });
    }

    // Генерация JWT токена
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not set");
      return res.status(500).json({ 
        success: false, 
        message: "Ошибка конфигурации сервера" 
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        deviceId: device.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Установка cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    // Успешный ответ
    res.json({
      success: true,
      message: "Вход выполнен успешно",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      device: {
        id: device.id,
        name: device.deviceName,
      },
    });
  } catch (error) {
    console.error("Ошибка входа:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при входе",
    });
  }
};

// Выход
exports.logout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.json({
      success: true,
      message: "Выход выполнен успешно",
    });
  } catch (error) {
    console.error("Ошибка выхода:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера при выходе",
    });
  }
};

// Проверка токена
exports.verifyToken = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Ошибка проверки токена:", error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера",
    });
  }
};