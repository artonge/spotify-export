const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")
const url = require("url")
const fs = require("fs")
const os = require("os")
const request = require('request')
const ffmetadata = require("ffmetadata")
const search = require('youtube-search')
const ytdl = require('ytdl-core')
const ffmpeg = require('fluent-ffmpeg')
const mkdirp = require('mkdirp')

// Keep a global reference of the window object, if you don"t, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
	// Create the browser window.
	win = new BrowserWindow({width: 800, height: 600})

	// and load the index.html of the app.
	win.loadURL(url.format({
		pathname: path.join(__dirname, "dist/index.html"),
		protocol: "file:",
		slashes: true
	}))

	// Open the DevTools.
	win.webContents.openDevTools()

	// Emitted when the window is closed.
	win.on("closed", () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		win = null
	})
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow)

// Quit when all windows are closed.
app.on("window-all-closed", () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		app.quit()
	}
})

app.on("activate", () => {
	// On macOS it"s common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		createWindow()
	}
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.


ipcMain.on("get-track", (event, track) => {
	const tmpDir = fs.mkdtempSync(`${os.tmpdir()}/spotify-export-`)
	const finalDir = `out/${track.track.artists[0].name}/${track.track.album.name}`
	const tmpFilePath = `${tmpDir}/sound.mp3`
	const finalFilePath = `${finalDir}/${track.track.name}.mp3`

	search(`${track.track.artists[0].name} ${track.track.name}`, { key: "AIzaSyDmw45jFoLeQ0ycBgUyO7zVEDPgys0ZJmM" }, function(err, results) {
		if (err) {
			console.error(err)
			return
		}

		const dlStream = ytdl(results[0].link, { filter: "audioonly" })
			.on('progress', function(chunkSize, downloadedSize, totalSize) {
				event.sender.send(`${track.track.id}-response`, Math.round((downloadedSize/totalSize)*100))
			})

		ffmpeg(dlStream)
			.noVideo()
			.audioCodec("libmp3lame")
			.audioQuality(0)
			.save(tmpFilePath)
			.on('error', (err) => console.log(err))
			.on('end', () => {
				request
					.get(track.track.album.images[track.track.album.images.length-1].url)
					.on('response', (response) => {
						ffmetadata.write(
							tmpFilePath,
							{
								title: track.track.name,
								artist: track.track.artists[0].name,
								album: track.track.album.name,
								track: track.track.track_number,
								disc: track.track.disc_number,
							},
							{ attachments: [`${tmpDir}/image.jpeg`] },
							(err) => {
								if (err) {
									console.log(err)
									return
								}
								mkdirp.sync(finalDir)
								fs.createReadStream(tmpFilePath)
									.pipe(fs.createWriteStream(finalFilePath))
									.on('finish', () => {
										fs.unlinkSync(tmpFilePath)
										fs.unlinkSync(`${tmpDir}/image.jpeg`)
										fs.rmdirSync(tmpDir)
										event.sender.send(track.track.id)
									})
							}
						)
					})
					.pipe(fs.createWriteStream(`${tmpDir}/image.jpeg`))
			})
	})
})
