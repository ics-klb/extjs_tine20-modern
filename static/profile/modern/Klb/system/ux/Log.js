Ext.ns('Ext.ux');

/**
 * logging extension (only to console atm.)
 * 
 * NOTE: we extend the console object here so the console writer preserves 
 *       line number and files in its logging output!
 *       
 * @namespace   Ext.ux.Log
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 */
Ext.ux.Log = window.console || {};
Ext.apply(Ext.ux.Log, {

    // @cfg {Number} prio (defaults to 7)
    winboxcnt: 0,
    PRIO: 7,
   // possible log levels
    priorities: {
        EMERG:    0,  // Emergency: system is unusable
        ALERT:    1,  // Alert: action must be taken immediately
        CRIT:     2,  // Critical: critical conditions
        ERR:      3,  // Error: error conditions
        ERROR:    3,  // Error: error conditions
        WARN:     4,  // Warning: warning conditions
        NOTICE:   5,  // Notice: normal but significant condition
        INFO:     6,  // Informational: informational messages
        DEBUG:    7,   // Debug: debug messages
        TRACE:    8   // Debug: debug messages
    },

    // only console writer atm.
    prioLogFnMap : {
        EMERG:    console.error,
        ALERT:    console.error,
        CRIT:     console.error,
        ERR:      console.error,
        ERROR:    console.error,
        WARN:     console.warn,
        NOTICE:   console.info,
        INFO:     console.info,
        DEBUG:    console.log,
        TRACE:    console.log
    },

    // returns current logging priority
    getPrio: function() {
        return this.PRIO;
    },

   // set logging priority
    setPrio: function(prio) {
        this.PRIO = prio;
        for (var name in this.priorities) {
            this[name] = this[name.toLowerCase()] = prio >= this.priorities[name] ? this.prioLogFnMap[name] : Ext.emptyFn;
        }
    },

    showBox: function(msg, title) {
        title = ' - ' + title || '';
        this.winboxcnt++;

        Ext.MessageBox.show({
            title: 'Log Box (' + (this.winboxcnt) + ')' + title,
            msg:  msg,
            multiline: true,
            modal: false,
            buttons: Ext.Msg.OK,
            fn: function(btn){
                Klb.Logger.winboxcnt--;
            }
        });
    }
});

