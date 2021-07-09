sap.ui.controller("hcm.fab.myleaverequest.HCMFAB_LEAV_MANExtension.controller.OverviewCustom", {

	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 * @memberOf hcm.fab.myleaverequest.HCMFAB_LEAV_MANExtension.controller.OverviewCustom
	 */
		onInit: function() {
			debugger;
			var i18nModel = new sap.ui.model.resource.ResourceModel({bundleName: "hcm.fab.myleaverequest.i18n.i18n"});
           
            i18nModel.enhance({ bundleUrl: "./i18n/i18n_custom.properties" });
            this.getView().setModel(i18nModel, "i18n");
		},

	/**
	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
	 * (NOT before the first rendering! onInit() is used for that one!).
	 * @memberOf hcm.fab.myleaverequest.HCMFAB_LEAV_MANExtension.controller.OverviewCustom
	 */
	//	onBeforeRendering: function() {
	//
	//	},

	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
	 * This hook is the same one that SAPUI5 controls get after being rendered.
	 * @memberOf hcm.fab.myleaverequest.HCMFAB_LEAV_MANExtension.controller.OverviewCustom
	 */
	//	onAfterRendering: function() {
	//
	//	},

	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * @memberOf hcm.fab.myleaverequest.HCMFAB_LEAV_MANExtension.controller.OverviewCustom
	 */
	//	onExit: function() {
	//
	//	},

	//	onInvalidateOverview: function(s, E, o) {
	//
	//	}
	//	onAssignmentSwitch: function(E) {
	//
	//	}
	//	onEntitlementDateChanged: function(E) {
	//
	//	}
	//	onUpdateFinishedEntitlements: function(E) {
	//
	//	}
	//	onUpdateFinishedOverview: function(E) {
	//
	//	}
	//	onCreateLeave: function() {
	//
	//	}
	//	onClose: function() {
	//
	//	}
	//	onItemPressed: function(E) {
	//
	//	}
	//	onEntitlementItemPressed: function(E) {
	//
	//	}
	//	onHandlePopover: function(E) {
	//
	//	}
	//	onNavBack: function() {
	//
	//	}
	//	onDeleteSwipe: function(E) {
	//
	//	}
	//	onDeletePress: function(E) {
	//
	//	}
	//	onEditPress: function(E) {
	//
	//	}
	//	onLeaveOverviewDateChanged: function(E) {
	//
	//	}
	//	onCloseMinDispMessStrip: function() {
	//
	//	}
	//	onCalendarDateSelect: function(E) {
	//
	//	}
	//	onCalendarStartDateChange: function() {
	//
	//	}
	//	onSelect: function(E) {
	//
	//	}
	//	onEntitlementPanelExpand: function(E) {
	//
	//	}
	//	onOverviewPanelExpand: function(E) {
	//
	//	}
	//	_toggleCalendarModel: function(s) {
	//
	//	}
	//	_onRouteMatched: function(E) {
	//
	//	}
	//	_initOverviewModelBinding: function(E) {
	//
	//	}
	//	_readEntitlements: function(E) {
	//
	//	}
	//	_readLeaveRequestWithDefaultStartDate: function(l) {
	//
	//	}
	//	_bindLeaveRequestList: function(s, l) {
	//
	//	}
	//	_getActiveBaseFiltersForTimeAccount: function(s, l) {
	//
	//	}
	//	_refreshAbsences: function() {
	//
	//	}
	//	_refreshEntitlements: function() {
	//
	//	}
	//	_deleteRequest: function(I) {
	//
	//	}
	//	_toggleEntitlements: function(E) {
	//
	//	}
	//	_toggleOverview: function(E) {
	//
	//	}

});