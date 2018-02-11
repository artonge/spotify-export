<template>
	<div
		class="playlist"
		@click="click()"
	>
		<div class="playlist-top-container">
			<img
				:src="playlist.images[0].url"
				width="40px"
				alt="Image de la playlist"
			/>

			<span class="playlist-name"> {{playlist.name}} ({{playlist.tracks.length}}) </span>

			<el-switch
				v-model="inner_checked"
				@change="togglePlaylist({playlistId: playlist.id, update: {checked: !playlist.checked}})"
			/>
		</div>

		<el-progress :percentage="getPlaylistProgress(playlist.id)"/>
	</div>
</template>

<script>
import { mapActions, mapGetters } from "vuex"

export default {
	props: ["playlist"],
	updated() {
		this.inner_checked = this.playlist.checked
	},
	data() {
		return {
			inner_checked: true,
		}
	},
	methods: {
		...mapActions([
			"togglePlaylist",
		]),
		click: function() {
			this.$emit("select")
		}
	},
	computed: {
		...mapGetters([
			"getPlaylistProgress",
		]),
	},
}
</script>

<style scoped>
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
</style>
