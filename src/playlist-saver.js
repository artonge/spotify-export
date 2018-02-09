const fs = require("fs")

module.exports = (directory, name, tracks) => {
	// If playlist file already exist, return
	if (fs.existsSync(`${directory}/${name}.m3u8`)) {
		return
	}

	// Build m3u8 file
	let buffer = "#EXTM3U\n"

	for (let track of tracks) {
		buffer += `#EXTINF:${Math.round(track.track.duration_ms/1000)},${track.track.artists[0].name} - ${track.track.name}\n`
		buffer += `${track.track.artists[0].name}/${track.track.album.name}/${track.track.name}.mp3\n`
	}

	// Write file to disk
	fs.writeFileSync(`${directory}/${name}.m3u8`, buffer)
}
