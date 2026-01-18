# gymtracker

Unsere App dient dazu, das Training im Fitnessstudio zu tracken. Über den Reiter „Übungen“ kann sich der Nutzer eine Liste aller vorhandenen Übungen anzeigen lassen. In dieser Liste können Übungen gelöscht, bearbeitet oder neue Übungen hinzugefügt werden, zum Beispiel wenn man im Fitnessstudio eine neue Übung ausführt. Zusätzlich besteht die Möglichkeit, die Übungen nach Kategorien zu sortieren, um eine übersichtlichere Darstellung zu erhalten.

Über den Reiter „Workout starten“ kann ein neues Workout angelegt werden. Dafür wählt man zunächst ein Datum aus, vergibt einen Titel und startet das Workout per Klick auf „Workout starten“. Innerhalb dieses Workouts kann man über den Button „Übungen hinzufügen“ eine Übung aus der bestehenden Übungsliste auswählen. Auch hier lassen sich die Übungen nach Kategorien filtern oder es können neue Übungen hinzugefügt werden, falls diese noch nicht in der Liste vorhanden sind.

Nach der Auswahl einer Übung können die Wiederholungen und das verwendete Gewicht eingetragen, sowie zusätzliche Sätze hinzugefügt werden. Ist man mit einer Übung fertig, bestätigt man dies mit „Übung fertig“. Anschließend kann man entweder weitere Übungen zum Workout hinzufügen oder das Workout über „Workout beenden“ abschließen.

Nach dem Beenden eines Workouts gelangt man automatisch zum letzten Reiter der App, dem „Workout Verlauf“. Dort wird eine Übersicht aller absolvierten Workouts angezeigt, inklusive aller Übungen, Sätze, Gewichte und Wiederholungen. In diesem Bereich können Workouts auch gelöscht werden, zum Beispiel wenn man sie nicht mehr in der Übersicht behalten möchte oder ein Workout versehentlich angelegt wurde.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
