(function() {
	'use strict';

	var root = this;

	root.define([
		'backbone',
		'globals',
		'communicator',
		'models/LayerModel',
		'hbs!tmpl/LayerControl',
		'underscore'
	],

	function( Backbone, globals, Communicator, m, LayerControlTmpl ) {

		var LayerControlLayout = Backbone.Marionette.Layout.extend({

			template: {type: 'handlebars', template: LayerControlTmpl},
			regions: {
				baseLayers: "#baseLayers",
				products: "#products",
				overlays: "#overlays"
			},
			className: "panel panel-default layercontrol not-selectable",
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

					this.$el.find(".panel-body").droppable({
						activeClass: "highlight-droppable",
			      drop: function( event, ui ) {
							var inc = ui.draggable[0];
							var node = $(inc.childNodes[3]);
			        var id = node.data("id");
							var baseurl = node.data("baseurl");

							var parameters = {};
							var cnt = 0;
							node.find("#rangecollection > li > ul").each(function() {
								parameters[$(this).data("name")] = {
									name: $(this).data("description"),
									range: $(this).data("allowedvalues").split(",").map(function (val) { return Number(val); }),
									colorscale: "viridis",
									uom: "Undefined"
								}
								if(cnt == 0){
									parameters[$(this).data("name")]["selected"] = true;
								}
								cnt++;
							});

							globals.products.add(
								new m.LayerModel({
									name: id,
									visible: false,
									timeSlider: true,
									timeSliderProtocol: "WPS",
									color: "#ff0000",
									opacity: 1,
									views: [{
				                "id": id,
				                "protocol": "WCS",
				                "urls": [baseurl]
									}],
									view: {isBaseLayer: false},
									download: {
										id: id,
										protocol: "WCS",
										url: baseurl
									},
									parameters: parameters
			            /*,
									unit: product.unit,
									parameters: product.parameters,
									height: product.height,
									outlines: product.outlines,
									model: product.model,
									coefficients_range: product.coefficients_range,
									satellite: product.satellite*/
								})
							);

			      }
			    });
		    },

			onClose: function() {
				this.close();
			}

		});

		return LayerControlLayout;

	});

}).call( this );
