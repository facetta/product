var ModelSchema = require('./ProductSchema'),
  CoreSchema = require('facet-core').CoreSchema;

function ProductModel(options) {
  var ProductSchema = new ModelSchema(options, new CoreSchema(options)),
  	ProductModel = options.db.model('Product', ProductSchema);

  return ProductModel;
};


module.exports = ProductModel;
