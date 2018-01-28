const connectToSpotify = require("./src/spotify-connect.js")
const downloadTrack = require("./src/track-downloader.js")

const { app, BrowserWindow, ipcMain } = require("electron")

const path = require("path")
const url = require("url")

let win
let directory = "./out"

function createWindow () {
	// TODO - remove for prod
	BrowserWindow.addDevToolsExtension("/home/louis/.config/chromium/Default/Extensions/nhdogjmejiglipccpnnnanhbledajbpd/4.1.1_0")

	win = new BrowserWindow({width: 800, height: 600})

	win.loadURL(url.format({
		pathname: path.join(__dirname, "dist/index.html"),
		protocol: "file:",
		slashes: true
	}))

	// TODO - remove for prod
	win.webContents.openDevTools()

	win.on("closed", () => {
		win = null
	})
}

app.on("ready", createWindow)

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit()
	}
})

app.on("activate", () => {
	if (win === null) {
		createWindow()
	}
})

ipcMain.on("connectToSpotify", async (event) => {
	event.sender.send("tokens", await connectToSpotify())
})

ipcMain.on("get-track", (event, track) => {
	downloadTrack(event, directory, track)
})

ipcMain.on("updatedDirectory", (event, newDirectory) => {
	directory = newDirectory
})
