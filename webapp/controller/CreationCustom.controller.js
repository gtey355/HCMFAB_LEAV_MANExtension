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
		//    onAbsenceTypeReceived: function (i) {
		//        var p;
		//        p = i.getParameter("data").results;
		//        this._absenceTypeReceivedDeferred.resolve(p);
		//    },
		//    onNumberChange: function (i) {
		//        var p = i.getSource(), z = p.getValue();
		//        if (z === "") {
		//            p.setValue("0");
		//        }
		//    },
		//    onExit: function () {
		//        this.oErrorHandler.clearErrors();
		//        this.oCreateModel.detachPropertyChange(this._revalidateSaveButtonStatus, this);
		//        this.oODataModel.detachPropertyChange(this._revalidateSaveButtonStatus, this);
		//        if (this._oDialog) {
		//            this._oDialog.destroy();
		//        }
		//        if (this._oSearchHelperDialog) {
		//            this._oSearchHelperDialog.destroy();
		//        }
		//        if (this._oOverlapCalendar) {
		//            this._oOverlapCalendar.destroy();
		//        }
		//        if (this._overlapDialog) {
		//            this._overlapDialog.destroy();
		//        }
		//        this._destroyAdditionalFields();
		//        this._cleanupUnsubmittedViewChanges();
		//    },
		onSendRequest: function () {

			//this._sendRequest();

			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			var sRootPath = jQuery.sap.getModulePath("hcm.fab.myleaverequest.HCMFAB_LEAV_MANExtension");
			var i18nModel = new sap.ui.model.resource.ResourceModel({
				bundleUrl: [sRootPath, "i18n/i18n_custom.properties"].join("/")
			});
			var sMsgText = i18nModel.getResourceBundle().getText("msgPEP");

			new Promise(function (resolve, reject) {
				sap.m.MessageBox.confirm(
					sMsgText, {
					actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
					styleClass: bCompact ? "sapUiSizeCompact" : "",
					onClose: function (sAction) {
						if (sAction === 'OK') {
							resolve(true);
						}
					}
				}
				);
			}).then(function () {

				this._sendRequest();
			}.bind(this));

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
				debugger;
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


				// vp 26082021 
				// проверяем на авансы	
				//debugger;
				this._checkAdvanceMessage()
					.then(function ({ bSomeMessage, bNoMessages, bAction, bFindRepeatAdvance }) {
						//debugger;
						if (bNoMessages || bSomeMessage) { // просто выходим
							//debugger;
							//return new Promise.resolve();
							return;
						}

						var sEmployeeID = this.getSelectedAbsenceTypeControl().getBindingContext().getObject().EmployeeID;
						var oDateRange = this.getView().byId("dateRange");
						var oStartDate = oDateRange.getDateValue();
						var oEndDate = oDateRange.getSecondDateValue();
						var sAbsType = this.getSelectedAbsenceTypeControl().getBindingContext().getObject().AbsenceTypeCode;
						if (!bFindRepeatAdvance) { // первичный
							if (!bAction) { // cancel
								// отмена -  выходим
								return Promise.resolve({ bNeedNewRequest: false });

							} else {
								//  сохраняем  заявку
								return Promise.resolve({ bNeedNewRequest: true });
							}

						} else { // повторный
							if (!bAction) {
								//  отмена - просто выходим
								return Promise.resolve({ bNeedNewRequest: false });

							} else {
								// изменяем флаг1 и сохраняем заявку 
								return new Promise(function (resolve, reject) {
									this.oODataModel.callFunction("/UpdateFlag1", {
										urlParameters: {
											EmployeeID: sEmployeeID,
											Begda: oStartDate,
											Endda: oEndDate
										},
										method: "GET",
										success: function (response) {
											//if (response.UpdateFlag1.ZzOkflag1) {
											// заново кидаем запрос после изменения флаг1
											resolve({ bNeedNewRequest: true });
											//}
										}.bind(this),
										error: function (error) {
											//utils.navTo.call(this, "overview");
											reject(error);
										}.bind(this)
									});
								}.bind(this));
							}
						}
					}.bind(this))
					.then(function ({ bNeedNewRequest }) {
						debugger;
						// удаляем старые ошибки
						this.oErrorHandler.pushError(oError);
						this.oErrorHandler.displayErrorPopup();
						this.oErrorHandler.setShowErrors("immediately");
						// перезапуск запроса если необходимо
						if (bNeedNewRequest) {
							this._sendRequest(bNeedNewRequest); //  с признаком Повторно
						} else {
							utils.navTo.call(this, "overview");
						}

					}.bind(this))
					.catch(function (oErr) {

					}.bind(this))
					.finally(function () {
						debugger;
						// show one or more error messages
						//if (!bNeedNewRequest) {

						//}
					}.bind(this));

			};

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

		_checkAdvanceMessage: function () {

			debugger;

			let oMessageManager = this.oErrorHandler._oMessageManager;
			var bFindRepeatAdvance = false;
			var bNoMessages = false;


			let aMessages = oMessageManager.getMessageModel().getData();
			if (!aMessages.length) {
				bNoMessages = true;
				return Promise.resolve({ bNoMessages });
			}
			let bSomeMessage = aMessages.length > 1 ? true : false;

			let oMessage;
			// search ZHR0043_MSG/006
			let oAbvanceMessage = aMessages.find(msg => (msg && msg.description) ? msg.description.includes('ZHR0043_MSG/006') : undefined);
			// search ZHR0043_MSG/005
			let oRepeatAbvanceMessage = aMessages.find(msg => (msg && msg.description) ? msg.description.includes('ZHR0043_MSG/005') : undefined);
			if (oAbvanceMessage) {
				oMessage = oAbvanceMessage;
			} else if (oRepeatAbvanceMessage) {
				bFindRepeatAdvance = true;
				oMessage = oRepeatAbvanceMessage;
			} else {
				return Promise.resolve({ bNoMessages: true });
			}

			// если сообщений несколько, меняем нашу ошибку на инфо и идем на след шаг
			// иначе наше сообщение будет выводится как диалог, а оригинальное - удаляем
			if (bSomeMessage) {
				oMessage.type = 'Information';
				return Promise.resolve({ bSomeMessage });
			} else {
				oMessageManager.removeAllMessages();
				this.oErrorHandler._aErrors = [];
				var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;

				return new Promise(function (resolve) {
					sap.m.MessageBox.confirm(
						oMessage.message, {
						actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
						styleClass: bCompact ? "sapUiSizeCompact" : "",
						onClose: function (sAction) {

							if (sAction === 'CANCEL') {
								resolve({ bAction: false, bFindRepeatAdvance });
							} else {
								resolve({ bAction: true, bFindRepeatAdvance });
							}
						}
					}
					);
				}.bind(this));

			}

		},



		//    onCancel: function () {
		//        this._confirmCancel();
		//    },
		//    submitLeaveRequest: function (p) {
		//        return new Promise(function (R, i) {
		//            this.oCreateModel.setProperty("/isSaveRequestPending", true);
		//            this.oODataModel.submitChanges({
		//                success: function (z, A) {
		//                    this.oCreateModel.setProperty("/isSaveRequestPending", false);
		//                    var G = A.data.__batchResponses[0], K = {};
		//                    if (G.response) {
		//                        K = G.response;
		//                    } else if (G.__changeResponses) {
		//                        K = G.__changeResponses[0];
		//                    }
		//                    if (K.statusCode.substr(0, 1) === "2") {
		//                        if (K.headers.requestid) {
		//                            p.requestID = K.headers.requestid;
		//                        }
		//                        R(p);
		//                    } else {
		//                        i();
		//                    }
		//                }.bind(this),
		//                error: function (z) {
		//                    this.oCreateModel.setProperty("/isSaveRequestPending", false);
		//                    i(z);
		//                }.bind(this)
		//            });
		//        }.bind(this));
		//    },
		//    createLeaveRequestCollection: function () {
		//        return this.oODataModel.createEntry("/LeaveRequestSet", {
		//            properties: {
		//                StartDate: null,
		//                EndDate: null,
		//                StartTime: "",
		//                EndTime: ""
		//            }
		//        });
		//    },
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



		//    onShowLeaveTypeDescriptionPressed: function (i) {
		//        if (!this._oLeaveTypeDescriptionDialog) {
		//            var V = this.getView();
		//            this._oLeaveTypeDescriptionDialog = sap.ui.xmlfragment("hcm.fab.myleaverequest.view.fragments.LeaveTypeDescriptionDialog", this);
		//            jQuery.sap.syncStyleClass(this.getOwnerComponent().getContentDensityClass(), V, this._oLeaveTypeDescriptionDialog);
		//            V.addDependent(this._oLeaveTypeDescriptionDialog);
		//        }
		//        this._oLeaveTypeDescriptionDialog.openBy(i.getSource());
		//    },
		//    onSingleMultiDayRadioSelected: function (i) {
		//        var p = this.getView().getBindingContext().getPath(), z = this.oODataModel.getProperty(p + "/StartDate"), A = this.oODataModel.getProperty(p + "/EndDate"), G = i.getSource().getSelectedIndex() === 0;
		//        if (z) {
		//            if (G && !A || !G) {
		//                this.oODataModel.setProperty(p + "/EndDate", z);
		//            }
		//            this._updateCalcLeaveDays(false);
		//        }
		//    },
		//    onDateRangeChanged: function (i) {
		//        var V = i.getParameter("valid"), p = u.dateToUTC(i.getParameter("from")), z = this.getView().getBindingContext().getPath("StartDate"), A = u.dateToUTC(i.getParameter("to")), G = this.getView().getBindingContext().getPath("EndDate");
		//        this._oDateRangeSelector = i.getSource();
		//        if (V) {
		//            this._oDateRangeSelector.setValueState(sap.ui.core.ValueState.None);
		//            this.oODataModel.setProperty(z, p);
		//            this.oODataModel.setProperty(G, A);
		//            this._updateCalcLeaveDays(false);
		//            this._showBusyDialog(i.getSource());
		//            this._revalidateSaveButtonStatus();
		//        } else {
		//            this._oDateRangeSelector.setValueState(sap.ui.core.ValueState.Error);
		//        }
		//    },
		//    onInputHoursChange: function (i) {
		//        var V;
		//        if (this.getModel("global").getProperty("/bShowIndustryHours")) {
		//            var p = parseFloat(i.getParameter("value"), 10);
		//            V = isNaN(p) ? 0 : p;
		//        } else {
		//            V = this._convertHoursMinutesFromDateToDecimal(i.getSource().getDateValue());
		//        }
		//        if (V <= 24) {
		//            var z = this.getView().getBindingContext(), A = z.getPath("StartTime"), G = z.getPath("EndTime"), K = z.getPath("PlannedWorkingHours");
		//            this.oODataModel.setProperty(A, "");
		//            this.oODataModel.setProperty(G, "");
		//            if (!this.getModel("global").getProperty("/bShowIndustryHours")) {
		//                this.oODataModel.setProperty(K, V);
		//            }
		//            this._updateCalcLeaveDays(true);
		//            this._showBusyDialog(i.getSource());
		//        }
		//        this.oCreateModel.setProperty("/inputHoursFilled", V !== 0 && V <= 24);
		//        this._revalidateSaveButtonStatus();
		//    },
		//    onDatePickChanged: function (i) {
		//        var V = i.getParameter("valid");
		//        if (V) {
		//            var p = n.getDateInstance({ UTC: true }).parse(i.getParameter("newValue"), true), z = this.getView().getBindingContext().getPath("EndDate");
		//            this.oODataModel.setProperty(z, p);
		//            this._updateCalcLeaveDays(false);
		//            this._showBusyDialog(i.getSource());
		//        }
		//        this._revalidateSaveButtonStatus();
		//    },
		//    onDateChange: function (i) {
		//        var V = i.getParameter("valid"), p = i.getSource();
		//        if (V) {
		//            p.setValueState(sap.ui.core.ValueState.None);
		//            this._updateCalcLeaveDays(false);
		//            this._showBusyDialog(i.getSource());
		//        } else {
		//            p.setValueState(sap.ui.core.ValueState.Error);
		//        }
		//    },
		//    onTimeChange: function (i) {
		//        this.oCreateModel.setProperty("/timePickerFilled", i.getParameter("newValue") ? true : false);
		//        this._updateCalcLeaveDays(false);
		//        this._showBusyDialog(i.getSource());
		//    },
		//    onApproverValueHelp: function (i) {
		//        if (!this._oDialog) {
		//            this._oDialog = sap.ui.xmlfragment("hcm.fab.myleaverequest.view.fragments.ApproverDialog", this);
		//            jQuery.sap.syncStyleClass(this.getOwnerComponent().getContentDensityClass(), this.getView(), this._oDialog);
		//            this.getView().addDependent(this._oDialog);
		//            this._oSearchApproverItemTemplate = new S({
		//                info: "{Information}",
		//                description: "{Description}",
		//                icon: {
		//                    parts: [
		//                        "global>/showEmployeePicture",
		//                        "toEmployeePicture/__metadata/media_src"
		//                    ],
		//                    formatter: f.formatImageURL
		//                },
		//                iconDensityAware: false,
		//                iconInset: false,
		//                title: {
		//                    parts: [
		//                        "global>/showEmployeeNumber",
		//                        "global>/bShowEmployeeNumberWithoutZeros",
		//                        "ApproverEmployeeName",
		//                        "ApproverEmployeeID"
		//                    ],
		//                    formatter: f.formatObjectTitle
		//                },
		//                adaptTitleSize: false,
		//                customData: [{
		//                        key: "ApproverEmployeeID",
		//                        value: "{ApproverEmployeeID}"
		//                    }]
		//            });
		//            if (this._oSearchApproverItemTemplate.setWrapping) {
		//                this._oSearchApproverItemTemplate.setWrapping(true);
		//            }
		//        }
		//        this._oDialog.data("initiator", i.getSource());
		//        this._oDialog.data("approverLevel", i.getSource().data("approverLevel"));
		//        this._oDialog.bindAggregation("items", {
		//            path: "/SearchApproverSet",
		//            filters: this._getApproverSearchFilters(),
		//            parameters: { custom: {} },
		//            template: this._oSearchApproverItemTemplate
		//        });
		//        this._oDialog.open();
		//    },
		//    onRemoveApproverClicked: function (i) {
		//        var p = this.oCreateModel.getProperty("/iCurrentApproverLevel"), z = this.getView().getBindingContext().getPath(), A = z + "/ApproverLvl" + p;
		//        this.oODataModel.setProperty(A + "/Name", "");
		//        this.oODataModel.setProperty(A + "/Pernr", "000000");
		//        this.oODataModel.setProperty(A + "/Seqnr", "000");
		//        this.oODataModel.setProperty(A + "/DefaultFlag", false);
		//        this.oCreateModel.setProperty("/iCurrentApproverLevel", p - 1);
		//    },
		//    onAddApproverClicked: function (i) {
		//        var p = this.oCreateModel.getProperty("/iCurrentApproverLevel"), z = this.oCreateModel.getProperty("/aProposedApprovers"), A = z[p];
		//        if (A) {
		//            var G = this.getView().getBindingContext().getPath(), K = G + "/ApproverLvl" + (p + 1);
		//            this.oODataModel.setProperty(K + "/Name", A.Name);
		//            this.oODataModel.setProperty(K + "/Pernr", A.Pernr);
		//            this.oODataModel.setProperty(K + "/Seqnr", A.Seqnr);
		//            this.oODataModel.setProperty(K + "/DefaultFlag", A.DefaultFlag);
		//        }
		//        this.oCreateModel.setProperty("/iCurrentApproverLevel", p + 1);
		//    },
		//    onNotesLiveChange: function (i) {
		//        var p = i.getParameter("newValue");
		//        if (p.length < 2) {
		//            return;
		//        }
		//        if (p.indexOf("::") > -1) {
		//            var z = i.getSource().getFocusDomRef().selectionStart;
		//            i.getSource().setValue(p.replace(/(:)+/g, "$1"));
		//            i.getSource().getFocusDomRef().setSelectionRange(z, z - 1);
		//        }
		//    },
		//    onAdditionalFieldLiveChange: function (i) {
		//        if (!i.getParameter("newValue")) {
		//            this.oCreateModel.setProperty(i.getSource().getBinding("value").getContext().getPath() + "/descriptionText", "");
		//        }
		//        this._checkRequiredField(i.getSource());
		//    },
		//    onFileSizeExceeded: function (i) {
		//        var p = {}, z = "", A = 0, G = 0;
		//        if (i.getSource().getMetadata().getName() === "sap.m.UploadCollection") {
		//            p = i.getParameter("files")[0];
		//            z = p.name;
		//            A = p.fileSize * 1024;
		//            G = i.getSource().getMaximumFileSize();
		//        } else {
		//            var K = i.getParameter("item");
		//            p = K.getFileObject();
		//            if (!p) {
		//                return;
		//            }
		//            z = p.name;
		//            A = p.size / 1024;
		//            G = i.getSource().getMaxFileSize();
		//            i.getSource().removeIncompleteItem(K);
		//        }
		//        h.warning(this.getResourceBundle().getText("attachmentFileSizeTooBig", [
		//            z,
		//            f.formatFileSize(A),
		//            G
		//        ]));
		//    },
		//    onFileTypeMissmatch: function (i) {
		//        var p = "", z = "", A = [];
		//        if (i.getSource().getMetadata().getName() === "sap.m.UploadCollection") {
		//            p = i.getParameter("files")[0].fileType;
		//            A = i.getSource().getFileType();
		//            z = A.join(", ");
		//        } else {
		//            var G = i.getParameter("item");
		//            A = i.getSource().getFileTypes();
		//            p = this._getFileTypeFromFileName(G.getFileName());
		//            z = A.join(", ");
		//            i.getSource().removeIncompleteItem(G);
		//        }
		//        h.warning(this.getResourceBundle().getText(A.length > 1 ? "attachmentWrongFileTypeMult" : "attachmentWrongFileType", [
		//            p,
		//            z
		//        ]));
		//    },
		//    onBeforeUploadStartsSet: function (i) {
		//        var p = i.getSource(), z = jQuery.sap.encodeURL(i.getParameter("item").getFileName());
		//        p.destroyHeaderFields();
		//        p.addHeaderField(new sap.ui.core.Item({
		//            key: "slug",
		//            text: z
		//        }));
		//        p.addHeaderField(new sap.ui.core.Item({
		//            key: "x-csrf-token",
		//            text: this.oODataModel.getSecurityToken()
		//        }));
		//        p.addHeaderField(new sap.ui.core.Item({
		//            key: "Content-Disposition",
		//            text: "attachment;filename=" + z
		//        }));
		//    },
		//    onBeforeAttachmentItemAdded: function (i) {
		//        var p = i.getParameter("item"), z = p.getFileObject(), A = false, G = i.getSource().getItems(), K = i.getSource().getIncompleteItems(), Q = function (R) {
		//                if (!A && R.getProperty("fileName") === z.name) {
		//                    h.warning(this.getResourceBundle().getText("duplicateAttachment"));
		//                    A = true;
		//                    return;
		//                }
		//            }.bind(this);
		//        this._oItemToRemove = p;
		//        G.forEach(Q);
		//        if (A) {
		//            return;
		//        }
		//        K.forEach(Q);
		//        if (A) {
		//            return;
		//        }
		//        this._oItemToRemove = null;
		//    },
		//    onAfterAttachmentItemAdded: function (i) {
		//        if (this._oItemToRemove) {
		//            this.oUploadSet.removeIncompleteItem(this._oItemToRemove);
		//            this._oItemToRemove = null;
		//        }
		//        var A = i.getSource().getItems().concat(i.getSource().getIncompleteItems());
		//        if (A.length === w) {
		//            g.show(this.getResourceBundle().getText("maxAttachment"));
		//        }
		//    },
		//    onAttachmentChange: function (i) {
		//        var p = false, A = this.oUploadCollection.getItems(), z = A[0], G = i.getParameter("files")[0];
		//        this._oNewFileData[G.name] = G;
		//        A.forEach(function (Q) {
		//            if (Q.getProperty("fileName") === G.name) {
		//                h.warning(this.getResourceBundle().getText("duplicateAttachment"), {
		//                    onClose: function () {
		//                        this.oUploadCollection.removeItem(Q);
		//                    }.bind(this)
		//                });
		//                p = true;
		//                return;
		//            }
		//        }.bind(this));
		//        if (!p) {
		//            if (A.length === w - 1) {
		//                g.show(this.getResourceBundle().getText("maxAttachment"));
		//            } else {
		//                var K = this.oUploadCollection._aFileUploadersForPendingUpload;
		//                if (K.length >= 1 && z && z._status !== "display") {
		//                    h.warning(this.getResourceBundle().getText("oneAttachmentAllowed"), {
		//                        onClose: function () {
		//                            this.oUploadCollection.removeItem(z);
		//                        }.bind(this)
		//                    });
		//                }
		//            }
		//        }
		//    },
		//    onBeforeUploadStarts: function (i) {
		//        var p = i.getParameters(), z = jQuery.sap.encodeURL(i.getParameter("fileName"));
		//        p.addHeaderParameter(new m({
		//            name: "slug",
		//            value: z
		//        }));
		//        p.addHeaderParameter(new m({
		//            name: "x-csrf-token",
		//            value: this.oODataModel.getSecurityToken()
		//        }));
		//        p.addHeaderParameter(new m({
		//            name: "Content-Disposition",
		//            value: "attachment;filename=" + z
		//        }));
		//    },
		//    onHandlePopover: function (i) {
		//        var p = i.getSource(), V = this.getView();
		//        if (!this._oMessagePopover) {
		//            this._oMessagePopover = new M({
		//                items: {
		//                    path: "message>/",
		//                    template: new e({
		//                        description: "{message>description}",
		//                        type: "{message>type}",
		//                        title: "{message>message}",
		//                        subtitle: "{message>additionalText}"
		//                    })
		//                }
		//            });
		//            jQuery.sap.syncStyleClass(this.getOwnerComponent().getContentDensityClass(), V, this._oMessagePopover);
		//            V.addDependent(this._oMessagePopover);
		//        }
		//        this._oMessagePopover.toggle(p);
		//    },
		//    handleApproverDialogSearch: function (i) {
		//        var p = i.getParameter("value");
		//        i.getSource().removeAllItems();
		//        i.getSource().bindAggregation("items", {
		//            path: "/SearchApproverSet",
		//            filters: this._getApproverSearchFilters(),
		//            parameters: { custom: p ? { search: encodeURIComponent(p) } : {} },
		//            template: this._oSearchApproverItemTemplate
		//        });
		//    },
		//    handleApproverDialogClose: function (i) {
		//        var p = i.getParameter("selectedItem");
		//        if (p) {
		//            var A = i.getSource().data("initiator"), z = i.getSource().data("approverLevel"), G = this.getView().getBindingContext().getPath() + "/ApproverLvl" + z;
		//            A.setValue(p.getTitle());
		//            this.oODataModel.setProperty(G + "/Pernr", p.data("ApproverEmployeeID"));
		//        }
		//        i.getSource().removeAllItems();
		//    },
		//    handleApproverDialogCancel: function (i) {
		//        i.getSource().removeAllItems();
		//    },
		//    handleSearchHelperDialogSearch: function (i) {
		//        var p, z, A;
		//        A = i.getSource().data("initiator");
		//        z = i.getParameter("value");
		//        var G = new F({
		//            filters: A.data("helperCollectionFilterFields").split(",").map(function (K) {
		//                return new F(K, b.Contains, z);
		//            }),
		//            and: false
		//        });
		//        p = i.getSource().getBinding("items");
		//        p.filter([G]);
		//    },
		//    handleSearchHelperDialogClose: function (i) {
		//        var p, z, A = i.getParameter("selectedItem");
		//        if (!A) {
		//            return;
		//        }
		//        z = i.getSource().data("initiator");
		//        p = A.getProperty("title") === "(space)" ? "" : A.getProperty("title");
		//        var G = z.getBindingContext("create").getPath();
		//        this.oCreateModel.setProperty(G + "/fieldValue", p);
		//        var K = A.getProperty("description");
		//        this.oCreateModel.setProperty(G + "/descriptionText", K);
		//        this._checkRequiredField(z);
		//        this._revalidateSaveButtonStatus();
		//    },
		//    onSearchHelperRequest: function (i) {
		//        var p = i.getSource();
		//        var z = p.getValue();
		//        if (!this._oSearchHelperDialog) {
		//            var A = {
		//                handleSearch: this.handleSearchHelperDialogSearch.bind(this),
		//                handleClose: this.handleSearchHelperDialogClose.bind(this)
		//            };
		//            this._oSearchHelperDialog = sap.ui.xmlfragment("hcm.fab.myleaverequest.view.fragments.SearchHelperDialog", A);
		//        }
		//        this.getSearchHelperDialogModel(p.data("helperTitleText"), p.data("helperNoDataFoundText"), p.data("helperCollection"), p.data("helperCollectionTitleField"), p.data("helperCollectionDescriptionField")).then(function (G) {
		//            this._oSearchHelperDialog.setModel(G);
		//            this._oSearchHelperDialog.data("initiator", p);
		//            this.handleSearchHelperDialogSearch(new E("initSearch", this._oSearchHelperDialog, { value: z }));
		//            this._oSearchHelperDialog.open(z);
		//        }.bind(this), function (G) {
		//            jQuery.sap.log.error("Error occurred while loading value help", G);
		//        });
		//    },
		//    onNavBack: function () {
		//        this._confirmCancel();
		//    },
		//    getSelectedAbsenceTypeControl: function () {
		//        return this.getView().byId("absenceType").getSelectedItem();
		//    },
		//    getSearchHelperDialogModel: function (i, p, z, A, G) {
		//        return new Promise(function (R, K) {
		//            var Q = this.getModel("global").getProperty("/sCountryGrouping");
		//            this.oODataModel.read("/" + z, {
		//                filters: z === "SearchWageTypeSet" && Q ? [new F("CountryGrouping", b.EQ, Q)] : [],
		//                success: function (V) {
		//                    if (!V.hasOwnProperty("results")) {
		//                        K("Cannot find 'results' member in the " + z + " collection");
		//                        return;
		//                    }
		//                    var W = {
		//                        DialogTitle: i,
		//                        NoDataText: p,
		//                        Collection: []
		//                    };
		//                    W.Collection = V.results.map(function (X) {
		//                        var Y = jQuery.extend({}, X, true);
		//                        Y.Title = X[A] === "" ? "(space)" : X[A];
		//                        Y.Description = X[G];
		//                        return Y;
		//                    });
		//                    R(new J(W));
		//                },
		//                error: function (V) {
		//                    K(V);
		//                }
		//            });
		//        }.bind(this));
		//    },
		//    setModelProperties: function (i, p, z, A) {
		//        var G = Object.keys(p);
		//        var K = G.length;
		//        G.forEach(function (Q, R) {
		//            var V = true;
		//            var W = (z || "") + "/" + Q;
		//            if (R === K - 1 && A) {
		//                V = false;
		//            }
		//            i.setProperty(W, p[Q], V);
		//        });
		//    },
		//    updateOdataModel: function (A, R) {
		//        var p = this.getView().getBindingContext().getPath();
		//        var i = {
		//            "EmployeeID": A.EmployeeID,
		//            "AbsenceTypeName": A.AbsenceTypeName
		//        };
		//        var z = R.absenceType && R.absenceType !== "default" ? R.absenceType : A.AbsenceTypeCode;
		//        i.AbsenceTypeCode = z;
		//        var G = R.dateFrom ? new Date(parseInt(R.dateFrom, 10)) : null;
		//        if (G) {
		//            i.StartDate = G;
		//        }
		//        var K = R.dateTo ? new Date(parseInt(R.dateTo, 10)) : null;
		//        if (K) {
		//            i.EndDate = K;
		//        }
		//        this.setModelProperties(this.oODataModel, i, p, false);
		//    },
		//    onOverlapOpen: function () {
		//        if (!this._overlapDialog) {
		//            this.getView().removeDependent(this._oOverlapCalendar);
		//            this._overlapDialog = new q({
		//                title: "{i18n>overlapCalendarLabel}",
		//                contentWidth: "80rem",
		//                contentHeight: "44rem",
		//                draggable: true,
		//                resizable: true,
		//                stretch: a.system.phone,
		//                content: [this._oOverlapCalendar],
		//                beginButton: [new r({
		//                        text: "{i18n>calendarOverlapCloseButtonText}",
		//                        tooltip: "{i18n>calendarOverlapCloseButtonText}",
		//                        press: function () {
		//                            this._overlapDialog.close();
		//                            this.oCreateModel.setProperty("/calendar/opened", false);
		//                        }.bind(this)
		//                    })]
		//            });
		//            this.getView().addDependent(this._overlapDialog);
		//        }
		//        this.oCreateModel.setProperty("/calendar/opened", true);
		//        this._overlapDialog.open();
		//    },
		//    onCalendarNavigate: function (i) {
		//        var p = i.getSource();
		//        var z = i.getParameter("dateRange").getStartDate();
		//        var A = i.getParameter("dateRange").getEndDate();
		//        if (z.getDate() > 20) {
		//            z.setDate(1);
		//            z.setMonth(z.getMonth() + 1);
		//        }
		//        if (A.getDate() < 10) {
		//            A.setDate(0);
		//        }
		//        C.configureCalendar(i.getSource()._oCalendar);
		//        p.setBusy(true);
		//        p.removeAllSpecialDates();
		//        this._oDataUtil.getCalendarEvents(z, A).then(function (R) {
		//            p.setBusy(false);
		//            C.fillCalendarWithLeaves(p, R.leaveRequests, z, A);
		//            C.fillCalendarFromEmployeeCalendar(p, R.workSchedule);
		//        });
		//    },
		//    _navBack: function () {
		//        this.oErrorHandler.clearErrors();
		//        this.getView().setBindingContext(null);
		//        this.initLocalModel();
		//        this._doAttachmentCleanup();
		//        if (this._oDateRangeSelector) {
		//            this._oDateRangeSelector.setValueState(sap.ui.core.ValueState.None);
		//        }
		//        var p = H.getInstance().getPreviousHash(), i = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
		//        if (p !== undefined || i && !i.isInitialNavigation()) {
		//            if (i) {
		//                i.historyBack();
		//            } else {
		//                window.history.go(-1);
		//            }
		//        } else {
		//            i.toExternal({ target: { shellHash: i.hrefForExternal({ target: { shellHash: "#" } }) } });
		//        }
		//    },
		//    _confirmCancel: function () {
		//        var i = this.getOwnerComponent();
		//        if (this._hasPendingChanges()) {
		//            h.confirm(this.getResourceBundle().getText("cancelPopover"), {
		//                styleClass: i.getContentDensityClass(),
		//                initialFocus: h.Action.CANCEL,
		//                onClose: function (A) {
		//                    if (A === h.Action.OK) {
		//                        this._cleanupUnsubmittedViewChanges();
		//                        this._navBack();
		//                    }
		//                }.bind(this)
		//            });
		//        } else {
		//            this._navBack();
		//        }
		//    },
		//    _updateChangeRelevantLocalModelProperty: function (p, i) {
		//        x.forEach(function (z) {
		//            if (z === p) {
		//                this._oLocalModelProperties[z] = JSON.stringify(i);
		//            }
		//        }.bind(this));
		//    },
		//    _rememberChangeRelevantLocalModelProperties: function () {
		//        this._oLocalModelProperties = {};
		//        x.forEach(function (z) {
		//            var p = this.oCreateModel.getProperty("/" + z);
		//            this._oLocalModelProperties[z] = JSON.stringify(p);
		//        }.bind(this));
		//        var i = this._getAttachmentItemList();
		//        this._oLocalModelProperties.AttachmentList = JSON.stringify(i);
		//    },
		//    _hasPendingChanges: function () {
		//        if (this.oODataModel.hasPendingChanges())
		//            return true;
		//        if (!this._oLocalModelProperties)
		//            return false;
		//        for (var i = 0; i < x.length; i++) {
		//            var p = x[i];
		//            var z = JSON.stringify(this.oCreateModel.getProperty("/" + p));
		//            if (this._oLocalModelProperties[p] !== z)
		//                return true;
		//        }
		//        var A = this._getAttachmentItemList();
		//        if (this._oLocalModelProperties.AttachmentList !== JSON.stringify(A))
		//            return true;
		//        return false;
		//    },
		//    _revalidateSaveButtonStatus: function () {
		//        var i = this.getView().getBindingContext().getObject();
		//        if (!i || !i.AbsenceTypeCode || !i.StartDate) {
		//            this.oCreateModel.setProperty("/saveButtonEnabled", false);
		//            return;
		//        }
		//        if (i.StatusID === "REJECTED" || this.oCreateModel.getProperty("/sEditMode") === "DELETE") {
		//            this.oCreateModel.setProperty("/saveButtonEnabled", true);
		//            return;
		//        }
		//        this.oCreateModel.setProperty("/saveButtonEnabled", this._hasPendingChanges());
		//    },
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

					//vperebatov
					// проверка на кол-во отработанных месяцев

					var sEmployeeID = this.getSelectedAbsenceTypeControl().getBindingContext().getObject().EmployeeID;
					new Promise(function (resolve, reject) {
						this.oODataModel.callFunction("/ZGetHire", {
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

						this.oCreateModel.setProperty("/bHire", oData.ZGetHire.ZzHire === 'X');
					}.bind(this));


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
		//    _onDeletePostedLeaveRouteMatched: function (i) {
		//        this.oCreateModel.setProperty("/sEditMode", "DELETE");
		//        this._onEditRouteMatchedInternal(i);
		//    },
		//    _onEditRouteMatched: function (i) {
		//        this.oCreateModel.setProperty("/sEditMode", "EDIT");
		//        this._onEditRouteMatchedInternal(i);
		//    },
		//    _onEditRouteMatchedInternal: function (i) {
		//        var R = i.getParameter("arguments"), p = "/" + R.leavePath, A = this.getOwnerComponent().getAssignmentPromise();
		//        this.oErrorHandler.setShowErrors("immediately");
		//        this.oErrorHandler.clearErrors();
		//        this._destroyAdditionalFields();
		//        this._notesBuffer = this.oODataModel.getProperty(p + "/Notes");
		//        this.oCreateModel.setProperty("/viewTitle", this.getResourceBundle().getText(this.oCreateModel.getProperty("/sEditMode") === "DELETE" ? "deleteLeaveRequest" : "editViewTitle"));
		//        this._cleanupUnsubmittedViewChanges();
		//        Promise.all([
		//            this.oODataModel.metadataLoaded(),
		//            A,
		//            this.oODataModel.getMetaModel().loaded()
		//        ]).then(function (z) {
		//            if (this.sCEEmployeeId !== z[1]) {
		//                this._absenceTypeReceivedDeferred = u.createDeferred();
		//                this.sCEEmployeeId = z[1];
		//                this._oSelectionItemTemplate = this.getView().byId("selectionTypeItem");
		//                this.getView().byId("absenceType").bindItems({
		//                    path: "/AbsenceTypeSet",
		//                    template: this._oSelectionItemTemplate,
		//                    filters: [new F("EmployeeID", b.EQ, this.sCEEmployeeId)],
		//                    parameters: { expand: "toAdditionalFieldsDefinition,toApprover" },
		//                    events: { dataReceived: this.onAbsenceTypeReceived.bind(this) }
		//                });
		//            }
		//            this._oDataUtil = D.getInstance(this.sCEEmployeeId, this.getModel());
		//            this._initOverlapCalendar();
		//            var G = this.oODataModel.getProperty(p);
		//            if (G) {
		//                this._absenceTypeReceivedDeferred.promise.then(function () {
		//                    this.getView().unbindElement();
		//                    this.getView().setBindingContext(new c(this.oODataModel, p));
		//                    var K = this.getSelectedAbsenceTypeControl();
		//                    var Q = G.Notes, V = this.formatter.formatNotes(Q);
		//                    this._oNotesModel.setProperty("/NoteCollection", V);
		//                    var W = K.getBindingContext(), X = W.getObject(), Y = W.getProperty("toAdditionalFieldsDefinition"), Z = this._getAdditionalFieldValues(Y, G.AdditionalFields), $ = {
		//                            definition: Y,
		//                            values: Z
		//                        };
		//                    var _ = Array.apply(null, { length: v }).map(function (a1, b1) {
		//                        return G["ApproverLvl" + (b1 + 1)];
		//                    }).filter(function (a1) {
		//                        return a1 && a1.Pernr !== "00000000";
		//                    });
		//                    this.oCreateModel.setProperty("/iCurrentApproverLevel", _.length);
		//                    this._updateLocalModel($, W.getObject(), G.StartDate, G.EndDate);
		//                    this._handleAttachments(W.getObject(), G);
		//                    this._fillAdditionalFields(this.oCreateModel, X.AbsenceTypeCode, this._getAdditionalFieldsContainer());
		//                    this._fillAdditionalFieldTexts(Y, Z);
		//                    this._updateCalcLeaveDays(false);
		//                    this.oCreateModel.setProperty("/busy", false);
		//                    this._rememberChangeRelevantLocalModelProperties();
		//                    this._revalidateSaveButtonStatus();
		//                }.bind(this));
		//            } else {
		//                u.navTo.call(this, "overview", true);
		//            }
		//        }.bind(this));
		//    },
		//    _destroyAdditionalFields: function () {
		//        Object.keys(this._oAdditionalFieldsControls).forEach(function (i) {
		//            var p = this._oAdditionalFieldsControls[i];
		//            p.forEach(function (z, A) {
		//                z.destroy();
		//                if (A > 0) {
		//                    delete this._oAdditionalFieldsControls[i];
		//                }
		//            }.bind(this));
		//        }.bind(this));
		//    },
		//    _getAdditionalFieldsContainer: function () {
		//        return this.getView().byId("additionalFieldsSimpleForm");
		//    },
		//    _getAdditionalFieldFragmentName: function (A, i) {
		//        var p = "";
		//        switch (A.Type_Kind) {
		//        case "C":
		//            p = "AdditionalFieldInput";
		//            var z = this.oODataModel.getProperty(i + "/AdditionalFields/" + A.Name);
		//            if (typeof z === "boolean" || this._isAdditionalFieldBoolean(A.Name)) {
		//                p = "AdditionalFieldCheckbox";
		//            } else if (A.HasF4) {
		//                p = "AdditionalFieldSearchHelperInput";
		//            }
		//            break;
		//        case "P":
		//            p = null;
		//            break;
		//        case "N":
		//            p = "AdditionalFieldInputInteger";
		//            break;
		//        case "D":
		//            p = "AdditionalFieldDatePicker";
		//            break;
		//        case "T":
		//            p = "AdditionalFieldTimePicker";
		//            break;
		//        default:
		//            p = "AdditionalFieldInput";
		//        }
		//        return p;
		//    },
		//    _callCalcLeaveDaysFunctionImport: function (p) {
		//        return new Promise(function (R, i) {
		//            this.oODataModel.callFunction("/CalculateLeaveSpan", {
		//                method: "GET",
		//                urlParameters: p,
		//                success: function (z) {
		//                    R(z);
		//                },
		//                error: function (z) {
		//                    i(z);
		//                }
		//            });
		//        }.bind(this));
		//    },
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
		//    _cleanupUnsubmittedViewChanges: function () {
		//        var i = this.getView().getBindingContext();
		//        if (!i) {
		//            return;
		//        }
		//        if (this.oCreateModel.getProperty("/sEditMode") !== "CREATE") {
		//            if (this.oODataModel.hasPendingChanges()) {
		//                this.oODataModel.resetChanges([i.getPath()]);
		//            }
		//        } else if (i) {
		//            this.oODataModel.deleteCreatedEntry(i);
		//        }
		//    },
		//    _updateCalcLeaveDays: function (i) {
		//        var p = this.getView().getBindingContext().getPath(), z = this.oCreateModel.getProperty("/sEditMode"), R = this.oODataModel.getProperty(p + "/StartDate"), A = this.oODataModel.getProperty(p + "/EndDate"), G = this.getSelectedAbsenceTypeControl().getBindingContext().getObject().AbsenceTypeCode, K = n.getDateTimeInstance({
		//                pattern: "yyyyMMdd",
		//                UTC: true
		//            });
		//        if (!R || !f.isGroupEnabled(R, G)) {
		//            return;
		//        }
		//        var Q = null;
		//        var V = null;
		//        if (this._bCheckLeaveSpanDateIsEdmTime) {
		//            Q = R;
		//            V = A;
		//        } else {
		//            Q = K.format(R);
		//            V = K.format(A);
		//        }
		//        this.oCreateModel.setProperty("/usedWorkingTime", this.getResourceBundle().getText("durationCalculation"));
		//        var W = null, X = null;
		//        if (this.oCreateModel.getProperty("/multiOrSingleDayRadioGroupIndex") === 0) {
		//            W = "";
		//            X = "";
		//        } else {
		//            W = this.oODataModel.getProperty(p + "/StartTime");
		//            if (!W) {
		//                W = "";
		//            }
		//            X = this.oODataModel.getProperty(p + "/EndTime");
		//            if (!X) {
		//                X = "";
		//            }
		//        }
		//        var Y = this.oODataModel.getProperty(p + "/PlannedWorkingHours");
		//        if (this.oCreateModel.getProperty("/multiOrSingleDayRadioGroupIndex") === 0 || !Y || Y <= 0 || Y > 24 || !i) {
		//            Y = "0.0";
		//        }
		//        var Z = this.oODataModel.getProperty(p + "/StatusID");
		//        if (!Z) {
		//            Z = "";
		//        }
		//        this._callCalcLeaveDaysFunctionImport({
		//            AbsenceTypeCode: G,
		//            EmployeeID: this.getSelectedAbsenceTypeControl().getBindingContext().getObject().EmployeeID,
		//            InfoType: this.getSelectedAbsenceTypeControl().getBindingContext().getObject().InfoType,
		//            StartDate: Q,
		//            EndDate: V,
		//            BeginTime: W,
		//            EndTime: X,
		//            RequestID: z !== "CREATE" ? this.oODataModel.getProperty(p + "/RequestID") : "",
		//            InputHours: Y,
		//            StatusID: Z,
		//            LeaveKey: z !== "CREATE" ? this.oODataModel.getProperty(p + "/LeaveKey") : ""
		//        }).then(function ($) {
		//            if (!$) {
		//                this.oCreateModel.setProperty("/usedWorkingTime", null);
		//                this._closeBusyDialog();
		//                return;
		//            }
		//            if (this.oCreateModel.getProperty("/isSaveRequestPending")) {
		//                return;
		//            }
		//            var _ = this.oCreateModel.getProperty("/AdditionalFields"), a1 = false;
		//            _.forEach(function (c1) {
		//                switch (c1.Fieldname) {
		//                case "AttAbsDays":
		//                    c1.fieldValue = $.CalculateLeaveSpan.AttAbsDays ? $.CalculateLeaveSpan.AttAbsDays : c1.fieldValue;
		//                    a1 = true;
		//                    break;
		//                case "CaleDays":
		//                    c1.fieldValue = $.CalculateLeaveSpan.CalendarDays ? $.CalculateLeaveSpan.CalendarDays : c1.fieldValue;
		//                    a1 = true;
		//                    break;
		//                case "PayrDays":
		//                    c1.fieldValue = $.CalculateLeaveSpan.QuotaUsed ? $.CalculateLeaveSpan.QuotaUsed : c1.fieldValue;
		//                    a1 = true;
		//                    break;
		//                case "PayrHrs":
		//                    c1.fieldValue = $.CalculateLeaveSpan.PayrollHours ? $.CalculateLeaveSpan.PayrollHours : c1.fieldValue;
		//                    a1 = true;
		//                    break;
		//                default:
		//                    break;
		//                }
		//            });
		//            if (a1) {
		//                this._updateChangeRelevantLocalModelProperty("AdditionalFields", _);
		//                this.oCreateModel.setProperty("/AdditionalFields", _);
		//            }
		//            this.oCreateModel.setProperty("/usedWorkingTime", parseFloat($.CalculateLeaveSpan.QuotaUsed));
		//            this.oCreateModel.setProperty("/usedWorkingTimeUnit", $.CalculateLeaveSpan.TimeUnitText);
		//            if (this.oCreateModel.getProperty("/multiOrSingleDayRadioGroupIndex") === 1) {
		//                var b1 = 0;
		//                if (this.oCreateModel.getProperty("/showInputHours")) {
		//                    if (this.getModel("global").getProperty("/bShowIndustryHours")) {
		//                        b1 = this._getDecimalHoursFromInputControl();
		//                    } else {
		//                        b1 = this._getDecimalHoursFromTimepicker();
		//                    }
		//                }
		//                if (i && b1 !== 0) {
		//                    if (this.byId("startTimePick").getVisible()) {
		//                        if ($.CalculateLeaveSpan.BeginTime) {
		//                            this.oODataModel.setProperty(p + "/StartTime", $.CalculateLeaveSpan.BeginTime);
		//                        } else {
		//                            this.oODataModel.setProperty(p + "/StartTime", "");
		//                        }
		//                    }
		//                    if (this.byId("endTimePick").getVisible()) {
		//                        if ($.CalculateLeaveSpan.EndTime) {
		//                            this.oODataModel.setProperty(p + "/EndTime", $.CalculateLeaveSpan.EndTime);
		//                        } else {
		//                            this.oODataModel.setProperty(p + "/EndTime", "");
		//                        }
		//                    }
		//                }
		//                if (this.oCreateModel.getProperty("/showInputHours") && $.CalculateLeaveSpan.AttabsHours && $.CalculateLeaveSpan.AttabsHours !== "0.00" && this.oODataModel.getProperty(p + "/PlannedWorkingHours") !== $.CalculateLeaveSpan.AttabsHours) {
		//                    this.oODataModel.setProperty(p + "/PlannedWorkingHours", $.CalculateLeaveSpan.AttabsHours);
		//                }
		//            }
		//            this._closeBusyDialog();
		//        }.bind(this), function ($) {
		//            jQuery.sap.log.error("An error occurred while calling CalcLeaveDays function import", $);
		//            this.oCreateModel.setProperty("/usedWorkingTime", null);
		//            this.oCreateModel.setProperty("/usedWorkingTimeUnit", null);
		//            this._closeBusyDialog();
		//        }.bind(this));
		//    },
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
		//    _getAttachmentsUploadUrl: function (p) {
		//        return [
		//            this.oODataModel.sServiceUrl,
		//            p,
		//            "/toAttachments"
		//        ].join("");
		//    },
		//    _updateUploadUrlsUploadCollection: function (i, p) {
		//        var z = "", A = {};
		//        i.forEach(function (G) {
		//            z = G.getFileUploader();
		//            if (z) {
		//                A = sap.ui.getCore().byId(z);
		//                A.setUploadUrl(p);
		//            }
		//        }.bind(this));
		//        if (this.oUploadCollection.hasOwnProperty("_oFileUploader")) {
		//            this.oUploadCollection._oFileUploader.setUploadUrl(p);
		//        }
		//    },
		//    _getAttachmentsFromModel: function (i) {
		//        return Array.apply(null, { length: w }).map(function (p, z) {
		//            return i["Attachment" + (z + 1)];
		//        }).filter(function (A) {
		//            return A.FileName !== "";
		//        });
		//    },
		//    _getAttachmentItemList: function () {
		//        var i = [];
		//        if (this.oUploadCollection) {
		//            i = this.oUploadCollection.getItems().map(function (A) {
		//                return {
		//                    id: A.getId(),
		//                    fileName: A.getFileName(),
		//                    mimeType: A.getMimeType(),
		//                    uploadedDate: A.getUploadedDate(),
		//                    url: A.getUrl()
		//                };
		//            });
		//        } else if (this.oUploadSet) {
		//            i = this.oUploadSet.getItems().concat(this.oUploadSet.getIncompleteItems());
		//            i = i.map(function (A) {
		//                return {
		//                    id: A.getId(),
		//                    fileName: A.getFileName(),
		//                    url: A.getUrl()
		//                };
		//            });
		//        }
		//        return i;
		//    },
		//    _handleAttachments: function (A, i) {
		//        if (A.AttachmentEnabled) {
		//            var p = [];
		//            if (i) {
		//                p = this._getAttachmentsFromModel(i);
		//            }
		//            this.oCreateModel.setProperty("/attachments", p);
		//            this.oCreateModel.setProperty("/isAttachmentUploadEnabled", p.length < w);
		//            if (sap.ui.getCore().getLoadedLibraries()["sap.m"].controls.indexOf("sap.m.upload.UploadSet") !== -1) {
		//                this._handleAttachmentsUploadSet(A);
		//            } else {
		//                this._handleAttachmentsUploadCollection(A);
		//            }
		//        } else {
		//            this._doAttachmentCleanup();
		//        }
		//    },
		//    _handleAttachmentsUploadSet: function (A) {
		//        if (this.oUploadSet) {
		//            this.oUploadSet.setMaxFileSize(this._getMaxFileSizeFromAbsenceTypeInMB(A));
		//            this.oUploadSet.setFileTypes(this._getSupportedFileTypeFromAbsenceType(A));
		//        } else {
		//            this._oAttachmentsContainer.addItem(this._createNewUploadSetInstance(A));
		//        }
		//    },
		//    _handleAttachmentsUploadCollection: function (A) {
		//        if (this.oUploadCollection) {
		//            if (this._isNewUploadCollectionInstanceNeeded(this.oUploadCollection, A)) {
		//                if (this._informEnduserAboutLostAttachments()) {
		//                    h.warning(this.getResourceBundle().getText("attachmentsLost"), {
		//                        onClose: function () {
		//                            this._doAttachmentCleanup();
		//                            this._oAttachmentsContainer.addItem(this._createNewUploadCollectionInstance(A));
		//                        }.bind(this)
		//                    });
		//                }
		//            }
		//        } else {
		//            this._oAttachmentsContainer.addItem(this._createNewUploadCollectionInstance(A));
		//        }
		//    },
		//    _createNewUploadSetInstance: function (A) {
		//        var i = new sap.m.upload.UploadSet("AttachmentCollection", {
		//            visible: true,
		//            fileTypes: this._getSupportedFileTypeFromAbsenceType(A),
		//            maxFileSize: this._getMaxFileSizeFromAbsenceTypeInMB(A),
		//            instantUpload: false,
		//            showIcons: true,
		//            terminationEnabled: false,
		//            uploadEnabled: {
		//                formatter: f.isAttachmentUploadEnabled,
		//                parts: [
		//                    "StartDate",
		//                    "AbsenceTypeCode",
		//                    "create>/isAttachmentUploadEnabled"
		//                ]
		//            },
		//            items: {
		//                path: "create>/attachments",
		//                templateShareable: false,
		//                template: new sap.m.upload.UploadSetItem({
		//                    enabledEdit: true,
		//                    enabledRemove: true,
		//                    fileName: "{create>FileName}",
		//                    url: {
		//                        parts: [
		//                            "EmployeeID",
		//                            "RequestID",
		//                            "create>ArchivDocId",
		//                            "create>FileName"
		//                        ],
		//                        formatter: f.formatAttachmentUrl
		//                    },
		//                    visibleEdit: false,
		//                    visibleRemove: true,
		//                    attributes: [
		//                        new k({
		//                            title: "{i18n>attachmentUploadOnTxt}",
		//                            text: {
		//                                parts: [
		//                                    "create>CreaDate",
		//                                    "create>CreaTime"
		//                                ],
		//                                formatter: f.formatAttachmentTimeStamp
		//                            }
		//                        }),
		//                        new k({
		//                            title: "{i18n>attachmentFileSizeTxt}",
		//                            text: {
		//                                path: "create>FileSize",
		//                                formatter: f.formatFileSize
		//                            }
		//                        })
		//                    ]
		//                })
		//            },
		//            toolbar: new O("attachmentToolbar", {
		//                design: sap.m.ToolbarDesign.Transparent,
		//                content: [
		//                    new T({ text: "{i18n>attachmentSecTxt}" }),
		//                    new j()
		//                ]
		//            }),
		//            beforeItemAdded: this.onBeforeAttachmentItemAdded.bind(this),
		//            afterItemAdded: this.onAfterAttachmentItemAdded.bind(this),
		//            fileSizeExceeded: this.onFileSizeExceeded.bind(this),
		//            fileTypeMismatch: this.onFileTypeMissmatch.bind(this),
		//            beforeUploadStarts: this.onBeforeUploadStartsSet.bind(this)
		//        });
		//        i.addEventDelegate({
		//            onAfterRendering: function (p) {
		//                this._revalidateUploadButtonStatus();
		//                this._revalidateSaveButtonStatus();
		//            }.bind(this)
		//        });
		//        this.oUploadSet = i;
		//        return i;
		//    },
		//    _getSupportedFileTypeFromAbsenceType: function (A) {
		//        return A.AttachRestrictFileType ? A.AttachSupportFileType.toLowerCase().split(",") : [];
		//    },
		//    _getMaxFileSizeFromAbsenceTypeInMB: function (A) {
		//        return A.AttachMaxSize / 1024;
		//    },
		//    _getFileTypeFromFileName: function (i) {
		//        return i.substring(i.lastIndexOf(".") + 1, i.length) || i;
		//    },
		//    _createNewUploadCollectionInstance: function (A) {
		//        var i = new U("AttachmentCollection", {
		//            visible: true,
		//            fileType: this._getSupportedFileTypeFromAbsenceType(A),
		//            maximumFileSize: this._getMaxFileSizeFromAbsenceTypeInMB(A),
		//            multiple: false,
		//            sameFilenameAllowed: false,
		//            showSeparators: sap.m.ListSeparators.All,
		//            uploadEnabled: true,
		//            instantUpload: false,
		//            mode: sap.m.ListMode.None,
		//            uploadButtonInvisible: {
		//                formatter: f.isAttachmentUploadDisabled,
		//                parts: [
		//                    "StartDate",
		//                    "AbsenceTypeCode",
		//                    "create>/isAttachmentUploadEnabled"
		//                ]
		//            },
		//            terminationEnabled: false,
		//            items: {
		//                path: "create>/attachments",
		//                templateShareable: false,
		//                template: new l({
		//                    fileName: "{create>FileName}",
		//                    url: {
		//                        parts: [
		//                            "EmployeeID",
		//                            "RequestID",
		//                            "create>ArchivDocId",
		//                            "create>FileName"
		//                        ],
		//                        formatter: f.formatAttachmentUrl
		//                    },
		//                    visibleDelete: true,
		//                    visibleEdit: false,
		//                    attributes: [
		//                        new k({
		//                            title: "{i18n>attachmentUploadOnTxt}",
		//                            text: {
		//                                parts: [
		//                                    "create>CreaDate",
		//                                    "create>CreaTime"
		//                                ],
		//                                formatter: f.formatAttachmentTimeStamp
		//                            }
		//                        }),
		//                        new k({
		//                            title: "{i18n>attachmentFileSizeTxt}",
		//                            text: {
		//                                path: "create>FileSize",
		//                                formatter: f.formatFileSize
		//                            }
		//                        })
		//                    ]
		//                })
		//            },
		//            infoToolbar: new O("attachmentToolbar", {
		//                visible: "{= !( ${create>/uploadPercentage} === 0 || ${create>/uploadPercentage} >= 100 ) }",
		//                design: sap.m.ToolbarDesign.Transparent,
		//                content: [
		//                    new L({ text: "{i18n>txtUploading}" }),
		//                    new j(),
		//                    new P({
		//                        percentValue: "{create>/uploadPercentage}",
		//                        showValue: false,
		//                        state: "None"
		//                    }).addStyleClass("sapUiSmallMarginBottom")
		//                ]
		//            }),
		//            change: this.onAttachmentChange.bind(this),
		//            fileSizeExceed: this.onFileSizeExceeded.bind(this),
		//            typeMissmatch: this.onFileTypeMissmatch.bind(this),
		//            beforeUploadStarts: this.onBeforeUploadStarts.bind(this)
		//        });
		//        i.addEventDelegate({
		//            onAfterRendering: function () {
		//                this._revalidateUploadButtonStatus();
		//                this._revalidateSaveButtonStatus();
		//            }.bind(this)
		//        });
		//        this.oUploadCollection = i;
		//        return i;
		//    },
		//    _isNewUploadCollectionInstanceNeeded: function (i, A) {
		//        var p = this._getSupportedFileTypeFromAbsenceType(A), z = this._getMaxFileSizeFromAbsenceTypeInMB(A);
		//        return !(i && (i.getFileType()[0] !== p[0] || i.getMaximumFileSize() !== z));
		//    },
		//    _informEnduserAboutLostAttachments: function () {
		//        var i = this.oUploadCollection.getItems(), p = [];
		//        if (i && i.length > 0) {
		//            p = i.filter(function (z) {
		//                return z._status !== "display";
		//            });
		//            return p.length > 0;
		//        }
		//        return false;
		//    },
		//    _revalidateUploadButtonStatus: function () {
		//        var i = [];
		//        if (this.oCreateModel.getProperty("/sEditMode") !== "CREATE") {
		//            i = this._getAttachmentsFromModel(this.getView().getBindingContext().getObject());
		//        }
		//        if (this.oUploadCollection) {
		//            var p = this.oUploadCollection.getItems().filter(function (z) {
		//                return !i.some(function (A) {
		//                    return A.FileName == z.getProperty("fileName");
		//                });
		//            });
		//            i = i.concat(p);
		//        } else if (this.oUploadSet) {
		//            i = i.concat(this.oUploadSet.getIncompleteItems());
		//        }
		//        this.oCreateModel.setProperty("/isAttachmentUploadEnabled", i.length < w);
		//    },
		//    _handleApprovers: function (p, z) {
		//        var A = "", G = {}, K = [];
		//        for (var i = 0; i < v; i++) {
		//            A = p + "/ApproverLvl" + (i + 1);
		//            if (i < z.length) {
		//                G = this.oODataModel.getObject("/" + z[i]);
		//                K.push(G);
		//                this.oODataModel.setProperty(A + "/Name", G.Name);
		//                this.oODataModel.setProperty(A + "/Pernr", G.Pernr);
		//                this.oODataModel.setProperty(A + "/Seqnr", G.Seqnr);
		//                this.oODataModel.setProperty(A + "/DefaultFlag", G.DefaultFlag);
		//            } else if (this.oODataModel.getProperty(A)) {
		//                this.oODataModel.setProperty(A, {
		//                    Name: "",
		//                    Pernr: "00000000",
		//                    Seqnr: "000",
		//                    DefaultFlag: false
		//                });
		//            }
		//        }
		//        this.oCreateModel.setProperty("/iCurrentApproverLevel", z.length);
		//        this.oCreateModel.setProperty("/aProposedApprovers", K);
		//    },
		//    _getAdditionalFieldDefaultValue: function (A) {
		//        var i = "";
		//        switch (A.Type_Kind) {
		//        case "T":
		//            i = null;
		//            break;
		//        case "D":
		//            i = null;
		//            break;
		//        case "C":
		//            i = this._isAdditionalFieldBoolean(A.Name) ? false : "";
		//            break;
		//        default:
		//            i = "";
		//        }
		//        return i;
		//    },
		//    _fillAdditionalFieldTexts: function (A, p) {
		//        A.forEach(function (z) {
		//            var G, K;
		//            K = this.oODataModel.getObject("/" + z);
		//            if (K.HasF4 && K.F4EntityName && p.hasOwnProperty(K.Fieldname) && (p[K.Fieldname] || K.F4EntityName === "SearchOTCompensationTypeSet")) {
		//                G = p[K.Fieldname];
		//                var Q = {}, R = this.oODataModel.getMetaModel().getODataEntitySet(K.F4EntityName), V = this.oODataModel.getMetaModel().getODataEntityType(R.entityType).key.propertyRef, W = this.getModel("global").getProperty("/sCountryGrouping");
		//                if (K.F4EntityName === "SearchWageTypeSet" && W || K.F4EntityName !== "SearchWageTypeSet") {
		//                    V.forEach(function (i) {
		//                        Q[i.name] = "";
		//                        if (i.name === K.F4KeyProperty) {
		//                            Q[i.name] = G;
		//                        }
		//                        if (i.name === "CountryGrouping" && W) {
		//                            Q[i.name] = W;
		//                        }
		//                    }.bind(this));
		//                    var X = this.oODataModel.createKey("/" + K.F4EntityName, Q), Y = this.oCreateModel.getProperty("/AdditionalFields");
		//                    this.oODataModel.read(X, {
		//                        success: function (Z) {
		//                            Y.some(function ($, i) {
		//                                if ($.Fieldname == K.Fieldname) {
		//                                    this.oCreateModel.setProperty("/AdditionalFields/" + i + "/descriptionText", Z[K.F4DescriptionProperty]);
		//                                    return true;
		//                                }
		//                                return false;
		//                            }.bind(this));
		//                        }.bind(this),
		//                        error: function (i) {
		//                        }
		//                    });
		//                }
		//            }
		//        }.bind(this));
		//    },
		//    _getAdditionalFieldValues: function (A, V) {
		//        var i = {};
		//        A.forEach(function (p) {
		//            var z, G;
		//            G = this.oODataModel.getObject("/" + p);
		//            if (V.hasOwnProperty(G.Fieldname)) {
		//                z = V[G.Fieldname];
		//            } else {
		//                z = this._getAdditionalFieldDefaultValue(G);
		//            }
		//            i[G.Fieldname] = z;
		//        }.bind(this));
		//        return i;
		//    },
		//    _getCurrentAdditionalFieldValues: function () {
		//        var i = {};
		//        this.oCreateModel.getProperty("/AdditionalFields").forEach(function (p) {
		//            i[p.Fieldname] = p.fieldValue;
		//        });
		//        return i;
		//    },
		//    _fillAdditionalFields: function (i, A, p) {
		//        p.removeAllContent();
		//        var z = this.getView().getBindingContext().getPath();
		//        i.getProperty("/AdditionalFields").forEach(function (G, K) {
		//            var Q = this._getAdditionalFieldFragmentName(G, z);
		//            if (!this._oAdditionalFieldsControls[G.Fieldname]) {
		//                if (Q) {
		//                    this._oAdditionalFieldsControls[G.Fieldname] = sap.ui.xmlfragment(this.getView().getId() + G.Fieldname, "hcm.fab.myleaverequest.view.fragments." + Q, this);
		//                } else {
		//                    this._addAdditionalFieldDecimal(this.getView(), p, i, K, this.onNumberChange, G, this._oAdditionalFieldsControls);
		//                }
		//            }
		//            this._oAdditionalFieldsControls[G.Fieldname].forEach(function (R) {
		//                R.setBindingContext(i.createBindingContext("/AdditionalFields/" + K), "create");
		//                if (G.Required) {
		//                    R.setFieldGroupIds("LeaveRequiredField");
		//                }
		//                this.getView().addDependent(R);
		//                p.addContent(R);
		//            }.bind(this));
		//        }.bind(this));
		//    },
		//    _addAdditionalFieldDecimal: function (V, i, p, z, A, G, K) {
		//        var Q = V.getId() + G.Fieldname + "addFieldInputDecimal";
		//        var R = new L(Q + "Label", {
		//            required: "{create>Required}",
		//            text: "{create>FieldLabel}"
		//        });
		//        R.setBindingContext(p.createBindingContext("/AdditionalFields/" + z), "create");
		//        V.addDependent(R);
		//        i.addContent(R);
		//        var W = new I(Q, {
		//            type: "Text",
		//            change: A,
		//            textAlign: "Right",
		//            editable: this.oCreateModel.getProperty("/sEditMode") !== "DELETE",
		//            enabled: "{ formatter: 'hcm.fab.myleaverequest.utils.formatters.isGroupEnabled', parts: [ { path: 'StartDate' }, { path: 'AbsenceTypeCode' } ]}"
		//        });
		//        W.setBindingContext(p.createBindingContext("/AdditionalFields/" + z), "create");
		//        W.bindValue({
		//            path: "create>fieldValue",
		//            type: new d({
		//                parseAsString: true,
		//                decimals: parseInt(G.Decimals, 10),
		//                maxIntegerDigits: parseInt(G.Length, 10) - parseInt(G.Decimals, 10),
		//                minFractionDigits: 0,
		//                maxFractionDigits: parseInt(G.Decimals, 10)
		//            }, {
		//                precision: parseInt(G.Length, 10),
		//                scale: parseInt(G.Decimals, 10)
		//            })
		//        });
		//        V.addDependent(W);
		//        i.addContent(W);
		//        if (!K[G.Fieldname]) {
		//            K[G.Fieldname] = [];
		//            K[G.Fieldname].push(R);
		//            K[G.Fieldname].push(W);
		//        }
		//    },
		//    _copyAdditionalFieldsIntoModel: function (A, i, p) {
		//        A.forEach(function (z) {
		//            var G = z.Fieldname;
		//            var K = z.fieldValue;
		//            switch (z.Type_Kind) {
		//            case "C":
		//                if (!this._bCheckboxFieldsAreBoolean && typeof K === "boolean") {
		//                    K = K ? "X" : "";
		//                }
		//                break;
		//            case "N":
		//                K = K + "";
		//                break;
		//            case "P":
		//                if (typeof K === "string" && K === "") {
		//                    K = null;
		//                }
		//                break;
		//            default:
		//            }
		//            i.setProperty(p + "/AdditionalFields/" + G, K);
		//        }.bind(this));
		//    },
		//    _requiredAdditionalFieldsAreFilled: function () {
		//        var i = true, p = false, R = this.byId("additionalFieldsSimpleForm").getControlsByFieldGroupId("LeaveRequiredField");
		//        R.forEach(function (z) {
		//            p = this._checkRequiredField(z);
		//            if (!p) {
		//                i = false;
		//            }
		//        }.bind(this));
		//        return i;
		//    },
		//    _checkRequiredField: function (i) {
		//        if (i.getRequired && i.getRequired() && i.getValue) {
		//            var p = sap.ui.getCore().getMessageManager();
		//            if (i.getValue()) {
		//                var z = i.getId() + "-message", A = p.getMessageModel().getData(), G = A.filter(function (R) {
		//                        return R.getId() === z;
		//                    });
		//                if (G.length > 0) {
		//                    if (A.length === 1) {
		//                        this.oCreateModel.setProperty("/saveButtonEnabled", true);
		//                    }
		//                    p.removeMessages(G[0]);
		//                }
		//                return true;
		//            } else {
		//                var K = this.getResourceBundle().getText("additionalFieldRequired", i.getParent().getLabel().getText()), Q = i.getBinding("value");
		//                this.oCreateModel.setProperty("/saveButtonEnabled", false);
		//                p.addMessages(new sap.ui.core.message.Message({
		//                    id: i.getId() + "-message",
		//                    message: K,
		//                    type: sap.ui.core.MessageType.Error,
		//                    target: (Q.getContext() ? Q.getContext().getPath() + "/" : "") + Q.getPath(),
		//                    processor: Q.getModel()
		//                }));
		//                return false;
		//            }
		//        }
		//        return true;
		//    },
		//    _checkFormFieldsForError: function () {
		//        var i = [
		//                "additionalFieldsSimpleForm",
		//                "generalDataForm",
		//                "leaveTypeSelectionForm"
		//            ], p = [];
		//        return i.some(function (z) {
		//            p = this.byId(z).getContent();
		//            if (p && p.length > 0) {
		//                return p.some(function (A) {
		//                    return A.getValueState && A.getValueState() === sap.ui.core.ValueState.Error;
		//                });
		//            }
		//            return false;
		//        }.bind(this));
		//    },
		//    _getAdditionalFieldMetaInfo: function (i) {
		//        var p = this.oODataModel.getServiceMetadata().dataServices.schema[0].namespace, z = this.oODataModel.getMetaModel().getODataComplexType(p + ".AdditionalFields").property, A = z.filter(function (G) {
		//                return G.name === i;
		//            });
		//        return A.length > 0 ? A[0] : {};
		//    },
		//    _getLeaveSpanDateFieldMetaInfo: function (i) {
		//        var p = this.oODataModel.getMetaModel().getODataFunctionImport("CalculateLeaveSpan").parameter, z = p.filter(function (A) {
		//                return A.name === i;
		//            });
		//        return z.length > 0 ? z[0] : {};
		//    },
		//    _isAdditionalFieldBoolean: function (i) {
		//        return this._getAdditionalFieldMetaInfo(i).type === "Edm.Boolean";
		//    },
		//    _checkForSearchApproverPropertyExistence: function () {
		//        var i = this.oODataModel.getServiceMetadata().dataServices.schema[0].namespace, p = this.oODataModel.getMetaModel().getODataEntityType(i + ".SearchApprover");
		//        if (p) {
		//            return p.property.some(function (z) {
		//                return z.name === "EmployeeID";
		//            });
		//        }
		//        return false;
		//    },
		//    _getApproverSearchFilters: function () {
		//        return this._bApproverOnBehalfPropertyExists ? [new F("EmployeeID", b.EQ, this.getModel("global").getProperty("/sEmployeeNumber"))] : [];
		//    },
		//    _getAdditionalFields: function (A) {
		//        var i = {}, p = {};
		//        return A.definition.map(function (z) {
		//            p = this.oODataModel.getObject("/" + z);
		//            p.fieldValue = A.values[p.Fieldname];
		//            p.descriptionText = "";
		//            if (p.HasF4 && !p.hasOwnProperty("F4KeyProperty")) {
		//                i = y[p.Fieldname];
		//                if (i) {
		//                    p.F4KeyProperty = i.keyField;
		//                    p.F4TitleProperty = i.titleField;
		//                    p.F4DescriptionProperty = i.descriptionField;
		//                    p.F4SearchFilter = i.searchFields;
		//                }
		//            }
		//            return p;
		//        }.bind(this));
		//    },
		//    _getInitialRadioGroupIndex: function (A, i, p) {
		//        var z = 0;
		//        if (!f.isMoreThanOneDayAllowed(A.IsAllowedDurationMultipleDay) || f.isOneDayOrLessAllowed(A.IsAllowedDurationPartialDay, A.IsAllowedDurationSingleDay) && i && p && i.getTime() === p.getTime()) {
		//            z = 1;
		//        }
		//        return z;
		//    },
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
				"AbsenceTypeName": i.AbsenceTypeName
			});
			if (i.IsQuotaUsed) {
				this._updateAvailableQuota();
			}
		},
		//    _updateLeaveRequestWithModifiedAttachments: function (i, p) {
		//        var z = i.getProperty(p);
		//        var A = Array.apply(null, { length: w }).map(function (Q, R) {
		//            return z["Attachment" + (R + 1)];
		//        }).filter(function (Q) {
		//            return Q && Q.FileName !== "";
		//        });
		//        var G = [], K = false;
		//        if (this.oUploadCollection) {
		//            G = this.oUploadCollection.getItems();
		//        } else if (this.oUploadSet) {
		//            G = this.oUploadSet.getItems();
		//        }
		//        A.forEach(function (Q, R) {
		//            K = G.some(function (V) {
		//                return V.getProperty("fileName") === Q.FileName;
		//            });
		//            if (!K) {
		//                this.oODataModel.setProperty(p + "/Attachment" + (R + 1) + "/AttachmentStatus", "D");
		//            }
		//        }.bind(this));
		//        if (this.oUploadSet) {
		//            G = this.oUploadSet.getIncompleteItems();
		//        }
		//        G.forEach(function (Q, R) {
		//            var V;
		//            if (Q.getFileObject) {
		//                V = Q.getFileObject();
		//            } else {
		//                V = this._oNewFileData[Q.getFileName()];
		//            }
		//            if (V) {
		//                var W = p + "/Attachment" + (A.length + 1), X = Math.ceil(V.size / 1024);
		//                this.oODataModel.setProperty(W + "/FileName", Q.getFileName());
		//                this.oODataModel.setProperty(W + "/FileType", V.type);
		//                this.oODataModel.setProperty(W + "/FileSize", X.toString());
		//            }
		//        }.bind(this));
		//    },
		//    _showSuccessStatusMessage: function (p) {
		//        u.navTo.call(this, "overview");
		//        this.oCreateModel.setProperty("/busy", false);
		//        this.getOwnerComponent().getEventBus().publish("hcm.fab.myleaverequest", "invalidateoverview", {
		//            fnAfterNavigate: function () {
		//                if (p.showSuccess) {
		//                    jQuery.sap.delayedCall(400, this, function () {
		//                        g.show(this.getResourceBundle().getText("createdSuccessfully"));
		//                    });
		//                }
		//            }.bind(this)
		//        });
		//        this.initLocalModel();
		//        this.getView().setBindingContext(null);
		//        this._doAttachmentCleanup();
		//        return Promise.resolve(p);
		//    },
		//    _doAttachmentCleanup: function (i) {
		//        this._oAttachmentsContainer.destroyItems();
		//        this.oUploadCollection = null;
		//        this.oUploadSet = null;
		//        this._oNewFileData = {};
		//    },
		//    _uploadAttachments: function (p) {
		//        return new Promise(function (R, i) {
		//            if (this.oUploadCollection) {
		//                this._uploadAttachmentsUploadCollection(R, i, p);
		//            } else if (this.oUploadSet) {
		//                this._uploadAttachmentsUploadSet(R, i, p);
		//            } else {
		//                R(p);
		//            }
		//        }.bind(this));
		//    },
		//    _uploadAttachmentsUploadSet: function (R, i, p) {
		//        var z = this.oUploadSet.getIncompleteItems(), A = null, G = 0, K = z.length;
		//        if (z.length === 0) {
		//            R(p);
		//            return;
		//        }
		//        var Q = jQuery.extend({}, this.getView().getBindingContext().getObject());
		//        if (p.requestID && p.requestID !== Q.RequestID) {
		//            Q.RequestID = p.requestID;
		//        }
		//        var V = this._getAttachmentsUploadUrl(this.oODataModel.createKey("/LeaveRequestSet", Q));
		//        this.oUploadSet.setUploadUrl(V);
		//        z.forEach(function (X) {
		//            X.setUrl(V);
		//        });
		//        var W = function (X) {
		//            var Y = X.getParameter("item");
		//            G++;
		//            var Z = G / K * 100;
		//            p.aUploadedFiles.push({ FileName: Y.getFileObject().fileName });
		//            if (Z >= 100) {
		//                this.oUploadSet.detachUploadCompleted(W);
		//                R(p);
		//            } else {
		//                A = z.shift();
		//                this.oUploadSet.uploadItem(A);
		//            }
		//        }.bind(this);
		//        this.oUploadSet.attachUploadCompleted(W);
		//        A = z.shift();
		//        this.oUploadSet.uploadItem(A);
		//    },
		//    _uploadAttachmentsUploadCollection: function (R, i, p) {
		//        var z = this.oUploadCollection.getItems(), A = 0, G = 0;
		//        z.forEach(function (X) {
		//            if (X._status !== "display") {
		//                G++;
		//            }
		//        });
		//        if (G === 0) {
		//            R(p);
		//            return;
		//        }
		//        var K = jQuery.extend({}, this.getView().getBindingContext().getObject());
		//        if (p.requestID) {
		//            K.RequestID = p.requestID;
		//        }
		//        var Q = this.oODataModel.createKey("/LeaveRequestSet", K), V = this._getAttachmentsUploadUrl(Q);
		//        this._updateUploadUrlsUploadCollection(z, V);
		//        this.oCreateModel.setProperty("/uploadPercentage", 5);
		//        var W = function (X) {
		//            X.getParameter("files").forEach(function (Y) {
		//                if (parseInt(Y.status, 10) >= 400) {
		//                    var Z = jQuery.parseXML(Y.responseRaw), $ = u.convertXML2JSON(Z.documentElement);
		//                    h.warning(this.getResourceBundle().getText("txtUploadError", [Y.fileName]), {
		//                        title: this.getResourceBundle().getText("txtUploadErrorTitle"),
		//                        details: $.message,
		//                        onClose: function () {
		//                            p.showSuccess = false;
		//                            R(p);
		//                        }
		//                    });
		//                } else {
		//                    A++;
		//                    var _ = A / G * 100;
		//                    this.oCreateModel.setProperty("/uploadPercentage", _);
		//                    p.aUploadedFiles.push({ FileName: Y.fileName });
		//                    if (_ >= 100) {
		//                        R(p);
		//                    }
		//                }
		//            }.bind(this));
		//            this.oUploadCollection.detachUploadComplete(W);
		//        }.bind(this);
		//        this.oUploadCollection.attachUploadComplete(W, this);
		//        this.oUploadCollection.upload();
		//    },
		//    _initOverlapCalendar: function () {
		//        if (!this._oOverlapCalendar) {
		//            this.oCreateModel.setProperty("/calendar/overlapNumber", 0);
		//            this._oOverlapCalendar = new o({
		//                id: "overlapTeamCalendar",
		//                applicationId: "MYLEAVEREQUESTS",
		//                instanceId: "OVERLAP",
		//                assignmentId: "{global>/sEmployeeNumber}",
		//                requesterId: "{global>/sEmployeeNumber}",
		//                startDate: "{StartDate}",
		//                leaveRequestMode: true,
		//                leaveRequestSimulateRequest: true,
		//                leaveRequestStartDate: "{StartDate}",
		//                leaveRequestEndDate: "{EndDate}",
		//                leaveRequestDescription: "{create>/calendarOverlapLeaveRequestText}",
		//                showConcurrentEmploymentButton: false,
		//                visible: "{create>/calendar/opened}",
		//                dataChanged: function (i) {
		//                    this.oCreateModel.setProperty("/calendar/overlapNumber", i.getParameter("employeeConflictList").length);
		//                }.bind(this)
		//            });
		//            this.getView().addDependent(this._oOverlapCalendar);
		//            if (this._oOverlapCalendar.getMetadata().hasProperty("dataChangedDate")) {
		//                this._oOverlapCalendar.bindProperty("dataChangedDate", {
		//                    path: "/lastLeaveRequestChangeDate",
		//                    model: "global",
		//                    mode: "OneWay"
		//                });
		//            }
		//        }
		//        this.oCreateModel.setProperty("/calendarOverlapLeaveRequestText", this.getResourceBundle().getText(this.oCreateModel.getProperty("/sEditMode") === "EDIT" ? "calendarOverlapLeaveRequestEditText" : "calendarOverlapLeaveRequestText"));
		//    },
		//    _showBusyDialog: function (i) {
		//        var p = this.getModel("global").getProperty("/bShowBusyIndicatorForFunctionImports");
		//        if (p) {
		//            this.byId("busyDialog").open();
		//            if (i) {
		//                this._oControlToFocus = i;
		//            }
		//        }
		//    },
		//    _closeBusyDialog: function () {
		//        var i = this.getModel("global").getProperty("/bShowBusyIndicatorForFunctionImports");
		//        if (i) {
		//            this.byId("busyDialog").close();
		//            if (this._oControlToFocus) {
		//                this._oControlToFocus.focus();
		//                this._oControlToFocus = null;
		//            }
		//        }
		//    },
		//    _convertHoursMinutesFromDateToDecimal: function (i) {
		//        var p = i;
		//        if (!p) {
		//            p = new Date(0, 0);
		//        }
		//        return parseFloat(p.getHours() + 1 / 60 * p.getMinutes(), 10);
		//    },
		//    _getDecimalHoursFromTimepicker: function () {
		//        return this._convertHoursMinutesFromDateToDecimal(this.byId("traditionalHoursPicker").getDateValue());
		//    },
		//    _getDecimalHoursFromInputControl: function () {
		//        var i = this.byId("hoursValue");
		//        return parseFloat(i.getValue());
		//    }
	});
});