const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Получить профиль пользователя
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        gameStats: true,
        devices: {
          select: {
            id: true,
            deviceName: true,
            lastUsedAt: true,
            createdAt: true
          },
          orderBy: {
            lastUsedAt: 'desc'
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

// Отслеживание посещений игр
exports.trackGameVisit = async (req, res) => {
  try {
    const { gameName } = req.body;

    if (!gameName) {
      return res.status(400).json({
        success: false,
        message: 'Название игры обязательно'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { gameStats: true }
    });

    const currentStats = user.gameStats || {};
    const updatedStats = {
      ...currentStats,
      [gameName]: (currentStats[gameName] || 0) + 1
    };

    await prisma.user.update({
      where: { id: req.userId },
      data: { gameStats: updatedStats }
    });

    res.json({
      success: true,
      message: 'Посещение записано'
    });
  } catch (error) {
    console.error('Ошибка отслеживания:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};