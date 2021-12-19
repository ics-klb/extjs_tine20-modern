Ext.define('Klb.system.widgets.container..store.Users', {
    extend: 'Ext.data.Store',
    model: 'Klb.system.widgets.container.model.User',
    autoLoad: true,

    proxy: {
        type: 'ajax',
        api: {
        	read: '/data/users.json'        	
    	},
        reader: {
            type: 'json',
            root: 'users',
            successProperty: 'success'
        }
    }
});
