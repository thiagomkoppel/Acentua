const runtime = createRuntime();

attachQueuedInputHandler(runtime);
attachStorageRefresh(runtime);
runtime.catch(reportInitializationError);

function attachQueuedInputHandler(runtimePromise) {
  document.addEventListener("input", queueInput(runtimePromise), true);
}

function queueInput(runtimePromise) {
  return (event) => handleQueuedInput(runtimePromise, event);
}

function handleQueuedInput(runtimePromise, event) {
  return runtimePromise
    .then(({ handler }) => handler(event))
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
  const [{ createCorrectionHandler }, { loadCorrectionState }] =
    await loadModules();
  const state = createStateLoader(loadCorrectionState);
  return runtimeFor(createCorrectionHandler, state);
}

function createStateLoader(loadCorrectionState) {
  let promise = loadCorrectionState();
  return {
    get: () => promise,
    refresh: () => (promise = loadCorrectionState()),
  };
}

function runtimeFor(createCorrectionHandler, state) {
  return {
    handler: createCorrectionHandler({ getState: state.get }),
    refresh: state.refresh,
  };
}

function loadModules() {
  return Promise.all([
    import(extensionUrl("src/content/correction-controller.js")),
    import(extensionUrl("src/correction/dictionary-loader.js")),
  ]);
}

function extensionUrl(path) {
  return chrome.runtime.getURL(path);
}

function reportInitializationError() {
  console.warn("Acentua could not initialize.");
}
