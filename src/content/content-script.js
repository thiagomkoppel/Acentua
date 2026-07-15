const runtime = createRuntime();

attachQueuedInputHandler(runtime);
attachQueuedKeydownHandler(runtime);
attachStorageRefresh(runtime);
runtime.catch(reportInitializationError);

function attachQueuedInputHandler(runtimePromise) {
  document.addEventListener("input", queueInput(runtimePromise), true);
}

function attachQueuedKeydownHandler(runtimePromise) {
  document.addEventListener("keydown", queueKeydown(runtimePromise), true);
}

function queueInput(runtimePromise) {
  return (event) => handleQueuedInput(runtimePromise, event);
}

function queueKeydown(runtimePromise) {
  return (event) => handleQueuedKeydown(runtimePromise, event);
}

function handleQueuedInput(runtimePromise, event) {
  return runtimePromise
    .then(({ handler }) => handler(event))
    .catch(reportInitializationError);
}

function handleQueuedKeydown(runtimePromise, event) {
  return runtimePromise
    .then(({ keydown }) => keydown(event))
    .catch(reportInitializationError);
}

function attachStorageRefresh(runtimePromise) {
  chrome.storage?.onChanged?.addListener(() => refreshRuntime(runtimePromise));
}

async function refreshRuntime(runtimePromise) {
  const { refresh } = await runtimePromise;
  refresh();
}

async function createRuntime() {
  const [
    { createCorrectionHandler },
    { loadCorrectionState },
    { createSuggestionManager },
  ] = await loadModules();
  const state = createStateLoader(loadCorrectionState);
  return runtimeFor(createCorrectionHandler, createSuggestionManager, state);
}

function createStateLoader(loadCorrectionState) {
  let promise = loadCorrectionState();
  return {
    get: () => promise,
    refresh: () => (promise = loadCorrectionState()),
  };
}

function runtimeFor(createCorrectionHandler, createSuggestionManager, state) {
  const suggestions = createSuggestionManager();
  return {
    handler: createCorrectionHandler({ getState: state.get, suggestions }),
    keydown: suggestions.handleKeydown,
    refresh: state.refresh,
  };
}

function loadModules() {
  return Promise.all([
    import(extensionUrl("src/content/correction-controller.js")),
    import(extensionUrl("src/correction/dictionary-loader.js")),
    import(extensionUrl("src/content/ambiguous-suggestions.js")),
  ]);
}

function extensionUrl(path) {
  return chrome.runtime.getURL(path);
}

function reportInitializationError() {
  console.warn("Acentua could not initialize.");
}
