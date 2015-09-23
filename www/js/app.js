
var natureApp = angular.module('natureApp',['ionic','ngCordova']);

var nature = null;

natureApp.service("getNatureSvc",["$http","$rootScope","$ionicLoading",getNatureSvc]);


natureApp.controller("natureCtrl",["$scope","$sce","$ionicLoading","$ionicPlatform","$cordovaSQLite","getNatureSvc",natureCtrl]);

natureApp.run(function($ionicPlatform, $cordovaSQLite) {
    $ionicPlatform.ready(function() {
        
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }

        if(window.cordova) {
            nature = $cordovaSQLite.openDB("nature");
        } else {
            nature = window.openDatabase("nature", "1.0", "Nature App", -1);
        }

        $cordovaSQLite.execute(nature, "DROP TABLE tempo");
        $cordovaSQLite.execute(nature, "CREATE TABLE IF NOT EXISTS tempo (nome text, data text)");

    });



})

function getNatureSvc($http, $rootScope, $ionicLoading){

    this.loadNatureTime = function(params,funcao){
        $http.get("http://api.openweathermap.org/data/2.5/weather", {params: params}).success(
                function(result){
                    $rootScope.$broadcast("natureApp.tempo",result);
                    $ionicLoading.hide();
            }
        ).error(function(result) {            
            $ionicLoading.hide();
        });
    }
}

function natureCtrl ($scope,$sce,$ionicLoading,$ionicPlatform,$cordovaSQLite,getNatureSvc){

    $ionicLoading.show({template: "Carregando"});


    $scope.params = {q:"São Paulo"};
    $scope.resultado = "";

    var date = new Date();
    var month = date.getMonth()+ 1;
    $scope.dateString = date.getDate() + "/" + month + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes();

    console.log($scope.dateString);

    getNatureSvc.loadNatureTime($scope.params);

    $scope.insert = function(nome) {
        var query = "insert into tempo (nome) values (?)";
        $cordovaSQLite.execute(nature, query, [nome]).then(
            function(result){
                console.log("Inserido com sucesso!!");
            }, function(error){
                console.log(error);
            }
        ); 
    }; 

    $scope.select = function(){
        var query = "select nome from tempo";
        $cordovaSQLite.execute(nature,query,[]).then(function(result) {
            if(result.rows.length > 0){
                $scope.resultado = result.rows.item(0).nome;
                console.log("Achei " + result.rows.item(0).nome);
            } else {
                $scope.resultado = "Objeto não encontrado";
                console.log("Objeto não encontrado");
            }

        }, function(error){
            console.log(error);
        });
    }


    $scope.$on("natureApp.tempo", function(_, result) {

        if (result.name!=null){

            
            var query = "delete from tempo";
            $cordovaSQLite.execute(nature, query, []).then(
                function(result){
                    console.log("Removido com sucesso");
                }, function(error){
                    console.log(error);
                }
            ); 
            
            var query = "insert into tempo (nome,data) values (?,?)";
            $cordovaSQLite.execute(nature, query, [JSON.stringify(result),$scope.dateString]).then(
                function(result){
                    console.log("Inserido com sucesso");
                }, function(error){
                    console.log(error);
                }
            );
        }

       
        var query = "select nome, data from tempo";
        $cordovaSQLite.execute(nature,query,[]).then(function(result) {
            if(result.rows.length > 0){

                var dataJson = JSON.parse(result.rows.item(0).nome);

                $scope.dtdataJson = result.rows.item(0).data;

                $scope.name = dataJson.name;
                $scope.country = dataJson.sys.country;
                $scope.lat = dataJson.coord.lat;
                $scope.lon = dataJson.coord.lon;

                var tmp = dataJson.main.temp - 273;
                $scope.temp = tmp.toFixed(2);

                $scope.pressure = dataJson.main.pressure;
                $scope.humidity = dataJson.main.humidity;
                $scope.speed = dataJson.wind.speed;

                dataJson.weather.forEach(function(b) {
                    $scope.description =   b.description;
                    $scope.icon        =   "http://openweathermap.org/img/w/"+ b.icon +".png";
                });

            } else {
                $scope.resultado = "Objeto não encontrado";
                console.log("Objeto não encontrado");
            }

        }, function(error){
            console.log(error);
        });


    });


    $scope.getNature = function(cidade){

        if (cidade!=undefined){

            $scope.params = {};

            $ionicLoading.show({template: "Carregando"});
            getNatureSvc.loadNatureTime({q:cidade});
        }
    }

}
