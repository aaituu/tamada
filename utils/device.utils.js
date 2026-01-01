const crypto = require('crypto');
const UAParser = require('ua-parser-js');

// Генерация уникального отпечатка устройства
exports.generateDeviceFingerprint = (userAgent, ip) => {
  const data = `${userAgent}-${ip}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Парсинг User-Agent для получения информации об устройстве
exports.parseUserAgent = (userAgent) => {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const browser = result.browser.name || 'Unknown Browser';
  const os = result.os.name || 'Unknown OS';
  const device = result.device.type || 'Desktop';

  return {
    name: `${browser} on ${os}`,
    browser: browser,
    os: os,
    device: device
  };
};