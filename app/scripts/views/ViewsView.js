(function() {
  'use strict';

  var root = this;
  root.define([
    'backbone',
    'communicator',
    'globals',
    'hbs!tmpl/ViewControl',
    'underscore',
  ],
  function( Backbone, Communicator, globals, TmplViews ) {

    var ViewsView = Backbone.Marionette.ItemView.extend({
      tagName: "div",
      id: "views",
      className: "panel panel-default",
      template: {
          type: 'handlebars',
          template: TmplViews
      },

      modelEvents: {
      },

      events: {
      },

      initialize: function(options) {
      },

      onShow: function(view){

        this.$('.close').on("click", _.bind(this.onClose, this));
        this.$el.draggable({
          containment: "#content",
          scroll: false,
          handle: '.panel-heading'
        });

        var that = this;
        that.globals = globals;

        this.$el.find(".panel-body").append('<button type="button" id="zoomEurope" class="btn btn-success darkbutton" style="width:100%;">Europe</button>');
        this.$el.find(".panel-body").append('<button type="button" id="zoomAustria" class="btn btn-success darkbutton" style="width:100%;">Austria</button>');
        $('#zoomEurope').click(function(){
            Communicator.mediator.trigger("map:zoom:europe");
            this.onClose();
        }.bind(this))
        $('#zoomAustria').click(function(){
            Communicator.mediator.trigger("map:zoom:austria");
            this.onClose();
        }.bind(this))

      },

      onClose: function() {
        this.close();
      }

    });
    return {'ViewsView':ViewsView};
  });
}).call( this );