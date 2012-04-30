/*!
 * GeoContent template for the Joshfire Factory
 *
 * Copyright (C) 2012 Joshfire
 * Licensed under the GPL Version 3:
 * https://raw.github.com/joshfire/factory-template-geocontent/master/license.txt
 */

Joshfire.define(['./app', 'joshfire/class'], function(App, Class) {
  return Class(App, {

    /**
     * Setup function.
     * @function
     * @param {Function} callback
     **/
    setup: function(callback) {
      var self=this;

      self.__super(callback);
    
      self.subscribe('afterInsert', function () {
        self.ui.element('/header/menu/categories/rewind').hide();  
        self.ui.element('/header/menu/categories/forward').hide();

        /**
        * Swipe up : fold menu 
        **/
        $(window).bind('swipeUp', function(e){
            //hide menu
            self.ui.element('/header').hide();
        });

        var categs = self.ui.element(self.categsUIPath);
        var li_length = 125;
        categs.subscribe('afterRefresh', function () {
          categs.htmlEl.getElementsByTagName('ul')[0].style.width = li_length * categs.htmlEl.getElementsByTagName('li').length + 'px';
          categs.iScroller.refresh();
        });        
      });
    },

    /**
     * Augments app.js > nextNews
     * @function
     **/
    nextNews: function (self) {
      self.__super(self);
      var newsList = self.ui.element('/news');
      
      //last news : start over
      var selected = newsList.getState('selection');
      
      if (!selected || selected[0] == (_.last(newsList.data)||{}).id){
        //last news
        /* what if !grid*/
        newsList.selectByIndex(0);
        return true;
      }
      try {
        var currentIndex = newsList.getIndexById(selected[0]);
        newsList.selectByIndex(currentIndex+1);
      } catch (e) {
        newsList.selectByIndex(0);
      }
    }
  });
});