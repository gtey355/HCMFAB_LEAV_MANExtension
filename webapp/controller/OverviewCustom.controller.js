sap.ui.define(["hcm/fab/myleaverequest/HCMFAB_LEAV_MANExtension/formatter/formatterExt"], function (formatterExt) {
  return sap.ui.controller(
    "hcm.fab.myleaverequest.HCMFAB_LEAV_MANExtension.controller.OverviewCustom",
    {

      formatterExt: formatterExt,
      /**
       * Called when a controller is instantiated and its View controls (if available) are already created.
       * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
       * @memberOf hcm.fab.myleaverequest.HCMFAB_LEAV_MANExtension.controller.OverviewCustom
       */

      onInit: function () {
        var i18nModel = new sap.ui.model.resource.ResourceModel({
          bundleName: "hcm.fab.myleaverequest.i18n.i18n",
        });
        var sRootPath = jQuery.sap.getModulePath(
          "hcm.fab.myleaverequest.HCMFAB_LEAV_MANExtension"
        );

        i18nModel.enhance({
          //bundleUrl: "i18n/i18n_custom.properties"
          bundleUrl: [sRootPath, "i18n/i18n_custom.properties"].join("/"),
        });
        this.getView().setModel(i18nModel, "i18n");

        // set initial values
        var oOverviewModel = this.getView().getModel("overview");
        oOverviewModel.setProperty("/limitStartDate", new Date());
        oOverviewModel.setProperty("/limCount", 0);
      },

      onCreateLeave: function () {
        debugger;
        // check first sign is created
        let sEmployeeId = this.getModel("global").getProperty("/sEmployeeNumber");

        // this check is run from a button, set a flag bCheckSignFromBtn = true to the model
        this.getModel("global").setProperty("/bCheckSignFromBtn", true);

        this._checkFirstXssSign(sEmployeeId).then((res) => {
          if (res) {
            this.navToCreateView();
          }
        }).finally(() => {
          //this.getModel("global").setProperty("/bCheckSignFromBtn", false);
        });
      },

      navToCreateView: function () {
        // The source is the list item that got pressed
        var oCalendar = this.getView().byId("calendar"),
          aSelectedDates = oCalendar.getSelectedDates(),
          oRouter = this.getRouter();
        if (aSelectedDates.length === 0) {
          oRouter.navTo("creation");
        } else {
          var dateRange = aSelectedDates[0],
            oStartDate = utils.dateToUTC(dateRange.getStartDate());
          oCalendar.destroySelectedDates();
          oRouter.navTo("creationWithParams", {
            dateFrom: "" + oStartDate.getTime(),
            dateTo: "" + oStartDate.getTime(),
            absenceType: "default",
            sEmployeeID: this.getModel("global").getProperty("/sEmployeeNumber")
          });
        }
      },

      _readLimits: function (sEmployeeId) {

        let oLimitStartDate = this.getView()
          .getModel("overview")
          .getProperty("/limitStartDate");

        this._oLimitColumListItemTemplate = this._oLimitColumListItemTemplate
          ? this._oLimitColumListItemTemplate.clone()
          : this.getView().byId("limitColumnListItem");
        // Init Limit table
        this.getView()
          .byId("limitTable")
          .bindItems({
            path: "/TimeAccountSet",
            template: this._oLimitColumListItemTemplate,
            filters: this._getActiveBaseFiltersForTimeAccount(
              oLimitStartDate,
              sEmployeeId
            ),
            events: {
              change: this.changeLimitBinding.bind(this),
            },
          });
      },

      changeLimitBinding: function (oEvent) {
        //debugger;
        var oContext = oEvent.getSource().getCurrentContexts()[0] || undefined;
        if (!oContext) {
          return;
        }
        var oOverviewModel = this.getView().getModel("overview");
        oOverviewModel.setProperty(
          "/PlannedAmount",
          oContext.getProperty("PlannedAmount")
        );
        oOverviewModel.setProperty(
          "/TimeUnitCode",
          oContext.getProperty("TimeUnitCode")
        );
        oOverviewModel.setProperty(
          "/TimeUnitName",
          oContext.getProperty("TimeUnitName")
        );
      },

      _initOverviewModelBinding: function (sEmployeeId) {
        if (this._sEmployeeNumber !== sEmployeeId) {
          this._sEmployeeNumber = sEmployeeId;

          // Read the available entitlements
          //this._readEntitlements(sEmployeeId);

          // read the available limits
          this._readLimits(sEmployeeId);

          // Read Leave Request with in sync with Default Start value
          this._readLeaveRequestWithDefaultStartDate(sEmployeeId);

          // check if first xss sign availables, return Promise

          this._checkFirstXssSign(sEmployeeId);
        }
      },

      onLimitDateChanged: function (oEvent) {
        //debugger;

        var oDatePicker = oEvent.getSource();
        var iSelectedDate = oDatePicker.getDateValue();
        var iNow = new Date();
        var iNowForCompare = iNow.setHours(0, 0, 0, 0);
        if (iSelectedDate >= iNowForCompare) {
          this._oOverviewModel.setProperty(
            "/limitStartDate",
            oDatePicker.getDateValue()
          );
          this._readLimits(this._sEmployeeNumber);
        } else {
          let o18nModel = this.getView().getModel("i18n");
          var sMsgText = o18nModel.getResourceBundle().getText("msgDate");
          sap.m.MessageBox.alert(sMsgText);
          oDatePicker.setDateValue(new Date());
        }

        oEvent.preventDefault();
      },

      _checkFirstXssSign: function (sEmployeeId) {
        //debugger;
        return new Promise(
          function (resolve, reject) {
            this.oODataModel.callFunction("/checkFirstSign", {
              urlParameters: {
                EmployeeID: sEmployeeId,
              },
              method: "GET",
              success: function (response) {
                resolve(response);
              },
              error: function (error) {
                reject(error);
              },
            });
          }.bind(this)
        ).then(
          function (oData) {
            //debugger;
            if (oData.checkFirstSign.ZzInfo === "X") {
              //if (true) {
              let oPage = this.getView().byId("page");
              let oDialog = oPage.getDependents()[0];
              oDialog.open();
            }
            else {
              return Promise.resolve(true);
            }
          }.bind(this)
        );
      },

      onContinue: function (oEvent) {
        //debugger;

        this._setFirstXssSign(this._sEmployeeNumber);
        var oDialog = oEvent.getSource().getParent();
        oDialog.close();

        // определяем что диалог был вызван из кнопки
        let bFromBtn = this.getModel("global").getProperty("/bCheckSignFromBtn");
        if (bFromBtn) {
          this.navToCreateView();
        }

      },

      onCancel: function (oEvent) {
        var oDialog = oEvent.getSource().getParent();
        oDialog.close();
      },

      _setFirstXssSign: function (sEmployeeId) {
        this.oODataModel.callFunction("/setFirstXssSign", {
          urlParameters: {
            EmployeeID: sEmployeeId,
          },
          method: "POST",
          success: function (response) { },
          error: function (error) { },
        });
      },

      _goBack: function () {

        var oHistory = sap.ui.core.routing.History.getInstance();
        var sPreviousHash = oHistory.getPreviousHash();

        var oCrossAppNavigator = sap.ushell.Container.getService(
          "CrossApplicationNavigation"
        );
        oCrossAppNavigator.toExternal({
          target: { shellHash: "#Shell-home" },
        });

      },

      onInvalidateOverview: function (sChannelId, sEventId, oData) {

        // leave request changed -> update change date in global model for teamcalendar refresh
        this.getModel("global").setProperty("/lastLeaveRequestChangeDate", new Date());
        // execute the afterNavigate function (if present)
        if (oData.fnAfterNavigate) {
          oData.fnAfterNavigate();
        }

        this._oDataUtil.refresh();
        this._refreshAbsences();
        this._refreshEntitlements();
      },

      onUpdateFinishedLimits: function (oEvent) {

        this._oOverviewModel.setProperty("/limCount", oEvent.getParameter("total"));
      },

      _refreshEntitlements: function () {
        var oEntitlementTable = this.getView().byId("entitlementTable");
        if (!oEntitlementTable) {
          return;
        }
        var oEntitlementTableBinding = oEntitlementTable.getBinding("items");
        oEntitlementTableBinding.refresh();
      }


    }
  );

});
