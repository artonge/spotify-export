<template>
	<div class="track">
		<div class="track-top-container">
			<el-switch
				v-model="inner_checked"
				@change="toggleTrack(track.track.id)"
				v-if="track.status === undefined"
			/>
			<i class="el-icon-check" v-if="track.status === 'downloaded'"></i>
			<i class="el-icon-loading" v-if="track.status === 'downloading'"></i>
			<span class="track-name">
				{{track.track.name}} - {{track.track.artists[0].name}}
			</span>
		</div>
		<el-progress :percentage="track.progress"></el-progress>
	</div>
</template>

<script>
import { mapMutations } from "vuex"

export default {
	props: ["track"],
	created() {
		this.inner_checked = this.track.checked
	},
	updated() {
		this.inner_checked = this.track.checked
	},
	data() {
		return {
			inner_checked: true,
		}
	},
	methods: {
		...mapMutations([
			"toggleTrack",
		]),
	},
}
</script>

<style scoped>
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
</style>
