/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/**
 * @requires OpenLayers/Lang.js
 */

/**
 * Namespace: OpenLayers.Lang["es"]
 * Dictionary for Spanish, UTF8 encoding. Keys for entries are used in calls to
 *     <OpenLayers.Lang.translate>.  Entry bodies are normal strings or
 *     strings formatted for use with <OpenLayers.Ext.String.format> calls.
 */
OpenLayers.Lang.es = {

    'unhandledRequest': "Respuesta a petición no gestionada ${statusText}",

    'permalink': "Enlace permanente",

    'overlays': "Capas superpuestas",

    'baseLayer': "Capa Base",

    'sameProjection':
        "El mini mapa sólo funciona si está en la misma proyección que el mapa principal",

    'readNotImplemented': "Lectura no implementada.",

    'writeNotImplemented': "Escritura no implementada.",

    'noFID': "No se puede actualizar un elemento para el que no existe FID.",

    'errorLoadingGML': "Error cargando el fichero GML ${url}",

    'browserNotSupported':
        "Su navegador no soporta renderización vectorial. Los renderizadores soportados actualmente son:\n${renderers}",

    'componentShouldBe': "addFeatures : el componente debe ser del tipo ${geomType}",

    // console message
    'getFeatureError':
        "getFeatureFromEvent llamado en una capa sin renderizador. Esto normalmente quiere decir que " +
        "se ha destruido una capa, pero no el manejador asociado a ella.",

    // console message
    'minZoomLevelError':
        "La propiedad minZoomLevel debe sólo utilizarse " +
        "con las capas que tienen FixedZoomLevels. El hecho de que " +
        "una capa wfs compruebe minZoomLevel is una reliquia del " +
        "pasado. Sin embargo, no podemos eliminarla sin discontinuar " +
        "probablemente las aplicaciones OL que puedan depender de ello. " +
        "Así pues estamos haciéndolo obsoleto --la comprobación " +
        "minZoomLevel se eliminará en la versión 3.0. Utilice el ajuste " +
        "de resolution min/max en su lugar, tal como se describe aquí: " +
        "http://trac.openlayers.org/wiki/SettingZoomLevels",

    'commitSuccess': "Transacción WFS: ÉXITO ${response}",

    'commitFailed': "Transacción WFS: FALLÓ ${response}",

    'googleWarning':
        "La capa Google no pudo ser cargada correctamente.<br><br>" +
        "Para evitar este mensaje, seleccione una nueva Capa Base " +
        "en el selector de capas en la esquina superior derecha.<br><br>" +
        "Probablemente, esto se debe a que el script de la biblioteca de " +
	"Google Maps no fue correctamente incluido en su página, o no " +
	"contiene la clave del API correcta para su sitio.<br><br>" +
        "Desarrolladores: Para ayudar a hacer funcionar esto correctamente, " +
        "<a href='http://trac.openlayers.org/wiki/Google' " +
        "target='_blank'>haga clic aquí</a>",

    'getLayerWarning':
        "La capa ${layerType} no pudo ser cargada correctamente.<br><br>" +
        "Para evitar este mensaje, seleccione una nueva Capa Base " +
        "en el selector de capas en la esquina superior derecha.<br><br>" +
        "Probablemente, esto se debe a que el script de " +
	"la biblioteca ${layerLib} " +
        "no fue correctamente incluido en su página.<br><br>" +
        "Desarrolladores: Para ayudar a hacer funcionar esto correctamente, " +
        "<a href='http://trac.openlayers.org/wiki/${layerLib}' " +
        "target='_blank'>haga clic aquí</a>",

    'scale': "Escala = 1 : ${scaleDenom}",

    // console message
    'layerAlreadyAdded':
        "Intentó añadir la capa: ${layerName} al mapa, pero ya había sido añadida previamente",

    // console message
    'reprojectDeprecated':
        "Está usando la opción 'reproject' en la capa " +
        "${layerName}. Esta opción está obsoleta: su uso fue diseñado " +
        "para soportar la visualización de datos sobre mapas base comerciales, " + 
        "pero esa funcionalidad debería conseguirse ahora mediante el soporte " +
        "de la proyección Spherical Mercator. Más información disponible en " +
        "http://trac.openlayers.org/wiki/SphericalMercator.",

    // console message
    'methodDeprecated':
        "Este método está obsoleto y se eliminará en la versión 3.0. " +
        "Por favor utilice el método ${newMethod} en su lugar.",

    // console message
    'boundsAddError': "Debe proporcionar los valores x e y a la función add.",

    // console message
    'lonlatAddError': "Debe proporcionar los valores lon y lat a la función add.",

    // console message
    'pixelAddError': "Debe proporcionar los valores x e y a la función add.",

    // console message
    'unsupportedGeometryType': "Tipo de geometría no soportada: ${geomType}",

    // console message
    'pagePositionFailed':
        "OpenLayers.Util.pagePosition falló: el elemento con id ${elemId} puede haberse colocado de manera errónea.",
                    
    // console message
    'filterEvaluateNotImplemented': "evaluate no está implementado para este tipo de filtro.",

    'end': ''

};
