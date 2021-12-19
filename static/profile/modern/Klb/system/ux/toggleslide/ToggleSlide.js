
Ext.define('Ext.ux.toggleslide.ToggleSlide', {
    extend: 'Ext.Component',
    alias : 'widget.toggleslide',

    /**
     * @cfg {Number} duration The duration for the slide animation (defaults to .09)
     */
    duration: 200,

    /**
     * @cfg {String} onText The text to display when the toggle is in the 'On' position (defaults to 'ON')
     */
    onText: 'ON',

    /**
     * @cfg {String} offText The text to display when the toggle is in the 'Off' position (defaults to 'OFF')
     */
    offText: 'OFF',

    /**
     * @cfg {Boolean} resizeHandle Specifies whether the drag handle should be resized to cover the on or off side (defaults to true)
     */
    resizeHandle: true,

    /**
     * @cfg {Boolean} resizeContainer Specifies whether the contain element should be resized (defaults to true)
     */
    resizeContainer: true,

    /**
     * @cfg {String} onLabelCls The CSS class for the on label (defaults to 'x-toggle-slide-label-on')
     */
    onLabelCls: 'x-toggle-slide-label-on',

    /**
     * @cfg {String} ofLabelCls The CSS class for the off label (defaults to 'x-toggle-slide-label-off')
     */
    offLabelCls: 'x-toggle-slide-label-off',

    /**
     * @cfg {String} handleCls The CSS class for the drag handle (defaults to 'x-toggle-slide-handle')
     */
    handleCls: 'x-toggle-slide-handle',

    /**
     * @cfg {String} handleCenterCls The CSS class for the drag handle's center el (defaults to 'x-toggle-slide-handle-center')
     */
    handleCenterCls: 'x-toggle-slide-handle-center',

    /**
     * @cfg {String} handleCenterCls The CSS class for the drag handle's right el (defaults to 'x-toggle-slide-handle-right')
     */
    handleRightCls: 'x-toggle-slide-handle-right',

    /**
     * @cfg {Boolean} state The initial state of the Toggle (defaults to false)
     */
    state: false,

    /**
     * @cfg {Boolean} booleanMode Determines whether the internal value is represented as a Boolean.  If not in booleanMode
     * the internal value will be represented as the on or off label text. The value passed to event listeners will also
     * be determined on this setting (defaults to true)
     */
    booleanMode: true,

    /**
     * @cfg {Boolean} ui CSS-class modifier for scale and style the component (defaults to 'default-small')
     */
    ui: 'default-small',

    // private
    dragging: false,
    componentCls: 'x-toggle-slide-container',
    disabledCls: 'x-toggle-slide-disabled',

    renderTplTest: ['<label class="{offLabelCls}">',
                    '<span>{offText}</span>',
                '</label>',
                '<label class="{onLabelCls}">',
                    '<span>{onText}</span>',
                '</label>',
                '<div class="{handleCls}">',
                  '<div class="{handleRightCls}">',
                    '<div class="{handleCenterCls}"></div>',
                  '</div>',
                '</div>'
                ],
//    autoEl: {
//       tag: 'div',
//       cls: 'x-toggle-slide-container'
//    },                
    /**
     * Set up the hidden field
     * @param {Object} ct The container to render to.
     * @param {Object} position The position in the container to render to.
     * @private
     */
    onRender: function(ct, position) {
        this.callParent([ct, position]);
        
        var tpl = new Ext.Template( this.renderTplTest );

        this.el.dom.innerHTML = tpl.apply({
            offLabelCls  : this.offLabelCls,
            offText: this.offText,
            onLabelCls: this.onLabelCls,
            onText: this.onText,
            handleCls: this.handleCls,
            handleRightCls: this.handleRightCls,
            handleCenterCls: this.handleCenterCls
        });

        this.offLabel = this.el.first();
        this.offSpan = this.offLabel.first();
        this.onLabel = this.offLabel.next();
        this.onSpan = this.onLabel.first();
        this.handle = this.el.first('div');

        this.resize();
        this.disableTextSelection();

        if (!this.disabled) {
            this.registerToggleListeners();
        } else {
            Ext.ux.ToggleSlide.superclass.disable.call(this);
        }
    },

    /**
     * Resize assets.
     * @private
     */
    resize: function() {
        var container = this.el;
        var offlabel = this.offLabel;
        var offspan = this.offSpan;
        var onlabel = this.onLabel;
        var onspan = this.onSpan;
        var handle = this.handle;

        if (this.resizeHandle) {
            var min = Math.min(onlabel.getWidth(), offlabel.getWidth());
            handle.setWidth(min);
        }

        if (this.resizeContainer) {
            var max = Math.max(onlabel.getWidth(), offlabel.getWidth());

            // add a proporational (1/3) amount of pixels to the containers height.
            // keeps the slide from looking squat for shorter containers
            var expandPx = Math.ceil(container.getHeight() / 3);
            container.setWidth(max + handle.getWidth() + expandPx);
        }

        offlabel.setWidth(container.getWidth() - 2);
        var rightside = this.rightside = container.getWidth() - handle.getWidth();
        if (this.state) {
            handle.setLeft(rightside);
            onlabel.setWidth(rightside + 4);
            offspan.setStyle({marginRight: rightside + 'px'});
        } else {
            handle.setLeft(0);
            onlabel.setWidth(0);
            onspan.setStyle({marginLeft: -rightside + 'px'});
        }
    },

    /**
     * Turn off text selection.
     * @private
     */
    disableTextSelection: function() {
        var els = [this.el, this.onLabel, this.offLabel, this.handle];
        Ext.each(els, function(el) {
            el.on('mousedown', function(evt) {
                evt.preventDefault();
                return false;
            });

            if (Ext.isIE) {
                el.on('startselect', function(evt) {
                    evt.stopEvent();
                    return false;
                });
            }
        });
    },

    /**
     * Animates the handle to the next state.
     * @private
     */
    moveHandle: function(on, callback) {
        var handlePos = on ? this.rightside : 0,
            pos = this.findLabelPositions(handlePos);

        Ext.create('Ext.fx.Anim', {
            target: this.handle,
            to : {left: handlePos},
            callback: callback,
            scope: this,
            duration: this.duration
        });
        this.onLabel.animate({
            to : {width : pos.onLabelWidth},
            duration: this.duration
        });
        this.onSpan.animate({
            to : {marginLeft : pos.onSpanMargin+'px'},
            duration: this.duration
        });
        this.offLabel.animate({
            to : {width : pos.offLabelWidth},
            duration: this.duration
        });
        this.offSpan.animate({
            to : {marginRight: pos.offSpanMargin+ 'px'},
            duration: this.duration
        });
    },

    /**
     * Constrain the drag handle to the containing el.
     * @private
     */
    startDrag: function(e){
        this.dragging = true;
        this.dd.constrainTo(this.el);
    },

    /**
     * Determine if the handle has been dropped > half way into the other position.
     * Toggle if so or move the handle back to the original position if not.
     * @private
     */
    endDrag: function(e) {
        var hc = (this.handle.getLeft(true) + this.handle.getRight(true)) / 2;
        var cc = (this.el.getLeft(true) + this.el.getRight(true)) / 2;
        var next = hc > cc;

        if (this.state !== next) {
            this.toggle();
        } else {
            this.moveHandle(next);
        }

        this.dragging = false;
    },

    /**
     * Adjust the label and span positions with the handles.
     * @private
     */
    onHandleMove: function(e) {
        var pos = this.findLabelPositions(this.handle.getLeft(true));
        this.onLabel.setWidth(pos.onLabelWidth);
        this.onSpan.setStyle({marginLeft: pos.onSpanMargin + 'px'});
        this.offLabel.setWidth(pos.offLabelWidth);
        this.offSpan.setStyle({marginRight: pos.offSpanMargin + 'px'});
    },

    /**
     * Return label and span offsets concerning the handler.
     * @private
     */
    findLabelPositions: function(handleLeft) {
        return {
            onLabelWidth: handleLeft - this.el.getLeft(true) + 4,
            onSpanMargin: handleLeft - this.rightside,
            offLabelWidth: this.el.getRight(true) - handleLeft - 4,
            offSpanMargin: -(handleLeft - this.el.getLeft(true))
        };
    },

    /**
     * If not dragging toggle.
     * @private
     */
    onMouseUp: function() {
        if (!this.dragging) {
            this.toggle();
        }
    },

    /**
     * Transition to the next state.
     */
    toggle: function() {
        var next = !this.state;
        if (!this.booleanMode) {
            next = this.state ? this.onText : this.offText;
        }
        if (this.fireEvent('beforechange', this, next) !== false) {
            this.state = !this.state;
            this.moveHandle(
                this.state,
                this.fireEvent('change', this, this.getValue())
            );

        } else {
            this.moveHandle(this.state);
        }
    },

    /**
     * If currently disabled, enable this component and fire the 'enable' event.
     * @return {Ext.Component} this
     */
    enable: function() {
        if (this.disabled) {
            this.callParent();
            this.registerToggleListeners();
        }

        return this;
    },

    /**
     * Registers the mouseup listener and the DD instance for the handle.
     * @private
     */
    registerToggleListeners: function() {
        this.dd = new Ext.dd.DD(Ext.id(this.handle.dom));
        this.dd.startDrag = Ext.Function.bind(this.startDrag, this);
        this.dd.onDrag = Ext.Function.bind(this.onHandleMove, this);
        this.dd.endDrag = Ext.Function.bind(this.endDrag, this);

        this.el.on('mouseup', this.onMouseUp, this);
    },

    /**
     * Unregisters the mouseup listener and the DD instance for the handle.
     * @private
     */
    unregisterToggleListeners: function() {
        Ext.destroy(this.dd);
        this.el.un('mouseup', this.onMouseUp, this);
    },

    /**
     * If currently enabled, disable this component and fire the 'disable' event.
     * @return {Ext.Component} this
     */
    disable: function() {
        if (!this.disabled) {
            this.callParent();
            this.unregisterToggleListeners();
        }

        return this;
    },

    /**
     * Returns the current internal value, either text or boolean depending on configured
     * booleanMode.
     */
    getValue: function() {
        return this.booleanMode ? this.state : (this.state ? this.onText : this.offText);
    }
});

Ext.define('Ext.ux.toggleslide.ToggleSlideTest', {
    extend: 'Ext.Component',
    alias: 'widget.toggleslidetest',
    
    requires: [
        'Ext.ux.toggleslide.Thumb'
    ],
//    uses: ['Ext.fx.Anim'],
    /**
     * @cfg {Number} duration The duration for the slide animation (defaults to
     *      120)
     */
    duration: 120,
    
    /**
     * @cfg {String} onText The text to display when the toggle is in the 'On'
     *      position (defaults to 'ON')
     */
    onText: 'ON',
    
    /**
     * @cfg {String} offText The text to display when the toggle is in the 'Off'
     *      position (defaults to 'OFF')
     */
    offText: 'OFF',
    
    /**
     * @cfg {Boolean} resizeHandle Specifies whether the drag handle should be
     *      resized to cover the on or off side (defaults to true)
     */
    resizeHandle: true,
    
    /**
     * @cfg {Boolean} resizeContainer Specifies whether the contain element
     *      should be resized (defaults to true)
     */
    resizeContainer: true,
    
    /**
     * @cfg {String} onLabelCls The CSS class for the on label (defaults to
     *      'x-toggle-slide-label-on')
     */
    onLabelCls: 'x-toggle-slide-label-on',
    
    /**
     * @cfg {String} ofLabelCls The CSS class for the off label (defaults to
     *      'x-toggle-slide-label-off')
     */
    offLabelCls: 'x-toggle-slide-label-off',
    
    /**
     * @cfg {String} handleCls The CSS class for the drag handle (defaults to
     *      'x-toggle-slide-handle')
     */
    handleCls: 'x-toggle-slide-thumb',
    
    disabledCls: 'x-toggle-slide-disabled',
    
    /**
     * @cfg {Boolean} state The initial state of the Toggle (defaults to false)
     */
    state: false,
    
    /**
     * @cfg {Boolean} booleanMode Determines whether the internal value is
     *      represented as a Boolean. If not in booleanMode the internal value
     *      will be represented as the on or off label text. The value passed to
     *      event listeners will also be determined on this setting (defaults to
     *      true)
     */
    booleanMode: true,
    
    // private
    dragging: false,
    diff:  0,
    diff2: 0,
    diff3: 0,
    frame: false,

    renderTpl: ['<div class="holder">',
                    '<label class="{onLabelCls}">',
                        '<span>{onText}</span>',
                    '</label>',
                    '<label class="{offLabelCls}">',
                        '<span>{offText}</span>',
                    '</label>',
                '</div>'],
                        
    autoEl: {
       tag: 'div',
       cls: 'x-toggle-slide-container'
    },
    
    beforeRender: function() {
        var me = this;

        me.callParent();

        Ext.applyIf(me.renderData, {
            offLabelCls: me.offLabelCls,
            offText: me.offText,
            onLabelCls: me.onLabelCls,
            onText: me.onText,
            handleCls: me.handleCls
        });       
    },
    
    /**
     * Set up the hidden field
     * 
     * @param {Object} ct The container to render to.
     * @param {Object} position The position in the container to render to.
     * @private
     */
    onRender: function() {
        var me = this;
        
        if(!me.resizeContainer)
            me.diff = 0;
        
        if(!me.resizeHandle)
        {
            me.diff2 = 3;
            me.diff3 = 5;
        }
        
        me.callParent(arguments);
        
        if (me.cls) {
            me.el.addCls(me.cls);
        }
        
        me.thumb = Ext.create('Ext.ux.toggleslide.Thumb',{
            ownerCt: me,
            slider: me,
            disabled: !!me.disabled
        });

        var holder = me.el.first();
        
        me.onLabel = holder.first();
        me.onSpan = me.onLabel.first();
        
        me.offLabel = me.onLabel.next();
        me.offSpan = me.offLabel.first();

        if (me.rendered) {
            me.thumb.render();
        }
        me.handle = me.thumb.el;
        
        if(me.resizeHandle)
            me.thumb.bringToFront();
        else
            me.thumb.sendToBack();
        
        me.resize();
        me.disableTextSelection();
        
        if(!me.disabled)
        {
//            me.registerToggleListeners();
        }
        else
        {
            Ext.ux.toggleslide.ToggleSlide.superclass.disable.call(me);
        }
    },
    
    /**
     * Resize assets.
     * 
     * @private
     */
    resize: function() {
        var me = this,
            container = me.el,
            offlabel = me.offLabel,
            onlabel = me.onLabel,
            handle = me.handle;
        
        if(me.resizeHandle) {
            var min = (onlabel.getWidth() < offlabel.getWidth()) ? onlabel.getWidth() : offlabel.getWidth();
            handle.setWidth(min);
        }

        if(me.resizeContainer) {
            var max = (onlabel.getWidth() > offlabel.getWidth()) ? onlabel.getWidth() : offlabel.getWidth();
            var expandPx = Math.ceil(container.getHeight() / 3);
            container.setWidth(max + handle.getWidth() + expandPx);
        }
        
        var b = handle.getWidth() / 2;
        onlabel.setWidth(container.getWidth() - b + me.diff2);
        offlabel.setWidth(container.getWidth() - b + me.diff2);
        var rightside = me.rightside = container.getWidth() - handle.getWidth() - me.diff;
        
        if(me.state) {
            handle.setLeft(rightside);
        } else {
            handle.setLeft(0);
        }
        me.onDrag();
    },
    
    /**
     * Turn off text selection.
     * 
     * @private
     */
    disableTextSelection: function() {
        var els = [this.el,
                this.onLabel,
                this.offLabel,
                this.handle];
        
        Ext.each(els, function(el) {
            el.on('mousedown', function(evt) {
                evt.preventDefault();
                return false;
            });
            
            if(Ext.isIE) {
                el.on('startselect', function(evt) {
                    evt.stopEvent();
                    return false;
                });
            }
        });
    },
    
    /**
     * Animates the handle to the next state.
     * 
     * @private
     */
    moveHandle: function(on, callback) {
        var me = this,
            runner = new Ext.util.TaskRunner(),
            to = on ? me.rightside : 0;

        Ext.create('Ext.fx.Anim', {
            target: me.handle,
            dynamic: true,
            easing: 'easeOut',
            duration: me.duration,
            to : {
                left: to
            },
            listeners: {
                beforeanimate: {
                    fn: function(ani) {
                        me.task = runner.newTask({
                            run: function () {
                                me.onDrag();
                            },
                            interval: 10
                        });
                        me.task.start();
                    },
                    scope: me
                },
                afteranimate: {
                    fn: function(ani) {
                        me.onDrag();
                        me.task.destroy();
                    },
                    scope: me
                } 
            },
            callback: callback
        });
    },
    
    /**
     * Constrain the drag handle to the containing el.
     * 
     * @private
     */
    onDragStart: function(e) {
        var me = this;

        me.dragging = true;
        
        me.dd.constrainTo(me.el, {
            right: me.diff
        });
    },
    
    /**
     * Determine if the handle has been dropped > half way into the other
     * position. Toggle if so or move the handle back to the original position
     * if not.
     * 
     * @private
     */
    onDragEnd: function(e) {
        var me = this,
            hc = (me.handle.getLeft(true) + me.handle.getRight(true)) / 2,
            cc = (me.el.getLeft(true) + me.el.getRight(true)) / 2,
            next = hc > cc;
        
        (me.state != next) ? me.toggle() : me.moveHandle(next);
        me.dragging = false;
    },
    
    /**
     * Adjust the label and span positions with the handles.
     * 
     * @private
     */
    onDrag: function(e) {
        var me = this,
            pos = me.handle.getLeft(true) - me.rightside;

        pos = (me.handle.getLeft(true) == me.rightside) ? 0 : pos - me.diff3;
        me.onLabel.setStyle({
            marginLeft: pos + 'px'
        });
       return me;
    },
    
    /**
     * If not dragging toggle.
     * 
     * @private
     */
    onMouseUp: function() {
        if(!this.dragging) {
            this.toggle();
        }
    },
    
    /**
     * Transition to the next state.
     */
    toggle: function() {
        var me = this,
            next = !this.state;
        
        if(!me.booleanMode) {
            next = me.state ? me.onText : me.offText;
        }
        
        if(me.fireEvent('beforechange', me, next) !== false) {
            me.state = !me.state;            
            me.moveHandle(me.state, Ext.bind(me.fireEvent, me, ['change', me, me.getValue()]));
        } else {
            me.moveHandle(me.state);
        }
    },
    
    /**
     * If currently disabled, enable this component and fire the 'enable' event.
     * 
     * @return {Ext.Component} this
     */
    enable: function() {
        if(this.disabled)
        {
            Ext.ux.toggleslide.ToggleSlide.superclass.enable.call(this);
            this.registerToggleListeners();
            //this.thumb.enable();
        }
        return this;
    },
    
    /**
     * If currently enabled, disable this component and fire the 'disable'
     * event.
     * 
     * @return {Ext.Component} this
     */
    disable: function() {
        if(!this.disabled)
        {
            Ext.ux.toggleslide.ToggleSlide.superclass.disable.call(this);
            this.unregisterToggleListeners();
            //this.thumb.disable();
        }
        return this;
    },
    
    /**
     * Registers the mouseup listener and the DD instance for the handle.
     * 
     * @private
     */
    registerToggleListeners: function() {
        var me = this;
        
        me.dd = new Ext.dd.DD(me.handle);
        me.dd.startDrag = Ext.bind(me.onDragStart, me);
        me.dd.onDrag = Ext.bind(me.onDrag, me);
        me.dd.endDrag = Ext.bind(me.onDragEnd, me);
        
        me.el.on('mouseup', me.onMouseUp, me);
    },
    
    /**
     * Unregisters the mouseup listener and the DD instance for the handle.
     * 
     * @private
     */
    unregisterToggleListeners: function() {
        Ext.destroy(this.dd);
        this.el.un('mouseup', this.onMouseUp, this);
    },
    
    /**
     * Returns the current internal value, either text or boolean depending on
     * configured booleanMode.
     */
    getValue: function() {
        var me = this;
        return me.booleanMode ? me.state : (me.state ? me.onText : me.offText);
    }
});
