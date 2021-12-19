/*!
 * Ext JS Library 3.2.1
 * Copyright(c) 2006-2010 Ext JS, Inc.
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
Ext.define('Ext.ux.Portal', {
    extend: 'Ext.panel.Panel',

    xtype: 'uxportal',
    // layout : 'column',
    autoScroll : true,
    border: 0,
    cls : 'x-uxportal',
    defaultType : 'uxportalcolumn',
 
    initEvents : function(){

        this.callParent();
//        this.dd = new Ext.ux.Portal.DropZone(this, this.dropConfig);
    },

    beforeDestroy : function() {

        if(this.dd){
            this.dd.unreg();
        }
        this.callParent();
    }
});

Ext.define('Ext.ux.Portlet', {
    extend: 'Ext.panel.Panel',
    xtype: 'uxportlet',
    anchor : '100% 100%',
    collapsible : true,
    draggable : true,
    cls : 'x-uxportlet'
});

Ext.define('Ext.ux.PortalColumn', {
    extend: 'Ext.panel.Panel',
    xtype:  'uxportalcolumn',
    layout : 'accordion',
    border: 0,
    defaultType : 'uxportlet',
    cls : 'x-uxportal-column'
});

Ext.define('Ext.ux.Portal.DropZone', {
    extend: 'Ext.dd.DropTarget',

    constructor : function(uxportal, cfg){
        this.uxportal = uxportal;
        Ext.dd.ScrollManager.register(uxportal.body);
        Ext.ux.Portal.DropZone.superclass.constructor.call(this, uxportal.bwrap.dom, cfg);
        uxportal.body.ddScrollConfig = this.ddScrollConfig;
    },
    
    ddScrollConfig : {
        vthresh: 50,
        hthresh: -1,
        animate: true,
        increment: 200
    },

    createEvent : function(dd, e, data, col, c, pos){
        return {
            uxportal: this.uxportal,
            panel: data.panel,
            columnIndex: col,
            column: c,
            position: pos,
            data: data,
            source: dd,
            rawEvent: e,
            status: this.dropAllowed
        };
    },

    notifyOver : function(dd, e, data){
        var xy = e.getXY(), uxportal = this.uxportal, px = dd.proxy;

        // case column widths
        if(!this.grid){
            this.grid = this.getGrid();
        }

        // handle case scroll where scrollbars appear during drag
        var cw = uxportal.body.dom.clientWidth;
        if(!this.lastCW){
            this.lastCW = cw;
        }else if(this.lastCW != cw){
            this.lastCW = cw;
            uxportal.doLayout();
            this.grid = this.getGrid();
        }

        // determine column
        var col = 0, xs = this.grid.columnX, cmatch = false;
        for(var len = xs.length; col < len; col++){
            if(xy[0] < (xs[col].x + xs[col].w)){
                cmatch = true;
                break;
            }
        }
        // no match, fix last index
        if(!cmatch){
            col--;
        }

        // find insert position
        var p, match = false, pos = 0,
            c = uxportal.items.itemAt(col),
            items = c.items.items, overSelf = false;

        for(var len = items.length; pos < len; pos++){
            p = items[pos];
            var h = p.el.getHeight();
            if(h === 0){
                overSelf = true;
            }
            else if((p.el.getY()+(h/2)) > xy[1]){
                match = true;
                break;
            }
        }

        pos = (match && p ? pos : c.items.getCount()) + (overSelf ? -1 : 0);
        var overEvent = this.createEvent(dd, e, data, col, c, pos);

        if(uxportal.fireEvent('validatedrop', overEvent) !== false &&
           uxportal.fireEvent('beforedragover', overEvent) !== false){

            // make sure proxy width is fluid
            px.getProxy().setWidth('auto');

            if(p){
                px.moveProxy(p.el.dom.parentNode, match ? p.el.dom : null);
            }else{
                px.moveProxy(c.el.dom, null);
            }

            this.lastPos = {c: c, col: col, p: overSelf || (match && p) ? pos : false};
            this.scrollPos = uxportal.body.getScroll();

            uxportal.fireEvent('dragover', overEvent);

            return overEvent.status;
        }else{
            return overEvent.status;
        }

    },

    notifyOut : function(){
        delete this.grid;
    },

    notifyDrop : function(dd, e, data){
        delete this.grid;
        if(!this.lastPos){
            return;
        }
        var c = this.lastPos.c, 
            col = this.lastPos.col, 
            pos = this.lastPos.p,
            panel = dd.panel,
            dropEvent = this.createEvent(dd, e, data, col, c,
                pos !== false ? pos : c.items.getCount());

        if(this.uxportal.fireEvent('validatedrop', dropEvent) !== false &&
           this.uxportal.fireEvent('beforedrop', dropEvent) !== false){

            dd.proxy.getProxy().remove();
            panel.el.dom.parentNode.removeChild(dd.panel.el.dom);
            
            if(pos !== false){
                c.insert(pos, panel);
            }else{
                c.add(panel);
            }
            
            c.doLayout();

            this.uxportal.fireEvent('drop', dropEvent);

            // scroll position is lost on drop, fix it
            var st = this.scrollPos.top;
            if(st){
                var d = this.uxportal.body.dom;
                setTimeout(function(){
                    d.scrollTop = st;
                }, 10);
            }

        }
        delete this.lastPos;
    },

    // internal cache of body and column coords
    getGrid : function(){
        var box = this.uxportal.bwrap.getBox();
        box.columnX = [];
        this.uxportal.items.each(function(c){
             box.columnX.push({x: c.el.getX(), w: c.el.getWidth()});
        });
        return box;
    },

    // unregister the dropzone from ScrollManager
    unreg: function() {
        Ext.dd.ScrollManager.unregister(this.uxportal.body);
        Ext.ux.Portal.DropZone.superclass.unreg.call(this);
    }
});
