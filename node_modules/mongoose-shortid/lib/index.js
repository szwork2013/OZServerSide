var mongoose = require('mongoose');
var ShortId = require('./shortid');

var defaultSave = mongoose.Model.prototype.save;
mongoose.Model.prototype.save = function(cb) {
    if (this.isNew && this._id === undefined) {
        var idType = this.schema.tree['_id'];

        if (idType === ShortId || idType.type === ShortId) {
            var idInfo = this.schema.path('_id');
            var retries = idInfo.retries;
            var self = this;
            function attemptSave() {
                idInfo.generator(idInfo.generatorOptions, function(err, id) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    self._id = id;
                    defaultSave.call(self, function(err, obj) {
                        if (err &&
                            err.code == 11000 &&
                            err.err.indexOf('_id') !== -1 &&
                            retries > 0
                        ) {
                            --retries;
                            attemptSave();
                        } else {
                            // TODO check these args
                            cb(err, obj);
                        }
                    });
                });
            }
            attemptSave();
            return;
        }
    }

    defaultSave.call(this, cb);
};

module.exports = exports = ShortId;
