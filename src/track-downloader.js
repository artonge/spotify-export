const fs = require("fs")
const os = require("os")
const request = require("request")
const ffmetadata = require("ffmetadata")
const search = require("youtube-search")
const ytdl = require("ytdl-core")
const ffmpeg = require("fluent-ffmpeg")
const mkdirp = require("mkdirp")


let QUEUE = []
let activesTasks = 0


module.exports = function downloadTrack(event, directory, track) {
	QUEUE.push([event, directory, track])
	runTask()
}

async function runTask() {
	if (QUEUE.length > 0 && activesTasks < 7) {
		activesTasks++
		const [event, directory, track] = QUEUE.shift()
		try {
			await getTrack(event, directory, track)
			event.sender.send("track-info", track.track.id, "done")
		} catch (e) {
			console.error("Error", track.track.name, e)
			event.sender.send("track-info", track.track.id, "error")
		}
		activesTasks--
		runTask()
	}
}


function getTrack(event, directory, track) {
	return new Promise(async (resolve, reject) => {
		try {
			const tmpDir = fs.mkdtempSync(`${os.tmpdir()}/spotify-export-`)
			const finalDir = `${directory}/${track.track.artists[0].name}/${track.track.album.name}`

			// Check if song is allready downloaded
			if (fs.existsSync(`${finalDir}/${track.track.name}.mp3`)) {
				event.sender.send("track-info", track.track.id, "progress", 100)
				resolve()
				return
			}

			// Get possible song from youtube search
			const songList = await getSongList(track)

			// Download the first result
			await downloadSong(songList[0].link, tmpDir, (chunkSize, downloadedSize, totalSize) => {
				event.sender.send(
					"track-info", track.track.id, "progress",
					Math.round((downloadedSize/totalSize)*100)
				)
			})

			// Download the album cover image from spotify
			await downloadImage(track, tmpDir)

			// Write meta with info from spotify and the image
			await writeMeta(track, tmpDir)

			// Copy the song in the final directory
			await copySong(track, directory, tmpDir)

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
			.on("end", resolve)
			.pipe(fs.createWriteStream(`${tmpDir}/image.jpeg`))
	})
}


function downloadSong(url, tmpDir, progressCb) {
	return new Promise((resolve, reject) => {
		const videoStream = ytdl(url, { filter: "audioonly" })
			.on("progress", progressCb)

		ffmpeg(videoStream)
			.noVideo()
			.audioCodec("libmp3lame")
			.audioQuality(0)
			.save(`${tmpDir}/sound.mp3`)
			.on("error", (err) => {
				reject("ffmpeg error: " + err)
			})
			.on("end", resolve)
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


function copySong(track, directory, tmpDir) {
	const finalDir = `${directory}/${track.track.artists[0].name}/${track.track.album.name}`

	return new Promise((resolve, reject) => {
		mkdirp.sync(finalDir)
		fs.createReadStream(`${tmpDir}/sound.mp3`)
			.pipe(fs.createWriteStream(`${finalDir}/${track.track.name}.mp3`))
			.on("finish", resolve)
			.on("error", reject)
	})
}


function cleanTmpDir(tmpDir) {
	fs.unlinkSync(`${tmpDir}/sound.mp3`)
	fs.unlinkSync(`${tmpDir}/image.jpeg`)
	fs.rmdirSync(tmpDir)
}
