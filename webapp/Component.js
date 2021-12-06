jQuery.sap.registerModulePath("hcm.fab.myleaverequest", "/sap/bc/ui5_ui5/sap/hcmfab_leav_man/");
sap.ui.define([
	"hcm/fab/myleaverequest/Component"
], function (Component) {
	"use strict";

	/* global Promise */
	return Component.extend("hcm.fab.myleaverequest.HCMFAB_LEAV_MANExtension.Component", {
		metadata: {
			manifest: "json"
		}
	});
});