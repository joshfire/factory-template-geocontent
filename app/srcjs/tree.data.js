/*!
 * GeoContent template for the Joshfire Factory
 *
 * Copyright (C) 2012 Joshfire
 * Licensed under the GPL Version 3:
 * https://raw.github.com/joshfire/factory-template-geocontent/master/license.txt
 */

/**
 * @fileoverview Data model for the geocontent application.
 */

Joshfire.define([
  'joshfire/class',
  'joshfire/vendor/underscore',
  'joshfire/tree.data'
], function (Class, _,DataTree) {

  return Class(DataTree, {

    /**
     * Constructs the data tree
     *
     */
    buildTree: function () {
      var self = this;

      /**
       * Initializes the list of feeds based on datasources parameters
       * entered by the factory user.
       * @function
       * @private
       * @returns {Array} The list of feeds as data tree branches.
       */
      var getListOfFeeds = function () {
        var i = 0;
        var feeds = [];
        var feedsMeta = Joshfire.factory.config.template.options.feeds;
        var feed = null;
        var feedMeta = null;

        // Initialize the list of feeds
        for (i = 1; i <= 10; i++) {
          feed = Joshfire.factory.getDataSource('feed' + i);
          feedMeta = (feedsMeta ? feedsMeta['feed' + i] : null) || {};
          if (feed) {
            feeds.push(_.extend(feed, {
              id: '#' + i,
              description: feedMeta.description,
              useContent: feedMeta.useContent,
              image: {
                '@type': 'ImageObject',
                contentURL: feedMeta.image
              }
            }));
          }
        }
        return feeds;
      };

      return [
        {
          id: 'modes',
          children: function (query, callback) {
            return [
              {
                id: 'french',
                label: 'Français'
              },
              {
                id: 'english',
                label: 'English'
              }
            ];
          }
        },
        {
          id: 'categories',
          children: getListOfFeeds()
        }
      ];
    }
  });
});