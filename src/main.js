const connectToSpotify = require("./spotify-connect.js")
const downloadTrack = require("./track-downloader.js")
const savePlaylist = require("./playlist-saver.js")
const fs = require("fs")

const { app, BrowserWindow, ipcMain } = require("electron")

const path = require("path")
const url = require("url")

let win
let directory = "~/Music"

function createWindow () {
	win = new BrowserWindow({width: 800, height: 600})

	win.loadURL(url.format({
		pathname: path.join(__dirname, "../dist/index.html"),
		protocol: "file:",
		slashes: true
	}))

	if (process.env.NODE_ENV !== "production") {
		BrowserWindow.addDevToolsExtension("/home/louis/.config/chromium/Default/Extensions/nhdogjmejiglipccpnnnanhbledajbpd/4.1.3_0")
		win.webContents.openDevTools()
	}

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

ipcMain.on("FETCH_SPOTIFY_TOKEN", async (event) => {
	event.sender.send("UPDATE_SPOTIFY_TOKEN", await connectToSpotify())
})

ipcMain.on("CHECK_TRACK_PRESENCE_ON_DISK", (event, track) => {
	const finalPath = `${directory}/${track.track.artists[0].name}/${track.track.album.name}/${track.track.name}.mp3`

	if (fs.existsSync(finalPath)) {
		event.sender.send("UPDATE_TRACK", track.track.id, "progress", 100)
	}
})

ipcMain.on("FETCH_TRACK", (event, track, forceMetaUpdate) => {
	downloadTrack(event, directory, track, forceMetaUpdate)
})

ipcMain.on("UPDATE_DIRECTORY", (event, newDirectory) => {
	directory = newDirectory
})

ipcMain.on("WRITE_PLAYLIST_ON_DISK", (event, name, tracks) => {
	savePlaylist(directory, name, tracks)
})
