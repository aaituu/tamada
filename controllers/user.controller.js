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