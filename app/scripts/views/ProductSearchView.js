(function() {
  'use strict';

  var root = this;
  root.define([
    'backbone',
    'communicator',
    'globals',
    'hbs!tmpl/ProductSearch',
    'hbs!tmpl/ProductSearchItem',
    'underscore',
    'libcoverage'
  ],
  function( Backbone, Communicator, globals, TmplProductSearch, TmplProductSearchItem ) {

    var ProductSearchView = Backbone.Marionette.ItemView.extend({
      tagName: "div",
      id: "modal-product-search",
      className: "panel panel-default download",
      template: {
          type: 'handlebars',
          template: TmplProductSearch
      },

      modelEvents: {
        /*"reset": "onCoveragesReset"*/
      },

      events: {
        /*"click #btn-select-all-coverages": "onSelectAllCoveragesClicked",
        "click #btn-invert-coverage-selection": "onInvertCoverageSelectionClicked",
        'change input[type="checkbox"]': "onCoverageSelected",
        "click #btn-start-download": "onStartDownloadClicked"*/
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

        this.$el.find("#filtertext").on("keyup", function filter(element) {
          var filterstring = this.value.toLowerCase();
          if(filterstring.length>=2){
            $("#accordion > .panel.panel-default").each(function() {
              if (this.childNodes[3].id.toLowerCase().search(filterstring) > -1) {
                $(this).show();
              }
              else {
                $(this).hide();
              }
            });
          }else{
            $("#accordion > .panel.panel-default").each(function() {
              $(this).show();
            });
          }
        })


        var baseurl = "http://demo.v-manip.eox.at/browse/ows";
        //var baseurl = "http://vtdas-dave.zamg.ac.at/davprc/ows";
        //var request = WCS.Core.KVP.getCapabilitiesURL(baseurl, {sections: ["Contents"]});
        var request = WCS.Core.KVP.getCapabilitiesURL(baseurl);

        $.ajax({
          type: "GET",
          url: request,
          dataType: "xml",
          success: function(data) {
            var obj = WCS.Core.Parse.parse(data);
            var dss = obj.contents.datasetSeries;
            for (var i = 0; i < dss.length; i++) {
              var collreq = WCS.EO.KVP.describeEOCoverageSetURL(baseurl,dss[i].datasetSeriesId,
                {count: 1, sections: ["CoverageDescriptions"]});
              $.ajax({
                type: "GET",
                url: collreq,
                dataType: "xml",
                collid: dss[i].datasetSeriesId,
                el: that.$el,
                baseurl: baseurl,
                success: function(response) {
                  var coll = WCS.Core.Parse.parse(response);
                  var desc = coll.coverageDescriptions[0];
                  var rangetypes = desc.rangeType;
                  var item = $(TmplProductSearchItem({
                    id:this.collid,
                    rangetypes: rangetypes,
                    baseurl: baseurl
                  }));
                  this.el.find("#accordion").append(item);
                  item.draggable({
                    helper: 'clone',
                    revert: 'invalid',
                    appendTo: 'body'
                  });
                  item.sortable();
                }
              });

            }
          }
         });

      },

      onClose: function() {
        //Communicator.mediator.trigger("ui:close", "download");
        this.close();
      }

    });
    return {'ProductSearchView':ProductSearchView};
  });
}).call( this );
