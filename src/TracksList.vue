<template>
	<el-container id="content-container" direction="horizontal">

		<el-aside width="300px" style="height: 100%;">
			<div id="global-checker">
				TOGGLE ALL <el-switch v-model="allCheck" @change="toggleAll()"/>
			</div>
			<playlist
				v-for="(playlist, playlistId) in playlists"
				:key="playlist.id"
				:playlist="playlists[playlistId]"
				@select="selectPlaylist(playlistId)"
			>
			</playlist>
		</el-aside>

		<el-main v-if="selectedPlaylistId !== undefined">
			<track-component
				v-for="trackId in playlists[selectedPlaylistId].tracks"
				:key="tracks[trackId].track.id"
				:track="tracks[trackId]"
			/>
		</el-main>

	</el-container>
</template>

<script>
import { mapState, mapMutations } from "vuex"

import PlaylistComponent from "./components/PlaylistComponent"
import TrackComponent from "./components/TrackComponent"

export default {
	components: {
		playlist: PlaylistComponent,
		TrackComponent: TrackComponent,
	},
	data() {
		return {
			selectedPlaylistId: undefined,
			allCheck: true,
		}
	},
	computed: {
		...mapState([
			"playlists",
			"tracks",
			"user",
		])
	},
	async created() {
		await this.$store.dispatch("getUser")
		await this.$store.dispatch("getPlaylists")
		await this.$store.dispatch("getTracksForPlaylists")
	},
	methods: {
		...mapMutations([
			"togglePlaylist",
		]),
		selectPlaylist: function(playlistId) {
			this.selectedPlaylistId = playlistId
		},
		toggleAll: function() {
			Object.keys(this.playlists)
				.map((playlistId) => ({playlistId, checked: this.allCheck}))
				.forEach(this.togglePlaylist)
		},
	},
}
</script>

<style global>
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
</style>
