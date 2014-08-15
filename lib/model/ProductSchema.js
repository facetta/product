
var ProductSchema = function( options, CoreSchema ){

  var Schema = options.db.Schema;

  var productSchema = new CoreSchema({
    'key': { type: String, required: 'The key is required.' },
    'label': { type: String, required: 'The label field is required.' },
    'product_type': { type: String, required: 'The product_type field is required.'
      , enum: {
          values: 'simple configurable bundle digital'.split(' ')
        , message: '`{VALUE}` is not a valid enum value for path `{PATH}`'
      }
      , default: 'simple'
    },
    'products': [{ 
      type: Schema.Types.ObjectId, 
      ref: 'ProductSchema' 
    }],
    'price': { type: Number, required: 'The price field is required.' },
    'cost': { type: Number },
    'weight': { type: Number },
    'sku': { type: String },
    'short_description': { type: String },
    'description': { type: String, required: 'The description field is required.' },
    'visibility': { type: Array, default: ['search', 'catalog'] },
    'stock': { type: Number, default: 0 },
    'allow_backorder': { type: Boolean },
    'active_at': { type: Date, default: Date.now },
    'active_until': { type: Date, default: (Date.now() + (1000 * 60 * 60 * 24 * 365 * 100)) },
    'min_qty': { type: Number, default: 1 },
    'max_qty': { type: Number },
    'attributes': { type: [Schema.Types.Mixed], default: function(){ return [{}]; } },
    'files': { type: [Schema.Types.Mixed], default: function(){ return [{}]; } },
    'shippable': { type: Boolean },
    'combineable': { type: Boolean },
    'combineable_amount': { type: Number },
    'categories': [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Category' 
    }],
    'media': { type: [Schema.Types.Mixed], default: function(){ return [{}]; } },
    'custom': { type: Schema.Types.Mixed, default: function(){ return {}; } },
    'date_created': { type: Date, default: Date.now },
    'date_modified': { type: Date, default: Date.now },
    'date_deleted': { type: Date, default: null }
  });

  return productSchema; 
};

module.exports = exports = ProductSchema;

// // products
// var product = {
//     hash: <murmurhash> // formerly id, used for sharding
//   , container_id: <ref> // formerly tenant_id
//   , app_id: <ref> // formerly store_id
//   , key: <string> // tshirt_green_large
//   , label: <string> // Large Green T-Shirt
//   , product_type: <string> // simple, configurable, bundle, digital
//   , product_ids: [<product refs>] // for bundled
//   , price: <double>
//   , cost: <double>
//   , weight: <double>
//   , sku: <string>
//   , short_description: <string>
//   , description: <string>
//   , visibility: <string> //do we need this?, ie: search | catalog
//   , stock: <int>
//   , allow_backorder: <bool>
//   , active_at: <timestamp> // when to auto switch to active
//   , active_until: <timestamp> // when to auto swtich to inactive
//   , min_qty: <int> //minimum qty allowed in cart
//   , max_qty: <int> //minimum qty allowed in cart
//   , attributes: [{
//       type: <string> // ie: color, size, etc
//     , key: <string> // ie: red, green, big, small
//     , label: <string> //? 'Dragon Red', 'Mint Green', 'Biggun Size'
//     , value: <string>
//     , price_type: <string> // fixed, percentage, incremental
//     , price: <double> // ie: 10 (fixed), 0.05, +/-5
//     , weight_type: <string> // fixed, incremental ??
//     , weight: <double> // ie: 5, -.25
//     , description: <string>
//     , custom: <string>
//     , media: [{
//         type: <string> // 'image', 'video'
//       , label: <string>
//       , file: <string>
//       , url: <string>
//     }]
//   }]
//   , active: <bool> // isnt this the same as the active_at and active_until ??
//   , files: [{
//       label: <string>
//     , description: <string>
//     , path: <string>
//   }] // for digital products
//   , shippable: <bool>
//   , combineable: <bool>
//   , combineable_amount: <double>
//   , categories: [<category_refs>]
//   , media: [{
//       type: <string> // 'image', 'video'
//     , custom: <string>
//     , label: <string>
//     , file: <string>
//     , url: <string>
//   }]
//   , custom_data: {...Mixed...} //un-indexed most likely, freeform key/value storage
//   , date_created: <timestamp>
//   , date_modified: <timestamp>
//   , date_deleted: <timestamp> // soft delete
// };
