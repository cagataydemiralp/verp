'use strict';

/**
 * @ngdoc function
 * @name verpApp.controller:RecurrenceCtrl
 * @description
 * # RecurrenceCtrl
 * Controller of the verpApp
 */
angular.module('verpApp')
    .controller('RecurrenceCtrl', function ($scope) {
        $scope.canvasSize = [300, 300];
        $scope.rpPanelSize = [200, 300];
        $scope.rp = null;
        $scope.eps = 50;
        $scope.distfn = 'l2';
        $scope.brush = {};
        $scope.brush.lock = true;

        $scope.update =  function(){
            $scope.rp
                .eps($scope.eps/100)
                .distfn($scope.distfn)
                .update();
        };

    }).directive('rp', function(){

        function  nrnd() {
            var  x1, x2, w, y1, y2, w;

            do {
                x1 = 2.0 * Math.random() - 1.0;
                x2 = 2.0 * Math.random() - 1.0;
                w = x1 * x1 + x2 * x2;
            } while (w >= 1.0);

            w = Math.sqrt((-2.0 * Math.log(w) ) / w);
            y1 = x1 * w;
            return y1;
        }

        function dist(a,b){
            return Math.abs(a-b) < 0.1 ? 255:0;
        }

        function myrpimage(rp, a){
            var n = a.length, r = n * 4, d, i, j, k;
            for(i = 0; i < n; i++) {
                for (j = 0; j < n; j++) {
                    k = i * r + 4 * j;
                    d = dist(a[i], a[j]);
                    rp[k + 0] = d;
                    rp[k + 1] = d;
                    rp[k + 2] = d;
                    rp[k + 3] = 255;
                }
            }
        }

        function addNoise(imgdata){

            var n = imgdata.length, i, j;

            for (i = 0; i < n; i += 4)
                for(j = 0; j < 4; imgdata[i+j]=~~(nrnd()*127)+128, j++) ;

        }

        return{
            restrict:'E',
            replace:true,
            template:'<div></div>',

            link:function(scope, element, attrs){
                var w = scope.canvasSize[0],
                    h = scope.canvasSize[1],
                    a = Array.apply(null, new Array(w)).map(function(d,i){return Math.cos(i);}),
                    b = a.slice().map(function(d,i){return Math.cos(i+25);});

                   scope.rp = rep.crp()
                      .width(w)
                      .height(h)
                      .eps(scope.eps/100);

                 scope.rp({x:a, y:a}, element[0]);
            }
        };

    }).directive('xbrush', function(){

        return{
            restrict: 'E',
            replace: true,
            template: '<div></div>',
            link: function (scope, element, attrs) {

                var w = scope.rpPanelSize[0],
                    h = scope.rpPanelSize[1],
                    axis = attrs.axis,
                    brushScaleX = d3.scale.linear().range([0, w]),
                   //dataScaleX = d3.scale.linear().range([0, scope.canvasSize[0]]),
                    brush = d3.svg.brush()
                        .x(brushScaleX)
                        .extent([0,1])
                        .on('brush', brushed);

                scope.brush[axis] = brush;

                var brushsvg = d3.select(element[0])
                    .append('svg')
                    .attr('width',w+10)
                    .attr('height', 10);

                    brushsvg.append("g")
                        .attr('transform', 'translate(10,0)')
                    .attr('width', w)
                    .attr('height',10)
                        .attr('id', attrs.axis+'brush')
                    .attr("class", "x brush")
                    .call(brush)
                    .selectAll("rect")
                    .attr('height',10);

                var xx= d3.scale.identity()
                    .domain([0, w]),
                axisfn = d3.svg.axis()
                    .scale(xx)
                    .outerTickSize(0)
                    .ticks(0),
                brushaxis = brushsvg.append("g")
                    .attr("class", "x axis")
                    .attr('transform', 'translate(10,'+5+')')
                    .call(axisfn)
                    .append('text')
                    .attr('class', 'x label')
                    .attr('dx','-0.75em')
                    .attr('dy','0.25em')
                    .text(axis);



                function brushed() {
                    var e = brush.extent(),
                    start = ~~(1.5*brushScaleX(e[0])),
                    end = ~~(1.5*brushScaleX(e[1]));
                    scope.rp.range({s:start, e:end});
                    if(axis === 'x' && scope.brush.lock === true) {
                        scope.brush.y.extent([e[0], e[1]]);
                        d3.select('#ybrush').call(scope.brush.y);
                    }
                }

            }
        };
    });

