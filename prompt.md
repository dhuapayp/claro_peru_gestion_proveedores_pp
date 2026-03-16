# Prompt – Generación de Aplicación SAPUI5  
## Gestión de Proveedores

### Rol del agente
Actúa como un **arquitecto y desarrollador senior SAPUI5 (Freestyle, no Fiori Elements)**.  
El proyecto SAPUI5 **ya está creado** (estructura base), pero **no contiene vistas, controladores ni lógica funcional**.  
Debes generar **todo el contenido necesario** para implementar la aplicación descrita a continuación, siguiendo **buenas prácticas SAPUI5** (MVC, routing, fragmentos reutilizables, i18n, JSONModel / OData Mock).

---

## 1. Objetivo funcional

La aplicación **Gestión de Proveedores** permite:

- Buscar proveedores ya creados en SAP mediante filtros y búsqueda libre.
- Gestionar **invitaciones** pendientes para la creación de proveedores.
- Crear, editar, visualizar y eliminar proveedores.
- Exportar listados.
- Mantener información detallada del proveedor organizada en secciones.

---

## 2. Pantallas y navegación (Routing)

Implementar **mínimo 4 vistas** con routing en `manifest.json`.

---

### 2.1 Pantalla Principal – Gestión de Proveedores

#### Cabecera (Toolbar / FilterBar)

Filtros:
- Tipo Proveedor (Lista: Persona natural, Persona jurídica, etc.)
- Razón Social (Input)
- Nro Doc (Input)
- Código SAP (Input)
- Campo **Buscar** (Input):
  - Busca en múltiples campos del proveedor (nro doc, razón social, código SAP, email, etc.)

Acciones:
- Botón **Buscar**
  - Ejecuta consulta considerando filtros + texto libre.
- Botón **Lista de invitaciones**
  - Muestra contador de invitaciones pendientes (badge o texto).
  - Navega a pantalla de invitaciones.
- Botón **Nueva invitación**
  - Navega a pantalla de creación de invitación.

---

#### Cuerpo

Acciones:
- Botón **Exportar**
  - Exporta la lista visible (CSV/XLSX usando `sap.ui.export.Spreadsheet`).

Tabla de proveedores (paginación):
- Mostrar **10 registros por página**.
- Columnas:
  - Nro Doc
  - Tipo Doc (RUC, DNI, etc.)
  - Empresa / Razón Social
  - Acciones por fila:
    - Visualizar
    - Editar
    - Eliminar
    - Crear (si aplica)

---

### 2.2 Pantalla – Lista de Invitaciones

Tabla con:
- Nro Doc
- Razón Social
- Correo de contacto
- Botón: Descargar condiciones para acceso al portal
- Botón: Descargar información para crear usuario en SAP
- Botón: Eliminar solicitud
- Estado: Invitado / Confirmado

Requisitos:
- Posibilidad de regresar a la pantalla principal.
- El contador de invitaciones debe reflejar solo las **pendientes** (estado = Invitado).

---

### 2.3 Pantalla – Nueva Invitación

Formulario:
- Correo de contacto (validación email).
- Fecha de vigencia:
  - Valor por defecto = fecha actual + 7 días.

Botones:
- **Enviar**
  - Simula envío de correo con enlace temporal.
  - Registra invitación con estado "Invitado".
  - Mostrar mensaje de éxito.
- **Cancelar**
  - Regresa a la pantalla anterior sin guardar.

---

### 2.4 Pantalla – Detalle de Proveedor (Crear / Editar / Visualizar)

Puede ser una única vista reutilizable con modo:
- `create`
- `edit`
- `display`

Se recomienda usar `sap.uxap.ObjectPageLayout`.

---

#### Sección: Datos Básicos 1

Campos:
- Razón Social
- Alias
- Tipo Empresa (empresa, persona, etc.)
- Beneficiario
- Teléfono
- Email
- Clase de empresa (privada, etc.)
- Bloqueo de proveedor (CheckBox)
- Código SAP

---

#### Sección: Datos Básicos 2

Campos:
- Dirección
- Nacionalidad
- Departamento / Región
- Provincia
- Distrito
- Grupo tesorería
- Grupo de cuenta
- Tipo de impuesto
- Cuenta asociada
- Esquema (proveedor con IGV)
- Débito automático
- Moneda (Soles, Dólares)
- Condición de pago
- Fecha registro (no editable)
- Usuario registro (no editable)
- Estado contribuyente
- Clasificador (proveedores estratégicos, etc.)

---

#### Sección: Referencia

Campos:
- Número de referencia
- Emisor de facturas electrónicas (CheckBox)

Acciones:
- Botón **Agregar números de referencia**

Tabla:
- Item
- Número
- Principal
- Editar
- Eliminar

---

#### Sección: Indicadores

Acciones:
- Botón **Agregar indicadores**

Tabla:
- Item
- Indicador
- Editar
- Eliminar

---

#### Sección: Documento de Identidad

Acciones:
- Botón **Agregar documento**

Tabla:
- Item
- Número
- Documento
- Editar
- Eliminar

---

## 3. Requisitos Técnicos

- SAPUI5 Freestyle.
- Patrón MVC.
- Uso de:
  - `sap.m`
  - `sap.uxap.ObjectPageLayout`
- Modelos:
  - `i18n`
  - `viewModel` (estado UI: busy, modo, paginación, contador)
  - `dataModel` (proveedores, invitaciones, catálogos)

### Catálogos (listas)
Deben cargarse desde modelos mock:
- Tipo proveedor
- Tipo documento
- Tipo empresa
- Clase empresa
- Nacionalidad
- Departamento / Provincia / Distrito
- Grupo tesorería
- Grupo cuenta
- Tipo impuesto
- Esquema
- Débito automático
- Moneda
- Condición de pago
- Estado contribuyente
- Clasificador

---

## 4. Mock Data

Crear archivos en `/localService/mockdata/`:

- Proveedores:
  - Mínimo **25 registros** (para paginación).
- Invitaciones:
  - Mínimo **8 registros** (mezcla Invitado / Confirmado).

Opcional:
- MockServer con OData V2/V4 si se considera necesario.

---

## 5. Funcionalidades obligatorias

- Búsqueda combinada (filtros + texto libre).
- Paginación (10 registros).
- Exportación de datos.
- CRUD completo de proveedores.
- Validaciones básicas (campos obligatorios, email).
- Confirmación al eliminar (`MessageBox.confirm`).
- Modo solo lectura en Visualizar.
- Contador dinámico de invitaciones pendientes.
- Uso de `BusyIndicator`, `MessageToast` y `MessageBox`.

---

## 6. Entregables esperados

El agente debe generar:

- Estructura de archivos sugerida.
- Código completo para:
  - `manifest.json` (routing, modelos).
  - `Component.js`.
  - Vistas XML y controladores:
    - Main
    - Invitations
    - InvitationCreate
    - SupplierDetail
  - Fragments reutilizables:
    - Referencias
    - Indicadores
    - Documentos
- Archivos JSON mock con datos de ejemplo.
- Implementación de exportación.
- Instrucciones básicas para ejecutar y probar la app localmente.

---

## 7. Restricciones

- No usar librerías externas.
- No depender de backend real.
- Código claro, comentado y consistente.
- Seguir buenas prácticas SAPUI5.

---

**Genera la solución completa archivo por archivo, comenzando por la estructura y continuando con el código.**
