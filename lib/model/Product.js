var Schema = require('./ProductSchema');

function ProductModel(options) {
  var ProductSchema = new Schema(options)
    , ProductModel = options.db.model('Product', ProductSchema);

  return ProductModel;
};


module.exports = ProductModel;
