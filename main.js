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
const Queue = require('promise-queue')

const queue = new Queue(5, Infinity)

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


let QUEUE = []
let activesTasks = 0
ipcMain.on("get-track", (event, track, playlist) => {
	QUEUE.push([event, track, playlist])
	runTask()
})

async function runTask() {
	if (QUEUE.length > 0 && activesTasks < 7) {
		activesTasks++
		const [event, track, playlist] = QUEUE.shift()
		try {
			await getTrack(event, track, playlist)
			event.sender.send("track-info", track, playlist, "done")
		} catch (e) {
			console.error("Error", track.track.name, e)
			event.sender.send("track-info", track, playlist, "error")
		}
		activesTasks--
		runTask()
	}
}


function getTrack(event, track, playlist) {
	return new Promise(async (resolve, reject) => {
		try {
			const tmpDir = fs.mkdtempSync(`${os.tmpdir()}/spotify-export-`)
			const finalDir = `out/${track.track.artists[0].name}/${track.track.album.name}`

			// Check if song is allready downloaded
			if (fs.existsSync(`${finalDir}/${track.track.name}.mp3`)) {
				event.sender.send("track-info", track, playlist, "progress", 100)
				resolve()
				return
			}

			// Get possible song from youtube search
			const songList = await getSongList(track)

			// Download the first result
			await downloadSong(songList[0].link, tmpDir, (chunkSize, downloadedSize, totalSize) => {
				event.sender.send(
					"track-info", track, playlist, "progress",
					Math.round((downloadedSize/totalSize)*100)
				)
			})

			// Download the album cover image from spotify
			await downloadImage(track, tmpDir)

			// Write meta with info from spotify and the image
			await writeMeta(track, tmpDir)

			// Copy the song in the final directory
			await copySong(track, tmpDir)

			// Clear the tmp dir
			cleanTmpDir(tmpDir)

			resolve()
		} catch (e) {
			reject(e)
		}
	})
}


function downloadImage(track, tmpDir) {
	return new Promise((resolve, reject) => {
		if (track.track.album.images.length === 0) {
			reject("No album image")
		}

		request
			.get(track.track.album.images[track.track.album.images.length-1].url)
			.on('end', resolve)
			.pipe(fs.createWriteStream(`${tmpDir}/image.jpeg`))
	})
}

function downloadSong(url, tmpDir, progressCb) {
	return new Promise((resolve, reject) => {
		const videoStream = ytdl(url, { filter: "audioonly" })
			.on('progress', progressCb)

		ffmpeg(videoStream)
			.noVideo()
			.audioCodec("libmp3lame")
			.audioQuality(0)
			.save(`${tmpDir}/sound.mp3`)
			.on('error', (err) => {
				reject("ffmpeg error: " + err)
			})
			.on('end', resolve)
	})
}

function getSongList(track) {
	return new Promise((resolve, reject) => {
		search(
			`${track.track.artists[0].name} ${track.track.name}`,
			{ key: "AIzaSyDmw45jFoLeQ0ycBgUyO7zVEDPgys0ZJmM", type: "video" },
			(err, results) => {
				if (err || results.length === 0) {
					reject("search error: " + err)
					return
				}

				resolve(results)
			}
		)
	})
}

function writeMeta(track, tmpDir) {
	return new Promise((resolve, reject) => {
		ffmetadata.write(
			`${tmpDir}/sound.mp3`,
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
					reject("ffmetadata error: ", err)
					return
				}
				resolve()
			}
		)
	})
}

function copySong(track, tmpDir) {
	const finalDir = `out/${track.track.artists[0].name}/${track.track.album.name}`

	return new Promise((resolve, reject) => {
		mkdirp.sync(finalDir)
		fs.createReadStream(`${tmpDir}/sound.mp3`)
			.pipe(fs.createWriteStream(`${finalDir}/${track.track.name}.mp3`))
			.on('finish', resolve)
			.on('error', reject)
	})
}

function cleanTmpDir(tmpDir) {
	fs.unlinkSync(`${tmpDir}/sound.mp3`)
	fs.unlinkSync(`${tmpDir}/image.jpeg`)
	fs.rmdirSync(tmpDir)
}
