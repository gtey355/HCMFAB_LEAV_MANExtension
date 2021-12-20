sap.ui.define([
	"hcm/fab/myleaverequest/utils/formatters",
	"hcm/fab/myleaverequest/HCMFAB_LEAV_MANExtension/formatter/formatterExt",
	"hcm/fab/myleaverequest/utils/utils",
	"hcm/fab/myleaverequest/controller/BaseController",
	"hcm/fab/myleaverequest/utils/DataUtil",
	"hcm/fab/myleaverequest/utils/CalendarUtil",
	"sap/ui/Device",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Context",
	"sap/ui/model/odata/type/Decimal",
	"sap/ui/base/Event",
	"sap/m/Label",
	"sap/m/Input",
	"sap/m/Title",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/ToolbarSpacer",
	"sap/m/ProgressIndicator",
	"sap/m/OverflowToolbar",
	"sap/m/ObjectAttribute",
	"sap/m/UploadCollection",
	"sap/m/UploadCollectionItem",
	"sap/m/UploadCollectionParameter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/format/NumberFormat",
	"hcm/fab/lib/common/controls/TeamCalendarControl",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/StandardListItem",
	"sap/m/DateRangeSelection",
	"sap/m/DatePicker"
], function (formatter, formatterExt, utils, BaseController, DataUtil, CalendarUtil, Device, History, Filter, FilterOperator, Context, Decimal, Event,
	Label, Input, Title,
	MessagePopover,
	MessagePopoverItem,
	MessageToast,
	MessageBox, ToolbarSpacer, ProgressIndicator, OverflowToolbar, ObjectAttribute,
	UploadCollection, UploadCollectionItem, UploadCollectionParameter, JSONModel,
	DateFormat, NumberFormat, TeamCalendarControl, Dialog, Button, StandardListItem, DateRangeSelection, DatePicker) {
	"use strict";

	var I_MAX_APPROVERS = 5;
	var I_MAX_ATTACHMENTS = 5;

	/* These fields from the LOCAL model should also cause data loss warnings */
	var LOCAL_MODEL_CHANGE_RELEVANT_PROPERTY_LIST = [
		"notes",
		"AdditionalFields"
	];

	var O_SEARCH_HELPER_MAPPINGS = {
		"CompCode": {
			keyField: "CompanyCodeID",
			titleField: "CompanyCodeID",
			descriptionField: "CompanyCodeText",
			searchFields: "CompanyCodeID,CompanyCodeText"
		},
		"DescIllness": { // Desc. Illness
			keyField: "IllnessCode",
			titleField: "IllnessCode",
			descriptionField: "IllnessDescTxt",
			searchFields: "IllnessCode,IllnessDescTxt"
		},
		"CostCenter": {
			keyField: "CostCenterID",
			titleField: "CostCenterID",
			descriptionField: "CostCenterText",
			searchFields: "CostCenterID,CostCenterText"
		},
		"OtCompType": { // OT comp. type
			keyField: "OverTimeCompID",
			titleField: "OverTimeCompID",
			descriptionField: "OverTimeCompText",
			searchFields: "OverTimeCompID,OverTimeCompText"
		},
		"TaxArea": { // Tax Area
			keyField: "WorkTaxAreaID",
			titleField: "WorkTaxAreaID",
			descriptionField: "WorkTaxAreaDesciption",
			searchFields: "WorkTaxAreaDesciption"
		},
		"ObjectType": {
			keyField: "ObjtypeID",
			titleField: "ObjtypeID",
			descriptionField: "ObjTypetext",
			searchFields: "ObjtypeID,ObjTypetext"
		},
		"WageType": { // Wage Type
			keyField: "WageTypeID",
			titleField: "WageTypeID",
			descriptionField: "WageTypeText",
			searchFields: "WageTypeID,WageTypeText"
		},
		"OrderID": { // Order
			keyField: "OrderNumID",
			titleField: "OrderNumID",
			descriptionField: "OrderNumText",
			searchFields: "OrderNumID,OrderNumText"
		}
	};

	return sap.ui.controller("hcm.fab.myleaverequest.HCMFAB_LEAV_MANExtension.controller.CreationCustom", {
		oCreateModel: null,
		sCEEmployeeId: undefined,
		formatter: formatter,
		formatterExt: formatterExt,
		utils: utils,
		oUploadCollection: null,
		oUploadSet: null,
		// _messagesPopover: null,
		// _notesBuffer: null,
		// _oMessagePopover: null,
		// _oNewFileData: {},
		// _oControlToFocus: null,
		// _bCheckboxFieldsAreBoolean: false,
		// _bApproverOnBehalfPropertyExists: false,
		// _oSearchApproverItemTemplate: null,
		// _bCheckLeaveSpanDateIsEdmTime: false,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf hcm.fab.myleaverequest.view.Creation
		 */



		onInit: function () {
			//debugger;

			// add custom i18n
			var i18nModel = new sap.ui.model.resource.ResourceModel({
				bundleName: "hcm.fab.myleaverequest.i18n.i18n"
			});
			var sRootPath = jQuery.sap.getModulePath("hcm.fab.myleaverequest.HCMFAB_LEAV_MANExtension");

			i18nModel.enhance({
				//bundleUrl: "i18n/i18n_custom.properties" 
				bundleUrl: [sRootPath, "i18n/i18n_custom.properties"].join("/")
			});
			this.getView().setModel(i18nModel, "i18n");


			formatter.getCalendarTypeFromStatus = function (sStatus) {
				//debugger;
				switch (sStatus) {
					case "POSTED":
					case "APPROVED":
						return "Type08";
					case "SENT":
						return "Type01";
					case "REJECTED":
						return "None"; // hide red color
					default: //fallback (should not happen)
						return "Type06";
				}
			};

			var oButtonPopover = this.getView().byId("createMessagesIndicator");
			oButtonPopover.addEventDelegate(
				{
					onAfterRendering: function () {
						debugger;

						// проверяем ошибки в message manager

						let { bHasMessages, bAdvance, bSimulationIsOK } = this._checkServiceMessages({});

						// открываем поповер только  когда нет авансов и это не рез-ты успешного моделирования
						if (bHasMessages && !bAdvance && !bSimulationIsOK) {
							if (!this._oMessagePopover) {
								this._oMessagePopover = new MessagePopover({
									items: {
										path: "message>/",
										template: new MessagePopoverItem({
											description: "{message>description}",
											type: "{message>type}",
											title: "{message>message}",
											subtitle: "{message>additionalText}"
										})
									}
								});
								jQuery.sap.syncStyleClass(this.getOwnerComponent().getContentDensityClass(), this.getView(), this._oMessagePopover);
								this.getView().addDependent(this._oMessagePopover);
							}
							this._oMessagePopover.openBy(oButtonPopover);
						}

					}
				},
				this
			);

		},

		initLocalModel: function () {
			this.setModelProperties(this.oCreateModel, {
				"uploadPercentage": 0,
				"multiOrSingleDayRadioGroupIndex": 0,
				"isQuotaCalculated": undefined,
				"BalanceAvailableQuantityText": undefined,
				"TimeUnitName": undefined,
				"attachments": [],
				"isAttachmentMandatory": false,
				"isAttachmentUploadEnabled": true,
				"notes": "",
				"showDatePicker": false,
				"showRange": true,
				"usedWorkingTime": undefined,
				"usedWorkingTimeUnit": undefined,
				"aProposedApprovers": [],
				"AdditionalFields": [],
				"showTimePicker": false,
				"showInputHours": false,
				"timePickerFilled": false,
				"inputHoursFilled": false,
				"viewTitle": null,
				"busy": false,
				"sEditMode": null,
				"iMaxApproverLevel": 0,
				"iCurrentApproverLevel": 0,
				"IsMultiLevelApproval": false,
				"isApproverEditable": false,
				"isApproverVisible": false,
				"isAddDeleteApproverAllowed": false,
				"isNoteVisible": false,
				"AbsenceDescription": "",
				"AbsenceTypeName": "",
				"isSaveRequestPending": false,
				"saveButtonEnabled": false,
				"calendar": {
					overlapNumber: 0,
					assignmentId: this.sCEEmployeeId,
					opened: false
				},
				"bHire": false,
				"bDisp": false,
				"bCe": false,
				"bSud": false
			}, undefined, false);
		},

		onSendRequest: function (oEvent) {

			this._sendRequest();

		},


		_sendRequest: function (bRepeat = false) {
			var oOriginalProperties = {},
				sPath = this.getView().getBindingContext().getPath();

			this.oErrorHandler.setShowErrors("manual");

			/* 
			ADDITIONAL FIELDS 
			*/
			this._copyAdditionalFieldsIntoModel(
				this.oCreateModel.getProperty("/AdditionalFields"),
				this.oODataModel,
				sPath
			);

			//check required fields
			if (!this._requiredAdditionalFieldsAreFilled()) {
				this.byId("createMessagesIndicator").focus();
				return;
			}

			//check for fields with errors
			if (this._checkFormFieldsForError()) {
				this.byId("createMessagesIndicator").focus();
				return;
			}

			/* 
			NOTES
			*/
			// Add note text if not empty
			var fSetNoteProperty = function (sPropertyPath, oValue) {
				var oOldValue = this.oODataModel.getProperty(sPropertyPath);
				if (oValue === oOldValue) {
					return;
				}
				if (oValue && oValue.equals && oValue.equals(oOldValue)) {
					return;
				}
				oOriginalProperties[sPropertyPath] = oOldValue;
				this.oODataModel.setProperty(sPropertyPath, oValue);
			}.bind(this);

			if (this.oCreateModel.getProperty("/notes")) {
				fSetNoteProperty(sPath + "/Notes", this.oCreateModel.getProperty("/notes"));
			} else {
				//If note text did not change keep the existing text (which means no update)
				fSetNoteProperty(sPath + "/Notes", this._notesBuffer);
			}

			/* 
			ATTACHMENTS
			*/
			var aUploadColletionItems = [];
			if (this.oUploadCollection) {
				aUploadColletionItems = this.oUploadCollection.getItems();
				if (aUploadColletionItems.length > I_MAX_ATTACHMENTS) {
					this.oErrorHandler.pushError(this.getResourceBundle().getText("txtMaxAttachmentsReached"));
					this.oErrorHandler.displayErrorPopup();
					this.oErrorHandler.setShowErrors("immediately");
					return;
				}
			} else if (this.oUploadSet) {
				aUploadColletionItems = this.oUploadSet.getItems().concat(this.oUploadSet.getIncompleteItems());
			}

			// Check if manadatory attachments exist
			if (this.oCreateModel.getProperty("/isAttachmentMandatory") && aUploadColletionItems.length === 0) {
				this.oErrorHandler.pushError(this.getResourceBundle().getText("txtAttachmentsRequired"));
				this.oErrorHandler.displayErrorPopup();
				this.oErrorHandler.setShowErrors("immediately");
				return;
			}

			// do necessary model updates for add and delete
			this._updateLeaveRequestWithModifiedAttachments(this.oODataModel, sPath);

			//In case of create mode: set the time based values to initial (if probably touched in between
			if ((this.oCreateModel.getProperty("/multiOrSingleDayRadioGroupIndex") === null) ||
				(this.oCreateModel.getProperty("/multiOrSingleDayRadioGroupIndex") === 0)) {
				this.oODataModel.setProperty(sPath + "/PlannedWorkingHours", "0.0");
				this.oODataModel.setProperty(sPath + "/StartTime", "");
				this.oODataModel.setProperty(sPath + "/EndTime", "");
			}

			//Note 2819539: Forward the information about a potential EditPostedLeave-Scenario - ActionID is 3 in this case
			if (this.oCreateModel.getProperty("/sEditMode") === "DELETE") {
				this.oODataModel.setProperty(sPath + "/ActionID", 3);
			}

			/* 
			HANDLE SUBMIT
			*/
			var fnError = function (oError) {
				//debugger;

				let oMessageManager = this.oErrorHandler._oMessageManager;

				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
				var sRootPath = jQuery.sap.getModulePath("hcm.fab.myleaverequest.HCMFAB_LEAV_MANExtension");
				var i18nModel = new sap.ui.model.resource.ResourceModel({
					bundleUrl: [sRootPath, "i18n/i18n_custom.properties"].join("/")
				});
				var sMsgText = i18nModel.getResourceBundle().getText("msgPEP");
				this.oCreateModel.setProperty("/busy", false);
				this.oCreateModel.setProperty("/uploadPercentage", 0);

				// This addresses the current situation:
				//
				// 1. user enters some data in some of the fields
				// 2. submit error
				// 3. user deletes added fields
				// 4. submit success
				//
				Object.keys(oOriginalProperties).forEach(function (sInnerPath) {
					var oOriginalValue = oOriginalProperties[sInnerPath];

					this.oODataModel.setProperty(sInnerPath, oOriginalValue);
				}.bind(this));

				//cleanup of attachments recently added
				var oLeaveRequestToEdit = this.oODataModel.getProperty(sPath),
					sBasePropertyPath = "",
					sAttachmentProperty = "";

				for (var i = 0; i < I_MAX_ATTACHMENTS; i++) {
					sAttachmentProperty = "Attachment" + (i + 1);
					sBasePropertyPath = sPath + "/" + sAttachmentProperty;
					if (oLeaveRequestToEdit[sAttachmentProperty] && !this.oODataModel.getProperty(sBasePropertyPath + "/AttachmentStatus")) {
						this.oODataModel.setProperty(sBasePropertyPath, {
							FileName: "",
							FileType: "",
							FileSize: "0"
						});
					}
				}

				// обработка ошибок из одата сервиса
				//debugger;
				let oParam = {};
				let { bHasMessages, bAdvance, bSimulationIsOK, oMessage } = this._checkServiceMessages(oParam);

				if (bHasMessages && !bAdvance && !bSimulationIsOK) {
					return;
				}

				if (bAdvance) {
					sap.m.MessageBox.confirm(
						oMessage.message, {
						actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
						styleClass: bCompact ? "sapUiSizeCompact" : "",
						onClose: function (sAction) {
							if (sAction === 'OK') {
								this._sendRequest(true);
							}
						}.bind(this)
					}
					);

					return;
				}
				// 
				if (bSimulationIsOK) { // выводим пэп
					oMessageManager.removeAllMessages();
					this.oErrorHandler._aErrors = [];

					sap.m.MessageBox.confirm(
						sMsgText, {
						actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
						styleClass: bCompact ? "sapUiSizeCompact" : "",
						onClose: function (sAction) {
							if (sAction === 'OK') {
								this._sendRequest(true);
							}
						}.bind(this)
					}
					);

				}

			}; //fnError

			if (this.oODataModel.hasPendingChanges()) {

				var oParams = {
					requestID: this.oODataModel.getProperty(sPath + "/RequestID"),
					aUploadedFiles: [], // information about each uploaded file,
					leavePath: sPath,
					showSuccess: true
				};

				// устанавливаем свойство повторности
				this.oODataModel.setProperty(sPath + "/IsRepeat", bRepeat);

				//Forward the information whether we are running in a multiple approver scenario from AbsensceType to the LeaveRequest in create case
				this.oODataModel.setProperty(sPath + "/IsMultiLevelApproval", this.oCreateModel.getProperty("/IsMultiLevelApproval"));
				this.oCreateModel.setProperty("/busy", true);

				this.submitLeaveRequest(oParams)
					.then(this._uploadAttachments.bind(this))
					.then(this._showSuccessStatusMessage.bind(this))
					.catch(fnError.bind(this));

			} else if (this.oODataModel.getProperty(sPath + "/StatusID") === "REJECTED") {
				//if request was rejected the enduser should be able to resend the request without changing anything
				this.oCreateModel.setProperty("/busy", true);
				this.oODataModel.update(sPath, this.oODataModel.getObject(sPath), {
					success: function () {
						this._showSuccessStatusMessage();
					}.bind(this),
					error: function () {
						fnError.call(this);
					}.bind(this)
				});
			} else {
				//show message toast that nothing was changed
				MessageToast.show(this.getResourceBundle().getText("noChangesFound"));
			}

		},

		_checkServiceMessages: function (oParam) {

			let bHasMessages, bAdvance, bSimulationIsOK;
			let oMessageManager = this.oErrorHandler._oMessageManager;
			let aMessages = oMessageManager.getMessageModel().getData();

			// есть сообщения
			if (aMessages.length) {
				bHasMessages = true;
			}

			// авансы
			let oMessage = aMessages.find(msg => (msg && msg.description) ? msg.description.includes('ZHR0043_MSG/006') : undefined);
			oMessage = oMessage ? oMessage : aMessages.find(msg => (msg && msg.description) ? msg.description.includes('ZHR0043_MSG/005') : undefined);
			bAdvance = oMessage ? true : false;

			// search ZHR0043_MSG/008 - успешное моделирование без ошибок
			bSimulationIsOK = aMessages.findIndex(msg => (msg && msg.description) ? msg.description.includes('ZHR0043_MSG/008') : false) > -1 ? true : false;


			return { bHasMessages, bAdvance, bSimulationIsOK, oMessage };
		},



		onAbsenceTypeChange: function (oEvent) {
			var oAbsenceTypeContext,
				oAbsenceTypeSelectedItem = oEvent.getParameter("selectedItem"),
				sLeaveRequestContextPath = this.getView().getBindingContext().getPath();

			if (oAbsenceTypeSelectedItem) {
				oAbsenceTypeContext = oAbsenceTypeSelectedItem.getBindingContext();
				this.updateOdataModel(oAbsenceTypeContext.getObject(), {});

				var oAdditionalFieldsDefinitions = oAbsenceTypeContext.getProperty("toAdditionalFieldsDefinition") || [],
					oAdditionalFieldsValues = this._getAdditionalFieldValues(
						oAdditionalFieldsDefinitions,
						this._getCurrentAdditionalFieldValues()
					),
					oAdditionalFields = {
						definition: oAdditionalFieldsDefinitions,
						values: oAdditionalFieldsValues

					};
				// important: unbind local model from additional fields when
				// changing it. Otherwise bad things will happen with unbound
				// fields.
				this._destroyAdditionalFields();

				this._handleApprovers(
					sLeaveRequestContextPath,
					oAbsenceTypeContext.getProperty("toApprover")
				);

				var oAbsenceTypeData = oAbsenceTypeContext.getObject();
				this._updateLocalModel(
					oAdditionalFields,
					oAbsenceTypeData,
					this.oODataModel.getProperty(sLeaveRequestContextPath + "/StartDate"),
					this.oODataModel.getProperty(sLeaveRequestContextPath + "/EndDate")
				);

				// clear time / hour fields if they are not used by the new absence type. this prevents inconsistent
				// values to be sent to CalculateLeaveSpan which makes it return no result.
				if (!(oAbsenceTypeData.IsRecordInClockTimesAllowed && oAbsenceTypeData.IsAllowedDurationPartialDay)) {
					this.oODataModel.setProperty(sLeaveRequestContextPath + "/StartTime", "");
					this.oODataModel.setProperty(sLeaveRequestContextPath + "/EndTime", "");
				}
				if (!(oAbsenceTypeData.IsRecordInClockHoursAllowed && oAbsenceTypeData.IsAllowedDurationPartialDay)) {
					this.oODataModel.setProperty(sLeaveRequestContextPath + "/PlannedWorkingHours", "0.0");
				}

				this._handleAttachments(oAbsenceTypeContext.getObject());

				this._fillAdditionalFields(
					this.oCreateModel,
					oAbsenceTypeContext.getProperty("AbsenceTypeCode"),
					this._getAdditionalFieldsContainer()
				);

				this._fillAdditionalFieldTexts(oAdditionalFieldsDefinitions, oAdditionalFieldsValues);

				this._updateCalcLeaveDays(false);

				// viperebatov
				// check subty = 2006 (from parameters) and show message if it is true

				var sAbsType = oAbsenceTypeContext.getProperty('AbsenceTypeCode');
				this._checkDispFromBackend(sAbsType);

			}
		},

		_checkDispFromBackend: function (sAbsType) {

			new Promise(function (resolve, reject) {
				this.oODataModel.callFunction("/checkAbsenceFromParam", {
					urlParameters: {
						Subty: sAbsType
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

				this.oCreateModel.setProperty("/bDisp", oData.checkAbsenceFromParam.ZzCheckDisp);
			}.bind(this));

		},


		/*
* This is the handler called when the route is matched. This handler
* is called before any events are triggered by the view (e.g.,
* onAbsenceTypeReceived).
*/
		_onCreateRouteMatched: function (oEvent) {
			var oRouteArgs = oEvent.getParameter("arguments"),
				oAssignmentPromise = this.getOwnerComponent().getAssignmentPromise();

			this.oErrorHandler.setShowErrors("immediately");
			this.oErrorHandler.clearErrors();
			this.oCreateModel.setProperty("/sEditMode", "CREATE");
			this._notesBuffer = "";

			//
			// Actions that don't depend on all the absence type being
			// retrieved below...
			//
			this._destroyAdditionalFields();
			this._cleanupUnsubmittedViewChanges();

			this.oCreateModel.setProperty("/viewTitle", this.getResourceBundle().getText("createViewTitle"));

			Promise.all([
				this.oODataModel.metadataLoaded(),
				oAssignmentPromise,
				this.oODataModel.getMetaModel().loaded()
			]).then(function (aPromiseResults) {
				// did the assignment change?
				if (this.sCEEmployeeId !== aPromiseResults[1]) {
					this._absenceTypeReceivedDeferred = utils.createDeferred();

					// update binding
					this.sCEEmployeeId = aPromiseResults[1];
					this._oSelectionItemTemplate = this.getView().byId("selectionTypeItem");
					this.oCreateModel.setProperty("/busy", true);

					this.getView().byId("absenceType").bindItems({
						path: "/AbsenceTypeSet",
						template: this._oSelectionItemTemplate,
						filters: [new Filter("EmployeeID", FilterOperator.EQ, this.sCEEmployeeId)],
						parameters: {
							expand: "toAdditionalFieldsDefinition,toApprover"
						},
						events: {
							dataReceived: this.onAbsenceTypeReceived.bind(this)
						}
					});
				}

				// Initialize data utility class
				this._oDataUtil = DataUtil.getInstance(this.sCEEmployeeId, this.getModel());

				// Initialize overlap calendar
				this._initOverlapCalendar();

				this._absenceTypeReceivedDeferred.promise.then(function (oAbsenceTypeResult) {
					var aAbsenceTypesInDropdown = oAbsenceTypeResult,
						oViewBindingContext,
						oSelectedAbsenceType;

					this.oCreateModel.setProperty("/busy", false);

					// Create a new entry and prepare to edit it...
					oViewBindingContext = this.createLeaveRequestCollection();
					this.getView().setBindingContext(oViewBindingContext);

					// get default absence type code
					var aDefaultAbsenceTypes = aAbsenceTypesInDropdown.filter(function (oAbsenceType) {
						if (oRouteArgs.absenceType && oRouteArgs.absenceType !== "default") {
							return oAbsenceType.AbsenceTypeCode === oRouteArgs.absenceType;
						} else {
							return oAbsenceType.DefaultType;
						}
					});
					if (aDefaultAbsenceTypes.length !== 0) {
						oSelectedAbsenceType = aDefaultAbsenceTypes[0];
					} else {
						oSelectedAbsenceType = aAbsenceTypesInDropdown[0].AbsenceTypeCode;
					}

					this.updateOdataModel(oSelectedAbsenceType, oRouteArgs);

					var oSelectedAbsenceTypeControl = this.getSelectedAbsenceTypeControl();
					var oAbsenceTypeData = jQuery.extend(true, {}, oSelectedAbsenceType);
					var oAbsenceTypeControlContext = oSelectedAbsenceTypeControl.getBindingContext();
					var oAdditionalFieldsDefinitions = oAbsenceTypeControlContext.getProperty("toAdditionalFieldsDefinition") || [];
					var oAdditionalFieldsValues = this._getAdditionalFieldValues(
						oAdditionalFieldsDefinitions, {} /* non-default values to display */
					);
					var oAdditionalFields = {
						definition: oAdditionalFieldsDefinitions,
						values: oAdditionalFieldsValues
					};

					this._handleApprovers(
						oViewBindingContext.getPath(),
						oAbsenceTypeControlContext.getProperty("toApprover")
					);

					this._updateLocalModel(
						oAdditionalFields,
						oAbsenceTypeData, this.oODataModel.getProperty(oViewBindingContext.getPath() + "/StartDate"),
						this.oODataModel.getProperty(oViewBindingContext.getPath() + "/EndDate")
					);

					this._handleAttachments(oAbsenceTypeData);

					this._fillAdditionalFields(
						this.oCreateModel,
						oAbsenceTypeData.AbsenceTypeCode,
						this._getAdditionalFieldsContainer()
					);

					this._fillAdditionalFieldTexts(oAdditionalFieldsDefinitions, oAdditionalFieldsValues);

					// calculate potentially used time
					this._updateCalcLeaveDays(false);
					// Done
					this.oCreateModel.setProperty("/busy", false);

					// initialization complete, remember state of local model
					this._rememberChangeRelevantLocalModelProperties();
					// and set SAVE button state accordingly
					this._revalidateSaveButtonStatus();

					//debugger;
					var sEmployeeID = this.getSelectedAbsenceTypeControl().getBindingContext().getObject().EmployeeID;
					// проверка на совместителя
					new Promise(function (resolve, reject) {
						this.oODataModel.callFunction("/checkCE", {
							urlParameters: {
								EmployeeID: sEmployeeID
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

						this.oCreateModel.setProperty("/bCe", oData.checkCE.ZzCe);
					}.bind(this));

					// проверка на судимость
					new Promise(function (resolve, reject) {
						this.oODataModel.callFunction("/checkSud", {
							urlParameters: {
								EmployeeID: sEmployeeID
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

						this.oCreateModel.setProperty("/bSud", oData.checkSud.ZzSud);
					}.bind(this));


				}.bind(this));
			}.bind(this));
		},

		_callAvailableQuotaFunctionImport: function (p) {

			return new Promise(function (R, i) {
				this.oODataModel.callFunction("/ZCalculateQuotaAvailable", {
					method: "GET",
					urlParameters: p,
					success: function (z) {
						R(z);
					},
					error: function (z) {
						i(z);
					}
				});
			}.bind(this));
		},

		_callCalcLeaveDaysFunctionImport: function (oParams) {

			return new Promise(function (fnResolve, fnReject) {
				this.oODataModel.callFunction("/ZCalculateLeaveSpan", {
					method: "GET",
					urlParameters: oParams,
					success: function (oResult) {
						debugger;
						oResult.CalculateLeaveSpan = oResult.ZCalculateLeaveSpan; // save old naming
						//  Create button hided
						this.oCreateModel.setProperty("/bUnavailable", !!oResult.ZCalculateLeaveSpan.TimeUnitText.length);
						fnResolve(oResult);
					}.bind(this),
					error: function (oError) {
						fnReject(oError);
					}
				});
			}.bind(this));
		},
		//Update the calculation of potentially used days on basis of the UI input
		_updateCalcLeaveDays: function (bIsHourTriggered) {

			var sCurrentLeaveRequestPath = this.getView().getBindingContext().getPath(),
				sEditMode = this.oCreateModel.getProperty("/sEditMode"),
				oRangeStartDate = this.oODataModel.getProperty(sCurrentLeaveRequestPath + "/StartDate"),
				oRangeEndDate = this.oODataModel.getProperty(sCurrentLeaveRequestPath + "/EndDate"),
				sAbsenceType = this.getSelectedAbsenceTypeControl().getBindingContext().getObject().AbsenceTypeCode,
				oDateFormat = DateFormat.getDateTimeInstance({
					pattern: "yyyyMMdd",
					UTC: true //MELN2652941
				});

			if (!oRangeStartDate || !formatter.isGroupEnabled(oRangeStartDate, sAbsenceType)) {
				return;
			}

			var sDateStartFormatted = null;
			var sDateEndFormatted = null;

			if (this._bCheckLeaveSpanDateIsEdmTime) {
				sDateStartFormatted = oRangeStartDate;
				sDateEndFormatted = oRangeEndDate;
			} else {
				sDateStartFormatted = oDateFormat.format(oRangeStartDate);
				sDateEndFormatted = oDateFormat.format(oRangeEndDate);
			}

			this.oCreateModel.setProperty("/usedWorkingTime", this.getResourceBundle().getText("durationCalculation"));

			var sStartTime = null,
				sEndTime = null;
			//use Start/End-Time with default value if multidays are available
			if (this.oCreateModel.getProperty("/multiOrSingleDayRadioGroupIndex") === 0) {
				sStartTime = "";
				sEndTime = "";
			} else {
				//use Start/End-Time from the available model or (if initial) go with default value
				sStartTime = this.oODataModel.getProperty(sCurrentLeaveRequestPath + "/StartTime");
				if (!sStartTime) {
					sStartTime = "";
				}
				sEndTime = this.oODataModel.getProperty(sCurrentLeaveRequestPath + "/EndTime");
				if (!sEndTime) {
					sEndTime = "";
				}
			}

			var sInputHours = this.oODataModel.getProperty(sCurrentLeaveRequestPath + "/PlannedWorkingHours");
			//Check whether hours are within one calendar day 
			if (this.oCreateModel.getProperty("/multiOrSingleDayRadioGroupIndex") === 0 || !sInputHours || sInputHours <= 0 ||
				sInputHours > 24 || !bIsHourTriggered) {
				sInputHours = "0.0";
			}

			var sStatusId = this.oODataModel.getProperty(sCurrentLeaveRequestPath + "/StatusID");
			if (!sStatusId) {
				sStatusId = "";
			}

			this._callCalcLeaveDaysFunctionImport({
				AbsenceTypeCode: sAbsenceType,
				EmployeeID: this.getSelectedAbsenceTypeControl().getBindingContext().getObject().EmployeeID,
				InfoType: this.getSelectedAbsenceTypeControl().getBindingContext().getObject().InfoType,
				StartDate: sDateStartFormatted,
				EndDate: sDateEndFormatted,
				BeginTime: sStartTime,
				EndTime: sEndTime,
				RequestID: sEditMode !== "CREATE" ? this.oODataModel.getProperty(sCurrentLeaveRequestPath + "/RequestID") : "",
				InputHours: sInputHours,
				StatusID: sStatusId,
				LeaveKey: sEditMode !== "CREATE" ? this.oODataModel.getProperty(sCurrentLeaveRequestPath + "/LeaveKey") : ""
			})
				.then(function (oSuccess) {
					if (!oSuccess) {
						this.oCreateModel.setProperty("/usedWorkingTime", null);
						this._closeBusyDialog();
						return;
					}

					//if a save request is already on its way, we do not update the odata model
					//from the function import as this might lead to undefined odata model behaviour
					if (this.oCreateModel.getProperty("/isSaveRequestPending")) {
						return;
					}
					// Updated Addtional Fields
					var aAdditionalFields = this.oCreateModel.getProperty("/AdditionalFields"),
						bUpdateAdditionalFields = false;
					aAdditionalFields.forEach(function (AdditionalField) {
						switch (AdditionalField.Fieldname) {
							case "AttAbsDays":
								AdditionalField.fieldValue = oSuccess.CalculateLeaveSpan.AttAbsDays ? oSuccess.CalculateLeaveSpan.AttAbsDays :
									AdditionalField.fieldValue;
								bUpdateAdditionalFields = true;
								break;
							case "CaleDays":
								AdditionalField.fieldValue = oSuccess.CalculateLeaveSpan.CalendarDays ? oSuccess.CalculateLeaveSpan.CalendarDays :
									AdditionalField.fieldValue;
								bUpdateAdditionalFields = true;
								break;
							case "PayrDays":
								AdditionalField.fieldValue = oSuccess.CalculateLeaveSpan.QuotaUsed ? oSuccess.CalculateLeaveSpan.QuotaUsed :
									AdditionalField.fieldValue;
								bUpdateAdditionalFields = true;
								break;
							case "PayrHrs":
								AdditionalField.fieldValue = oSuccess.CalculateLeaveSpan.PayrollHours ? oSuccess.CalculateLeaveSpan.PayrollHours :
									AdditionalField.fieldValue;
								bUpdateAdditionalFields = true;
								break;
							default:
								break;
						}
					});
					if (bUpdateAdditionalFields) {
						this._updateChangeRelevantLocalModelProperty("AdditionalFields", aAdditionalFields);
						this.oCreateModel.setProperty("/AdditionalFields", aAdditionalFields);
					}
					//duration
					//debugger;
					this.oCreateModel.setProperty("/usedWorkingTime", parseFloat(oSuccess.CalculateLeaveSpan.QuotaUsed));
					//time unit
					this.oCreateModel.setProperty("/usedWorkingTimeUnit", oSuccess.CalculateLeaveSpan.TimeUnitText);

					//Process hour based logic for start/end/hours value only in case of single day seletion
					if (this.oCreateModel.getProperty("/multiOrSingleDayRadioGroupIndex") === 1) {
						var inputHoursValue = 0;
						if (this.oCreateModel.getProperty("/showInputHours")) {
							if (this.getModel("global").getProperty("/bShowIndustryHours")) {
								inputHoursValue = this._getDecimalHoursFromInputControl();
							} else {
								inputHoursValue = this._getDecimalHoursFromTimepicker();
							}
						}
						// Manage setting of start/end time in case of input hours are entered
						if (bIsHourTriggered && inputHoursValue !== 0) {
							//Proceed only in case of visible start time picker
							if (this.byId("startTimePick").getVisible()) {
								if (oSuccess.CalculateLeaveSpan.BeginTime) {
									this.oODataModel.setProperty(sCurrentLeaveRequestPath + "/StartTime", oSuccess.CalculateLeaveSpan.BeginTime);
								} else {
									// Fallback: Set initial start time if no value came back
									this.oODataModel.setProperty(sCurrentLeaveRequestPath + "/StartTime", "");
								}
							}
							//Proceed only in case of visible end time picker
							if (this.byId("endTimePick").getVisible()) {
								if (oSuccess.CalculateLeaveSpan.EndTime) {
									this.oODataModel.setProperty(sCurrentLeaveRequestPath + "/EndTime", oSuccess.CalculateLeaveSpan.EndTime);
								} else {
									// Fallback: Set initial start time if no value came back
									this.oODataModel.setProperty(sCurrentLeaveRequestPath + "/EndTime", "");
								}
							}
						}
						//proceed only in case of visible hour field
						if (this.oCreateModel.getProperty("/showInputHours") && oSuccess.CalculateLeaveSpan.AttabsHours && oSuccess.CalculateLeaveSpan.AttabsHours !==
							"0.00" &&
							this.oODataModel.getProperty(sCurrentLeaveRequestPath + "/PlannedWorkingHours") !== oSuccess.CalculateLeaveSpan.AttabsHours) {
							this.oODataModel.setProperty(sCurrentLeaveRequestPath + "/PlannedWorkingHours", oSuccess.CalculateLeaveSpan.AttabsHours);
						}
					}

					this._closeBusyDialog();
				}.bind(this),

					function (oError) {
						jQuery.sap.log.error(
							"An error occurred while calling CalcLeaveDays function import",
							oError
						);
						this.oCreateModel.setProperty("/usedWorkingTime", null);
						this.oCreateModel.setProperty("/usedWorkingTimeUnit", null);

						this._closeBusyDialog();
					}.bind(this));
		},

		_updateAvailableQuota: function () {
			this.oCreateModel.setProperty("/BalanceAvailableQuantityText", this.getResourceBundle().getText("availabilityCalculation"));
			this._showBusyDialog();
			return this._callAvailableQuotaFunctionImport({
				AbsenceTypeCode: this.getSelectedAbsenceTypeControl().getBindingContext().getObject().AbsenceTypeCode,
				EmployeeID: this.getSelectedAbsenceTypeControl().getBindingContext().getObject().EmployeeID,
				InfoType: this.getSelectedAbsenceTypeControl().getBindingContext().getObject().InfoType
			}).then(function (A) {
				if (!A) {
					this.oCreateModel.setProperty("/BalanceAvailableQuantityText", null);
				} else {
					this.oCreateModel.setProperty("/BalanceAvailableQuantityText", parseFloat(A.ZCalculateQuotaAvailable.BalanceRestPostedRequested));
					this.oCreateModel.setProperty("/TimeUnitName", A.ZCalculateQuotaAvailable.TimeUnitText);
				}
				this._closeBusyDialog();
			}.bind(this), function (i) {
				jQuery.sap.log.error("An error occurred while calling AvailableQuota function import", i);
				this.oCreateModel.setProperty("/BalanceAvailableQuantityText", null);
				this._closeBusyDialog();
			}.bind(this));
		},

		_updateLocalModel: function (A, i, p, z) {
			//debugger;
			this.setModelProperties(this.oCreateModel, {
				"multiOrSingleDayRadioGroupIndex": this._getInitialRadioGroupIndex(i, p, z),
				"isAttachmentMandatory": i.AttachmentMandatory,
				"isQuotaCalculated": i.IsQuotaUsed,
				"BalanceAvailableQuantityText": this.getResourceBundle().getText("availabilityCalculation"),
				"AllowedDurationMultipleDayInd": i.IsAllowedDurationMultipleDay,
				"AllowedDurationPartialDayInd": i.IsAllowedDurationPartialDay,
				"AllowedDurationSingleDayInd": i.IsAllowedDurationSingleDay,
				"AdditionalFields": this._getAdditionalFields(A),
				"IsMultiLevelApproval": i.IsMultiLevelApproval,
				"iMaxApproverLevel": i.ApproverLevel,
				"isApproverEditable": !i.IsApproverReadOnly,
				"isApproverVisible": i.IsApproverVisible,
				"isAddDeleteApproverAllowed": i.AddDelApprovers,
				"isNoteVisible": i.IsNoteVisible,
				"showTimePicker": i.IsRecordInClockTimesAllowed && i.IsAllowedDurationPartialDay,
				"showInputHours": i.IsRecordInClockHoursAllowed && i.IsAllowedDurationPartialDay,
				"AbsenceDescription": i.AbsenceDescription ? i.AbsenceDescription : null,
				"AbsenceTypeName": i.AbsenceTypeName,
				"AbsenceTypeCode": i.AbsenceTypeCode
			});
			if (i.IsQuotaUsed) {
				this._updateAvailableQuota();
			}
		}

	});
});