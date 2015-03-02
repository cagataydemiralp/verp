'use strict';

/**
 * @ngdoc function
 * @name verpApp.controller:UploadCtrl
 * @description
 * # UploadCtrl
 * Controller of the verpApp
 */
angular.module('verpApp')
    .controller('UploadCtrl', function ($scope, FileReader, DataService) {

        var coordXform = function (d) {


            var cw = 1680,
                ch = 1050,
                w  = d.domainWidth,
                h  = d.domainHeight,
                tx = (w-cw) * 0.5,
                ty = (h-ch) * 0.5,
                i;

            for (i = 0; i < d.length; i++) {
                if (!(Math.abs(d[i][0]) < 0.001 &&
                      Math.abs(d[i][1]) < 0.001)){

                    d[i][0] += tx;
                    d[i][1] += ty;

                }

            }

        };


        var delta = function(x, dx){

            if(!x) {
                console.warn('No data to take delta of');
                return;
            }

            var n = x.length, i;

            for(i = 0; i < n-1; i++){
                dx.push(x[i+1]-x[i]);
            }

            dx.push(x[i]-x[0]);

        };


        var parseIDF = function (txt) {

            var indx = txt.indexOf('Time'),
                header = txt.substring(0, indx),
                rest = (txt.substring(indx + 1)),
                indx2 = rest.indexOf('\n'),
                tracking = rest.substring(indx2 + 1).split('\n'),
                verp = {pos: [], value: [], time: [], deltaTime: [], frmid: []},
                n = tracking.length, j = 0, i, row, p;

            verp.info = header;

            for (i = 0; i < n-1; i++) {

                row = tracking[i].split('\t');

                if (row.length === 0 ||
                    row === 'undefined') continue;

                verp.frmid.push(0);
                verp.time.push(+row[0]);
                p = row.splice(3, 2);
                p[0] = +p[0];
                p[1] = +p[1];
                verp.pos.push(p);
                verp.value
                    .push(verp.pos[j++]);

            }

            // we'll use delta time to filter out
            // saccadic  movements
            delta(verp.time, verp.deltaTime);

            verp.pos.coordXform = coordXform;

            return verp;

        };



        $scope.getImg = function () {

            FileReader.readAsDataURL($scope.imgFile, $scope)
                .then(function(result) {
                        DataService.img(result);
                });

        };


        $scope.getFile = function () {

            FileReader.readAsText($scope.file, $scope)
                .then(function(result) {
                    var t = $scope.file.name.split('.'), verp;

                    if(t[t.length - 1] === 'json'){

                        verp = JSON.parse(result);
                        verp.deltaTime  = [];
                        delta(verp.time, verp.deltaTime);
                        DataService.tracking(verp);

                    } else if(t[t.length-1] === 'idf') {

                        DataService.tracking(parseIDF(result));

                    } else {

                        console.error('Unknown tracking file format!');

                    }
                });

        };

    }).directive('fileSelect', function(){

        return {
            link: function(scope,el){

                el.bind("change", function(e){
                    scope.file = (e.srcElement || e.target).files[0];
                    scope.getFile();
                });

            }
        };

    }).directive('imgSelect', function(){

        return {
            link: function(scope,el){

                el.bind("change", function(e){
                    scope.imgFile = (e.srcElement || e.target).files[0];
                    if(scope.imgFile) scope.getImg();
                });

            }
        };

    });

