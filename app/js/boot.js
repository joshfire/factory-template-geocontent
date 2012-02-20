(function() {
  var Joshfire = window.Joshfire || {};
  
  Joshfire.factory = {
    globalConfig: {
      "HOST":"192.168.2.115","PORT":"40021",
      "DATAHOST":"192.168.2.115","DATAPORT":"40020",
      "DATAVERSION":"1",
      "TRANSLOADITKEY":"25128f462228434da8c2f7385ae95914","TRANSLOADIT_TPL_PHONEGAPBUILD":"9d652804bbdb4397a35d16877c1a99f3","TRANSLOADIT_TPL_PAGE_INFO":"6e28267860054d469d7278aa78ddb534",
      "DATAHOSTPORT":"192.168.2.110:40020",
      "HOSTPORT":"192.168.2.110:40021"
    },
    config: {
      "app": {
        "id": "4f2958a5f83d5b3b52000087",
        "icon": null,
        "logo": null,
        "name": "Volcanoes",
        "version": "1.0"
      },
      "template": {
        "name": "Geocontent",
        "version": "1.0.0",
        "options": {
          "durAnimation": 10,
          "enable3D": false,
          "provider3D": "Bing",
          "language": "English",
          "randomize": true,
          "feeds": {
            "feed3": {
              "useContent": true
            },
            "feed2": {
              "useContent": true
            },
            "feed1": {
              "useContent": false
            },
          }
        }
      }
    },
    device: {
      "type": "desktop"
    }
  };

  Joshfire.factory.config.datasources = {
    "feed3":{"name":"Weekly Activity","db":"feed","col":"kml","query":{"filter":{"url":"http://citron.local/bitbucket/template-geocontent/test/gvp-weekly.kml"}},"runatclient":false},
    "feed2":{"name":"Volcanoes","db":"feed","col":"kml","query":{"filter":{"url":"http://citron.local/bitbucket/template-geocontent/test/gvp-world.kml"}},"runatclient":false},
    "feed1":{"name":"Photos","db":"flickr","col":"photos","query":{"filter":{"search":"volcanoes"}},"runatclient":false}
  };

  window.Joshfire = Joshfire;
})();(function () { (function(a,b){var c=function(a,b){for(var c in b)b.hasOwnProperty(c)&&(a[c]=b[c]);return a},d=function(){function e(a){var c=document.createElement("script"),d=!1;c.src=a,c.async=!0,c.onload=c.onreadystatechange=function(){!d&&(!this.readyState||this.readyState==="loaded"||this.readyState==="complete")&&(d=!0,c.onload=c.onreadystatechange=null,c&&c.parentNode&&c.parentNode.removeChild(c))},b||(b=document.getElementsByTagName("head")[0]),b.appendChild(c)}function f(b,f,g){c="?",f=f||{};for(d in f)f.hasOwnProperty(d)&&(c+=encodeURIComponent(d)+"="+encodeURIComponent(f[d])+"&");var h="json"+ ++a;return window.DatajsProxy[h]=function(a){g(a);try{delete window.DatajsProxy[h]}catch(b){}window.DatajsProxy[h]=null},e(b+c+"callback=DatajsProxy."+h),h}var a=0,b,c,d;return{get:f}}(),e=function(e,f,g){g=g||{},this.find=function(h,i){var j=this,k={};c(k,g),c(k,h),k.apikey=b.app.id,k.filter&&(k.filter=JSON.stringify(k.filter)),d.get("http://"+a.DATAHOSTPORT+"/api/"+a.DATAVERSION+"/"+e+"/"+f,k,function(a){a&&!a.name&&j.name&&(a.name=j.name),i(null,a)})},this.onLoaded=function(a){a()}},f={getCollection:function(a,b,c){return new e(a,b,c)},getCollectionDesc:function(b,c,e){d.get("http://"+a.DATAHOSTPORT+"/api/"+a.DATAVERSION+"/"+b+"/"+c+"/_desc",null,function(a){e(a)})}};window.DatajsProxy=window.Datajs=f})(Joshfire.factory.globalConfig,Joshfire.factory.config);
(function(a,b,c){var d=function(d){var e=null,f=null;if(!d||!a||!a.datasources||!a.datasources[d])return null;e=a.datasources[d];if(Object.prototype.toString.call(e)=="[object Array]"){f={children:[],find:function(a,b){var c=e.length,d=!1,g=[],h=0,i=function(a,e){c-=1;if(d)return;a&&(d=!0),e&&g.push(e);if(a||c===0)return b(a,{entries:g})};for(h=0;h<e.length;h++)f.children[h].find(a,i)}};for(var g=0;g<e.length;g++)f.children[g]=(e[g].runatclient?b:c).getCollection(e[g].db,e[g].col,e[g].query),f.children[g].name=e[g].name,f.children[g].config=e[g];return f}return f=(e.runatclient?b:c).getCollection(e.db,e.col,e.query),f.name=e.name,f.config=e,f};Joshfire.factory.getDataSource=d})(Joshfire.factory.config,window.DatajsClient,window.DatajsProxy);

if (typeof jQuery !== 'undefined') jQuery.noConflict();
})();