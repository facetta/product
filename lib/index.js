"use strict";
var util = require('util'),
  Product = require('./model/product'),
  ApiCore = require('facet-core').ApiCore;

/**
 * Product API constructor
 *
 * @param   {Object}  options   Options object - must contain 'db' (mongoose instance)
 *                              and 'intercom' (EventEmitter instance) keys.
 *                              
 * @return  {void} 
 */
var ProductAPI = function ( options ){

  // call the parent constructor
  ProductAPI.super_.call(this, options);
  
  // set the model
  this.Model = new Product( this.options );
};


/**
 * Product API inherits from Core API
 */
util.inherits(ProductAPI, ApiCore);


/**
 * Sets up the router manifest for route automation
 *
 * @return   {void}
 */
ProductAPI.prototype.setupRouterManifest = function () {
  // update the router manifest 
  this.routerManifest
    .setApiEventType('product')
    .setApiModelId('productId')
    .setRouteBase('/products')
    .addRoutes([
      { verb: 'GET',    route: '/:productId', emit: 'facet:product:findone' },  // GET a single Product by id
      { verb: 'GET',    route: '',            emit: 'facet:product:find'    },  // GET an array of Product objects 
      { verb: 'POST',   route: '',            emit: 'facet:product:create'  },  // POST new Product
      { verb: 'PUT',    route: '/:productId', emit: 'facet:product:update'  },  // PUT single/multiple Products
      { verb: 'DELETE', route: '/:productId', emit: 'facet:product:remove'  },  // DELETE a single Product resource
    ])
    .extendRouteErrorMessages({
      container: 'The API user does not have a valid container id.',
      conditions: 'No query conditions were specified',
      query: 'Error querying for product(s): ',
      notFound: 'No product was found.',
      find: 'No product(s) matched your criteria.',
      findOne: 'No product matched your criteria.',
      update: 'No updates were specified.',
      updateMatch: 'No products were updated based on your criteria.',
      create: 'No data supplied for creating new product.',
      createMatch: 'No product was created based on your criteria.',
      remove: 'No data supplied for removing product.',
      removeMatch: 'No product was removed based on your criteria.'
    });
};


/**
 * Registers the Product API event listeners
 *
 * @return   {void}
 */
ProductAPI.prototype.registerEvents = function () {  
  var _this = this;

  this.intercom.on('facet:product:data', function handleProductData( data, nodeStack ) {
    data.then( function( productData ) {
      if( null === productData ){
        _this.intercom.emit('facet:response:error', 404, 'Product was not found.');
      }
      else {
        _this.intercom.emit('facet:response:product:data', productData);
      }
    },
    function( err ) {
      _this.intercom.emit('facet:response:error', 404, 'Error querying for product(s): ' + err.message);
    }).end();
  });
  this.intercom.on( 'facet:product:find',     this.find.bind(this)    );
  this.intercom.on( 'facet:product:findone',  this.findOne.bind(this) );
  this.intercom.on( 'facet:product:create',   this.create.bind(this)  );
  this.intercom.on( 'facet:product:update',   this.update.bind(this)  );
  this.intercom.on( 'facet:product:remove',   this.remove.bind(this)  );
};


/**
 * Exports the Product API
 *
 * @type   {Object}
 */
exports = module.exports = ProductAPI;
