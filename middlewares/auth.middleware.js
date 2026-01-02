const jwt = require('jsonwebtoken');

// Middleware для проверки JWT токена
exports.authenticate = (req, res, next) => {
  try {
    // Получить токен из заголовка или cookie
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    console.log('Auth middleware - token found:', !!token);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен не предоставлен'
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Ошибка конфигурации сервера'
      });
    }

    // Проверить токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', { userId: decoded.userId, email: decoded.email });

    // Добавить данные пользователя в request
    req.userId = decoded.userId;
    req.email = decoded.email;
    req.deviceId = decoded.deviceId;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
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