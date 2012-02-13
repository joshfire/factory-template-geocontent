/**
 * @fileoverview Defines the main application class for the desktop version
 * The class extends the common App class to provide browser specific code,
 * typically the code that checks that the navigator is supported.
 */
Joshfire.define(['./app', 'joshfire/class'], function (App, Class) {

  return Class(App, {

    /**
     * The regular expression used to assess whether the navigator is
     * supported or not.
     * TODO: can't we rather check for capabilities?
     */
    allowedUserAgents:/Chrome|Firefox|Opera|Safari/,

    /**
    * Setup function. Checks browser compatibility.
    * @function
    * @param {Function} callback
    * @returns {boolean} true when browser is supported, false otherwise.
    **/
    setup: function (callback) {
      var self = this;
      if (!self.allowedUserAgents.exec(navigator.userAgent)) {
        // Browser is not compatible, update the page content with
        // some "sorry" message
        Joshfire.require(['./src/templates'], function (templates) {
          document.write(templates.unsupportedBrowser);
        });
        return false;
      }
      self.__super(callback);
      return true;
    },


    /**
    * Scroll  list
    * @function
    * @param {UIElement.List} list
    * @param {String up|right|down|left} direction
    * @param {int} offset in pixels 
    **/
    listScroll:function(list,direction,offset){
      var self = this;
      var listUl =  $('ul', list.htmlEl);
      var targetPos, lastItemPos;
      switch(direction){
        case 'left':
          targetPos = Math.min(0,listUl.position().left + offset);
         listUl.stop().css({left:targetPos});
          break;
        case 'right':
          lastItemPos = $('li:last', listUl).position().left;
          targetPos = Math.max(0-lastItemPos,listUl.position().left +0-offset);
          listUl.stop().css({left:targetPos});
          break;
        case 'up':
        case 'down':
          targetPos = listUl.position().top + (direction=='down' ? 0-offset : offset);
         listUl.stop().css({top:targetPos});
          break;
      }
    },

    /**
     * Augments app.js > nextNews
     * @function
     **/
    nextNews:function(self){
      self.__super(self);
      var newsList = self.ui.element('/news');
      
      if (newsList.getState('selection') && newsList.data &&  newsList.data.length && newsList.getState('selection')[0] == _.last(newsList.data).id){
        //last news
        /* what if !grid*/
        newsList.grid.go('default');
        newsList.publish('input', ['enter']);
        return true;
      }


      newsList.publish('input', ['right']);
      newsList.publish('input', ['enter']);
      return true;
    }
});
});