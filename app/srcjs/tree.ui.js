/**
 * @fileoverview Defines the UI of the application
 */

Joshfire.define([
  'joshfire/class',
  'joshfire/tree.ui',
  'joshfire/uielements/list',
  'joshfire/uielements/panel',
  'joshfire/uielements/map',
  'joshfire/vendor/underscore',
  './templates'
], function (Class, UITree, List, Panel, Map, _, templates) {
  
  window._ = _;

  return Class(UITree, {     
    buildTree: function() {
      var app = this.app;
      
      return [
        {
          id: 'header',
          type: Panel,
          children: [
            {
              id: 'logo',
              type: Panel,
              innerTemplate: templates.logo
            },
            {
              id: 'menu',
              type: Panel,
              children: [
                {
                  id: 'lang',
                  type: List,
                  dataPath: '/modes',
                  autoShow: false
                },
                {
                  id: 'categories',
                  type: Panel,
                  children: [
                    {
                      id: 'rewind',
                      type: Panel,
                      content: '',
                      htmlClass: 'joshover'
                    },
                    {
                      id: 'forward',
                      type: Panel,
                      content: '',
                      htmlClass: 'joshover'
                    },
                    {
                      id: 'list',
                      type: List,
                      dataPath: '/categories',
                      multiple: true,
                      itemInnerTemplate: templates.cats,
                      scroller: true,
                      scrollOptions: {
                        hScroll: true,
                        vScroll: true
                      },
                      scrollBarClass: 'scrollbar'
                    }
                  ]
                  
                }
              ]
            }
          ]
        },
        
        {
          id: 'map',
          type: Map,
          enable3D: true,
          zoom: 4,
          mapOptions: {
            mapTypeControl: false,
            streetViewControl: false,
            zoomControl: false,
            scrollwheel: false,
            draggable: false,
            provider3D: 'BING',
            mapType3D: 'AerialWithLabels',
            maxAscent3D: 0.5,
            travelDuration3D: 4500,
            altitude3D: 2000000, //810000, //150000
            providersKeys: {
              BING: 'AsLurrtJotbxkJmnsefUYbatUuBkeBTzTL930TvcOekeG8SaQPY9Z5LDKtiuzAOu'
            }
          },
          htmlClass: 'earth'
        },
        
        {
          id: 'news',
          type: List,
          autoShow: false,
          forceDataPathRefresh: true,
          itemInnerTemplate: templates.news
        },

        {
          id: 'detail',
          type: Panel,
          itemTemplate: templates.infoWindow,
          autoShow: false
        },

        {
          id: 'city',
          type: Panel, 
          itemTemplate: templates.newsCity,
          autoShow: false
        }
      ];
    }
  });
});