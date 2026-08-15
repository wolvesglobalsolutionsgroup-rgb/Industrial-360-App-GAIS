# Gobernanza y Seguridad — Industrial Control 360

## Modelo de Roles y Permisos (RBAC)

Industrial Control 360 implementa 6 niveles de roles jerárquicos:

1. **Superadmin**: Control total del sistema y provisionamiento de organizaciones.
2. **Gerente de Proyecto**: Aprobación financiera de valuaciones, cierre de dossiers y gestión de contratos.
3. **Supervisor de Contrato**: Aprobación intermedia de valuaciones, liberación de permisos SIHO.
4. **Inspector / Residente**: Registro de avance físico, carga de valuaciones borrador, informes de campo y QA/QC NDT.
5. **Auditor / Cliente Externa**: Acceso de lectura fiscalizadora a través del Portal de Cliente.
6. **Operador de Campo**: Registro puntual de reportes georreferenciados y toma de fotografías.

## Políticas de Seguridad Zero Trust

- **Aislamiento Multi-Tenant**: Ningún usuario de una organización puede acceder o consultar documentos pertenecientes a otro `orgId`.
- **Validación de Claims en Token**: Los Custom Claims del token JWT de Firebase (`orgId`, `role`) determinan la autorización a nivel de reglas de seguridad Firestore (`firestore.rules`).
- **Seguridad en API Keys**: Las claves de API (incluyendo Google Gemini) residen exclusivamente en variables de entorno del servidor proxy (`server.ts` / Firebase Functions) y nunca se exponen al cliente.
