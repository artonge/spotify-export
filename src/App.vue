<template>
	<div>
		<div>Nom: {{user.display_name || user.id}}</div>
		<div>
			Playlists:

			<div v-for="playlist in playlists">
				{{playlist.name}}
				<table>
					<tr v-for="track in playlist.tracks">
						<th v-if="track.track !== undefined">{{track.track.name}} {{track.track.artists[0].name}}</th>
					</tr>
				</table>
			</div>
		</div>
	</div>
</template>

<script>
import Spotify from "spotify-web-api-js"
import { ipcRenderer } from "electron"


const s = new Spotify()
const TOKEN = "BQDwsV07Ok7RNcy7QxZXi9RkfYPRXynzUkZq2UKR48aXrQJmtXVfBu1OM4cRBH2zXgaqXBn13sxJDYotrcbpIxEdMJ2c24EmX8JmV8SwW_qfC0MYFmSl8ipW_p9xhxKqVnvzxiexaU7ZtKksy0dkDE8wJby2DDngCVwGsB2SkDmcdcIO"
s.setAccessToken(TOKEN)

export default {
	name: "app",
	data() {
		return {
			user: {},
			playlists: [],
		}
	},
	async created() {
		this.user = await s.getMe()
		this.playlists = (await s.getUserPlaylists()).items
		for (let playlist of this.playlists) {
			let result = await s.getPlaylistTracks(this.user.id, playlist.id)
			let tracks = result.items
			while (result.next !== null) {
				result = await s.getGeneric(result.next)
				tracks.concat(result.items)
			}
			playlist.tracks = tracks
		}
		console.log("sending...")
		ipcRenderer.send("playlists", this.playlists)
	}
}

</script>

<style>
#app {
}
</style>
