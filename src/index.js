// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from "vue"
import OfficeUIFabricVue from "office-ui-fabric-vue"
import "office-ui-fabric-vue/dist/index.css"

import App from "./App"

Vue.config.productionTip = false

Vue.use(OfficeUIFabricVue)

new Vue({
	el: "#app",
	template: "<App/>",
	components: { App }
})
