var phantom = require('phantom');

phantom.create(function (ph) {
  ph.createPage(function (page) {
  	 console.log("opened page? ", status);
    page.open("https://www.google.com", function (status) {
      console.log("opened google? ", status);
      page.evaluate(function () { return document.title; }, function (result) {
        console.log('Page title is ' + result);
        ph.exit();
      });
    });
  });
});