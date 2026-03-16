## Application Details
|               |
| ------------- |
|**Generation Date and Time**<br>Tue Jan 27 2026 16:39:37 GMT+0000 (Coordinated Universal Time)|
|**App Generator**<br>SAP Fiori Application Generator|
|**App Generator Version**<br>1.20.1|
|**Generation Platform**<br>SAP Business Application Studio|
|**Template Used**<br>Basic|
|**Service Type**<br>None|
|**Service URL**<br>N/A|
|**Module Name**<br>gestion_proveedores|
|**Application Title**<br>Gestión de proveedores|
|**Namespace**<br>claro.com|
|**UI5 Theme**<br>sap_horizon|
|**UI5 Version**<br>1.144.0|
|**Enable TypeScript**<br>False|
|**Add Eslint configuration**<br>False|

## Gestión de Proveedores - Aplicación SAPUI5

Aplicación SAPUI5 Freestyle para la gestión de proveedores con funcionalidades de búsqueda, CRUD y exportación de datos, segmentada por tipo de persona (Natural y Jurídica).

## Estado actual del proyecto (16/03/2026)

### Pantallas implementadas

#### 1. Pantalla Principal – Gestión de Proveedores (`Main.view.xml`)

- **KPI Strip** superior con 4 indicadores:
  - Total Proveedores
  - Personas Naturales
  - Personas Jurídicas
  - Bloqueados
- **Tabs separados** por tipo (`IconTabBar`):
  - **Persona Natural**: filtros por Apellidos, Tipo Documento, Código SAP, Nro Doc. Tabla paginada (20 por página) con acciones Editar y Eliminar. Exportación a Excel. Creación de nueva Persona Natural.
  - **Persona Jurídica**: filtros por Razón Social, Nacionalidad, Tipo Documento, Tipo Empresa, Clase Empresa, Nro Doc, Código SAP. Tabla paginada (20 por página) con indicador de bloqueado, acciones Editar y Eliminar. Exportación a Excel. Creación de nueva Persona Jurídica.
- **Paginación manual** (primera, anterior, siguiente, última página) implementada en ambos tabs.
- **Filtrado** independiente por tab con botón "Limpiar Filtros".
- **Eliminación** con diálogo de confirmación.

#### 2. Detalle / Creación / Edición de Proveedor (`SupplierDetail.view.xml`)

- Implementado con `sap.uxap.ObjectPageLayout` + `ObjectPageDynamicHeaderTitle`.
- **Modo dinámico**: `display`, `edit`, `create` — el título y botones de acción se adaptan al modo.
- **Cabecera** con Avatar (iniciales generadas automáticamente), estado del contribuyente con color semántico (`Success/Warning/Error`) y KPIs: Código SAP, Nro Doc, Email, Teléfono.
- **Secciones del ObjectPage**:
  - **Identificación**: Razón Social / Nombres, Alias, Tipo Empresa, Clase Empresa, Emisión Factura Electrónica, Tipo/Nro Documento, Código SAP, Beneficiario, Email, Teléfono, Estado Contribuyente, Clasificador, Bloqueo, Moneda, Condición de Pago, Grupo Contable, Grupo Tesorería, Tipo Impuesto, Cuenta Asociada, Esquema, Débito Automático, Fecha Registro, Usuario Registro.
  - **Domicilio y Contable**: Dirección, Nacionalidad (Select dinámico), Departamento, Provincia, Distrito.
  - **Representante Legal** *(visible solo para Personas Jurídicas)*: Tipo Doc, Nro Doc, Apellido Paterno, Apellido Materno, Nombres, Cargo, Teléfono, Email.
  - **Indicadores**: MultiInput con sugerencias desde catálogos, límite de 3 indicadores, contador en tiempo real.
  - **Documentos**: Tabla editable con adición y eliminación de filas (Tipo Documento + Número).
- **Tipo de Documento filtrado por Nacionalidad**: la lista de tipos de documento disponibles cambia dinámicamente según la nacionalidad y tipo de persona seleccionados.
- **Guardado** actualiza el modelo global `suppliers` (persistencia en sesión).
- **Validaciones**: Razón Social obligatoria para Personas Jurídicas, formato de email.

### Pantallas pendientes de implementar

- ~~Lista de Invitaciones~~ — controlador y vista **no implementados aún**
- ~~Crear Invitación~~ — controlador y vista **no implementados aún**

## Rutas (`manifest.json`)

| Ruta | Patrón | Vista |
|---|---|---|
| `main` | `` (vacío) | `Main` |
| `supplierDetail` | `supplier/{supplierId}/{mode}` | `SupplierDetail` |
| `supplierCreate` | `supplier/create/{tipoPersona}` | `SupplierDetail` |

## Estructura del proyecto

```
webapp/
├── controller/
│   ├── App.controller.js
│   ├── BaseController.js              # Controlador base con utilidades (router, modelos, MessageBox, MessageToast, navBack)
│   ├── Main.controller.js             # Pantalla principal (KPIs, tabs Natural/Jurídica, filtros, paginación, CRUD, export)
│   └── SupplierDetail.controller.js   # Detalle de proveedor (crear, editar, visualizar)
├── view/
│   ├── App.view.xml
│   ├── Main.view.xml
│   └── SupplierDetail.view.xml
├── model/
│   └── models.js
├── localService/
│   └── mockdata/
│       ├── Suppliers.json             # Proveedores de ejemplo (naturales y jurídicas)
│       ├── Invitations.json           # Invitaciones de ejemplo (sin uso activo aún)
│       └── Catalogs.json              # Catálogos: tipos de documento por nacionalidad, indicadores, etc.
├── i18n/
│   └── i18n.properties                # Textos internacionalizados
├── css/
│   └── style.css
├── Component.js                        # Componente principal
├── manifest.json                       # Configuración de la app
└── index.html

```

## Tecnologías utilizadas

- **SAPUI5 Freestyle** (no Fiori Elements)
- **Patrón MVC**
- **Librerías SAPUI5**:
  - `sap.m` — Controles Mobile/Responsive
  - `sap.uxap` — Object Page Layout
  - `sap.ui.export` — Exportación a Excel (`Spreadsheet`)
  - `sap.ui.table` — Tablas avanzadas
  - `sap.ui.layout` — Layouts de formulario
- **Modelos**:
  - `i18n` — Internacionalización
  - `suppliers` — JSONModel cargado desde `Suppliers.json`
  - `catalogs` — JSONModel cargado desde `Catalogs.json`
  - `viewModel` — Estado local de cada vista

## Datos Mock

### Suppliers.json
Ubicado en `/webapp/localService/mockdata/Suppliers.json`. Contiene proveedores de tipo `natural` y `juridica` con campos completos. El campo `tipoEmpresa: "natural"` distingue a las personas naturales del resto.

### Invitaciones (8 registros)
Ubicados en `/webapp/localService/mockdata/Invitations.json`
- 5 con estado "Invitado" (pendientes)
- 3 con estado "Confirmado"

### Catálogos
Ubicados en `/webapp/localService/mockdata/Catalogs.json`
- Tipo Proveedor
- Tipo Documento
- Tipo/Clase Empresa
- Nacionalidad
- Departamento/Provincia/Distrito
- Grupos (Tesorería, Contable)
- Tipos de impuesto
- Esquemas, Monedas, Condiciones de pago
- Estado contribuyente, Clasificadores, Indicadores

## Instalación y ejecución

### Requisitos previos
- Node.js (v14 o superior)
- npm o yarn

### Pasos para ejecutar localmente

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Ejecutar la aplicación**
   ```bash
   npm start
   ```
   
   La aplicación se abrirá automáticamente en el navegador en:
   ```
   http://localhost:8080/index.html
   ```

3. **Compilar para producción** (opcional)
   ```bash
   npm run build
   ```

### Catalogs.json
Contiene catálogos utilizados en formularios:
- `documentosPorNacionalidad` — tipos de documento filtrados por nacionalidad y tipo de persona
- `indicadoresRetencionDetraccion` — lista de indicadores disponibles para el MultiInput

## Buenas prácticas implementadas

- Patrón MVC estricto
- `BaseController` con métodos reutilizables (`getRouter`, `getModel`, `showErrorMessage`, `showSuccessMessage`, `showConfirmDialog`, `isValidEmail`, `onNavBack`)
- Internacionalización (i18n) en todos los textos
- Validaciones en formularios con feedback al usuario
- Confirmación antes de acciones destructivas (eliminar)
- Separación de responsabilidades (controladores específicos por vista)
- Modelos JSONModel para datos y estado de UI
- Routing declarativo en manifest.json
- Paginación manual con control explícito de página actual y total

## Arrancar la aplicación

```bash
npm start
```

#### Pre-requisitos:

1. NodeJS LTS activo y NPM compatible. (Ver https://nodejs.org)

---

## Procesos del Sistema

### Persona Jurídica

Una **Persona Jurídica** es una empresa, sociedad o entidad legal (SAC, SRL, SA, EIRL, etc.) que desea ser registrada como proveedor/acreedor de Claro.

#### Flujo completo de una Persona Jurídica

```
[Operador] Crea nuevo proveedor jurídico
     │
     ▼
 1. CREACIÓN (Estado: Pre-Registrado)
    - Se ingresan datos: Razón Social, Alias, RUC, Clase/Tipo Empresa
    - Datos de contacto: Email, Teléfono, Dirección
    - Datos contables: Moneda, Condición de Pago, Grupo Contable/Tesorería
    - Representante Legal: Tipo/Nro Doc, Nombres, Cargo, Email, Teléfono
    - Indicadores de Retención/Detracción (máx. 3)
    - SIN código SAP aún
     │
     ▼
 2. REGISTRO EN SAP (Estado: Pre-Registrado → Activo)
    - [Aprobador] pulsa "Registrar en SAP"
    - Se simula la creación del acreedor en SAP (2 s de latencia)
    - Se asigna un número de acreedor SAP automáticamente
    - El estado cambia a Activo
     │
     ▼
 3. GESTIÓN (Estado: Activo / Suspendido / Bloqueado)
    - [Operador/Aprobador] puede editar datos del proveedor
    - [Aprobador] puede cambiar el estado: Activo ↔ Suspendido ↔ Bloqueado
    - Se puede exportar el listado completo a Excel
     │
     ▼
 4. BAJA / BLOQUEO
    - [Aprobador] cambia estado a Bloqueado (impide operaciones)
    - [Operador] puede eliminar el registro (con confirmación)
```

**Campos clave de la Persona Jurídica:**

| Campo | Obligatorio | Descripción |
|---|---|---|
| Razón Social | Sí | Nombre legal de la empresa |
| Alias | Sí | Nombre corto para identificación interna |
| Tipo Documento + Nro Doc | Sí | RUC para empresas nacionales |
| Clase Empresa | No | Privada / Pública / Mixta |
| Representante Legal | No | Datos del rep. autorizado |
| Indicadores | No | Retención / Detracción (máx. 3) |
| Código SAP | Generado | Asignado al registrar en SAP; vacío en Pre-Registrado |

---

### Persona Natural

Una **Persona Natural** es un individuo (independiente, profesional, trabajador autónomo) que presta servicios a Claro y requiere ser dado de alta como proveedor/acreedor.

#### Flujo completo de una Persona Natural

```
[Operador] Crea nuevo proveedor natural
     │
     ▼
 1. CREACIÓN (Estado: Pre-Registrado)
    - Se ingresan datos: Nombres, Apellido Paterno, Apellido Materno
    - Tipo/Nro Documento: DNI, CE u otro según nacionalidad
    - Datos de contacto: Email, Teléfono, Dirección
    - Datos contables: Moneda, Condición de Pago, Grupo Contable/Tesorería
    - Indicadores de Retención/Detracción (máx. 3)
    - SIN código SAP aún
     │
     ▼
 2. REGISTRO EN SAP (Estado: Pre-Registrado → Activo)
    - [Aprobador] pulsa "Registrar en SAP"
    - Se simula la creación del acreedor en SAP (2 s de latencia)
    - Se asigna un número de acreedor SAP automáticamente
    - El estado cambia a Activo
     │
     ▼
 3. GESTIÓN (Estado: Activo / Suspendido / Bloqueado)
    - [Operador/Aprobador] puede editar datos personales y contables
    - [Aprobador] puede cambiar el estado: Activo ↔ Suspendido ↔ Bloqueado
    - Se puede exportar el listado completo a Excel
     │
     ▼
 4. BAJA / BLOQUEO
    - [Aprobador] cambia estado a Bloqueado
    - [Operador] puede eliminar el registro (con confirmación)
```

**Campos clave de la Persona Natural:**

| Campo | Obligatorio | Descripción |
|---|---|---|
| Nombres | Sí | Nombre(s) de pila |
| Apellido Paterno | Sí | Primer apellido |
| Apellido Materno | Sí | Segundo apellido |
| Tipo Documento + Nro Doc | Sí | DNI para nacionales; CE/Pasaporte para extranjeros |
| Email | Recomendado | Validado con formato estándar |
| Indicadores | No | Retención / Detracción (máx. 3) |
| Código SAP | Generado | Asignado al registrar en SAP; vacío en Pre-Registrado |

---

### Estados del Proveedor

| Estado | Color | Descripción | Tiene Código SAP |
|---|---|---|---|
| Pre-Registrado | Gris | Creado pero pendiente de alta en SAP | No |
| Activo | Verde | Registrado en SAP, operativo | Sí |
| Suspendido | Naranja | Dado de alta en SAP pero temporalmente suspendido | Sí |
| Bloqueado | Rojo | Bloqueado, no puede operar | Sí |

---

### Roles del Sistema

| Rol | Capacidades |
|---|---|
| **Operador** | Crear, editar y eliminar proveedores. Ver listados. Exportar Excel. |
| **Aprobador** | Todas las del Operador + cambiar estado + ejecutar "Registrar en SAP" |

