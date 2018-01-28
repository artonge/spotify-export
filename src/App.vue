<template>
	<el-container id="global-container" direction="vertical">

		<router-view></router-view>

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
import { mapActions } from "vuex"

export default {
	methods: {
		...mapActions([
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
