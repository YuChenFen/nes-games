import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { getFile, readGameFile } from './file'
const rootPath = process.cwd()

const APP_NAME = 'games'
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: false,
    titleBarStyle: 'hidden',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.handle('get-roms', () => {
    // 获取 /roms 下的所有 .nes 文件
    const roms = getFile(join(rootPath, "/roms"), ".nes");
    return roms;
  })
  ipcMain.handle('get-romdata', (_, name) => {
    // 读取对应的rom数据
    const roms = readGameFile(join(rootPath, `/roms/${name}`));
    return roms;
  })
  // 帮助窗口
  ipcMain.on('show-help', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const about = [
      "全局键盘按键",
      "1. ↑ ↓ ← → 对应 上下左右 四个按键",
      "2. A 对应 A， Q 按键",
      "3. B 对应 O， S 按键",
      "4. SELECT 对应 空格 按键",
      "5. START 对应 Enter 按键"
    ].join('\n')
    dialog
      .showMessageBox(win, {
        type: 'info',
        icon: icon,
        title: APP_NAME,
        message: '帮助',
        detail: about,
        buttons: ['确定'],
        noLink: true
      })
  })
  // 窗口控制
  ipcMain.on('close', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.close()
  })
  ipcMain.on('maximize', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (win?.isMaximized()) {
      win?.unmaximize()
    } else {
      win?.maximize()
    }
  })
  ipcMain.on('minimize', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (win?.isMinimized()) {
      win?.restore()
    } else {
      win?.minimize()
    }
  })
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
