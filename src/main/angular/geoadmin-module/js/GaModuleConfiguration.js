// Global options

// Make sure ajax is using cached requests
$.ajaxSetup({
    cache: true
});

//Get the reference the angular module for the tree component
var module =  angular.module('geoadmin');
function getParam(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20')) || null;
}

var adminUrlRegexp = new RegExp('^(ftp|http|https):\/\/(.*(\.bgdi|\.geo\.admin)\.ch|localhost:[0-9]{1,5})');

var cacheAdd = '' != '' ? '/' + '' : '';
var pathname = location.pathname.replace(/(index|mobile|embed)\.html$/g, '');
var s3pathname = '' == '' ? pathname : '';
var prtl = location.protocol;
// Because s3 is hosted on infra
var supportedEnv = ['dev', 'int', 'prod', 'ci'];
var staging = 'dev';
var hostIsProd = true;
if (/.*\.(dev|int|ci|infra|prod)\.bgdi\.ch$/.test(location.hostname)) {
  hostIsProd = false;
}

// Determines if one is using custom prodUrl (for user env)
var userEnvRegexp = new RegExp('\/\/.*(\/[a-z]*)');
// Force env via parameter for testing purposes (before Varnish)
var env = getParam('env');
function setBackend(prodUrl, techUrl, overwriteParam) {
  var url = prodUrl;
  if (env && env != 'prod' && supportedEnv.indexOf(env) !== -1) {
      url = techUrl + env + '.bgdi.ch';
  }
  var overwrite = prtl + getParam(overwriteParam);
  url = adminUrlRegexp.test(overwrite) ? overwrite : url;
  return url;
}

// Map services urls
var wmsUrl = setBackend(prtl + '//wms-bgdi.dev.bgdi.ch',  prtl + '//wms-bgdi.', 'wms_url');
var wmtsUrl = setBackend(prtl + '//tod.dev.bgdi.ch', prtl + '//tod.', 'wmts_url');
var terrainUrl = setBackend(prtl + '//terrain100.geo.admin.ch', prtl + '//terrain.', 'terrain_url');
var vectorTilesUrl = setBackend(prtl + '//vectortiles{s}.dev.bgdi.ch/3d-tiles', prtl + '//vectortiles{s}.', 'vectortiles_url');

// Api services urls
var defaultApiUrl = prtl + '//mf-chsdi3.dev.bgdi.ch';
var apiUrl = setBackend(defaultApiUrl, prtl + '//mf-chsdi3.', 'api_url');
var altiUrl = setBackend(prtl + '//mf-chsdi3.dev.bgdi.ch', prtl + '//mf-chsdi3.', 'alti_url');
var shopUrl = setBackend(prtl + '//shop-bgdi.dev.bgdi.ch', prtl + '//shop-bgdi.', 'shop_url');
var publicUrl = setBackend(prtl + '//public.dev.bgdi.ch', prtl + '//public.', 'public_url');
var printUrl = setBackend(prtl + '//service-print.dev.bgdi.ch', prtl + '//service-print.', 'print_url');
var proxyUrl = prtl + '//service-proxy.dev.bgdi.ch' + '/';
var apiOverwrite = !!(getParam('api_url') || env);

// Configure via directive parameters
var localConfigurationOverwrite = true;

var localhostRegexp = new RegExp('https?:\/\/localhost:[0-9]{1,5}');
if (localhostRegexp.test(wmtsUrl)){
  wmtsUrl = wmtsUrl.replace('https:', 'http:');
}

module.constant('gaGlobalOptions', {
  //dev3d to be removed once 3d goes live
  dev3d: true,
  buildMode: '',
  version: '',
  pegman: !!window.location.search.match(/(pegman=true)/),
  mapUrl: location.origin + pathname,
  helpUrlTemplate:'./geoadmin-module/help/help.{lang}.jsonp',

  // Map services urls
  wmsUrl: wmsUrl,
  wmtsUrl: wmtsUrl,
  terrainUrl: terrainUrl,
  vectorTilesUrl: vectorTilesUrl,

  // Api services urls
  apiUrl: apiUrl,
  altiUrl: altiUrl,
  printUrl: printUrl,
  proxyUrl: proxyUrl,
  shopUrl: shopUrl,
  publicUrl: publicUrl,
  publicUrlRegexp: new RegExp('^https?:\/\/public\..*\.(bgdi|admin)\.ch\/.*'),
  adminUrlRegexp: adminUrlRegexp,
  hrefRegexp: new RegExp('^\s*(https?|whatsapp|file|s?ftp|blob|mailto):'),
  cachedApiUrl: apiUrl + cacheAdd,
  cachedAltiUrl: altiUrl + cacheAdd,
  imageryMetadataUrl: '//3d.geo.admin.ch/imagery/',
  cachedPrintUrl: printUrl + cacheAdd,
  resourceUrl: './geoadmin-module/',//Local file or remote service
  w3wUrl: 'https://api.what3words.com',
  lv03tolv95Url: 'https://geodesy.geo.admin.ch/reframe/lv03tolv95',
  lv95tolv03Url: 'https://geodesy.geo.admin.ch/reframe/lv95tolv03',
  w3wApiKey: 'OM48J50Y',
  whitelist: [
      'https://' + window.location.host + '/**',
      'https://www.googleapis.com/**'
  ],

  // App state values
  defaultTopicId: '',
  translationFallbackCode: 'ca',
  languages: JSON.parse('["en", "es", "ca"]'),
  hostIsProd: hostIsProd,
  staging: staging,
  apiOverwrite: apiOverwrite,

  // Map state values
  defaultExtent: JSON.parse('[2420000, 1030000, 2900000, 1350000]'),
  defaultResolution: 500.0,
  defaultEpsg: 'EPSG:2056',
  defaultEpsgExtent: JSON.parse('[2420000, 1030000, 2900000, 1350000]'),
  defaultElevationModel: 'COMB',
  defaultTerrain: 'ch.swisstopo.terrain.3d',
  defaultLod: 7 ,
  resolutions: JSON.parse('[650.0, 500.0, 250.0, 100.0, 50.0, 20.0, 10.0, 5.0, 2.5, 2.0, 1.0, 0.5, 0.25, 0.1]'),
  lods: JSON.parse('[6, 7, 8, 9, 10, 11, 12, 13, 14, 14, 16, 17, 18, 18]' ),
  tileGridOrigin: JSON.parse('[2420000, 1350000]'),
  tileGridResolutions: JSON.parse('[4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250, 1000, 750, 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5, 0.25, 0.1]'),
  tileGridWmtsDfltMinRes: 0.5,
  showTreePageSettings: false,

  // Configure via directive parameters and ignore services url, layers url and catalogs url?
  localConfigurationOverwrite: localConfigurationOverwrite,

  checkIfOffline: false, // Do not check if offline
  metadataInfoToolDisabled: true, //Do not show metadata/legend info buttons next to layers
  helpInfoDisabled: true, //Do not show help buttons
  permalinkDisabled: true, //Do not store state on the browser url
  disableDisplayActiveLayerAttribution: true //Do not show the attribution information for the displayed layers
});

//Translation independent values (data from tree's and or catalog's that is not subjected to translation and is loaded dynamically)
module.constant('gTranslationIndependentValues', {});