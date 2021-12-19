/**
 * for some reasons the original fix insertes two <br>'s on enter for webkit. But this is one to much
 */

Ext.applyIf(Array.prototype, {
    /**
     * Returns an object with ids of records to delete, to create or to update
     *
     * @param {Array} toCompare Array to compare with
     * @return object An object with sub array properties 'toDelete', 'toCreate' and 'toUpdate'
     */
    getMigration: function(toCompare) {
        return {
            toDelete: this.diff(toCompare),
            toCreate: toCompare.diff(this),
            toUpdate: this.intersect(toCompare)
        };
    },

    /**
     * Returns an array containing all the entries from this array that are not present in any of the other arrays.
     *
     * @param {Array} array1
     * @param {Array} [array2]
     * @param {Array} [...]
     */
    diff: function() {
        var allItems = [],
            diffs = [];

        // create an array containing all items of all args
        for (var i=0; i<arguments.length; i++) {
            allItems = allItems.concat(arguments[i]);
        }

        // check which item is not present in all args
        Ext.each(this, function(item) {
            if (allItems.indexOf(item) < 0) {
                diffs.push(item);
            }
        }, this);


        return diffs;
    },

    /**
     * simple map fn
     *
     * @param {Function} fn
     */
    map: function(fn) {
        var map = [];
        Ext.each(this, function(v, i) {
            map.push(fn.call(this, v, i));
        }, this);

        return map;
    },

    /**
     * returns an array containing all the values of this array that are present in all the arguments.
     *
     * @param {Array} array1
     * @param {Array} [array2]
     * @param {Array} [...]
     */
    intersect: function() {
        var allItems = [],
            intersect = [];

        // create an array containing all items of all args
        for (var i=0; i<arguments.length; i++) {
            allItems = allItems.concat(arguments[i]);
        }

        // check which item is not present in all args
        Ext.each(this, function(item) {
            if (allItems.indexOf(item) >= 0) {
                intersect.push(item);
            }
        }, this);


        return intersect;
    },

    /**
     * Creates a copy of this Array, filtered to contain only unique values.
     * @return {Array} The new Array containing unique values.
     */
    unique: function() {
        return Ext.unique(this);
    }
});

Ext.Date.patterns={
    ISO8601Long: "d-m-Y H:i:sP",
    ISO8601Short:"d-m-Y",
    ShortDate: "j/n/y",
    FullDateTime: "l, F d, Y g:i:s A",
    LongTime: "g:i:s A",
    SortableDateTime: "d-m-Y\ H:i:s",
    UniversalSortableDateTime: "Y-m-d H:i:sO", 
    CustomFormat: "H:i d-m"
};

Ext.apply(Date.prototype, {
    // private
    dateFormat : function(format) {
        if (Date.formatFunctions[format] == null) {
            Date.createFormat(format);
        }
        return Date.formatFunctions[format].call(this);
    },
    getTimezone : function() {
 
        return this.toString().replace(/^.* (?:\((.*)\)|([A-Z]{1,4})(?:[\-+][0-9]{4})?(?: -?\d+)?)$/, "$1$2").replace(/[^A-Z]/g, "");
    },
    clone : function() {
        return new Date(this.getTime());
    },
    clearTime : function(clone) {
        if (clone) {
            return this.clone().clearTime();
        }

        // get current date before clearing time
        var d = this.getDate();

        // clear time
        this.setHours(0);
        this.setMinutes(0);
        this.setSeconds(0);
        this.setMilliseconds(0);

        if (this.getDate() != d) { // account for DST (i.e. day of month changed when setting hour = 0)
            // note: DST adjustments are assumed to occur in multiples of 1 hour (this is almost always the case)
            // refer to http://www.timeanddate.com/time/aboutdst.html for the (rare) exceptions to this rule

            // increment hour until cloned date == current date
            for (var hr = 1, c = this.add(Date.HOUR, hr); c.getDate() != d; hr++, c = this.add(Date.HOUR, hr));

            this.setDate(d);
            this.setHours(c.getHours());
        }

        return this;
    },
    add : function(interval, value) {
        var d = this.clone();
        if (!interval || value === 0) return d;

        switch(interval.toLowerCase()) {
            case Ext.Date.MILLI:
                d.setMilliseconds(this.getMilliseconds() + value);
                break;
            case Ext.Date.SECOND:
                d.setSeconds(this.getSeconds() + value);
                break;
            case Ext.Date.MINUTE:
                d.setMinutes(this.getMinutes() + value);
                break;
            case Ext.Date.HOUR:
                d.setHours(this.getHours() + value);
                break;
            case Ext.Date.DAY:
                d.setDate(this.getDate() + value);
                break;
            case Ext.Date.MONTH:
                var day = this.getDate();
                if (day > 28) {
                    day = Math.min(day, this.getFirstDateOfMonth().add('mo', value).getLastDateOfMonth().getDate());
                }
                d.setDate(day);
                d.setMonth(this.getMonth() + value);
                break;
            case Ext.Date.YEAR:
                d.setFullYear(this.getFullYear() + value);
                break;
        }
        return d;
    },
    between : function(start, end) {
        var t = this.getTime();
        return start.getTime() <= t && t <= end.getTime();
    }
});

Ext.apply(Ext.panel.Panel.prototype, {
    border: 0
});

Ext.apply(Ext.Date.prototype, {
 
     formatContainsHourInfo: (function(){
        var stripEscapeRe = /(\\.)/g,
            hourInfoRe = /([gGhHisucUOPZ]|M\$)/;
        return function(format){
            return hourInfoRe.test(format.replace(stripEscapeRe, ''));
        };
    })()
});

Ext.override(Ext.form.DateField, {
    altFormats : "m/d/Y|n/j/Y|n/j/y|m/j/y|n/d/y|m/j/Y|n/d/Y|m-d-y|m-d-Y|m/d|m-d|md|mdy|mdY|d|Y-m-d|n-j|n/j",
 
     // @cfg {Number} startDay
     // Day index at which the week should begin, 0-based (defaults to 0, which is Sunday)
     //
    startDay : 0,

    // in the absence of a time value, a default value of 12 noon will be used
    // (note: 12 noon was chosen because it steers well clear of all DST timezone changes)
    initTime: '12', // 24 hour format
    initTimeFormat: 'H',
 
    // private
    parseDate : function(value) {
        if(!value || Ext.isDate(value)){
            return value;
        }
        var v = this.safeParse(value, this.format),
            af = this.altFormats,
            afa = this.altFormatsArray;
        if (!v && af) {
            afa = afa || af.split("|");
            for (var i = 0, len = afa.length; i < len && !v; i++) {
                v = this.safeParse(value, afa[i]);
            }
        }
        return v;
    }
});

Ext.override(Ext.form.TimeField, {
    altFormats : "g:ia|g:iA|g:i a|g:i A|h:i|g:i|H:i|ga|ha|gA|h a|g a|g A|gi|hi|gia|hia|g|H|gi a|hi a|giA|hiA|gi A|hi A",	
    initDateFormat: 'j/n/Y',
    setLimit: function(value, isMin, initial){	
        var d;	
        if(Ext.isString(value)) {
            d = this.parseDate(value);
        } else if(Ext.isDate(value)){
            d = value;
        }
        if(d){
            var val = new Date(this.initDate).clearTime();
            val.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());	
            this[isMin ? 'minValue' : 'maxValue'] = val;	
            if(!initial){	
                this.generateStore();	
            }	
        }	
    },
    parseDate: function(value) {	
        if (!value || Ext.isDate(value)) {
            return value;
        }
        var id = this.initDate + ' ',
            idf = this.initDateFormat + ' ',
            v = Ext.Date.parse(id + value, idf + this.format), // *** handle DST. note: this.format is a TIME-only format
            af = this.altFormats;
        if (!v && af) {
            if (!this.altFormatsArray) {
                this.altFormatsArray = af.split("|");
            }
            for (var i = 0, afa = this.altFormatsArray, len = afa.length; i < len && !v; i++) {
                v = Ext.Date.parse(id + value, idf + afa[i]);
            }
        }
        return v;	
    }	
});

Ext.apply(Ext.form.HtmlEditor.prototype, {
        fixKeys : function(){ // load time branching for fastest keydown performance
        if(Ext.isIE){
            return function(e){
                var k = e.getKey(),
                    doc = this.getDoc(), r;
                if(k == e.TAB){
                    e.stopEvent();
                    r = doc.selection.createRange();
                    if(r){
                        r.collapse(true);
                        r.pasteHTML('&nbsp;&nbsp;&nbsp;&nbsp;');
                        this.deferFocus();
                    }
                }else if(k == e.ENTER){
                    r = doc.selection.createRange();
                    if(r){
                        var target = r.parentElement();
                        if(!target || target.tagName.toLowerCase() != 'li'){
                            e.stopEvent();
                            r.pasteHTML('<br />');
                            r.collapse(false);
                            r.select();
                        }
                    }
                }
            };
        }else if(Ext.isOpera){
            return function(e){
                var k = e.getKey();
                if(k == e.TAB){
                    e.stopEvent();
                    this.win.focus();
                    this.execCmd('InsertHTML','&nbsp;&nbsp;&nbsp;&nbsp;');
                    this.deferFocus();
                }
            };
        }else if(Ext.isWebKit){
            return function(e){
                var k = e.getKey();
                if(k == e.TAB){
                    e.stopEvent();
                    this.execCmd('InsertText','\t');
                    this.deferFocus();
                }
             };
        }
    }(),
    
    adjustFont: function(btn){
        var adjust = btn.getItemId() == 'increasefontsize' ? 1 : -1,
            doc = this.getDoc(),
            v = parseInt(doc.queryCommandValue('FontSize') || 2, 10);
        if(Ext.isAir){
            if(v <= 10){
                v = 1 + adjust;
            }else if(v <= 13){
                v = 2 + adjust;
            }else if(v <= 16){
                v = 3 + adjust;
            }else if(v <= 18){
                v = 4 + adjust;
            }else if(v <= 24){
                v = 5 + adjust;
            }else {
                v = 6 + adjust;
            }
            v = v.constrain(1, 6);
        }else{
            v = Math.max(1, v+adjust);
        }
        this.execCmd('FontSize', v);
    }
    
});

/**
 * fix broken ext email validator
 * 
 * @type RegExp
 */
Ext.apply(Ext.form.VTypes, {
    // 2011-01-05 replace \w with [^\s,\x00-\x2F,\x3A-\x40,\x5B-\x60,\x7B-\x7F] to allow idn's
//    emailFixed:  /^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:([^\s,\x00-\x2F,\x3A-\x40,\x5B-\x60,\x7B-\x7F]|-)+\.)*[^\s,\x00-\x2F,\x3A-\x40,\x5B-\x60,\x7B-\x7F]([^\s,\x00-\x2F,\x3A-\x40,\x5B-\x60,\x7B-\x7F]|-){0,66})\.([^\s,\x00-\x2F,\x3A-\x40,\x5B-\x60,\x7B-\x7F]{2,6}?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i,
    emailFixed:  /^([a-z0-9_\+-\.]+@[a-z0-9-\.]{1,})/i,
    
    urlFixed: /(((^https?)|(^ftp)):\/\/(([^\s,\x00-\x2F,\x3A-\x40,\x5B-\x60,\x7B-\x7F]|-)+\.)+[^\s,\x00-\x2F,\x3A-\x40,\x5B-\x60,\x7B-\x7F]{2,3}(\/([^\s,\x00-\x2F,\x3A-\x40,\x5B-\x60,\x7B-\x7F]|-|%)+(\.[^\s,\x00-\x2F,\x3A-\x40,\x5B-\x60,\x7B-\x7F]{2,})?)*((([^\s,\x00-\x2F,\x3A-\x40,\x5B-\x60,\x7B-\x7F]|[\-\.\?\\\/+@&#;`~=%!])*)(\.[^\s,\x00-\x2F,\x3A-\x40,\x5B-\x60,\x7B-\x7F]{2,})?)*\/?)/i,
    
    email:  function(v) {
        return this.emailFixed.test(v);
    },
    
    url: function(v) {
        return this.urlFixed.test(v);
    }
});

//fix textfield allowBlank validation
Ext.override(Ext.form.field.Text, {
    validator:function(text){
        return this.allowBlank!==false || Ext.String.trim(text).length > 0;
    }
});

Ext.form.DateField.prototype.setValue = function(date){
     // get value must not return a string representation, so we convert this always here
    // before memorisation
    if (Ext.isString(date)) {
        var v = Ext.Date.parse(date, Date.patterns.ISO8601Long);
        if (Ext.isDate(v)) {
            date = v;
        } else {
            date = Ext.form.DateField.prototype.parseDate.call(this, date);
        }
    }
 
    // preserve original datetime information
    this.fullDateTime = date;
    Ext.form.DateField.superclass.setValue.call(this, this.formatDate(this.parseDate(date)));
};


Ext.form.DateField.prototype.getValue = function(){
    //var value = this.parseDate(Ext.form.DateField.superclass.getValue.call(this));
    
    // return the value that was set (has time information when unchanged in client) 
    // and not just the date part!
    var value =  this.fullDateTime;
    return value || "";
};

/**
 * rename window
 */
Ext.window.Window.prototype.rename = function(newId) {
    // Note PopupWindows are identified by name, whereas Ext.windows
    // get identified by id this should be solved some time ;-)
    var manager = this.manager || Ext.WindowMgr;
    manager.unregister(this);
    this.id = newId;
    manager.register(this);
};

/**
 * utility class used by Button
 * 
 * Fix: http://yui-ext.com/forum/showthread.php?p=142049
 * adds the ButtonToggleMgr.getSelected(toggleGroup, handler, scope) function
 */
Ext.button.ButtonToggleMgr = function(){
   var groups = {};
   
   function toggleGroup(btn, state){
       if(state){
           var g = groups[btn.toggleGroup];
           for(var i = 0, l = g.length; i < l; i++){
               if(g[i] != btn){
                   g[i].toggle(false);
               }
           }
       }
   }
   
   return {
       register : function(btn){
           if(!btn.toggleGroup){
               return;
           }
           var g = groups[btn.toggleGroup];
           if(!g){
               g = groups[btn.toggleGroup] = [];
           }
           g.push(btn);
           btn.on("toggle", toggleGroup);
       },
       
       unregister : function(btn){
           if(!btn.toggleGroup){
               return;
           }
           var g = groups[btn.toggleGroup];
           if(g){
               g.remove(btn);
               btn.un("toggle", toggleGroup);
           }
       },
       
       getSelected : function(toggleGroup, handler, scope){
           var g = groups[toggleGroup];
           for(var i = 0, l = g.length; i < l; i++){
               if(g[i].pressed === true){
                   if(handler) {
                        handler.call(scope || g[i], g[i]);
                   }
                   return g[i];
               }
           }
           return;
       }
   };
}();

/**
 * add more options to Ext.form.ComboBox
 */
Ext.form.ComboBox.prototype.initComponent = Ext.Function.createSequence(Ext.form.ComboBox.prototype.initComponent, function() {

    if (this.expandOnFocus) {
        this.lazyInit = false;
        this.on('focus', function(){
            this.onTriggerClick();
        });
    }

    if (this.blurOnSelect) {
        this.on('select', function(){
            this.blur(true);
            this.fireEvent('blur', this);
        }, this);
    }

});
Ext.form.ComboBox.prototype.triggerAction = 'all';

/**
 * add beforeloadrecords event
 */
Ext.data.Store.prototype.loadRecords =  Ext.Function.createInterceptor(Ext.data.Store.prototype.loadRecords,
    function(o, options, success) {
        return this.fireEvent('beforeloadrecords', o, options, success, this);
});

/**
 * state encoding converts null to empty object
 * 
 * -> take encoder/decoder from Ext 4.1 where this is fixed
  * <p>This class provides methods for encoding and decoding <b>typed</b> variables including 
 * dates and defines the Provider interface. By default these methods put the value and the
 * type information into a delimited string that can be stored. These should be overridden in 
 * a subclass if you want to change the format of the encoded value and subsequent decoding.</p>
 */
Ext.override(Ext.state.Provider, {
    /**
     * Decodes a string previously encoded with {@link #encodeValue}.
     * @param {String} value The value to decode
     * @return {Object} The decoded value
     */
    decodeValue : function(value){

        // a -> Array
        // n -> Number
        // d -> Date
        // b -> Boolean
        // s -> String
        // o -> Object
        // -> Empty (null)

        var me = this,
            re = /^(a|n|d|b|s|o|e)\:(.*)$/,
            matches = re.exec(unescape(value)),
            all,
            type,
            keyValue,
            values,
            vLen,
            v;
            
        if(!matches || !matches[1]){
            return; // non state
        }
        
        type = matches[1];
        value = matches[2];
        switch (type) {
            case 'e':
                return null;
            case 'n':
                return parseFloat(value);
            case 'd':
                return new Date(Date.parse(value));
            case 'b':
                return (value == '1');
            case 'a':
                all = [];
                if(value != ''){
                    values = value.split('^');
                    vLen   = values.length;

                    for (v = 0; v < vLen; v++) {
                        value = values[v];
                        all.push(me.decodeValue(value));
                    }
                }
                return all;
           case 'o':
                all = {};
                if(value != ''){
                    values = value.split('^');
                    vLen   = values.length;

                    for (v = 0; v < vLen; v++) {
                        value = values[v];
                        keyValue         = value.split('=');
                        all[keyValue[0]] = me.decodeValue(keyValue[1]);
                    }
                }
                return all;
           default:
                return value;
        }
    },

    /**
     * Encodes a value including type information.  Decode with {@link #decodeValue}.
     * @param {Object} value The value to encode
     * @return {String} The encoded value
     */
    encodeValue : function(value){
        var flat = '',
            i = 0,
            enc,
            len,
            key;
            
        if (value == null) {
            return 'e:1';    
        } else if(typeof value == 'number') {
            enc = 'n:' + value;
        } else if(typeof value == 'boolean') {
            enc = 'b:' + (value ? '1' : '0');
        } else if(Ext.isDate(value)) {
            enc = 'd:' + value.toGMTString();
        } else if(Ext.isArray(value)) {
            for (len = value.length; i < len; i++) {
                flat += this.encodeValue(value[i]);
                if (i != len - 1) {
                    flat += '^';
                }
            }
            enc = 'a:' + flat;
        } else if (typeof value == 'object') {
            for (key in value) {
                if (value[key] !== undefined && typeof value[key] != 'function' && !(value[key] && value[key].call)) {
                    flat += key + '=' + this.encodeValue(value[key]) + '^';
                }
            }
            enc = 'o:' + flat.substring(0, flat.length-1);
        } else {
            enc = 's:' + value;
        }
        return escape(enc);
    }
});

/** --------------------- Ultra Generic JavaScript Stuff --------------------- **/
/**
 * create console pseudo object when firebug is disabled/not installed
 */
if (! window.console) window.console = {};
for (fn in {
        // maximum possible console functions based on firebug
        log: null , debug: null, info: null, warn: null, error: null, assert: null, dir: null, dirxml: null, group: null,
        groupEnd: null, time: null, timeEnd: null, count: null, trace: null, profile: null, profileEnd: null
    }) {
    window.console[fn] = window.console[fn] || function() {};
}

/** -------------------- Extjs Framework Initialisation -------------------- **/
/**
 * use native json implementation because we had problems with utf8 linebreaks (\u2028 for example)
 * @see http://www.tine20.org/bugtracker/view.php?id=3356
 * @note IE is principally capable to use native json, but for *some reason* it's not working properly
 *       so we don't use it for IE
 * @type Boolean
 */
Ext.USE_NATIVE_JSON = !Ext.isIE && !Ext.isIE9;

/**
 * init ext quick tips
 */
Ext.tip.QuickTipManager.init();

/**
 * hide the field label when the field is hidden
 */
Ext.layout.container.Form.prototype.trackLabels = true;

/**
 * html encode all grid columns per default and convert spaces to &nbsp;
 */
Ext.grid.ColumnManager.defaultRenderer = Ext.util.Format.htmlEncode;
Ext.grid.Column.prototype.renderer = function(value) {
    var result = Ext.util.Format.htmlEncode(value);
    return result;
};

/**
 * add more options to Ext.form.field.ComboBox
 */
Ext.form.field.ComboBox.prototype.initComponent = Ext.Function.createSequence(Ext.form.field.ComboBox.prototype.initComponent, function() {
    if (this.expandOnFocus) {
        this.lazyInit = false;
        this.on('focus', function(){
            this.onTriggerClick();
        });
    }
    
    if (this.blurOnSelect){
        this.on('select', function(){
            this.blur(true);
            this.fireEvent('blur', this);
        }, this);
    }
});
Ext.form.field.ComboBox.prototype.triggerAction = 'all';


Ext.util.JSON = Ext.JSON;
Ext.util.JSON.encodeDate = function(o){
    var pad = function(n) {
        return n < 10 ? "0" + n : n;
    };
    return '"' + o.getFullYear() + "-" +
        pad(o.getMonth() + 1) + "-" +
        pad(o.getDate()) + " " +
        pad(o.getHours()) + ":" +
        pad(o.getMinutes()) + ":" +
        pad(o.getSeconds()) + '"';
};

Date.prototype.toJSON = function(key) {
    var pad = function(n) {
        return n < 10 ? "0" + n : n;
    };
    return this.getFullYear() + "-" +
        pad(this.getMonth() + 1) + "-" +
        pad(this.getDate()) + " " +
        pad(this.getHours()) + ":" +
        pad(this.getMinutes()) + ":" +
        pad(this.getSeconds());
};

/**
 * additional formats
 */
Ext.util.Format = Ext.apply(Ext.util.Format, {
    euMoney: function(v){
        v.toString().replace(/,/, '.');
        
        v = (Math.round(parseFloat(v)*100))/100;
        
        v = (v == Math.floor(v)) ? v + ".00" : ((v*10 == Math.floor(v*10)) ? v + "0" : v);
        v = String(v);
        var ps = v.split('.');
        var whole = ps[0];
        var sub = ps[1] ? '.'+ ps[1] : '.00';
        var r = /(\d+)(\d{3})/;
        while (r.test(whole)) {
            whole = whole.replace(r, '$1' + '.' + '$2');
        }
        v = whole + sub;
        if(v.charAt(0) == '-'){
            return v.substr(1) + ' -y.e.';
        }  
        return v + " y.e.";
    },
    percentage: function(v){
        if(v === null) {
            return 'none';
        }
        if(!isNaN(v)) {
            return v + " %";
        } 
    },
    pad: function(v,l,s){
        if (!s) {
            s = '&nbsp;';
        }
        var plen = l-v.length;
        for (var i=0;i<plen;i++) {
            v += s;
        }
        return v;
   }
});

Ext.direct.PROVIDERS = {};

Ext.define('Ext.grid.GridPanel', {
    extend: 'Ext.grid.Panel',

    autoExpandColumn : false,

    autoExpandMax : 1000,

    autoExpandMin : 50,

    columnLines : false,

    ddText : '{0} selected row{1}',
    /**
     * @cfg {Boolean} deferRowRender <P>Defaults to <tt>true</tt> to enable deferred row rendering.</p>
     * <p>This allows the GridPanel to be initially rendered empty, with the expensive update of the row
     * structure deferred so that layouts with GridPanels appear more quickly.</p>
     */
    deferRowRender : true,
 
    enableColumnHide : true,
    /**
     * @cfg {Boolean} enableColumnMove Defaults to <tt>true</tt> to enable drag and drop reorder of columns. <tt>false</tt>
     * to turn off column reordering via drag drop.
     */
    enableColumnMove : true,

    enableDragDrop : false,
    /**
     * @cfg {Boolean} enableHdMenu Defaults to <tt>true</tt> to enable the drop down button for menu in the headers.
     */
    enableHdMenu : true,
    /**
     * @cfg {Boolean} hideHeaders True to hide the grid's header. Defaults to <code>false</code>.
     */
    /**
     * @cfg {Object} loadMask An {@link Ext.LoadMask} config or true to mask the grid while
     * loading. Defaults to <code>false</code>.
     */
    loadMask : false,
    /**
     * @cfg {Number} maxHeight Sets the maximum height of the grid - ignored if <tt>autoHeight</tt> is not on.
     */
    /**
     * @cfg {Number} minColumnWidth The minimum width a column can be resized to. Defaults to <tt>25</tt>.
     */
    minColumnWidth : 25,
    /**
     * @cfg {Object} sm Shorthand for <tt>{@link #selModel}</tt>.
     */

    stripeRows : false,
    /**
     * @cfg {Boolean} trackMouseOver True to highlight rows when the mouse is over. Default is <tt>true</tt>
     * for GridPanel, but <tt>false</tt> for EditorGridPanel.
     */
    trackMouseOver : true,

    stateEvents : ['columnmove', 'columnresize', 'sortchange', 'groupchange'],
    /**
     * @cfg {Object} view The {@link Ext.grid.GridView} used by the grid. This can be set
     * before a call to {@link Ext.Component#render render()}.
     */
    view : null,
    
    /**
     * @cfg {Array} bubbleEvents
     * <p>An array of events that, when fired, should be bubbled to any parent container.
     * See {@link Ext.util.Observable#enableBubble}. 
     * Defaults to <tt>[]</tt>.
     */
    bubbleEvents: [],
    
    /**
     * @cfg {Object} viewConfig A config object that will be applied to the grid's UI view.  Any of
     * the config options available for {@link Ext.grid.GridView} can be specified here. This option
     * is ignored if <tt>{@link #view}</tt> is specified.
     */

    // private
    rendered : false,
    // private
    viewReady : false,

    // private
    initComponent : function(){
        this.callParent();

        if(this.columnLines){
            this.cls = (this.cls || '') + ' x-grid-with-col-lines';
        }
        // override any provided value since it isn't valid
        // and is causing too many bug reports ;)
        this.autoScroll = false;
        this.autoWidth = false;

        // if(Ext.isArray(this.columns)){
        //     this.colModel = new Ext.grid.ColumnModel(this.columns);
        //     delete this.columns;
        // }

        // check and correct shorthanded configs
        if(this.ds){
            this.store = this.ds;
            delete this.ds;
        }
        // if(this.cm){
        //     this.colModel = this.cm;
        //     delete this.cm;
        // }
        if(this.selModel){
            this.selModel = this.selModel;
            delete this.selModel;
        }
        this.store = Ext.StoreMgr.lookup(this.store);
    },

    // private
    onRender : function(ct, position){

        this.callParent(arguments);

        var c = this.getGridEl();

//        this.getEl().addClass('x-grid-panel');

        this.mon(c, {
            scope: this,
            mousedown: this.onMouseDown,
            click: this.onClick,
            dblclick: this.onDblClick,
            contextmenu: this.onContextMenu
        });

        this.relayEvents(c, ['mousedown','mouseup','mouseover','mouseout','keypress', 'keydown']);

//        var view = this.getView();
//            view.init(this);
//            view.render();
//        this.getSelectionModel().init(this);
    },

    // private
    initEvents : function(){
        Ext.grid.GridPanel.superclass.initEvents.call(this);

        if(this.loadMask){
            this.loadMask = new Ext.LoadMask(this.body,
                    Ext.apply({store:this.store}, this.loadMask));
        }
    },

    initStateEvents : function(){
        Ext.grid.GridPanel.superclass.initStateEvents.call(this);
        this.mon(this.colModel, 'hiddenchange', this.saveState, this, {delay: 100});
    },

    applyState : function(state){
        var cm = this.colModel,
            cs = state.columns,
            store = this.store,
            s,
            c,
            oldIndex;

        this.callParent(arguments);
    },

    getState : function(){
        var o = {columns: []},
            store = this.store,
            ss,
            gs;
            
        for(var i = 0, c; (c = this.colModel.config[i]); i++){
            o.columns[i] = {
                id: c.id,
                width: c.width
            };
            if(c.hidden){
                o.columns[i].hidden = true;
            }
        }
        if(store){
            ss = store.sortInfo;
            if(ss){
                o.sort = ss;
            }
            if(store.getGroupState){
                gs = store.getGroupState();
                if(gs){
                    o.group = gs;
                }
            }
        }
        return o;
    },

    // private
    afterRender : function(){
        this.callParent(); 
/*
        var v = this.view;
        this.on('bodyresize', v.layout, v);
        v.layout();
        if(this.deferRowRender){
            v.afterRender.defer(10, this.view);
        }else{
            v.afterRender();
        }
        this.viewReady = true;
*/
    },

    /**
     * <p>Reconfigures the grid to use a different Store and Column Model
     * and fires the 'reconfigure' event. The View will be bound to the new
     * objects and refreshed.</p>
     * <p>Be aware that upon reconfiguring a GridPanel, certain existing settings <i>may</i> become
     * invalidated. For example the configured {@link #autoExpandColumn} may no longer exist in the
     * new ColumnModel. Also, an existing {@link Ext.PagingToolbar PagingToolbar} will still be bound
     * to the old Store, and will need rebinding. Any {@link #plugins} might also need reconfiguring
     * with the new data.</p>
     * @param {Ext.data.Store} store The new {@link Ext.data.Store} object
     * @param {Ext.grid.ColumnModel} colModel The new {@link Ext.grid.ColumnModel} object
     */
    reconfigure : function(store, colModel){
        var rendered = this.rendered;
        if(rendered){
            if(this.loadMask){
                this.loadMask.destroy();
                this.loadMask = new Ext.LoadMask(this.body,
                        Ext.apply({}, {store:store}, this.initialConfig.loadMask));
            }
        }
        if(this.view){
            this.view.initData(store, colModel);
        }
        this.store = store;
        this.colModel = colModel;
        if(rendered){
            this.view.refresh(true);
        }
        this.fireEvent('reconfigure', this, store, colModel);
    },

    // private
    onDestroy : function(){
        if(this.rendered){
            Ext.destroy(this.view, this.loadMask);
        }else if(this.store && this.store.autoDestroy){
            this.store.destroy();
        }
        Ext.destroy(this.colModel, this.selModel);
        this.store = this.selModel = this.colModel = this.view = this.loadMask = null;
        Ext.grid.GridPanel.superclass.onDestroy.call(this);
    },

    // private
    processEvent : function(name, view, cell, recordIndex, cellIndex, e, record, row){
        e = e || view;    // error if mouseclick
        this.fireEvent(name, e);
        var t = e.getTarget(),
            v = this.view,
            header = v.getHeaderCt().getHeaderIndex(t);

        if(header !== false){
            this.fireEvent('header' + name, this, header, e);
        }else{
            var row = v.findItemByChild(t),
                cell,
                body;
            if(row !== false){
                this.fireEvent('row' + name, this, row, e);
                cell = v.findCellIndex(t);
                body = v.findRowBody(t);
                if(cell !== false){
                    this.fireEvent('cell' + name, this, row, cell, e);
                }
                if(body){
                    this.fireEvent('rowbody' + name, this, row, e);
                }
            }else{
                this.fireEvent('container' + name, this, e);
            }
        }
//        this.view.processEvent(name, e);
    },

    // private
    onClick : function(e){
        this.processEvent('click', e);
    },

    // private
    onMouseDown : function(e){
        this.processEvent('mousedown', e);
    },

    // private
    onContextMenu : function(e, t){
        this.processEvent('contextmenu', e);
    },

    // private
    onDblClick : function(e){
        this.processEvent('dblclick', e);
    },

    // private
    walkCells : function(row, col, step, fn, scope){
        var cm = this.colModel, 
            clen = cm.getColumnCount(),
            ds = this.store, 
            rlen = ds.getCount(), 
            first = true;
        if(step < 0){
            if(col < 0){
                row--;
                first = false;
            }
            while(row >= 0){
                if(!first){
                    col = clen-1;
                }
                first = false;
                while(col >= 0){
                    if(fn.call(scope || this, row, col, cm) === true){
                        return [row, col];
                    }
                    col--;
                }
                row--;
            }
        } else {
            if(col >= clen){
                row++;
                first = false;
            }
            while(row < rlen){
                if(!first){
                    col = 0;
                }
                first = false;
                while(col < clen){
                    if(fn.call(scope || this, row, col, cm) === true){
                        return [row, col];
                    }
                    col++;
                }
                row++;
            }
        }
        return null;
    },

    // private
    onResize : function(){
        Ext.grid.GridPanel.superclass.onResize.apply(this, arguments);
        if(this.viewReady){
            this.view.layout();
        }
    },

    /**
     * Returns the grid's underlying element.
     * @return {Element} The element
     */
    getGridEl : function(){
        return this.body;
    },

    // private for compatibility, overridden by editor grid
    stopEditing : Ext.emptyFn,

    /**
     * Returns the grid's selection model configured by the <code>{@link #selModel}</code>
     * configuration option. If no selection model was configured, this will create
     * and return a {@link Ext.grid.RowSelectionModel RowSelectionModel}.
     * @return {SelectionModel}
     */
//    getSelectionModel : function(){
//        if(!this.selModel){
//            this.selModel = new Ext.grid.RowEditor(
//                    this.disableSelection ? {selectRow: Ext.emptyFn} : null);
//        }
//        return this.selModel;
//    },

    /**
     * Returns the grid's data store.
     * @return {Ext.data.Store} The store
     */
    getStore : function(){
        return this.store;
    },

    /**
     * Returns the grid's ColumnModel.
     * @return {Ext.grid.ColumnModel} The column model
     */
    getColumnModel : function(){
        return this.colModel;
    },

    /**
     * Called to get grid's drag proxy text, by default returns this.ddText.
     * @return {String} The text
     */
    getDragDropText : function(){
        var count = this.selModel.getCount();
        return Ext.String.format(this.ddText, count, count == 1 ? '' : 's');
    }
});

Ext.define('Ext.grid.EditorGridPanel', {
    extend: 'Ext.grid.GridPanel',
    /**
     * @cfg {Number} clicksToEdit
     * <p>The number of clicks on a cell required to display the cell's editor (defaults to 2).</p>
     * <p>Setting this option to 'auto' means that mousedown <i>on the selected cell</i> starts
     * editing that cell.</p>
     */
    clicksToEdit: 2,

    /**
    * @cfg {Boolean} forceValidation
    * True to force validation even if the value is unmodified (defaults to false)
    */
    forceValidation: false,

    // private
    isEditor : true,
    // private
    detectEdit: false,

    /**
     * @cfg {Boolean} autoEncode
     * True to automatically HTML encode and decode values pre and post edit (defaults to false)
     */
    autoEncode : false,

    /**
     * @cfg {Boolean} trackMouseOver @hide
     */
    // private
    trackMouseOver: false, // causes very odd FF errors

    // private
    initComponent : function(){
        Ext.grid.EditorGridPanel.superclass.initComponent.call(this);

        if(!this.selModel){
            /**
             * @cfg {Object} selModel Any subclass of AbstractSelectionModel that will provide the selection model for
             * the grid (defaults to {@link Ext.grid.CellSelectionModel} if not specified).
             */
            this.selModel = new Ext.grid.CellSelectionModel();
        }

        this.activeEditor = null;
    },

    // private
    initEvents : function(){
        Ext.grid.EditorGridPanel.superclass.initEvents.call(this);

        this.getGridEl().on('mousewheel', this.stopEditing.createDelegate(this, [true]), this);
        this.on('columnresize', this.stopEditing, this, [true]);

        if(this.clicksToEdit == 1){
            this.on("cellclick", this.onCellDblClick, this);
        }else {
            var view = this.getView();
            if(this.clicksToEdit == 'auto' && view.mainBody){
                view.mainBody.on('mousedown', this.onAutoEditClick, this);
            }
            this.on('celldblclick', this.onCellDblClick, this);
        }
    },

    onResize : function(){
        Ext.grid.EditorGridPanel.superclass.onResize.apply(this, arguments);
        var ae = this.activeEditor;
        if(this.editing && ae){
            ae.realign(true);
        }
    },

    // private
    onCellDblClick : function(g, row, col){
        this.startEditing(row, col);
    },

    // private
    onAutoEditClick : function(e, t){
        if(e.button !== 0){
            return;
        }
        var row = this.view.findItemByChild(t),
            col = this.view.findCellIndex(t);
        if(row !== false && col !== false){
            this.stopEditing();
            if(this.selModel.getSelectedCell){ // cell sm
                var sc = this.selModel.getSelectedCell();
                if(sc && sc[0] === row && sc[1] === col){
                    this.startEditing(row, col);
                }
            }else{
                if(this.selModel.isSelected(row)){
                    this.startEditing(row, col);
                }
            }
        }
    },

    // private
    onEditComplete : function(ed, value, startValue){
        this.editing = false;
        this.activeEditor = null;

        var r = ed.record,
            field = this.colModel.getDataIndex(ed.col);
        value = this.postEditValue(value, startValue, r, field);
        if(this.forceValidation === true || String(value) !== String(startValue)){
            var e = {
                grid: this,
                record: r,
                field: field,
                originalValue: startValue,
                value: value,
                row: ed.row,
                column: ed.col,
                cancel:false
            };
            if(this.fireEvent("validateedit", e) !== false && !e.cancel && String(value) !== String(startValue)){
                r.set(field, e.value);
                delete e.cancel;
                this.fireEvent("afteredit", e);
            }
        }
        this.view.focusCell(ed.row, ed.col);
    },

    /**
     * Starts editing the specified for the specified row/column
     * @param {Number} rowIndex
     * @param {Number} colIndex
     */
    startEditing : function(row, col){
        this.stopEditing();
        if(this.colModel.isCellEditable(col, row)){
            this.view.ensureVisible(row, col, true);
            var r = this.store.getAt(row),
                field = this.colModel.getDataIndex(col),
                e = {
                    grid: this,
                    record: r,
                    field: field,
                    value: r.data[field],
                    row: row,
                    column: col,
                    cancel:false
                };
            if(this.fireEvent("beforeedit", e) !== false && !e.cancel){
                this.editing = true;
                var ed = this.colModel.getCellEditor(col, row);
                if(!ed){
                    return;
                }
                if(!ed.rendered){
                    ed.parentEl = this.view.getEditorParent(ed);
                    ed.on({
                        scope: this,
                        render: {
                            fn: function(c){
                                c.field.focus(false, true);
                            },
                            single: true,
                            scope: this
                        },
                        specialkey: function(field, e){
                            this.getSelectionModel().onEditorKey(field, e);
                        },
                        complete: this.onEditComplete,
                        canceledit: this.stopEditing.createDelegate(this, [true])
                    });
                }
                Ext.apply(ed, {
                    row     : row,
                    col     : col,
                    record  : r
                });
                this.lastEdit = {
                    row: row,
                    col: col
                };
                this.activeEditor = ed;
                // Set the selectSameEditor flag if we are reusing the same editor again and
                // need to prevent the editor from firing onBlur on itself.
                ed.selectSameEditor = (this.activeEditor == this.lastActiveEditor);
                var v = this.preEditValue(r, field);
                ed.startEdit(this.view.getCell(row, col).firstChild, Ext.isDefined(v) ? v : '');

                // Clear the selectSameEditor flag
                (function(){
                    delete ed.selectSameEditor;
                }).defer(50);
            }
        }
    },

    // private
    preEditValue : function(r, field){
        var value = r.data[field];
        return this.autoEncode && Ext.isString(value) ? Ext.util.Format.htmlDecode(value) : value;
    },

    // private
    postEditValue : function(value, originalValue, r, field){
        return this.autoEncode && Ext.isString(value) ? Ext.util.Format.htmlEncode(value) : value;
    },

    /**
     * Stops any active editing
     * @param {Boolean} cancel (optional) True to cancel any changes
     */
    stopEditing : function(cancel){
        if(this.editing){
            // Store the lastActiveEditor to check if it is changing
            var ae = this.lastActiveEditor = this.activeEditor;
            if(ae){
                ae[cancel === true ? 'cancelEdit' : 'completeEdit']();
                this.view.focusCell(ae.row, ae.col);
            }
            this.activeEditor = null;
        }
        this.editing = false;
    }
});
