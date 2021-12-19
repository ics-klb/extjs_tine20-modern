//var Ext = Ext || {}; Ext.manifest = Ext.manifest || "classic";
(function() {
var Tools = {
    getExtDir :  function(){
          return KlbSys.paths['Ext'];
    },
    createCookie: function(name, value,days,path) {
        var expires = '';
         path=this.myurl();
         if (days) {
            var date = new Date();
            date.setTime(date.getTime()+(days*24*60*60*1000));
            expires = "; expires="+date.toGMTString();
         }

            document.cookie = name+"="+value+expires+"; path="+path;
    },
    readCookie: function(name) {
         var nameEQ = name + "=";
         var ca = document.cookie.split(';');
         for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
         }
         return null;
    },
    eraseCookie: function(name) {

         Tools.createCookie(name,"",-1);
    },
    getQueryParam: function (name, scriptPath) {
        var regex = RegExp('[?&]' + name + '=([^&]*)');

        var match = regex.exec(location.search) || regex.exec(scriptPath);
        return match && decodeURIComponent(match[1]);
    },
    hasOption: function (opt, queryString) {
        var s = queryString || location.search;
        var re = new RegExp('(?:^|[&?])' + opt + '(?:[=]([^&]*))?(?:$|[&])', 'i');
        var m = re.exec(s);

        return m ? (m[1] === undefined || m[1] === '' ? true : m[1]) : false;
    },

    loadCss: function (url) {
        document.write('<link rel="stylesheet" type="text/css" href="' + url + '"\/>');
    },
    loadScript: function (url, defer) {
        document.write('<script type="text/javascript" src="' + url + '"' + (defer ? ' defer' : '') + '><\/script>');
    },

    doApplication: function () {

        Ext = window.Ext || {};
        Ext.manifest = {
            compatibility: {
               ext: '6.0.1',
               theme: KlbSys.theme,
               resources: KlbSys.paths
           }
        };

        // The value of Ext.repoDevMode gets replaced during a build - do not change this line
        // 2 == internal dev mode, 1 == external dev mode, 0 == build mode
        Ext.devMode = KlbSys.debug ? 1 : 0;
        var scriptEls = document.getElementsByTagName('script'),
            scriptPath = scriptEls[scriptEls.length - 1].src,
            rtl = this.getQueryParam('rtl'),
            appMode = this.getQueryParam('mode', scriptPath) || KlbSys.appMode,
            themeName =  this.getQueryParam('theme', scriptPath) || KlbSys.theme,
            includeCSS = !this.hasOption('nocss', scriptPath),
            hasOverrides = !this.hasOption('nooverrides', scriptPath) && !!{
                // TODO: remove neptune
                neptune: 1,
                triton: 0,
                classic: 0,
                gray: 1,
               'neptune-touch': 1,
                crisp: 1,
               'crisp-touch': 1
            }[themeName],
            i = 4,
            devMode = Ext.devMode,
            extDir = scriptPath,
            rtlSuffix = (rtl ? '-rtl' : ''),
            debugSuffix = (devMode ? '-debug' : ''),
            cssSuffix = rtlSuffix + debugSuffix + '.css',
            themePackageDir, chartsJS, uxJS, themeOverrideJS, extPrefix, extPackagesRoot;

        rtl = rtl && rtl.toString() === 'true';

        while (i--) {
            extDir = extDir.substring(0, extDir.lastIndexOf('/'));
        }

        Ext.manifest = appMode;
        extDir = Tools.getExtDir();
        extPackagesRoot = !devMode ? (extDir + '/build') : extDir  + '/build';

        uxJS = extPackagesRoot + '/packages/ux/' + appMode + '/ux' + debugSuffix + '.js';
        chartsJS = extPackagesRoot + '/packages/charts/' + appMode + '/charts' + debugSuffix + '.js';
        themePackageDir = extPackagesRoot + '/' + appMode + '/theme-' + themeName + '/';

        if (includeCSS) {
            this.loadCss(themePackageDir + 'resources/theme-' + themeName + '-all' + cssSuffix);
//            this.loadCss(extPackagesRoot + '/packages/charts/' + appMode + '/' + themeName + '/resources/charts-all' + cssSuffix);
//            this.loadCss(extPackagesRoot + '/packages/ux/' + appMode + '/' + themeName + '/resources/ux-all' + cssSuffix);
        }
        if (KlbSys.appMode == 'classic') {
            extPrefix = KlbSys.debug ? '/ext-all-debug' : '/ext-all';
        } else {
            extPrefix = KlbSys.debug ? '/ext-modern-all-debug' : '/ext-modern-all';
        }        
        themeOverrideJS = themePackageDir + 'theme-' + themeName + debugSuffix + '.js';

        this.preloadDesktop();
        this.loadScript(extPackagesRoot + extPrefix + rtlSuffix + '.js');
        this.loadScript(themeOverrideJS, true);
        this.loadScript(KlbSys.paths['Klb'] + '/system/Core.js');
    },
    preloadDesktop: function() {
        this.loadCss( KlbSys.paths['Klb'] + '/desktop/resources/css/desktop.css');
        this.loadCss( KlbSys.paths['Klb'] + '/desktop/resources/css/action.css');
        this.loadCss( KlbSys.paths['Klb'] + '/desktop/resources/css/widgets/FilterToolbar.css');
        this.loadCss( KlbSys.paths['Klb'] + '/desktop/resources/css/widgets/Filemanager.css');
        this.loadCss( KlbSys.paths['Klb'] + '/desktop/resources/css/widgets/TagsPanel.css');
    }
};

  Tools.doApplication();
})();
