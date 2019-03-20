const importantFunction = require("@testtest/bar-package");

module.exports = {
    id: "@testtest/foo-package",
    autoStart: true,
    activate: (app) => {
        console.log("Loaded the @testtest/foo-package package!");
        console.log(importantFunction());
    }
}