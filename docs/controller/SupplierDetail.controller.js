sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/Token",
    "sap/ui/core/Item"
], (BaseController, JSONModel, Token, SuggestionItem) => {
    "use strict";

    return BaseController.extend("claro.com.gestionproveedores.controller.SupplierDetail", {

        onInit() {
            // Initialize view model
            const oViewModel = new JSONModel({
                busy: false,
                mode: "display", // display, edit, create
                pageTitle: "",
                supplierType: "juridica", // natural | juridica
                supplier: {},
                esAprobador: false,
                fieldStates: {
                    razonSocial: "None",
                    alias: "None",
                    beneficiario: "None",
                    apellidoPaterno: "None",
                    apellidoMaterno: "None"
                }
            });
            this.setModel(oViewModel, "viewModel");

            // Un único handler en el router con guard por nombre de ruta
            this.getRouter().attachRouteMatched(this._onAnyRouteMatched, this);
        },

        _syncRol() {
            const sRol = this.getOwnerComponent().getModel("appView").getProperty("/rol");
            this.getModel("viewModel").setProperty("/esAprobador", sRol === "aprobador");
        },

        _onAnyRouteMatched(oEvent) {
            const sRouteName = oEvent.getParameter("name");
            const oArgs     = oEvent.getParameter("arguments");

            if (sRouteName === "supplierDetail") {
                this._syncRol();
                this._loadSupplier(oArgs.supplierId, oArgs.mode || "display");
            } else if (sRouteName === "supplierCreate") {
                this._syncRol();
                this._initNewSupplier(oArgs.tipoPersona || "juridica");
            }
            // cualquier otra ruta (main, etc.) se ignora
        },

        _loadSupplier(sSupplierId, sMode) {
            const oSuppliersModel = this.getModel("suppliers");
            let aSuppliers = oSuppliersModel.getProperty("/");
            
            // Ensure aSuppliers is always an array
            if (!aSuppliers) {
                aSuppliers = [];
            } else if (!Array.isArray(aSuppliers)) {
                aSuppliers = aSuppliers.results || aSuppliers.value || [];
            }
            
            const oSupplier = aSuppliers.find(s => s.id === sSupplierId);

            if (!oSupplier) {
                this.showErrorMessage("Proveedor no encontrado");
                this.getRouter().navTo("main");
                return;
            }

            // Clone supplier data to avoid direct modification
            const oSupplierCopy = JSON.parse(JSON.stringify(oSupplier));

            // Initialize missing fields
            oSupplierCopy.indicadores    = oSupplierCopy.indicadores    || [];
            oSupplierCopy.documentos     = oSupplierCopy.documentos     || [];
            oSupplierCopy.clasificador   = oSupplierCopy.clasificador   || "regular";
            oSupplierCopy.cuentaAsociada = oSupplierCopy.cuentaAsociada || "";
            oSupplierCopy.repLegal       = oSupplierCopy.repLegal       || {
                tipoDoc: "DNI", nroDoc: "", apellidoPaterno: "",
                apellidoMaterno: "", nombres: "", cargo: "", telefono: "", email: ""
            };

            const sTipo = oSupplierCopy.tipoEmpresa === "natural" ? "natural" : "juridica";
            const oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/supplier", oSupplierCopy);
            oViewModel.setProperty("/mode", sMode);
            oViewModel.setProperty("/originalSupplierId", sSupplierId);
            oViewModel.setProperty("/supplierType", sTipo);

            this._updatePageTitle(sMode);
            this._updateHeaderKpis(oSupplierCopy);
            this._updateDocumentosPorNacionalidad(oSupplierCopy.nacionalidad, sTipo);
            this._updateIndicadoresCount(oSupplierCopy.indicadores);
            this._syncIndicadorTokens(oSupplierCopy.indicadores);
            this._resetFieldStates();
            this._oInitialSnapshot = JSON.parse(JSON.stringify(oSupplierCopy));
        },

        _initNewSupplier(sTipoPersona) {
            const sTipo = sTipoPersona || "juridica";
            const oNewSupplier = {
                id: this._generateId(),
                razonSocial: "",
                alias: "",
                tipoEmpresa: sTipo,
                beneficiario: "",
                apellidoPaterno: "",
                apellidoMaterno: "",
                telefono: "",
                email: "",
                claseEmpresa: "privada",
                bloqueado: false,
                codigoSAP: "",
                direccion: "",
                nacionalidad: "PE",
                departamento: "",
                provincia: "",
                distrito: "",
                grupoTesoreria: "",
                grupoContable: "",
                tipoImpuesto: "IGV",
                cuentaAsociada: "",
                esquema: "conIGV",
                debitoAutomatico: false,
                moneda: "PEN",
                condicionPago: "30D",
                fechaRegistro: this._getCurrentDate(),
                usuarioRegistro: "ADMIN",
                estadoContribuyente: "Pre-Registrado",
                clasificador: "regular",
                nroDoc: "",
                tipoDoc: sTipo === "natural" ? "DNI" : "RUC",
                emiFactElectronica: false,
                indicadores: [],
                documentos: [],
                repLegal: {
                    tipoDoc: "DNI", nroDoc: "", apellidoPaterno: "",
                    apellidoMaterno: "", nombres: "", cargo: "", telefono: "", email: ""
                }
            };

            const oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/supplier", oNewSupplier);
            oViewModel.setProperty("/mode", "create");
            oViewModel.setProperty("/originalSupplierId", null);
            oViewModel.setProperty("/supplierType", sTipo);

            this._updatePageTitle("create");
            this._updateHeaderKpis(oNewSupplier);
            this._updateDocumentosPorNacionalidad("PE", sTipo);
            this._updateIndicadoresCount([]);
            this._syncIndicadorTokens([]);
            this._resetFieldStates();
            this._oInitialSnapshot = JSON.parse(JSON.stringify(oNewSupplier));
        },

        _updatePageTitle(sMode) {
            const oViewModel = this.getModel("viewModel");
            const sType = oViewModel.getProperty("/supplierType") || "juridica";
            const sTypeLabel = sType === "natural" ? "Persona Natural" : "Persona Jurídica";
            
            let sTitle = "";
            switch (sMode) {
                case "create":
                    sTitle = "Nueva " + sTypeLabel;
                    break;
                case "edit":
                    sTitle = "Editar " + sTypeLabel;
                    break;
                case "display":
                default:
                    sTitle = "Detalle " + sTypeLabel;
                    break;
            }

            oViewModel.setProperty("/pageTitle", sTitle);
        },

        onEdit() {
            const oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/mode", "edit");
            this._updatePageTitle("edit");
            // Refresh snapshot to capture exact current state, avoiding false positives on Cancel
            this._oInitialSnapshot = JSON.parse(JSON.stringify(oViewModel.getProperty("/supplier")));
        },

        onSave() {
            const oViewModel = this.getModel("viewModel");
            const sMode = oViewModel.getProperty("/mode");
            const sConfirmMsg = sMode === "create"
                ? "¿Está seguro de que desea guardar el nuevo registro?"
                : "¿Está seguro de que desea actualizar los datos del registro?";
            const sTitle = sMode === "create" ? "Confirmar creación" : "Confirmar actualización";

            sap.m.MessageBox.confirm(sConfirmMsg, {
                title: sTitle,
                actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                emphasizedAction: sap.m.MessageBox.Action.OK,
                onClose: (sAction) => {
                    if (sAction === sap.m.MessageBox.Action.OK) {
                        this._doSave();
                    }
                }
            });
        },

        _doSave() {
            const oViewModel = this.getModel("viewModel");
            const sMode = oViewModel.getProperty("/mode");
            const sSupplierType = oViewModel.getProperty("/supplierType");
            const oSupplier = oViewModel.getProperty("/supplier");

            // Marcar field states y recopilar errores
            const oNewStates = {
                razonSocial: "None", alias: "None",
                beneficiario: "None", apellidoPaterno: "None", apellidoMaterno: "None"
            };
            const aCamposFaltantes = [];
            if (sSupplierType === "juridica") {
                if (!oSupplier.razonSocial) { aCamposFaltantes.push("Razón Social"); oNewStates.razonSocial = "Error"; }
                if (!oSupplier.alias)       { aCamposFaltantes.push("Alias");        oNewStates.alias = "Error"; }
            } else {
                if (!oSupplier.beneficiario)    { aCamposFaltantes.push("Nombres");          oNewStates.beneficiario = "Error"; }
                if (!oSupplier.apellidoPaterno) { aCamposFaltantes.push("Apellido Paterno"); oNewStates.apellidoPaterno = "Error"; }
                if (!oSupplier.apellidoMaterno) { aCamposFaltantes.push("Apellido Materno"); oNewStates.apellidoMaterno = "Error"; }
            }
            oViewModel.setProperty("/fieldStates", oNewStates);

            if (aCamposFaltantes.length > 0) {
                this._showValidationError(aCamposFaltantes);
                return;
            }

            if (oSupplier.email && !this.isValidEmail(oSupplier.email)) {
                this.showErrorMessage(this.getResourceBundle().getText("invalidEmail"));
                return;
            }

            const oSuppliersModel = this.getModel("suppliers");
            let aSuppliers = oSuppliersModel.getProperty("/") || [];
            if (!Array.isArray(aSuppliers)) aSuppliers = [];

            const oSupplierData = oViewModel.getProperty("/supplier");
            if (sMode === "create") {
                aSuppliers.push(oSupplierData);
            } else {
                const sOriginalId = oViewModel.getProperty("/originalSupplierId");
                const iIndex = aSuppliers.findIndex(s => s.id === sOriginalId);
                if (iIndex !== -1) aSuppliers[iIndex] = oSupplierData;
            }
            oSuppliersModel.setProperty("/", aSuppliers);

            const sTitleOk = sMode === "create" ? "Registro creado" : "Registro actualizado";
            const sMsg = sMode === "create"
                ? "Los datos del proveedor fueron registrados correctamente. Quede a la espera de la confirmación de creación."
                : "Los datos del proveedor se actualizaron correctamente.";
            this._showSuccessMessage(sTitleOk, sMsg);
        },

        _resetFieldStates() {
            this.getModel("viewModel").setProperty("/fieldStates", {
                razonSocial: "None", alias: "None",
                beneficiario: "None", apellidoPaterno: "None", apellidoMaterno: "None"
            });
        },

        _showSuccessMessage(sTitle, sText) {
            const oIcon = new sap.ui.core.Icon({
                src: "sap-icon://sys-enter-2",
                size: "3rem",
                color: "#107e3e"
            }).addStyleClass("sapUiSmallMarginBottom");
            const oTitle = new sap.m.Title({ text: sTitle, level: "H3", titleStyle: "H3" })
                .addStyleClass("sapUiSmallMarginBottom");
            const oText = new sap.m.Text({ text: sText, wrapping: true })
                .addStyleClass("sapUiSmallMarginTop");
            const oContent = new sap.m.VBox({
                alignItems: "Center",
                items: [oIcon, oTitle, oText]
            }).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginTopBottom");

            sap.m.MessageBox.show(oContent, {
                icon: sap.m.MessageBox.Icon.NONE,
                title: "",
                actions: ["Aceptar"],
                emphasizedAction: "Aceptar",
                contentWidth: "400px",
                onClose: () => { oContent.destroy(); this.getRouter().navTo("main"); }
            });
        },

        _showValidationError(aCamposFaltantes) {
            const oList = new sap.m.List({ showSeparators: "None" });
            aCamposFaltantes.forEach(sCampo => {
                oList.addItem(new sap.m.StandardListItem({
                    title: sCampo,
                    icon: "sap-icon://error",
                    iconInset: false,
                    type: "Inactive",
                    highlight: "Error",
                    highlightText: "Obligatorio"
                }));
            });
            const oStrip = new sap.m.MessageStrip({
                text: "Complete los siguientes campos para continuar:",
                type: "Error",
                showIcon: true
            }).addStyleClass("sapUiSmallMarginBottom");
            const oContent = new sap.m.VBox({ items: [oStrip, oList] });

            sap.m.MessageBox.show(oContent, {
                icon: sap.m.MessageBox.Icon.NONE,
                title: "⚠️  Campos obligatorios incompletos",
                actions: [sap.m.MessageBox.Action.CLOSE],
                emphasizedAction: sap.m.MessageBox.Action.CLOSE,
                contentWidth: "420px",
                onClose: () => { oContent.destroy(); }
            });
        },

        onCancel() {
            const oViewModel = this.getModel("viewModel");
            const sMode = oViewModel.getProperty("/mode");

            if (sMode === "edit" || sMode === "create") {
                const oCurrentSupplier = oViewModel.getProperty("/supplier");
                const bHasChanges = JSON.stringify(oCurrentSupplier) !== JSON.stringify(this._oInitialSnapshot || {});

                if (bHasChanges) {
                    const oWarnIcon = new sap.ui.core.Icon({
                        src: "sap-icon://warning",
                        size: "2.5rem",
                        color: "#e9730c"
                    }).addStyleClass("sapUiSmallMarginBottom");
                    const oTitle = new sap.m.Title({ text: "¿Cancelar sin guardar?", level: "H3", titleStyle: "H4" })
                        .addStyleClass("sapUiSmallMarginBottom");
                    const oText = new sap.m.Text({
                        text: "Hay cambios sin guardar que se perderán si continúa.",
                        textAlign: "Center",
                        wrapping: true
                    });
                    const oContent = new sap.m.VBox({
                        alignItems: "Center",
                        items: [oWarnIcon, oTitle, oText]
                    }).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginTopBottom");

                    sap.m.MessageBox.show(oContent, {
                        icon: sap.m.MessageBox.Icon.NONE,
                        title: "",
                        actions: ["Sí, cancelar", "Seguir editando"],
                        emphasizedAction: "Seguir editando",
                        contentWidth: "400px",
                        onClose: (sAction) => {
                            oContent.destroy();
                            if (sAction === "Sí, cancelar") {
                                this._doCancelNav(sMode, oViewModel);
                            }
                        }
                    });
                } else {
                    this._doCancelNav(sMode, oViewModel);
                }
            } else {
                this.onNavBack();
            }
        },

        _doCancelNav(sMode, oViewModel) {
            this.getRouter().navTo("main");
        },

        onAddReference() {
            const oViewModel = this.getModel("viewModel");
            const aReferencias = oViewModel.getProperty("/supplier/referencias") || [];
            
            const oNewRef = {
                id: (aReferencias.length + 1).toString(),
                numero: "",
                principal: false
            };

            aReferencias.push(oNewRef);
            oViewModel.setProperty("/supplier/referencias", aReferencias);
        },

        onDeleteReference(oEvent) {
            const oContext = oEvent.getSource().getBindingContext("viewModel");
            const sPath = oContext.getPath();
            
            const oViewModel = this.getModel("viewModel");
            const aReferencias = oViewModel.getProperty("/supplier/referencias") || [];
            const iIndex = parseInt(sPath.split("/").pop());

            aReferencias.splice(iIndex, 1);
            oViewModel.setProperty("/supplier/referencias", aReferencias);
        },

        onNacionalidadChange(oEvent) {
            const sNacionalidad = oEvent.getSource().getSelectedKey();
            const oViewModel = this.getModel("viewModel");
            const sTipo = oViewModel.getProperty("/supplierType");
            this._updateDocumentosPorNacionalidad(sNacionalidad, sTipo);
        },

        _updateDocumentosPorNacionalidad(sNacionalidad, sTipo) {
            const oCatalogs = this.getModel("catalogs");
            const oDocMap = oCatalogs ? oCatalogs.getProperty("/documentosPorNacionalidad") : null;
            const oViewModel = this.getModel("viewModel");
            if (!oDocMap) { oViewModel.setProperty("/documentosPorNacionalidad", []); return; }

            const oTipoMap = oDocMap[sTipo] || oDocMap["juridica"];
            const aDocs = oTipoMap[sNacionalidad] || oTipoMap["DEFAULT"] || [{"key": "OTRO", "text": "Otro"}];
            oViewModel.setProperty("/documentosPorNacionalidad", aDocs);
        },

        _updateHeaderKpis(oSupplier) {
            const oViewModel = this.getModel("viewModel");
            // Initials
            let sInitials = "?";
            if (oSupplier.razonSocial) {
                const aWords = oSupplier.razonSocial.trim().split(" ").filter(Boolean);
                sInitials = (aWords[0] ? aWords[0][0] : "") + (aWords[1] ? aWords[1][0] : "");
                sInitials = sInitials.toUpperCase().substring(0, 2);
            } else if (oSupplier.beneficiario) {
                const aWords = oSupplier.beneficiario.trim().split(" ").filter(Boolean);
                sInitials = (aWords[0] ? aWords[0][0] : "") + (aWords[1] ? aWords[1][0] : "");
                sInitials = sInitials.toUpperCase().substring(0, 2) || "PN";
            }
            oViewModel.setProperty("/supplierInitials", sInitials);
            // Status state
            const sEstado = oSupplier.estadoContribuyente || "";
            let sState = "None", sIcon = "sap-icon://pending";
            if (sEstado === "Activo")        { sState = "Success"; sIcon = "sap-icon://supplier"; }
            if (sEstado === "Suspendido")    { sState = "Warning"; sIcon = "sap-icon://pause"; }
            if (sEstado === "Bloqueado")     { sState = "Error";   sIcon = "sap-icon://locked"; }
            oViewModel.setProperty("/supplierStatusState", sState);
            oViewModel.setProperty("/supplierStatusIcon",  sIcon);
            // Clasificador display text (show label, not key)
            const oCatalogs = this.getModel("catalogs");
            const aClasif = oCatalogs ? (oCatalogs.getProperty("/clasificador") || []) : [];
            const oClasif = aClasif.find(c => c.key === oSupplier.clasificador);
            oViewModel.setProperty("/clasificadorText", oClasif ? oClasif.text : (oSupplier.clasificador || ""));
        },

        _updateIndicadoresCount(aIndicadores) {
            const oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/indicadoresCountText", (aIndicadores ? aIndicadores.length : 0) + " / 3");
        },

        onIndicadorTokenUpdate(oEvent) {
            oEvent.preventDefault();
            const sType    = oEvent.getParameter("type");
            const oViewModel = this.getModel("viewModel");
            let aIndicadores = [...(oViewModel.getProperty("/supplier/indicadores") || [])];

            if (sType === "added") {
                const aAdded = oEvent.getParameter("addedTokens") || [];
                if (aIndicadores.length >= 3) {
                    this.showErrorMessage(this.getResourceBundle().getText("limiteIndicadores"));
                    this._syncIndicadorTokens(aIndicadores);
                    return;
                }
                aAdded.forEach(oToken => {
                    aIndicadores.push({
                        id: oToken.getKey() || Date.now().toString(),
                        indicador: oToken.getText()
                    });
                });
            } else if (sType === "removed") {
                const aRemoved = oEvent.getParameter("removedTokens") || [];
                const aRemovedTexts = new Set(aRemoved.map(t => t.getText()));
                aIndicadores = aIndicadores.filter(ind => !aRemovedTexts.has(ind.indicador));
            }

            oViewModel.setProperty("/supplier/indicadores", aIndicadores);
            this._updateIndicadoresCount(aIndicadores);
            this._syncIndicadorTokens(aIndicadores);
        },

        onIndicadorSuggest(oEvent) {
            const sValue     = (oEvent.getParameter("suggestValue") || "").toLowerCase();
            const oCatalogs  = this.getModel("catalogs");
            const aAllItems  = oCatalogs ? (oCatalogs.getProperty("/indicadoresRetencionDetraccion") || []) : [];
            const oMultiInput = oEvent.getSource();
            const aIndicadores = this.getModel("viewModel").getProperty("/supplier/indicadores") || [];
            const aSelectedTexts = new Set(aIndicadores.map(i => i.indicador));

            oMultiInput.removeAllSuggestionItems();
            aAllItems
                .filter(item => !aSelectedTexts.has(item.text))
                .filter(item => !sValue || item.text.toLowerCase().includes(sValue))
                .forEach(item => {
                    oMultiInput.addSuggestionItem(new SuggestionItem({ key: item.key, text: item.text }));
                });
            oMultiInput.openValueStateMessage && oMultiInput._$input && oMultiInput._$input.trigger("input");
        },

        onIndicadorFocus(oEvent) {
            const oMultiInput = oEvent.getSource();
            const oCatalogs = this.getModel("catalogs");
            const aAllItems = oCatalogs ? (oCatalogs.getProperty("/indicadoresRetencionDetraccion") || []) : [];
            const aIndicadores = this.getModel("viewModel").getProperty("/supplier/indicadores") || [];
            const aSelectedTexts = new Set(aIndicadores.map(i => i.indicador));
            oMultiInput.removeAllSuggestionItems();
            aAllItems
                .filter(item => !aSelectedTexts.has(item.text))
                .forEach(item => {
                    oMultiInput.addSuggestionItem(new SuggestionItem({ key: item.key, text: item.text }));
                });
            oMultiInput.openSuggestions();
        },

        onIndicadorValueHelp() {
            const oCatalogs = this.getModel("catalogs");
            const aAllItems = oCatalogs ? (oCatalogs.getProperty("/indicadoresRetencionDetraccion") || []) : [];
            const oViewModel = this.getModel("viewModel");
            const aIndicadores = oViewModel.getProperty("/supplier/indicadores") || [];

            if (aIndicadores.length >= 3) {
                sap.m.MessageToast.show("Ya alcanzaste el límite de 3 indicadores.");
                return;
            }

            const aSelectedTexts = new Set(aIndicadores.map(i => i.indicador));
            const aAvailable = aAllItems.filter(item => !aSelectedTexts.has(item.text));

            if (aAvailable.length === 0) {
                sap.m.MessageToast.show("Todos los indicadores disponibles ya han sido seleccionados.");
                return;
            }

            const oDialogModel = new JSONModel(aAvailable);
            const oSelectDialog = new sap.m.SelectDialog({
                title: "Indicadores de Retención y Detracción",
                multiSelect: false,
                rememberSelections: false,
                confirm: (oEvent) => {
                    const oItem = oEvent.getParameter("selectedItem");
                    if (oItem) {
                        const oCtx = oItem.getBindingContext("indicVerHelp");
                        const sKey  = oCtx ? oCtx.getProperty("key")  : "";
                        const sText = oCtx ? oCtx.getProperty("text") : oItem.getTitle();
                        let aInd = [...(oViewModel.getProperty("/supplier/indicadores") || [])];
                        aInd.push({ id: sKey, indicador: sText });
                        oViewModel.setProperty("/supplier/indicadores", aInd);
                        this._updateIndicadoresCount(aInd);
                        this._syncIndicadorTokens(aInd);
                    }
                    oSelectDialog.destroy();
                },
                cancel: () => { oSelectDialog.destroy(); },
                afterClose: () => { oSelectDialog.destroy(); }
            });

            oSelectDialog.setModel(oDialogModel, "indicVerHelp");
            oSelectDialog.bindAggregation("items", {
                path: "indicVerHelp>/",
                template: new sap.m.StandardListItem({ title: "{indicVerHelp>text}" })
            });
            oSelectDialog.open();
        },

        _syncIndicadorTokens(aIndicadores) {
            const oMultiInput = this.byId("indicadoresMultiInput");
            if (!oMultiInput) { return; }
            oMultiInput.removeAllTokens();
            (aIndicadores || []).forEach(oInd => {
                oMultiInput.addToken(new Token({ key: oInd.id || "", text: oInd.indicador }));
            });
        },

        onAddDocument() {
            const oViewModel = this.getModel("viewModel");
            const aDocumentos = oViewModel.getProperty("/supplier/documentos") || [];
            
            const oNewDoc = {
                id: (aDocumentos.length + 1).toString(),
                numero: "",
                documento: ""
            };

            aDocumentos.push(oNewDoc);
            oViewModel.setProperty("/supplier/documentos", aDocumentos);
        },

        onDeleteDocument(oEvent) {
            const oContext = oEvent.getSource().getBindingContext("viewModel");
            const sPath = oContext.getPath();
            
            const oViewModel = this.getModel("viewModel");
            const aDocumentos = oViewModel.getProperty("/supplier/documentos") || [];
            const iIndex = parseInt(sPath.split("/").pop());

            aDocumentos.splice(iIndex, 1);
            oViewModel.setProperty("/supplier/documentos", aDocumentos);
        },

        _generateId() {
            return Date.now().toString();
        },

        _generateSAPCode() {
            return "10" + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        },

        _getCurrentDate() {
            const oDate = new Date();
            const year = oDate.getFullYear();
            const month = String(oDate.getMonth() + 1).padStart(2, '0');
            const day = String(oDate.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        },

        onRegistrarEnSAP() {
            const oViewModel = this.getModel("viewModel");
            const oSupplier = oViewModel.getProperty("/supplier");
            const sNombre = oSupplier.razonSocial || oSupplier.beneficiario || "el proveedor";

            const oAvatar = new sap.m.Avatar({
                initials: (sNombre[0] || "?").toUpperCase(),
                displaySize: "M",
                backgroundColor: "Accent6",
                displayShape: "Square"
            }).addStyleClass("sapUiSmallMarginBottom");
            const oTitle = new sap.m.Title({ text: "Registrar en SAP", level: "H3", titleStyle: "H4" })
                .addStyleClass("sapUiSmallMarginBottom");
            const oProvText = new sap.m.Text({ text: sNombre, wrapping: false })
                .addStyleClass("sapUiTinyMarginBottom");
            const oStrip = new sap.m.MessageStrip({
                text: "Esta acción creará el acreedor en SAP y asignará un código automáticamente. Esta operación no se puede deshacer.",
                type: "Warning",
                showIcon: true
            }).addStyleClass("sapUiSmallMarginTop");
            const oContent = new sap.m.VBox({
                alignItems: "Center",
                items: [oAvatar, oTitle, oProvText, oStrip]
            }).addStyleClass("sapUiSmallMarginBeginEnd sapUiSmallMarginTopBottom");

            sap.m.MessageBox.show(oContent, {
                icon: sap.m.MessageBox.Icon.NONE,
                title: "",
                actions: ["Crear acreedor", sap.m.MessageBox.Action.CANCEL],
                emphasizedAction: "Crear acreedor",
                contentWidth: "420px",
                onClose: (sAction) => {
                    oContent.destroy();
                    if (sAction === "Crear acreedor") {
                        this._ejecutarRegistroSAP(oSupplier);
                    }
                }
            });
        },

        _ejecutarRegistroSAP(oSupplier) {
            const oViewModel = this.getModel("viewModel");
            oViewModel.setProperty("/busy", true);

            setTimeout(() => {
                oViewModel.setProperty("/busy", false);
                const sAcreedorNum = this._generateAcreedorNumber();

                oViewModel.setProperty("/supplier/codigoSAP", sAcreedorNum);

                const oSuppliersModel = this.getModel("suppliers");
                let aSuppliers = oSuppliersModel.getProperty("/") || [];
                if (!Array.isArray(aSuppliers)) aSuppliers = [];
                const sSupplierId = oViewModel.getProperty("/supplier/id");
                const iIdx = aSuppliers.findIndex(s => s.id === sSupplierId);
                if (iIdx !== -1) {
                    aSuppliers[iIdx].codigoSAP = sAcreedorNum;
                    oSuppliersModel.setProperty("/", aSuppliers);
                }

                const oCheckIcon = new sap.ui.core.Icon({
                    src: "sap-icon://sys-enter-2",
                    size: "3.5rem",
                    color: "#107e3e"
                }).addStyleClass("sapUiSmallMarginBottom");
                const oTitleOk = new sap.m.Title({ text: "¡Acreedor creado!", level: "H3", titleStyle: "H3" })
                    .addStyleClass("sapUiTinyMarginBottom");
                const oCode = new sap.m.ObjectStatus({
                    text: sAcreedorNum,
                    state: "Success",
                    icon: "sap-icon://accept",
                    inverted: true
                }).addStyleClass("sapUiSmallMarginTopBottom");
                const oMsg = new sap.m.Text({
                    text: "El acreedor fue registrado exitosamente en SAP.",
                    textAlign: "Center",
                    wrapping: true
                });
                const oSuccessContent = new sap.m.VBox({
                    alignItems: "Center",
                    items: [oCheckIcon, oTitleOk, oCode, oMsg]
                }).addStyleClass("sapUiMediumMarginBeginEnd sapUiSmallMarginTopBottom");

                sap.m.MessageBox.show(oSuccessContent, {
                    icon: sap.m.MessageBox.Icon.NONE,
                    title: "",
                    actions: ["Aceptar"],
                    emphasizedAction: "Aceptar",
                    contentWidth: "380px",
                    onClose: () => { oSuccessContent.destroy(); }
                });
            }, 2000);
        },

        _generateAcreedorNumber() {
            const oSuppliersModel = this.getModel("suppliers");
            const aSuppliers = oSuppliersModel ? (oSuppliersModel.getProperty("/") || []) : [];
            const aCodigosSAP = aSuppliers
                .map(s => parseInt(s.codigoSAP) || 0)
                .filter(n => n > 0);
            const iMax = aCodigosSAP.length > 0 ? Math.max(...aCodigosSAP) : 1000000;
            const iNext = iMax + Math.floor(Math.random() * 9) + 1;
            return String(iNext).padStart(7, "0");
        }
    });
});
