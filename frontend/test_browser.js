const { JSDOM } = require('jsdom');

JSDOM.fromURL('http://127.0.0.1:8080/', {
  runScripts: "dangerously",
  resources: "usable"
}).then(dom => {
  const window = dom.window;

  window.console.error = (...args) => {
    console.error("BROWSER ERROR:", ...args);
  };
  
  window.console.warn = (...args) => {
    console.warn("BROWSER WARN:", ...args);
  };

  window.addEventListener('error', (event) => {
    console.error("UNCAUGHT ERROR:", event.error ? event.error.message : event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error("UNHANDLED REJECTION:", event.reason);
  });

  setTimeout(() => {
    console.log("Finished waiting 2 seconds");
    process.exit(0);
  }, 2000);
}).catch(err => {
  console.error("JSDOM setup error:", err);
});
