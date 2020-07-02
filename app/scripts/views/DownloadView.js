(function() {
  'use strict';

  var root = this;
  root.define([
    'backbone',
    'communicator',
    'globals',
    'models/DownloadModel',
    'hbs!tmpl/Download',
    'hbs!tmpl/SelectCoverageListItem',
    'hbs!tmpl/CoverageInfo',
    'hbs!tmpl/CoverageDownloadPost',
    'underscore'
  ],
  function( Backbone, Communicator, globals, m, DownloadTmpl,
   SelectCoverageListItemTmpl, CoverageInfoTmpl,CoverageDownloadPostTmpl) {

    // Helper collection to keep maintain data of coverage set
    var EOCoverageSet = Backbone.Collection.extend({
      fetch: function(options) {
        options || (options = {});
        options.dataType = "xml";
        return Backbone.Collection.prototype.fetch.call(this, options);
      },
      parse: function(response) {
        return WCS.Core.Parse.parse(response).coverageDescriptions;
      },
    });

    var DownloadView = Backbone.Marionette.ItemView.extend({
      tagName: "div",
      id: "modal-start-download",
      className: "panel panel-default download",
      template: {
          type: 'handlebars',
          template: DownloadTmpl
      },

      modelEvents: {
        "reset": "onCoveragesReset"
      },

      events: {
        "click #btn-select-all-coverages": "onSelectAllCoveragesClicked",
        "click #btn-invert-coverage-selection": "onInvertCoverageSelectionClicked",
        'change input[type="checkbox"]': "onCoverageSelected",
        "click #btn-start-download": "onStartDownloadClicked",
        'change #select-output-format': "onFormatSelected"
      },

      initialize: function(options) {

        this.coverages = new Backbone.Collection([]);
        this.currentArea = false;

      },
      onShow: function(view){

        this.listenTo(this.coverages, "reset", this.onCoveragesReset);
        this.$('.close').on("click", _.bind(this.onClose, this));
        this.$el.draggable({ 
          containment: "#content",
          scroll: false,
          handle: '.panel-heading'
        });

        var $downloadList = this.$("#download-list");
        $downloadList.children().remove();


        var providerSets = {};
        var layerActive = false;
        _.map(this.model.get('products'), function(product, key) {
          var provider = product.get('provider');
          if(typeof provider !== 'undefined' && product.get('visible')){
            if (!providerSets.hasOwnProperty(provider)){
              providerSets[provider] = [];
            }
            providerSets[provider].push(product.get('download').id);
          }
        });

        // Separate collections requests based on the provider
        for (var provKey in providerSets) {

          var request = 
            provKey+'pycsw/pycsw/csw.py?mode=opensearch'+
            '&service=CSW&version=2.0.2&request=GetRecords&elementsetname=brief'+
            '&typenames=csw:Record&resulttype=results'+
            '&time='+getISODateTimeString(this.model.get("ToI").start)+'/'+
            getISODateTimeString(this.model.get("ToI").end)+
            '&q='+providerSets[provKey].join(';')+
            '&maxrecords=100'+
            '&outputFormat=application/json';

          var bbox = this.model.get("AoI");
          var b = null;
          if(bbox){
            b = [bbox.s, bbox.w, bbox.n, bbox.e ];
            request += '&bbox='+b[1]+','+b[2]+','+b[3]+','+b[0];
          }

          // Empty current coverages
          this.coverages.reset([]);

          var that = this;

          function handleResponse(resp, provKey) {
            var coverages = [];
            if(resp.hasOwnProperty('atom:feed') && resp['atom:feed'].hasOwnProperty('atom:entry')){
              var entries = resp['atom:feed']['atom:entry'];
              if(!Array.isArray(entries)){
                entries = [entries];
              }

              if(typeof entries !== 'undefined'){

                for( var ee=0; ee<entries.length; ee++ ){
                  var bboxCont = entries[ee]['http://www.georss.org/georss:where']['gml:Envelope'];
                  var lowCorn = bboxCont['gml:lowerCorner'].split(' ').map(parseFloat);
                  var upperCorn = bboxCont['gml:upperCorner'].split(' ').map(parseFloat);
                  var id = entries[ee]['atom:title'];
                  var summ = entries[ee]['atom:summary'];
                  var wcsEndpoint = entries[ee]['atom:source'];
                  var spl = summ.replace(/ *\<[^>]*\> */g, " ").split(/[\s]+/);
                  var start = spl[7];
                  var end = spl[9];
                  var id = spl[2].replace('.tif', '');

                  if(b!==null){
                    wcsEndpoint = wcsEndpoint +
                              '&subset=Lat('+b[0]+','+b[2]+')'+
                              '&subset=Long('+b[1]+','+b[3]+')';
                  }
                  var coverage = {
                    'coverageId': id,
                    'url': provKey+wcsEndpoint,
                    'timePeriod': start+'/'+end,
                  };
                  if(b!==null){
                    coverage.bbox = b.map(function(a){return a.toFixed(4);}).join(',');
                  }
                  coverages.push(coverage)
                }
                var combinedCovs = that.coverages.models.concat(coverages);
                that.coverages.reset(combinedCovs);
              }
            }
          }
          $.get(request, (function(provKey) {
              return function(response) {
                  handleResponse(response, provKey);
              };
          })(provKey));
        }

      },

      onFormatSelected: function(evt){
        var format = evt.target.value;
        if(format === 'image/tiff'){
          this.coverages.each(function(cov){
            cov.set('url', cov.get('url').replace('application/x-netcdf', format));
          })
        } else {
          this.coverages.each(function(cov){
            cov.set('url', cov.get('url').replace('image/tiff', format));
          })
        }
        var $downloadList = this.$("#download-list");
        $downloadList.children().remove();
        this.onCoveragesReset();
      },

      onSelectAllCoveragesClicked: function() {
        // select all coverages
        this.$('input[type="checkbox"]').prop("checked", true).trigger("change");
      },

      onInvertCoverageSelectionClicked: function() {
        this.$('input[type="checkbox"]').each(function() {
          var $this = $(this);
          $this.prop("checked", !$this.is(":checked")).trigger("change");
        });
      },

      onCoveragesReset: function() {
        var $downloadList = this.$("#download-list");

        this.coverages.each(function(coverage) {
          var coverageJSON = coverage.toJSON();
          var $html = $(SelectCoverageListItemTmpl(coverageJSON));
          $downloadList.append($html);
          $html.find("i").popover({
            trigger: "hover",
            html: true,
            content: CoverageInfoTmpl(coverageJSON),
            title: "Coverage Description",
            placement: "right"
          });
        }, this);
      },

      onCoverageSelected: function() {
        // check that at least one coverage was selected
        if (this.$("input:checked").length) {
          this.$("#btn-start-download").removeAttr("disabled");
        }
        else {
          this.$("#btn-start-download").attr("disabled", "disabled");
        }
      },

      onStartDownloadClicked: function() {
        // for each selected coverage start a download
        var $downloads = $("#div-downloads"),
            options = {};


        var bbox = this.model.get("AoI");
        if(bbox){
            options.subsetCRS = "http://www.opengis.net/def/crs/EPSG/0/4326";
            options.subsetX = [bbox.w, bbox.e];
            options.subsetY = [bbox.s, bbox.n];
          }

        // format + outputcrs
        options.format = this.$("#select-output-format").val();
        //options.outputCRS = this.$("#select-output-crs").val();

        // apply mask parameter if polygon is not a square
        // (described by 5 points, first and last the same)
        /*var components = this.model.get("AoI").components[0].components;
        if(components.length>5){
          var coords = [];
          _.each(components, function(point) {
            coords.push(point.x);
            coords.push(point.y);
          });
          options.mask = coords.join(" ");
        }*/


        this.$('input[type="checkbox"]').each(_.bind(function(index) {
          if ($('input[type="checkbox"]')[index].checked){
            var model = this.coverages.models[index];
            var xml = getCoverageXML(model.get('coverageId'), options);

            var owsUrl = model.get('url').split('?')[0] + '?';

            var $form = $(CoverageDownloadPostTmpl({
              url: owsUrl, xml: xml}));
            $downloads.append($form);
            _.delay(function() {
            $form.submit();
            }, index * 1000);
          }
        }, this));
      },

      onClose: function() {
        Communicator.mediator.trigger("ui:close", "download");
        this.close();
      }

    });
    return {'DownloadView':DownloadView};
  });
}).call( this );
