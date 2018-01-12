<template>
	<main>
		<div id="playlists-container">
			<div
				class="playlist"
				v-for="playlist in playlists"
				:key="playlist.id"
				@click="selectPlaylist(playlist)"
			>
				<ou-checkbox v-model="playlist.checked"/>
				<ou-persona
					:src="playlist.images[0].url"
					:primaryText="playlist.name"
					:secondaryText="Array.isArray(playlist.tracks) ? playlist.tracks.length.toString() : ''"
				/>
			</div>
		</div>
		<div id="tracks-container">
			<div
				class="track"
				v-for="track in selectedPlaylist.tracks"
				v-if="track.track !== undefined"
			>
				<ou-checkbox v-model="track.checked"/>
				<ou-persona
					size="tiny"
					:type="track.status"
					:primaryText="`${track.track.name} - ${track.track.artists[0].name}`"
				/>
			</div>
		</div>
		<footer id="bottom-bar">
			<ou-button
				type="primary"
				click="startExport()"
			>
				Start export !
			</ou-button>
		</footer>
	</main>
</template>

<script>
import Spotify from "spotify-web-api-js"
// import { ipcRenderer } from "electron"

const s = new Spotify()
const TOKEN = "BQAhfm06GcqjQWyDxkD3tTpocQJnLEwZ34NKrDmML02NdHowQ6w7F66KWh0E2_gEJ4P8NHNGUS3hSAMVHFWG_t69j7LzpP9-fzpWgP5qhmJxPX9L6shOU2FQv64zk5Tpid3zRTm0noOtQZ1Xz5mYz32C3CxV5STwG1KZ6HrDESRFrxwHq5ipDJ4u9JOu0FH36yiFtqEdfvDlJA"
s.setAccessToken(TOKEN)

export default {
	name: "app",
	data() {
		return {
			user: {},
			playlists: [],
			selectedPlaylist: {}
		}
	},
	async created() {
		this.user = await s.getMe()
		this.playlists = (await s.getUserPlaylists()).items
		for (let playlist of this.playlists) {
			// playlist.checked = true
			let result = await s.getPlaylistTracks(this.user.id, playlist.id)
			let tracks = result.items
			while (result.next !== null) {
				result = await s.getGeneric(result.next)
				tracks.concat(result.items)
			}
			// playlist.tracks = tracks.map((track) => ({...track, checked: true}))
			playlist.tracks = tracks
		}
	},
	methods: {
		selectPlaylist: function(playlist) {
			this.selectedPlaylist = playlist
		}
	}
}

</script>

<style global>
main {
	display: flex;
	flex-wrap: wrap;
	height: 100%;
	border: 1px solid black;
}

#playlists-container {
	height: 90%;
	flex-basis: 20%;
	overflow: auto;
	padding: 5px 0;
	box-sizing: border-box;
}

.playlist {
	display: flex;
	align-items: center;
	width: 100%;
	padding: 5px 15px;
	cursor: pointer;
	box-sizing: border-box;
}

.ms-CheckBox {
	margin-right: 5px;
}

#tracks-container {
	display: flex;
	flex-direction: column;
	flex-wrap: wrap;
	flex-basis: 80%;
	height: 90%;
	overflow: auto;
}

.track {
	display: flex;
	align-items: center;
	padding-left: 10px;
}

#bottom-bar {
	display: flex;
	justify-content: flex-end;
	align-items: flex-end;
	width: 100%;
	height: 10%;
	background-color: #f8f8f8;
}

button {
	height: 100% !important;
}
</style>
