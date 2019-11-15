(function() {
	'use strict';

	var root = this;

	root.define([
		'backbone',
		'communicator',
		'globals',
		'underscore'
	],

	function( Backbone, Communicator, globals, UIElementTmpl ) {

		var LayerSelectionView = Backbone.Marionette.CollectionView.extend({

			tagName: "ul",

			initialize: function(options) {
				// Initially tell the models in the collection, which layer ordinal they have:
				var idx = 0;
				this.collection.forEach(function(model) {
					model.set('ordinal', idx++);
					// console.log('[LayerSeleectionView::initialize] layer: ' + model.get('view').id + ' / ordinal: ' + model.get('ordinal'));
				});
			},

			onShow: function(view){
				this.listenTo(this.collection, 'add', this.itemadded);
				this.listenTo(this.collection, 'remove', this.itemRemoved);
				this.listenTo(this.collection, 'change', this.itemchanged);
				/*"add", "remove" and "change"*/
				this.listenTo(Communicator.mediator, "productCollection:updateSort", this.updateSort);
				this.listenTo(Communicator.mediator, "map:layer:change", this.onLayerSelectionChange);

				$( ".sortable" ).sortable({
					revert: true,

					stop: function(event, ui) {
						ui.item.trigger('drop', ui.item.index());
		        	}
			    });
			},

			itemaChanged(item){
				console.log('Item changed');
				console.log(item);
				this.render();
			},

			itemadded(item){
				console.log('Item added');
				console.log(item);
				this.render();
			},

			itemRemoved(item){
				console.log('Item removed');
				console.log(item);
				this.render();
			},

			updateSort: function(options) {         
		        this.collection.remove(options.model);

		        this.collection.each(function (model, index) {
		            var ordinal = index;
		            if (index >= options.position)
		                ordinal += 1;
		            model.set('ordinal', ordinal);
		        });            

		        options.model.set('ordinal', options.position);
		        this.collection.add(options.model, {at: options.position});

		        this.render();
		        
		        Communicator.mediator.trigger("productCollection:sortUpdated");
		    },

			onLayerSelectionChange: function(options) {
				if (options.isBaseLayer){
	                globals.baseLayers.forEach(function(model, index) {
	                    model.set("visible", false);
	                });
	                globals.baseLayers.find(function(model) { return model.get('name') == options.name; }).set("visible", true);
                } else {
                    var product = globals.products.find(function(model) { return model.get('name') == options.name; });
                    if (product){
                            product.set("visible", options.visible);
                    }else{
                            globals.overlays.find(function(model) { return model.get('name') == options.name; }).set("visible", options.visible);
                    }
                }
			},
		});
		
		return {'LayerSelectionView':LayerSelectionView};
	});

}).call( this );