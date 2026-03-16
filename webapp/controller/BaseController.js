sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/ui/core/UIComponent",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], (Controller, History, UIComponent, MessageBox, MessageToast) => {
    "use strict";

    return Controller.extend("claro.com.gestionproveedores.controller.BaseController", {
        
        /**
         * Convenience method for accessing the router.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter() {
            return UIComponent.getRouterFor(this);
        },

        /**
         * Convenience method for getting the view model by name.
         * @public
         * @param {string} [sName] the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel(sName) {
            return this.getView().getModel(sName);
        },

        /**
         * Convenience method for setting the view model.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel(oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Getter for the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle() {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        /**
         * Event handler for navigating back.
         * It there is a history entry we go one step back in the browser history
         * If not, it will replace the current entry of the browser history with the master route.
         * @public
         */
        onNavBack() {
            const sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getRouter().navTo("main", {}, true);
            }
        },

        /**
         * Show success message
         * @public
         * @param {string} sMessage - Message text
         */
        showSuccessMessage(sMessage) {
            MessageToast.show(sMessage);
        },

        /**
         * Show error message
         * @public
         * @param {string} sMessage - Message text
         */
        showErrorMessage(sMessage) {
            MessageBox.error(sMessage);
        },

        /**
         * Show confirmation dialog
         * @public
         * @param {string} sMessage - Message text
         * @param {function} fnOnConfirm - Callback function on confirm
         */
        showConfirmDialog(sMessage, fnOnConfirm) {
            MessageBox.confirm(sMessage, {
                onClose: (oAction) => {
                    if (oAction === MessageBox.Action.OK && fnOnConfirm) {
                        fnOnConfirm();
                    }
                }
            });
        },

        /**
         * Validate email format
         * @public
         * @param {string} sEmail - Email to validate
         * @returns {boolean} true if valid email
         */
        isValidEmail(sEmail) {
            const oRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return oRegex.test(sEmail);
        },

        /**
         * Set view busy state
         * @public
         * @param {boolean} bBusy - Busy state
         */
        setViewBusy(bBusy) {
            const oViewModel = this.getModel("viewModel");
            if (oViewModel) {
                oViewModel.setProperty("/busy", bBusy);
            }
        },

        /**
         * Format date to readable format
         * @public
         * @param {string} sDate - Date string
         * @returns {string} Formatted date
         */
        formatDate(sDate) {
            if (!sDate) {
                return "";
            }
            const oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                pattern: "dd/MM/yyyy"
            });
            return oDateFormat.format(new Date(sDate));
        },

        /**
         * Validate email format
         * @public
         * @param {string} sEmail - Email string
         * @returns {boolean} True if valid
         */
        isValidEmail(sEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(sEmail);
        },

        /**
         * Ensure data is always an array.
         * Handles different response formats (direct array, OData results, value property).
         * @public
         * @param {any} vData - Data that should be an array
         * @returns {Array} The data as an array
         */
        ensureArray(vData) {
            if (!vData) {
                return [];
            }
            if (Array.isArray(vData)) {
                return vData;
            }
            // Handle OData V2 format { results: [...] }
            if (vData.results && Array.isArray(vData.results)) {
                return vData.results;
            }
            // Handle OData V4 format { value: [...] }
            if (vData.value && Array.isArray(vData.value)) {
                return vData.value;
            }
            return [];
        }
    });
});
