/*
 * Modern 3.1.0
 * 
 * @package     System
 * @subpackage  Modern
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2007-2010 Metaways Infosystems GmbH (http://www.metaways.de)
 */

/*global Ext, Modern, Locale*/

Ext.ns('Klb', 'Klb.system', 'Klb.Common', 'Klb.Common.util');

/**
 * static common helpers
 */
Klb.system.Common = {

    onApplication:  function (config) {

        Ext.Loader.setPath(config.name, config.appFolder || 'app');
        if (paths = config.paths) {
            for (ns in paths) {
                if (paths.hasOwnProperty(ns)) {
                    Ext.Loader.setPath(ns, paths[ns]);
                }
            }
        }

        config['paths processed'] = true;
        Ext.define(config.name + ".$application", Ext.apply({ extend: 'Ext.app.Application'}, config)
            , function () {
                var App = this;
                    Ext.app.Application.instance = new App();
            }
        );
    },    
    /**
     * Open browsers native popup
     */
    openWindow: function (windowName, url, width, height) {
        // M$ IE has its internal location bar in the viewport
        if (Ext.isIE) {
            height = height + 20;
        }

        // chrome counts window decoration and location bar to window height
        if (Ext.isChrome) {
            height += 40;
        }

        windowName = Ext.isString(windowName) ? windowName.replace(/[^a-zA-Z0-9_]/g, '') : windowName;
        var  w, h, x, y, leftPos, topPos, popup;
        if (document.all) {
            w = document.body.clientWidth;
            h = document.body.clientHeight;
            x = window.screenTop;
            y = window.screenLeft;
        } else {
            if (window.innerWidth) {
                w = window.innerWidth;
                h = window.innerHeight;
                x = window.screenX;
                y = window.screenY;
            }
        }
        leftPos = ((w - width) / 2) + y;
        topPos = ((h - height) / 2) + x;
        try {
            popup = window.open(url, windowName, 'width=' + width + ',height=' + height + ',top=' + topPos + ',left=' + leftPos +
                ',directories=no,toolbar=no,location=no,menubar=no,scrollbars=no,status=no,resizable=yes,dependent=no');
            return popup;
        }
          catch(e) {
            Klb.Logger.info('window.open Exception: ');
            Klb.Logger.info(e);
            popup = false;
          }

        if (! popup) {
            var openCode = "window.open('//clk/system/" + url + "','" + windowName + "','width=" + width + ",height=" + height + ",top=" + topPos + ",left=" + leftPos +
            ",directories=no,toolbar=no,location=no,menubar=no,scrollbars=no,status=no,resizable=yes,dependent=no')";
        
            var exception = {
                openCode: openCode,
                popup: null
            };
            
            Klb.Logger.debug('openCode: ' + openCode);
            popup = openCode;
        }
        
        return popup;
        
    },

    showDebugConsole: function () {
        if (! Klb.system.debug) {
            var head = document.getElementsByTagName("head")[0],
                scriptTag = document.createElement("script");

            scriptTag.setAttribute("src", Ext.Loader.getPath('Klb.system') + '/Debug.js');
            scriptTag.setAttribute("type", "text/javascript");
            head.appendChild(scriptTag);

            var scriptEl = Ext.get(scriptTag);
            scriptEl.on('load', function () {
               Klb.Logger.debug('debug console initialised');
            });
            scriptEl.on('fail', function () {
                Ext.msg.alert('could not activate debug console');
            });

            Klb.system.debug = true;
        } else {
            Klb.Logger.debug('debug console reactivated');
        }
    },
    
    /**
     * Returns localised date and time string
     * 
     * @param {mixed} $_iso8601
     * @see Ext.util.Format.date
     * @return {String} localised date and time
     */
    dateTimeRenderer: function ($_iso8601) {
        var dateObj = $_iso8601 instanceof Date ? $_iso8601 : Ext.Date.parse($_iso8601, Date.patterns.ISO8601Long),
            format = Klb.system.Locale.getTranslationData('Date', 'medium') + ' ' + Klb.system.Locale.getTranslationData('Time', 'medium');

        return Ext.util.Format.date(dateObj, Ext.String.trim(format) ? format :  Date.patterns.MediumDateTime);
    },

    /**
     * Returns localised date string
     * 
     * @param {mixed} date
     * @see Ext.util.Format.date
     * @return {String} localised date
     */
    dateRenderer: function (date) {
        var dateObj = date instanceof Date ? date : Ext.Date.parse(date, Date.patterns.ISO8601Long),
            format = Klb.system.Locale.getTranslationData('Date', 'medium');
        
        return Ext.util.Format.date(dateObj, Ext.String.trim(format) ? format :  Date.patterns.MediumDate);
    },
    
    /**
     * Returns localised number string with two digits if no format is given
     * 
     * @param {Number} v The number to format.
     * @param {String} format The way you would like to format this text.
     * @see Ext.util.Format.number
     * 
     * @return {String} The formatted number.
     */
    floatRenderer: function(v, format) {
        if (! format) {
            // default format by locale and with two decimals
            format = '0' + Klb.App.Api.registry.get('thousandSeparator') + '000' + Klb.App.Api.registry.get('decimalSeparator') + '00';
        }
        return Ext.util.Format.number(v, format);
    },
    
    /**
     * Returns localised time string
     * 
     * @param {mixed} date
     * @see Ext.util.Format.date
     * @return {String} localised time
     */
    timeRenderer: function (date) {
        var dateObj = date instanceof Date ? date : Ext.Date.parse(date, Date.patterns.ISO8601Long);
        
        return Ext.util.Format.date(dateObj,  Klb.system.Locale.getTranslationData('Time', 'medium'));
    },
    
    /**
     * renders bytes for filesize 
     * @param {Integer} value
     * @param {Object} metadata
     * @param {Klb.system.data.Record} record
     * @param {Integer} decimals
     * @param {Boolean} useDecimalValues
     * @return {String}
     */
    byteRenderer: function (value, metadata, record, decimals, useDecimalValues) {
        if (record && record.get('type') == 'folder') {
            return '';
        }
        return Klb.system.Common.byteFormatter(value, null, decimals, useDecimalValues);
    },

    /**
     * format byte values
     * @param {String} value
     * @param {Boolean} forceUnit
     * @param {Integer} decimals
     * @param {Boolean} useDecimalValues
     */
    byteFormatter: function(value, forceUnit, decimals, useDecimalValues) {
        value = parseInt(value, 10);
        decimals = Ext.isNumber(decimals) ? decimals : 2;
        var suffix = ['Bytes', 'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            divisor = useDecimalValues ? 1000 : 1024;
            
        if (forceUnit) {
            var i = suffix.indexOf(forceUnit);
            i = (i == -1) ? 0 : i;
        } else {
            for (var i=0,j; i<suffix.length; i++) {
                if (value < Math.pow(divisor, i)) break;
            }
        }
        return ((i<=1) ? value : Ext.util.Format.round(value/(Math.pow(divisor, Math.max(1, i-1))), decimals)) + ' ' + suffix[i];
    },
    
    /**
     * Returns rendered tags for grids
     * 
     * @param {mixed} tags
     * @return {String} tags as colored squares with qtips
     * 
     * TODO add style for tag divs
     */
    tagsRenderer: function (tags) {
        var result = '';
        if (tags) {
            for (var i = 0; i < tags.length; i += 1) {
                var qtipText = Klb.system.Common.doubleEncode(tags[i].name);
                if (tags[i].description) {
                    qtipText += ' | ' + Klb.system.Common.doubleEncode(tags[i].description);
                }
                if(tags[i].occurrence) {
                    qtipText += ' (' + _('Usage:&#160;') + tags[i].occurrence + ')';
                }
                result += '<div ext:qtip="' + qtipText + '" class="tb-grid-tags" style="background-color:' + (tags[i].color ? tags[i].color : '#fff') + ';">&#160;</div>';
            }
        }
        
        return result;
    },
    
    /**
     * render single tag
     * 
     * @param {Klb.system.Model.Tag} tag
     */
    tagRenderer: function(tag) {
        if (! Klb.system.Common.tagRenderer.tpl) {
            Klb.system.Common.tagRenderer.tpl = new Ext.XTemplate(
                '<div class="tb-grid-tags" style="background-color:{values.color};">&#160;</div>',
                '<div class="x-widget-tag-tagitem-text" ext:qtip="', 
                    '{[this.encode(values.name)]}', 
                    '<tpl if="type == \'personal\' ">&nbsp;<i>(' + _('personal') + ')</i></tpl>',
                    '</i>&nbsp;[{occurrence}]',
                    '<tpl if="description != null && description.length &gt; 1"><hr>{[this.encode(values.description)]}</tpl>" >',
                    
                    '&nbsp;{[this.encode(values.name)]}',
                    '<tpl if="type == \'personal\' ">&nbsp;<i>(' + _('personal') + ')</i></tpl>',
                '</div>',
            {
                encode: function(value) {
                     if (value) {
                        return Klb.system.Common.doubleEncode(value);
                    } else {
                        return '';
                    }
                }
            }).compile();
        }
        
        var result =  _('No Information');
        
        if (tag && Ext.isFunction(tag.beginEdit)) {
            // support records
            tag = tag.data;
        } else if (arguments[2] && Ext.isFunction(arguments[2].beginEdit)) {
            // support grid renderers
            tag = arguments[2].data;
        }
        
        // non objects are treated as ids and -> No Information
        if (Ext.isObject(tag)) {
            result = Klb.system.Common.tagRenderer.tpl.apply(tag);
        }
        
        return result;
    },
    
    /**
     * Returns rendered containers
     * 
     * @TODO show qtip with grants
     * 
     * @param {mixed} container
     * @return {String} 
     */
    containerRenderer: function(container, metaData) {
        // lazy init tempalte
        if (! Klb.system.Common.containerRenderer.tpl) {
            Klb.system.Common.containerRenderer.tpl = new Ext.XTemplate(
                '<div class="x-tree-node-leaf x-unselectable file">',
                    '<img class="x-tree-node-icon" unselectable="on" src="', Ext.BLANK_IMAGE_URL, '">',
                    '<span style="color: {color};">&nbsp;&#9673;&nbsp</span>',
                    '<span> ', '{name}','</span>',
                '</div>'
            ).compile();
        }
        
        var result =  _('No Information');
        
        // support container records
        if (container && Ext.isFunction(container.beginEdit)) {
            container = container.data;
        }
        
        // non objects are treated as ids and -> No Information
        if (Ext.isObject(container)) {
            var name = Ext.isFunction(container.beginEdit) ? container.get('name') : container.name,
                color = Ext.isFunction(container.beginEdit) ? container.get('color') : container.color;
            
            if (name) {
                result = Klb.system.Common.containerRenderer.tpl.apply({
                    name: Ext.util.Format.htmlEncode(name).replace(/ /g,"&nbsp;"),
                    color: color ? color : '#808080'
                });
            } else if (Ext.isObject(metaData)) {
                metaData.css = 'x-form-empty-field';
            }
        }
        
        return result;
    },
    
    /**
     * Returns prettyfied minutes
     * 
     * @param  {Number} minutes
     * @param  {String} format -> {0} will be replaced by Hours, {1} with minutes
     * @param  {String} leadingZeros add leading zeros for given item {i|H}
     * @return {String}
     */
    minutesRenderer: function (minutes, format, leadingZeros) {
        var s,
            i = minutes % 60,
            H = Math.floor(minutes / 60),
            Hs;
        
        if (leadingZeros && (Ext.isString(leadingZeros) || leadingZeros === true)) {
            if (leadingZeros === true || (leadingZeros.match(/i/) && String(i).length === 1)) {
                i = '0' + String(i);
            }
            if (leadingZeros === true || (leadingZeros.match(/H/) && String(H).length === 1)) {
                H = '0' + String(H);
            }
        }
        
        if (! format || ! Ext.isString(format)) {
            s =  Ext.String.format(Klb.system.translation.ngettext('{0} minute', '{0} minutes', i), i);
            Hs =  Ext.String.format(Klb.system.translation.ngettext('{0} hour', '{0} hours', H), H);
            //var ds =  Ext.String.format(Klb.system.translation.ngettext('{0} workday', '{0} workdays', d), d);
            
            if (i === 0) {
                s = Hs;
            } else {
                s = H ? Hs + ', ' + s : s;
            }
            //s = d ? ds + ', ' + s : s;
            
            return s;
        }
        
        return  Ext.String.format(format, H, i);
    },

    /**
     * Returns prettyfied seconds
     * 
     * @param  {Number} seconds
     * @return {String}
     */
    secondsRenderer: function (seconds) {
        
        var s = seconds % 60,
            m = Math.floor(seconds / 60),
            result = '';
        
        var secondResult =  Ext.String.format(Klb.system.translation.ngettext('{0} second', '{0} seconds', s), s);
        
        if (m) {
            result = Klb.system.Common.minutesRenderer(m);
        }
        
        if (s) {
            if (result !== '') {
                result += ', ';
            }
            result += secondResult;
        }
        
        return result;
    },
    
    /**
     * Returns the formated username
     * 
     * @param {object} account object 
     * @return {string} formated user display name
     */
    usernameRenderer: function (accountObject) {
        var result = (accountObject) ? accountObject.accountDisplayName : '';
        
        return Ext.util.Format.htmlEncode(result);
    },
    
    /**
     * Returns a username or groupname with according icon in front
     */
    accountRenderer: function (accountObject, metadata, record, rowIndex, colIndex, store) {
        if (! accountObject) {
            return '';
        }
        var type, iconCls, displayName;
        
        if (accountObject.accountDisplayName) {
            type = 'user';
            displayName = accountObject.accountDisplayName;
        } else if (accountObject.name) {
            type = 'group';
            displayName = accountObject.name;
        } else if (record && record.data.name) {
            type = record.data.type;
            displayName = record.data.name;
        } else if (record && record.data.account_name) {
            type = record.data.account_type;
            displayName = record.data.account_name;
        }
        
        iconCls = type === 'user' ? 'renderer renderer_accountUserIcon' : 'renderer renderer_accountGroupIcon';
        
        return '<div class="' + iconCls  + '">&#160;</div>' + Ext.util.Format.htmlEncode(displayName || '');
    },
    
    /**
     * Returns account type icon
     * 
     * @return String
     */
    accountTypeRenderer: function (type) {
        var iconCls = (type) === 'user' ? 'renderer_accountUserIcon' : 'renderer_accountGroupIcon';
        
        return '<div style="background-position: 0px" class="' + iconCls  + '">&#160;</div>';
    },
    
    /**
     * Returns dropdown hint icon for editor grid columns with comboboxes
     * 
     * @return String
     */
    cellEditorHintRenderer: function (value) {
        return '<div style="position:relative">' + value + '<div class="tine-grid-cell-hint">&#160;</div></div>';
    },

    /**
     * return yes or no in the selected language for a boolean value
     * 
     * @param {string} value
     * @return {string}
     */
    booleanRenderer: function (value) {
        var translationString =  Ext.String.format("{0}",(value == 1) ?  Klb.system.Locale.getTranslationData('Question', 'yes') :  Klb.system.Locale.getTranslationData('Question', 'no'));
        
        return translationString.substr(0, translationString.indexOf(':'));
    },
    
    /**
     * sorts account/user objects
     * 
     * @param {Object|String} user_id
     * @return {String}
     */
    accountSortType: function(user_id) {
        if (user_id && user_id.accountDisplayName) {
            return user_id.accountDisplayName;
        } else if (user_id && user_id.n_fileas) {
            return user_id.n_fileas;
        } else if (user_id && user_id.name) {
            return user_id.name;
        } else {
            return user_id;
        }
    },

    /**
     * sorts records
     * 
     * @param {Object} record
     * @return {String}
     */
    recordSortType: function(record) {
        if (record && Ext.isFunction(record.getTitle)) {
            return record.getTitle();
        } else if (record && record.id) {
            return record.id;
        } else {
            return record;
        }
    },
    
    /**
     * check whether given value can be interpreted as true
     * 
     * @param {String|Integer|Boolean} value
     * @return {Boolean}
     */
    isTrue: function (value) {
        return value === 1 || value === '1' || value === true || value === 'true';
    },
    
    /**
     * check whether object is empty (has no property)
     * 
     * @param {Object} obj
     * @return {Boolean}
     */
    isEmptyObject: function (obj) {
        for (var name in obj) {
            if (obj.hasOwnProperty(name)) {
                return false;
            }
        }
        return true;
    },
    
    /**
     * clone function
     * 
     * @param {Object/Array} o Object or array to clone
     * @return {Object/Array} Deep clone of an object or an array
     */
    clone: function (o) {
        if (! o || 'object' !== typeof o) {
            return o;
        }
        
        if ('function' === typeof o.clone) {
            return o.clone();
        }
        
        var c = '[object Array]' === Object.prototype.toString.call(o) ? [] : {},
            p, v;
            
        for (p in o) {
            if (o.hasOwnProperty(p)) {
                v = o[p];
                if (v && 'object' === typeof v) {
                    c[p] = Klb.system.Common.clone(v);
                }
                else {
                    c[p] = v;
                }
            }
        }
        return c;
    },
    
    /**
     * assert that given object is comparable
     * 
     * @param {mixed} o
     * @return {mixed} o
     */
    assertComparable: function(o) {
        // NOTE: Ext estimates Object/Array by a toString operation
        if (Ext.isObject(o) || Ext.isArray(o)) {
            Klb.system.Common.applyComparableToString(o);
        }
        
        return o;
    },
    
    /**
     * apply Ext.encode as toString functino to given object
     * 
     * @param {mixed} o
     */
    applyComparableToString: function(o) {
        o.toString = function() {return Ext.encode(o)};
    },
    
    /**
     * check if user has right to view/manage this application/resource
     * 
     * @param   {String}      right (view, admin, manage)
     * @param   {String}      application
     * @param   {String}      resource (for example roles, accounts, ...)
     * @returns {Boolean} 
     */
    hasRight: function (right, application, resource) {
        var userRights = [];

        if (! (Klb.system && Klb.App[application] && Klb.App[application].registry && Klb.App[application].registry.get('rights'))) {
            if (! Klb.system.appMgr) {
                console.error('Klb.system.appMgr not yet available');
            } else if (Klb.system.appMgr.get(application)) {
                console.error('Klb.' + application + '.rights is not available, initialisation Error!');
            }
            return false;
        }

        userRights = Klb.App[application].registry.get('rights');
        //console.log(userRights);
        var result = false;
        
        for (var i = 0; i < userRights.length; i += 1) {
            if (userRights[i] === 'admin') {
                result = true;
                break;
            }
            
            if (right === 'view' && (userRights[i] === 'view_' + resource || userRights[i] === 'manage_' + resource)) {
                result = true;
                break;
            }
            
            if (right === 'manage' && userRights[i] === 'manage_' + resource) {
                result = true;
                break;
            }
            
            if (right === userRights[i]) {
                result = true;
                break;
            }
        }
    
        return result;
    },
    
    /**
     * returns random integer number
     * @param {Integer} min
     * @param {Integer} max
     * @return {Integer}
     */
    getRandomNumber: function (min, max) {
        if (min > max) {
            return -1;
        }
        if (min === max) {
            return min;
        }
        return min + parseInt(Math.random() * (max - min + 1), 10);
    },
    /**
     * HTML-encodes a string twice
     * @param {String} value
     * @return {String}
     */
    doubleEncode: function(value) {
        return Ext.util.Format.htmlEncode(Ext.util.Format.htmlEncode(value));
    },
    
    /**
     * resolves an appName to applicationInstance or vice versa
     * returns applicationinstance if getInstance is true
     * @param {String/Klb.system.Application}    app 
     * @param {Boolean}                             getInstance
     */
    resolveApp: function(app, getInstance) {
        if(getInstance) {
            return Ext.isObject(app) ? app : Klb.system.appMgr.get(app);
        }
        return Ext.isObject(app) ? app.name : app;
    },
    
    /**
     * resolves model to modelName or returns recordClass if an application was given
     * @param {String/Klb.system.data.Record}    model
     * @param {String/Klb.system.Application}    app
     */
    resolveModel: function(model, app) {
        var modelName = Ext.isObject(model) ? model.getMeta('modelName') : model;
        if(app) {
            var appName = this.resolveApp(app),
                appMVC = Klb.App[appName] ? Klb.App[appName].registry.get('MVC') : false;
//            return Klb.App[appName].Model[modelName];
            return  appMVC ? appMVC.registry.get('Models') : Klb.App[appName].registry.get('defaultContainer').model; // Klb.App[appName].Model[modelName];
        }
        return modelName;
    }
};

/*!
 * Klb core function JS Library 3.1
 * Copyright(c) 2008-2014 ICS Inc.
 */
Klb.Functions.setAppsPath= function(ns) {
    if ( !Ext.isString(ns) ) return ;
     var subpath =  ns.split("."),
         appName = subpath[2],
         appExtend = subpath[3];
    Ext.Loader.setPath(ns,  Ext.Loader.getPath('KlbDesktop.Apps') + '/' + appName  + '/app/' + appExtend  );
};
Klb.Functions.getModulePath = function(module) {
    
 var subpath_module =  module.split("."),
      len = subpath_module.length;
    if ( len == 1 ) { subpath_module[1] = subpath_module[0]; }
        
    return { subpath: subpath_module[len-2], name:subpath_module[len-1] };
};
Klb.Functions.setMVCPath = function(ns) {
    var  pathns = Klb.Functions.getConfigPath(ns, 'MVC');
     var subpath =  ns.split("."),
         appName = subpath[2],
         appExtend = subpath[3];

//       Ext.Loader.setPath(ns,  Ext.Loader.getPath('KlbDesktop.MVC') + '/' + appName  + '/app/' + appExtend  );
       Ext.Loader.setPath(ns, pathns );
  return pathns;
};
Klb.Functions.getConfigPath = function(ns, subname) {
    if ( !Ext.isString(ns) ) return ;
     var pathns = Ext.Loader.getPath('KlbDesktop.' + subname )+'/'
        , subpath =  ns.split("."), appName = subpath[2];
        pathns +=  appName  + '/app' ;
      if ( subpath.length > 3 ) {
          for( var i=3; i< subpath.length; ++i )  pathns += subpath[i] != '*' ? '/' + subpath[i] : '';
      }
    return pathns;
};
Klb.Functions.getBasePath = function () {
    return Klb.Common.getUrlParams("desktop", "rest");
};

Klb.Functions.getImagePath = function () {
    return Klb.Common.getUrlParams("desktop", "image");
};

Klb.Functions.setMaxUploadSize = function (size) {
    Klb.Common.sizes.maxUploadSize = size;
};

Klb.Functions.getMaxUploadSize = function () {
    return Klb.Common.sizes.maxUploadSize;
};

Klb.Functions.getSize = function (name) {
    return 10;
};

Klb.Functions.setAvailableImageFormats = function (formats) {
    Klb.Common.formats.imageFormats = formats;
};

Klb.Functions.getAvailableImageFormats = function () {
    return Klb.Common.formats.imageFormats;
};

Klb.Functions.bytesToSize = function (bytes) {
    var sizes = ['Bytes', 'Kb', 'Mb', 'Gb', 'Tb'];
    if (bytes === 0) return 'n/a';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)),10);
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

Klb.Functions.serializeRecords = function (records) {
    var finalData = [];
    for (var i=0;i<records.length;i++) {
         finalData.push(records[i].data);
     }
    return finalData;
};

Ext.define('Klb.Common', {
    extend: "Object",
    singleton: true,
    sizes: { maxUploadSize: 0, page_grid: 10 },
    formats: {},
    DATA_XTYPE:  'json',
    /* login url */
    DESKTOP_SERVICE_URL     :  KlbSys.requestUrl,
    DESKTOP_POLLING_INTERVAL:  2000, 
    VARS: { 
         defaultval: 0, 
         datetime: {  format: 'j.n.Y H:i:s' },
         timedate: {  format: 'H:i:s j.n.Y' },
         datetimeshort: { format: 'j.n H:i:s' },
         date:      {  format: 'j.n.Y' },
         time:      {  format: 'H:i:s' }
    },
    /* The directory where the resourceare */
    USERS_AVATAR_PATH     : "/resources/avatars/",
    BASE_PATH             : Ext.Loader.getPath('Klb'),
    DESKTOP_RESOURCE_PATH : Ext.Loader.getPath('Klb') + "/resources/",
    MODULES_RESOURCE_PATH : Ext.Loader.getPath('Klb') + "/modern/modules/",
    MVC_RESOURCE_PATH     : Ext.Loader.getPath('Klb') + "/modern/mvc/",
    /* The directory where the JS's are*/ 
    RESOURCE_PATH         :  Ext.Loader.getPath('Klb') + "/resources/",
    RESOURCE_PATH_IMAGES  :  Ext.Loader.getPath('Klb') + "/resources/images/",
    RESOURCE_PATH_ICONS   :  Ext.Loader.getPath('Klb') + "/resources/images/icons/",
    LANGUAGE_PATH         :  Ext.Loader.getPath('Klb') + "/modern/language/",
    JS_PATH                :  "/js/",

    ICONS: {
         defaultic:   { img: Ext.Loader.getPath('Klb') + "/resources/images/text_font_default.png",  iclass: 'ico-default' },
         add:         { img: Ext.Loader.getPath('Klb') + "/resources/images/add.gif",  iclass: 'ico-add' },
         cancel:      { img: Ext.Loader.getPath('Klb') + "/resources/images/icons/cancel.png",  iclass: 'ico-cancel' },
         edit:        { img: Ext.Loader.getPath('Klb') + "/resources/images/edit.gif",  iclass: 'ico-edit' },
         delete_btn:  { img: Ext.Loader.getPath('Klb') + "/resources/images/ext-delete.gif", iclass: 'ico-delete' },
         delete_rnd:  { img: Ext.Loader.getPath('Klb') + "/resources/images/icons/delete.png", iclass: 'ico-delete_rnd' },
         copy:        { img: Ext.Loader.getPath('Klb') + "/resources/images/ext-delete.gif", iclass: 'ico-copy' },
         paste:       { img: Ext.Loader.getPath('Klb') + "/resources/images/ext-delete.gif", iclass: 'ico-paste' },
         cut:         { img: Ext.Loader.getPath('Klb') + "/resources/images/ext-delete.gif", iclass: 'ico-cut' },
         refresh:     { img: Ext.Loader.getPath('Klb') + "/resources/images/ext-delete.gif", iclass: 'ico-refresh' },
         search:      { img: Ext.Loader.getPath('Klb') + "/resources/images/ext-search.gif",  iclass: 'ico-search' },
         magnifier:   { img: Ext.Loader.getPath('Klb') + "/resources/images/icons/magnifier.png",  iclass: 'ico-magnifier' },
         helpdesk:    { img: Ext.Loader.getPath('Klb') + "/resources/images/icon_helpdesk.gif",  iclass: 'ico-helpdesk' },
         apply:       { img: Ext.Loader.getPath('Klb') + "/resources/images/apply.gif",  iclass: 'ico-apply' },
         accept:      { img: Ext.Loader.getPath('Klb') + "/resources/images/accept.gif",  iclass: 'ico-accept' },
         tick:        { img: this.RESOURCE_PATH    + "images/icons/tick.png",  iclass: 'ico-tick' },
         ok:          { img: Ext.Loader.getPath('Klb') + "/resources/images/icons/tick.png",  iclass: 'ico-ok' },
         decline:     { img: Ext.Loader.getPath('Klb') + "/resources/images/decline.png",  iclass: 'ico-decline' },
         notpermit:   { img: Ext.Loader.getPath('Klb') + "/resources/images/notpermit.gif",  iclass: 'ico-notpermit' },
         excel:       { img: Ext.Loader.getPath('Klb') + "/resources/images/ms_excel.gif",  iclass: 'ico-excel' },
         word:        { img: Ext.Loader.getPath('Klb') + "/resources/images/word.gif",  iclass: 'ico-word' },
         office:      { img: Ext.Loader.getPath('Klb') + "/resources/images/office.png",  iclass: 'ico-office' },
         pdf:         { img: Ext.Loader.getPath('Klb') + "/resources/images/pdf_export.gif",  iclass: 'ico-pdf' },
         locked:      { img: Ext.Loader.getPath('Klb') + "/resources/images/locked.gif",  iclass: 'ico-locked' },
         arrow_curve_left: { img: Ext.Loader.getPath('Klb') + "/resources/images/icons/arrow_curve_000_left.png",  iclass: 'ico-arrow_curve_left' },
         arrow_dw:    { img: Ext.Loader.getPath('Klb') + "/resources/images/icons/arrow_down.png",  iclass: 'ico-arrow_dw' },
         arrow_up:    { img: Ext.Loader.getPath('Klb') + "/resources/images/icons/arrow_up.png",  iclass: 'ico-arrow_up' },
    },
     /* Default Json params  */
    JSON_READER_ROOT: 'root',
    JSON_READER_PROPERTY_TOTAL: 'total',
    JSON_READER_PROPERTY_LIST: 'list',
     /* Default width and height for windows */
    GRID_PAGE_SIZE: 25,
    GRID_STEPS: 10,
    DEFAULT_WINDOW_WIDTH    : 800,
    DEFAULT_WINDOW_HEIGHT   : 480
     , getVars: function(name, options) {
         res = this.VARS.defaultval;
         if ( !isnull(this.VARS[name]) )
              res = this.VARS[name][options];
         return res;
     }
     , iconImg: function(name) {
         res = this.ICONS.defaultic.img;
         if ( !isnull(this.ICONS[name]) )
            res =   this.ICONS[name].img;
         return res;
     }
     , iconCls: function(name) {
         res = this.ICONS.defaultic.iclass;
         if ( !isnull(this.ICONS[name]) )
            res = this.ICONS[name].iclass;
         return res;
     }
     , appendQuery: function(url, parameters) {
         if (!parameters ||  isnull(url) ) {
              return null;
          }
         if (!parameters &&  !isnull(url) ) {
              return url;
          }
         var hash = "", indxOf = url.indexOf('#');
         if (indxOf !== -1) {
              hash = url.substring(indxOf);
              url = url.substring(0, indxOf);
          }
          
         var q = [];
         for (var key in parameters) {
              if (parameters.hasOwnProperty(key)) {
                   q.push(key + "=" + encodeURIComponent(parameters[key]));
               }
          }
        return url + (url.indexOf("?") == -1 ? "?" : "&") + q.join("&") + (hash != '' ? hash: '');
     }
     , getUrlParams: function(xtype, name, parameters) {
         var me = this;
         return this.appendQuery( me.getUrl(xtype, name), parameters );
     }
     , getUrl: function(xtype, name) {
        if (xtype == 'desktop' && name == 'service' )
           return this.DESKTOP_SERVICE_URL +'?rt='+this.DATA_XTYPE;
         else 
            return this.DESKTOP_SERVICE_URL + '?wdt=' + name+'&wizard='+xtype+'&rt='+this.DATA_XTYPE;
     }
});

Ext.define('Klb.Common.util.Date', {

    singleton: true,

    diffDays: function(start, end) {
        var day = 1000 * 60 * 60 * 24,
            clear = Ext.Date.clearTime,
            diff = clear(end, true).getTime() - clear(start, true).getTime();

        return Math.ceil(diff / day);
    },

    copyTime: function(fromDt, toDt) {
        var dt = Ext.Date.clone(toDt);
        dt.setHours(
            fromDt.getHours(),
            fromDt.getMinutes(),
            fromDt.getSeconds(),
            fromDt.getMilliseconds());

        return dt;
    },

    compare: function(dt1, dt2, precise) {
        if (precise !== true) {
            dt1 = Ext.Date.clone(dt1);
            dt1.setMilliseconds(0);
            dt2 = Ext.Date.clone(dt2);
            dt2.setMilliseconds(0);
        }
        return dt2.getTime() - dt1.getTime();
    },

    isMidnight: function(dt) {
        return dt.getHours() === 0 &&
            dt.getMinutes() === 0 &&
            dt.getSeconds() === 0 &&
            dt.getMilliseconds() === 0;
    },

    // private helper fn
    maxOrMin: function(max) {
        var dt = (max ? 0: Number.MAX_VALUE),
            i = 0,
            args = arguments[1],
            ln = args.length;
        for (; i < ln; i++) {
            dt = Math[max ? 'max': 'min'](dt, args[i].getTime());
        }
        return new Date(dt);
    },

    max: function() {
        return this.maxOrMin.apply(this, [true, arguments]);
    },

    min: function() {
        return this.maxOrMin.apply(this, [false, arguments]);
    },

    today: function() {
        return Ext.Date.clearTime(new Date());
    },

    add : function(dt, o) {
        if (!o) {
            return dt;
        }
        var ExtDate = Ext.Date,
            dateAdd = ExtDate.add,
            newDt = ExtDate.clone(dt);

        if (o.years) {
            newDt = dateAdd(newDt, ExtDate.YEAR, o.years);
        }
        if (o.months) {
            newDt = dateAdd(newDt, ExtDate.MONTH, o.months);
        }
        if (o.weeks) {
            o.days = (o.days || 0) + (o.weeks * 7);
        }
        if (o.days) {
            newDt = dateAdd(newDt, ExtDate.DAY, o.days);
        }
        if (o.hours) {
            newDt = dateAdd(newDt, ExtDate.HOUR, o.hours);
        }
        if (o.minutes) {
            newDt = dateAdd(newDt, ExtDate.MINUTE, o.minutes);
        }
        if (o.seconds) {
            newDt = dateAdd(newDt, ExtDate.SECOND, o.seconds);
        }
        if (o.millis) {
            newDt = dateAdd(newDt, ExtDate.MILLI, o.millis);
        }

        return o.clearTime ? ExtDate.clearTime(newDt) : newDt;
    }
});