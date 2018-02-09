const fs = require("fs")
const request = require("request")
const ffmetadata = require("ffmetadata")
const search = require("youtube-search")
const ytdl = require("ytdl-core")
const ffmpeg = require("fluent-ffmpeg")
const mkdirp = require("mkdirp")


let QUEUE = []
let activesTasks = 0


module.exports = function downloadTrack(event, directory, track, forceMetaUpdate) {
	QUEUE.push([event, directory, track, forceMetaUpdate])
	runTask()
}

async function runTask() {
	if (QUEUE.length > 0 && activesTasks < 7) {
		activesTasks++
		const [event, directory, track, forceMetaUpdate] = QUEUE.shift()
		try {
			await getTrack(event, directory, track, forceMetaUpdate)
			event.sender.send("track-info", track.track.id, "done")
		} catch (e) {
			console.error("Error", track.track.name, e)
			event.sender.send("track-info", track.track.id, "error")
		}
		activesTasks--
		runTask()
	}
}

function getTrack(event, directory, track, forceMetaUpdate) {
	return new Promise(async (resolve, reject) => {
		try {
			const finalDir = `${directory}/${track.track.artists[0].name}/${track.track.album.name}`
			mkdirp.sync(finalDir)

			// Check if song is allready downloaded
			const trackIsPresent = fs.existsSync(`${finalDir}/${track.track.name}.mp3`)

			if (trackIsPresent && !forceMetaUpdate) {
				event.sender.send("track-info", track.track.id, "progress", 100)
				resolve()
				return
			}

			let filesPromises = []

			// Download the album cover image from spotify
			filesPromises.push(downloadImage(track, finalDir))


			if (!trackIsPresent) {
				// Get possible song from youtube search
				const songList = await getSongList(track)

				// Download the first result
				filesPromises.push(downloadSong(songList[0].link, `${finalDir}/${track.track.name}.mp3`, (chunkSize, downloadedSize, totalSize) => {
					event.sender.send(
						"track-info", track.track.id, "progress",
						Math.round((downloadedSize/totalSize)*100)
					)
				}))
			}

			let noImage = false
			try {
				await Promise.all(filesPromises)
			} catch (e) {
				noImage = true
			}

			// Write meta with info from spotify and the image
			await writeMeta(track, finalDir, noImage)

			// Clear the tmp dir
			fs.unlinkSync(`${finalDir}/${track.track.name}.jpeg`)

			resolve()
		} catch (e) {
			reject(e)
		}
	})
}


function getSongList(track) {
	return new Promise((resolve, reject) => {
		search(
			`${track.track.artists[0].name} ${track.track.name}`,
			{ key: "AIzaSyDmw45jFoLeQ0ycBgUyO7zVEDPgys0ZJmM", type: "video" },
			(err, results) => {
				if (err || results.length === 0) {
					reject("search error: " + err)
					return
				}

				resolve(results)
			}
		)
	})
}


function downloadSong(url, finalPath, progressCb) {
	return new Promise((resolve, reject) => {
		const videoStream = ytdl(url, { filter: "audioonly" })
			.on("progress", progressCb)

		ffmpeg(videoStream)
			.noVideo()
			.audioCodec("libmp3lame")
			.audioQuality(0)
			.save(finalPath)
			.on("error", (err) => {
				reject("ffmpeg error: " + err)
			})
			.on("end", resolve)
	})
}


function downloadImage(track, finalDir) {
	return new Promise((resolve, reject) => {
		if (track.track.album.images.length === 0) {
			reject("No album image")
		}

		request
			.get(track.track.album.images[0].url)
			.on("end", resolve)
			.pipe(fs.createWriteStream(`${finalDir}/${track.track.name}.jpeg`))
	})
}


function writeMeta(track, finalDir, noImage) {
	return new Promise((resolve, reject) => {
		ffmetadata.write(
			`${finalDir}/${track.track.name}.mp3`,
			{
				title: track.track.name,
				artist: track.track.artists.map((artist) => artist.name).join("/"),
				album: track.track.album.name,
				track: track.track.track_number,
				disc: track.track.disc_number,
			},
			noImage ? {} : { attachments: [`${finalDir}/${track.track.name}.jpeg`] },
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
