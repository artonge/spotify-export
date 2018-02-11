export default {
	state: {
		items: {},
	},
	mutations: {
		addTracks(state, tracks) {
			state.items = {
				...state.items,
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
					.reduce(((normalizedTracks, track) => {
						normalizedTracks[track.track.id] = track
						return normalizedTracks
					}), {}),
			}
		},
		updateTrack(state, {trackId, update}) {
			state.items[trackId] = {
				...state.items[trackId],
				...update,
			}
		},
	},
}
