
// globals
define(['backbone', 'objectStore', 'underscore', 'd3'], function(Backbone, ObjectStore) {

    var refreshtime = 10000; // 10 seconds
    var autoColor = {
        colors : d3.scale.category10(),
        index : 0,
        getColor: function () { return this.colors(this.index++) }
    };

    var clientInterfaceHost = 'https://amida.adamplatform.eu/en';
    var Products = Backbone.Collection.extend({
        url: clientInterfaceHost+'/api/v2/dave/collections/',
        fetchCollection: function() {
            var self = this;
            self.fetch();
            this.timeout = setTimeout(function() {
                self.fetchCollection();
            }, refreshtime );
            //this.parse(JSON.parse('[{"identifier":"AOD_681nm","provider":null,"name":"AOD_681nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"AOD_443nm","provider":null,"name":"AOD_443nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"AOD_865nm","provider":null,"name":"AOD_865nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"AOD_340nm","provider":null,"name":"AOD_340nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"AMIDA_UC1_MERIS_AOD560_4326_0029433","provider":"https://amida.cloudflight.space/","name":"UC1 MERIS AOD560","description":"MERIS AOD560","nullValues":["-1000"],"range":["0","1"],"start":"2008-01-01T00:00:00Z","end":"2008-12-31T23:59:59Z","measurement_unit":"-","creation_date":"2020-03-03T12:17:02Z","groundMeasurement":false},{"identifier":"AOD_560nm","provider":null,"name":"AOD_560nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"AMIDA_UC1_MISR_Absorption_Aerosol_Optical_Depth_4326_01","provider":"https://amida.cloudflight.space/","name":"MISR Absorption Aerosol Optical Depth","description":"MISR Absorption Aerosol Optical Depth","nullValues":["-9999"],"range":["0","0.10"],"start":"2008-01-01T00:00:00Z","end":"2008-12-31T23:59:59Z","measurement_unit":"-","creation_date":null,"groundMeasurement":false},{"identifier":"uc1_ah_2","provider":"https://amida-wcs.adamplatform.eu/","name":"uc1_ah_2","description":"Lorem Ipsum nr2","nullValues":["3.4028234663852886e+38"],"range":["0","1"],"start":"2008-11-10T00:00:00Z","end":"2008-11-15T23:59:59Z","measurement_unit":"ms","creation_date":"2020-07-01T17:17:17Z","groundMeasurement":false},{"identifier":"AMIDA_UC1_POLDER_L2_MODEL_AOD565_4326_0055211","provider":"https://amida.cloudflight.space/","name":"UC1 POLDER L2 MODEL AOD565","description":"POLDER L2 MODEL AOD565","nullValues":["-1000"],"range":["0","7"],"start":"2008-01-01T00:00:00Z","end":"2008-12-31T23:59:59Z","measurement_unit":"-","creation_date":null,"groundMeasurement":false},{"identifier":"AOD_667nm","provider":null,"name":"AOD_667nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"myColl14","provider":"https://amida-wcs.adamplatform.eu/","name":"myColl14","description":"Lorem Ipsum nr2","nullValues":["3.4028234663852886e+38"],"range":["0","1"],"start":"2008-07-12T00:00:00Z","end":"2008-07-26T23:59:59Z","measurement_unit":"ms","creation_date":"2020-06-26T10:02:09Z","groundMeasurement":false},{"identifier":"AOD_500nm","provider":null,"name":"AOD_500nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"AOD_510nm","provider":null,"name":"AOD_510nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"test_pk1","provider":"https://amida-wcs.adamplatform.eu/","name":"test_pk1","description":"Lorem Ipsum nr2","nullValues":["3.4028234663852886e+38"],"range":["0","1"],"start":"2008-08-27T00:00:00Z","end":"2008-09-01T23:59:59Z","measurement_unit":"ms","creation_date":"2020-06-29T12:33:23Z","groundMeasurement":false},{"identifier":"AOD_1640nm","provider":null,"name":"AOD_1640nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"uc1_ah3","provider":"https://amida-wcs.adamplatform.eu/","name":"uc1_ah3","description":"Lorem Ipsum nr2","nullValues":["3.4028234663852886e+38"],"range":["0","1"],"start":"2008-08-28T00:00:00Z","end":"2008-09-01T23:59:59Z","measurement_unit":"ms","creation_date":"2020-06-23T06:39:49Z","groundMeasurement":false},{"identifier":"uc1_ah5","provider":"https://amida-wcs.adamplatform.eu/","name":"uc1_ah5","description":"Lorem Ipsum nr2","nullValues":["3.4028234663852886e+38"],"range":["0","1"],"start":"2008-08-28T00:00:00Z","end":"2008-09-01T23:59:59Z","measurement_unit":"ms","creation_date":"2020-06-23T06:40:12Z","groundMeasurement":false},{"identifier":"AOD_412nm","provider":null,"name":"AOD_412nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"AOD_551nm","provider":null,"name":"AOD_551nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"AOD_1020nm","provider":null,"name":"AOD_1020nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"AOD_400nm","provider":null,"name":"AOD_400nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"AOD_380nm","provider":null,"name":"AOD_380nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"AMIDA_UC1_MODIS_AOD_4326_01","provider":"https://amida.cloudflight.space/","name":"MODIS AOD 4326 01","description":"MODIS AOD 4326 01","nullValues":["-9999"],"range":["0","1"],"start":"2018-01-01T00:00:00Z","end":"2018-12-31T23:59:59Z","measurement_unit":"-","creation_date":null,"groundMeasurement":false},{"identifier":"AOD_440nm","provider":null,"name":"AOD_440nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"AMIDA_UC1_POLDER_L2_HP_AOD565_4326_0055211","provider":"https://amida.cloudflight.space/","name":"UC1 POLDER L2 HP AOD565","description":"POLDER L2 HP AOD565","nullValues":["-999"],"range":["0","1"],"start":"2008-01-01T00:00:00Z","end":"2008-12-30T23:59:59Z","measurement_unit":null,"creation_date":null,"groundMeasurement":false},{"identifier":"myColl13","provider":"https://amida-wcs.adamplatform.eu/","name":"myColl13","description":"Lorem Ipsum nr2","nullValues":["3.4028234663852886e+38"],"range":["0","1"],"start":"2008-07-12T00:00:00Z","end":"2008-07-26T23:59:59Z","measurement_unit":"ms","creation_date":"2020-06-26T09:59:39Z","groundMeasurement":false},{"identifier":"tmp","provider":"https://amida-wcs.adamplatform.eu/","name":"tmp","description":"Lorem Ipsum nr2","nullValues":["3.4028234663852886e+38"],"range":["0","1"],"start":"2008-11-10T00:00:00Z","end":"2008-11-15T23:59:59Z","measurement_unit":"ms","creation_date":"2020-07-01T17:21:02Z","groundMeasurement":false},{"identifier":"AOD_555nm","provider":null,"name":"AOD_555nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"S3A_OL_1_ERR_4326_0003","provider":"https://amida.cloudflight.space/","name":"UC1 S3A OLCI","description":"S3A OLCI","nullValues":["65535"],"range":["2077","65534"],"start":"2017-02-01T00:00:00Z","end":"2017-02-28T23:59:59Z","measurement_unit":"mW.m-2.sr-1.nm-1","creation_date":null,"groundMeasurement":false},{"identifier":"uc1_ah_1a","provider":"https://amida-wcs.adamplatform.eu/","name":"uc1_ah_1a","description":"Lorem Ipsum nr2","nullValues":["3.4028234663852886e+38"],"range":["0","1"],"start":"2008-11-10T00:00:00Z","end":"2008-11-15T23:59:59Z","measurement_unit":"ms","creation_date":"2020-06-28T05:14:38Z","groundMeasurement":false},{"identifier":"AMIDA_UC1_POLDER_L2_OPTIMIZED_AOD565_4326_0055211","provider":"https://amida.cloudflight.space/","name":"UC1 POLDER L2 OPTIMIZED AOD565","description":"POLDER L2 OPTIMIZED AOD565","nullValues":["-999"],"range":["0","1"],"start":"2008-01-01T00:00:00Z","end":"2008-12-30T23:59:59Z","measurement_unit":null,"creation_date":null,"groundMeasurement":false},{"identifier":"uc1_ah4","provider":"https://amida-wcs.adamplatform.eu/","name":"uc1_ah4","description":"Lorem Ipsum nr2","nullValues":["3.4028234663852886e+38"],"range":["0","1"],"start":"2008-08-28T00:00:00Z","end":"2008-09-01T23:59:59Z","measurement_unit":"ms","creation_date":"2020-06-23T06:40:01Z","groundMeasurement":false},{"identifier":"AOD_870nm","provider":null,"name":"AOD_870nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"AOD_620nm","provider":null,"name":"AOD_620nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"S3A_SL_1_RBT","provider":"https://amida.cloudflight.space/","name":"UC1 S3A SLSTR","description":"S3A SLSTR","nullValues":["-32768"],"range":["770","25237"],"start":"2017-02-01T00:00:00Z","end":"2017-02-28T23:59:59Z","measurement_unit":"mW.m-2.sr-1.nm-1","creation_date":null,"groundMeasurement":false},{"identifier":"AOD_779nm","provider":null,"name":"AOD_779nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"myColl40","provider":"https://amida-wcs.adamplatform.eu/","name":"myColl40","description":"Lorem Ipsum nr2","nullValues":["3.4028234663852886e+38"],"range":["0","1"],"start":"2008-11-15T00:00:00Z","end":"2008-11-22T23:59:59Z","measurement_unit":"ms","creation_date":"2020-06-30T07:43:29Z","groundMeasurement":false},{"identifier":"AOD_532nm","provider":null,"name":"AOD_532nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"uc1_ah_13","provider":"https://amida-wcs.adamplatform.eu/","name":"uc1_ah_13","description":"Lorem Ipsum nr2","nullValues":["3.4028234663852886e+38"],"range":["0","1"],"start":"2008-11-10T00:00:00Z","end":"2008-11-15T23:59:59Z","measurement_unit":"ms","creation_date":"2020-06-28T05:06:02Z","groundMeasurement":false},{"identifier":"AOD_531nm","provider":null,"name":"AOD_531nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"AOD_709nm","provider":null,"name":"AOD_709nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"AOD_675nm","provider":null,"name":"AOD_675nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"AOD_490nm","provider":null,"name":"AOD_490nm","description":null,"nullValues":[null],"range":["0","1"],"start":"1993-06-21T13:46:51Z","end":"2019-11-09T07:05:57Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true}]'));
            //this.parse(JSON.parse('[{"identifier":"ANGLE.SOLAR_AZIMUTH","provider":null,"name":"ANGLE.SOLAR_AZIMUTH","description":null,"nullValues":[null],"range":["0","1"],"start":"2015-07-15T05:05:28Z","end":"2020-02-23T15:08:23Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"DATETIME","provider":null,"name":"DATETIME","description":null,"nullValues":[null],"range":["0","1"],"start":"2015-07-15T15:05:28.161000Z","end":"2020-02-23T15:08:23.314000Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"S5P_OFFL_L2_NO2_PRODUCT_NITROGENDIOXIDE_TROPOSPHERIC_COLUMN","provider":"https://wcs.top-platform.eu/","name":"S5P OFFL L2 NO2 TC","description":"OFFL L2 NO2 TC","nullValues":[null],"range":["0","0.0005"],"start":"2018-10-17T00:00:00Z","end":"2020-05-18T23:59:59Z","measurement_unit":"mol/m2","creation_date":null,"groundMeasurement":false},{"identifier":"INTEGRATION.TIME","provider":null,"name":"INTEGRATION.TIME","description":null,"nullValues":[null],"range":["0","1"],"start":"2015-07-15T15:05:28.161000Z","end":"2020-02-23T15:08:23.314000Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"UC3test_S5PNO2","provider":"https://amida-wcs.adamplatform.eu/","name":"UC3test_S5PNO2","description":"Lorem Ipsum nr2","nullValues":["3.4028234663852886e+38"],"range":["0","1"],"start":"2019-11-28T00:00:00Z","end":"2019-11-28T23:59:59Z","measurement_unit":"ms","creation_date":"2020-10-27T22:08:49Z","groundMeasurement":false},{"identifier":"UC3testS5PNO2","provider":"https://amida-wcs.adamplatform.eu/","name":"UC3testS5PNO2","description":"Lorem Ipsum nr2","nullValues":["3.4028234663852886e+38"],"range":["0","1"],"start":"2020-02-09T00:00:00Z","end":"2020-02-11T23:59:59Z","measurement_unit":"ms","creation_date":"2020-10-28T14:56:55Z","groundMeasurement":false},{"identifier":"AMIDA_UC3_OMI_NO2","provider":"https://vtapp4aq.zamg.ac.at/","name":"UC3 OMI NO2","description":"OMI NO2","nullValues":["-1.2676506002282294e+30"],"range":["0","1000"],"start":"2017-01-01T00:00:00Z","end":"2020-02-18T23:59:59Z","measurement_unit":"cm^-2","creation_date":null,"groundMeasurement":false},{"identifier":"myColl43","provider":"https://amida-wcs.adamplatform.eu/","name":"myColl43","description":"Lorem Ipsum nr2","nullValues":["3.4028234663852886e+38"],"range":["0","1"],"start":"2019-10-17T00:00:00Z","end":"2019-11-01T23:59:59Z","measurement_unit":"ms","creation_date":"2020-09-18T08:25:18Z","groundMeasurement":false},{"identifier":"NO2.COLUMN_ABSORPTION.SOLAR","provider":null,"name":"NO2.COLUMN_ABSORPTION.SOLAR","description":"NO2.COLUMN_ABSORPTION.SOLAR","nullValues":[null],"range":["0","1"],"start":"2015-07-15T15:05:28Z","end":"2020-02-23T16:08:15Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"NO2.COLUMN_ABSORPTION.SOLAR_FLAG","provider":null,"name":"NO2.COLUMN_ABSORPTION.SOLAR_FLAG","description":null,"nullValues":[null],"range":["0","1"],"start":"2015-07-15T15:05:28.161000Z","end":"2020-02-23T15:08:23.314000Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"NO2.COLUMN_ABSORPTION.SOLAR_AMF","provider":null,"name":"NO2.COLUMN_ABSORPTION.SOLAR_AMF","description":null,"nullValues":[null],"range":["0","1"],"start":"2015-07-15T15:05:28.161000Z","end":"2020-02-23T15:08:23.314000Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"NO2.COLUMN_ABSORPTION.SOLAR_UNCERTAINTY.RANDOM.STANDARD","provider":null,"name":"NO2.COLUMN_ABSORPTION.SOLAR_UNCERTAINTY.RANDOM.STANDARD","description":"NO2.COLUMN_ABSORPTION.SOLAR_UNCERTAINTY.RANDOM.STANDARD","nullValues":[null],"range":["0","1"],"start":"2015-07-15T15:05:28Z","end":"2020-02-23T16:08:15Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true},{"identifier":"S5P_RPRO_L2_NO2_PRODUCT_NITROGENDIOXIDE_TROPOSPHERIC_COLUMN","provider":"https://wcs.top-platform.eu/","name":"UC3 S5P RPRO L2 NO2 TC","description":"S5P RPRO L2 NO2 TC","nullValues":["-9999"],"range":["0","0.0005"],"start":"2018-04-30T00:00:00Z","end":"2018-10-17T23:59:59Z","measurement_unit":"mol/m2","creation_date":null,"groundMeasurement":false},{"identifier":"AMIDA_UC3_wrfout_d01_no2_4326_004","provider":"https://vtapp4aq.zamg.ac.at/","name":"UC3 WRFChem NO2 tc","description":"WRFChem NO2 tc","nullValues":["-9999"],"range":["0","0.0005"],"start":"2019-11-11T00:00:00Z","end":"2020-06-30T23:59:59Z","measurement_unit":"mol/m2","creation_date":null,"groundMeasurement":false},{"identifier":"ANGLE.SOLAR_ZENITH.ASTRONOMICAL","provider":null,"name":"ANGLE.SOLAR_ZENITH.ASTRONOMICAL","description":null,"nullValues":[null],"range":["0","1"],"start":"2015-07-15T15:05:28.161000Z","end":"2020-02-23T15:08:23.314000Z","measurement_unit":null,"creation_date":null,"groundMeasurement":true}]'));
            /*this.parse(JSON.parse(
                `[{
                    "identifier": "amida_UC4_3Dfields_BscCoef532",
                    "provider": "https://vtapp4aq.zamg.ac.at/",
                    "name": "UC4 3Dfields BscCoef532",
                    "description": "UC4 3Dfields BscCoef532",
                    "nullValues": [
                        "9.96920996838686905e+36"
                    ],
                    "range": [
                        "0",
                        "0.001"
                    ],
                    "start": "2018-03-20T00:00:00Z",
                    "end": "2018-04-18T23:59:59Z",
                    "measurement_unit": "m-1",
                    "creation_date": null,
                    "groundMeasurement": false
                },
    {
        "identifier": "CAL_LID_L2_Extinction_QC_Flag_532",
        "provider": "https://vtapp4aq.zamg.ac.at/",
        "name": "UC4 CAL LID L2 Extinction QC Flag 532",
        "description": "CAL LID L2 Extinction QC Flag 532",
        "nullValues": [
            "32768"
        ],
        "range": [
            "0",
            "100"
        ],
        "start": "2018-02-28T00:00:00Z",
        "end": "2018-04-30T23:59:59Z",
        "measurement_unit": "-",
        "creation_date": null,
        "groundMeasurement": false
    },{
        "identifier": "CAL_LID_L2_Extinction_Coefficient_532",
        "provider": "https://vtapp4aq.zamg.ac.at/",
        "name": "UC4 CAL LID L2 Extinction Coefficient 532",
        "description": "CAL LID L2 Extinction Coefficient 532",
        "nullValues": [
            "-9999"
        ],
        "range": [
            "0",
            "10"
        ],
        "start": "2018-02-28T00:00:00Z",
        "end": "2018-04-30T23:59:59Z",
        "measurement_unit": "m x km",
        "creation_date": null,
        "groundMeasurement": false
    },
    {
        "identifier": "CAL_LID_L2_Total_Backscatter_Coefficient_532",
        "provider": "https://vtapp4aq.zamg.ac.at/",
        "name": "UC4 CAL LID L2 Total Backscatter Coefficient 532",
        "description": "CAL LID L2 Total Backscatter Coefficient 532",
        "nullValues": [
            "-9999"
        ],
        "range": [
            "0",
            "1"
        ],
        "start": "2018-02-28T00:00:00Z",
        "end": "2018-04-30T23:59:59Z",
        "measurement_unit": "km/steradian",
        "creation_date": null,
        "groundMeasurement": false
    }]`));*/
    
        },
        parse: function(response) {
            var self = this;
            // First check if any items were removed from the collection
            _.each(this.models, function(model){
                if (typeof response.find(function(item){
                    return item.identifier === model.get('id');
                }) === 'undefined'){
                    // Model no longer there, remove it
                    self.remove(model);
                }
            });

            // Now check if we need to add something
            _.each(response, function(item, index) {
                if(self.where({id: item.identifier}).length === 0){
                    var member = new self.model();
                    member.set('_id', index);
                    // Set the defaul attributes.
                    member.set('id', item.identifier);
                    member.set('name', item.name);
                    member.set('provider', item.provider);
                    member.set('description', item.description);
                    member.set('timeRange', [
                        new Date(item.start),
                        new Date(item.end),
                    ]);
                    member.set('groundMeasurements', item.groundMeasurement);

                    member.set('views', [{
                        'id': item.identifier,
                        'protocol': 'WCS',
                        'urls': [item.provider]
                    }]);
                    member.set('parameters', {
                        'Parameter': {
                            'selected': true,
                            'range': item.range.map(Number),
                            'uom': item.measurement_unit,
                            'clamp_max':true,
                            'clamp_min':true,
                            'nullValue': item.nullValues.map(Number),
                            'colorscale': 'viridis'
                        }
                    });
                    member.set('download', {
                        id: item.identifier,
                        protocol: 'WCS',
                        url: item.provider
                    });

                    // Other fields with default values
                    member.set('timeSlider', true);
                    if (item.hasOwnProperty('groundMeasurement') && item.groundMeasurement) {
                        member.set('timeSliderProtocol', 'KVP');
                    } else {
                        member.set('timeSliderProtocol', 'WPS');
                    }
                    member.set('color', autoColor.getColor());
                    member.set('opacity', 0.99);
                    member.set('nullValues', item.nullValues);
                    member.set('processes', []);
                    member.set('view', {isBaseLayer: false});
                    // member.set('favourite', true);
                    member.set('coveragesCollection',{});
                    member.set('scaleFactor',0.6);

                    self.add(member);
                } else {
                    // TODO: Something could have changed in the product
                }
            });
            // If favourites not in localstorage set initially all to true
            var favourites = JSON.parse(localStorage.getItem('favourite'));
            if(favourites !== null){
                this.models.forEach(function(prod){
                    if(favourites.indexOf(prod.get('download').id) !== -1){
                        prod.set('favourite', true);
                    }
                })
            } else {
                this.models.forEach(function(prod){
                    prod.set('favourite', true);
                })
            }

            // Check if we need to apply modifier expressions to collections
            var modExpressions = JSON.parse(localStorage.getItem('modifierExpressions'));
            if(modExpressions !== null){
                this.models.forEach(function(prod){
                    if(modExpressions.hasOwnProperty(prod.get('download').id)) {
                        prod.set(
                            'modExpression',
                            modExpressions[prod.get('download').id]
                        );
                    }
                })
            }
            if(this.hasOwnProperty('favouritesView')) {
                this.favouritesView.render();
            }
            return this.models;
        },
        favourites: function () {
            filtered = this.filter(function (p) {
                return p.get('favourite');
            });
            return new Products(filtered);
        },
        filterElements: function(keyword){
            filtered = this.filter(function (p) {
                var name = p.get('name');
                var description = p.get('description');
                if(name === null){
                    name = '';
                }
                if(description === null){
                    description = '';
                }
                return (
                    name.toLowerCase().indexOf(keyword.toLowerCase()) !== -1 ||
                    description.toLowerCase().indexOf(keyword.toLowerCase()) !== -1
                );
            });
            return new Products(filtered);
        }
    });

    var Jobs  = Backbone.Collection.extend({
        url: clientInterfaceHost+'/api/dave/jobs/',
        fetchCollection: function() {
            var self = this;
            self.fetch();
            this.timeout = setTimeout(function() {
                self.fetchCollection();
            }, refreshtime );
        },
        parse: function(response) {
            var self = this;

            // First check if any items were removed from the collection
            _.each(this.models, function(model){
                if (typeof response.find(function(item){
                    return item.identifier === model.get('identifier');
                }) === 'undefined'){
                    // Model no longer there, remove it
                    self.remove(model);
                }
            });

            // Now check if we need to add something
            _.each(response, function(item, index) {
                var matches = self.where({identifier: item.identifier});
                if(matches.length === 0){
                    var member = new self.model();
                    member.set('_id', index);
                    // Set the defaul attributes.
                    for (var key in item){
                        member.set(key, item[key]);
                    }
                    self.add(member);
                } else if (matches.length === 1){
                    var match = matches[0];
                    for (var mkey in item){
                        // check if there was a change
                        if(match.get(mkey) !== item[mkey]){
                            match.set(mkey, item[mkey]);
                            //self.set({match},{remove: false});
                        }
                    }
                    if(match.hasChanged()){
                        self.remove(match);
                        self.add(match);
                    }
                }
            });
            return this.models;
        },
    });

    var swarm_model = Backbone.Model.extend({data:[]});
    return {
        version: '1.0.0-rc.0',
        objects: new ObjectStore(),
        selections: new ObjectStore(),
        baseLayers: new Backbone.Collection(),
        products: new Products(),
        jobs: new Jobs(),
        overlays: new Backbone.Collection(),
        swarm: new swarm_model(),
        clientInterfaceHost: clientInterfaceHost
    };
});



