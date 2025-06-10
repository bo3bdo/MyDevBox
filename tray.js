const { Tray, Menu, dialog, shell, BrowserWindow, ipcMain, app, Notification } = require('electron');
const { spawn, exec } = require('child_process');
const { spawn: crossSpawn } = require('cross-spawn');
const fs = require('fs');
const mustache = require('mustache');
const path = require('path');
const os = require('os');
const https = require('https');
const extract = require('extract-zip');
const mainModule = require('./main');

const baseDir = __dirname;
let processes = {};
let progressWindow = null;
let downloadStartTime = null;

let appSettings = {
  autoStart: true,
  hideTaskbar: true,
  hardwareAccel: true,
  notifications: true
};

// إعداد IPC handlers للتفاعل مع نافذة الإعدادات
function setupIpcHandlers() {
  // معالجات الإعدادات
  ipcMain.handle('settings-get', (event, key) => {
    return appSettings[key];
  });

  ipcMain.handle('settings-set', (event, key, value) => {
    appSettings[key] = value;
    saveSettings();
    return true;
  });

  ipcMain.handle('settings-get-all', () => {
    return appSettings;
  });

  // معالجات الخدمات
  ipcMain.handle('service-start', (event, serviceName) => {
    if (serviceName === 'apache') {
      startApache();
    } else if (serviceName === 'mysql') {
      startMySQL();
    }
    return true;
  });

  ipcMain.handle('service-stop', (event, serviceName) => {
    stopService(serviceName);
    return true;
  });

  ipcMain.handle('service-status', (event, serviceName) => {
    return isServiceRunning(serviceName);
  });

  ipcMain.handle('service-restart', (event, serviceName) => {
    stopService(serviceName);
    setTimeout(() => {
      if (serviceName === 'apache') {
        startApache();
      } else if (serviceName === 'mysql') {
        startMySQL();
      }
    }, 2000);
    return true;
  });

  // معالجات النظام
  ipcMain.handle('system-platform', () => {
    return process.platform;
  });

  ipcMain.handle('system-version', () => {
    return os.release();
  });

  ipcMain.handle('app-version', () => {
    return app.getVersion();
  });

  // معالجات النوافذ
  ipcMain.handle('window-minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window.minimize();
  });

  ipcMain.handle('window-close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window.hide();
  });

  ipcMain.handle('window-hide', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window.hide();
  });

  ipcMain.handle('window-show', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window.show();
  });

  // معالجات الإشعارات
  ipcMain.handle('notification-show', (event, title, body, options = {}) => {
    if (appSettings.notifications) {
      showNotification(title, body, options);
    }
  });

  // معالجات phpMyAdmin
  ipcMain.handle('phpmyadmin-is-installed', () => {
    return isPhpMyAdminInstalled();
  });

  ipcMain.handle('phpmyadmin-install', () => {
    downloadPhpMyAdmin();
  });

  ipcMain.handle('phpmyadmin-remove', () => {
    removePhpMyAdmin();
  });

  ipcMain.handle('phpmyadmin-open', () => {
    openPhpMyAdmin();
  });

  // معالجات التثبيت السريع
  ipcMain.handle('quick-install', (event, appType, projectName) => {
    return performQuickInstall(appType, projectName);
  });

  ipcMain.handle('quick-install-list', () => {
    return Object.keys(quickInstallApps).map(key => ({
      id: key,
      ...quickInstallApps[key]
    }));
  });

  ipcMain.handle('check-requirements', (event, requirements) => {
    return checkRequirements(requirements);
  });
}

// حفظ الإعدادات
function saveSettings() {
  const settingsPath = path.join(baseDir, 'config', 'settings.json');
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(appSettings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// تحميل الإعدادات
function loadSettings() {
  const settingsPath = path.join(baseDir, 'config', 'settings.json');
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      appSettings = { ...appSettings, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// إظهار إشعار نظام
function showNotification(title, body, options = {}) {
  if (Notification.isSupported()) {
    const notification = new Notification({
      title: title,
      body: body,
      icon: path.join(baseDir, 'assets', 'icon.png'),
      ...options
    });
    
    notification.show();
    
    if (options.onClick) {
      notification.on('click', options.onClick);
    }
  }
}

// دالة لقتل عمليات Apache الموجودة
async function killExistingApacheProcesses() {
    return new Promise((resolve) => {
        console.log('🔪 Killing existing Apache processes...');
        
        // استخدام cmd مع WMIC أولاً (أقوى من taskkill)
        exec('cmd /c "wmic process where \\"name=\'httpd.exe\'\\" delete"', (error, stdout, stderr) => {
            if (error) {
                if (error.message.includes('not found')) {
                    console.log('ℹ️ No Apache processes found to kill');
                } else {
                    console.log('⚠️ Error killing Apache processes:', error.message);
                }
            } else {
                console.log('✅ Apache processes killed:', stdout.trim());
            }
            
            // قتل أي عمليات أباتشي أخرى
            exec('cmd /c "wmic process where \\"name=\'apache.exe\'\\" delete"', (error2, stdout2, stderr2) => {
                if (error2) {
                    if (!error2.message.includes('not found')) {
                        console.log('Apache.exe kill result:', error2.message);
                    }
                } else {
                    console.log('✅ Additional Apache processes killed:', stdout2.trim());
                }
                
                // تنظيف منافذ مشغولة (في حالة وجود عمليات zombie)
                exec('netstat -ano | findstr :80', (error3, stdout3, stderr3) => {
                    if (stdout3) {
                        const lines = stdout3.split('\n');
                        const killPromises = [];
                        
                        lines.forEach(line => {
                            const match = line.match(/\s+(\d+)$/);
                            if (match) {
                                const pid = match[1];
                                const killPromise = new Promise((killResolve) => {
                                    exec(`cmd /c "wmic process where \\"ProcessId=${pid}\\" delete"`, (killError) => {
                                        if (killError) {
                                            console.log(`⚠️ Could not kill PID ${pid}: ${killError.message}`);
                                        } else {
                                            console.log(`✅ Killed process PID ${pid} using port 80`);
                                        }
                                        killResolve();
                                    });
                                });
                                killPromises.push(killPromise);
                            }
                        });
                        
                        if (killPromises.length > 0) {
                            Promise.all(killPromises).then(() => {
                                console.log(`🎯 Finished cleaning ${killPromises.length} port 80 processes`);
                                resolve();
                            });
                        } else {
                            resolve();
                        }
                    } else {
                        resolve();
                    }
                });
            });
        });
    });
}

// دالة لقتل كل العمليات على المنفذ 80 بقوة
async function forceKillPort80Processes() {
    return new Promise((resolve) => {
        console.log('🚨 Force killing all processes using port 80...');
        
        // الحصول على جميع العمليات التي تستخدم المنفذ 80
        exec('netstat -ano | findstr :80', (error, stdout, stderr) => {
            if (error || !stdout) {
                console.log('ℹ️ No processes found on port 80');
                resolve();
                return;
            }
            
            const lines = stdout.split('\n');
            const pids = new Set(); // استخدام Set لتجنب التكرار
            
            lines.forEach(line => {
                const match = line.match(/\s+(\d+)$/);
                if (match) {
                    pids.add(match[1]);
                }
            });
            
            if (pids.size === 0) {
                console.log('ℹ️ No PIDs found for port 80');
                resolve();
                return;
            }
            
            console.log(`🔪 Killing ${pids.size} processes: ${Array.from(pids).join(', ')}`);
            
            let killCount = 0;
            const totalPids = pids.size;
            
            if (totalPids === 0) {
                resolve();
                return;
            }
            
            pids.forEach(pid => {
                exec(`cmd /c "wmic process where \\"ProcessId=${pid}\\" delete"`, (killError, killStdout, killStderr) => {
                    killCount++;
                    if (killError) {
                        console.log(`⚠️ Failed to kill PID ${pid}: ${killError.message}`);
                    } else {
                        console.log(`✅ Killed PID ${pid}`);
                    }
                    
                    if (killCount === totalPids) {
                        console.log('🎯 All port 80 processes targeted for termination');
                        resolve();
                    }
                });
            });
        });
    });
}

// تشغيل Apache محسن
async function startApache() {
  try {
    console.log('🔄 Stopping any existing Apache processes...');
    showNotification('تشغيل Apache', 'جاري إيقاف Apache القديم وبدء جديد...');
    
    // إيقاف أي Apache أخرى مشغلة بشكل محسن - 3 محاولات
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`🔪 Kill attempt ${attempt}/3...`);
      await killExistingApacheProcesses();
      
      // انتظار بين كل محاولة
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const portAvailable = await isPortAvailable(80);
      if (portAvailable) {
        console.log(`✅ Port 80 is now free after attempt ${attempt}`);
        break;
      } else {
        console.log(`⚠️ Port 80 still busy after attempt ${attempt}`);
        if (attempt === 3) {
          // محاولة أخيرة: قتل كل شيء على المنفذ 80
          console.log('🚨 Final attempt: killing all processes on port 80...');
          await forceKillPort80Processes();
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const finalCheck = await isPortAvailable(80);
          if (!finalCheck) {
            showNotification('خطأ في تشغيل Apache', 'فشل في تحرير المنفذ 80. تحقق من خدمات النظام.');
            return;
          }
        }
      }
    }
    
    // استخدام ملف التكوين الصحيح
    const configPath = path.join(baseDir, 'config', 'httpd.conf');
    const apachePath = path.join(baseDir, 'bin', 'apache', 'bin', 'httpd.exe');
    
    // التحقق من وجود Apache
    if (!fs.existsSync(apachePath)) {
      showNotification('خطأ في Apache', 'لم يتم العثور على Apache في المسار المحدد');
      return;
    }
    
    // التحقق من وجود ملف التكوين
    if (!fs.existsSync(configPath)) {
      showNotification('خطأ في تكوين Apache', 'لم يتم العثور على ملف httpd.conf');
      return;
    }
    
    // استخدام المسار المطلق لملف التكوين
    startService('apache', apachePath, ['-f', configPath]);
    
    showNotification('تم تشغيل Apache', 'Apache يعمل الآن على http://localhost');
  } catch (error) {
    console.log('Error starting Apache:', error);
    showNotification('خطأ في تشغيل Apache', error.message);
  }
}

// تشغيل MySQL محسن
async function startMySQL() {
  try {
    generateMySQLConfig();
    
    const portAvailable = await isPortAvailable(3306);
    if (!portAvailable) {
      showNotification('خطأ في تشغيل MySQL', 'المنفذ 3306 مستخدم بالفعل');
      return;
    }
    
    // التأكد من وجود MySQL
    const mysqlPath = path.join(baseDir, 'bin', 'mysql', 'bin', 'mysqld.exe');
    if (!fs.existsSync(mysqlPath)) {
      showNotification('خطأ في MySQL', 'لم يتم العثور على MySQL في المسار المحدد');
      return;
    }
    
    // إنشاء مجلد tmp إذا لم يكن موجوداً
    const tmpDir = path.join(baseDir, 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    // استخدام المسار المطلق لملف التكوين
    const configPath = path.join(baseDir, 'config', 'my.ini');
    
    startService('mysql', mysqlPath, [
      '--defaults-file=' + configPath,
      '--console'
    ]);
    
    showNotification('تم تشغيل MySQL', 'MySQL يعمل الآن على المنفذ 3306');
    
  } catch (error) {
    console.error('Error starting MySQL:', error);
    showNotification('خطأ في تشغيل MySQL', error.message);
  }
}

// إعدادات البرامج السريعة
const quickInstallApps = {
  laravel: {
    name: 'Laravel',
    icon: '🔶',
    description: 'إطار عمل PHP الحديث والقوي',
    requirements: ['php', 'composer', 'node', 'npm'],
    database: true,
    steps: [
      { type: 'command', cmd: 'composer', args: ['create-project', 'laravel/laravel'], description: 'إنشاء مشروع Laravel جديد' },
      { type: 'database', description: 'إنشاء قاعدة بيانات' },
      { type: 'config', description: 'تكوين ملف .env' },
      { type: 'npm-install', description: 'تثبيت dependencies الواجهة الأمامية' },
      { type: 'app-key', description: 'إنشاء مفتاح التطبيق' },
      { type: 'migrate', description: 'تشغيل migrations قاعدة البيانات' },
      { type: 'npm-build', description: 'بناء assets الواجهة الأمامية' },
      { type: 'domain', description: 'إعداد الدومين المحلي' }
    ]
  },
  wordpress: {
    name: 'WordPress',
    icon: '🟦',
    description: 'نظام إدارة المحتوى الأشهر في العالم',
    requirements: ['php', 'mysql'],
    database: true,
    downloadUrl: 'https://wordpress.org/latest.zip',
    steps: [
      { type: 'download', description: 'تحميل WordPress' },
      { type: 'extract', description: 'استخراج الملفات' },
      { type: 'database', description: 'إنشاء قاعدة بيانات' },
      { type: 'config', description: 'تكوين wp-config.php' },
      { type: 'domain', description: 'إعداد الدومين المحلي' }
    ]
  },
  codeigniter: {
    name: 'CodeIgniter',
    icon: '🔥',
    description: 'إطار عمل PHP خفيف وسريع',
    requirements: ['php'],
    database: true,
    downloadUrl: 'https://github.com/codeigniter4/CodeIgniter4/archive/refs/heads/develop.zip',
    steps: [
      { type: 'download', description: 'تحميل CodeIgniter' },
      { type: 'extract', description: 'استخراج الملفات' },
      { type: 'database', description: 'إنشاء قاعدة بيانات' },
      { type: 'config', description: 'تكوين الإعدادات' },
      { type: 'domain', description: 'إعداد الدومين المحلي' }
    ]
  },
  symfony: {
    name: 'Symfony',
    icon: '🎼',
    description: 'إطار عمل PHP احترافي ومرن',
    requirements: ['php', 'composer'],
    database: true,
    steps: [
      { type: 'command', cmd: 'composer', args: ['create-project', 'symfony/skeleton'], description: 'إنشاء مشروع Symfony' },
      { type: 'database', description: 'إنشاء قاعدة بيانات' },
      { type: 'config', description: 'تكوين .env' },
      { type: 'domain', description: 'إعداد الدومين المحلي' }
    ]
  },
  cakephp: {
    name: 'CakePHP',
    icon: '🍰',
    description: 'إطار عمل PHP سريع التطوير',
    requirements: ['php', 'composer'],
    database: true,
    steps: [
      { type: 'command', cmd: 'composer', args: ['create-project', 'cakephp/app'], description: 'إنشاء مشروع CakePHP' },
      { type: 'database', description: 'إنشاء قاعدة بيانات' },
      { type: 'config', description: 'تكوين الإعدادات' },
      { type: 'domain', description: 'إعداد الدومين المحلي' }
    ]
  },
  express: {
    name: 'Express.js',
    icon: '⚡',
    description: 'إطار عمل Node.js سريع ومرن',
    requirements: ['node', 'npm'],
    database: false,
    steps: [
      { type: 'command', cmd: 'npx', args: ['express-generator'], description: 'إنشاء مشروع Express' },
      { type: 'command', cmd: 'npm', args: ['install'], description: 'تثبيت Dependencies' },
      { type: 'domain', description: 'إعداد الدومين المحلي' }
    ]
  },
  vue: {
    name: 'Vue.js',
    icon: '📱',
    description: 'إطار عمل JavaScript تدريجي',
    requirements: ['node', 'npm'],
    database: false,
    steps: [
      { type: 'command', cmd: 'npx', args: ['@vue/cli', 'create'], description: 'إنشاء مشروع Vue' },
      { type: 'domain', description: 'إعداد الدومين المحلي' }
    ]
  },
  react: {
    name: 'React',
    icon: '⚛️',
    description: 'مكتبة JavaScript لبناء واجهات المستخدم',
    requirements: ['node', 'npm'],
    database: false,
    steps: [
      { type: 'command', cmd: 'npx', args: ['create-react-app'], description: 'إنشاء تطبيق React' },
      { type: 'domain', description: 'إعداد الدومين المحلي' }
    ]
  }
};

// دالة التثبيت السريع الرئيسية
async function quickInstall(appType) {
  console.log('Starting quick install for:', appType);
  
  const app = quickInstallApps[appType];
  if (!app) {
    console.error('Unsupported app type:', appType);
    dialog.showErrorBox('خطأ', 'نوع التطبيق غير مدعوم');
    return;
  }

  console.log('App found:', app.name);

  // طلب اسم المشروع من المستخدم
  const result = await dialog.showMessageBox(null, {
    type: 'question',
    buttons: ['متابعة', 'إلغاء'],
    title: `تثبيت ${app.name}`,
    message: `هل تريد تثبيت ${app.name}؟`,
    detail: `${app.description}\n\nسيتم:\n• إنشاء مشروع جديد\n• ${app.database ? 'إنشاء قاعدة بيانات\n• ' : ''}إعداد دومين .test\n• تكوين البيئة`
  });

  console.log('Dialog result:', result.response);
  if (result.response !== 0) {
    console.log('Installation cancelled by user');
    return;
  }

  // طلب اسم المشروع
  try {
    const projectName = await getProjectName(app.name);
    if (!projectName) {
      console.log('Project name input cancelled');
      return;
    }
    
    console.log('Project name entered:', projectName);
    
    // بدء عملية التثبيت
    await performQuickInstall(appType, projectName);
    
  } catch (error) {
    console.error('Error getting project name:', error);
    dialog.showErrorBox('خطأ', 'فشل في الحصول على اسم المشروع');
    return;
  }


}

// طلب اسم المشروع من المستخدم
async function getProjectName(appName) {
  return new Promise((resolve) => {
    // استخدام dialog بسيط وموثوق
    const { dialog } = require('electron');
    
    // إنشاء نافذة input بسيطة
    const inputWindow = new BrowserWindow({
      width: 400,
      height: 400,
      resizable: false,
      maximizable: false,
      minimizable: false,
      alwaysOnTop: true,
      center: true,
      title: `اسم مشروع ${appName}`,
      skipTaskbar: true,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    const inputHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Cairo', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            padding: 20px;
        }
        
        .container {
            background: rgba(255,255,255,0.95);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            width: 100%;
            max-width: 350px;
        }
        
        h2 {
            color: #333;
            margin-bottom: 20px;
            font-weight: 600;
        }
        
        input {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 10px;
            font-size: 16px;
            font-family: 'Cairo', sans-serif;
            text-align: center;
            margin-bottom: 20px;
            transition: all 0.3s ease;
        }
        
        input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 10px rgba(102,126,234,0.3);
        }
        
        .buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        button {
            padding: 12px 24px;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            font-family: 'Cairo', sans-serif;
            transition: all 0.3s ease;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }
        
        .btn-secondary {
            background: #f5f5f5;
            color: #666;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .hint {
            color: #666;
            font-size: 12px;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>اسم المشروع</h2>
        <div class="hint">أدخل اسم المشروع الجديد (بدون مسافات)</div>
        <input type="text" id="projectName" placeholder="my-project" value="">
        <div class="buttons">
            <button class="btn-primary" onclick="confirmProject()">إنشاء</button>
            <button class="btn-secondary" onclick="cancelProject()">إلغاء</button>
        </div>
    </div>
    
    <script>
        const { ipcRenderer } = require('electron');
        let resolved = false;
        
        function confirmProject() {
            if (resolved) return;
            const name = document.getElementById('projectName').value.trim();
            if (name && name.length > 0) {
                resolved = true;
                ipcRenderer.send('project-name-result', name);
                window.close();
            } else {
                alert('يرجى إدخال اسم المشروع');
            }
        }
        
        function cancelProject() {
            if (resolved) return;
            resolved = true;
            ipcRenderer.send('project-name-result', null);
            window.close();
        }
        
        // تركيز على input عند التحميل
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('projectName').focus();
            document.getElementById('projectName').select();
        });
        
        // معالجة المفاتيح
        document.getElementById('projectName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmProject();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                cancelProject();
            }
        });
    </script>
</body>
</html>`;

    inputWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(inputHtml)}`);
    
    inputWindow.once('ready-to-show', () => {
      inputWindow.show();
    });

    // معالجة النتيجة
    const { ipcMain } = require('electron');
    let isHandled = false;
    
    const handleResult = (event, result) => {
      if (isHandled) return;
      isHandled = true;
      
      inputWindow.close();
      ipcMain.removeListener('project-name-result', handleResult);
      resolve(result);
    };
    
    ipcMain.once('project-name-result', handleResult);
    
    inputWindow.on('closed', () => {
      if (!isHandled) {
        isHandled = true;
        ipcMain.removeListener('project-name-result', handleResult);
        resolve(null);
      }
    });
  });
}

// فحص متطلبات التثبيت
async function checkRequirements(requirements) {
  console.log('Checking requirements:', requirements);
  
  const results = {
    allMet: true,
    missing: []
  };

  for (const req of requirements) {
    let available = false;
    
    try {
      console.log(`Checking ${req}...`);
      
      switch (req) {
        case 'php':
          // فحص وجود PHP
          const phpPath = path.join(baseDir, 'bin', 'php');
          available = fs.existsSync(phpPath);
          console.log(`PHP path: ${phpPath}, exists: ${available}`);
          break;
          
        case 'composer':
          // فحص وجود Composer (تخطي الفحص للتبسيط)
          available = true; // سنتعامل مع هذا لاحقاً
          console.log('Composer: available (temporary)');
          break;
          
        case 'mysql':
          // فحص وجود MySQL server
          const mysqlServerPath = path.join(baseDir, 'bin', 'mysql', 'bin', 'mysqld.exe');
          const mysqlClientPath = path.join(baseDir, 'bin', 'mysql', 'bin', 'mysql.exe');
          
          // نحتاج MySQL server على الأقل
          available = fs.existsSync(mysqlServerPath);
          console.log(`MySQL server path: ${mysqlServerPath}, exists: ${available}`);
          console.log(`MySQL client path: ${mysqlClientPath}, exists: ${fs.existsSync(mysqlClientPath)}`);
          break;
          
        case 'node':
          // فحص وجود Node.js (تخطي الفحص للتبسيط)
          available = true; // سنتعامل مع هذا لاحقاً
          console.log('Node.js: available (temporary)');
          break;
          
        case 'npm':
          // فحص وجود npm (تخطي الفحص للتبسيط)
          available = true; // سنتعامل مع هذا لاحقاً
          console.log('npm: available (temporary)');
          break;
          
        default:
          available = true; // متطلبات غير معروفة تعتبر متوفرة
          break;
      }
    } catch (error) {
      console.error(`Error checking ${req}:`, error);
      available = false;
    }
    
    console.log(`${req}: ${available ? 'available' : 'not available'}`);
    
    if (!available) {
      results.allMet = false;
      results.missing.push(req);
    }
  }

  console.log('Requirements check result:', results);
  return results;
}

// دالة لإضافة virtual host مع إعداد كامل تلقائي
async function addVirtualHost(projectName, appType = 'laravel') {
    try {
        console.log(`🚀 Setting up ${appType} site: ${projectName}.test`);
        
        // تحديد مجلد DocumentRoot حسب نوع التطبيق
        let documentRoot = `C:/MyDevBox/www/${projectName}`;
        let directoryPath = documentRoot;
        
        // Laravel وFrameworks أخرى تحتاج مجلد public
        if (['laravel', 'symfony', 'cakephp'].includes(appType)) {
            documentRoot += '/public';
            directoryPath += '/public';
        }
        
        const vhostContent = `
<VirtualHost *:80>
    DocumentRoot "${documentRoot}"
    ServerName ${projectName}.test
    ServerAlias www.${projectName}.test
    ErrorLog "logs/${projectName}_error.log"
    CustomLog "logs/${projectName}_access.log" common
    <Directory "${directoryPath}">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
`;

        // 1. إنشاء virtual host file
        const vhostsDir = path.join(__dirname, 'config', 'vhosts');
        if (!fs.existsSync(vhostsDir)) {
            fs.mkdirSync(vhostsDir, { recursive: true });
        }
        
        const vhostPath = path.join(vhostsDir, `${projectName}.conf`);
        fs.writeFileSync(vhostPath, vhostContent, 'utf8');
        console.log(`✅ Virtual host file created: ${projectName}.conf`);
        
        // 2. إضافة النطاق إلى ملف hosts تلقائياً
        addToHostsFile(projectName);
        
        // 3. إنشاء قاعدة البيانات إذا كان Laravel
        if (appType === 'laravel') {
            createMySQLDatabase(projectName);
        }
        
        // 4. إعداد Laravel إضافي إذا كان النوع Laravel
        if (appType === 'laravel') {
            setupLaravelEnvironment(projectName);
        }
        
        // 5. تنظيف أي Include statements خاطئة
        cleanupHttpdConf(projectName);
        
        // 6. إعادة تشغيل Apache لتحميل Virtual Host الجديد
        console.log(`🔄 Restarting Apache to load new virtual host...`);
        await restartApacheForNewSite(projectName);
        
        console.log(`🎉 ${projectName}.test is ready! Visit: http://${projectName}.test`);
        return true;
    } catch (error) {
        console.error('Error adding virtual host:', error);
        return false;
    }
}

// دالة لإضافة النطاق إلى ملف hosts تلقائياً
function addToHostsFile(projectName) {
    try {
        const domain = `${projectName}.test`;
        const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
        
        // التحقق من وجود النطاق مسبقاً
        if (fs.existsSync(hostsPath)) {
            const hostsContent = fs.readFileSync(hostsPath, 'utf8');
            if (hostsContent.includes(domain)) {
                console.log(`ℹ️ ${domain} already exists in hosts file`);
                return;
            }
        }
        
        // إضافة النطاق باستخدام PowerShell مع صلاحيات Admin
        const { spawn } = require('child_process');
        const addHostsCmd = spawn('powershell', [
            '-Command',
            `Start-Process powershell -Verb RunAs -ArgumentList "-Command \\"echo '127.0.0.1 ${domain}' >> C:\\Windows\\System32\\drivers\\etc\\hosts; echo 'Added ${domain} to hosts file'\\"" -WindowStyle Hidden -Wait`
        ], { stdio: 'ignore' });
        
        addHostsCmd.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ Added ${domain} to hosts file`);
            } else {
                console.log(`⚠️ Could not add ${domain} to hosts file automatically. Please add manually:
    127.0.0.1 ${domain}`);
            }
        });
        
    } catch (error) {
        console.error('Error adding to hosts file:', error);
        console.log(`⚠️ Please add manually to hosts file: 127.0.0.1 ${projectName}.test`);
    }
}

// دالة لإنشاء قاعدة بيانات MySQL
function createMySQLDatabase(projectName) {
    try {
        const dbName = `${projectName}_db`;
        console.log(`🗄️ Creating MySQL database: ${dbName}...`);
        
        // إنشاء ملف SQL مؤقت
        const sqlContent = `CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
        const tempSqlPath = path.join(__dirname, 'temp_create_db.sql');
        fs.writeFileSync(tempSqlPath, sqlContent, 'utf8');
        
        // تشغيل أمر MySQL
        const { spawn } = require('child_process');
        const mysqlCmd = spawn('mysql', [
            '-u', 'root',
            '-e', `source ${tempSqlPath}`
        ], { stdio: 'pipe' });
        
        mysqlCmd.on('close', (code) => {
            // حذف الملف المؤقت
            if (fs.existsSync(tempSqlPath)) {
                fs.unlinkSync(tempSqlPath);
            }
            
            if (code === 0) {
                console.log(`✅ Database ${dbName} created successfully`);
            } else {
                console.log(`⚠️ Could not create database ${dbName} automatically. Please create manually:
    CREATE DATABASE \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
            }
        });
        
        mysqlCmd.on('error', (error) => {
            // حذف الملف المؤقت في حالة الخطأ
            if (fs.existsSync(tempSqlPath)) {
                fs.unlinkSync(tempSqlPath);
            }
            console.log(`⚠️ MySQL not available or error creating database: ${error.message}`);
            console.log(`Please create database manually: CREATE DATABASE \`${dbName}\`;`);
        });
        
    } catch (error) {
        console.error('Error creating MySQL database:', error);
    }
}

// دالة لإعداد بيئة Laravel
function setupLaravelEnvironment(projectName) {
    try {
        const projectPath = path.join(__dirname, 'www', projectName);
        
        console.log(`🔧 Setting up Laravel environment for ${projectName}...`);
        
        // 1. إنشاء ملف .env إذا لم يكن موجوداً
        const envPath = path.join(projectPath, '.env');
        const envExamplePath = path.join(projectPath, '.env.example');
        
        if (!fs.existsSync(envPath)) {
            if (fs.existsSync(envExamplePath)) {
                // نسخ من .env.example
                const envContent = fs.readFileSync(envExamplePath, 'utf8');
                let updatedEnv = envContent
                    .replace('APP_URL=http://localhost', `APP_URL=http://${projectName}.test`)
                    .replace('DB_DATABASE=laravel', `DB_DATABASE=${projectName}_db`);
                
                fs.writeFileSync(envPath, updatedEnv, 'utf8');
                console.log(`✅ Created .env file from .env.example`);
            } else {
                // إنشاء ملف .env أساسي
                const basicEnv = createBasicLaravelEnv(projectName);
                fs.writeFileSync(envPath, basicEnv, 'utf8');
                console.log(`✅ Created basic .env file`);
            }
        } else {
            console.log(`ℹ️ .env file already exists`);
        }
        
        // 2. تشغيل أوامر Laravel أساسية
        runLaravelCommands(projectPath, projectName);
        
    } catch (error) {
        console.error('Error setting up Laravel environment:', error);
    }
}

// دالة لإنشاء ملف .env أساسي
function createBasicLaravelEnv(projectName) {
    return `APP_NAME=Laravel
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_TIMEZONE=UTC
APP_URL=http://${projectName}.test

APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=${projectName}_db
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

CACHE_STORE=database
CACHE_PREFIX=

MAIL_MAILER=log
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="\${APP_NAME}"

VITE_APP_NAME="\${APP_NAME}"`;
}

// دالة لتشغيل أوامر Laravel أساسية
function runLaravelCommands(projectPath, projectName) {
    try {
        console.log(`⚙️ Running Laravel setup commands...`);
        
        // تشغيل الأوامر بشكل متتالي
        const commands = [
            { cmd: 'php', args: ['artisan', 'key:generate'], desc: 'Generating application key' },
            { cmd: 'php', args: ['artisan', 'storage:link'], desc: 'Creating storage link' },
            { cmd: 'php', args: ['artisan', 'migrate', '--force'], desc: 'Running database migrations' }
        ];
        
        let commandIndex = 0;
        
        function runNextCommand() {
            if (commandIndex >= commands.length) {
                console.log(`✅ Laravel setup completed for ${projectName}`);
                return;
            }
            
            const command = commands[commandIndex];
            console.log(`📝 ${command.desc}...`);
            
            const { spawn } = require('child_process');
            const proc = spawn(command.cmd, command.args, {
                cwd: projectPath,
                stdio: 'pipe'
            });
            
            proc.on('close', (code) => {
                if (code === 0) {
                    console.log(`✅ ${command.desc} completed`);
                } else {
                    console.log(`⚠️ ${command.desc} failed (code: ${code})`);
                }
                commandIndex++;
                setTimeout(runNextCommand, 500); // تأخير قصير بين الأوامر
            });
            
            proc.on('error', (error) => {
                console.log(`⚠️ ${command.desc} error: ${error.message}`);
                commandIndex++;
                setTimeout(runNextCommand, 500);
            });
        }
        
        runNextCommand();
        
    } catch (error) {
        console.error('Error running Laravel commands:', error);
    }
}

// دالة مساعدة لإنشاء مشروع Laravel جديد بالكامل
async function createNewLaravelProject(projectName) {
    try {
        console.log(`🚀 Creating new Laravel project: ${projectName}`);
        
        const projectPath = path.join(__dirname, 'www', projectName);
        
        // التحقق من وجود المشروع مسبقاً
        if (fs.existsSync(projectPath)) {
            console.log(`⚠️ Project ${projectName} already exists`);
            // إعداد Virtual Host للمشروع الموجود
            await addVirtualHost(projectName, 'laravel');
            return;
        }
        
        console.log(`📦 Installing Laravel via Composer...`);
        
        // إنشاء مشروع Laravel جديد
        const { spawn } = require('child_process');
        const composerCmd = spawn('composer', [
            'create-project',
            'laravel/laravel',
            projectName,
            '--prefer-dist'
        ], {
            cwd: path.join(__dirname, 'www'),
            stdio: 'pipe'
        });
        
        composerCmd.stdout.on('data', (data) => {
            console.log(`Composer: ${data.toString().trim()}`);
        });
        
        composerCmd.stderr.on('data', (data) => {
            console.error(`Composer Error: ${data.toString().trim()}`);
        });
        
        composerCmd.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ Laravel project created successfully`);
                // إعداد Virtual Host و كل شيء آخر
                setTimeout(async () => {
                    await addVirtualHost(projectName, 'laravel');
                }, 1000);
            } else {
                console.error(`❌ Failed to create Laravel project (exit code: ${code})`);
                console.log(`Please create manually: composer create-project laravel/laravel ${projectName}`);
            }
        });
        
        composerCmd.on('error', (error) => {
            console.error('Error running composer:', error);
            console.log(`⚠️ Composer not available. Please install Laravel manually:
    cd C:/MyDevBox/www
    composer create-project laravel/laravel ${projectName}
    
Then use MyDevBox to add virtual host.`);
        });
        
    } catch (error) {
        console.error('Error creating Laravel project:', error);
    }
}

// دالة لإصلاح مشاريع Laravel الموجودة (تشغيل migrate)
function fixExistingLaravelProject(projectName) {
    try {
        const projectPath = path.join(__dirname, 'www', projectName);
        
        // التحقق من وجود المشروع
        if (!fs.existsSync(projectPath)) {
            console.log(`❌ Project ${projectName} not found`);
            return;
        }
        
        // التحقق من وجود ملف artisan (Laravel project)
        const artisanPath = path.join(projectPath, 'artisan');
        if (!fs.existsSync(artisanPath)) {
            console.log(`❌ ${projectName} is not a Laravel project`);
            return;
        }
        
        console.log(`🔧 Fixing Laravel project: ${projectName}...`);
        
        // تشغيل migrate للمشروع
        const { spawn } = require('child_process');
        const migrateCmd = spawn('php', ['artisan', 'migrate', '--force'], {
            cwd: projectPath,
            stdio: 'pipe'
        });
        
        migrateCmd.stdout.on('data', (data) => {
            console.log(`Migration: ${data.toString().trim()}`);
        });
        
        migrateCmd.stderr.on('data', (data) => {
            console.error(`Migration Error: ${data.toString().trim()}`);
        });
        
        migrateCmd.on('close', (code) => {
            if (code === 0) {
                console.log(`✅ Database migrations completed for ${projectName}`);
                console.log(`🎉 ${projectName}.test should now work properly!`);
            } else {
                console.log(`⚠️ Migration failed for ${projectName} (code: ${code})`);
                console.log(`Please run manually: cd www/${projectName} && php artisan migrate`);
            }
        });
        
        migrateCmd.on('error', (error) => {
            console.error('Error running migrate:', error);
            console.log(`Please run manually: cd www/${projectName} && php artisan migrate`);
        });
        
    } catch (error) {
        console.error('Error fixing Laravel project:', error);
    }
}

// دالة لإعادة تشغيل Apache بعد إنشاء موقع جديد
async function restartApacheForNewSite(projectName) {
    try {
        console.log(`🔄 Reloading Apache configuration for ${projectName}...`);
        
        // محاولة reload أولاً (أسرع)
        const reloadSuccess = await reloadApacheConfig();
        if (reloadSuccess) {
            console.log(`✅ ${projectName}.test should now work (configuration reloaded)`);
            return true;
        }
        
        // إذا فشل reload، استخدم restart كامل
        console.log('🔄 Reload failed, performing full restart...');
        console.log('🛑 Stopping Apache...');
        await killExistingApacheProcesses();
        
        // انتظار قصير للتأكد من الإيقاف
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // بدء Apache مرة أخرى
        console.log('🚀 Starting Apache with new configuration...');
        
        const configPath = path.join(__dirname, 'config', 'httpd.conf');
        const apachePath = path.join(__dirname, 'bin', 'apache', 'bin', 'httpd.exe');
        
        // التحقق من وجود الملفات
        if (!fs.existsSync(apachePath) || !fs.existsSync(configPath)) {
            console.log('⚠️ Apache files not found, skipping restart');
            return false;
        }
        
        // تشغيل Apache في الخلفية
        const { spawn } = require('child_process');
        const apacheProcess = spawn(apachePath, ['-f', configPath], {
            cwd: path.join(__dirname, 'bin', 'apache'),
            stdio: 'ignore', // تجاهل الـ output لتجنب blocking
            detached: true // تشغيل منفصل
        });
        
        // عدم انتظار العملية
        apacheProcess.unref();
        
        // انتظار قصير للتأكد من البدء
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // التحقق من أن Apache يعمل
        return new Promise((resolve) => {
            exec('netstat -an | findstr ":80"', (error, stdout) => {
                if (stdout && stdout.includes(':80')) {
                    console.log(`✅ Apache restarted successfully! ${projectName}.test should now work`);
                    resolve(true);
                } else {
                    console.log(`⚠️ Apache restart may have failed. Please check manually`);
                    resolve(false);
                }
            });
        });
        
    } catch (error) {
        console.error('Error restarting Apache:', error);
        return false;
    }
}

// دالة لإعادة تحميل Apache بدون إعادة تشغيل كامل (أسرع)
async function reloadApacheConfig() {
    try {
        console.log('🔄 Reloading Apache configuration...');
        
        const apachePath = path.join(__dirname, 'bin', 'apache', 'bin', 'httpd.exe');
        const configPath = path.join(__dirname, 'config', 'httpd.conf');
        
        if (!fs.existsSync(apachePath)) {
            console.log('⚠️ Apache not found, using restart method');
            return false;
        }
        
        // محاولة graceful restart أولاً
        const { spawn } = require('child_process');
        const reloadProcess = spawn(apachePath, ['-f', configPath, '-k', 'graceful'], {
            stdio: 'pipe'
        });
        
        return new Promise((resolve) => {
            reloadProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Apache configuration reloaded successfully');
                    resolve(true);
                } else {
                    console.log('⚠️ Graceful reload failed, using restart method');
                    resolve(false);
                }
            });
            
            reloadProcess.on('error', () => {
                console.log('⚠️ Reload command failed, using restart method');
                resolve(false);
            });
            
            // timeout بعد 5 ثوان
            setTimeout(() => {
                reloadProcess.kill();
                resolve(false);
            }, 5000);
        });
        
    } catch (error) {
        console.error('Error reloading Apache:', error);
        return false;
    }
}

// دالة لتنظيف ملف httpd.conf من Include statements خاطئة
function cleanupHttpdConf(projectName = null) {
    try {
        const httpdConfPath = path.join(__dirname, 'config', 'httpd.conf');
        if (!fs.existsSync(httpdConfPath)) {
            return;
        }
        
        let content = fs.readFileSync(httpdConfPath, 'utf8');
        
        // نسخة من المحتوى الأصلي للمقارنة
        const originalContent = content;
        
        if (projectName) {
            // إزالة Include statements لمشروع محدد
            const includePattern = new RegExp(`\\n\\s*Include\\s+"[^"]*config/vhosts/${projectName}\\.conf"`, 'g');
            content = content.replace(includePattern, '');
            
            const relativePattern = new RegExp(`\\n\\s*Include\\s+"\\.\\./\\.\\./\\.\\./config/vhosts/${projectName}\\.conf"`, 'g');
            content = content.replace(relativePattern, '');
        } else {
            // تنظيف شامل وقوي - إزالة جميع Include statements الخاطئة بجميع الأشكال الممكنة
            content = content.replace(/\n\s*Include\s+"\.\.\/\.\.\/\.\.\/config\/vhosts\/[^"]+\.conf"/g, '');
            content = content.replace(/\n\s*Include\s+"[^"]*config\/vhosts\/[^"]+\.conf"/g, '');
            content = content.replace(/\n\s*Include\s+"[^"]*vhosts\/[^"]+\.conf"/g, '');
            content = content.replace(/\n\s*Include\s+"\.\.\/[^"]*vhosts[^"]*\.conf"/g, '');
            content = content.replace(/\n\s*Include\s+"[^"]*\.\.\/[^"]*\.conf"/g, '');
            // إزالة أي Include مع مسار نسبي
            content = content.replace(/\n\s*Include\s+"\.\.\/[^"]*"/g, '');
        }
        
        // حماية إضافية: التأكد من وجود IncludeOptional الصحيح فقط
        if (!content.includes('IncludeOptional "C:/MyDevBox/config/vhosts/*.conf"')) {
            // إذا لم يكن موجوداً، أضفه قبل نهاية الملف
            const lines = content.split('\n');
            const insertIndex = lines.findIndex(line => line.includes('ServerTokens Prod')) || lines.length - 1;
            lines.splice(insertIndex, 0, '', '# Include Virtual Hosts', 'IncludeOptional "C:/MyDevBox/config/vhosts/*.conf"', '');
            content = lines.join('\n');
        }
        
        // فقط الكتابة إذا تغير المحتوى
        if (content !== originalContent) {
            // تسجيل ما تم حذفه
            const deletedLines = originalContent.split('\n').filter(line => 
                line.includes('Include') && 
                (line.includes('../../../config/vhosts/') || line.includes('config/vhosts/'))
            );
            
            if (deletedLines.length > 0) {
                console.log(`🧹 CLEANUP: Found and removed ${deletedLines.length} bad Include statements:`);
                deletedLines.forEach(line => console.log(`   ❌ ${line.trim()}`));
                
                // تسجيل stack trace لمعرفة من استدعى هذه الدالة
                console.log('📍 Cleanup called from:');
                const stack = new Error().stack.split('\n').slice(1, 5);
                stack.forEach(line => console.log(`   ${line.trim()}`));
            }
            
            fs.writeFileSync(httpdConfPath, content, 'utf8');
            console.log(`✅ httpd.conf cleaned successfully`);
        }
        
    } catch (error) {
        console.error('Error cleaning up httpd.conf:', error);
    }
}

// دالة لإعداد مراقب ملف httpd.conf
function setupHttpdConfWatcher() {
    try {
        const httpdConfPath = path.join(__dirname, 'config', 'httpd.conf');
        if (!fs.existsSync(httpdConfPath)) {
            return;
        }
        
        // حفظ المحتوى الأصلي للمقارنة
        let lastKnownContent = fs.readFileSync(httpdConfPath, 'utf8');
        
        // مراقبة تغييرات ملف httpd.conf مع فترة أقصر
        fs.watchFile(httpdConfPath, { interval: 500 }, (curr, prev) => {
            if (curr.mtime !== prev.mtime) {
                console.log('🔍 httpd.conf modified - analyzing changes...');
                
                const currentContent = fs.readFileSync(httpdConfPath, 'utf8');
                const currentLines = currentContent.split('\n');
                const lastLines = lastKnownContent.split('\n');
                
                // البحث عن الأسطر المُضافة
                const addedLines = currentLines.filter((line, index) => 
                    line.includes('Include') && 
                    (line.includes('../../../config/vhosts/') || line.includes('config/vhosts/')) &&
                    !lastLines[index]?.includes(line)
                );
                
                if (addedLines.length > 0) {
                    console.log(`🚨 DETECTED: Someone added ${addedLines.length} bad Include statements:`);
                    addedLines.forEach(line => console.log(`   ➕ ${line.trim()}`));
                    
                    // تسجيل timestamp
                    console.log(`   🕐 Time: ${new Date().toLocaleString()}`);
                }
                
                lastKnownContent = currentContent;
                
                // تأخير قصير جداً قبل التنظيف
                setTimeout(() => {
                    cleanupHttpdConf();
                }, 200);
            }
        });
        
        // مراقبة إضافية باستخدام fs.watch للاستجابة الفورية
        fs.watch(httpdConfPath, (eventType) => {
            if (eventType === 'change') {
                console.log('⚡ httpd.conf changed - immediate cleanup...');
                setTimeout(() => {
                    cleanupHttpdConf();
                }, 100);
            }
        });
        
        console.log('🛡️ httpd.conf enhanced monitoring system activated');
        
    } catch (error) {
        console.error('Error setting up httpd.conf watcher:', error);
    }
}

// دالة لإعادة تشغيل Apache
function restartApache() {
    try {
        // إيقاف Apache
        const stopResult = spawn('taskkill', ['/F', '/IM', 'httpd.exe'], {
            stdio: 'ignore',
            detached: false
        });
        
        setTimeout(() => {
            // تشغيل Apache
            startApache();
        }, 2000);
        
    } catch (error) {
        console.error('Error restarting Apache:', error);
    }
}

// تنفيذ التثبيت السريع
async function performQuickInstall(appType, projectName) {
  const app = quickInstallApps[appType];
  const projectPath = path.join(baseDir, 'www', projectName);
  const domain = `${projectName}.test`;
  
  // فحص المتطلبات أولاً
  console.log('Checking requirements for', app.name);
  const requirementsCheck = await checkRequirements(app.requirements);
  if (!requirementsCheck.allMet) {
    dialog.showErrorBox('متطلبات مفقودة', 
      `المتطلبات التالية مفقودة:\n${requirementsCheck.missing.join('\n')}\n\nيرجى تثبيتها أولاً.`);
    return;
  }
  
  console.log('All requirements met, starting installation...');
  
  // إنشاء نافذة التقدم
  createProgressWindow(`تثبيت ${app.name}`, `جاري تثبيت ${app.name}...`);
  
  try {
    let stepIndex = 0;
    const totalSteps = app.steps.length;
    
    for (const step of app.steps) {
      stepIndex++;
      const progress = Math.round((stepIndex / totalSteps) * 100);
      
      updateProgressWindow(
        `${step.description}...`,
        progress,
        `الخطوة ${stepIndex} من ${totalSteps}: ${step.description}`
      );
      
      await new Promise(resolve => setTimeout(resolve, 500)); // تأخير بصري
      
      switch (step.type) {
        case 'download':
          await downloadAndExtract(app.downloadUrl, projectPath);
          break;
          
        case 'extract':
          // تم التعامل معه في download
          break;
          
        case 'command':
          await executeCommand(step.cmd, [...step.args, projectName], path.join(baseDir, 'www'));
          break;
          
        case 'database':
          if (app.database) {
            try {
              await createDatabase(projectName);
            } catch (error) {
              console.warn('Failed to create database:', error.message);
              
              // عرض تحذير للمستخدم ولكن المتابعة
              updateProgressWindow(
                'تحذير: فشل في إنشاء قاعدة البيانات',
                Math.round((stepIndex / totalSteps) * 100),
                `تم تخطي إنشاء قاعدة البيانات.\nيمكنك إنشاؤها يدوياً لاحقاً.\nاسم قاعدة البيانات: ${projectName}_db`
              );
              
              // إنتظار قليل لقراءة الرسالة
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
          break;
          
        case 'config':
          await configureProject(appType, projectName, projectPath);
          break;
          
        case 'npm-install':
          try {
            await executeCommand('npm', ['install'], projectPath);
          } catch (error) {
            console.warn('npm install failed, continuing anyway:', error.message);
            // لا نوقف العملية، سنتابع بدون npm install
          }
          break;
          
        case 'app-key':
          if (appType === 'laravel') {
            try {
              await executeCommand('php', ['artisan', 'key:generate'], projectPath);
            } catch (error) {
              console.warn('Failed to generate app key:', error.message);
            }
          }
          break;
          
        case 'migrate':
          if (appType === 'laravel') {
            try {
              // التأكد من أن MySQL يعمل أولاً
              if (!isServiceRunning('mysql')) {
                console.log('Trying to start MySQL...');
                await startMySQL();
                await new Promise(resolve => setTimeout(resolve, 3000));
              }
              
              // فحص الاتصال بقاعدة البيانات أولاً
              await executeCommand('php', ['artisan', 'migrate:status'], projectPath);
              
              // تشغيل migrations
              await executeCommand('php', ['artisan', 'migrate', '--force'], projectPath);
            } catch (error) {
              console.warn('Failed to run migrations:', error.message);
              
              // عرض تحذير مفصل للمستخدم
              updateProgressWindow(
                'تحذير: فشل في تشغيل Migrations',
                Math.round((stepIndex / totalSteps) * 100),
                `يمكنك تشغيل migrations لاحقاً:\n1. تأكد من تشغيل MySQL\n2. إنشاء قاعدة البيانات: ${projectName}_db\n3. تشغيل: php artisan migrate`
              );
              
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
          break;
          
        case 'npm-build':
          try {
            await executeCommand('npm', ['run', 'build'], projectPath);
          } catch (error) {
            console.warn('npm run build failed, continuing without building assets:', error.message);
            // لا نوقف العملية، يمكن للمستخدم تشغيل npm run dev لاحقاً
          }
          break;
          
        case 'domain':
          // استخدام addVirtualHost فقط للتثبيت السريع لأنها تدعم Laravel والFrameworks الأخرى
          addVirtualHost(projectName, appType);
          try {
            addToHosts(domain);
          } catch (hostsError) {
            console.error('Error updating hosts file:', hostsError);
            // سنتعامل مع الخطأ في النهاية
          }
          break;
      }
    }
    
    // إنهاء التثبيت
    updateProgressWindow('تم التثبيت بنجاح!', 100, 'جاري فتح المشروع...');
    
    setTimeout(() => {
      closeProgressWindow();
      
      // عرض رسالة النجاح مع خيارات
      dialog.showMessageBox(null, {
        type: 'info',
        title: 'تم التثبيت بنجاح!',
        message: `تم تثبيت ${app.name} بنجاح!`,
        detail: `اسم المشروع: ${projectName}\nالمجلد: ${projectPath}\nالرابط: http://${domain}\n${app.database ? `قاعدة البيانات: ${projectName}_db` : ''}`,
        buttons: ['فتح الموقع', 'فتح المجلد', 'موافق']
      }).then((result) => {
        if (result.response === 0) {
          // فتح الموقع
          shell.openExternal(`http://${domain}`);
        } else if (result.response === 1) {
          // فتح المجلد
          shell.openPath(projectPath);
        }
      });
      
      refreshMenu();
      showNotification(`تم تثبيت ${app.name}`, `المشروع ${projectName} جاهز للاستخدام!`);
      
    }, 1000);
    
  } catch (error) {
    closeProgressWindow();
    dialog.showErrorBox('خطأ في التثبيت', `فشل في تثبيت ${app.name}:\n${error.message}`);
  }
}

// تحميل واستخراج الملفات
async function downloadAndExtract(downloadUrl, targetPath) {
  return new Promise((resolve, reject) => {
    const tempZip = path.join(baseDir, 'tmp', 'download.zip');
    
    // إنشاء مجلد tmp إذا لم يكن موجوداً
    const tmpDir = path.dirname(tempZip);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    const file = fs.createWriteStream(tempZip);
    
    https.get(downloadUrl, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        return downloadAndExtract(response.headers.location, targetPath);
      }
      
      response.pipe(file);
      
      file.on('finish', async () => {
        file.close();
        
        try {
          // استخراج الملفات
          await extract(tempZip, { dir: path.dirname(targetPath) });
          
          // العثور على المجلد المستخرج وإعادة تسميته
          const extractedFiles = fs.readdirSync(path.dirname(targetPath));
          const extractedFolder = extractedFiles.find(name => 
            name !== path.basename(targetPath) && 
            fs.statSync(path.join(path.dirname(targetPath), name)).isDirectory()
          );
          
          if (extractedFolder) {
            const extractedPath = path.join(path.dirname(targetPath), extractedFolder);
            if (fs.existsSync(targetPath)) {
              fs.rmSync(targetPath, { recursive: true, force: true });
            }
            fs.renameSync(extractedPath, targetPath);
          }
          
          // حذف الملف المؤقت
          fs.unlinkSync(tempZip);
          resolve();
          
        } catch (error) {
          reject(error);
        }
      });
      
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// تنفيذ أوامر النظام
async function executeCommand(cmd, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`Running command: ${cmd} ${args.join(' ')} in ${cwd}`);
    
    // تحديد المسار الصحيح للأوامر
    let fullCmd = cmd;
    if (cmd === 'php') {
      fullCmd = path.join(baseDir, 'bin', 'php', 'php.exe');
    } else if (cmd === 'composer') {
      // سنستخدم composer.phar إذا كان متوفر
      const composerPath = path.join(baseDir, 'bin', 'composer.phar');
      if (fs.existsSync(composerPath)) {
        const phpPath = path.join(baseDir, 'bin', 'php', 'php.exe');
        fullCmd = phpPath;
        args = [composerPath, ...args];
      }
    }
    
    const proc = spawn(fullCmd, args, { 
      cwd: cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true // إضافة shell للتعامل مع npm على Windows
    });
    
    let output = '';
    let errorOutput = '';
    
    proc.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(`stdout: ${text.trim()}`);
    });
    
    proc.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      console.log(`stderr: ${text.trim()}`);
    });
    
    proc.on('close', (code) => {
      console.log(`Command finished with code: ${code}`);
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}:\nOutput: ${output}\nError: ${errorOutput}`));
      }
    });
    
    proc.on('error', (error) => {
      console.error(`Error running command: ${error.message}`);
      reject(error);
    });
  });
}

// إنشاء قاعدة بيانات جديدة
async function createDatabase(projectName) {
  // إذا كان الاسم يحتوي على _db بالفعل، لا نضيفه مرة أخرى
  const dbName = projectName.endsWith('_db') ? projectName : `${projectName}_db`;
  
  // البحث عن MySQL client في مسارات مختلفة
  const possibleMysqlPaths = [
    path.join(baseDir, 'bin', 'mysql', 'bin', 'mysql.exe'),
    path.join(baseDir, 'bin', 'mysql', 'mysql.exe'),
    'mysql', // استخدام النظام إذا كان مثبت globally
  ];
  
  let mysqlPath = null;
  
  for (const testPath of possibleMysqlPaths) {
    if (testPath === 'mysql') {
      // سنختبر هذا عند التشغيل
      mysqlPath = testPath;
      break;
    } else if (fs.existsSync(testPath)) {
      mysqlPath = testPath;
      break;
    }
  }
  
  if (!mysqlPath) {
    console.warn('MySQL client not found, skipping database creation');
    throw new Error('MySQL client غير موجود. يمكنك إنشاء قاعدة البيانات يدوياً لاحقاً.\nاسم قاعدة البيانات المطلوبة: ' + dbName);
  }
  
  // التأكد من تشغيل MySQL server
  if (!isServiceRunning('mysql')) {
    console.log('MySQL server not running, trying to start it...');
    try {
      await startMySQL();
      // انتظار قليل للتأكد من بدء الخدمة
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      throw new Error('فشل في تشغيل MySQL server. يرجى تشغيله يدوياً ثم إنشاء قاعدة البيانات: ' + dbName);
    }
  }
  
  // إنشاء قاعدة البيانات
  const createDbCommand = `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
  
  try {
    // استخدام exec بدلاً من spawn لتجنب مشاكل Windows
    const command = `"${mysqlPath}" -h localhost -P 3306 -u root -e "${createDbCommand}"`;
    
    await new Promise((resolve, reject) => {
      exec(command, { cwd: baseDir }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
    
    console.log(`Database ${dbName} created successfully`);
    
  } catch (error) {
    console.error('Error creating database:', error);
    
    // إذا فشل، نعطي رسالة مفيدة للمستخدم
    if (error.code === 'ENOENT') {
      throw new Error(`MySQL client غير موجود في المسار: ${mysqlPath}\n\nيمكنك:\n1. تثبيت MySQL\n2. إنشاء قاعدة البيانات يدوياً: ${dbName}\n3. أو استكمال التثبيت بدون قاعدة بيانات`);
    } else if (error.message.includes('Access denied')) {
      throw new Error(`خطأ في صلاحيات MySQL\n\nتأكد من:\n1. MySQL يعمل\n2. المستخدم root متاح\n3. كلمة المرور صحيحة\n\nقاعدة البيانات المطلوبة: ${dbName}`);
    } else {
      throw new Error(`فشل في إنشاء قاعدة البيانات: ${error.message}\n\nاسم قاعدة البيانات: ${dbName}`);
    }
  }
}

// تكوين المشاريع
async function configureProject(appType, projectName, projectPath) {
  const dbName = `${projectName}_db`;
  
  switch (appType) {
    case 'laravel':
      await configureLaravel(projectPath, dbName);
      break;
      
    case 'wordpress':
      await configureWordPress(projectPath, dbName);
      break;
      
    case 'codeigniter':
      await configureCodeIgniter(projectPath, dbName);
      break;
      
    case 'symfony':
      await configureSymfony(projectPath, dbName);
      break;
      
    case 'cakephp':
      await configureCakePHP(projectPath, dbName);
      break;
  }
}

// تكوين Laravel
async function configureLaravel(projectPath, dbName) {
  const envPath = path.join(projectPath, '.env');
  const envExamplePath = path.join(projectPath, '.env.example');
  
  let envContent = '';
  
  // محاولة قراءة ملف .env الموجود
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  // إذا لم يوجد ملف .env، استخدم .env.example كقالب
  else if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
    console.log('Using .env.example as template to create .env');
  }
  // إذا لم يوجد أي منهما، إنشاء محتوى أساسي
  else {
    console.log('Creating new .env file from scratch');
         envContent = `APP_NAME=Laravel
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://${path.basename(projectPath)}.test

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=${dbName}
DB_USERNAME=root
DB_PASSWORD=

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="\${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

VITE_APP_NAME="\${APP_NAME}"
VITE_PUSHER_APP_KEY="\${PUSHER_APP_KEY}"
VITE_PUSHER_HOST="\${PUSHER_HOST}"
VITE_PUSHER_PORT="\${PUSHER_PORT}"
VITE_PUSHER_SCHEME="\${PUSHER_SCHEME}"
VITE_PUSHER_APP_CLUSTER="\${PUSHER_APP_CLUSTER}"`;
  }
  
  // تحديث إعدادات قاعدة البيانات والدومين
  const projectName = path.basename(projectPath);
  const appSettings = {
    'APP_URL': `http://${projectName}.test`,
    'DB_CONNECTION': 'mysql',
    'DB_HOST': '127.0.0.1',
    'DB_PORT': '3306',
    'DB_DATABASE': dbName,
    'DB_USERNAME': 'root',
    'DB_PASSWORD': ''
  };
  
  // تحديث أو إضافة كل إعداد
  Object.entries(appSettings).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      // تحديث القيمة الموجودة
      envContent = envContent.replace(regex, `${key}=${value}`);
           } else {
         // إضافة القيمة إذا لم تكن موجودة
         if (key === 'APP_URL') {
           // البحث عن قسم APP
           const appSectionRegex = /^APP_NAME=.*$/m;
           if (appSectionRegex.test(envContent)) {
             // إضافة بعد APP_NAME
             envContent = envContent.replace(appSectionRegex, `$&\n${key}=${value}`);
           } else {
             // إضافة في بداية الملف
             envContent = `${key}=${value}\n` + envContent;
           }
         } else {
           // البحث عن قسم قاعدة البيانات
           const dbSectionRegex = /^DB_CONNECTION=.*$/m;
           if (dbSectionRegex.test(envContent)) {
             // إضافة بعد DB_CONNECTION
             envContent = envContent.replace(dbSectionRegex, `DB_CONNECTION=mysql\n${key}=${value}`);
           } else {
             // إضافة في نهاية الملف
             envContent += `\n${key}=${value}`;
           }
         }
       }
  });
  
  // حفظ ملف .env
  fs.writeFileSync(envPath, envContent, 'utf8');
  
  // إنشاء قاعدة البيانات تلقائياً
  await createDatabase(dbName);
  
  console.log(`Laravel configured with database: ${dbName} and domain: ${projectName}.test`);
}

// تكوين WordPress
async function configureWordPress(projectPath, dbName) {
  const configPath = path.join(projectPath, 'wp-config.php');
  const sampleConfigPath = path.join(projectPath, 'wp-config-sample.php');
  
  if (fs.existsSync(sampleConfigPath) && !fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(sampleConfigPath, 'utf8');
    
    // تحديث إعدادات قاعدة البيانات
    configContent = configContent.replace(/database_name_here/g, dbName);
    configContent = configContent.replace(/username_here/g, 'root');
    configContent = configContent.replace(/password_here/g, '');
    configContent = configContent.replace(/localhost/g, 'localhost');
    
    // إضافة مفاتيح الأمان
    const saltKeys = [
      'AUTH_KEY', 'SECURE_AUTH_KEY', 'LOGGED_IN_KEY', 'NONCE_KEY',
      'AUTH_SALT', 'SECURE_AUTH_SALT', 'LOGGED_IN_SALT', 'NONCE_SALT'
    ];
    
    saltKeys.forEach(key => {
      const randomKey = generateRandomString(64);
      configContent = configContent.replace(
        new RegExp(`define\\('${key}',\\s*'put your unique phrase here'\\);`),
        `define('${key}', '${randomKey}');`
      );
    });
    
    fs.writeFileSync(configPath, configContent);
  }
}

// تكوين CodeIgniter
async function configureCodeIgniter(projectPath, dbName) {
  const configPath = path.join(projectPath, 'app', 'Config', 'Database.php');
  
  if (fs.existsSync(configPath)) {
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // تحديث إعدادات قاعدة البيانات
    configContent = configContent.replace(/'database'\s*=>\s*'[^']*'/, `'database' => '${dbName}'`);
    configContent = configContent.replace(/'username'\s*=>\s*'[^']*'/, `'username' => 'root'`);
    configContent = configContent.replace(/'password'\s*=>\s*'[^']*'/, `'password' => ''`);
    
    fs.writeFileSync(configPath, configContent);
  }
}

// تكوين Symfony
async function configureSymfony(projectPath, dbName) {
  const envPath = path.join(projectPath, '.env');
  
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // تحديث DATABASE_URL
    const databaseUrl = `mysql://root:@127.0.0.1:3306/${dbName}?serverVersion=8.0&charset=utf8mb4`;
    envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL="${databaseUrl}"`);
    
    fs.writeFileSync(envPath, envContent);
  }
}

// تكوين CakePHP
async function configureCakePHP(projectPath, dbName) {
  const configPath = path.join(projectPath, 'config', 'app_local.php');
  
  const localConfig = `<?php
return [
    'Datasources' => [
        'default' => [
            'host' => 'localhost',
            'username' => 'root',
            'password' => '',
            'database' => '${dbName}',
            'port' => '3306',
        ],
    ],
];`;

  fs.writeFileSync(configPath, localConfig);
}

// فحص ما إذا كان المنفذ متاحاً
function isPortAvailable(port) {
  const net = require('net');
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

// Render a Mustache template and write to destination
function renderTemplate(srcTpl, dest, vars) {
  const tplPath = path.join(baseDir, 'config', srcTpl);
  const tpl     = fs.readFileSync(tplPath, 'utf8');
  const out     = mustache.render(tpl, vars);
  fs.writeFileSync(dest, out, 'utf8');
}

// Generate MySQL configuration file
function generateMySQLConfig() {
  // Ensure tmp directory exists
  const tmpDir = path.join(baseDir, 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  
  // Create config directly without templates to avoid HTML encoding
  const mysqlBasedir = path.join(baseDir, 'bin', 'mysql').replace(/\\/g, '/');
  const mysqlDatadir = path.join(baseDir, 'bin', 'mysql', 'data').replace(/\\/g, '/');
  const mysqlTmpdir = path.join(baseDir, 'tmp').replace(/\\/g, '/');
  
  const config = `[client]
port=3306
default-character-set=utf8mb4

[mysqld]
port=3306
basedir="${mysqlBasedir}"
tmpdir="${mysqlTmpdir}"
datadir="${mysqlDatadir}"
pid_file="mysql.pid"
key_buffer_size=16M
max_allowed_packet=1M
sort_buffer_size=512K
net_buffer_length=8K
read_buffer_size=256K
read_rnd_buffer_size=512K
myisam_sort_buffer_size=8M
log_error="mysql_error.log"

# Bind to localhost only for security
bind-address="127.0.0.1"

# Character set (server settings)
character-set-server=utf8mb4
collation-server=utf8mb4_general_ci

# InnoDB settings
innodb_data_home_dir="${mysqlDatadir}"
innodb_data_file_path=ibdata1:10M:autoextend
innodb_log_group_home_dir="${mysqlDatadir}"
innodb_buffer_pool_size=16M
innodb_log_file_size=5M
innodb_log_buffer_size=8M
innodb_flush_log_at_trx_commit=1
innodb_lock_wait_timeout=50

# SQL Mode
sql_mode=NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION
log_bin_trust_function_creators=1

[mysqldump]
max_allowed_packet=16M

[mysql]
default-character-set=utf8mb4

[isamchk]
key_buffer_size=20M
sort_buffer_size=20M
read_buffer=2M
write_buffer=2M

[myisamchk]
key_buffer_size=20M
sort_buffer_size=20M
read_buffer=2M
write_buffer=2M`;

  const configPath = path.join(baseDir, 'config', 'my.ini');
  fs.writeFileSync(configPath, config);
  console.log('MySQL configuration generated successfully');
}

// Test MySQL configuration
function testMySQLConfig() {
  generateMySQLConfig();
  const configPath = path.join(baseDir, 'config', 'my.ini');
  const proc = spawn(path.join(baseDir, 'bin', 'mysql', 'bin', 'mysqld.exe'), [
    '--defaults-file=' + configPath,
    '--help',
    '--verbose'
  ], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  let output = '';
  proc.stdout.on('data', (data) => output += data.toString());
  proc.stderr.on('data', (data) => output += data.toString());
  
  proc.on('close', (code) => {
    if (code === 0) {
      dialog.showMessageBox(null, {
        type: 'info',
        title: 'اختبار تكوين MySQL',
        message: 'تكوين MySQL صحيح ✅',
        detail: 'MySQL جاهز للتشغيل'
      });
    } else {
      dialog.showMessageBox(null, {
        type: 'error',
        title: 'خطأ في تكوين MySQL',
        message: `خطأ في التكوين (Code: ${code})`,
        detail: output.length > 500 ? output.substring(0, 500) + '...' : output
      });
    }
  });
}

// Start a service by spawning its executable
function startService(name, exePath, args = []) {
  if (processes[name] && !processes[name].killed) return;
  
  // التحقق من وجود الملف التنفيذي
  if (!fs.existsSync(exePath)) {
    dialog.showErrorBox('خطأ', `لا يمكن العثور على ${name} في المسار:\n${exePath}`);
    return;
  }
  
  const proc = spawn(exePath, args, { 
    cwd: path.dirname(exePath),
    stdio: ['ignore', 'pipe', 'pipe'] // للحصول على رسائل الخطأ
  });
  
  // معالجة رسائل الخطأ
  proc.stderr.on('data', (data) => {
    console.error(`${name} Error:`, data.toString());
  });
  
  proc.on('exit', (code) => {
    processes[name] = null;
    if (code !== 0 && code !== null) {
      dialog.showErrorBox('خطأ في الخدمة', `${name} توقف برمز الخطأ: ${code}`);
    }
    refreshMenu();
  });
  
  proc.on('error', (err) => {
    processes[name] = null;
    dialog.showErrorBox('خطأ في تشغيل الخدمة', `فشل في تشغيل ${name}:\n${err.message}`);
    refreshMenu();
  });
  
  processes[name] = proc;
  setTimeout(refreshMenu, 1000); // تأخير قصير للتأكد من بدء العملية
}

// Stop a running service
function stopService(name) {
  const proc = processes[name];
  if (!proc) return;
  proc.kill();
  processes[name] = null;
  refreshMenu();
}

// Check if a given service is currently running
function isServiceRunning(name) {
  const proc = processes[name];
  return proc && !proc.killed;
}

// Detect installed PHP versions in bin/php/
function detectPHPVersions() {
  const phpDir = path.join(baseDir, 'bin', 'php');
  if (!fs.existsSync(phpDir)) return [];
  
  return fs.readdirSync(phpDir)
    .filter(name => fs.statSync(path.join(phpDir, name)).isDirectory())
    .map(name => ({ name, path: path.join(phpDir, name) }));
}

let tray;

// Detect websites in www folder
function detectWebsites() {
  const wwwPath = path.join(baseDir, 'www');
  if (!fs.existsSync(wwwPath)) return [];
  
  return fs.readdirSync(wwwPath)
    .filter(item => {
      const itemPath = path.join(wwwPath, item);
      return fs.statSync(itemPath).isDirectory() && 
             item !== 'phpmyadmin'; // استثناء مجلد phpMyAdmin
    })
    .map(siteName => {
      // البحث في المسار الصحيح لـ virtual hosts
      const vhostPath = path.join(baseDir, 'config', 'vhosts', `${siteName}.conf`);
      const hasVhost = fs.existsSync(vhostPath);
      const domain = `${siteName}.test`;
      
      return {
        name: siteName,
        path: path.join(wwwPath, siteName),
        hasIndex: fs.existsSync(path.join(wwwPath, siteName, 'index.html')) ||
                  fs.existsSync(path.join(wwwPath, siteName, 'index.php')),
        hasVhost: hasVhost,
        domain: domain,
        domainUrl: `http://${domain}`,
        url: `http://localhost/${siteName}`
      };
    });
}

// Get hosts file path
function getHostsFilePath() {
  if (os.platform() === 'win32') {
    return 'C:\\Windows\\System32\\drivers\\etc\\hosts';
  } else {
    return '/etc/hosts';
  }
}

// Add domain to hosts file
function addToHosts(domain) {
  const hostsPath = getHostsFilePath();
  const entry = `127.0.0.1 ${domain}`;
  
  try {
    // Check if we have permission to read the hosts file
    if (!fs.existsSync(hostsPath)) {
      console.error('Hosts file not found');
      return false;
    }
    
    const hostsContent = fs.readFileSync(hostsPath, 'utf8');
    if (!hostsContent.includes(domain)) {
      fs.appendFileSync(hostsPath, `\n# MyDevBox - ${domain}\n${entry}\n`);
      return true;
    }
    return true; // Already exists
  } catch (error) {
    console.error('Error updating hosts file:', error);
    // If permission denied, suggest running as admin
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      dialog.showErrorBox('صلاحيات غير كافية', 
        'لا يمكن تحديث ملف hosts. يرجى:\n' +
        '1. إغلاق البرنامج\n' +
        '2. تشغيله بصلاحيات المدير\n' +
        '3. أو استخدام "أداة إعداد Hosts"'
      );
    }
    return false;
  }
}

// Remove domain from hosts file
function removeFromHosts(domain) {
  const hostsPath = getHostsFilePath();
  
  try {
    let hostsContent = fs.readFileSync(hostsPath, 'utf8');
    const lines = hostsContent.split('\n');
    const filteredLines = lines.filter(line => 
      !line.includes(domain) && !line.includes(`# MyDevBox - ${domain}`)
    );
    fs.writeFileSync(hostsPath, filteredLines.join('\n'));
    return true;
  } catch (error) {
    console.error('Error updating hosts file:', error);
    return false;
  }
}

// Create virtual host configuration
function createVirtualHost(siteName, sitePath, appType = null) {
  const vhostPath = path.join(baseDir, 'config', 'vhosts', `${siteName}.conf`);
  
  try {
    let documentRoot = sitePath.replace(/\\/g, '/');
    let directoryPath = documentRoot;
    
    // التحقق من نوع التطبيق - إذا كان Laravel أو framework آخر يحتاج public
    if (appType && ['laravel', 'symfony', 'cakephp'].includes(appType)) {
      documentRoot += '/public';
      directoryPath += '/public';
    } else {
      // التحقق الذكي من وجود مجلد public (Laravel detection)
      const publicPath = path.join(sitePath, 'public');
      const artisanPath = path.join(sitePath, 'artisan');
      
      if (fs.existsSync(publicPath) && fs.existsSync(artisanPath)) {
        // هذا مشروع Laravel
        documentRoot += '/public';
        directoryPath += '/public';
      }
    }
    
    const vhostContent = `# Virtual Host for ${siteName}.test
<VirtualHost *:80>
    ServerName ${siteName}.test
    ServerAlias www.${siteName}.test
    DocumentRoot "${documentRoot}"
    
    <Directory "${directoryPath}">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Custom log files for this site
    ErrorLog "logs/${siteName}-error.log"
    CustomLog "logs/${siteName}-access.log" combined
</VirtualHost>`;
    
    fs.writeFileSync(vhostPath, vhostContent);
    return true;
  } catch (error) {
    console.error('Error creating virtual host:', error);
    return false;
  }
}

// Remove virtual host configuration
function removeVirtualHost(siteName) {
  const vhostPath = path.join(baseDir, 'config', 'vhosts', `${siteName}.conf`);
  
  try {
    if (fs.existsSync(vhostPath)) {
      fs.unlinkSync(vhostPath);
    }
    return true;
  } catch (error) {
    console.error('Error removing virtual host:', error);
    return false;
  }
}

// Create a new website
function createNewSite() {
  dialog.showMessageBox(null, {
    type: 'question',
    buttons: ['إنشاء', 'إلغاء'],
    title: 'إنشاء موقع جديد',
    message: 'ما اسم الموقع الجديد؟',
    detail: 'سيتم إنشاء مجلد جديد في www/'
  }).then(result => {
    if (result.response === 0) {
      // Show input dialog for site name
      const siteName = require('electron').dialog.showSaveDialogSync(null, {
        title: 'اسم الموقع',
        defaultPath: path.join(baseDir, 'www', 'new-site'),
        properties: ['createDirectory']
      });
      
      if (siteName) {
        const siteFolder = path.basename(siteName);
        const sitePath = path.join(baseDir, 'www', siteFolder);
        
        if (!fs.existsSync(sitePath)) {
          fs.mkdirSync(sitePath, { recursive: true });
          
          // Create Virtual Host
          const vhostCreated = createVirtualHost(siteFolder, sitePath);
          
          // Add to hosts file
          const domain = `${siteFolder}.test`;
          const hostsUpdated = addToHosts(domain);
          
          // Create basic index.php
          const indexContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${siteFolder}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #2c3e50; }
        .info { background: #ecf0f1; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .success { color: #27ae60; }
        .warning { color: #f39c12; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 مرحباً بك في ${siteFolder}</h1>
        <div class="info">
            <p><strong>المسار:</strong> ${sitePath}</p>
            <p><strong>الدومين المحلي:</strong> <a href="http://${domain}" class="success">${domain}</a></p>
            <p><strong>الرابط التقليدي:</strong> <a href="http://localhost/${siteFolder}">localhost/${siteFolder}</a></p>
            <p><strong>الوقت:</strong> <?php echo date('Y-m-d H:i:s'); ?></p>
        </div>
        ${!hostsUpdated ? '<p class="warning">⚠️ تحتاج لتشغيل البرنامج كمدير لإعداد الدومين</p>' : ''}
        <p>يمكنك الآن البدء في تطوير موقعك!</p>
    </div>
</body>
</html>`;
          
          fs.writeFileSync(path.join(sitePath, 'index.php'), indexContent);
          
          let message = `تم إنشاء موقع "${siteFolder}" بنجاح!`;
          let detail = `الدومين المحلي: http://${domain}`;
          
          if (!hostsUpdated) {
            detail += '\n⚠️ لم يتم تحديث ملف hosts - قم بتشغيل البرنامج كمدير';
          }
          
          if (!vhostCreated) {
            detail += '\n⚠️ فشل في إنشاء Virtual Host';
          }
          
          dialog.showMessageBox(null, {
            type: vhostCreated && hostsUpdated ? 'info' : 'warning',
            title: 'تم إنشاء الموقع',  
            message: message,
            detail: detail
          });
          
          // Restart Apache to apply changes
          if (isServiceRunning('apache')) {
            stopService('apache');
            setTimeout(() => {
              startService('apache', path.join(baseDir, 'bin', 'apache', 'bin', 'httpd.exe'), ['-f', path.join(baseDir, 'bin', 'apache', 'conf', 'mydevbox.conf')]);
            }, 2000);
          }
          
          refreshMenu();
        }
      }
    }
  });
}

// Create domain for existing site
function createSiteDomain(siteName, sitePath) {
  const domain = `${siteName}.test`;
  
  dialog.showMessageBox(null, {
    type: 'question',
    buttons: ['إنشاء', 'إلغاء'],
    title: 'إنشاء دومين محلي',
    message: `هل تريد إنشاء الدومين ${domain}؟`,
    detail: 'سيتم إضافة Virtual Host وتحديث ملف hosts'
  }).then(result => {
    if (result.response === 0) {
      const vhostCreated = createVirtualHost(siteName, sitePath); // سيتم الكشف التلقائي عن Laravel
      const hostsUpdated = addToHosts(domain);
      
      let message = vhostCreated ? 'تم إنشاء الدومين بنجاح!' : 'فشل في إنشاء Virtual Host';
      let detail = `الدومين: http://${domain}`;
      
      if (!hostsUpdated) {
        detail += '\n⚠️ لم يتم تحديث ملف hosts - قم بتشغيل البرنامج كمدير';
      }
      
      dialog.showMessageBox(null, {
        type: vhostCreated && hostsUpdated ? 'info' : 'warning',
        title: 'إنشاء دومين',
        message: message,
        detail: detail
      });
      
      // Restart Apache
      if (isServiceRunning('apache')) {
        stopService('apache');
        setTimeout(() => {
          startService('apache', path.join(baseDir, 'bin', 'apache', 'bin', 'httpd.exe'), ['-f', path.join(baseDir, 'bin', 'apache', 'conf', 'mydevbox.conf')]);
        }, 2000);
      }
      
      refreshMenu();
    }
  });
}

// Remove domain for site
function removeSiteDomain(siteName) {
  const domain = `${siteName}.test`;
  
  dialog.showMessageBox(null, {
    type: 'question',
    buttons: ['حذف', 'إلغاء'],
    title: 'حذف دومين محلي',
    message: `هل تريد حذف الدومين ${domain}؟`,
    detail: 'سيتم حذف Virtual Host وإزالة الدومين من ملف hosts'
  }).then(result => {
    if (result.response === 0) {
      const vhostRemoved = removeVirtualHost(siteName);
      const hostsUpdated = removeFromHosts(domain);
      
      dialog.showMessageBox(null, {
        type: 'info',
        title: 'حذف دومين',
        message: 'تم حذف الدومين بنجاح',
        detail: `تم حذف ${domain}`
      });
      
      // Restart Apache
      if (isServiceRunning('apache')) {
        stopService('apache');
        setTimeout(() => {
          startService('apache', path.join(baseDir, 'bin', 'apache', 'bin', 'httpd.exe'), ['-f', path.join(baseDir, 'bin', 'apache', 'conf', 'mydevbox.conf')]);
        }, 2000);
      }
      
      refreshMenu();
    }
  });
}

// Setup domains for existing sites
function setupExistingDomains() {
  const websites = detectWebsites();
  const sitesWithoutDomains = websites.filter(site => !site.hasVhost);
  
  if (sitesWithoutDomains.length === 0) {
    dialog.showMessageBox(null, {
      type: 'info',
      title: 'إعداد الدومينات',
      message: 'جميع المواقع لديها دومينات محلية بالفعل!'
    });
    return;
  }
  
  dialog.showMessageBox(null, {
    type: 'question',
    buttons: ['إعداد الكل', 'إلغاء'],
    title: 'إعداد الدومينات',
    message: `هل تريد إعداد دومينات محلية لجميع المواقع؟`,
    detail: `المواقع: ${sitesWithoutDomains.map(s => s.name + '.test').join(', ')}`
  }).then(async result => {
    if (result.response === 0) {
      let successCount = 0;
      let totalCount = sitesWithoutDomains.length;
      
      for (const site of sitesWithoutDomains) {
        const domain = `${site.name}.test`;
        const vhostCreated = createVirtualHost(site.name, site.path);
        const hostsUpdated = addToHosts(domain);
        
        if (vhostCreated && hostsUpdated) {
          successCount++;
        }
      }
      
      dialog.showMessageBox(null, {
        type: successCount === totalCount ? 'info' : 'warning',
        title: 'إعداد الدومينات',
        message: `تم إعداد ${successCount} من ${totalCount} دومين`,
        detail: successCount < totalCount ? 'بعض الدومينات لم يتم إعدادها - قد تحتاج لتشغيل البرنامج كمدير' : 'تم إعداد جميع الدومينات بنجاح!'
      });
      
      // Restart Apache to apply changes
      if (isServiceRunning('apache')) {
        stopService('apache');
        setTimeout(() => {
          startService('apache', path.join(baseDir, 'bin', 'apache', 'bin', 'httpd.exe'), ['-f', path.join(baseDir, 'bin', 'apache', 'conf', 'mydevbox.conf')]);
        }, 2000);
      }
      
      refreshMenu();
    }
  });
}

// وظائف نافذة التقدم
function createProgressWindow(title, message) {
  if (progressWindow) {
    progressWindow.close();
  }
  
  downloadStartTime = Date.now();
  
  progressWindow = new BrowserWindow({
    width: 500,
    height: 400,
    resizable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    center: true,
    title: title,
    icon: path.join(baseDir, 'assets', 'icon.png'),
    skipTaskbar: true,  // إخفاء من شريط المهام
    show: false,        // عدم إظهار النافذة مباشرة
    frame: true,       // إزالة إطار النافذة
    transparent: true,  // جعل النافذة شفافة
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  const progressHtml = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(45deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            background-size: 300% 300%;
            animation: gradientShift 8s ease infinite;
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            padding: 20px;
            overflow: hidden;
        }
        
        @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .background-pattern {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: 
                radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 2px, transparent 2px),
                radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 1px, transparent 1px);
            background-size: 50px 50px, 30px 30px;
            animation: float 20s linear infinite;
        }
        
        @keyframes float {
            0% { transform: translateY(0px); }
            100% { transform: translateY(-50px); }
        }
        
        .container {
            position: relative;
            background: linear-gradient(145deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%);
            border-radius: 25px;
            padding: 40px;
            text-align: center;
            backdrop-filter: blur(20px);
            border: 2px solid rgba(255, 255, 255, 0.3);
            box-shadow: 
                0 20px 40px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.5),
                inset 0 -1px 0 rgba(0, 0, 0, 0.2);
            min-width: 480px;
            transform: translateY(0);
            animation: containerPulse 4s ease-in-out infinite;
        }
        
        @keyframes containerPulse {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-5px) scale(1.02); }
        }
        
        .logo-container {
            margin-bottom: 20px;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            font-size: 24px;
            animation: logoRotate 3s linear infinite;
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        }
        
        @keyframes logoRotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            color: #fff;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
            background: linear-gradient(45deg, #fff, #f0f0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            font-size: 14px;
            opacity: 0.8;
            margin-bottom: 25px;
            font-weight: 400;
        }
        
        .message {
            font-size: 16px;
            margin-bottom: 25px;
            opacity: 0.95;
            font-weight: 600;
            background: rgba(255,255,255,0.1);
            padding: 12px 20px;
            border-radius: 15px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .progress-container {
            margin: 25px 0;
            position: relative;
        }
        
        .progress-wrapper {
            position: relative;
            margin-bottom: 15px;
        }
        
        .progress-bar {
            width: 100%;
            height: 12px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 25px;
            overflow: hidden;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff6b6b 0%, #4ecdc4 50%, #45b7d1 100%);
            background-size: 200% 100%;
            border-radius: 25px;
            transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            width: 0%;
            position: relative;
            animation: progressGlow 2s ease-in-out infinite;
        }
        
        @keyframes progressGlow {
            0%, 100% { 
                box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
                background-position: 0% 50%;
            }
            50% { 
                box-shadow: 0 0 20px rgba(78, 205, 196, 0.8);
                background-position: 100% 50%;
            }
        }
        
        .progress-fill::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
            animation: shimmer 1.5s infinite;
            border-radius: 25px;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .progress-text {
            font-size: 24px;
            font-weight: 700;
            margin: 15px 0;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
            background: linear-gradient(45deg, #fff, #4ecdc4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .details {
            font-size: 13px;
            opacity: 0.85;
            white-space: pre-line;
            line-height: 1.6;
            background: rgba(0,0,0,0.1);
            padding: 15px;
            border-radius: 15px;
            border: 1px solid rgba(255,255,255,0.1);
            font-weight: 500;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            margin: 20px auto;
            position: relative;
        }
        
        .spinner-ring {
            width: 100%;
            height: 100%;
            border: 4px solid rgba(255, 255, 255, 0.2);
            border-top: 4px solid #4ecdc4;
            border-right: 4px solid #ff6b6b;
            border-radius: 50%;
            animation: spinMultiColor 1.2s linear infinite;
            box-shadow: 0 0 20px rgba(78, 205, 196, 0.3);
        }
        
        @keyframes spinMultiColor {
            0% { 
                transform: rotate(0deg);
                border-top-color: #4ecdc4;
                border-right-color: #ff6b6b;
            }
            33% { 
                border-top-color: #45b7d1;
                border-right-color: #4ecdc4;
            }
            66% { 
                border-top-color: #ff6b6b;
                border-right-color: #45b7d1;
            }
            100% { 
                transform: rotate(360deg);
                border-top-color: #4ecdc4;
                border-right-color: #ff6b6b;
            }
        }
        
        .status-indicator {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 12px;
            height: 12px;
            background: #4ecdc4;
            border-radius: 50%;
            animation: statusPulse 2s ease-in-out infinite;
            box-shadow: 0 0 15px #4ecdc4;
        }
        
        @keyframes statusPulse {
            0%, 100% { 
                transform: scale(1);
                opacity: 1;
            }
            50% { 
                transform: scale(1.5);
                opacity: 0.7;
            }
        }
        
        .floating-particles {
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
        }
        
        .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(255,255,255,0.6);
            border-radius: 50%;
            animation: floatUp 8s linear infinite;
        }
        
        .particle:nth-child(1) { left: 10%; animation-delay: 0s; }
        .particle:nth-child(2) { left: 30%; animation-delay: 2s; }
        .particle:nth-child(3) { left: 50%; animation-delay: 4s; }
        .particle:nth-child(4) { left: 70%; animation-delay: 6s; }
        .particle:nth-child(5) { left: 90%; animation-delay: 1s; }
        
        @keyframes floatUp {
            0% {
                transform: translateY(100vh) scale(0);
                opacity: 0;
            }
            10% {
                opacity: 1;
                transform: scale(1);
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100px) scale(0);
                opacity: 0;
            }
        }
    </style>
</head>
<body>
    <div class="background-pattern"></div>
    <div class="floating-particles">
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
    </div>
    
    <div class="container">
        <div class="status-indicator"></div>
        
        <div class="logo-container">
            <div class="logo">📦</div>
        </div>
        
        <div class="title">${title}</div>
        <div class="subtitle">MyDevBox - بيئة التطوير المحلية</div>
        
        <div class="message" id="message">${message}</div>
        
        <div class="loading-spinner">
            <div class="spinner-ring"></div>
        </div>
        
        <div class="progress-container">
            <div class="progress-wrapper">
                <div class="progress-bar">
                    <div class="progress-fill" id="progressFill"></div>
                </div>
            </div>
            <div class="progress-text" id="progressText">0%</div>
            <div class="details" id="details">جاري الإعداد...</div>
        </div>
    </div>
</body>
</html>`;
  
  progressWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(progressHtml)}`);
  
  // عرض النافذة بعد تحميل المحتوى مع تأثير fade-in
  progressWindow.once('ready-to-show', () => {
    progressWindow.show();
    progressWindow.setOpacity(0);
    
    // تأثير fade-in تدريجي
    let opacity = 0;
    const fadeIn = setInterval(() => {
      opacity += 0.1;
      if (opacity >= 1) {
        opacity = 1;
        clearInterval(fadeIn);
      }
      progressWindow.setOpacity(opacity);
    }, 30);
  });
  
  progressWindow.on('closed', () => {
    progressWindow = null;
  });
}

function updateProgressWindow(message, progress, details) {
  if (!progressWindow) return;
  
  progressWindow.webContents.executeJavaScript(`
    document.getElementById('message').textContent = "${message}";
    document.getElementById('progressFill').style.width = "${progress}%";
    document.getElementById('progressText').textContent = "${progress}%";
    document.getElementById('details').textContent = "${details}";
  `);
}

function closeProgressWindow() {
  if (progressWindow) {
    // تأثير fade-out قبل الإغلاق
    let opacity = 1;
    const fadeOut = setInterval(() => {
      opacity -= 0.1;
      if (opacity <= 0) {
        opacity = 0;
        clearInterval(fadeOut);
        progressWindow.close();
        progressWindow = null;
      } else {
        progressWindow.setOpacity(opacity);
      }
    }, 30);
  }
}

function calculateDownloadSpeed(downloadedBytes) {
  if (!downloadStartTime) return '0 KB/s';
  
  const elapsed = (Date.now() - downloadStartTime) / 1000; // بالثواني
  if (elapsed < 1) return '...';
  
  const speed = downloadedBytes / elapsed; // bytes per second
  
  if (speed < 1024) {
    return `${Math.round(speed)} B/s`;
  } else if (speed < 1024 * 1024) {
    return `${Math.round(speed / 1024)} KB/s`;
  } else {
    return `${(speed / (1024 * 1024)).toFixed(1)} MB/s`;
  }
}

function calculateTimeLeft(downloadedBytes, totalBytes, speedString) {
  if (!downloadStartTime || downloadedBytes === 0) return 'جاري الحساب...';
  
  const elapsed = (Date.now() - downloadStartTime) / 1000;
  if (elapsed < 2) return 'جاري الحساب...';
  
  const speed = downloadedBytes / elapsed; // bytes per second
  const remainingBytes = totalBytes - downloadedBytes;
  const timeLeftSeconds = remainingBytes / speed;
  
  if (timeLeftSeconds < 60) {
    return `${Math.round(timeLeftSeconds)} ثانية`;
  } else if (timeLeftSeconds < 3600) {
    const minutes = Math.round(timeLeftSeconds / 60);
    return `${minutes} دقيقة`;
  } else {
    const hours = Math.floor(timeLeftSeconds / 3600);
    const minutes = Math.round((timeLeftSeconds % 3600) / 60);
    return `${hours} ساعة و ${minutes} دقيقة`;
  }
}

// وظائف phpMyAdmin
function isPhpMyAdminInstalled() {
  const phpMyAdminPath = path.join(baseDir, 'www', 'phpmyadmin');
  return fs.existsSync(phpMyAdminPath) && 
         fs.existsSync(path.join(phpMyAdminPath, 'index.php'));
}

function downloadPhpMyAdmin() {
  const downloadUrl = 'https://files.phpmyadmin.net/phpMyAdmin/5.2.2/phpMyAdmin-5.2.2-all-languages.zip';
  const zipPath = path.join(baseDir, 'tmp', 'phpmyadmin.zip');
  const phpMyAdminPath = path.join(baseDir, 'www', 'phpmyadmin');
  
  // التأكد من وجود مجلد tmp
  const tmpDir = path.join(baseDir, 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  
  // إنشاء نافذة HTML لعرض التقدم
  createProgressWindow('تحميل phpMyAdmin', 'جاري تحميل phpMyAdmin من الموقع الرسمي...');
  
  const file = fs.createWriteStream(zipPath);
  
  https.get(downloadUrl, (response) => {
    if (response.statusCode === 302 || response.statusCode === 301) {
      // إعادة توجيه
      return downloadPhpMyAdminFromUrl(response.headers.location, zipPath, phpMyAdminPath);
    }
    
    const totalSize = parseInt(response.headers['content-length'], 10);
    let downloadedSize = 0;
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(1);
    
    updateProgressWindow('بدء التحميل...', 0, `الحجم الإجمالي: ${totalSizeMB} ميجابايت`);
    
    response.pipe(file);
    
    response.on('data', (chunk) => {
      downloadedSize += chunk.length;
      const progress = Math.round((downloadedSize / totalSize) * 100);
      const downloadedMB = (downloadedSize / 1024 / 1024).toFixed(1);
      const speed = calculateDownloadSpeed(downloadedSize);
      const timeLeft = calculateTimeLeft(downloadedSize, totalSize, speed);
      
      updateProgressWindow(
        `تحميل phpMyAdmin... ${progress}%`,
        progress,
        `تم تحميل: ${downloadedMB} من ${totalSizeMB} ميجابايت\nالسرعة: ${speed}\nالوقت المتبقي: ${timeLeft}`
      );
    });
    
    file.on('finish', () => {
      file.close();
      updateProgressWindow('تم التحميل! جاري الاستخراج...', 100, 'جاري استخراج الملفات...');
      setTimeout(() => {
        extractPhpMyAdmin(zipPath, phpMyAdminPath);
      }, 1000);
    });
  }).on('error', (err) => {
    fs.unlink(zipPath, () => {}); // حذف الملف المؤقت
    closeProgressWindow();
    dialog.showErrorBox('خطأ في التحميل', `فشل في تحميل phpMyAdmin:\n${err.message}`);
  });
}

function downloadPhpMyAdminFromUrl(url, zipPath, phpMyAdminPath) {
  const file = fs.createWriteStream(zipPath);
  
  https.get(url, (response) => {
    const totalSize = parseInt(response.headers['content-length'], 10);
    let downloadedSize = 0;
    const totalSizeMB = (totalSize / 1024 / 1024).toFixed(1);
    
    updateProgressWindow('إعادة توجيه... بدء التحميل', 0, `الحجم الإجمالي: ${totalSizeMB} ميجابايت`);
    
    response.pipe(file);
    
    response.on('data', (chunk) => {
      downloadedSize += chunk.length;
      const progress = Math.round((downloadedSize / totalSize) * 100);
      const downloadedMB = (downloadedSize / 1024 / 1024).toFixed(1);
      const speed = calculateDownloadSpeed(downloadedSize);
      const timeLeft = calculateTimeLeft(downloadedSize, totalSize, speed);
      
      updateProgressWindow(
        `تحميل phpMyAdmin... ${progress}%`,
        progress,
        `تم تحميل: ${downloadedMB} من ${totalSizeMB} ميجابايت\nالسرعة: ${speed}\nالوقت المتبقي: ${timeLeft}`
      );
    });
    
    file.on('finish', () => {
      file.close();
      updateProgressWindow('تم التحميل! جاري الاستخراج...', 100, 'جاري استخراج الملفات...');
      setTimeout(() => {
        extractPhpMyAdmin(zipPath, phpMyAdminPath);
      }, 1000);
    });
  }).on('error', (err) => {
    fs.unlink(zipPath, () => {}); // حذف الملف المؤقت
    closeProgressWindow();
    dialog.showErrorBox('خطأ في التحميل', `فشل في تحميل phpMyAdmin:\n${err.message}`);
  });
}

async function extractPhpMyAdmin(zipPath, phpMyAdminPath) {
  try {
    // إنشاء مجلد www إذا لم يكن موجوداً
    const wwwPath = path.join(baseDir, 'www');
    if (!fs.existsSync(wwwPath)) {
      fs.mkdirSync(wwwPath, { recursive: true });
    }
    
    updateProgressWindow('جاري الاستخراج...', 100, 'استخراج ملفات phpMyAdmin...');
    
    // استخراج الملف المضغوط
    await extract(zipPath, { dir: wwwPath });
    
    updateProgressWindow('تنظيم الملفات...', 100, 'إعداد مجلد phpMyAdmin...');
    
    // إعادة تسمية المجلد المستخرج
    const extractedDirs = fs.readdirSync(wwwPath)
      .filter(item => item.startsWith('phpMyAdmin-') && 
                     fs.statSync(path.join(wwwPath, item)).isDirectory());
    
    if (extractedDirs.length > 0) {
      const extractedPath = path.join(wwwPath, extractedDirs[0]);
      
      // إذا كان مجلد phpmyadmin موجود، احذفه أولاً
      if (fs.existsSync(phpMyAdminPath)) {
        fs.rmSync(phpMyAdminPath, { recursive: true, force: true });
      }
      
      // إعادة تسمية المجلد
      fs.renameSync(extractedPath, phpMyAdminPath);
      
      updateProgressWindow('التكوين النهائي...', 100, 'إعداد ملفات التكوين...');
      
      // تكوين phpMyAdmin
      configurePhpMyAdmin(phpMyAdminPath);
      
      // حذف الملف المضغوط
      fs.unlink(zipPath, () => {});
      
      // إغلاق نافذة التقدم
      closeProgressWindow();
      
      dialog.showMessageBox(null, {
        type: 'info',
        title: 'تم التركيب بنجاح',
        message: 'تم تركيب phpMyAdmin بنجاح! 🎉',
        detail: 'يمكنك الآن الوصول إليه عبر: http://localhost/phpmyadmin',
        buttons: ['موافق', 'فتح phpMyAdmin']
      }).then((result) => {
        if (result.response === 1) {
          shell.openExternal('http://localhost/phpmyadmin');
        }
        refreshMenu();
      });
    } else {
      throw new Error('لم يتم العثور على مجلد phpMyAdmin المستخرج');
    }
  } catch (error) {
    closeProgressWindow();
    dialog.showErrorBox('خطأ في الاستخراج', `فشل في استخراج phpMyAdmin:\n${error.message}`);
  }
}

function configurePhpMyAdmin(phpMyAdminPath) {
  const configPath = path.join(phpMyAdminPath, 'config.inc.php');
  
  const config = `<?php
declare(strict_types=1);

/**
 * This is needed for cookie based authentication to encrypt password in
 * cookie. Needs to be 32 chars long.
 */
$cfg['blowfish_secret'] = '${generateRandomString(32)}';

/**
 * Servers configuration
 */
$i = 0;

/**
 * First server
 */
$i++;
/* Authentication type */
$cfg['Servers'][$i]['auth_type'] = 'cookie';
/* Server parameters */
$cfg['Servers'][$i]['host'] = 'localhost';
$cfg['Servers'][$i]['port'] = 3306;
$cfg['Servers'][$i]['compress'] = false;
$cfg['Servers'][$i]['AllowNoPassword'] = true;

/**
 * phpMyAdmin configuration storage settings.
 */

/* User used to manipulate with storage */
// $cfg['Servers'][$i]['controlhost'] = '';
// $cfg['Servers'][$i]['controlport'] = '';
// $cfg['Servers'][$i]['controluser'] = 'pma';
// $cfg['Servers'][$i]['controlpass'] = 'pmapass';

/**
 * Directories for saving/loading files from server
 */
$cfg['UploadDir'] = '';
$cfg['SaveDir'] = '';

/**
 * Whether to display icons or text or both icons and text in table row
 * action segment. Value can be either of 'icons', 'text' or 'both'.
 * default = 'both'
 */
//$cfg['RowActionType'] = 'icons';

/**
 * Defines whether a user should be displayed a "show all (records)"
 * button in browse mode or not.
 * default = false
 */
//$cfg['ShowAll'] = true;

/**
 * Number of rows displayed when browsing a result set. If the result
 * set contains more rows, "Previous" and "Next".
 * Possible values: 25, 50, 100, 250, 500
 * default = 25
 */
//$cfg['MaxRows'] = 50;

/**
 * Disallow editing of binary fields
 * valid values are:
 *   false    allow editing
 *   'blob'   allow editing except for BLOB fields
 *   'noblob' disallow editing except for BLOB fields
 *   'all'    disallow editing
 * default = 'blob'
 */
//$cfg['ProtectBinary'] = false;

/**
 * Default language to use, if not browser-defined or user-defined
 * (you find all languages in the locale folder)
 * uncomment the desired line:
 * default = 'en'
 */
$cfg['DefaultLang'] = 'ar';

/**
 * How many columns should be used for table display of a database?
 * (a value larger than 1 results in some information being hidden)
 * default = 1
 */
//$cfg['PropertiesNumColumns'] = 2;

/**
 * Set to true if you want DB-based query history.If false, this utilizes
 * JS-routines to display query history (lost by window close)
 *
 * This requires configuration storage enabled, see above.
 * default = false
 */
//$cfg['QueryHistoryDB'] = true;

/**
 * When using DB-based query history, how many entries should be kept?
 * default = 25
 */
//$cfg['QueryHistoryMax'] = 100;

/**
 * Whether or not to query the user before sending the error report to
 * the phpMyAdmin team when a JavaScript error occurs
 *
 * Available options
 * ('ask' | 'always' | 'never')
 * default = 'ask'
 */
//$cfg['SendErrorReports'] = 'always';

/**
 * 'URLQueryEncryption' defines whether phpMyAdmin will encrypt sensitive data from the URL query string.
 * 'URLQueryEncryptionSecretKey' is a 32 bytes long secret key used to encrypt/decrypt the URL query string.
 */
//$cfg['URLQueryEncryption'] = true;
//$cfg['URLQueryEncryptionSecretKey'] = '';

/**
 * You can find more configuration options in the documentation
 * in the doc/ folder or at <https://docs.phpmyadmin.net/>.
 */
`;

  fs.writeFileSync(configPath, config);
  console.log('phpMyAdmin configured successfully');
}

function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function startApache() {
  const configPath = path.join(baseDir, 'config', 'httpd.conf');
  const apachePath = path.join(baseDir, 'bin', 'apache', 'bin', 'httpd.exe');
  
  if (!fs.existsSync(apachePath)) {
    showNotification('Apache Error', 'Apache not found in specified path');
    return;
  }
  
  if (!fs.existsSync(configPath)) {
    showNotification('Apache Config Error', 'httpd.conf file not found');
    return;
  }
  
  // Test configuration first
  const testCmd = `"${apachePath}" -f "${configPath}" -t`;
  exec(testCmd, async (testError, testStdout, testStderr) => {
    if (testError) {
      console.log('Apache config test failed:', testError.message);
      showNotification('Apache Config Error', testError.message);
      return;
    }
    
    console.log('🔄 Stopping any existing Apache processes...');
    
    // Stop any existing Apache processes with enhanced killing
    await killExistingApacheProcesses();
    
    // Wait a moment then start Apache
    setTimeout(() => {
      const startApacheCmd = `"${apachePath}" -f "${configPath}"`;
      const child = exec(startApacheCmd, (error, stdout, stderr) => {
        if (error) {
          console.log('Apache start error:', error.message);
          showNotification('Apache Start Error', error.message);
        }
      });
      
      // Check if Apache started successfully after a short delay
      setTimeout(() => {
        exec('netstat -an | findstr ":80"', (netError, netStdout) => {
          if (netStdout && netStdout.includes(':80')) {
            console.log('✅ Apache started successfully');
            showNotification('Apache Started', 'Apache is now running on http://localhost');
          } else {
            console.log('⚠️ Apache may not have started properly');
            showNotification('Apache Warning', 'Apache may not have started - check logs');
          }
        });
      }, 2000);
    }, 2000); // زيادة وقت الانتظار
  });
}

function openPhpMyAdmin() {
  if (!isPhpMyAdminInstalled()) {
    dialog.showMessageBox(null, {
      type: 'question',
      title: 'phpMyAdmin غير مثبت',
      message: 'phpMyAdmin غير مثبت. هل تريد تحميله وتثبيته الآن؟',
      buttons: ['نعم', 'لا'],
      defaultId: 0
    }).then((result) => {
      if (result.response === 0) {
        downloadPhpMyAdmin();
      }
    });
    return;
  }
  
  if (!isServiceRunning('apache')) {
    dialog.showMessageBox(null, {
      type: 'warning',
      title: 'Apache غير مشغل',
      message: 'يجب تشغيل Apache أولاً للوصول إلى phpMyAdmin.',
      buttons: ['تشغيل Apache', 'إلغاء']
    }).then(async (result) => {
      if (result.response === 0) {
        const portAvailable = await isPortAvailable(80);
        if (!portAvailable) {
          dialog.showErrorBox('خطأ', 'المنفذ 80 مستخدم بالفعل! يرجى إيقاف الخدمة التي تستخدمه أو تغيير منفذ Apache.');
          return;
        }
        startApache();
        setTimeout(() => {
          shell.openExternal('http://localhost/phpmyadmin');
        }, 2000);
      }
    });
    return;
  }
  
  shell.openExternal('http://localhost/phpmyadmin');
}

function removePhpMyAdmin() {
  if (!isPhpMyAdminInstalled()) {
    dialog.showMessageBox(null, {
      type: 'info',
      title: 'phpMyAdmin',
      message: 'phpMyAdmin غير مثبت.',
      buttons: ['موافق']
    });
    return;
  }
  
  dialog.showMessageBox(null, {
    type: 'question',
    title: 'حذف phpMyAdmin',
    message: 'هل أنت متأكد من حذف phpMyAdmin؟',
    detail: 'سيتم حذف جميع ملفات phpMyAdmin بشكل دائم.',
    buttons: ['نعم، احذف', 'إلغاء'],
    defaultId: 1
  }).then((result) => {
    if (result.response === 0) {
      try {
        const phpMyAdminPath = path.join(baseDir, 'www', 'phpmyadmin');
        fs.rmSync(phpMyAdminPath, { recursive: true, force: true });
        
        dialog.showMessageBox(null, {
          type: 'info',
          title: 'تم الحذف',
          message: 'تم حذف phpMyAdmin بنجاح.',
          buttons: ['موافق']
        });
        
        refreshMenu();
      } catch (error) {
        dialog.showErrorBox('خطأ في الحذف', `فشل في حذف phpMyAdmin:\n${error.message}`);
      }
    }
  });
}

// Build and set the tray context menu dynamically
function refreshMenu() {
  const tray = global.appTray;
  if (!tray) return;
  const apacheRunning = isServiceRunning('apache');
  const mysqlRunning = isServiceRunning('mysql');
  const phpVersions = detectPHPVersions();
  const websites = detectWebsites();
  
  // Update tray icon tooltip with status
  const statusText = `MyDevBox\nApache: ${apacheRunning ? '🟢 يعمل' : '🔴 متوقف'}\nMySQL: ${mysqlRunning ? '🟢 يعمل' : '🔴 متوقف'}`;
  tray.setToolTip(statusText);

  const menu = Menu.buildFromTemplate([
    // Apache Section
    { 
      label: `Apache ${apacheRunning ? '🟢 (يعمل)' : '🔴 (متوقف)'}`, 
      enabled: false 
    },
    { 
      label: apacheRunning ? 'إيقاف Apache' : 'تشغيل Apache', 
      click: apacheRunning ? 
        () => stopService('apache') : 
        async () => {
          const portAvailable = await isPortAvailable(80);
          if (!portAvailable) {
            dialog.showErrorBox('خطأ', 'المنفذ 80 مستخدم بالفعل! يرجى إيقاف الخدمة التي تستخدمه أو تغيير منفذ Apache.');
            return;
          }
          const configPath = path.join(baseDir, 'config', 'httpd.conf');
          const apachePath = path.join(baseDir, 'bin', 'apache', 'bin', 'httpd.exe');
          
          if (fs.existsSync(apachePath)) {
            // استخدام المسار المطلق لملف التكوين
            startService('apache', apachePath, ['-f', configPath]);
          } else {
            showNotification('خطأ في Apache', 'لم يتم العثور على Apache في المسار المحدد');
          }
        }
    },
    { label: 'فتح الموقع الرئيسي', enabled: apacheRunning, click: () => shell.openExternal('http://localhost') },
    
    // Websites submenu
    ...(websites.length > 0 ? [{
      label: 'المواقع المحلية',
      enabled: apacheRunning,
      submenu: websites.map(site => ({
        label: `📁 ${site.name} ${site.hasVhost ? '🌐' : '📂'}`,
        submenu: [
          ...(site.hasVhost ? [
            { label: `فتح ${site.domain}`, click: () => {
              if (site.domainUrl) {
                shell.openExternal(site.domainUrl);
              } else {
                console.error('Domain URL is undefined for site:', site.name);
              }
            }},
            { type: 'separator' }
          ] : []),
          { label: 'فتح localhost', click: () => {
            if (site.url) {
              shell.openExternal(site.url);
            } else {
              console.error('URL is undefined for site:', site.name);
            }
          }},
          { label: 'فتح المجلد', click: () => shell.openPath(site.path) },
          { type: 'separator' },
          ...(site.hasVhost ? [
            { label: 'حذف الدومين', click: () => removeSiteDomain(site.name) }
          ] : [
            { label: 'إنشاء دومين محلي', click: () => createSiteDomain(site.name, site.path) }
          ])
        ]
      }))
    }] : []),
    
    { label: 'اختبار تكوين Apache', click: () => {
      const configPath = path.join(baseDir, 'config', 'httpd.conf');
      const apachePath = path.join(baseDir, 'bin', 'apache', 'bin', 'httpd.exe');
      
      if (!fs.existsSync(apachePath)) {
        dialog.showErrorBox('خطأ', 'لم يتم العثور على Apache في المسار المحدد');
        return;
      }
      
      // استخدام المسار المطلق لملف التكوين
      const proc = spawn(apachePath, ['-t', '-f', configPath], {
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      let output = '';
      proc.stdout.on('data', (data) => output += data.toString());
      proc.stderr.on('data', (data) => output += data.toString());
      
      proc.on('close', (code) => {
        dialog.showMessageBox(null, {
          type: code === 0 ? 'info' : 'error',
          title: 'اختبار تكوين Apache',
          message: code === 0 ? 'تكوين Apache صحيح ✅' : `خطأ في التكوين:\n${output}`
        });
      });
    }},
    { type: 'separator' },
    // MySQL Section
    { 
      label: `MySQL ${mysqlRunning ? '🟢 (يعمل)' : '🔴 (متوقف)'}`, 
      enabled: false 
    },
    { 
      label: mysqlRunning ? 'إيقاف MySQL' : 'تشغيل MySQL', 
      click: mysqlRunning ? 
        () => stopService('mysql') :
        async () => {
          try {
            // Generate MySQL configuration first
            generateMySQLConfig();
            
            // Check if port 3306 is available
            const portAvailable = await isPortAvailable(3306);
            if (!portAvailable) {
              dialog.showErrorBox('خطأ', 'المنفذ 3306 مستخدم بالفعل! يرجى إيقاف الخدمة التي تستخدمه أو تغيير منفذ MySQL.');
              return;
            }
            
            // التأكد من وجود MySQL
            const mysqlPath = path.join(baseDir, 'bin', 'mysql', 'bin', 'mysqld.exe');
            if (!fs.existsSync(mysqlPath)) {
              dialog.showErrorBox('خطأ في MySQL', 'لم يتم العثور على MySQL في المسار المحدد');
              return;
            }
            
            // إنشاء مجلد tmp إذا لم يكن موجوداً
            const tmpDir = path.join(baseDir, 'tmp');
            if (!fs.existsSync(tmpDir)) {
              fs.mkdirSync(tmpDir, { recursive: true });
            }
            
            // استخدام المسار المطلق لملف التكوين
            const configPath = path.join(baseDir, 'config', 'my.ini');
            
            startService('mysql', mysqlPath, [
              '--defaults-file=' + configPath,
              '--console'
            ]);
          } catch (error) {
            dialog.showErrorBox('خطأ في تشغيل MySQL', error.message);
          }
        }
    },
    // phpMyAdmin section
    ...(isPhpMyAdminInstalled() ? [
      { label: '🔧 فتح phpMyAdmin', enabled: mysqlRunning && apacheRunning, click: openPhpMyAdmin },
      { label: '🗑️ حذف phpMyAdmin', click: removePhpMyAdmin }
    ] : [
      { label: '⬇️ تحميل وتثبيت phpMyAdmin', click: downloadPhpMyAdmin }
    ]),
    { label: 'اختبار تكوين MySQL', click: testMySQLConfig },
    { type: 'separator' },
    {
      label: 'PHP Version',
      submenu: phpVersions.map(v => ({
        label: v.name,
        type: 'radio',
        checked: v.name === 'php-8.4.8',
        click: () => {
          // Update PHP path in mydevbox.conf
          const confPath = path.join(baseDir, 'bin', 'apache', 'conf', 'mydevbox.conf');
          
          // Simple PHP path replacement - you could make this more sophisticated
          dialog.showMessageBox(null, {
            type: 'info',
            title: 'تغيير إصدار PHP',
            message: 'تم تحديد إصدار PHP الجديد',
            detail: 'ستحتاج لإعادة تشغيل Apache يدوياً لتطبيق التغيير'
          });
        }
      }))
    },
    { type: 'separator' },
    { label: '📝 إنشاء موقع سريع', 
      submenu: [
        { label: '📄 موقع HTML بسيط', click: () => createSimpleWebsite() },
        { label: '🔗 موقع PHP', click: () => createPHPWebsite() },
        { label: '🗃️ موقع PHP + قاعدة بيانات', click: () => createDatabaseWebsite() }
      ]
    },
    { label: 'إنشاء موقع جديد (متقدم)', click: createNewSite },
    { label: '⚡ تثبيت سريع للبرامج', 
      submenu: [
        { label: '🔶 Laravel', click: () => quickInstall('laravel') },
        { label: '🟦 WordPress', click: () => quickInstall('wordpress') },
        { label: '🔥 CodeIgniter', click: () => quickInstall('codeigniter') },
        { label: '🎼 Symfony', click: () => quickInstall('symfony') },
        { label: '🍰 CakePHP', click: () => quickInstall('cakephp') },
        { label: '⚡ Express.js', click: () => quickInstall('express') },
        { label: '📱 Vue.js', click: () => quickInstall('vue') },
        { label: '⚛️ React', click: () => quickInstall('react') }
      ]
    },
    { label: 'إعداد الدومينات للمواقع الموجودة', click: setupExistingDomains },
    {
      label: 'أدوات إعداد Hosts',
      submenu: [
        {
          label: 'PowerShell Script (مستحسن)',
          click: () => {
            const psPath = path.join(baseDir, 'bin', 'setup-hosts.ps1');
            spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', psPath], { 
              detached: true,
              stdio: 'ignore'
            });
          }
        },
        {
          label: 'Batch Script',
          click: () => {
            const batPath = path.join(baseDir, 'bin', 'setup-hosts.bat');
            spawn('powershell', ['-Command', `Start-Process -FilePath "${batPath}" -Verb RunAs`], { 
              detached: true,
              stdio: 'ignore'
            });
          }
        },
        { type: 'separator' },
        {
          label: 'فتح ملف Hosts للتحرير',
          click: () => {
            const hostsPath = getHostsFilePath();
            spawn('powershell', ['-Command', `Start-Process -FilePath "notepad" -ArgumentList "${hostsPath}" -Verb RunAs`], { 
              detached: true,
              stdio: 'ignore'
            });
          }
        },
        { type: 'separator' },
        {
          label: 'عرض تعليمات الإعداد اليدوي',
          click: () => {
            const instructionsPath = path.join(baseDir, 'bin', 'domains-setup-instructions.txt');
            shell.openPath(instructionsPath);
          }
        }
      ]
    },
    { label: 'فتح مجلد www', click: () => shell.openPath(path.join(baseDir, 'www')) },
    { label: 'فتح مجلد التكوين', click: () => shell.openPath(path.join(baseDir, 'config')) },
    { type: 'separator' },
    { label: '⚙️ الإعدادات', click: () => {
      try {
        const mainModule = require('./main');
        mainModule.createSettingsWindow();
      } catch (error) {
        console.error('Error opening settings:', error);
      }
    }},
    { type: 'separator' },
    { label: '🚪 خروج', click: () => {
      dialog.showMessageBox(null, {
        type: 'question',
        buttons: ['خروج', 'إلغاء'],
        title: 'تأكيد الخروج',
        message: 'هل تريد إغلاق MyDevBox؟',
        detail: 'سيتم إيقاف جميع الخدمات المشغلة.'
      }).then(result => {
        if (result.response === 0) {
          stopService('apache');
          stopService('mysql');
          setTimeout(() => process.exit(0), 1000);
        }
      });
    }}
  ]);

  tray.setContextMenu(menu);
}

// دوال إنشاء المواقع السريعة
async function createSimpleWebsite() {
  try {
    const projectName = await getProjectName('HTML Site');
    if (!projectName) {
      console.log('Website creation cancelled');
      return;
    }

    const projectPath = path.join(baseDir, 'www', projectName);
    const domain = `${projectName}.test`;

    // فحص إذا كان المجلد موجود
    if (fs.existsSync(projectPath)) {
      const result = await dialog.showMessageBox(null, {
        type: 'question',
        title: 'المجلد موجود',
        message: `المجلد ${projectName} موجود بالفعل. هل تريد المتابعة؟`,
        buttons: ['المتابعة', 'إلغاء'],
        defaultId: 1
      });
      
      if (result.response === 1) return;
    }

    // إنشاء نافذة التقدم
    createProgressWindow('إنشاء موقع HTML', 'جاري إنشاء الموقع...');

    // إنشاء المجلد
    updateProgressWindow('إنشاء مجلد المشروع...', 20, 'إنشاء مجلد المشروع');
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    // إنشاء ملف index.html
    updateProgressWindow('إنشاء ملفات الموقع...', 40, 'إنشاء index.html');
    const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName} - موقعي الجديد</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .container {
            background: rgba(255,255,255,0.9);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 600px;
        }
        
        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 2.5em;
        }
        
        p {
            color: #666;
            font-size: 1.2em;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        
        .feature {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
        }
        
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .info {
            margin-top: 30px;
            padding: 20px;
            background: #e3f2fd;
            border-radius: 10px;
            font-size: 0.9em;
            color: #1976d2;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 مرحباً بك في ${projectName}</h1>
        <p>تم إنشاء موقعك بنجاح! يمكنك الآن البدء في تطوير موقعك.</p>
        
        <div class="feature">
            <h3>✨ ميزات جاهزة</h3>
            <p>• تصميم حديث ومتجاوب<br>
            • دعم الاتجاه العربي<br>
            • تهيئة شاملة للبداية</p>
        </div>
        
        <a href="about.html" class="btn">تعرف على المزيد</a>
        
        <div class="info">
            <strong>معلومات الموقع:</strong><br>
            📁 المجلد: ${projectPath}<br>
            🌐 الرابط: http://${domain}<br>
            📝 ابدأ التطوير بتعديل هذا الملف
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(path.join(projectPath, 'index.html'), htmlContent, 'utf8');

    // إنشاء ملف about.html
    const aboutContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>حول ${projectName}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .container {
            background: rgba(255,255,255,0.9);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 600px;
        }
        
        h1 { color: #333; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; margin-bottom: 20px; }
        
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📋 حول ${projectName}</h1>
        <p>هذا موقع HTML بسيط تم إنشاؤه باستخدام MyDevBox.</p>
        <p>يمكنك إضافة المزيد من الصفحات والمحتوى حسب احتياجاتك.</p>
        <a href="index.html" class="btn">العودة للرئيسية</a>
    </div>
</body>
</html>`;

    fs.writeFileSync(path.join(projectPath, 'about.html'), aboutContent, 'utf8');

    // إنشاء Virtual Host
    updateProgressWindow('إعداد الدومين المحلي...', 60, 'إنشاء Virtual Host');
    addVirtualHost(projectName, 'html');

    // إضافة إلى hosts file
    updateProgressWindow('إضافة الدومين إلى hosts...', 80, 'تحديث ملف hosts');
    try {
      addToHosts(domain);
    } catch (error) {
      console.warn('Failed to add to hosts file:', error.message);
    }

    // إنهاء العملية
    updateProgressWindow('تم إنشاء الموقع بنجاح!', 100, 'جاري فتح الموقع...');

    setTimeout(() => {
      closeProgressWindow();
      
      // عرض رسالة النجاح
      dialog.showMessageBox(null, {
        type: 'info',
        title: 'تم إنشاء الموقع بنجاح!',
        message: `تم إنشاء موقع HTML بنجاح!`,
        detail: `اسم الموقع: ${projectName}\nالمجلد: ${projectPath}\nالرابط: http://${domain}`,
        buttons: ['فتح الموقع', 'فتح المجلد', 'موافق']
      }).then((result) => {
        if (result.response === 0) {
          shell.openExternal(`http://${domain}`);
        } else if (result.response === 1) {
          shell.openPath(projectPath);
        }
      });
      
      refreshMenu();
      showNotification('تم إنشاء الموقع', `موقع ${projectName} جاهز للاستخدام!`);
      
    }, 1000);

  } catch (error) {
    closeProgressWindow();
    dialog.showErrorBox('خطأ في إنشاء الموقع', error.message);
  }
}

async function createPHPWebsite() {
  try {
    const projectName = await getProjectName('PHP Site');
    if (!projectName) return;

    const projectPath = path.join(baseDir, 'www', projectName);
    const domain = `${projectName}.test`;

    // فحص إذا كان المجلد موجود
    if (fs.existsSync(projectPath)) {
      const result = await dialog.showMessageBox(null, {
        type: 'question',
        title: 'المجلد موجود',
        message: `المجلد ${projectName} موجود بالفعل. هل تريد المتابعة؟`,
        buttons: ['المتابعة', 'إلغاء'],
        defaultId: 1
      });
      
      if (result.response === 1) return;
    }

    createProgressWindow('إنشاء موقع PHP', 'جاري إنشاء الموقع...');

    // إنشاء المجلد
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    // إنشاء ملف index.php مع محتوى أساسي
    updateProgressWindow('إنشاء ملفات PHP...', 30, 'إنشاء index.php');
    const phpContent = `<?php
session_start();
date_default_timezone_set('Asia/Riyadh');

// معلومات الموقع
$siteName = '${projectName}';
$currentTime = date('Y-m-d H:i:s');
$phpVersion = phpversion();
$serverInfo = $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown';
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $siteName; ?> - موقع PHP</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        
        .container {
            background: rgba(255,255,255,0.9);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.3);
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 700px;
        }
        
        h1 { color: #333; margin-bottom: 20px; }
        .info-card {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: right;
        }
        
        .info-card h3 { color: #667eea; margin-bottom: 15px; }
        .info-row { margin: 10px 0; color: #666; }
        .value { font-weight: bold; color: #333; }
        
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            margin: 10px;
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 مرحباً بك في <?php echo $siteName; ?></h1>
        <p>موقع PHP جاهز للعمل!</p>
        
        <div class="info-card">
            <h3>📊 معلومات الخادم</h3>
            <div class="info-row">
                <span>إصدار PHP:</span> 
                <span class="value"><?php echo $phpVersion; ?></span>
            </div>
            <div class="info-row">
                <span>الخادم:</span> 
                <span class="value"><?php echo $serverInfo; ?></span>
            </div>
            <div class="info-row">
                <span>الوقت الحالي:</span> 
                <span class="value"><?php echo $currentTime; ?></span>
            </div>
        </div>
        
        <div class="info-card">
            <h3>🛠️ أدوات مفيدة</h3>
            <a href="phpinfo.php" class="btn">معلومات PHP</a>
            <a href="test.php" class="btn">اختبار الوظائف</a>
        </div>
        
        <div class="info-card">
            <h3>📁 معلومات المشروع</h3>
            <div class="info-row">
                <span>مجلد المشروع:</span> 
                <span class="value"><?php echo __DIR__; ?></span>
            </div>
            <div class="info-row">
                <span>الرابط:</span> 
                <span class="value">http://${domain}</span>
            </div>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(path.join(projectPath, 'index.php'), phpContent, 'utf8');

    // إنشاء ملف phpinfo.php
    const phpinfoContent = `<?php
// ملف معلومات PHP
phpinfo();
?>`;
    fs.writeFileSync(path.join(projectPath, 'phpinfo.php'), phpinfoContent, 'utf8');

    // إنشاء Virtual Host
    updateProgressWindow('إعداد الدومين المحلي...', 60, 'إنشاء Virtual Host');
    addVirtualHost(projectName, 'php');

    // إضافة إلى hosts file
    updateProgressWindow('إضافة الدومين إلى hosts...', 80, 'تحديث ملف hosts');
    try {
      addToHosts(domain);
    } catch (error) {
      console.warn('Failed to add to hosts file:', error.message);
    }

    updateProgressWindow('تم إنشاء الموقع بنجاح!', 100, 'جاري فتح الموقع...');

    setTimeout(() => {
      closeProgressWindow();
      
      dialog.showMessageBox(null, {
        type: 'info',
        title: 'تم إنشاء موقع PHP بنجاح!',
        message: `تم إنشاء موقع PHP بنجاح!`,
        detail: `اسم الموقع: ${projectName}\nالمجلد: ${projectPath}\nالرابط: http://${domain}`,
        buttons: ['فتح الموقع', 'فتح المجلد', 'موافق']
      }).then((result) => {
        if (result.response === 0) {
          shell.openExternal(`http://${domain}`);
        } else if (result.response === 1) {
          shell.openPath(projectPath);
        }
      });
      
      refreshMenu();
      showNotification('تم إنشاء موقع PHP', `موقع ${projectName} جاهز للاستخدام!`);
      
    }, 1000);

  } catch (error) {
    closeProgressWindow();
    dialog.showErrorBox('خطأ في إنشاء الموقع', error.message);
  }
}

async function createDatabaseWebsite() {
  try {
    const projectName = await getProjectName('PHP + Database Site');
    if (!projectName) return;

    const projectPath = path.join(baseDir, 'www', projectName);
    const domain = `${projectName}.test`;
    const dbName = `${projectName}_db`;

    // فحص إذا كان المجلد موجود
    if (fs.existsSync(projectPath)) {
      const result = await dialog.showMessageBox(null, {
        type: 'question',
        title: 'المجلد موجود',
        message: `المجلد ${projectName} موجود بالفعل. هل تريد المتابعة؟`,
        buttons: ['المتابعة', 'إلغاء'],
        defaultId: 1
      });
      
      if (result.response === 1) return;
    }

    createProgressWindow('إنشاء موقع PHP + قاعدة بيانات', 'جاري إنشاء الموقع...');

    // إنشاء المجلد
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    // إنشاء قاعدة البيانات
    updateProgressWindow('إنشاء قاعدة البيانات...', 20, `إنشاء قاعدة البيانات: ${dbName}`);
    try {
      await createDatabase(projectName);
    } catch (error) {
      console.warn('Failed to create database:', error.message);
    }

    // إنشاء ملف config.php للاتصال بقاعدة البيانات
    updateProgressWindow('إنشاء ملفات الموقع...', 40, 'إنشاء ملف التكوين');
    const configContent = `<?php
// إعدادات قاعدة البيانات
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', '${dbName}');

// اتصال قاعدة البيانات
function getDBConnection() {
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $pdo;
    } catch(PDOException $e) {
        die("فشل الاتصال بقاعدة البيانات: " . $e->getMessage());
    }
}

// دالة مساعدة لتنفيذ الاستعلامات
function executeQuery($sql, $params = []) {
    $pdo = getDBConnection();
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

// إنشاء جدول المستخدمين إذا لم يكن موجوداً
function createUsersTable() {
    $sql = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    try {
        executeQuery($sql);
        return true;
    } catch(Exception $e) {
        return false;
    }
}

// استدعاء إنشاء الجدول
createUsersTable();
?>`;

    fs.writeFileSync(path.join(projectPath, 'config.php'), configContent, 'utf8');

    // إنشاء ملف index.php مع واجهة لإدارة المستخدمين
    const indexContent = `<?php
require_once 'config.php';
session_start();

// معالجة إضافة مستخدم جديد
if ($_POST['action'] === 'add_user') {
    $name = trim($_POST['name']);
    $email = trim($_POST['email']);
    
    if (!empty($name) && !empty($email)) {
        try {
            executeQuery("INSERT INTO users (name, email) VALUES (?, ?)", [$name, $email]);
            $success = "تم إضافة المستخدم بنجاح!";
        } catch(Exception $e) {
            $error = "خطأ في إضافة المستخدم: " . $e->getMessage();
        }
    } else {
        $error = "يرجى ملء جميع البيانات";
    }
}

// جلب قائمة المستخدمين
try {
    $users = executeQuery("SELECT * FROM users ORDER BY created_at DESC")->fetchAll();
} catch(Exception $e) {
    $users = [];
    $db_error = "خطأ في الاتصال بقاعدة البيانات: " . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName} - موقع PHP + قاعدة البيانات</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255,255,255,0.9);
            border-radius: 20px;
            padding: 30px;
            backdrop-filter: blur(10px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        h1, h2 { color: #333; text-align: center; }
        
        .form-card, .users-card {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .form-group {
            margin: 15px 0;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #333;
        }
        
        input[type="text"], input[type="email"] {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
            box-sizing: border-box;
        }
        
        .btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 25px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .alert {
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        }
        
        .alert-success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        
        .alert-error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        
        .users-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        .users-table th, .users-table td {
            padding: 12px;
            text-align: right;
            border-bottom: 1px solid #ddd;
        }
        
        .users-table th {
            background: #667eea;
            color: white;
        }
        
        .no-users {
            text-align: center;
            color: #666;
            padding: 20px;
        }
        
        .db-info {
            background: #e3f2fd;
            border-radius: 10px;
            padding: 15px;
            margin: 20px 0;
            color: #1976d2;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 ${projectName}</h1>
        <p style="text-align: center;">موقع PHP متصل بقاعدة البيانات</p>
        
        <div class="db-info">
            <strong>📊 معلومات قاعدة البيانات:</strong><br>
            اسم قاعدة البيانات: <strong>${dbName}</strong><br>
            عدد المستخدمين: <strong><?php echo count($users); ?></strong>
        </div>
        
        <?php if (isset($success)): ?>
            <div class="alert alert-success"><?php echo $success; ?></div>
        <?php endif; ?>
        
        <?php if (isset($error)): ?>
            <div class="alert alert-error"><?php echo $error; ?></div>
        <?php endif; ?>
        
        <div class="form-card">
            <h2>➕ إضافة مستخدم جديد</h2>
            <form method="POST">
                <input type="hidden" name="action" value="add_user">
                
                <div class="form-group">
                    <label for="name">الاسم:</label>
                    <input type="text" id="name" name="name" required>
                </div>
                
                <div class="form-group">
                    <label for="email">البريد الإلكتروني:</label>
                    <input type="email" id="email" name="email" required>
                </div>
                
                <button type="submit" class="btn">إضافة المستخدم</button>
            </form>
        </div>
        
        <div class="users-card">
            <h2>👥 قائمة المستخدمين</h2>
            
            <?php if (count($users) > 0): ?>
                <table class="users-table">
                    <thead>
                        <tr>
                            <th>الرقم</th>
                            <th>الاسم</th>
                            <th>البريد الإلكتروني</th>
                            <th>تاريخ الإضافة</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($users as $user): ?>
                            <tr>
                                <td><?php echo $user['id']; ?></td>
                                <td><?php echo htmlspecialchars($user['name']); ?></td>
                                <td><?php echo htmlspecialchars($user['email']); ?></td>
                                <td><?php echo date('Y-m-d H:i', strtotime($user['created_at'])); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <div class="no-users">
                    📝 لا يوجد مستخدمين حتى الآن<br>
                    قم بإضافة أول مستخدم باستخدام النموذج أعلاه
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(path.join(projectPath, 'index.php'), indexContent, 'utf8');

    // إنشاء Virtual Host
    updateProgressWindow('إعداد الدومين المحلي...', 70, 'إنشاء Virtual Host');
    addVirtualHost(projectName, 'php');

    // إضافة إلى hosts file
    updateProgressWindow('إضافة الدومين إلى hosts...', 90, 'تحديث ملف hosts');
    try {
      addToHosts(domain);
    } catch (error) {
      console.warn('Failed to add to hosts file:', error.message);
    }

    updateProgressWindow('تم إنشاء الموقع بنجاح!', 100, 'جاري فتح الموقع...');

    setTimeout(() => {
      closeProgressWindow();
      
      dialog.showMessageBox(null, {
        type: 'info',
        title: 'تم إنشاء الموقع بنجاح!',
        message: `تم إنشاء موقع PHP + قاعدة البيانات بنجاح!`,
        detail: `اسم الموقع: ${projectName}\nالمجلد: ${projectPath}\nالرابط: http://${domain}\nقاعدة البيانات: ${dbName}`,
        buttons: ['فتح الموقع', 'فتح المجلد', 'موافق']
      }).then((result) => {
        if (result.response === 0) {
          shell.openExternal(`http://${domain}`);
        } else if (result.response === 1) {
          shell.openPath(projectPath);
        }
      });
      
      refreshMenu();
      showNotification('تم إنشاء الموقع', `موقع ${projectName} مع قاعدة البيانات جاهز!`);
      
    }, 1000);

  } catch (error) {
    closeProgressWindow();
    dialog.showErrorBox('خطأ في إنشاء الموقع', error.message);
  }
}

// Initialize the tray icon and menu
function createTray() {
  // تنظيف httpd.conf من أي Include statements خاطئة عند بدء البرنامج
  cleanupHttpdConf();
  
  // إعداد مراقب لملف httpd.conf لمنع إضافة Include statements خاطئة
  setupHttpdConfWatcher();
  
  // تحميل الإعدادات
  loadSettings();
  
  // إعداد IPC handlers
  setupIpcHandlers();
  
  const tray = new Tray(path.join(baseDir, 'assets', 'icon.png'));
  tray.setToolTip('MyDevBox');
  
  // تخزين tray في global للوصول إليه من refreshMenu
  global.appTray = tray;
  
  refreshMenu();
  return tray;
}

module.exports = {
  createTray,
  createSimpleWebsite,
  createPHPWebsite,
  createDatabaseWebsite,
  stopAll: () => {
    stopService('apache');
    stopService('mysql');
  }
};