const jasmineAsync = require('jasmine-async-suite');
jasmineAsync.install();

afterAll(() => jasmineAsync.uninstall());