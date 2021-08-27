sap.ui.controller("hcm.fab.myleaverequest.HCMFAB_LEAV_MANExtension.controller.OverviewCustom", {

	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 * @memberOf hcm.fab.myleaverequest.HCMFAB_LEAV_MANExtension.controller.OverviewCustom
	 */
	onInit: function () {

		var i18nModel = new sap.ui.model.resource.ResourceModel({
			bundleName: "hcm.fab.myleaverequest.i18n.i18n"
		});
		var sRootPath = jQuery.sap.getModulePath("hcm.fab.myleaverequest.HCMFAB_LEAV_MANExtension");

		i18nModel.enhance({
			//bundleUrl: "i18n/i18n_custom.properties" 
			bundleUrl: [sRootPath, "i18n/i18n_custom.properties"].join("/")
		});
		this.getView().setModel(i18nModel, "i18n");

		// set initial values
		var oOverviewModel = this.getView().getModel("overview");
		oOverviewModel.setProperty("/limitStartDate", new Date());

	},

	_readLimits: function (sEmployeeId) {

		this._oLimitColumListItemTemplate = this._oLimitColumListItemTemplate ? this._oLimitColumListItemTemplate.clone() :
			this.getView().byId("limitColumnListItem");
		// Init Limit table            
		this.getView().byId("limitTable").bindItems({
			path: "/TimeAccountSet",
			template: this._oLimitColumListItemTemplate,
			filters: this._getActiveBaseFiltersForTimeAccount(new Date(), sEmployeeId)
		});


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
	_initOverviewModelBinding: function (sEmployeeId) {
		if (this._sEmployeeNumber !== sEmployeeId) {
			this._sEmployeeNumber = sEmployeeId;

			// Read the available entitlements
			this._readEntitlements(sEmployeeId);

			// read the available limits
			this._readLimits(sEmployeeId);

			// Read Leave Request with in sync with Default Start value
			this._readLeaveRequestWithDefaultStartDate(sEmployeeId);

			// check if first xss sign availables
			this._checkFirstXssSign(sEmployeeId);
		}
	},

	onLimitDateChanged: function (oEvent) {

		var oDatePicker = oEvent.getSource();
		var iSelectedDate = +oDatePicker.getDateValue();
		var iNow = +(new Date());
		if (iSelectedDate <= iNow) {
			this._oOverviewModel.setProperty("/limitStartDate", new Date());
			oEvent.preventDefault();
		}

	},

	_checkFirstXssSign: function (sEmployeeId) {


		new Promise(function (resolve, reject) {
			this.oODataModel.callFunction("/checkFirstSign", {
				urlParameters: {
					EmployeeID: sEmployeeId
				},
				method: "GET",
				success: function (response) {
					resolve(response);
				},
				error: function (error) {
					reject(error);
				}
			});
		}.bind(this)).then(function (oData) {

			if (oData.checkFirstSign.ZzInfo === 'X') {
				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				let i18nModel = this.getView().getModel("i18n");
				var sMsgText = i18nModel.getResourceBundle().getText("msgFirstXssSign");
				let bRes;

				new Promise(function (resolve, reject) {

					sap.m.MessageBox.confirm(
						sMsgText, {
						actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
						styleClass: bCompact ? "sapUiSizeCompact" : "",
						onClose: function (sAction) {
							if (sAction === 'OK') {
								bRes = true;
							} else {
								bRes = false;
							}
							resolve(bRes);
						}
					}
					);
				}).then(function (bRes) {
					if (bRes) {
						this._setFirstXssSign(sEmployeeId);
					} else {
						this._goBack();
					}

				}.bind(this));
			}
		}.bind(this));

	},

	_setFirstXssSign: function (sEmployeeId) {
		this.oODataModel.callFunction("/setFirstXssSign", {
			urlParameters: {
				EmployeeID: sEmployeeId
			},
			method: "POST",
			success: function (response) {
			},
			error: function (error) {
			}
		});
	},

	_goBack: function () {
		//debugger;
		var oHistory = sap.ui.core.routing.History.getInstance();
		var sPreviousHash = oHistory.getPreviousHash();


		var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
		oCrossAppNavigator.toExternal({
			target: { shellHash: "#Shell-home" }
		});
		/* 	if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
				// eslint-disable-next-line sap-no-history-manipulation
				history.go(-1);
			} else {
				oCrossAppNavigator.toExternal({
					target: { shellHash: "#Shell-home" }
				});
			} */
	}
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