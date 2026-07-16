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
  const [correction, { loadCorrectionState }, { createSuggestionManager }] =
    await loadModules();
  const state = createStateLoader(loadCorrectionState);
  return runtimeFor(correction, createSuggestionManager, state);
}

function createStateLoader(loadCorrectionState) {
  let current = null;
  const store = (state) => storeCurrent(state, (value) => (current = value));
  let promise = loadCorrectionState().then(store);
  return {
    get: () => promise,
    getCurrent: () => current,
    refresh: () => (promise = loadCorrectionState().then(store)),
  };
}

function storeCurrent(state, setCurrent) {
  setCurrent(state);
  return state;
}

function runtimeFor(correction, createSuggestionManager, state) {
  const suggestions = createSuggestionManager();
  const options = correctionOptions(state, suggestions);
  return runtimeHandlers(correction, suggestions, options, state.refresh);
}

function runtimeHandlers(correction, suggestions, options, refresh) {
  const correctionKeydown = correction.createCorrectionKeydownHandler(options);
  return {
    handler: correction.createCorrectionHandler(options),
    keydown: keydownHandler(suggestions.handleKeydown, correctionKeydown),
    refresh,
  };
}

function correctionOptions(state, suggestions) {
  return {
    getCurrentState: state.getCurrent,
    getState: state.get,
    suggestions,
  };
}

function keydownHandler(suggestionsKeydown, correctionKeydown) {
  return (event) => {
    suggestionsKeydown(event);
    correctionKeydown(event);
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
