const API_URL = "/api";

// Переключение между формами
function switchTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach((t) => t.classList.remove("active"));

  if (tab === "login") {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    tabs[0].classList.add("active");
  } else {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    tabs[1].classList.add("active");
  }

  clearMessages();
}

// Показать ошибку
function showError(message) {
  const errorDiv = document.getElementById("errorMessage");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 5000);
}

// Показать успех
function showSuccess(message) {
  const successDiv = document.getElementById("successMessage");
  successDiv.textContent = message;
  successDiv.style.display = "block";
  setTimeout(() => {
    successDiv.style.display = "none";
  }, 5000);
}

// Очистить сообщения
function clearMessages() {
  document.getElementById("errorMessage").style.display = "none";
  document.getElementById("successMessage").style.display = "none";
}

// Регистрация
async function handleRegister(event) {
  event.preventDefault();
  clearMessages();

  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    let data = null;
    const ct = response.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }
    }

    if (response.ok) {
      showSuccess("Регистрация успешна! Теперь войдите в систему.");
      setTimeout(() => {
        switchTab("login");
        document.getElementById("loginEmail").value = email;
      }, 2000);
    } else {
      showError(
        (data && data.message) ||
          `Ошибка регистрации (status ${response.status})`
      );
    }
  } catch (error) {
    console.error("Ошибка:", error);
    showError("Ошибка сервера. Проверьте подключение.");
  }
}

// Вход
async function handleLogin(event) {
  event.preventDefault();
  clearMessages();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    let data = null;
    const ct = response.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }
    }

    if (response.ok) {
      // Сохранить токен
      if (data && data.token) {
        localStorage.setItem("token", data.token);
      }

      showSuccess("Вход выполнен успешно!");

      setTimeout(() => {
        showDashboard();
      }, 1000);
    } else {
      showError(
        (data && data.message) || `Ошибка входа (status ${response.status})`
      );

      // Если превышен лимит устройств
      if (data && data.devices) {
        showDevicesLimit(data.devices);
      }
    }
  } catch (error) {
    console.error("Ошибка:", error);
    showError("Ошибка сервера. Проверьте подключение.");
  }
}

// Показать лимит устройств
function showDevicesLimit(devices) {
  let message = "Превышен лимит устройств. Удалите одно из устройств:\n\n";
  devices.forEach((device, index) => {
    const lastUsed = new Date(device.lastUsed).toLocaleString("ru-RU");
    message += `${index + 1}. ${device.name} (последний вход: ${lastUsed})\n`;
  });
  alert(message);
}

// Выход
async function handleLogout() {
  try {
    const token = localStorage.getItem("token");

    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    localStorage.removeItem("token");

    document.getElementById("authContainer").style.display = "block";
    document.getElementById("dashboard").classList.remove("active");

    showSuccess("Вы вышли из системы");
  } catch (error) {
    console.error("Ошибка:", error);
  }
}

// Показать dashboard
async function showDashboard() {
  const token = localStorage.getItem("token");

  if (!token) {
    return;
  }

  try {
    // Получить профиль пользователя
    const profileResponse = await fetch(`${API_URL}/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!profileResponse.ok) {
      throw new Error("Ошибка получения профиля");
    }

    const profileData = await profileResponse.json();
    const user = profileData.user;

    // Показать информацию о пользователе
    document.getElementById("userInfo").innerHTML = `
            <h2>Добро пожаловать, ${user.name || user.email}!</h2>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Зарегистрирован:</strong> ${new Date(
              user.createdAt
            ).toLocaleDateString("ru-RU")}</p>
        `;

    // Показать устройства
    displayDevices(user.devices);

    // Переключить на dashboard
    document.getElementById("authContainer").style.display = "none";
    document.getElementById("dashboard").classList.add("active");
  } catch (error) {
    console.error("Ошибка:", error);
    localStorage.removeItem("token");
    showError("Ошибка загрузки данных");
  }
}

// Отобразить устройства
function displayDevices(devices) {
  const devicesList = document.getElementById("devicesList");

  if (devices.length === 0) {
    devicesList.innerHTML = "<p>Нет активных устройств</p>";
    return;
  }

  devicesList.innerHTML = devices
    .map(
      (device, index) => `
        <div class="device-item">
            <div class="device-info">
                <strong>${device.deviceName}</strong>
                <small>Последний вход: ${new Date(
                  device.lastUsedAt
                ).toLocaleString("ru-RU")}</small>
            </div>
            <div class="device-actions">
                <button onclick="deleteDevice('${device.id}')">Удалить</button>
            </div>
        </div>
    `
    )
    .join("");
}

// Удалить устройство
async function deleteDevice(deviceId) {
  if (!confirm("Вы уверены, что хотите удалить это устройство?")) {
    return;
  }

  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${API_URL}/devices/${deviceId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    let data = null;
    const ct = response.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }
    }

    if (response.ok) {
      showSuccess("Устройство удалено");
      showDashboard(); // Обновить список
    } else {
      showError(
        (data && data.message) ||
          `Ошибка удаления устройства (status ${response.status})`
      );
    }
  } catch (error) {
    console.error("Ошибка:", error);
    showError("Ошибка сервера");
  }
}

// Перейти к играм
function goToGames() {
  window.location.href = "/index.html";
}

// Проверка при загрузке страницы
window.onload = async () => {
  // If we have authHelpers (added by global script) prefer verifyToken
  if (window.authHelpers) {
    const ok = await authHelpers.verifyToken();
    if (ok) {
      showDashboard();
    }
    return;
  }

  const token = localStorage.getItem("token");
  if (token) {
    showDashboard();
  }
};
