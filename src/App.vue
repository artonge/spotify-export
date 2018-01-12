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
					<el-switch v-model="track.checked" v-if="track.status === undefined"/>
					<i class="el-icon-check" v-if="track.status === 'downloaded'"></i>
					<i class="el-icon-loading" v-if="track.status === 'downloading'"></i>
					<span class="track-name">{{track.track.name}} - {{track.track.artists[0].name}}</span>
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
const TOKEN = "BQBUQnl45bpIpnL1mde1TMSdA1hBCER0Tg25XU-azvedc7_qiEuFU1eHI2JCWmYO9xbWAl3WUdxzL2AKZOslTHN9wKShZW9WRcfNwe9IRj27y2W5MHG8rPi1rA2PrqqxaoZor9iIHugcLPzsQJy6jNcZT9JewYgO6FyF0oeG3Hd0oFEOWOYm8mWmyfxXeQSryGUY7IdgFQOeDg"
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
			playlist.checked = true
			let result = await s.getPlaylistTracks(this.user.id, playlist.id)
			let tracks = result.items
			while (result.next !== null) {
				result = await s.getGeneric(result.next)
				tracks.concat(result.items)
			}
			playlist.tracks = tracks.map((track) => ({...track, checked: true}))
			this.$forceUpdate()
		}
	},
	methods: {
		selectPlaylist: function(playlist) {
			this.selectedPlaylist = playlist
		},
		startExport: function() {
			for (let playlist of this.playlists) {
				for (let track of playlist.tracks) {
					if (!track.checked) continue
					const trackName = `${track.track.artists[0].name} - ${track.track.name}`
					track.status = "downloading"
					ipcRenderer.send("get-track", trackName)
					ipcRenderer.once(trackName, () => {
						track.status = "downloaded"
						track.checked = false
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
	align-items: center;
	padding: 2px 0;
}

.track-name {
	padding-left: 15px;
}

.track i, .track .el-switch {
	width: 40px;
	text-align: center;
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
