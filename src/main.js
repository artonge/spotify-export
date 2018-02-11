const connectToSpotify = require("./spotify-connect.js")
const downloadTrack = require("./track-downloader.js")
const savePlaylist = require("./playlist-saver.js")
const fs = require("fs")

const { app, BrowserWindow, ipcMain } = require("electron")

const path = require("path")
const url = require("url")

let win
let directory = "/tpm"

function createWindow () {
	// TODO - remove for prod
	BrowserWindow.addDevToolsExtension("/home/louis/.config/chromium/Default/Extensions/nhdogjmejiglipccpnnnanhbledajbpd/4.1.3_0")

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

ipcMain.on("checkTrack", (event, track) => {
	const finalPath = `${directory}/${track.track.artists[0].name}/${track.track.album.name}/${track.track.name}.mp3`

	if (fs.existsSync(finalPath)) {
		event.sender.send("track-info", track.track.id, "progress", 100)
	}
})

ipcMain.on("getTrack", (event, track, forceMetaUpdate) => {
	downloadTrack(event, directory, track, forceMetaUpdate)
})

ipcMain.on("updateDirectory", (event, newDirectory) => {
	directory = newDirectory
})

ipcMain.on("savePlaylist", (event, name, tracks) => {
	savePlaylist(directory, name, tracks)
})
