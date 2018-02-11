<template>
	<el-container id="global-container" direction="vertical">
		<el-header>
			<h3>spotify-export</h3>
			<span>Choose the destination folder:</span>
			<input
				type="file"
				webkitdirectory
				@change="updateDirectory"
			/>
		</el-header>

		<tracks-list/>

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
import { mapState, mapActions } from "vuex"

import TracksList from "./TracksList"

export default {
	components: { TracksList },
	computed: {
		...mapState([
			"directory"
		])
	},
	methods: {
		...mapActions([
			"updateDirectory",
			"startExport",
		]),
	}
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

header {
	display: flex;
	align-items: center;
	background: grey;
}

header span {
	flex-grow: 1;
	text-align: right;
	margin-right: 20px;
}

#global-container {
	height: 100%;
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
