sap.ui.define([
    "sap/ui/core/UIComponent",
    "claro/com/gestionproveedores/model/models",
    "sap/ui/model/json/JSONModel",
    "sap/base/Log"
], (UIComponent, models, JSONModel, Log) => {
    "use strict";

    return UIComponent.extend("claro.com.gestionproveedores.Component", {
        metadata: {
            manifest: "json",
            config: {
                fullWidth: true
            },
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // create view model for UI state
            const oViewModel = new JSONModel({
                busy: false,
                delay: 0,
                invitationsPendingCount: 0,
                rol: "solicitante"
            });
            this.setModel(oViewModel, "appView");

            // Wait for models to be loaded before initializing router
            this._waitForModelsToLoad().then(() => {
                // Validate and fix model data
                this._ensureModelsHaveValidData();
                // enable routing
                this.getRouter().initialize();
            }).catch((oError) => {
                Log.error("Error loading models", oError);
                // Initialize router anyway with empty data
                this._ensureModelsHaveValidData();
                this.getRouter().initialize();
            });
        },

        /**
         * Ensure all models have valid array data
         * @private
         */
        _ensureModelsHaveValidData() {
            // Check suppliers model
            const oSuppliersModel = this.getModel("suppliers");
            if (oSuppliersModel) {
                let aSuppliers = oSuppliersModel.getProperty("/");
                if (!aSuppliers || !Array.isArray(aSuppliers)) {
                    if (aSuppliers && (aSuppliers.results || aSuppliers.value)) {
                        oSuppliersModel.setProperty("/", aSuppliers.results || aSuppliers.value);
                    } else {
                        Log.warning("Suppliers model has no valid data, initializing with empty array");
                        oSuppliersModel.setProperty("/", []);
                    }
                }
            }
            
            // Check invitations model
            const oInvitationsModel = this.getModel("invitations");
            if (oInvitationsModel) {
                let aInvitations = oInvitationsModel.getProperty("/");
                if (!aInvitations || !Array.isArray(aInvitations)) {
                    if (aInvitations && (aInvitations.results || aInvitations.value)) {
                        oInvitationsModel.setProperty("/", aInvitations.results || aInvitations.value);
                    } else {
                        Log.warning("Invitations model has no valid data, initializing with empty array");
                        oInvitationsModel.setProperty("/", []);
                    }
                }
            }
            
            // Check catalogs model
            const oCatalogsModel = this.getModel("catalogs");
            if (oCatalogsModel) {
                let oCatalogs = oCatalogsModel.getProperty("/");
                if (!oCatalogs || typeof oCatalogs !== "object") {
                    Log.warning("Catalogs model has no valid data, initializing with defaults");
                    oCatalogsModel.setProperty("/", {
                        tipoProveedor: [
                            { key: "", text: "Todos" },
                            { key: "juridica", text: "Persona Jurídica" },
                            { key: "natural", text: "Persona Natural" }
                        ],
                        tipoDocumento: [
                            { key: "RUC", text: "RUC" },
                            { key: "DNI", text: "DNI" }
                        ]
                    });
                }
            }
        },

        /**
         * Wait for all JSON models to be loaded
         * @private
         * @returns {Promise} Promise that resolves when all models are loaded
         */
        _waitForModelsToLoad() {
            const aPromises = [];
            
            // Wait for suppliers model
            const oSuppliersModel = this.getModel("suppliers");
            if (oSuppliersModel && oSuppliersModel.dataLoaded) {
                aPromises.push(oSuppliersModel.dataLoaded());
            }
            
            // Wait for invitations model
            const oInvitationsModel = this.getModel("invitations");
            if (oInvitationsModel && oInvitationsModel.dataLoaded) {
                aPromises.push(oInvitationsModel.dataLoaded());
            }
            
            // Wait for catalogs model
            const oCatalogsModel = this.getModel("catalogs");
            if (oCatalogsModel && oCatalogsModel.dataLoaded) {
                aPromises.push(oCatalogsModel.dataLoaded());
            }
            
            return Promise.all(aPromises);
        },

        /**
         * Updates the count of pending invitations
         * @public
         */
        updatePendingInvitations() {
            const oInvitationsModel = this.getModel("invitations");
            
            if (!oInvitationsModel) {
                // Model not loaded yet
                return;
            }
            
            let aInvitations = oInvitationsModel.getProperty("/");
            
            // Ensure aInvitations is always an array
            if (!aInvitations) {
                aInvitations = [];
            } else if (!Array.isArray(aInvitations)) {
                // If it's an object with a results property (OData format), use that
                aInvitations = aInvitations.results || aInvitations.value || [];
            }
            
            const iPending = aInvitations.filter(inv => inv.estado === "Invitado").length;
            
            const oViewModel = this.getModel("appView");
            oViewModel.setProperty("/invitationsPendingCount", iPending);
        }
    });
});