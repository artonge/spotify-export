const SERVICES = {}

module.exports = (service, query) => {
	return SERVICES[service].search(query)
}
