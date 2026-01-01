const jwt = require('jsonwebtoken');

// Middleware для проверки JWT токена
exports.authenticate = (req, res, next) => {
  try {
    // Получить токен из заголовка или cookie
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен не предоставлен'
      });
    }

    // Проверить токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Добавить данные пользователя в request
    req.userId = decoded.userId;
    req.email = decoded.email;
    req.deviceId = decoded.deviceId;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Токен истёк'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Недействительный токен'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Ошибка аутентификации'
    });
  }
};