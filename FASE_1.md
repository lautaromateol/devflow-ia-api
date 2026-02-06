# Fase 1: MVP - Fundamentos

**Duración estimada:** Semanas 1-4  
**Estado:** 🚧 En desarrollo

## 🎯 Objetivo de la Fase

Establecer la funcionalidad básica end-to-end del sistema: desde la entrada de un repositorio hasta la generación y descarga de un README funcional. Esta fase sienta las bases técnicas para futuras iteraciones más sofisticadas.

## 📦 Componentes a Desarrollar

### 1. Analizador de Código Básico

**Responsabilidad:** Extraer información fundamental del repositorio para generar documentación básica pero útil.

**Funcionalidades:**
- Detectar el lenguaje de programación principal del proyecto
- Identificar la estructura de carpetas y archivos clave (src, lib, components, etc.)
- Extraer dependencias de archivos de configuración:
  - `package.json` (Node.js)
  - `requirements.txt` (Python)
  - `composer.json` (PHP)
  - `pom.xml` (Java)
  - Otros gestores de paquetes comunes

**Salida esperada:**
```json
{
  "language": "JavaScript",
  "packageManager": "npm",
  "dependencies": [...],
  "structure": {
    "directories": [...],
    "keyFiles": [...]
  }
}
```

### 2. Generador de README Simple

**Responsabilidad:** Crear documentación README estructurada y profesional a partir del análisis del código.

**Funcionalidades:**
- Plantilla básica con secciones estándar:
  - **Título del proyecto**
  - **Descripción** (derivada del package.json o inferida)
  - **Instalación** (comandos automáticos según gestor de paquetes)
  - **Uso** (comandos básicos de ejecución)
  - **Estructura del proyecto** (opcional)
  - **Tecnologías utilizadas**
  
- Detección automática de comandos de instalación:
  - npm: `npm install`
  - yarn: `yarn install`
  - pip: `pip install -r requirements.txt`
  - composer: `composer install`

- Generación de badges básicos:
  - Lenguaje de programación
  - Licencia (si está definida)
  - Estado del build (placeholder)

**Ejemplo de salida:**
```markdown
# Mi Proyecto

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Descripción
[Descripción generada automáticamente]

## Instalación
npm install

## Uso
npm start
```

### 3. Interfaz Web Básica

**Responsabilidad:** Proporcionar una experiencia de usuario simple y directa para generar documentación.

**Componentes UI:**

1. **Input de repositorio**
   - Campo de texto para URL del repositorio
   - Soporte para GitHub y GitLab
   - Validación básica de URL

2. **Botón de generación**
   - Estado de carga durante el procesamiento
   - Feedback visual del progreso

3. **Preview del README**
   - Renderizado en tiempo real del Markdown generado
   - Modo de edición básica (opcional para MVP)

4. **Botón de descarga**
   - Descarga directa del archivo `README.md`
   - Formato: Markdown (.md)

**Flujo de usuario:**
```
1. Usuario ingresa URL del repo
   ↓
2. Click en "Generar documentación"
   ↓
3. Sistema analiza el código (loading...)
   ↓
4. Preview del README generado
   ↓
5. Usuario descarga o copia el README
```

## ✅ Criterios de Éxito

La Fase 1 se considera completada cuando:

1. ✅ El sistema puede analizar correctamente un repositorio de Node.js estándar
2. ✅ Se genera un README con todas las secciones básicas pobladas
3. ✅ El usuario puede descargar el README en formato Markdown
4. ✅ El proceso completo (input → generación → descarga) funciona sin errores
5. ✅ La interfaz es usable y responsiva

**Repositorio de prueba:** Un proyecto Next.js típico con package.json y estructura estándar.

## ⚠️ Limitaciones Conocidas

Lo que **NO** incluye esta fase:

- ❌ Personalización de tono (técnico, friendly, corporativo)
- ❌ Múltiples formatos de exportación (HTML, Notion, Confluence)
- ❌ Documentación de APIs o endpoints
- ❌ Generación de comentarios JSDoc/docstrings
- ❌ Análisis profundo de código (arquitectura, patrones)
- ❌ Soporte para lenguajes más allá de Node.js/Python básicos
- ❌ Extensión de VS Code
- ❌ Autenticación de usuarios

## 🔄 Stack Técnico - Fase 1

**Frontend (Next.js):**
- Formulario de input de repositorio
- Preview de Markdown
- Botón de descarga

**Backend (NestJS):**
- Endpoint para recibir URL de repositorio
- Servicio de análisis de código
- Servicio de generación de README
- Respuesta con contenido Markdown generado

**Integraciones:**
- API de GitHub/GitLab para clonar repositorios (o análisis directo vía API)
- Librería de parsing de package managers

## 📈 Siguiente Paso: Fase 2

Una vez completada la Fase 1, el MVP estará funcional. La **Fase 2** se enfocará en:

- Análisis más profundo de código (arquitectura, flujos)
- Generación de documentación de APIs
- Personalización de tono y estilo
- Soporte para más lenguajes y frameworks
- Exportación a múltiples formatos

---

**Metodología:** Vibe coding - Desarrollo iterativo enfocado en resultados tangibles y feedback rápido.