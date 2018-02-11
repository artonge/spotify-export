import Vue from "vue"
import Vuex from "vuex"

import ElementUI from "element-ui"
import "element-ui/lib/theme-chalk/index.css"

import App from "./App"
import mainStore from "./store"
import playlistsStore from "./playlists/store"
import tracksStore from "./tracks/store"


// TODO - remove for prod
Vue.config.productionTip = false

Vue.use(Vuex)
Vue.use(ElementUI)

new Vue({
	el: "#app",
	template: "<App/>",
	components: { App },
	store: new Vuex.Store({
		strict: process.env.NODE_ENV === "production",
		modules: {
			main: mainStore,
			tracks: tracksStore,
			playlists: playlistsStore,
		},
		getters: {
			getPlaylistProgress: (state) => (playlistId) => {
				const playlist = state.playlists.items[playlistId]

				if (playlist.tracks.length === 0) {
					return 0
				}

				const totalProgress = playlist.tracks
					.reduce(
						(totalProgress, trackId) => {
							return totalProgress + (state.tracks.items[trackId].progress || 0)
						},
						0
					) || 0

				return Math.floor(totalProgress / playlist.tracks.length)
			}
		},
	}),
})
