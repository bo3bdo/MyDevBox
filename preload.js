const { contextBridge, ipcRenderer } = require('electron');

// تعريض APIs آمنة للعمليات الأمامية
contextBridge.exposeInMainWorld('electronAPI', {
  // إعدادات التطبيق
  settings: {
    get: (key) => ipcRenderer.invoke('settings-get', key),
    set: (key, value) => ipcRenderer.invoke('settings-set', key, value),
    getAll: () => ipcRenderer.invoke('settings-get-all')
  },
  
  // إدارة الخدمات
  services: {
    start: (serviceName) => ipcRenderer.invoke('service-start', serviceName),
    stop: (serviceName) => ipcRenderer.invoke('service-stop', serviceName),
    status: (serviceName) => ipcRenderer.invoke('service-status', serviceName),
    restart: (serviceName) => ipcRenderer.invoke('service-restart', serviceName)
  },
  
  // إدارة المواقع
  sites: {
    create: (siteData) => ipcRenderer.invoke('site-create', siteData),
    list: () => ipcRenderer.invoke('site-list'),
    delete: (siteName) => ipcRenderer.invoke('site-delete', siteName),
    openInBrowser: (siteUrl) => ipcRenderer.invoke('site-open', siteUrl)
  },
  
  // إدارة phpMyAdmin
  phpMyAdmin: {
    isInstalled: () => ipcRenderer.invoke('phpmyadmin-is-installed'),
    install: () => ipcRenderer.invoke('phpmyadmin-install'),
    remove: () => ipcRenderer.invoke('phpmyadmin-remove'),
    open: () => ipcRenderer.invoke('phpmyadmin-open')
  },
  
  // معلومات النظام
  system: {
    getPlatform: () => ipcRenderer.invoke('system-platform'),
    getVersion: () => ipcRenderer.invoke('system-version'),
    getAppVersion: () => ipcRenderer.invoke('app-version')
  },
  
  // إدارة النوافذ
  window: {
    minimize: () => ipcRenderer.invoke('window-minimize'),
    close: () => ipcRenderer.invoke('window-close'),
    hide: () => ipcRenderer.invoke('window-hide'),
    show: () => ipcRenderer.invoke('window-show')
  },
  
  // الإشعارات
  notifications: {
    show: (title, body, options) => ipcRenderer.invoke('notification-show', title, body, options)
  },
  
  // Event listeners آمنة
  on: (channel, callback) => {
    const validChannels = [
      'service-status-changed',
      'site-created',
      'site-deleted',
      'phpmyadmin-progress',
      'settings-changed'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },
  
  // إزالة Event listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// حماية من تشغيل Node.js APIs في العمليات الأمامية
window.addEventListener('DOMContentLoaded', () => {
  // إخفاء معلومات Node.js
  delete window.process;
  delete window.require;
  delete window.exports;
  delete window.module;
  
  // إظهار معلومات التطبيق فقط
  window.appInfo = {
    name: 'MyDevBox',
    version: '1.0.0',
    description: 'بيئة تطوير محلية متقدمة'
  };
}); 