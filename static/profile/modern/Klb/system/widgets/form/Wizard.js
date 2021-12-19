/*
 * Modern 3.1.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      
 * @copyright   
 */
Ext.ns('Klb.system.widgets.form');

/**
 * Upload Button
 * 
 * @namespace   Klb.system.widgets.form
 * @class       Klb.system.widgets.form.Wizard
 * @extends     Ext.panel.Panel
 * @author      
 * @constructor
 * @param {Object} config The configuration options.
 */
Ext.define('Klb.system.widgets.form.WizardModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.coreformwizardmodel',

    data: {
        atBeginning: true,
        atEnd: false
    }
});

Ext.define('Klb.system.widgets.form.WizardController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.coreformwizardcontroller',

    record: null,
    recordClass: null,
    recordProxy: null,

    init: function(view) {
        var me = this, tb = this.lookupReference('navigation-toolbar'),
            buttons = tb.items.items,
            ui = view.colorScheme;

        this.initModelProxy();
        
        //Apply styling buttons
        if (ui) {
            buttons[1].setUI(ui);
            buttons[2].setUI(ui);
        }
    },
    initModelProxy: function() {

        return this;
    },
    onCloseClick: function(button) {
        var panel = this.getView(),
            win = panel.up();
        panel.hide();        
        win.close();
        this.fireEvent('wizardformclose', this);
    },

    onNextClick: function(button) {
        //This is where you can handle any logic prior to moving to the next card
        var panel = this.getView(); // button.up('panel');
            panel.getViewModel().set('atBeginning', false);
        this.navigate(button, panel, 'next');
    },

    onPreviousClick: function(button) {
        var panel = button.up('panel');

            panel.getViewModel().set('atEnd', false);
        this.navigate(button, panel, 'prev');
    },
    
    setProgressAtive: function(positionIndex) {
        var me = this, item,
            progress = this.lookupReference('progress'),
            progressItems = progress.items.items;

        for (var i = 0; i < progressItems.length; i++) {
            item = progressItems[i];
            if (positionIndex === item.step) {
                item.setPressed(true);
            } else {
                item.setPressed(false);
            }
            if (Ext.isIE8) { item.btnIconEl.syncRepaint(); }
        }
        return progress;
    },

    navigate: function(button, panel, direction) {
        var me = this,
            layout = panel.getLayout(),
            progress = this.lookupReference('progress'),
            progressItems = progress.items.items,
            model = panel.getViewModel(),
            activeItem, activeIndex, retIndex = false;

        layout[direction]();

        activeItem = layout.getActiveItem();
        activeIndex = panel.items.indexOf(activeItem);
        
        activeItem.focus();
        retIndex = me.navigateExtend(button, model, activeIndex, direction);
        if ( retIndex ) {
            layout.setActiveItem( retIndex . step );
            activeIndex = retIndex . step;
        }
        
        me.setProgressAtive(activeIndex);
    }
});

Ext.define('Klb.system.widgets.form.Wizard', {
    extend: 'Ext.panel.Panel',

    xtype: 'coreformwizard',

    bodyPadding: 15,
    layout: 'card',
    
    cls: 'wizardthree shadow',
    colorScheme: 'soft-green',
    userCls: 'big-100 small-100',

    viewModel: {
        type: 'coreformwizardmodel'
    },

    controller: 'coreformwizardcontroller',
    app: null,
    appName: null,

    defaults : {
        defaultFocus: 'textfield:not([value]):focusable:not([disabled])',
        defaultButton : 'nextbutton'
    },
    
    setItemsModel: function() {

        return this;
    },
    

    initComponent: function() {
        var me = this;
        
        me.app = Klb.system.appMgr.get(me.appName);
        me.items = [];
        
        var _buttons = [];
        
        if ( this.record && this.record.get('id') )
            _buttons.push({
                        itemId: 'delete-btn',
                        text:  _('#Calendar/Delete Event'),
                        disabled: false,
                        scope: this,
                        minWidth: 150,
                        hideMode: 'offsets',
                        listeners: {
                            click: 'onDeleteClick'
                        }
                    });

        _buttons.push({
                    text: _('Cancel'),                    
                    formBind: true,
                    listeners: {
                        click: 'onCloseClick'
                    }
                },'->', {
                    text: _('Back'),
                    ui: me.colorScheme,
                    formBind: true,
                    bind: { disabled: '{atBeginning}' },
                    listeners: {
                        click: 'onPreviousClick'
                    }
                }, {
                    text: _('Next'),
                    ui: me.colorScheme,
                    formBind: true,
                    reference : 'nextbutton',
                    bind: { disabled: '{atEnd}' },
                    listeners: {
                        click: 'onNextClick'
                    }
            });
            
        me.bbar = {
            reference: 'navigation-toolbar',
            margin: 8,
            items: _buttons
        };

        me.tbar = {
                    reference: 'progress',
                    defaultButtonUI: 'wizard-' + me.colorScheme,
                    cls: 'wizardprogressbar',
                    defaults: {
                        disabled: true,
                        iconAlign:'top'
                    },
                    layout: {
                        pack: 'center'
                    },
                    items: []
                };
      
        me.setItemsModel();

        me.callParent();
    }

});
    