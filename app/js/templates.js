Joshfire.define(['joshfire/vendor/underscore'], function(_){
  var templates={};
  /* Logo */
  templates.logo = '<div class="logo" style="background-image: url(<% if (Joshfire.factory.config.app.logo && Joshfire.factory.config.app.logo.contentURL) { %><%=Joshfire.factory.config.app.logo.contentURL%><% } else { %>images/geocontent.png<% } %>)"></div>';
  /* categories */
  templates.cats= '<div class="image" style="background: url(<% if (item.image && item.image.contentURL) {%><%=item.image.contentURL%><%}else{%>images/cat.png<%}%>) no-repeat center;"></div> <p><%=item.name%></p>';
  /* news */
  templates.newsCity = '<% if (item.location && item.location.city){%><div class="josh-id-city-inner"><%=item.location.city%></div><%}%>';
  templates.newsTitle = '<h3><%=item.name%></h3>';
  templates.newsImage = '<%if (item.image && item.image.contentURL){%><div class="image"><img src="<%=item.image.contentURL%>" alt=""></div><%} else if (item.contentURL) {%><div class="image"><img src="<%=item.contentURL%>" alt=""></div><%}%>';
  templates.newsContent = '<div class="content"><%=item.description%></div>';
  templates.newsAuthor = '<%if (item.author){%><div class="author"><%=item.author.name%></div><%}%>';
  templates.newsCaption = '<div class="caption"><%=item.description%></div>';
  templates.newsHtmlCaption = '<div class="caption"><%if (item.articleBody) {%><%=item.articleBody%><%} else if (item.content) {%><%=item.content%><%} else {%><%=item.description%><%}%></div>';
  templates.news = templates.newsTitle +
    '<%if (item.useContent && (item.articleBody || item.content)) {%>' + templates.newsHtmlCaption + '<%} else {%>' + templates.newsImage + templates.newsContent + '<%}%>' + templates.newsAuthor;
  templates.infoWindow = '<div class="bubble"></div>' +
    '<div class="info"><div class="info-cnt"><div class="info-content">' +
    '<div class="content-inner<%' +
    'if ((!(item.useContent && (item.articleBody || item.content))) && ((item.image && item.image.contentURL) || item.contentURL)) {%> image-on<%}' +
    'if ((item.useContent && (item.articleBody || item.content)) || item.description) {%> caption-on<%}%>">' +
    templates.newsTitle +
    '<%if (item.useContent && (item.articleBody || item.content)) {%>' + templates.newsHtmlCaption + '<%} else {%>' + templates.newsImage + templates.newsCaption + '<%}%>' +
    '<div class="gradient"></div></div></div></div></div>'; 
  
  templates.unsupportedBrowser = '<div class="unsupported">This application is not compatible with your browser. Please use Chrome or Firefox.</div>';
  return templates;
});