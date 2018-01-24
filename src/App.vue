<template>
	<el-container id="global-container" direction="vertical">

		<el-container id="content-container" direction="horizontal">

			<el-aside width="300px" style="height: 100%;">
				<div id="global-checker">
					TOGGLE ALL <el-switch v-model="allCheck" @change="toggleAll()"/>
				</div>
				<div
					class="playlist"
					v-for="(playlist, playlistId) in playlists"
					:key="playlist.id"
					@click="selectPlaylist(playlist)"
				>
					<div class="playlist-top-container">
						<img :src="playlist.images[0].url" width="40px"/>
						<span class="playlist-name">{{playlist.name}} ({{playlist.tracks.length}})</span>
						<el-switch v-model="playlist.checked" @change="togglePlaylist(playlist)"/>
					</div>
					<el-progress :percentage="playlistProgress(playlist)"></el-progress>
				</div>
			</el-aside>

			<el-main>
				<div
					class="track"
					v-for="trackId in selectedPlaylist.tracks"
					:key="tracks[trackId].track.id"
				>
					<div class="track-top-container">
						<input
							type="checkbox"
							v-model="tracks[trackId].checked"
							v-if="tracks[trackId].status === undefined"/>
						<i class="el-icon-check" v-if="tracks[trackId].status === 'downloaded'"></i>
						<i class="el-icon-loading" v-if="tracks[trackId].status === 'downloading'"></i>
						<span class="track-name">{{tracks[trackId].track.name}} - {{tracks[trackId].track.artists[0].name}}</span>
					</div>
					<el-progress :percentage="tracks[trackId].progress"></el-progress>
				</div>
			</el-main>

		</el-container>

		<el-footer>
			<el-button
				type="primary"
				icon="el-icon-download"
				@click="startExport()"
			>
				Start export !
			</el-button>
		</el-footer>

	</el-container>
</template>

<script>
import Spotify from "spotify-web-api-js"
import { ipcRenderer } from "electron"

const s = new Spotify()
const TOKEN = "BQDXmw3WP78XkTHelZdRAcJpcQaeLf9jDLtUKxjkpQEHSdqpl328qB1Als9lic-OYW7iJGlH8RtNB4iKqjacdXrM94tE2rW4yuHymk8tidYiqu_-0q4GL72H-x-UPS-bRFfh3IHFIywu3Jko3MZz1a0CrpM6YXQt21c4Ljj1LQ4FQAqgv16uw2d3o45X9kWsY5Vu-ajjIQ"
s.setAccessToken(TOKEN)


export default {
	name: "app",
	data() {
		return {
			user: {},
			playlists: {},
			tracks: {},
			selectedPlaylist: {},
			allCheck: true,
			queue: [],
			activeTasks: 0,
		}
	},
	async created() {
		ipcRenderer.on("track-info", this.onTrackInfoEvent)
		this.user = await s.getMe()
		const playlists = (await s.getUserPlaylists()).items
		playlists.forEach(this.loadPlaylist)
		playlists.forEach((playlist) => this.playlists[playlist.id] = playlist)
	},
	methods: {
		loadPlaylist: async function(playlist) {
			playlist.checked = this.allCheck
			let result = await s.getPlaylistTracks(this.user.id, playlist.id)
			let tracks = result.items
			while (result.next !== null) {
				result = await s.getGeneric(result.next)
				tracks = tracks.concat(result.items)
			}
			tracks = tracks
				.filter((track) => !track.is_local)
				.map((track) => ({
					...track,
					checked: this.allCheck,
					track: {
						...track.track,
						name: track.track.name.replace("/", "-"),
					},
				}))
			tracks.forEach((track) => this.tracks[track.track.id] = track)
			playlist.tracks = tracks
				.map((track) => track.track.id)
				.sort()
				.filter((trackId, i, trackIds) => i === 0 || trackIds[i-1] !== trackId)
			this.$forceUpdate()
		},
		selectPlaylist: function(playlist) {
			this.selectedPlaylist = playlist
		},
		startExport: function() {
			for (let playlistId in this.playlists) {
				const playlist = this.playlists[playlistId]
				if (!Array.isArray(playlist.tracks)) continue
				for (let trackId of playlist.tracks) {
					let track = this.tracks[trackId]
					if (!track.checked) continue
					track.status = "downloading"
					track.checked = false
					ipcRenderer.send("get-track", track, playlist)
				}
			}
			this.$forceUpdate()
		},
		togglePlaylist: function(playlist) {
			if (!Array.isArray(playlist.tracks)) return
			playlist.tracks.forEach((trackId) => this.tracks[trackId].checked = playlist.checked)
		},
		toggleAll: function() {
			for (let playlistId in this.playlists) {
				const playlist = this.playlists[playlistId]
				playlist.checked = this.allCheck
				this.togglePlaylist(playlist)
			}
		},
		onTrackInfoEvent: function(event, track, playlist, type, payload) {
			track = this.tracks[track.track.id]
			playlist = this.playlists[playlist.id]
			switch (type) {
			case "progress":
				track.progress = payload
				break
			case "done":
				track.status = "downloaded"
				this.activeTasks--
			}
			this.$forceUpdate()
		},
		playlistProgress: function(playlist) {
			if (!Array.isArray(playlist.tracks)) return 0
			const totalProgress = playlist.tracks
			.map((trackId) => this.tracks[trackId])
			.reduce(
				((totalProgress, track) => totalProgress + (track.progress || 0)),
				0
			)
			return Math.round(totalProgress/ playlist.tracks.length)
		},
	},
}

</script>

<style global>

#global-container {
	height: 100%;
}

#content-container {
	max-height: calc(100% - 60px);
}

#global-checker {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 50px;
}

#global-checker .el-switch {
	margin-left: 10px;
}

.playlist {
	width: 100%;
	display: flex;
	flex-direction: column;
	width: 100%;
	padding: 5px 15px;
	box-sizing: border-box;
	cursor: pointer;
}

.playlist-name {
	flex-grow: 1;
	padding: 0 10px;
}

.playlist-top-container {
	display: flex;
	align-items: center;
	width: 100%;
}

.track {
	display: flex;
	flex-direction: column;
	padding: 2px 0;
}

.track-name {
	padding-left: 15px;
}

.track i, .track .el-switch {
	width: 40px;
	text-align: center;
}

.track-top-container {
	display: flex;
	align-items: center;
}

footer {
	display: flex;
	justify-content: flex-end;
	align-content: center;
	align-items: center;
	height: 60px;
	background: grey;
}

button {
	width: 100%;
}
</style>
