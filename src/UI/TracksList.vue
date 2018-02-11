<template>
	<el-container id="content-container" direction="horizontal">

		<el-aside width="300px" style="height: 100%;">
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
import { mapState } from "vuex"

import PlaylistComponent from "./playlists/PlaylistComponent"
import TrackComponent from "./tracks/TrackComponent"

export default {
	components: {
		playlist: PlaylistComponent,
		TrackComponent: TrackComponent,
	},
	data() {
		return {
			selectedPlaylistId: undefined,
		}
	},
	computed: {
		...mapState({
			playlists: state => state.playlists.items,
			tracks: state => state.tracks.items,
		}),
	},
	methods: {
		selectPlaylist: function(playlistId) {
			this.selectedPlaylistId = playlistId
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
