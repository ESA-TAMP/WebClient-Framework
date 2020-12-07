(function() {
	'use strict';

	var root = this;

	root.require([
		'backbone',
		'communicator',
    	'globals',
		'app'
	],

	function( Backbone, Communicator, globals, App) {

		var LayerController = Backbone.Marionette.Controller.extend({

		    initialize: function(options){
		        //this.listenTo(Communicator.mediator, "ui:open:layercontrol", this.onLayerControlOpen);
		        this.listenTo(Communicator.mediator, "layer:activate", this.layerActivate);
		        this.listenTo(Communicator.mediator, "layer:deactivate", this.layerDeactivate);
		        this.listenTo(Communicator.mediator, "app:reset", this.OnAppReset);
		        this.layercontrolopen = false;
			},

			/*onLayerControlOpen: function () {
		       this.layercontrolopen = !this.layercontrolopen;
		       if(this.layercontrolopen){
		       		this.stopListening(Communicator.mediator, "ui:open:layercontrol");
		       }else{
		       		this.listenTo(Communicator.mediator, "ui:open:layercontrol", this.onLayerControlOpen);
		       }
		    },*/

		   	layerActivate: function(layerId){

	            var layer = globals.products.find(function(model) { 
	            	if(model.get('views'))
	            		return model.get('views')[0].id == layerId;
	            	else 
	            		return false; 
	            });

	            if (typeof layer === 'undefined'){
		            // See if layer is overlay
	                layer = globals.overlays.find(function(ov) {
	                  return ov.get('view').id === layerId;
	                });
	            }

	            var options = {};
	            if (layer) {
		        	if(!layer.get('visible')){
		            	options = { name: layer.get('name'), isBaseLayer: false, visible: true };
		            	layer.set('visible',true);
		          		Communicator.mediator.trigger('map:layer:change', options);
		          	}
	            }
			    
			},
			layerDeactivate: function(layerId){

	            var layer = globals.products.find(function(model) { 
	            	if(model.get('views'))
	            		return model.get('views')[0].id == layerId;
	            	else 
	            		return false; 
	            });

	            if (typeof layer === 'undefined'){
		            // See if layer is overlay
	                layer = globals.overlays.find(function(ov) {
	                  return ov.get('view').id === layerId;
	                });
	            }

	            var options = {};
	            if (layer) {
		        	if(layer.get('visible')){
		        		options = { name: layer.get('name'), isBaseLayer: false, visible: false };
		        		layer.set('visible',false);
		          		Communicator.mediator.trigger('map:layer:change', options);
		          	}
	            }
			    
			},

			OnAppReset: function(){
				globals.products.each(function(layer){
					if(layer.get('visible')){
		        		var options = { name: layer.get('name'), isBaseLayer: false, visible: false };
		        		layer.set('visible',false);
		        		Communicator.mediator.trigger('map:layer:change', options);
		          	}
				});
			}
		});
		return new LayerController();
	});

}).call( this );