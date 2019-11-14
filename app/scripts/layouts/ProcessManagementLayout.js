(function() {
    'use strict';

    var root = this;

    root.define([
        'backbone',
        'communicator',
        'hbs!tmpl/ProcessManagement',
        'app',
        'globals',
        'underscore'
    ],

    function( Backbone, Communicator, ProcessManagementTmpl, App, globals ) {

        var ProcessManagementLayout = Backbone.Marionette.Layout.extend({

            template: {type: 'handlebars', template: ProcessManagementTmpl},
            regions: {
                processList: '#processList'
            },
            className: 'panel panel-default datamanagement not-selectable',
            events: {},

            onShow: function(view){
                this.$('.close').on('click', _.bind(this.onClose, this));
                this.$el.draggable({
                    handle: '.panel-heading',
                    containment: '#main' ,
                    scroll: false,
                    start: function(event, ui) {
                        $( '.ui-slider' ).detach();
                        $('.fa-adjust').toggleClass('active')
                        $('.fa-adjust').popover('hide');
                    },
                });

                var that = this;
                
                /* this.$('#searchinput').on('input', function(evt){
                    //that.products.currentView.collection = globals.products.filterElements($(this).val());
                    //App.productsView.collection = globals.products.filterElements($(this).val());
                    that.products.currentView.collection = (globals.products.filterElements($(this).val()));
                    that.products.currentView.render();
                    //console.log($(this).val());
                });
                */
            },

            onClose: function() {
                this.close();
            }

        });

        return ProcessManagementLayout;

    });

}).call( this );
