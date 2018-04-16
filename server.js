var http = require('http')
var browserify = require('browserify')
var literalify = require('literalify')
var React = require('react')
var ReactDOMServer = require('react-dom/server')
var DOM = require('react-dom-factories')
var body = DOM.body, div = DOM.div, script = DOM.script
// This is our React component, shared by server and browser thanks to browserify
var App = React.createFactory(require('./App'))

// A variable to store our JS, which we create when /bundle.js is first requested
var BUNDLE = null

// Just create a plain old HTTP server that responds to two endpoints ('/' and
// '/bundle.js') This would obviously work similarly with any higher level
// library (Express, etc)

//只需创建一个响应两个端点（'/'和'/bundle.js'）的普通旧式HTTP服务器，这类似任何更高级别的库（Express等）
http.createServer(function(req, res) {

  // If we hit the homepage, then we want to serve up some HTML - including the
  // server-side rendered React component(s), as well as the script tags
  // pointing to the client-side code
  //如果我们点击主页，那么我们想要提供一些HTML（包括/服务器端渲染的React组件）以及指向客户端代码的脚本标记
  if (req.url === '/') {

    res.setHeader('Content-Type', 'text/html; charset=utf-8')

    // `props` represents the data to be passed in to the React component for
    // rendering - just as you would pass data, or expose variables in
    // templates such as Jade or Handlebars.  We just use some dummy data
    // here (with some potentially dangerous values for testing), but you could
    // imagine this would be objects typically fetched async from a DB,
    // filesystem or API, depending on the logged-in user, etc.
    

//``props``表示要传递给React组件的数据 - 就像传递数据或暴露模板（如Jade或Handlebars）中的变量一样。
// 我们只是在这里使用一些虚拟数据（有些潜在的危险值用于测试），但您可以想象这通常是从DB，文件系统或API异步获取的对象，具体取决于登录用户等。
    var props = {
      items: [
        'Item 0',
        'Item 1',
        'Item </scRIpt>\u2028',
        'Item <!--inject!-->\u2029',
      ],
    }

    // Here we're using React to render the outer body, so we just use the
    // simpler renderToStaticMarkup function, but you could use any templating
    // language (or just a string) for the outer page template
    // 这里我们使用React来渲染外部主体，因此我们只使用更简单的renderToStaticMarkup函数，但是您可以使用任何模板语言（或者仅仅是一个字符串）作为外部页面模板
    var html = ReactDOMServer.renderToStaticMarkup(body(null,

      // The actual server-side rendering of our component occurs here, and we
      // pass our data in as `props`. This div is the same one that the client
      // will "render" into on the browser from browser.js
      //我们组件的实际服务器端渲染发生在这里，并且我们将数据作为“props”传递。
      //这个div与客户端将通过browser.js在浏览器上“render”成一样
      div({
        id: 'content',
        dangerouslySetInnerHTML: {__html: ReactDOMServer.renderToString(App(props))},
      }),

      // The props should match on the client and server, so we stringify them
      // on the page to be available for access by the code run in browser.js
      // You could use any var name here as long as it's unique
      script({
        dangerouslySetInnerHTML: {__html: 'var APP_PROPS = ' + safeStringify(props) + ';'},
      }),

      // We'll load React from a CDN - you don't have to do this,
      // you can bundle it up or serve it locally if you like
      script({src: 'https://cdn.jsdelivr.net/npm/react@16.3.1/umd/react.production.min.js'}),
      script({src: 'https://cdn.jsdelivr.net/npm/react-dom@16.3.1/umd/react-dom.production.min.js'}),
      script({src: 'https://cdn.jsdelivr.net/npm/react-dom-factories@1.0.2/index.min.js'}),
      script({src: 'https://cdn.jsdelivr.net/npm/create-react-class@15.6.3/create-react-class.min.js'}),

      // Then the browser will fetch and run the browserified bundle consisting
      // of browser.js and all its dependencies.
      // We serve this from the endpoint a few lines down.
      script({src: '/bundle.js'})
    ))

    // Return the page to the browser
    res.end(html)

  // This endpoint is hit when the browser is requesting bundle.js from the page above
  } else if (req.url === '/bundle.js') {

    res.setHeader('Content-Type', 'text/javascript')

    // If we've already bundled, send the cached result
    if (BUNDLE != null) {
      return res.end(BUNDLE)
    }

    // Otherwise, invoke browserify to package up browser.js and everything it requires.
    // We also use literalify to transform our `require` statements for React
    // so that it uses the global variable (from the CDN JS file) instead of
    // bundling it up with everything else
    browserify()
      .add('./browser.js')
      .transform(literalify.configure({
        'react': 'window.React',
        'react-dom': 'window.ReactDOM',
        'react-dom-factories': 'window.ReactDOMFactories',
        'create-react-class': 'window.createReactClass',
      }))
      .bundle(function(err, buf) {
        // Now we can cache the result and serve this up each time
        BUNDLE = buf
        res.statusCode = err ? 500 : 200
        res.end(err ? err.message : BUNDLE)
      })

  // Return 404 for all other requests
  } else {
    res.statusCode = 404
    res.end()
  }

// The http server listens on port 3000
}).listen(3000, function(err) {
  if (err) throw err
  console.log('Listening on 3000...')
})


// A utility function to safely escape JSON for embedding in a <script> tag
function safeStringify(obj) {
  return JSON.stringify(obj)
    .replace(/<\/(script)/ig, '<\\/$1')
    .replace(/<!--/g, '<\\!--')
    .replace(/\u2028/g, '\\u2028') // Only necessary if interpreting as JS, which we do
    .replace(/\u2029/g, '\\u2029') // Ditto
}
