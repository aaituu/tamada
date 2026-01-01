const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Получить все устройства пользователя
exports.getUserDevices = async (req, res) => {
  try {
    const devices = await prisma.device.findMany({
      where: { userId: req.userId },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        lastUsedAt: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      devices
    });
  } catch (error) {
    console.error('Ошибка получения устройств:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

// Удалить устройство
exports.deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Проверка принадлежности устройства пользователю
    const device = await prisma.device.findFirst({
      where: {
        id: deviceId,
        userId: req.userId
      }
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Устройство не найдено'
      });
    }

    // Запрет на удаление текущего устройства
    if (device.id === req.deviceId) {
      return res.status(403).json({
        success: false,
        message: 'Нельзя удалить текущее устройство. Выйдите из системы для удаления.'
      });
    }

    await prisma.device.delete({
      where: { id: deviceId }
    });

    res.json({
      success: true,
      message: 'Устройство удалено'
    });
  } catch (error) {
    console.error('Ошибка удаления устройства:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};

// Удалить все устройства кроме текущего
exports.deleteAllDevicesExceptCurrent = async (req, res) => {
  try {
    await prisma.device.deleteMany({
      where: {
        userId: req.userId,
        id: { not: req.deviceId }
      }
    });

    res.json({
      success: true,
      message: 'Все устройства удалены, кроме текущего'
    });
  } catch (error) {
    console.error('Ошибка удаления устройств:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера'
    });
  }
};