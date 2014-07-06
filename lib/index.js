"use strict";
var util = require('util'),
  CoreAPI = require('facet-core');

/**
 * Product API constructor
 *
 * @param   {Object}  options   Options object - must contain 'db' (mongoose instance)
 *                              and 'intercom' (EventEmitter instance) keys.
 *                              
 * @return  {void} 
 */
var ProductAPI = function ( options ){
  
  // set the options
  this.setOptions( options );

  // register the api events
  this.registerEvents();
};

/**
 * Product API inherits from Core API
 */
util.inherits(ProductAPI, CoreAPI);

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
  this.intercom.on('facet:product:find', this.find.bind(this) );
  this.intercom.on('facet:product:findone', this.findOne.bind(this) );
  this.intercom.on('facet:product:create', this.create.bind(this) );
  this.intercom.on('facet:product:update', this.update.bind(this) );
  this.intercom.on('facet:product:remove', this.remove.bind(this) );
};

/**
 * Find Product documents with requested fields based on query and options
 *
 * @param    {Object}     query       contains fields for conditions, fields, and options
 * @param    {Function}   successCb   custom function for handling success call backs
 * @param    {Function}   errorCb     custom function for handling error call backs
 *
 * @return   {void}
 */
ProductAPI.prototype.find = function( query, successCb, errorCb ){

  if( typeof query === undefined || query === null ) {
    query = {
      conditions: {}
    };
  }

  if( typeof query.fields === undefined || query.fields === null ) {
    query.fields = '';
  }

  if( typeof query.options === undefined || query.options === null ) {
    query.options = {};
  }

  // query.options.lean = false;

  if( query.hasOwnProperty('id') ) {
    var queryBuilder = this.Product.findOne({_id: query.id}, query.fields, query.options);
  }
  else {
    var queryBuilder = this.Product.find(query.conditions, query.fields, query.options);
  }

  var promise = queryBuilder.exec();
  this.respond( 'facet:response:product:data', promise, 'No products matched your criteria.', successCb, errorCb)
};


/**
 * Find one Product document with requested fields based on query and options
 *
 * @param    {Object}     query       contains fields for conditions, fields, and options
 * @param    {Function}   successCb   custom function for handling success call backs
 * @param    {Function}   errorCb     custom function for handling error call backs
 *
 * @return   {void}
 */
ProductAPI.prototype.findOne = function(query, successCb, errorCb) {
  if( typeof query === undefined || query === null || !query.conditions ) {
    this.intercom.emit('facet:response:error', 400, 'No query conditions were specified');
  }
  else {
    if( typeof query.fields === undefined || query.fields === null ) {
      query.fields = '';
    }

    if( typeof query.options === undefined || query.options === null ) {
      query.options = {};
    }

    // query.options.lean = false;

    var promise = this.Product.findOne(query.conditions, query.fields, query.options).exec();
    this.respond( 'facet:response:product:data', promise, 'No product matched your criteria.', successCb, errorCb );
  }
};


/**
 * Updates Product documents with requested fields based on query and options
 *
 * @param    {Object}     query       contains fields for conditions, fields, and options
 * @param    {Function}   successCb   custom function for handling success call backs
 * @param    {Function}   errorCb     custom function for handling error call backs
 *
 * @return   {void}
 */
ProductAPI.prototype.update = function(query, successCb, errorCb) {
  if( typeof query === undefined || query === null || !query.hasOwnProperty('conditions') ) {
    this.intercom.emit('facet:response:error', 400, 'No query conditions were specified');
  }
  else {
    if( !query.hasOwnProperty('updates') ) {
      this.intercom.emit('facet:response:error', 400, 'No updates were specified');
    }
    else {
      if( typeof query.options === undefined || query.options === null ) {
        query.options = {};
      }
      
      var promise = this.Product.update(query.conditions, query.updates, query.options).exec();
      this.respond( 'facet:response:product:update', promise, 'No products were updated based on your criteria.', successCb, errorCb );      
    }
  }
};


/**
 * Creates one or more Products
 *
 * @param    {Object|Array}   data        either object w/ Product properties
 *                                        or array containing such objects
 * @param    {Function}       successCb   custom function for handling success call backs
 * @param    {Function}       errorCb     custom function for handling error call backs
 *
 * @return   {void}
 */
ProductAPI.prototype.create = function(data, successCb, errorCb) {
  if( !data || _.isEmpty(data) ) {
    this.intercom.emit('facet:response:error', 400, 'No data supplied for creating new user.');
  }
  else {
    var promise = this.Product.create(data);
    this.respond( 'facet:response:product:create', promise, 'No product was created based on your criteria.', successCb, errorCb );  
  }
};


/**
 * Removes Product documents with requested fields based on query and options
 *
 * @param    {Object}     query       contains fields for conditions, fields, and options
 * @param    {Function}   successCb   custom function for handling success call backs
 * @param    {Function}   errorCb     custom function for handling error call backs
 *
 * @return   {void}
 */
ProductAPI.prototype.remove = function(conditions, successCb, errorCb) {
  if( typeof conditions === undefined || conditions === null ) {
    this.intercom.emit('facet:response:error', 400, 'No conditions specified for remove operation.');
  }
  else {
    var promise = this.Product.remove(conditions).exec();
    this.respond( 'facet:response:product:remove', promise, 'No product was removed based on your criteria.', successCb, errorCb );
  }
};

/**
 * Binds the routes to the provided router instance.
 *
 * @param    {Object}   router        Router instance (express, koa, custom, etc)
 * @param    {Ojbect}   routeOptions  Options for route setup.
 *
 * @return   {void}
 */
ProductAPI.prototype.bindRoutes = function( router, routeOptions ) {
  this.router = router;
  var _this = this, 
    routeBase = routeOptions.route;

  // 
  this.router.route( routeBase + '/:productId' )
    .get( function ( req, res, next ) {
      var query = {
        id: req.params.productId
      };

      _this.intercom.emit('facet:product:find', query);
    })
};

/**
 * Exports the Product API
 *
 * @type   {Object}
 */
exports = module.exports = ProductAPI;
