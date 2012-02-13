Joshfire.define(['joshfire/utils/datasource','joshfire/vendor/underscore'], function(DataSource,_) {
  
  var datasource = new DataSource();
  return {
    afpDataRoot:'http://media.aldune.com/ipad/',
    ignoreList:{
      'modes':['sid']
    },
  /**
    * Init API
    * @function
    *
    **/
    init:function(callback){
      
      callback(null, []);
    },
    /**
    * Proxy cross domain requests
    * @function
    * @param {Object} Params {url, dataType, ..}
    * @param {Function} callback
    **/
    proxy:function(params, callback){
      if (!params.url){
        callback('Proxy error: no url', null);
        return false;
      }
      if (!params.data){
        params.data = {};
      }
      
      datasource.request({url:'/proxy', type:'POST', data:params, dataType:params.dataType||'json'}, callback);
      return true;
    },
    
    /**
    * Folders list: scrap html
    * @function
    * @param {String} url. Default: this.afpDataRoot
    * @param {Function} callback
    **/
    getFolderList:function(url, callback){
      var self=this;
      var folders=[];
      if (!url){
        url = self.afpDataRoot;
      }
      self.proxy({url:url, dataType:'html'}, function(err, data){
        if (err || !data){
          if (console && console.warn) console.warn('Zero folder retrieved', err, data);
          callback(null, folders);
          return false;
        }
        /*
          expected html:
          <html>
          <head>...</head>
          <body>
          <h1>...</h1>
          <table>
             <tr><th*>headers></th></tr>
             <tr*><td>..img..</td><td>..<a href='url'>name</a></td><td>...last modified..</td><td>...size...</td><td>...desc..</td></tr>
          </table>
          </body>
        */
        var trs= data.match(/<tr>(.*)<\/tr>/g);
        var tds, folderInfo;
        _.each(trs, function(tr){
          tds = tr.match(/<td>(.*)<\/td>/g);
          if (!tds || !tds.length){
            return false;
          }
          folderInfo = /<a(?:[^href]*)href=(?:[^>]*)>(.*)<\/a>/g.exec(tds[0]);
          if (!folderInfo){
            return false;
          }
          if (folderInfo[1].toLowerCase()=='parent directory' || _.contains(self.ignoreList['folders'], folderInfo[1])){
            return false;
          }
          folders.push(folderInfo[1].replace(/\/$/,''));
          return true;
        });
        callback(null, folders);
        
        
        return true;
      });
    },
    /**
    * Filter folder list : removed useless items (defined by ignore list)
    * @param {Array} list : list of folders to filter
    * @param {String} context : define which ignore list will be considered
    * @return {Array} filtered
    **/
    filterFolders:function(list, type){
      var self=this, filtered=[];
      _.each(list, function(item){
        if (_.contains(self.ignoreList[type], item)){
          return false;
        }
        filtered.push(item);
        return true;
      });
      return filtered;
    },
    /**
    * Get languages // modes
    * @function
    * @param {Function} callback
    **/
    getModes:function(callback){
      var self=this;
      var modes=[];
      self.getFolderList(null, function(err, list){
        if (err){
          callback(err, null);
          return false;
        }
        callback(null, self.filterFolders(list,'modes'));
        return true;
      });
    },
    /**
    * Get url corresponding to specific mode
    * @function
    * @param {String} mode
    * @return {String} url
    **/
    getModeDataURL:function(mode){
      return this.afpDataRoot+mode+'/journal';
    },
    /**
    * Not used -- get categories from folder
    * @function
    * @param {String} mode
    * @param {Function} callback
    **/
    getCategoriesFromFolder:function(mode, callback){
      var self=this;
      var categs=[];
      self.getFolderList(self.getModeDataURL(mode), function(err,list){
        if (err){
          callback(err, null);
          return false;
        }
        callback(null, self.filterFolders(list,'categs'));
        return true;
      });
    },
    /**
    * Get categories from local data/categories.xml file
    * @function
    * @param {String} mode
    * @param {Function} callback
    **/
    getCategories:function(mode, callback){
      var self=this;
      datasource.request({url:'/data/categories.xml', dataType:'xml'}, function(err, xml){
        if (err || !xml){
          callback(err || 'no categs', null);
          return false;
        }

        //console.log(typeof xml, xml); //xml.constructor)
/*       if (!(xml instanceof Document)){
              console.warn('Invalid type of categ data', typeof xml);
         //     xml = 
        }
  */      
        var list=[];
        var categs = xml.getElementsByTagName('categorie');
        var id, label, url;
        _.each(categs, function(node, key){
          id = node.getElementsByTagName('id');
          label = node.getElementsByTagName('name');
          url = node.getElementsByTagName('url');
          
          list.push({
            id:id && id.length ? id[0].firstChild.nodeValue : key,
            label:label && label.length ? label[0].firstChild.nodeValue : '',
            url:url && url.length ? url[0].firstChild.nodeValue : null
          });
        });

        // put monde (id=9) first
        var listend = list.splice(10);
        list = [list[9]].concat(list.splice(0,9)).concat(listend);

        callback(null,list);
        return true;
      });

    },
    
    /**
    * get news list from specified mode & categories
    * @function
    * @param {String} mode
    * @param {Array} categories
    * @param {Function} callback Called after every categories & their news have been fetched
    * @param {Function} callbackFirstNews Called after every category's first news has been fetched
    **/
    getNewsList:function(mode, categs, callback, callbackFirstNews){
      var self=this;
      var news=[];
      if (!_.isArray(categs)){
        categs = [categs];
      }
      //callback only after every categs have been done
      var finalCallback=_.after(categs.length, function(){callback(null, news);});
      _.each(categs, function(categ){
         self.proxy({url:self.getModeDataURL(mode)+'/'+categ.id, dataType:'xml'}, function(err, data){
            if (err || !data){
              if (console && console.warn) console.warn('couldnt retrieve news',mode, categ.label, err, data);
              finalCallback(err, null);
              return false;
            }
        /*  if (!data instanceof Document){
              console.warn('Wrong datatype', mode, categ.label, typeof data, data);
              finalCallback(null, []);
              return false;
            }*/
            var xml = data.documentElement;
            var categUpdate = new Date(self.formatDate(xml.getElementsByTagName('DateAndTime')[0].firstChild.nodeValue)).getTime();
            
            if (categ.lastUpdate && categ.lastUpdate==categUpdate){
              //nothing new
              if (console && console.log) console.log(categ.label, "nothing new still", new Date(categUpdate).toString());
              news = news.concat(categ.news);
              
              return finalCallback();
            }
            
            var newsNodes = xml.getElementsByTagName('NewsItemRef');
            var categCallback = _.after(newsNodes.length, function(){finalCallback();});

            var loopIndex=0;
            _.each(newsNodes, function(item, index){
              self.getNewsDetails({mode:mode, categ:categ.id, url:item.getAttribute('NewsItem')}, function(err, data){
                //console.log(categ.label,index )
                if (data.image && data.image.preview && data.image.preview.src){
                  data.image.preview.src = data.image.preview.src.replace(/@@prefix@@/, self.getModeDataURL(mode)+'/'+categ.id+'/');
                }
                if (data.image && data.image.square && data.image.square.src){
                  data.image.square.src = data.image.square.src.replace(/@@prefix@@/, self.getModeDataURL(mode)+'/'+categ.id+'/');
                }
                news.push(_.extend({categ:categ.id, categUpdate:categUpdate}, data));
                
                /* first news callback ? */
                if (loopIndex++==0 && typeof callbackFirstNews=='function'){
                  callbackFirstNews(null, data);
                }
                
                categCallback();
              });
            });
            return true;
          });
      });
     
    },
    /**
    * Retrieve news file for details
    * @param {String} url
    * @param {Function} callback
    **/
    getNewsDetails:function(item, callback){
      var self=this;
      var url = self.getModeDataURL(item.mode)+'/'+item.categ+'/'+item.url;
      
      self.proxy({url:url, dataType:'xml'}, function(err, data){
        if (err || !data){
          callback(err || 'no details', null);
          return false;
        }
        
        callback(null, self.parseNewsML(data.documentElement));
        return true;
      });
    },
    /**
    * Parse newsML news
    * @function
    * @param {Node} newsML
    * @return {Object} news
    **/
    parseNewsML:function(newsML){
      var self=this;
      var news = self.getVoidNews();
      
      var metadata=newsML.getElementsByTagName('DescriptiveMetadata');
      var newsComponents = newsML.getElementsByTagName('NewsComponent');
      var creationDate = newsML.getElementsByTagName('FirstCreated');
      var updateDate = newsML.getElementsByTagName('ThisRevisionCreated');
      var headline = newsML.getElementsByTagName('HeadLine');
      
      if (metadata.length){
        var location = metadata[0].getElementsByTagName('Location');
        if (location.length){
          news.location = {};
          var locationProperties = location[0].getElementsByTagName('Property');  
          _.each(locationProperties, function(prop){
            news.location[prop.getAttribute('FormalName').toLowerCase()] = prop.getAttribute('Value');
            
            if (news.location.latitude){
              news.location.lat = news.location.latitude;
              delete news.location.latitude;
            }
            if (news.location.longitude){
              news.location.lng = news.location.longitude;
              delete news.location.longitude;
            }
          });
        }
        
      }

      if (creationDate.length){
        news.createdDate = new Date(self.formatDate(creationDate[0].firstChild.nodeValue)).getTime();
      }
      if (updateDate.length){
        news.updatedDate = new Date(self.formatDate(updateDate[0].firstChild.nodeValue)).getTime();
      }
      
      if (headline.length){
        news.title = headline[0].textContent;
      }
      
      _.each(newsComponents, function(component,idx){
        var role = component.getElementsByTagName('Role');
        var content = component.getElementsByTagName('DataContent');
        var parties = component.getElementsByTagName('Party'); //copyrights
        
        
        if (!role.length){
          //main component
          if (content.length){
            news.text  = _.map(content[0].getElementsByTagName('p'), function(para){
              return '<p>'+(para.firstChild ?para.firstChild.nodeValue : '')+'</p>';
            }).join('');
          }
        }
        else{
          //Caption ||
          switch(role[0].getAttribute('FormalName')){
            case 'Caption':
            if (!news.image) news.image={preview:{}, square:{}, caption:null};
            if (news.image.caption){ return false;}
            // TODO improve!!
            var shorten = function(text,length) {
              //hideous patch until we rewrite popin positioning :
              //disable captions on googletv
              if (navigator.userAgent.indexOf("Large Screen")>0) return "";

              if (text.length<length) return text;
              return text.substring(0,length-3)+"...";
            };

            //   news.image.caption = _.map(component.getElementsByTagName('HeadLine'), function(item){return item.firstChild.nodeValue;}).join(' ');
               news.image.caption = _.map(content[0].getElementsByTagName('p'), function(para){
                  return para.firstChild ? '<p>'+shorten(para.firstChild.nodeValue,250)+'</p>' : '';
                }).join('');
             //   news.image.copyright = _.map(parties, function(item){return item.getAttribute('FormalName');}).join(', ');
              break;
            case 'Quicklook':
              //Ignore thumbnail
              break;
            case 'Preview':
              if (!news.image) news.image={preview:{}, square:{}, caption:null};
              if (news.image.preview.src){ return false;}
              content = component.getElementsByTagName('ContentItem');
              if (content.length){
                var mediaType = content[0].getElementsByTagName('MediaType');
                if (mediaType.length && mediaType[0].getAttribute('FormalName')=='Photo'){
                    news.image.preview.src= '@@prefix@@'+content[0].getAttribute('Href');
                    var chars = content[0].getElementsByTagName('Characteristics');
                    if (chars.length){
                      _.each(chars[0].getElementsByTagName('Property'), function (prop){
                        news.image.preview[prop.getAttribute('FormalName').toLowerCase()] = prop.getAttribute('Value');
                      });
                    }
                } 
              }
              break;
            case 'Squared120':
              //squared thumbnail
              if (!news.image) news.image={preview:{}, square:{}, caption:null};
              if (news.image.square.src){ return false;}
                content = component.getElementsByTagName('ContentItem');
                if (content.length){
                  var mediaType = content[0].getElementsByTagName('MediaType');
                  if (mediaType.length && mediaType[0].getAttribute('FormalName')=='Photo'){
                    news.image.square.src= '@@prefix@@'+content[0].getAttribute('Href');
                    var chars = content[0].getElementsByTagName('Characteristics');
                    if (chars.length){
                      _.each(chars[0].getElementsByTagName('Property'), function (prop){
                        news.image.square[prop.getAttribute('FormalName').toLowerCase()] = prop.getAttribute('Value');
                      });
                    }

                  }
                }
                break;
            case 'HighDef':
              //Ignore High def pic
              break;
            
              break;
          }
        }
        
      });
      
     

      
      return news;
      
    },
    /**
    * Format date
    * @function
    * @param {String} input -- format YYYYMMDDTHHMMSS{TZ}
    * @return {String} output -- format YYYY-MM-DD HH:MM:SS
    **/
    formatDate:function(input){
      var regex =/^([0-9]{4})([0-9]{2})([0-9]{2})T([0-9]{2})([0-9]{2})([0-9]{2})?(Z|([+-])([0-9]{2}):([0-9]{2}))?$/;
      var dateParts = input.match(regex);
      if (!dateParts || dateParts.length < 8){
        return false;
      }
      return dateParts[1]+'-'+dateParts[2]+'-'+dateParts[3]+' '+dateParts[4]+':'+dateParts[5]+':'+dateParts[6];
    },
    /**
    * Get void news model
    * @function
    * @return {Object} model
    **/
    getVoidNews:function(){
      var model = {id:null, title:null, image:null, text:null, location:null, createdDate:null, updatedDate:null, author:null};
      return model;
    }
  };
});