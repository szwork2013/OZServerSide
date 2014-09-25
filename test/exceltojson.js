var node_xls = require("xls-to-json");
  node_xls({input: __dirname + '/zipcodelist.xls',output: __dirname + '/test.json'},function(err,result) {
    if(err) {
      console.error(err);
    }else{
      console.log(result);
      // result output:
      // example:
      // [{ A1: { ixfe: 63, XF: [Object], v: 1, t: 'n' },
      // A2: { ixfe: 63, XF: [Object], v: 1, t: 'n' },
      // A3: { ixfe: 63, XF: [Object], v: 10, t: 'n' },
      // A4: { ixfe: 63, XF: [Object], v: 100, t: 'n' },
      // A5: { ixfe: 63, XF: [Object], v: 1000, t: 'n' },
      // A6: { ixfe: 63, XF: [Object], v: 10000, t: 'n' },
      // A7: { ixfe: 63, XF: [Object], v: 100000, t: 'n' },
      // A8: { ixfe: 63, XF: [Object], v: 1000000, t: 'n' },
      // A9: { ixfe: 63, XF: [Object], v: 10000000, t: 'n' },
      // '!range': { s: [Object], e: [Object] },
      // '!ref': 'A1:B15',
      // sheetName: 'Miscellany' } ]
    }
  });