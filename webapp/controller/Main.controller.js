sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library"
], (BaseController, JSONModel, Spreadsheet, exportLibrary) => {
    "use strict";

    const EdmType = exportLibrary.EdmType;
    const PAGE_SIZE = 20;

    return BaseController.extend("claro.com.gestionproveedores.controller.Main", {

        onInit() {
            const oViewModel = new JSONModel({
                // Persona Natural - Filtros
                naturalFilters: {
                    apellidos: "",
                    tipoDocumento: [],
                    codigoSAP: "",
                    nroDoc: ""
                },
                naturalAllData: [],
                naturalData: [],
                naturalCurrentPage: 1,
                naturalTotalPages: 1,
                naturalTotalRecords: 0,
                naturalPageSize: PAGE_SIZE,

                // Persona Jurídica - Filtros
                juridicaFilters: {
                    razonSocial: "",
                    nacionalidad: [],
                    tipoDocumento: [],
                    tipoEmpresa: [],
                    claseEmpresa: [],
                    nroDoc: "",
                    codigoSAP: ""
                },
                juridicaAllData: [],
                juridicaData: [],
                juridicaCurrentPage: 1,
                juridicaTotalPages: 1,
                juridicaTotalRecords: 0,
                juridicaPageSize: PAGE_SIZE,

                activeTab: "naturalTab",

                // KPIs del dashboard
                totalProveedores: 0,
                totalNaturales: 0,
                totalJuridicas: 0,
                totalBloqueados: 0
            });

            this.setModel(oViewModel, "viewModel");
            this._initializeData();
            this.getRouter().getRoute("main").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched() {
            this._initializeData();
        },

        _initializeData() {
            const oSuppliersModel = this.getModel("suppliers");
            let aSuppliers = oSuppliersModel ? oSuppliersModel.getProperty("/") : [];
            if (!aSuppliers) aSuppliers = [];
            else if (!Array.isArray(aSuppliers)) aSuppliers = aSuppliers.results || aSuppliers.value || [];
            this._separateSupplierData(aSuppliers);
        },

        _separateSupplierData(aSuppliers) {
            const aNatural = [];
            const aJuridica = [];

            aSuppliers.forEach(oSupplier => {
                if (oSupplier.tipoEmpresa === "natural") {
                    aNatural.push({
                        id: oSupplier.id,
                        nombres: oSupplier.beneficiario || "",
                        apellidoPaterno: oSupplier.apellidoPaterno || "",
                        apellidoMaterno: oSupplier.apellidoMaterno || "",
                        nroDoc: oSupplier.nroDoc || "",
                        tipoDocumento: oSupplier.tipoDoc || "",
                        codigoSAP: oSupplier.codigoSAP || "",
                        email: oSupplier.email || "",
                        telefono: oSupplier.telefono || "",
                        estadoContribuyente: oSupplier.estadoContribuyente || "Activo"
                    });
                } else {
                    aJuridica.push({
                        id: oSupplier.id,
                        razonSocial: oSupplier.razonSocial || "",
                        alias: oSupplier.alias || "",
                        nroDoc: oSupplier.nroDoc || "",
                        tipoDocumento: oSupplier.tipoDoc || "",
                        codigoSAP: oSupplier.codigoSAP || "",
                        bloqueado: oSupplier.bloqueado === true,
                        estadoContribuyente: oSupplier.estadoContribuyente || "Pre-Registrado"
                    });
                }
            });

            // Computar KPIs globales
            const nBloqueados = aSuppliers.filter(s => s.estadoContribuyente === "Bloqueado").length;

            const oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/totalProveedores", aSuppliers.length);
            oViewModel.setProperty("/totalNaturales", aNatural.length);
            oViewModel.setProperty("/totalJuridicas", aJuridica.length);
            oViewModel.setProperty("/totalBloqueados", nBloqueados);

            oViewModel.setProperty("/naturalAllData", aNatural);
            oViewModel.setProperty("/naturalCurrentPage", 1);
            this._applyPagination("natural", aNatural);

            oViewModel.setProperty("/juridicaAllData", aJuridica);
            oViewModel.setProperty("/juridicaCurrentPage", 1);
            this._applyPagination("juridica", aJuridica);
        },

        /**
         * Applies pagination slice to viewModel data property
         * @param {string} sPrefix "natural" or "juridica"
         * @param {array} aAllData Full dataset to paginate
         */
        _applyPagination(sPrefix, aAllData) {
            const oViewModel = this.getModel("viewModel");
            const iCurrentPage = oViewModel.getProperty("/" + sPrefix + "CurrentPage");
            const iTotalRecords = aAllData.length;
            const iTotalPages = Math.max(1, Math.ceil(iTotalRecords / PAGE_SIZE));
            const iPage = Math.min(Math.max(1, iCurrentPage), iTotalPages);
            const iStart = (iPage - 1) * PAGE_SIZE;
            const aPageData = aAllData.slice(iStart, iStart + PAGE_SIZE);

            oViewModel.setProperty("/" + sPrefix + "CurrentPage", iPage);
            oViewModel.setProperty("/" + sPrefix + "TotalPages", iTotalPages);
            oViewModel.setProperty("/" + sPrefix + "TotalRecords", iTotalRecords);
            oViewModel.setProperty("/" + sPrefix + "Data", aPageData);
        },

        onReportTabSelect(oEvent) {
            const sSelectedTab = oEvent.getParameter("selectedKey");
            this.getModel("viewModel").setProperty("/activeTab", sSelectedTab);
        },

        // ═══════════════════════════════════════════════════════════════════
        // PERSONA NATURAL - PAGINACIÓN
        // ═══════════════════════════════════════════════════════════════════

        onNaturalFirstPage() {
            const oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/naturalCurrentPage", 1);
            this._applyPagination("natural", oViewModel.getProperty("/naturalAllData"));
        },

        onNaturalPrevPage() {
            const oViewModel = this.getModel("viewModel");
            const iPage = oViewModel.getProperty("/naturalCurrentPage");
            if (iPage > 1) {
                oViewModel.setProperty("/naturalCurrentPage", iPage - 1);
                this._applyPagination("natural", oViewModel.getProperty("/naturalAllData"));
            }
        },

        onNaturalNextPage() {
            const oViewModel = this.getModel("viewModel");
            const iPage = oViewModel.getProperty("/naturalCurrentPage");
            const iTotalPages = oViewModel.getProperty("/naturalTotalPages");
            if (iPage < iTotalPages) {
                oViewModel.setProperty("/naturalCurrentPage", iPage + 1);
                this._applyPagination("natural", oViewModel.getProperty("/naturalAllData"));
            }
        },

        onNaturalLastPage() {
            const oViewModel = this.getModel("viewModel");
            const iTotalPages = oViewModel.getProperty("/naturalTotalPages");
            oViewModel.setProperty("/naturalCurrentPage", iTotalPages);
            this._applyPagination("natural", oViewModel.getProperty("/naturalAllData"));
        },

        // ═══════════════════════════════════════════════════════════════════
        // PERSONA NATURAL - FILTROS
        // ═══════════════════════════════════════════════════════════════════

        onClearNaturalFilters() {
            const oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/naturalFilters", {
                apellidos: "",
                tipoDocumento: [],
                codigoSAP: "",
                nroDoc: ""
            });
            this._initializeData();
        },

        onFilterNatural() {
            const oViewModel = this.getModel("viewModel");
            const oFilters = oViewModel.getProperty("/naturalFilters");
            const oSuppliersModel = this.getModel("suppliers");

            let aSuppliers = oSuppliersModel ? oSuppliersModel.getProperty("/") : [];
            if (!aSuppliers) aSuppliers = [];
            else if (!Array.isArray(aSuppliers)) aSuppliers = aSuppliers.results || [];

            let aNatural = aSuppliers.filter(s => s.tipoEmpresa === "natural");

            if (oFilters.apellidos) {
                const sSearch = oFilters.apellidos.toLowerCase();
                aNatural = aNatural.filter(s =>
                    (s.apellidoPaterno && s.apellidoPaterno.toLowerCase().includes(sSearch)) ||
                    (s.apellidoMaterno && s.apellidoMaterno.toLowerCase().includes(sSearch))
                );
            }
            if (oFilters.tipoDocumento && oFilters.tipoDocumento.length > 0) {
                aNatural = aNatural.filter(s => oFilters.tipoDocumento.includes(s.tipoDoc));
            }
            if (oFilters.codigoSAP) {
                aNatural = aNatural.filter(s => s.codigoSAP && s.codigoSAP.includes(oFilters.codigoSAP));
            }
            if (oFilters.nroDoc) {
                aNatural = aNatural.filter(s => s.nroDoc && s.nroDoc.includes(oFilters.nroDoc));
            }

            const aTransformed = aNatural.map(s => ({
                id: s.id,
                nombres: s.beneficiario || "",
                apellidoPaterno: s.apellidoPaterno || "",
                apellidoMaterno: s.apellidoMaterno || "",
                nroDoc: s.nroDoc || "",
                tipoDocumento: s.tipoDoc || "",
                codigoSAP: s.codigoSAP || "",
                email: s.email || "",
                telefono: s.telefono || "",
                estadoContribuyente: s.estadoContribuyente || "Activo"
            }));

            oViewModel.setProperty("/naturalAllData", aTransformed);
            oViewModel.setProperty("/naturalCurrentPage", 1);
            this._applyPagination("natural", aTransformed);
            this.showSuccessMessage(this.getResourceBundle().getText("filterSuccess"));
        },

        onEditNatural(oEvent) {
            const oContext = oEvent.getSource().getBindingContext("viewModel");
            const sId = oContext.getProperty("id");
            this.getRouter().navTo("supplierDetail", { supplierId: sId, mode: "edit" });
        },

        onNewNatural() {
            this.getRouter().navTo("supplierCreate", { tipoPersona: "natural" });
        },

        onDeleteNatural(oEvent) {
            const oContext = oEvent.getSource().getBindingContext("viewModel");
            const sId = oContext.getProperty("id");
            const sNombres = oContext.getProperty("nombres");
            this.showConfirmDialog(
                this.getResourceBundle().getText("confirmDelete") + " - " + sNombres,
                () => { this._deleteSupplier(sId); }
            );
        },

        onExportNatural() {
            const oViewModel = this.getModel("viewModel");
            const aNatural = oViewModel.getProperty("/naturalAllData");
            if (!aNatural || aNatural.length === 0) {
                this.showErrorMessage(this.getResourceBundle().getText("noData"));
                return;
            }
            const oResourceBundle = this.getResourceBundle();
            const aCols = [
                { label: oResourceBundle.getText("nombres"), property: "nombres", type: EdmType.String },
                { label: oResourceBundle.getText("apellidoPaterno"), property: "apellidoPaterno", type: EdmType.String },
                { label: oResourceBundle.getText("apellidoMaterno"), property: "apellidoMaterno", type: EdmType.String },
                { label: oResourceBundle.getText("nroDoc"), property: "nroDoc", type: EdmType.String },
                { label: oResourceBundle.getText("tipoDocumento"), property: "tipoDocumento", type: EdmType.String },
                { label: oResourceBundle.getText("codigoSAP"), property: "codigoSAP", type: EdmType.String },
                { label: "Estado", property: "estadoContribuyente", type: EdmType.String }
            ];
            new Spreadsheet({ workbook: { columns: aCols }, dataSource: aNatural, fileName: "Personas_Naturales.xlsx" })
                .build()
                .then(() => this.showSuccessMessage(oResourceBundle.getText("exportSuccess")))
                .catch(() => this.showErrorMessage(oResourceBundle.getText("errorExport")));
        },

        // ═══════════════════════════════════════════════════════════════════
        // PERSONA JURÍDICA - PAGINACIÓN
        // ═══════════════════════════════════════════════════════════════════

        onJuridicaFirstPage() {
            const oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/juridicaCurrentPage", 1);
            this._applyPagination("juridica", oViewModel.getProperty("/juridicaAllData"));
        },

        onJuridicaPrevPage() {
            const oViewModel = this.getModel("viewModel");
            const iPage = oViewModel.getProperty("/juridicaCurrentPage");
            if (iPage > 1) {
                oViewModel.setProperty("/juridicaCurrentPage", iPage - 1);
                this._applyPagination("juridica", oViewModel.getProperty("/juridicaAllData"));
            }
        },

        onJuridicaNextPage() {
            const oViewModel = this.getModel("viewModel");
            const iPage = oViewModel.getProperty("/juridicaCurrentPage");
            const iTotalPages = oViewModel.getProperty("/juridicaTotalPages");
            if (iPage < iTotalPages) {
                oViewModel.setProperty("/juridicaCurrentPage", iPage + 1);
                this._applyPagination("juridica", oViewModel.getProperty("/juridicaAllData"));
            }
        },

        onJuridicaLastPage() {
            const oViewModel = this.getModel("viewModel");
            const iTotalPages = oViewModel.getProperty("/juridicaTotalPages");
            oViewModel.setProperty("/juridicaCurrentPage", iTotalPages);
            this._applyPagination("juridica", oViewModel.getProperty("/juridicaAllData"));
        },

        // ═══════════════════════════════════════════════════════════════════
        // PERSONA JURÍDICA - FILTROS
        // ═══════════════════════════════════════════════════════════════════

        onClearJuridicaFilters() {
            const oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/juridicaFilters", {
                razonSocial: "",
                nacionalidad: [],
                tipoDocumento: [],
                tipoEmpresa: [],
                claseEmpresa: [],
                nroDoc: "",
                codigoSAP: ""
            });
            this._initializeData();
        },

        onFilterJuridica() {
            const oViewModel = this.getModel("viewModel");
            const oFilters = oViewModel.getProperty("/juridicaFilters");
            const oSuppliersModel = this.getModel("suppliers");

            let aSuppliers = oSuppliersModel ? oSuppliersModel.getProperty("/") : [];
            if (!aSuppliers) aSuppliers = [];
            else if (!Array.isArray(aSuppliers)) aSuppliers = aSuppliers.results || [];

            let aJuridica = aSuppliers.filter(s => s.tipoEmpresa !== "natural");

            if (oFilters.razonSocial) {
                const sSearch = oFilters.razonSocial.toLowerCase();
                aJuridica = aJuridica.filter(s => s.razonSocial && s.razonSocial.toLowerCase().includes(sSearch));
            }
            if (oFilters.nacionalidad && oFilters.nacionalidad.length > 0) {
                aJuridica = aJuridica.filter(s => oFilters.nacionalidad.includes(s.nacionalidad));
            }
            if (oFilters.tipoDocumento && oFilters.tipoDocumento.length > 0) {
                aJuridica = aJuridica.filter(s => oFilters.tipoDocumento.includes(s.tipoDoc));
            }
            if (oFilters.tipoEmpresa && oFilters.tipoEmpresa.length > 0) {
                aJuridica = aJuridica.filter(s => oFilters.tipoEmpresa.includes(s.tipoEmpresa));
            }
            if (oFilters.claseEmpresa && oFilters.claseEmpresa.length > 0) {
                aJuridica = aJuridica.filter(s => oFilters.claseEmpresa.includes(s.claseEmpresa));
            }
            if (oFilters.nroDoc) {
                aJuridica = aJuridica.filter(s => s.nroDoc && s.nroDoc.includes(oFilters.nroDoc));
            }
            if (oFilters.codigoSAP) {
                aJuridica = aJuridica.filter(s => s.codigoSAP && s.codigoSAP.includes(oFilters.codigoSAP));
            }

            const aTransformed = aJuridica.map(s => ({
                id: s.id,
                razonSocial: s.razonSocial || "",
                alias: s.alias || "",
                nroDoc: s.nroDoc || "",
                tipoDocumento: s.tipoDoc || "",
                codigoSAP: s.codigoSAP || "",
                bloqueado: s.bloqueado === true,
                estadoContribuyente: s.estadoContribuyente || "Activo"
            }));

            oViewModel.setProperty("/juridicaAllData", aTransformed);
            oViewModel.setProperty("/juridicaCurrentPage", 1);
            this._applyPagination("juridica", aTransformed);
            this.showSuccessMessage(this.getResourceBundle().getText("filterSuccess"));
        },

        onEditJuridica(oEvent) {
            const oContext = oEvent.getSource().getBindingContext("viewModel");
            const sId = oContext.getProperty("id");
            this.getRouter().navTo("supplierDetail", { supplierId: sId, mode: "edit" });
        },

        onNewJuridica() {
            this.getRouter().navTo("supplierCreate", { tipoPersona: "juridica" });
        },

        onDeleteJuridica(oEvent) {
            const oContext = oEvent.getSource().getBindingContext("viewModel");
            const sId = oContext.getProperty("id");
            const sRazonSocial = oContext.getProperty("razonSocial");
            this.showConfirmDialog(
                this.getResourceBundle().getText("confirmDelete") + " - " + sRazonSocial,
                () => { this._deleteSupplier(sId); }
            );
        },

        onExportJuridica() {
            const oViewModel = this.getModel("viewModel");
            const aJuridica = oViewModel.getProperty("/juridicaAllData");
            if (!aJuridica || aJuridica.length === 0) {
                this.showErrorMessage(this.getResourceBundle().getText("noData"));
                return;
            }
            const oResourceBundle = this.getResourceBundle();
            const aCols = [
                { label: oResourceBundle.getText("razonSocial"), property: "razonSocial", type: EdmType.String },
                { label: oResourceBundle.getText("alias"), property: "alias", type: EdmType.String },
                { label: oResourceBundle.getText("nroDoc"), property: "nroDoc", type: EdmType.String },
                { label: oResourceBundle.getText("tipoDocumento"), property: "tipoDocumento", type: EdmType.String },
                { label: oResourceBundle.getText("codigoSAP"), property: "codigoSAP", type: EdmType.String },
                { label: "Estado", property: "estadoContribuyente", type: EdmType.String }
            ];
            new Spreadsheet({ workbook: { columns: aCols }, dataSource: aJuridica, fileName: "Personas_Juridicas.xlsx" })
                .build()
                .then(() => this.showSuccessMessage(oResourceBundle.getText("exportSuccess")))
                .catch(() => this.showErrorMessage(oResourceBundle.getText("errorExport")));
        },

        // ═══════════════════════════════════════════════════════════════════
        // MÉTODOS COMUNES
        // ═══════════════════════════════════════════════════════════════════

        _deleteSupplier(sSupplierId) {
            const oSuppliersModel = this.getModel("suppliers");
            let aSuppliers = oSuppliersModel.getProperty("/");
            if (!Array.isArray(aSuppliers)) aSuppliers = [];
            aSuppliers = aSuppliers.filter(s => s.id !== sSupplierId);
            oSuppliersModel.setProperty("/", aSuppliers);
            this._initializeData();
            this.showSuccessMessage(this.getResourceBundle().getText("deleteSuccess"));
        },

        onRolChange(oEvent) {
            const sRol = oEvent.getSource().getSelectedKey();
            this.getOwnerComponent().getModel("appView").setProperty("/rol", sRol);
        }
    });
});
