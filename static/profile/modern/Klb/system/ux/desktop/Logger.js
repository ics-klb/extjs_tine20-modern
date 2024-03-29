/*
 * IcsDesktop 2.4.0
 * 
 * @package     Modern
 * @subpackage  LogManager
 * @copyright   Copyright (c) 2018 LLC ICS (http://www.icstime.com)
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 */

Ext.define('Klb.system.ux.desktop.LogManager', {
    extend: 'Ext.util.Observable',
    singleton: true,
    logTpl: new Ext.Template('<p class="entry {level}">[{time:date("H:i:s")}]: {text}</p>'),

    levels: ['error', 'warning', 'info', 'debug', 'trace'],
    maxEntries: 1000,
    entries: [
        '<p class="entry error">:: Errors enabled</p>',
        '<p class="entry warning">:: Warnings enabled</p>',
        '<p class="entry info">:: Info enabled</p>',
        '<p class="entry debug">:: Debug enabled</p>',
        '<p class="entry trace">:: Trace enabled</p>',
        '<p class="entry always" />'
    ],

    constructor: function () {
	if ( ExtJsVersion ==  '4.2.1')
         this.addEvents({
             'updateLog': true,
             'clearLog': true
         });

        this.init();

        this.callParent(arguments);
    },

    /**
    * Reinitializes logger with custom configuration
    */
    init: function (config) {
        Ext.apply(this, config);
    },

    /**
    * Clears log
    */
    clear: function () {
        this.entries = [];
        this.fireEvent('clearLog', this);
    },

    /**
    * Adds new entry in log
    *
    * @param {Object} ms            Log message object, e.g. {time: new Date(), text: 'Message'}, or just 'Message' (current time will be used)
    * @param {Object} level	    Log message level ('error', 'warning', 'info', 'debug', 'trace')
    * @param {Object} htmlEncode    If true, first do html encoding of log message (default: <em>true</em>
    */
    log: function (msg, level, htmlEncode) {
        var msg = msg || '?';

        if (typeof msg === 'object') {
            if (!msg.text)
                msg = msg.toSource ? msg.toSource() : Ext.encode(msg);
        }
        else if (typeof msg === 'string')
            msg = { text: msg };

        Ext.applyIf(msg, {
            level: level || msg.level || 'info',
            time: new Date()
        });

        if (htmlEncode)
            msg.text = Ext.util.Format.htmlEncode(msg.text);

        var entry = this.logTpl.apply(msg);
        this.entries.push(entry);

        if (this.entries.length > this.maxEntries)
            this.entries.shift();

        this.fireEvent('updateLog', this, entry);
    },

    error: function (msg, htmlEncode) {
        this.log(msg, 'error', htmlEncode);
    },

    warning: function (msg, htmlEncode) {
        this.log(msg, 'warning', htmlEncode);
    },

    info: function (msg, htmlEncode) {
        this.log(msg, 'info', htmlEncode);
    },

    debug: function (msg, htmlEncode) {
        this.log(msg, 'debug', htmlEncode);
    },

    trace: function (msg, htmlEncode) {
        this.log(msg, 'trace', htmlEncode);
    },

    exception: function (ex, htmlEncode) {
        this.error(ex.exception, htmlEncode);
        if (ex.stackTrace)
            this.trace(ex.stackTrace, htmlEncode);
    }
});

Ext.define('Klb.system.ux.desktop.Logger', {
    extend: 'Ext.container.Container',
    alias: 'widget.xlogger',
    xtype: 'xlogger',

    baseCls: 'x-logger-container',

    maxVisible: Klb.system.ux.desktop.LogManager.maxEntries,

    levelsText: ['Error', 'Warning', 'Info', 'Debug', 'Trace'],
    mask: ['error', 'warning', 'info' ],
    alwaysOnTopText: 'Always on Top',

    /**
     * @cfg {Boolean} docked
     * If true, panel will be rendered directly to document body
     */
    docked: false,

    /**
     * @cfg {Boolean/String/Ext.resizer.Resizer} resizable
     * For docked log panels, this parameter defines if it should be resizable, and
     * it can optionally define resizer configuration.
     * If parameter passed is string (e.g. 'n w nw'), it will be treated as handles config 
     * for resizer. If true, it will use default resizer.
     */
    resizable: false,

    alwaysOnTop: false,
    layout: {
        type: 'hbox',
        align: 'stretch'
    },
    
    initComponent: function() {
        var me = this;

        var logArea = Ext.create('Ext.Component', {
            cls: 'x-logger',
            flex: 1,
            html: Klb.system.ux.desktop.LogManager.entries.join('')
        });

        var p = [];
        p.push({ a: 1 });

        /* Log toolstrip */
        var buttonsConfig = [];
        for (var i = 0, level; level = Klb.system.ux.desktop.LogManager.levels[i]; i++) {
            buttonsConfig.push({
                xtype: 'button',
                iconCls: 'x-logger-bt ' + level,
                enableToggle: true,
                pressed: (Ext.Array.indexOf(this.mask, level) != -1),
                tooltip: this.levelsText[i],
                maskLevel: level,
                toggleHandler: function(bt, state) {
                    if (state) 
                        me.addCls(this.maskLevel);
                    else
                        me.removeCls(this.maskLevel);
                }
            });	
        }

        if (this.docked) {
            buttonsConfig.push({
                xtype: 'button',
                iconCls: 'x-logger-bt top',
                enableToggle: true,
                scope: this,
                pressed: false,
                tooltip: this.alwaysOnTopText,
                toggleHandler: function(bt, state) {
                    this.alwaysOnTop = state;
                    if (state)
                        this.addCls('on-top');
                    else
                        this.removeCls('on-top');
                }
            });
        }

        if (this.docked && this.resizable) {
            var handles = 'n w nw';
            switch (typeof this.resizable) {
                case 'string':
                    handles = this.resizable;
                case 'boolean':
                    this.resizable = {
                        handles: handles,
                        dynamic: true,
                        transparent: true,
                        constrainTo: Ext.getBody()
                    }
                    break;
                default: 
                    break;
            }
        }

        var toolbar = Ext.create('Ext.container.Container', {
            width: 20,
            layout: 'vbox',
            items: buttonsConfig
        });

        var cls = this.mask.join(' ');
        if (this.docked)
            cls += ' x-logger-docked';
        
        Ext.apply(this, {
            cls: cls,
            renderTo: this.docked ? Ext.getBody() : this.renderTo,
            logArea: logArea,
            items: [ logArea, toolbar ]
        });

        this.callParent();

        Klb.system.ux.desktop.LogManager.on('updateLog', this.onUpdate, this);
        Klb.system.ux.desktop.LogManager.on('clearLog', this.onClear, this);

    },

    onClear: function(logger) {
        var el = this.logArea.el;
        while (el.dom.firstChild)
            el.dom.removeChild(el.dom.firstChild);
    },

    onUpdate: function(logger, entry) {
        var el = this.logArea.el;
        Ext.DomHelper.append(this.logArea.el, entry);
        if (el.dom.childNodes.length > this.maxVisible)
            el.dom.removeChild(el.dom.firstChild);

        el.dom.scrollTop = el.dom.scrollHeight;
    },

    beforeDestroy: function() {
        Klb.system.ux.desktop.LogManager.un('updateLog', this.onUpdate, this);
        Klb.system.ux.desktop.LogManager.un('clearLog', this.onClear, this);

        this.callParent();
    }
});

