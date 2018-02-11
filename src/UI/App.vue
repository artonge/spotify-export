<template>
	<el-container id="global-container" direction="vertical">
		<el-header>
			<div id="global-checker">
				TOGGLE ALL <el-switch v-model="allCheck" @change="toggleAll()"/>
			</div>
			<el-select
				id="service-select"
				v-model="service"
				clearable
				placeholder="Select the service..."
			>
				<el-option
					v-for="service in services"
					:key="service"
					:label="service"
					:value="service">
				</el-option>
			</el-select>
			<el-autocomplete
				id="search-input"
				v-model="query"
				:fetch-suggestions="queryService"
				placeholder="Search playlist..."
				@select="selectPlaylist"
			></el-autocomplete>
			<el-button
				type="primary"
				icon="el-icon-download"
				@click="fetchSpotifyPlaylists()"
			>
				Get my playlists from spotify
			</el-button>
		</el-header>

		<tracks-list/>

		<el-footer>
			<el-checkbox v-model="savePlaylist" label="Create playlists file (.m3u)" border></el-checkbox>
			<input
				type="file"
				hidden
				id="directory"
				webkitdirectory
				@change="updateDirectory"
			/>
			<label
				for="directory"
				class="el-button el-button--primary"
			>
				<i class="el-icon-edit"></i>
				{{directory || "Choose the destination folder"}}
			</label>

			<el-button
				type="success"
				icon="el-icon-download"
				@click="startExportt()"
				:disabled="directory === ''"
			>
				Start export !
			</el-button>
		</el-footer>

	</el-container>
</template>

<script>
import { mapState, mapActions } from "vuex"

import TracksList from "./TracksList"

export default {
	components: { TracksList },
	created() {
		this.init()
	},
	data() {
		return {
			query: "",
			service: "spotify",
			services: ["spotify"],
			savePlaylist: true,
			allCheck: true,
		}
	},
	computed: {
		...mapState({
			directory: state => state.main.directory,
			playlists: state => state.playlists.items,
			tracks: state => state.tracks.items,
		}),
	},
	methods: {
		...mapActions([
			"init",
			"updateDirectory",
			"startExport",
			"fetchSpotifyPlaylists",
			"togglePlaylist",
		]),
		startExportt() {
			debugger
			this.startExport()
		},
		queryService() {

		},
		selectPlaylist() {

		},
		toggleAll: function() {
			Object.keys(this.playlists)
				.forEach((playlistId) => this.togglePlaylist({playlistId, update: {checked: this.allCheck}}))
		},
	},
}

</script>

<style global>
html, body, #app {
	height: 100%;
	margin: 0;
}

* {
	font-family: "Cantarell" !important;
}

#global-container {
	height: 100%;
}

header {
	display: flex;
	align-items: center;
	border-bottom: 1px solid black;
}

header #global-checker {
	width: 160px;
	margin-right: 10px;
}

header #service-select {
	width: 120px;
}

header #search-input {
	flex-grow: 1;
	margin: 0 10px;
}

footer {
	display: flex;
	align-content: center;
	align-items: center;
	justify-content: space-around;
	height: 60px;
	border-top: 1px solid black;
}
</style>
