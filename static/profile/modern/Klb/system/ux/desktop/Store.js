Ext.ns('Klb.system.ux.desktop.Store');

Ext.define('Klb.system.ux.desktop.Store.LabelsTodosTpl',{
    extend: 'Ext.data.Store',
    alias: 'store.todosstoretpl',
    fields: [
        {name: 'id',       type: 'string'},
        {name: 'label',    type: 'string'},
        {name: 'name',     type: 'string'},
        {name: 'color',    type: 'string'},
        {name: 'location', type: 'boolean', default: false}
    ],
    data: [
        {label: 'Т', name: 'Проверка',     location: true },
        {label: 'П', name: 'Подготовка'},
        {label: 'К', name: 'Коммандировка'},
        {label: 'О', name: 'Отпуск'},
        {label: 'Б', name: 'Больничный'}
    ]
});
