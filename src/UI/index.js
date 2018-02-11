import { ipcRenderer } from "electron"
import Spotify from "spotify-web-api-js"

import Vue from "vue"
// import VueRouter from "vue-router"
import Vuex from "vuex"

import ElementUI from "element-ui"
import "element-ui/lib/theme-chalk/index.css"

import App from "./App"

// TODO - remove for prod
Vue.config.productionTip = false

// Vue.use(VueRouter)
Vue.use(Vuex)

Vue.use(ElementUI)


new Vue({
	el: "#app",
	template: "<App/>",
	components: { App },
	store: new Vuex.Store({
		strict: false,
		state: {
			playlists: {},
			tracks: {},
			tokens: {},
			artists: {},
			user: {},
			binded: false,
			spotifyApi: new Spotify(),
			directory: "Music",
		},
		getters: {
			getPlaylistProgress: (state) => (playlistId) => {
				const playlist = state.playlists[playlistId]

				if (playlist.tracks.length === 0) {
					return 0
				}

				const totalProgress = playlist.tracks
					.reduce(
						(totalProgress, trackId) => totalProgress + (state.tracks[trackId].progress || 0),
						0
					)

				return Math.round(totalProgress / playlist.tracks.length)
			}
		},
		mutations: {
			setTokens(state, tokens) {
				state.spotifyApi.setAccessToken(tokens.access_token)
				state.tokens = {
					...state.tokens,
					...tokens,
				}
			},
			setUser(state, user) {
				state.user = {
					...state.user,
					...user,
				}
			},
			addPlaylists(state, playlists) {
				state.playlists = {
					...state.playlists,
					...playlists
						.map((playlist) => {
							return {
								...playlist,
								checked: true,
								tracks: [],
							}
						})
						.reduce(((normalizePlaylists, playlist) => {
							normalizePlaylists[playlist.id] = playlist
							return normalizePlaylists
						}), {}),
				}
			},
			addArtist(state, artist) {
				state.artists = {
					...state.artists,
					[artist.id]: artist,
				}
			},
			addTracks(state, tracks) {
				state.tracks = {
					...state.tracks,
					...tracks
						.map((track) => {
							return {
								...track,
								checked: true,
								track: {
									...track.track,
									name: track.track.name.replace("/", "-"),
								},
							}
						})
						.reduce(((normalizeTracks, track) => {
							normalizeTracks[track.track.id] = track
							return normalizeTracks
						}), {}),
				}
			},
			addTrackToPlaylist(state, {playlistId, tracks}) {
				state.playlists[playlistId].tracks = tracks
					.concat(state.playlists[playlistId].tracks)
					.map((track) => track.track.id)
					.sort()
					.filter((trackId, i, trackIds) => i === 0 || trackIds[i-1] !== trackId)
			},
			togglePlaylist(state, {playlistId, checked}) {
				if (checked === undefined) {
					checked = !state.playlists[playlistId].checked
				}

				state.playlists[playlistId] = {
					...state.playlists[playlistId],
					checked,
				}

				for (let trackId of state.playlists[playlistId].tracks) {
					state.tracks[trackId] = {
						...state.tracks[trackId],
						checked,
					}
				}
			},
			toggleTrack(state, trackId) {
				state.tracks[trackId] = {
					...state.tracks[trackId],
					checked: !state.tracks[trackId].checked,
				}
			},
			setBinded(state) {
				state.binded = true
			},
			updateTrack(state, {trackId, update}) {
				state.tracks[trackId] = {
					...state.tracks[trackId],
					...update,
				}
			},
			updateDirectory(state, event) {
				state.directory = event.target.files[0].path
				ipcRenderer.send("updateDirectory", state.directory)
			},
		},
		actions: {
			updateDirectory({commit, state}, event) {
				commit("updateDirectory", event)
				for (let trackId in state.tracks) {
					const track = state.tracks[trackId]
					ipcRenderer.send("checkTrack", track)
				}
			},
			async getPlaylists({commit, state}) {
				const playlists = (await state.spotifyApi.getUserPlaylists()).items
				commit("addPlaylists", playlists)
			},
			async getTracksForPlaylists({dispatch, state}) {
				for (let playlistId in state.playlists) {
					dispatch("getTracksForPlaylist", playlistId)
				}
			},
			async getTracksForPlaylist({commit, state}, playlistId) {
				let result = (await state.spotifyApi.getPlaylistTracks(state.user.id, playlistId))
				let tracks = result.items
				while (result.next !== null) {
					result = await state.spotifyApi.getGeneric(result.next)
					tracks = tracks.concat(result.items)
				}
				tracks = tracks.filter((track) => !track.is_local)
				for (let track of tracks) {
					ipcRenderer.send("checkTrack", track)
				}
				commit("addTrackToPlaylist", {playlistId, tracks})
				commit("addTracks", tracks)
			},
			async getUser({commit, state}) {
				// Bind the "track-info" event to have feedback on progress and finish
				// If it's already done, pass this step
				if (!state.binded) {
					ipcRenderer.on("track-info", (event, trackId, type, payload) => {
						switch (type) {
						case "progress":
							commit("updateTrack", {trackId, update: {progress: payload}})
							break
						case "done":
							commit("updateTrack", {trackId, update: {status: "downloaded"}})
							break
						}
					})
					commit("setBinded")
				}
				return new Promise((resolve, reject) => {
					try {
						ipcRenderer.send("connectToSpotify")

						ipcRenderer.once("tokens", async (event, tokens) => {
							commit("setTokens", tokens)
							commit("setUser", await state.spotifyApi.getMe())
							resolve()
						})
					} catch (e) {
						reject()
					}
				})
			},
			startExport({commit, state}) {
				// Get all checked tracks
				for (let trackId in state.tracks) {
					let track = state.tracks[trackId]

					if (!track.checked || track.status === "downloaded") {
						continue
					}

					commit("updateTrack", {
						trackId,
						update: {
							status: "downloading",
							checked: false,
						}
					})

					ipcRenderer.send("getTrack", track, false)
				}

				// Write m3u8 file for all checked playlists
				for (let playlistId in state.playlists) {
					let playlist = state.playlists[playlistId]
					if (!playlist.checked) {
						continue
					}

					ipcRenderer.send(
						"savePlaylist",
						playlist.name,
						playlist.tracks.map((trackId) => state.tracks[trackId])
					)
				}
			},
		}
	}),
})
