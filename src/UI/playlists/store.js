import { ipcRenderer } from "electron"

export default {
	state: {
		items: {},
	},
	mutations: {
		addPlaylists(state, playlists) {
			state.items = {
				...state.items,
				...playlists
					.map((playlist) => {
						return {
							...playlist,
							checked: true,
							tracks: [],
						}
					})
					.reduce(((normalizedPlaylists, playlist) => {
						normalizedPlaylists[playlist.id] = playlist
						return normalizedPlaylists
					}), {}),
			}
		},
		updatePlaylist(state, {playlistId, update}) {
			state.items[playlistId] = {
				...state.items[playlistId],
				...update,
			}
		},
	},
	actions: {
		addTrackToPlaylist({commit, state}, {playlistId, tracks}) {
			commit("updatePlaylist", {playlistId, update: {
				tracks: tracks
					.map((track) => track.track.id)
					.concat(state.items[playlistId].tracks)
					.sort()
					.filter((trackId, i, trackIds) => i === 0 || trackIds[i-1] !== trackId)
			}})
		},
		async fetchSpotifyPlaylists({commit, dispatch, rootState}) {
			ipcRenderer.send("FETCH_SPOTIFY_TOKEN")
			ipcRenderer.once("UPDATE_SPOTIFY_TOKEN", async (event, tokens) => {
				commit("updateConnexions", { spotify: tokens })

				commit("updateUser", await rootState.main.connexions.spotify.client.getMe())

				const playlists = (await rootState.main.connexions.spotify.client.getUserPlaylists()).items

				commit("addPlaylists", playlists)

				for (let playlist of playlists) {
					dispatch("getTracksForPlaylist", playlist.id)
				}
			})

		},
		async getTracksForPlaylist({commit, dispatch, state, rootState}, playlistId) {
			let result = (await rootState.main.connexions.spotify.client.getPlaylistTracks(rootState.main.user.id, playlistId))
			let tracks = result.items
			while (result.next !== null) {
				result = await rootState.main.connexions.spotify.client.getGeneric(result.next)
				tracks = tracks.concat(result.items)
			}
			tracks = tracks.filter((track) => !track.is_local)
			for (let track of tracks) {
				ipcRenderer.send("CHECK_TRACK_PRESENCE_ON_DISK", track)
			}
			dispatch("addTrackToPlaylist", {playlistId, tracks})
			commit("addTracks", tracks)
		},
		togglePlaylist({dispatch, commit, state}, {playlistId, update}) {
			commit("updatePlaylist", {playlistId, update})

			for (let trackId of state.items[playlistId].tracks) {
				commit("updateTrack", {trackId, update})
			}
		},
	},
}
