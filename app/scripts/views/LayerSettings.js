(function() {
	'use strict';

	var root = this;

	root.define([
		'backbone',
		'communicator',
		'hbs!tmpl/LayerSettings',
		'underscore'
	],

	function( Backbone, Communicator, LayerSettingsTmpl ) {

		var LayerSettings = Backbone.Marionette.Layout.extend({

			template: {type: 'handlebars', template: LayerSettingsTmpl},
			className: "panel panel-default optionscontrol not-selectable",

			initialize: function(options) {
				this.selected = null;
			},

			onShow: function(view){

				this.$(".panel-title").html('<h3 class="panel-title"><i class="fa fa-fw fa-gears"></i> ' + this.model.get("name") + ' Settings</h3>');

		    	this.$('.close').on("click", _.bind(this.onClose, this));
		    	this.$el.draggable({ 
		    		containment: "#main",
		    		scroll: false,
		    		handle: '.panel-heading'
	    		});
		    	var options = this.model.get("parameters");
		    	var height = this.model.get("height");
		    	var keys = _.keys(options);
				var option = '';

				var that = this;

				_.each(keys, function(key){
					if(options[key].selected){
						that.selected = key;
				   		option += '<option value="'+ key + '" selected>' + key + '</option>';
				   	}else{
				   		option += '<option value="'+ key + '">' + key + '</option>';
				   	}
				});

				this.$("#options").append(option);

				if(options[this.selected].description){
					this.$("#description").text(options[this.selected].description);
				}

				if(options[this.selected].uom){
					this.$("#uom").text('Unit of measurement: '+ options[this.selected].uom);
				}

				this.$("#options").change(function(evt){
					that.selected = $(evt.target).find("option:selected").text();
					that.$("#range_min").val(options[that.selected].range[0]);
					that.$("#range_max").val(options[that.selected].range[1]);

					if(options[that.selected].description){
						that.$("#description").text(options[that.selected].description);
					}

					if(options[that.selected].uom){
						that.$("#uom").text('Unit of measurement: '+ options[that.selected].uom);
					}

					Communicator.mediator.trigger("layer:band:changed", that.model.get("name"), that.selected, options[that.selected].range);
				});

				this.$("#range_min").val(options[this.selected].range[0]);
				this.$("#range_max").val(options[this.selected].range[1]);

				this.$("#range_min").keypress(function(evt) {
					if(evt.keyCode == 13){ //Enter pressed
						evt.preventDefault();
						var range = [parseFloat($(this).val()), options[that.selected].range[1]];
						Communicator.mediator.trigger("layer:range:changed", that.model.get("name"), range);
						options[that.selected].range[0] = range[0];
						that.model.set("parameters", options);
					}
				});

				this.$("#range_max").keypress(function(evt) {
					if(evt.keyCode == 13){ //Enter pressed
						evt.preventDefault();
						var range = [options[that.selected].range[0], parseFloat($(this).val())];
						Communicator.mediator.trigger("layer:range:changed", that.model.get("name"), range);
						options[that.selected].range[1] = range[1];
						that.model.set("parameters", options);
					}
				});

				var colorscaletypes = ["redblue", "bluered", "rainbow", "jet"];

				var colorscale_options = "";
				var selected_colorscale;
				_.each(colorscaletypes, function(colorscale){
					if(options[that.selected].colorscale == colorscale){
						selected_colorscale = colorscale;
				   		colorscale_options += '<option value="'+ colorscale + '" selected>' + colorscale + '</option>';
				   	}else{
				   		colorscale_options += '<option value="'+ colorscale + '">' + colorscale + '</option>';
				   	}
				});

				this.$("#style").append(colorscale_options);
				this.$("#gradient").attr("class", selected_colorscale);

				this.$("#style").change(function(evt){
					var selected = $(evt.target).find("option:selected").text();
					selected_colorscale = selected;
					that.$("#gradient").attr("class", selected_colorscale);
					Communicator.mediator.trigger("layer:style:changed", that.model.get("name"), selected_colorscale);
				});

				if(height){
					this.$("#height").append(
						'<form style="vertical-align: middle;">'+
						'<label for="heightvalue" style="width: 70px;">Height: </label>'+
						'<textarea rows="1" cols="10" id="heightvalue" style="resize: none;margin:0;vertical-align: middle;"></textarea>'+
						'</form>'
					);
					this.$("#heightvalue").val(height);
					this.$("#height").append(
						'<p style="font-size:0.85em; margin-left: 70px;">Above ellipsoid (Km)</p>'
					);

					this.$("#heightvalue").keypress(function(evt) {
						if(evt.keyCode == 13){ //Enter pressed
							evt.preventDefault();
							var new_height = parseInt($(this).val());
							Communicator.mediator.trigger("layer:height:changed", that.model.get("name"), new_height);
							that.model.set("height", new_height);
						}
					});
				}

		    },

			onClose: function() {
				this.close();
			}, 

			setModel: function(model){
				this.model = model;
			},

			sameModel: function(model){
				return this.model.get("name") == model.get("name");
			}

		});

		return {"LayerSettings": LayerSettings};

	});

}).call( this );
