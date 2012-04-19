/**
 * @fileoverview Holds the main code of the application, base code for all
 * versions (mobile, tablet, desktop, tv).
 *
 * The class extends the base app class of the Joshfire Framework.
 */

/*global Joshfire, $, window, document, setTimeout, clearTimeout, async, setInterval, clearInterval*/

Joshfire.define([
  'joshfire/app',
  'joshfire/class',
  './tree.ui',
  './tree.data',
  'joshfire/vendor/underscore',
  'joshfire/utils/cookie',
  './async'
], function (App, Class, UI, Data,_, myCookie, foo) {

  return Class(App, {

    /**
     * Application ID
     */
    id: 'geocontent-' + Joshfire.factory.config.app.id,

    /**
     * Application default language (english)
     */
    defaultMode: 'english',

    /**
     * Link to the UI class that handles the application views
     */
    uiClass: UI,

    /**
     * Link to the data model
     */
    dataClass: Data,

    /**
     * Path to the list of categories in the UI tree
     * (see tree.ui)
     */
    categsUIPath: '/header/menu/categories/list',

    /**
     * Interval between two news refresh (in milliseconds)
     */
    refreshInterval: 1000 * 60 * 5,

    /**
     * Should the list of items be refreshed?
     * @type boolean
     */
    refreshItems: false,

    /**
     * Time during which a news item stays on screen (in milliseconds)
     */
    newsShiftPeriod: 10 * 1000,

    /**
     * ???
     */
    categsScrollOffset: 400,

    /**
     * Is the slideshow running?
     */
    started: false,

    /**
     * Can the slideshow continue?
     */
    paused: false,


    /**
    * Global application setup
    * 
    * Subscribes to events:
    *  app.afterInsert
    *  news.afterRefresh: refresh news list
    *  news.select: update map & details popin
    * 
    * Also sets the slideshow interval
    * @function
    * @param {Function} callback function
    **/
    setup: function (callback) {
      var self = this;
      self.__super(callback);

      // Set the application's title
      if (Joshfire.factory.config.app.name) {
        $("head title").text(Joshfire.factory.config.app.name);
      }

      // Set the application's icon
      if (Joshfire.factory.config.app.icon &&
        Joshfire.factory.config.app.icon.contentURL) {
        $("head").append('<link rel="apple-touch-icon-precomposed" href="'+ Joshfire.factory.config.app.icon.contentURL +'">');
      }

      // Set animation configuration options
      if (Joshfire.factory.config.template.options.durAnimation) {
        self.newsShiftPeriod = Joshfire.factory.config.template.options.durAnimation * 1000;
      }
      if (Joshfire.factory.config.template.options.durRefresh) {
        self.refreshInterval = Joshfire.factory.config.template.options.durRefresh * 1000;
      }

      // Enable 3D if so requested and set 3D provider
      var map = self.ui.element('/map');
      if (Joshfire.factory.config.template.options.enable3D) {
        map.options.enable3D = true;
        map.webGLEnabled = true;
      }
      else {
        map.options.enable3D = false;
        map.webGLEnabled = false;
      }
      if (Joshfire.factory.config.template.options.provider3D) {
        map.options.mapOptions.provider3D = Joshfire.factory.config.template.options.provider3D;
      }
      
      // Subscribe to the afterInsert event that gets triggered
      // when... er... that's a good question ???
      self.subscribe('afterInsert', function () {
        var lang = self.ui.element('/header/menu/lang');
        var mode = lang.getState('selection').length ? _.first(lang.getState('selection')) : self.defaultMode;

        var categs = self.ui.element(self.categsUIPath);
        var categToTheLeft = self.ui.element('/header/menu/categories/rewind');
        var categToTheRight = self.ui.element('/header/menu/categories/forward');
        
        var newsList = self.ui.element('/news');
        var map = self.ui.element('/map');

        // Counter incremented each time the list of categories
        // is modified. Used to prevent conflicting updates,
        // i.e. as event handler re-entry detector.
        var changeCounter = 0;
        
        // There's a weird bug that happens from time to time: the 'data'
        // event may not be caught, even it the data was fetched. The workaround
        // is to re-trigger the 'data' event after a few seconds if the data is there
        // but the event has not been caught yet.
        setTimeout(function () { 
          if (!self.started && categs.data.length) {
            categs.publish('data', null);
          }
        }, 4000);
        
        
        // The header menu is displayed for a certain period of time,
        // then folded automatically. Starts the countdown.
        self.headerFoldingCountdownReset(self);
        
        // Most user interactions cause the header menu to appear on screen
        // if it's not there already, and resets the countdown.
        $(window).bind('touchstart click MozTouchDown swipeLeft swipeRight swipeUp swipeDown', function (e) {
          self.headerFoldingCountdownReset(self);
        });

        // If the user hits 'space', the currently displayed item is
        // highlighted again, and countdown to next item is reset.
        // If the user hits 'n', move to next news item.
        // Toggle the header menu otherwise.
        $(document).bind('keypress', function (event) {
          // 32: space, 13: enter
          if (event.keyCode === 32) {
            self.toggleNewsCountdown();
          }
          else if ((event.keyCode === 'n'.charCodeAt(0)) || (event.keyCode === 'N'.charCodeAt(0))) {
            self.nextNews(self);
          }
          else if ((event.keyCode === 's'.charCodeAt(0)) || (event.keyCode === 'S'.charCodeAt(0))) {
            self.paused = !self.paused;
            self.toggleNewsCountdown();
          }
          else {
            self.headerFoldingCountdownReset(self);
          }
        });
        
        // The data event is normally triggered when the list of
        // categories is initialized or updated. That should happen
        // only once in the lifetime of the application
        categs.subscribe('data', function (ev, data) {
          // console.warn('got categs data', categs.data)
          // Set the 'started' flag. That's it, we have data
          self.started = true;
          
          if (_.isEqual(categs.data, categs.savData)) {
            // No change in the list of categories selected
            // (the 'data' gets triggered more than once from time to time)
            return;
          }
           
          /** store data in savData, to check for potential changes next time **/
          categs.savData = categs.data;
          //alert('Caught "data" event');
          
          /** Reset news list */
          newsList.setData([]);
          
          /** Does the user have settings saved within a cookie ? **/
          var cookiePrefs = JSON.parse(myCookie('geocontent-' + Joshfire.factory.config.app.id + '-categs'));
          if (cookiePrefs && cookiePrefs[mode] && cookiePrefs[mode].length) {
            /** Restore user's categories, dropping categories that do not exist anymore
                ( datasources may have changed) **/
            var existingIDs = _.pluck(categs.data, 'id');
            cookiePrefs[mode] = _.filter(cookiePrefs[mode], function (id) {
              return _.include(existingIDs, id);
            });
            if (cookiePrefs[mode].length > 0) {
              self.selectListItem(categs, 'id', cookiePrefs[mode]);
            }
            else {
              /* Default: select first feed in the list **/
              self.selectListItem(categs, 'index', 0);
            }
          }
          else {
            /* Default: select first feed in the list **/
            self.selectListItem(categs, 'index', 0);
          }
        });
        
       
        // React to a change in the list of categories selected,
        // saving them in a cookie, and refreshing the list of
        // items that serves as food for the slideshow
        categs.subscribe('select', function (ev, data) {
          // Increment the global counter that keeps track of the calls to
          // this event handler and store a local copy of it. The local copy
          // will be compared back to the global counter in asynchronous
          // callbacks to ensure only the latest change is applied.
          var currentCounter = 0;
          changeCounter += 1;
          currentCounter = changeCounter;
          //alert('Caught change in selected categories, counter: ' + currentCounter);

          // Check whether data needs to be refreshed
          var refreshNeeded = self.refreshItems;

          // Get the list of categories selected
          var selected = categs.getState('selection');

          // Save selection in local cookie
          myCookie('geocontent-' + Joshfire.factory.config.app.id + '-mode', mode);
          var categsPrefs = JSON.parse(myCookie('geocontent-' + Joshfire.factory.config.app.id + '-categs')) || {};
          categsPrefs[mode] = selected;
          myCookie('geocontent-' + Joshfire.factory.config.app.id + '-categs', JSON.stringify(categsPrefs));

          // Init data cache if it's the first time the function is run
          if (!newsList.dataCache) {
            newsList.dataCache = {
              categs: [],
              news: []
            };
          }
          
          // Get selected categories in the data model
          var selectedCategs = _.map(selected, function (item) {
            return categs.getDataById(item);
          });

          // Parse selected categories, looking for those that
          // might need to be refreshed
          async.map(selectedCategs, function (category, callback) {
            if (category.data && !refreshNeeded) {
              // No need to fetch the category if we already have it
              callback(null, category.data);
            }
            else {
              // Fetch the category
              category.find({}, function (err, feed) {
                if (feed) {
                  feed.entries = _.map(feed.entries, function (item, index) {
                    return _.extend(item, {
                      id: '#' + category.name + '-' + index,
                      useContent: category.useContent
                    });
                  });
                }
                category.data = feed;
                callback(err, feed);
              });
            }
          }, function (err, feeds) {
            // Final callback method when all elements have been fetched.
            if (err) {
              // Update failed. Try again automatically at the end of the
              // refresh loop.
              // TODO: alert the user that something went wrong through a pop-in
              // or something similar.
              //alert(err);
              self.startRefreshLoop();
              return false;
            }

            // Add list of feeds to the newsList element, unless another
            // change has been requested in the meantime
            if (currentCounter === changeCounter) {
              //alert('Applying changes to list of items for change: ' + currentCounter);
              newsList.data = [];
              _.each(feeds, function (feed) {
                if (feed.entries) {
                  newsList.data = newsList.data.concat(feed.entries);
                }
              });
              
              if (self.refreshItems) {
                // Selected datasources were refreshed,
                // reset refresh loop
                self.refreshItems = false;
                self.startRefreshLoop();
              }

              // Update news based on that data
              self.updateNews(self);
            }
          });
        });
        
        // Select the first item in the new list of news when new items
        // have been fetched and when there wasn't any initially.
        newsList.subscribe('afterRefresh', function (ev, data) {
          if (!newsList.getState('selection').length) {
            self.selectListItem(newsList, 'index', 0);
          }
        });
        
        // The 'select' event occurs when the current news item changes
        newsList.subscribe('select', function(ev, id) {
          self.changeNews(self, id);
        });
        
        // Scrolls the list of feeds to the left when the "previous"
        // button is pressed.
        categToTheLeft.subscribe('input', function(ev, data) {
          if (data && data.length && (data[0] === 'enter')) {
            self.listScroll(categs, 'left', self.categsScrollOffset);  
          }
        });
        
        // Scrolls the list of feeds to the right when the "next"
        // button is pressed.
        categToTheRight.subscribe('input', function(ev, data) {
          if (data && data.length && (data[0]=='enter')) {
            self.listScroll(categs, 'right', self.categsScrollOffset);  
          }
        });
      });
    },

    /**
    * update news
    *     remove unwanted categories
    *     sort news
    *     update cache
    *     update grid
    *     refresh UI
    * @function
    * @param {App} self
    **/
    updateNews: function (self) {
      var newsList = self.ui.element('/news');
      var categs = self.ui.element(self.categsUIPath);
      var selectedCategs = categs.getState('selection');
      
      // Sort news
      newsList.data = self.getSortedNews(self);
      
      // No need to do anything if data has not changed. This may happen when the list
      // is periodically refreshed.
      var change = (newsList.data.length !== newsList.dataCache.news.length);
      if (!change) {
        // Same number of news, but there might be differences
        var newsDiff = _.find(newsList.data, function (item, key) {
          return item.name !== newsList.dataCache.news[key].name;
        });
        if (newsDiff) {
          change = true;
        }
      }
      
      if (!change) {
        return false;
      }

      // Update cache, grid & refresh UI
      newsList.dataCache.news = newsList.data;
      newsList.dataCache.categs = _.extend([], selectedCategs);
      if (typeof newsList.grid != 'undefined') newsList.grid.setGrid([newsList.data]);
      newsList.refresh();
      
      return true;
    },

    /**
    * Update a categ's pic
    * @function
    * @param {Object} image {preview:{src:''}, square:{src:''}}
    * @return {bool}
    **/
    updateCategPicto: function (categ,image) {
       var self=this;
       var categs = self.ui.element(self.categsUIPath);
       var tmpImage=null;
       if (image.square && image.square.src){
         tmpImage=image.square.src;
       }
       else if (image.preview && image.preview.src){
         tmpImage = image.preview.src;
       }
       if (!tmpImage){
         return false;
       }
       categs.getDataById(categ).image = tmpImage;
       categs.refresh();
       return true;
      
    },

    /**
    * Sort news, from oldest to newest
    * news: app.ui.element('/news).data
    * @function
    * @param {App} self
    **/
    getSortedNews: function (self) {
      
      var newsIn = self.ui.element('/news').data;
      var newsOut = null;
      
      if (Joshfire.factory.config.template.options.randomize) {
        newsOut = _.shuffle(newsIn);
      }
      else {
        newsOut = _.sortBy(newsIn, function (item) {
          return item.datePublished ||
            item.dateModified ||
            item.dateCreated ||
            item.uploadDate ||
            item.startDate ||
            item.endDate ||
            item.datePosted ||
            item.foundingDate ||
            item.birthDate ||
            item.deathDate;
        }).reverse();
      }
      
      return newsOut;
    },

    /** 
     * Starts news refresh loop using setTimeout.
     * @function
     **/
    startRefreshLoop: function () {
      var self = this;
      /* Stop current loop */
      if (self.refreshLoop){
        self.stopRefreshLoop();
      }
      self.refreshLoop = setTimeout(function () {
        var categs = self.ui.element(self.categsUIPath);
        self.refreshItems = true;
        categs.publish('select', [categs.getState('selection')]);
      }, self.refreshInterval);
    },

    /**
     * Stops refresh loop
     * @function
     **/
    stopRefreshLoop: function () {
      var self = this;
      clearInterval(self.refreshLoop);
      self.refreshLoop = false;
    },

    /**
     * Start slideshow countdown, using setTimeout
     * @function
     **/
    startNewsCountdown: function () {
      var self=this;
      if (!self.paused) {
        self.newsCountdown = setTimeout(function () {
          self.nextNews(self);
        }, self.newsShiftPeriod);
      }
    },

    /**
     * stop news countdown
     * @function
     **/
    stopNewsCountdown: function () {
      var self = this;
      clearTimeout(self.newsCountdown);
      self.newsCountdown = false;
      return false;
    },

    /**
     * Toggle news Countdown
     * @function
     * @return {bool} status (true=countdown in progress false=paused)
     **/
    toggleNewsCountdown: function () {
      var self = this;
      if (self.newsCountdown) {
        self.stopNewsCountdown();
        return false;
      }
      else {
        self.startNewsCountdown();
        return true;
      }
    },

    /**
     * Focus items of a list
     * @function
     * @param {UIElement.List} list
     * @param {String} type id|index
     * @param {Array} items
     **/
    focusListItem: function (list, type,items) {
       if (!list || list.type!='List' /*|| !list.grid*/){
         return false;
       }
       if (!list.data.length/* || index >= list.data.length*/){
         return false;
       }
       if (!(items instanceof Array)){
          items=[items];
        }
        switch (type){
          case 'id':
            //get indexes
            var indexes=[];
            _.each(items, function(item){
              var idx= list.getIndexById(item);
              if (idx){
                indexes.push(idx);
              }
            });
            if (!indexes.length) return false;
            if (list.grid){
              list.grid.options.defaultPosition=[indexes[0],0];
              list.grid.currentCoords=list.grid.options.defaultPosition;
            }
            else{
              
            }
            list.focusById(items);
            break;
          default:
            _.each(items, function(idx, key){
               if (idx >= list.data.length){
                 //out of bounds, remove it
                 items.splice(key,1);
               }
             });
             if (list.grid){
               list.grid.options.defaultPosition=[items[0],0];
               list.grid.currentCoords=list.grid.options.defaultPosition;
            }
            else{
              
            }
             list.focusByIndex(items);
        }
        
       return true;
    },

    /**
    * Select items of a list, by id, or by indexes 
    * @function
    * @param {UIElement.List} list
    * @param {String} type id|index
    * @param {Array} items
    **/
    selectListItem: function (list, type, items) {
       if (!list || list.type!='List') {
         return false;
       }
       if (!list.data.length/* || index >= list.data.length*/) {
         return false;
       }
       if (!items instanceof Array) {
          items=[items];
        }
        switch(type) {
          case 'id':
            list.selectById(items);
            break;
          default:
            _.each(items, function(idx, key) {
              if (idx >= list.data.length) {
                //out of bounds, remove it
                items.splice(key,1);
              }
            });
            list.selectByIndex(items);
        }
        list.app.focusListItem(list, type, items);
       return true;
    },

    /**
     * Moves the current view to the given news item
     * Update map (proper to each adapter) & details popin content
     * @function
     * @param {App} self
     * @param {String} id ID of the news to display
     **/
    changeNews: function (self, id) {
      if (!id || !id.length) {
        return false;
      }

      var newsList= self.ui.element('/news');
      var data = newsList.getDataById(id);
      var map = self.ui.element('/map');
      var locationItem = null;
      var location = {};
      
      if (!data) {
        return false;
      }

      locationItem = _.reduce([
        'contentLocation',
        'location',
        'homeLocation',
        'workLocation',
        'jobLocation',
        null
      ], function (found, prop) {
        return found || (prop ? data[prop] : data);
      }, null);
      /*
      if (!locationItem.geo) {
        locationItem.geo = {
          latitude: Math.floor(Math.random() * 180) - 90,
          longitude: Math.floor(Math.random() * 360) - 180
        };
      }*/     
      if (locationItem && locationItem.geo && locationItem.geo.latitude && locationItem.geo.longitude) {
        location = {
          lat: locationItem.geo.latitude,
          lng: locationItem.geo.longitude
        };

        self.ui.element('/detail').hide();
        self.ui.element('/city').hide();

        var moveOptions = {
          zoomTimer: (Joshfire.adapter === 'ios') ? 500 : 250,
          minZoom: 3,
          clearMarkers: true
        };
        var targetLocation = _.extend({}, location);

        // Forbid zoom on gmaps for now
        if (!map.webGLEnabled && self.notFirstMove) {
          map.panTo(targetLocation);
          self.displayContent(location, function () {
            self.startNewsCountdown();  
          });
        }
        else {
          self.notFirstMove = true;
          map.moveToLocation(targetLocation, moveOptions, function () {
            self.displayContent(location, function () {
              self.startNewsCountdown();
            });
          });
        }
        
      }
      else {
        self.nextNews(self);
        return false;
      }
      
      return true;
    },

    /**
     * Picks up next news item and moves to it.
     * @function
     * @param {App} self
     **/
    nextNews: function (self) {
      var newsList = self.ui.element('/news');
      if (!newsList.data || !newsList.data.length){
        // No data ... no action
        //console.warn('No data to render');
        return false;
      }
      self.stopNewsCountdown();
      
      // Move to next news handled by adapters (why ???)
      return true;
    },
   
    /**
     ** Display news details over the map/globe
     * @function
     * @param {Object} location {city, country, latitude, longitude}
     * @param {Function} callback
     **/
    displayContent: function (location, callback) {
      var map = this.ui.element('/map');

      // Has data changed during move?
      // If so, the location might not be accurate any more, so move again
      var newsUI = this.ui.element('/news');
      var news = newsUI.getDataById(newsUI.getState('selection'));

      // TODO: why not use the ID instead of the location which won't ever
      // be set when the data follows the schema.org hierarchy ???
      /*
      if (!news || !news.location || news.location.city!=location.city) {
        return newsUI.selectByIndex(0);
      }
      */

      if (map.webGLEnabled) {
        return this.displayContentWebGL(location, callback);
      }
      else {
        return this.displayContentClassic(location, callback);
      }
    },

    /**
     * 2D Google Maps : Zoom game over, now display content
     * @function
     * @param {google.maps.LatLng} location
     * @param {Function} callback
     **/
    displayContentClassic:function(location, callback){
      var self = this;
      var mapUI = self.ui.element('/map');

      var interval = 400;
       
      var map = mapUI.map;
      var newsUI = self.ui.element('/news');
      var infoWindow = self.ui.element('/detail');
      var infoCity = self.ui.element('/city');
      infoWindow.data = newsUI.getDataById(newsUI.getState('selection'));
      infoWindow.refresh();
      infoCity.data = infoWindow.data;
      infoCity.refresh();

      // TODO: understand why the outer calls to setTimeout are useful
      // TODO: use setTimeout instead of setInterval to avoid re-entries
      setTimeout(function () {
        setTimeout(function () {
          var loop = setInterval(function () {
            if (mapUI.getZoom() >= mapUI.mapOptions.zoom) {
              clearInterval(loop);
              self.fadeIn(infoWindow);
              self.fadeIn(infoCity);
              if (callback) {
                callback();
              }
              return true;
            }
            mapUI.setZoom(mapUI.getZoom() + 1);
            return false;
          }, interval);
        }, interval);
      }, interval);
    },

    fadeIn: function (uiEl) {
      var ele = document.getElementById(uiEl.htmlId);
       
      var fadeIn = function () {
        if (ele.style.opacity < 1) {
          ele.style.opacity = Number(ele.style.opacity) + 0.1;
          setTimeout(fadeIn, 30);
        }
      };
      ele.style.opacity=0;
      uiEl.show();
      fadeIn();
    },

    /**
     * 3D WebGL globe : display content
     * @function
     * @param {Object} location {city, country, latitude, longitude}
     * @param {Function} callback
     **/
    displayContentWebGL: function (location, callback) {
      var self = this;
      var mapUI = self.ui.element('/map');
      var newsUI = self.ui.element('/news');
      var infoWindow = self.ui.element('/detail');
      var infoCity = self.ui.element('/city');
      infoWindow.data = newsUI.getDataById(newsUI.getState('selection'));
      infoCity.data = infoWindow.data;
      infoWindow.refresh();
      infoCity.refresh();
      self.fadeIn(infoWindow);
      self.fadeIn(infoCity);
      if (callback) {
        callback();
      }
      return;
    },

    /**
     * Displays the menu with categories if not already done
     * and resets the countdown to fold it
     * @function
     * @param {App} self
     **/
    headerFoldingCountdownReset: function (self) {
      var timer = 30*1000; //30s
      var headerUIElement = self.ui.element('/header');
         
      if (self.headerFoldingCountdown) {
        clearTimeout(self.headerFoldingCountdown);
      }
      if (headerUIElement.htmlEl.style.display === 'none') {
        headerUIElement.show();
      }

      self.headerFoldingCountdown = setTimeout(function () {
        //console.warn('fold header')
        headerUIElement.hide();
        //improvement : fadeout
      }, timer);
    }
  });
});