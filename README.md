### Project Description
This is an app showing the use of Mongo and JSDO while working with Rollbase. It shows the locations of the snowplows both most recently and at any historical time in the databse. When running queries, it directly calls the MongoDB and when showing the most recent data, it just queries Rollbase. You can view the app at http://locationviewer-22339.onmodulus.net/.

### Directory Descriptions

    app.js                      --> main app for running server
    package.json                --> for npm
    README.md                   --> this file
    SnowPlowDemoService_v2.xml  --> rollbase app
    public/                     --> files for webpage
      css/                      --> css files
        app.css                 --> css file for making the HTML pretty
      img/                      --> images
        loading.gif             --> loading animation
      js/                       --> javascript files
        app.js                  --> declare top-level app module
        controllers.js          --> application controllers
        daterpickermin.js       --> MIT licensed code for the date picker
        directives.js           --> custom angular directives
        filters.js              --> custom angular filters
        services.js             --> custom angular services
      views/                    --> jade views
        main.jade               --> Jade that contains the rendered view of the app