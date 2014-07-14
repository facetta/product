"use strict";
var util = require('util'),
  Product = require('./model/product'),
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
  this.setCommonAttributes( options );

  // set the model
  this.Model = new Product( this.options );

  // this.manifest = [
  //   { verb: 'GET', route: '/:productId', evt: 'facet:product:find' },
  //   '': 'facet:product:find',
  // ]

  this.setupRouterManifest();

  // register the api events
  this.registerEvents();
};


/**
 * Product API inherits from Core API
 */
util.inherits(ProductAPI, CoreAPI);


/**
 * Sets up the router manifest for route automation
 *
 * @return   {void}
 */
ProductAPI.prototype.setupRouterManifest = function () {
  this.routerManifest = {
    apiModelId: 'productId', // this is the id for this module 
    routeBase: '/products',  // this can be overwritten
    routes: [
      { verb: 'GET',    route: '/:productId', emit: 'facet:product:find'   },  // GET a single Product by id
      { verb: 'GET',    route: '',            emit: 'facet:product:find'   },  // GET an array of Product objects 
      { verb: 'POST',   route: '',            emit: 'facet:product:create' },  // POST new Product
      { verb: 'PUT',    route: '/:productId', emit: 'facet:product:update' },  // PUT single/multiple Products
      { verb: 'DELETE', route: '/:productId', emit: 'facet:product:delete' },  // DELETE a single Product resource
    ]
  };
}


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
    var queryBuilder = this.Model.findOne({_id: query.id}, query.fields, query.options);
  }
  else {
    var queryBuilder = this.Model.find(query.conditions, query.fields, query.options);
  }

  var returnPromise = new this.options.db.Promise();

  this.intercom.emit('facet:intercom:check:access', 'facet:product:find', this.makeCheckAccessCb(queryBuilder, returnPromise, successCb, errorCb));

  return returnPromise;
};


/**
 * [makeCheckAccessCb description]
 *
 * @param    {[type]}   queryBuilder    [description]
 * @param    {[type]}   returnPromise   [description]
 * @param    {[type]}   successCb       [description]
 * @param    {[type]}   errorCb         [description]
 *
 * @return   {[type]}                   [description]
 */
ProductAPI.prototype.makeCheckAccessCb = function (queryBuilder, returnPromise, successCb, errorCb) {
  var _this = this;

  var checkAccessCb = function checkAccessCb(allow){
    // console.log('allow in checkAccessCb: ', allow);

    if(allow === true) {
      var promise = queryBuilder.exec();
      var result = _this.respond('facet:response:product:data', promise, 'No products matched your criteria.', successCb, errorCb);

      if( result !== undefined ) {
        result.then(function(data) {
          returnPromise.fulfill(data);
        });
      }
    }
    else {
      var promise = new _this.options.db.Promise();
      promise.reject('Insufficient privileges to perform this action.');

      var result = _this.respond('facet:response:error', promise, '', successCb, errorCb);

      // console.log('result in checkAccessCb: ', result);
      
      if( result !== undefined ) {
        result.then(null, function(err) {
          returnPromise.reject(err);
        });  
      }
    }
  };

  return checkAccessCb;
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
  if( typeof query === undefined || query === null || !query.hasOwnProperty('conditions') ) {
    this.intercom.emit('facet:response:error', 400, 'No query conditions were specified');
    return Promise.reject('No query conditions were specified');
  }

  if( typeof query.fields === undefined || query.fields === null ) {
    query.fields = '';
  }

  if( typeof query.options === undefined || query.options === null ) {
    query.options = {};
  }

  if( _.isEmpty(query.options.lean) ) {
    query.options.lean = false;
  }

  var queryBuilder = this.Model.findOne(query.conditions, query.fields, query.options);

  if( !_.isEmpty(query.populate) ) {
    if( _.isArray(query.populate) ) {
      for (var i = query.populate.length - 1; i >= 0; i--) {
        queryBuilder.populate(query.populate[i]);
      };
    }
    else {
      queryBuilder.populate(query.populate);
    }
  }

  var successCb = function(result){
    var promise = queryBuilder.exec();
    var result = this.respond( 'facet:response:product:data', promise, 'No product matched your criteria.', successCb, errorCb );

    if( typeof result !== 'undefined' ) {
      return result;
    }
  };

  var result = this.intercom.emit('facet:intercom:check:access', 'facet:product:findone', successCb);

  if( typeof result !== 'undefined' ) {
    return result;
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
    return Promise.reject('No query conditions were specified');
  }

  if( !query.hasOwnProperty('updates') ) {
    this.intercom.emit('facet:response:error', 400, 'No updates were specified');
    return Promise.reject('No updates were specified');
  }

  if( typeof query.options === undefined || query.options === null ) {
    query.options = {};
  }
  
  var _this = this;

  var successCb = function(result){
    var promise = _this.Model.update(query.conditions, query.updates, query.options).exec();
    var result = _this.respond( 'facet:response:product:update', promise, 'No products were updated based on your criteria.', successCb, errorCb );      

    if( typeof result !== 'undefined' ) {
      return result;
    }
  };

  var result = this.intercom.emit('facet:intercom:check:access', 'facet:product:update', successCb);

  if( typeof result !== 'undefined' ) {
    return result;
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
    return Promise.reject('No data supplied for creating new user');
  }

  var successCb = function(result){
    var promise = this.Model.create(data);
    var result = this.respond( 'facet:response:product:create', promise, 'No product was created based on your criteria.', successCb, errorCb );

    if( typeof result !== 'undefined' ) {
      return result;
    }
  };

  var result = this.intercom.emit('facet:intercom:check:access', 'facet:product:create', successCb);

  if( typeof result !== 'undefined' ) {
    return result;
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
    return Promise.reject('No conditions specified for remove operation');
  }
  
  var successCb = function(result){
    var promise = this.Model.remove(conditions).exec();
    var result = this.respond( 'facet:response:product:remove', promise, 'No product was removed based on your criteria.', successCb, errorCb );

    if( typeof result !== 'undefined' ) {
      return result;
    } 
  };

  var result = this.intercom.emit('facet:intercom:check:access', 'facet:product:delete', successCb);

  if( typeof result !== 'undefined' ) {
    return result;
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
  
  // set the router to bind
  this.router = router;

  // register application routes
  // this.intercom.bindApplicationRoutes(routeBase, {
  //   '/': 'facet:product:find'
  // });

  // set the route base
  this.routerManifest.routeBase = routeOptions.route;

  // bind the router manifest
  this.bindRouterManifest();

  // return the bound router
  return this.router;
};

/**
 * Exports the Product API
 *
 * @type   {Object}
 */
exports = module.exports = ProductAPI;
