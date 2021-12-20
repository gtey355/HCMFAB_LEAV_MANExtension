sap.ui.define([
	"sap/ui/core/format/NumberFormat"
], function(
	NumberFormat
) {
	"use strict";

    function formatQuotaUsageExt(sNumber, sNumberUnit) {
        //debugger;

		var sRootPath = jQuery.sap.getModulePath("hcm.fab.myleaverequest.HCMFAB_LEAV_MANExtension");
		var i18nModel = new sap.ui.model.resource.ResourceModel({
			bundleUrl: [sRootPath, "i18n/i18n_custom.properties"].join("/")
		});
		var sUsedWorkingTimePluralExt = i18nModel.getResourceBundle().getText("usedWorkingTimePluralExt");
		var usedWorkingTimeSingularExt = i18nModel.getResourceBundle().getText("usedWorkingTimeSingularExt");
		var sNoDeducPossibleExt = i18nModel.getResourceBundle().getText("noDeducPossibleExt");

		//------Note 2607105:Consider non-deductible leave ranges-------
		if (sNumberUnit === null || sNumberUnit === "") {
			return sNoDeducPossibleExt;
		}
		//--------------------------------------------------------------
		if (!sNumberUnit) {
			return sNumber;
		}
		// check if sNumber actually is a number
		var fParsedNumber = parseFloat(sNumber);
		if (!isNaN(fParsedNumber)) {

			var sNumberFormatted = availableDays(sNumber);
			if (fParsedNumber === 1) {
				return this.getResourceBundle().getText(usedWorkingTimeSingularExt, [sNumberFormatted, sNumberUnit]);
			} else {
				return this.getResourceBundle().getText(sUsedWorkingTimePluralExt, [sNumberFormatted, sNumberUnit]);
			}
		}
		return sNumber;
	}

    function availableDays(sAvailableDays) {
		if (!isNaN(parseFloat(sAvailableDays))) {
			var oNumberFormat = NumberFormat.getFloatInstance({
				minFractionDigits: 0,
				maxFractionDigits: 2
			});
			return oNumberFormat.format(sAvailableDays);
		}
		return sAvailableDays;
	}

	function formatQuotaAvailabilityExt(sAvailabilityAmount, bIsQuotaRelevant, sTimeUnit, sAbsenceTypeCode) {
		//debugger;
		
		if (bIsQuotaRelevant === false) {
			return sAbsenceTypeCode && sAbsenceTypeCode === "2006" ? "" : this.getResourceBundle().getText("noQuotaRelevance");
		}
		
		var fParsedNumber = parseFloat(sAvailabilityAmount);
		if (!isNaN(fParsedNumber)) {
			
			var sAmountFormatted = availableDays(sAvailabilityAmount);
			if (fParsedNumber === 1) {
				return this.getResourceBundle().getText("availableTxt", [sAmountFormatted > 0 ? sAmountFormatted : 0, sTimeUnit]);
			} else {
				return this.getResourceBundle().getText("availableTxtPlural", [sAmountFormatted > 0 ? sAmountFormatted : 0, sTimeUnit]);
			}
		}
		return sAvailabilityAmount;
	}

	// Formatting method to set the right status of the list items          
	function getListItemStatusExt(sStatus,sZzStatus) {
		//debugger;
		switch (sStatus) {
		case "POSTED":
		case "APPROVED":
			return sZzStatus.includes("SENT") ? sap.ui.core.ValueState.Warning : sap.ui.core.ValueState.Success;
		case "SENT":
			return sap.ui.core.ValueState.Warning;
		case "REJECTED":
			return sap.ui.core.ValueState.Error;
		default: //fallback (should not happen)
			return sap.ui.core.ValueState.None;
		}
	}

	return {
		formatQuotaUsageExt: formatQuotaUsageExt,
		formatQuotaAvailabilityExt: formatQuotaAvailabilityExt,
		getListItemStatusExt: getListItemStatusExt
	}
});