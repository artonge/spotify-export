import { ipcRenderer } from "electron"
import Spotify from "spotify-web-api-js"

export default {
	state: {
		directory: "",
		user: {},
		connexions: {
			spotify: {
				tokens: {},
				client: new Spotify(),
			}
		},
	},
	mutations: {
		updateConnexions(state, tokens) {
			state.connexions.spotify.client.setAccessToken(tokens.spotify.access_token)
			state.connexions.spotify.tokens = {
				...state.connexions.spotify.tokens,
				...tokens.spotify,
			}
		},
		updateDirectory(state, event) {
			state.directory = event.target.files[0].path
		},
		updateUser(state, update) {
			state.user = {
				...state.user,
				...update,
			}
		},
	},
	actions: {
		init({commit}) {
			// Bind the "UPDATE_TRACK" event to have feedback on progress and finish
			ipcRenderer.on("UPDATE_TRACK", (event, trackId, type, payload) => {
				switch (type) {
				case "progress":
					commit("updateTrack", {trackId, update: {progress: payload}})
					break
				case "done":
					commit("updateTrack", {trackId, update: {status: "downloaded"}})
					break
				}
			})
		},
		updateDirectory({commit, state}, event) {
			ipcRenderer.send("UPDATE_DIRECTORY", event.target.files[0].path)
			commit("updateDirectory", event)
		},
		startExport({commit, rootState}) {
			// Get all checked tracks
			for (let trackId in rootState.tracks.items) {
				let track = rootState.tracks.items[trackId]

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

				ipcRenderer.send("FETCH_TRACK", track, false)
			}

			// Write m3u8 file for all checked playlists
			for (let playlistId in rootState.playlists.items) {
				let playlist = rootState.playlists.items[playlistId]
				if (!playlist.checked) {
					continue
				}

				ipcRenderer.send(
					"WRITE_PLAYLIST_ON_DISK",
					playlist.name,
					playlist.tracks.map((trackId) => rootState.tracks.items[trackId])
				)
			}
		},
	},
}
