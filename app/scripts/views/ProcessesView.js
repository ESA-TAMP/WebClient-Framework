(function() {
  'use strict';

  var root = this;
  root.define([
    'backbone',
    'communicator',
    'globals',
    'hbs!tmpl/Processes',
    'hbs!tmpl/wcs_calculate_average',
    'underscore',
    'libcoverage'
  ],
  function( Backbone, Communicator, globals, TmplProcesses, TmplWCS_calc_avg ) {

    var ProcessesView = Backbone.Marionette.ItemView.extend({
      tagName: "div",
      id: "processes",
      className: "panel panel-default",
      template: {
          type: 'handlebars',
          template: TmplProcesses
      },

      modelEvents: {
        /*"reset": "onCoveragesReset"*/
      },

      events: {
        /*"click #btn-select-all-coverages": "onSelectAllCoveragesClicked"*/
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

        this.$el.find(".panel-body").append('<button type="button" id="calculateAverage" class="btn btn-success" style="width:100%;">Calculate Average</button>');

        $('#calculateAverage').click(function(){
          var sels = Communicator.reqres.request('selections:get:all');
          if(sels.actProd.length>0){
            if (sels.geo){

              var collection_id = 'ALARO_Surface_pressure_surface_4326_0059882';

              var request = TmplWCS_calc_avg({
                left: sels.geo.left,
                right: sels.geo.right,
                top: sels.geo.top,
                bottom: sels.geo.bottom,
                begin_time: sels.time.start.getTime()/1000,
                end_time: sels.time.end.getTime()/1000,
                collection_id: collection_id
              });

              /*$.get( request , function( data ) {
                
              }, dataType:"xml");*/

              $.ajax({
                type: "GET",
                url: request,
                dataType: "xml",
                success: function(xml) {
                  //var values = xml.getElementsByTagName("tupleList")[0].childNodes[0].nodeValue.trim().split(',').map(Number);
                  var values = xml.getElementsByTagName("tupleList")[0].childNodes[0].nodeValue.trim().split(',');
                  var sum = values.reduce(function(a, b) { 
                    return Number(a) + Number(b);
                  });
                  var avg = sum / values.length;
                  console.log(avg);
                }
              });

            }else{
              $("#error-messages").append(
                '<div class="alert alert-warning alert-danger">'+
                  '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                  '<strong>Info:</strong> Please make sure an area of interest has been selected with the bounding box tool.' +
                '</div>'
              );
            }
          }else{
            $("#error-messages").append(
              '<div class="alert alert-warning alert-danger">'+
                '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                '<strong>Info:</strong> Please make sure an appropiate collection has been selected from the Layers menu before executing this process.' +
              '</div>'
            );
          }
        });

     

      },

      onClose: function() {
        //Communicator.mediator.trigger("ui:close", "download");
        this.close();
      }

    });
    return {'ProcessesView':ProcessesView};
  });
}).call( this );