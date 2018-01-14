<template>
	<el-container id="global-container" direction="vertical">

		<el-container id="content-container" direction="horizontal">

			<el-aside width="300px" style="height: 100%;">
				<div id="global-checker">
					TOGGLE ALL <el-switch v-model="allCheck" @change="toggleAll()"/>
				</div>
				<div
					class="playlist"
					v-for="playlist in playlists"
					:key="playlist.id"
					@click="selectPlaylist(playlist)"
				>
					<img :src="playlist.images[0].url" width="40px"/>
					<span class="playlist-name">{{playlist.name}}</span>
					<el-switch v-model="playlist.checked" @change="togglePlaylist(playlist)"/>
				</div>
			</el-aside>

			<el-main>
				<div
					class="track"
					v-for="track in selectedPlaylist.tracks"
					:key="track.track.id"
				>
					<div class="track-top-container">
						<el-switch v-model="track.checked" v-if="track.status === undefined"/>
						<i class="el-icon-check" v-if="track.status === 'downloaded'"></i>
						<i class="el-icon-loading" v-if="track.status === 'downloading'"></i>
						<span class="track-name">{{track.track.name}} - {{track.track.artists[0].name}}</span>
					</div>
					<el-progress :percentage="track.progress"></el-progress>
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
const TOKEN = "BQBw5APShgUFBOSyXH_bezU4ny8YXWvHhT3B0dHjqNMix9ykHTWkSytWPytw1m8zkPbWdRASJo9ET9W1xP6fGjnEPz0F40NTMe7rHUPRBEdXVuKOu9z6AArzGcVPxW8iyN1Xm0wje_zi3K6tqlh_9fdamhz8cxhv6dLgLcE_usikoONdyzjce8p0mBBC4iz6E0_F5yRQ7O7HIA"
s.setAccessToken(TOKEN)


export default {
	name: "app",
	data() {
		return {
			user: {},
			playlists: [],
			selectedPlaylist: {},
			allCheck: true,
		}
	},
	async created() {
		this.user = await s.getMe()
		this.playlists = (await s.getUserPlaylists()).items
		for (let playlist of this.playlists) {
			playlist.checked = this.allCheck
			let result = await s.getPlaylistTracks(this.user.id, playlist.id)
			let tracks = result.items
			while (result.next !== null) {
				result = await s.getGeneric(result.next)
				tracks.concat(result.items)
			}
			playlist.tracks = tracks.map((track) => ({...track, checked: this.allCheck}))
			this.$forceUpdate()
		}
	},
	methods: {
		selectPlaylist: function(playlist) {
			this.selectedPlaylist = playlist
		},
		startExport: function() {
			for (let playlist of this.playlists) {
				if (!Array.isArray(playlist.tracks)) continue
				for (let track of playlist.tracks) {
					if (!track.checked) continue
					track.status = "downloading"
					track.checked = false
					ipcRenderer.send("get-track", track)
					ipcRenderer.on(`${track.track.id}-response`, (event, progress) => {
						track.progress = progress
						this.$forceUpdate()
					})
					ipcRenderer.once(track.track.id, () => {
						track.status = "downloaded"
						this.$forceUpdate()
					})
				}
			}
			this.$forceUpdate()
		},
		togglePlaylist: function(playlist) {
			playlist.tracks = playlist.tracks.map((track) => ({...track, checked: playlist.checked}))
		},
		toggleAll: function() {
			for (let playlist of this.playlists) {
				playlist.checked = this.allCheck
				if (!Array.isArray(playlist.tracks)) continue
				playlist.tracks = playlist.tracks.map((track) => ({...track, checked: this.allCheck}))
			}
		},
	}
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
	align-items: center;
	width: 100%;
	padding: 5px 15px;
	cursor: pointer;
	box-sizing: border-box;
}

.playlist-name {
	flex-grow: 1;
	padding: 0 10px;
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
