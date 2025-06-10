const { app, Tray, Menu, BrowserWindow, globalShortcut, shell, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const TrayManager = require('./tray');

let tray;
let mainWindow = null;
let settingsWindow = null;
let isQuitting = false;

// إعدادات التطبيق المتقدمة
const appConfig = {
  // إخفاء التطبيق في شريط المهام
  hideFromTaskbar: true,
  
  // بدء التطبيق مع الويندوز
  startWithWindows: true,
  
  // إخفاء splash screen
  hideSplashScreen: true,
  
  // تحسين الأداء
  hardwareAcceleration: true,
  
  // إعدادات الأمان
  security: {
    nodeIntegration: false,
    contextIsolation: true,
    webSecurity: true
  }
};

// إنشاء نافذة الإعدادات
function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 400,
    minWidth: 500,
    minHeight: 350,
    title: 'إعدادات MyDevBox',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
    frame: true,
    autoHideMenuBar: true,
    resizable: true,
    maximizable: false,
    minimizable: true,
    webPreferences: {
      nodeIntegration: appConfig.security.nodeIntegration,
      contextIsolation: appConfig.security.contextIsolation,
      webSecurity: appConfig.security.webSecurity,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // تحميل صفحة الإعدادات
  settingsWindow.loadFile('settings.html');

  // عرض النافذة عند الانتهاء من التحميل
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
    settingsWindow.center();
  });

  // إخفاء النافذة بدلاً من إغلاقها
  settingsWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      settingsWindow.hide();
    }
  });

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

// إنشاء نافذة رئيسية مخفية للتحكم في النوافذ
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1,
    height: 1,
    show: false,
    frame: false,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // إخفاء النافذة من شريط المهام
  if (appConfig.hideFromTaskbar) {
    mainWindow.setSkipTaskbar(true);
  }
}

// إعداد اختصارات لوحة المفاتيح العامة
function setupGlobalShortcuts() {
  // Ctrl+Shift+M لفتح إعدادات MyDevBox
  globalShortcut.register('CommandOrControl+Shift+M', () => {
    createSettingsWindow();
  });

  // Ctrl+Shift+H لإخفاء/إظهار جميع النوافذ
  globalShortcut.register('CommandOrControl+Shift+H', () => {
    const allWindows = BrowserWindow.getAllWindows();
    allWindows.forEach(window => {
      if (window.isVisible()) {
        window.hide();
      } else {
        window.show();
      }
    });
  });
}

// إعداد بدء التشغيل مع الويندوز
function setupAutoLaunch() {
  if (appConfig.startWithWindows) {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath('exe'),
      args: ['--hidden']
    });
  }
}

// إعداد البروتوكولات المخصصة
function setupProtocols() {
  // تسجيل بروتوكول mydevbox://
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('mydevbox', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('mydevbox');
  }
}

// إعداد التحديثات التلقائية
function setupAutoUpdater() {
  autoUpdater.checkForUpdatesAndNotify();
  
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(null, {
      type: 'info',
      title: 'تحديث متوفر',
      message: 'يتوفر إصدار جديد من MyDevBox',
      detail: 'سيتم تحميل التحديث في الخلفية'
    });
  });

  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(null, {
      type: 'info',
      buttons: ['إعادة التشغيل', 'لاحقاً'],
      title: 'تحديث جاهز',
      message: 'تم تحميل التحديث بنجاح',
      detail: 'اضغط "إعادة التشغيل" لتطبيق التحديث'
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}

// تهيئة التطبيق
app.whenReady().then(() => {
  // إنشاء النافذة الرئيسية المخفية
  createMainWindow();
  
  // إنشاء أيقونة النظام
  tray = TrayManager.createTray();
  
  // إعداد الاختصارات العامة
  setupGlobalShortcuts();
  
  // إعداد بدء التشغيل التلقائي
  setupAutoLaunch();
  
  // إعداد البروتوكولات المخصصة
  setupProtocols();
  
  // إعداد التحديثات التلقائية
  setupAutoUpdater();
  
  // تحسين الأداء
  if (appConfig.hardwareAcceleration) {
    app.commandLine.appendSwitch('enable-gpu-rasterization');
    app.commandLine.appendSwitch('enable-zero-copy');
  }
});

// منع إغلاق التطبيق عند إغلاق جميع النوافذ
app.on('window-all-closed', (e) => {
  e.preventDefault();
});

// التعامل مع إغلاق التطبيق
app.on('before-quit', (event) => {
  isQuitting = true;
  
  // إيقاف جميع الخدمات
  TrayManager.stopAll();
  
  // إلغاء تسجيل الاختصارات العامة
  globalShortcut.unregisterAll();
});

// التعامل مع إعادة تنشيط التطبيق (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// التعامل مع البروتوكولات المخصصة
app.on('open-url', (event, url) => {
  event.preventDefault();
  // معالجة URLs من النوع mydevbox://
  console.log('Protocol URL:', url);
});

// التعامل مع الملفات المسحوبة على التطبيق
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  // معالجة الملفات المسحوبة
  console.log('File dropped:', filePath);
});

// إعداد الأمان
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
});

// تصدير الوحدة
module.exports = {
  createSettingsWindow,
  mainWindow: () => mainWindow,
  settingsWindow: () => settingsWindow
};