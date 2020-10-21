(function() {
	'use strict';

	var root = this;

	root.define([
		'backbone',
		'communicator',
		'hbs!tmpl/DataManagement',
		'app',
		'globals',
		'underscore'
	],

	function( Backbone, Communicator, DataManagementTmpl, App, globals ) {

		var DataManagementLayout = Backbone.Marionette.Layout.extend({

			template: {type: 'handlebars', template: DataManagementTmpl},
			regions: {
				products: "#products"
			},
			className: "panel panel-default datamanagement not-selectable",
			events: {},

			initialize: function(options) {
			},

			onShow: function(view){
		    	this.$('.close').on("click", _.bind(this.onClose, this));
		    	this.$el.draggable({
		    		handle: '.panel-heading',
		    		containment: "#main" ,
		    		scroll: false,
		    		start: function(event, ui) {
						$( ".ui-slider" ).detach();
						$('.fa-adjust').toggleClass('active')
						$('.fa-adjust').popover('hide');
					},
		    	});

		    	var that = this;
		    	this.$('#searchinput').on('input', function(evt){
		    		//that.products.currentView.collection = globals.products.filterElements($(this).val());
		    		//App.productsView.collection = globals.products.filterElements($(this).val());
		    		that.products.currentView.collection = (globals.products.filterElements($(this).val()));
		    		that.products.currentView.render();
		    		//console.log($(this).val());
		    	});

		    	this.$('#selectAllProducts').off();
				this.$('#unselectAllProducts').off();

				this.$('#selectAllProducts').on('click', function(){
					globals.products.each(function(prod){
						prod.set('favourite', true);
					});
					that.products.currentView.render();
					globals.favouritesView.collection = globals.products.favourites();
					var favs = [];
			    	for (var i = 0; i < globals.favouritesView.collection.models.length; i++) {
			    		favs.push(globals.favouritesView.collection.models[i].get('download').id);
			    	}
	                localStorage.setItem('favourite', JSON.stringify(favs));
	                globals.favouritesView.render();
				});
				this.$('#unselectAllProducts').on('click', function(){
					globals.products.each(function(prod){
						prod.set('favourite', false);
				    	prod.set('display', false);
				    	var options = { id: prod.get("download").id, name: prod.get('name'), isBaseLayer: false, visible: false };
				    	Communicator.mediator.trigger('map:layer:change', options);
					});
					that.products.currentView.render();
					globals.favouritesView.collection = globals.products.favourites();
					var favs = [];
			    	for (var i = 0; i < globals.favouritesView.collection.models.length; i++) {
			    		favs.push(globals.favouritesView.collection.models[i].get('download').id);
			    	}
	                localStorage.setItem('favourite', JSON.stringify(favs));
	                globals.favouritesView.render();
				});
		    },

			onClose: function() {
				if(this.products){
					this.products.currentView.collection = globals.products;
				}
				this.close();
			}

		});

		return DataManagementLayout;

	});

}).call( this );
