# GFunction Lite Web

Web oficial de GFunction Lite construida como una página estática moderna y conectada a GitHub.

## Configuración

Edita la configuración en `app.js`:

```js
const GFUNCTION_CONFIG = {
  github: {
    owner: "YOUR_GITHUB_USER_OR_ORG",
    repo: "GFunction-Lite",
    versionsFolder: "versions",
    eegFolder: "eeg",
    defaultBranch: "main"
  }
};
```

Debe introducirse:
- usuario u organización de GitHub en `owner`
- nombre del repositorio en `repo`
- carpeta donde estén las versiones en `versionsFolder`
- carpeta donde estén los EEG en `eegFolder`
- rama principal del repositorio en `defaultBranch`

## Cómo funciona

- Consulta automáticamente las GitHub Releases del repositorio.
- También consulta carpetas de GitHub si las has definido en `versionsFolder` y `eegFolder`.
- La descarga se inicia directamente desde la URL real del archivo de GitHub.
- No hay versiones ni EEG escritos manualmente en el código.

## Ejecutar localmente

Desde la carpeta del proyecto:

```bash
python -m http.server 8000
```

Después abre:

```text
http://localhost:8000
```

## Publicar

Puedes subir esta carpeta a GitHub Pages, Netlify o cualquier hosting estático.

> Importante: antes de publicar, rellena la configuración del repositorio real para que la web muestre los archivos oficiales y permita la descarga directa.
