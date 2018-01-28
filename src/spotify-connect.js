const electronOauth2 = require("electron-oauth2")


const config = {
	clientId: "22c9161c4ac14f9fa574f3ca12333752",
	clientSecret: "05ec2edc12ce4354bc597c443ad45fce",
	authorizationUrl: "https://accounts.spotify.com/authorize",
	tokenUrl: "https://accounts.spotify.com/api/token",
	useBasicAuthorizationHeader: false,
	redirectUri: "http://localhost",
}

const windowParams = {
	alwaysOnTop: true,
	autoHideMenuBar: true,
	webPreferences: {
		nodeIntegration: false,
	},
}

const options = {
	scope: "user-library-read",
	accessType: "ACCESS_TYPE",
}


module.exports = function() {
	return electronOauth2(config, windowParams)
		.getAccessToken(options)
}

// myApiOauth.refreshToken(token.refresh_token)
// .then(newToken => {
// 	console.log(newToken)
// })
// .catch(reject)
