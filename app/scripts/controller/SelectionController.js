(function() {
	'use strict';

	var root = this;

	root.require([
		'backbone',
		'communicator',
    	'globals',
		'app',
    	'models/SelectionModel',
    	'openlayers',
    	'd3'
	],

	function( Backbone, Communicator, globals, App, m ) {

		var SelectionController = Backbone.Marionette.Controller.extend({
			model: new m.SelectionModel(),

	    initialize: function(options){

	    	var boundGetAllSelections = this.getAllSelections.bind(this);

	    	this.geoSelection = null;
	    	this.timeSelection = null;
	    	this.activeProducts = [];

	    	globals.objects.add('color', d3.scale.category10());
	      	this.model.set('selections', []);
	      	this.colors = globals.objects.get("color");

	      	// Openlayers format readers for loading geojson selections
			var io_options = {
				'internalProjection': new OpenLayers.Projection('EPSG:4326'),
				'externalProjection': new OpenLayers.Projection('EPSG:4326')
			};

			this.geojson = new OpenLayers.Format.GeoJSON(io_options);
			//this.colors = d3.scale.category10();


	        this.listenTo(Communicator.mediator, "selection:changed", this.onSelectionChange);
	        this.listenTo(Communicator.mediator, "map:load:geojson", this.onLoadGeoJSON);
	        this.listenTo(Communicator.mediator, "map:layer:change", this.onChangeLayer);
	        this.listenTo(Communicator.mediator, 'time:change', this.onTimeChange);

	        Communicator.reqres.setHandler('selections:get:all', boundGetAllSelections);
		
		},

		getAllSelections: function () {
			return {
	        	geo: this.geoSelection,
	        	time: this.timeSelection,
	        	actProd: this.activeProducts
	        };
		},

	    onSelectionChange: function(selection) {
	        if (selection != null) {
	        	this.geoSelection = selection.geometry.getBounds();
	        }else{
	        	this.geoSelection = null;
	        }
		},

		onTimeChange: function(time) {
			this.timeSelection = time;
		},

		onChangeLayer: function (options) {
			console.log(options);
	        if (!options.isBaseLayer){
	            var layer = globals.products.find(function(model) { return model.get('name') == options.name; });
	            if (layer) { // Layer will be empty if it is an overlay layer
					
		        	if(options.visible){
		        		this.activeProducts.push(layer.get('download').id);
		          	}else{
		          		var index = this.activeProducts.indexOf(layer.get('download').id);
		          		if (index > -1) {
						    this.activeProducts.splice(index, 1);
						}
		          	}
	            }
	        }
	    },

		
		onLoadGeoJSON: function(data) {
			
			var features = this.geojson.read(data);
			var bounds;
			if (features) {
				if (features.constructor != Array) {
					features = [features];
				}
				for (var i = 0; i < features.length; ++i) {
					if (!bounds) {
						bounds = features[i].geometry.getBounds();
					} else {
						bounds.extend(features[i].geometry.getBounds());
					}
					Communicator.mediator.trigger("selection:activated",false);
					//var color = this.colors(i);
					//features[i].style = {fillColor: color, pointRadius: 6, strokeColor: color, fillOpacity: 0.5};
					//Communicator.mediator.trigger("selection:changed", features[i]);
					var color = this.colors(i);
					Communicator.mediator.trigger("selection:changed", features[i], this._convertCoordsFromOpenLayers(features[i].geometry, 0), color);
				}
				
				
				
				//this.vectorLayer.addFeatures(features);
				//this.map.zoomToExtent(bounds);
			}
		},

		_convertCoordsFromOpenLayers: function(openlayer_geometry, altitude) {
            var verts = openlayer_geometry.getVertices();

            var coordinates = [];
            for (var idx = 0; idx < verts.length - 1; ++idx) {
                var p = {
                    x: verts[idx].x,
                    y: verts[idx].y,
                    z: altitude // not mandatory, can be undefined
                };

                coordinates.push(p);
            }
            var p = {
                x: verts[idx].x,
                y: verts[idx].y,
                z: altitude // not mandatory, can be undefined
            };

            coordinates.push(p);

            return coordinates;
        }


		});
		return new SelectionController();
	});

}).call( this );