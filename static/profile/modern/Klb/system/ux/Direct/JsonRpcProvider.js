/*
 * Modern 3.0
 * 
 * @license     MIT, BSD, and GPL
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2009-2010 Metaways Infosystems GmbH (http://www.metaways.de)
 */

Ext.ns('Ext.ux.direct');

/**
 * @namespace   Ext.ux.direct
 * @class       Ext.ux.direct.JsonRpcProvider
 * @extends     Ext.direct.RemotingProvider
 * @author      Cornelius Weiss <c.weiss@metaways.de>
 * @copyright   Copyright (c) 2009-2010 Metaways Infosystems GmbH (http://www.metaways.de)
 * 
 * Ext.direct provider for seamless integration with JSON RPC servers
 * 
 *  Ext.direct.addProvider(Ext.apply(Ext.app.JSONRPC_API, {
        'type'     : 'jsonrpcprovider',
        'url'      : Ext.app.JSONRPC_API
    }));
 * 
 */
Ext.ux.direct.JsonRpcProvider = Ext.extend(Ext.direct.RemotingProvider, {
    
    /**
     * @cfg {Boolean} paramsAsHash
     */
    //paramsAsHash: true,
    
    /**
     * @cfg {Boolean} useNamedParams
     */
    useNamedParams: false,
    
    // private
    initAPI : function() {
        for (var method in this.services){
            var mparts = method.split('.');
            var cls = this.namespace[mparts[0]] || (this.namespace[mparts[0]] = {});
            cls[mparts[1]] = this.createMethod(mparts[0], Ext.apply(this.services[method], {
                name: mparts[1],
                len: this.services[method].parameters.length
            }));
        }
    },
    
    // private
    doCall : function(c, m, args) {
        // support named/hashed parameters e.g. from DirectProxy
        if (args[args.length-1].paramsAsHash) {
            var o = args.shift();
            for (var i = 0; i < m.parameters.length; i++) {
                args.splice(i,0, o[m.parameters[i].name]);
            }
        }
        
        return Ext.ux.direct.JsonRpcProvider.superclass.doCall.call(this, c, m, args);
    },
    
    // private
    getCallData: function(t){
        var method = t.action + '.' + t.method,
            m  = t.provider.services[method],
            data = t.data || [];
        
        if (this.useNamedParams) {
            var data = {};
            Ext.each(m.parameters, function(param, i) {
                data[param['name']] = t.data[i];
                
                /* NOTE: Ext.direct and the automatically creaeted DirectFn's don't support optional params, cause 
                 * callback and scope are expected on fixed positions!
                 
                var value = typeof t.data[i] !== 'function' ? t.data[i] : undefined;
                
                if (value === undefined && ! param.optional) {
                    value = param['default'];
                }
                
                if (value !== undefined) {
                    data[param['name']] = value;
                }
                */
            }, this);
        }
        
        return {
            jsonrpc: '2.0',
            method: method,
            params: data,
            id: t.requestId
        };
    },
    
    // private
    onData: function(opt, success, xhr) {
        var rs = [].concat(Ext.decode(xhr.responseText));
        
        xhr.responseText = [];
        Ext.each(rs, function(rpcresponse, i) {
            xhr.responseText[i] = {
                type: rpcresponse.result ? 'rpc' : 'exception',
                result: rpcresponse.result,
                tid: rpcresponse.id,
                error: rpcresponse.error
            };
            
            if (xhr.responseText[i].type === 'rpc') {
                delete xhr.responseText.error;
            }
        });
        
        return Ext.ux.direct.JsonRpcProvider.superclass.onData.apply(this, arguments);
    }
});

Ext.direct.PROVIDERS['jsonrpcprovider'] = Ext.ux.direct.JsonRpcProvider;
