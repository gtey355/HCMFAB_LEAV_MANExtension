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

		//------Note 2607105:Consider non-deductible leave ranges-------
		if (sNumberUnit === null || sNumberUnit === "") {
			return this.getResourceBundle().getText("noDeducPossible");
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

	return {
		formatQuotaUsageExt: formatQuotaUsageExt
	}
});