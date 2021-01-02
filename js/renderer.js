var camera, scene, renderer;
var mesh;
var strDownloadMime = "image/octet-stream";

// Vertex Shader - identity
var vertexShaderLiteral =`
#define GLSLIFY 1
out vec2 uvPos;
void main() {
    // Vertex shader output
    uvPos = position.xy;
    gl_Position = vec4(position, 1.0);
}
`
// Fragment Shader - identity
var fragmentShaderLiteral =`
void main() {
    gl_FragColor = vec4(sin(gl_FragCoord.x*30.0),0.0,0.0, 1.0);
}
`

function init() {

    console.log("Init()");
    var saveLink = document.createElement('div');
    saveLink.style.position = 'absolute';
    saveLink.style.top = '10px';
    saveLink.style.width = '100%';
    saveLink.style.color = 'white !important';
    saveLink.style.textAlign = 'center';
    saveLink.innerHTML =
        '<a href="#" id="saveLink">Save Frame</a>';
    //document.body.appendChild(saveLink);
    //document.getElementById("saveLink").addEventListener('click', saveAsImage);
    renderer = new THREE.WebGLRenderer({
        preserveDrawingBuffer: true,
        precision: "highp"
    });
    var size = getCanvasSize();
    renderer.setSize(size.width, size.height);
    document.getElementById("canv").appendChild(renderer.domElement);
    //document.body.appendChild(renderer.domElement);

    //camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 1000);
    camera = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    scene = new THREE.Scene();
    var geometry = new THREE.PlaneBufferGeometry(2, 2);
    var material = new THREE.ShaderMaterial({vertexShader: vertexShaderLiteral, fragmentShader: fragmentShaderLiteral});

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    renderer.render(scene, camera);

    initializeDefaultPresets();
    window.addEventListener('resize', onWindowResize, false);


    updateConfigFromURL();
    updateHTMLFromParams();
}

function getCanvasSize()
{
    var parent = document.getElementById("canvas-parent");
    return {width: parent.offsetWidth, 
            height: window.innerHeight*1.0};
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    var screenSize = getCanvasSize();
    renderer.setSize(screenSize.width, screenSize.height);
    renderer.render(scene, camera);

}

function animate() {
    renderer.render(scene, camera);
}

function saveAsImage() {
    var imgData, imgNode;

    try {
        
        /*
         * Create new offscreen renderer
         */
        var offscreenRenderer = new THREE.WebGLRenderer({
            preserveDrawingBuffer: true,
            precision: "highp"
        });

        var width = document.getElementById("outputWidth").value;
        var height = document.getElementById("outputHeight").value;
        offscreenRenderer.setSize(width, height);
        offscreenRenderer.render(scene, camera);

        var strMime = "image/png";
        imgData = offscreenRenderer.domElement.toDataURL(strMime,1.0);

        saveFile(imgData.replace(strMime, strDownloadMime), "qtaRender.png");

    } catch (e) {
        console.log(e);
        return;
    }

}

var saveFile = function (strData, filename) {
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
        document.body.appendChild(link); //Firefox requires the link to be in the body
        link.download = filename;
        link.href = strData;
        link.click();
        document.body.removeChild(link); //remove the link when done
    } else {
        location.replace(uri);
    }
}

//-----------------------------------------------------------------------------
// Functionality
//-----------------------------------------------------------------------------
// Taken from https://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript
function deepClone(object)
{
    return JSON.parse(JSON.stringify(object));
}

// Taken from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Taken from https://stackoverflow.com/questions/30359830/how-do-i-clear-three-js-scene/48722282
function resetScene()
{
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
}
function setProgramInputToText(text)
{
   document.getElementById("inputProgram").value = text; 
}

var g_quantitizeParameters = {
    program: "x+x",
    transformationType: "linear",
    startColor: "#FF5800",
    endColor: "#FD3300",
    zoom: 1.0,
    focal: 1.0,
    hasColorThreshold: false,
    colorThreshold: 0.5
}
var g_quantitizeParametersStack = [g_quantitizeParameters]
function quantitize()
{
   setProgramInputToText(g_quantitizeParameters.program);
   var fragmentShaderTemplate=`
   vec2 linear(vec2 uv)
   {
        return uv; 
   }

   vec2 circle(vec2 uv)
   {
        vec2 nuv = normalize(uv);
        float dist = 1.0/length(uv);
        return nuv*dist;
   }
   vec2 polar(vec2 uv)
   {
        return vec2(atan(uv.x,uv.y),sqrt(uv.x*uv.x+ uv.y*uv.y));  
   }
   vec2 spherical(vec2 uv)
   {
        vec2 direction = uv;
        float len = length(uv);
        return vec2(exp(len))*direction;
   }
   vec2 fisheye(vec2 uv)
   {
        float f = FOCAL;
        // Calculate angle from plane's UV
        vec2 angles = atan(uv, vec2(1.0));
        //return angles*f;
        return vec2(2.0)*sin(angles*vec2(0.5))*vec2(f);
   }

   float inv(float x)
   {
    return 1.0/x;
   }


   in vec2 uvPos;

   void main() {
       vec2 screenSize = vec2(SCREEN_SIZE);
       float uv_x = uvPos.x;
       float uv_y = uvPos.y;
       vec2 resultingUv = TRANSFORMATION(vec2(uv_x, uv_y)*vec2(ZOOM));
       float x = resultingUv.x;
       float y = resultingUv.y;
       float program = PROGRAM;
       float parameter = clamp(program, 0.0,1.0);

       vec3 colorStart = vec3(START_COLOR)/255.0;
       vec3 colorEnd = vec3(END_COLOR)/255.0;
       vec3 resultColor = mix(colorStart, colorEnd, parameter);

       bool hasColorThreshold = THRESHOLD;
       if(hasColorThreshold)
       {
          resultColor = (parameter > THRESHVALUE)?colorStart:colorEnd;  
       }
       gl_FragColor = vec4(resultColor, 1.0);
   }
   `

    var program = g_quantitizeParameters.program;
    var screenSize = getCanvasSize();

    var startCol = hexToRgb(g_quantitizeParameters.startColor);
    var endCol= hexToRgb(g_quantitizeParameters.endColor);

    var newFragmentShader = fragmentShaderTemplate
        .replace("PROGRAM", program)
        .replace("SCREEN_SIZE", screenSize.width+","+screenSize.height)
        .replace("TRANSFORMATION", g_quantitizeParameters.transformationType)
        .replace("ZOOM", parseFloat(g_quantitizeParameters.zoom).toFixed(4))
        .replace("FOCAL", parseFloat(g_quantitizeParameters.focal).toFixed(4))
        .replace("THRESHOLD", g_quantitizeParameters["hasColorThreshold"])
        .replace("THRESHVALUE", parseFloat(g_quantitizeParameters["colorThreshold"]).toFixed(4))
        .replace("START_COLOR", startCol.r+","+startCol.g+","+startCol.b)
        .replace("END_COLOR", endCol.r+","+endCol.g+","+endCol.b);
    //console.log("New FS:"+newFragmentShader);

    var geometry = new THREE.PlaneBufferGeometry(2, 2);
    var material = new THREE.ShaderMaterial({vertexShader: vertexShaderLiteral, fragmentShader: newFragmentShader});

    mesh = new THREE.Mesh(geometry, material);
    resetScene();
    scene.add(mesh);
    renderer.render(scene, camera);


}

function updateConfigFromURL()
{
    if(window.location.search.includes("?data="))
    {
        const data = window.location.search.replace("?data=", "");
        const urlSettings = Base64DecodeUrl(JSON.parse(window.atob(data)));
        g_quantitizeParameters = urlSettings;
        quantitize();
    }
}

function updateHTMLFromParams()
{
    document.getElementById("inputProgram").value = g_quantitizeParameters.program; 
    document.getElementById("inputTransformation").value = g_quantitizeParameters.transformationType; 
    document.getElementById("inputZoom").value = g_quantitizeParameters.zoom; 
    document.getElementById("inputFocal").value = g_quantitizeParameters.focal; 

    document.getElementById("startColor").value = g_quantitizeParameters.startColor; 
    document.getElementById("endColor").value = g_quantitizeParameters.endColor; 
    document.getElementById("enable_threshold").checked = g_quantitizeParameters.hasColorThreshold; 
    document.getElementById("inputThreshold").value = g_quantitizeParameters.colorThreshold; 

    document.getElementById("maxIters").value = g_generatorSettings.maxIters;
    document.getElementById("minIters").value = g_generatorSettings.minIters;
    document.getElementById("oscillation").value = g_generatorSettings.oscillations;
    document.getElementById("allow_constant").checked = g_generatorSettings.constants;
}

function input_setPreset()
{
    console.log("setPreset()");
    var programName = document.getElementById("inputPreset").value; 
    console.log("Name:" + programName);
    var db = localStorage.getItem(programName);
    params = JSON.parse(db);

    // Pre-fill important parameters (such as zoom), which may not be part of stored preset
    g_quantitizeParameters["zoom"] = 1.0; 
    for (var key in params) {
        if (params.hasOwnProperty(key)) {
            g_quantitizeParameters[key] = params[key];
        }
    }
    quantitize();
    console.log("Params: " + db);
    updateHTMLFromParams()
}

function input_savePreset()
{
    console.log("savePreset()");
    var programName = document.getElementById("inputPresetName").value; 
    storePreset(programName, g_quantitizeParameters);
    addPresetToHTML(programName)
}

function input_exportPresets()
{
    console.log("exportPresets()");

    var totalSettings = {}
    var presets = getListOfAvailablePresets();
    for(var i = 0; i < presets.length; i++)
    {
        var programName = presets[i];
        var presetSettings = JSON.parse(localStorage.getItem(programName));
        totalSettings[programName] = presetSettings;
    }


    let element = document.createElement("input")
    element.value = JSON.stringify(totalSettings);
    document.body.appendChild(element)

    element.select();
    element.setSelectionRange(0, 99999)
    document.execCommand("copy");
    alert("Saved to clip board");
    element.remove();
}

function input_loadFromPresetFile(file)
{
    var obj = JSON.parse(file)
    var keys = Object.keys(obj)
    for(var i = 0; i < keys.length; i++)
    {
        var keyName = keys[i]
        var presetSettings = obj[keyName]
        //console.log(keyName,presetSettings)
        storePreset(keyName, presetSettings);
    }
    cleanPresetList();
}
function input_importPresets()
{
    const selectedFile = document.getElementById('importFile').files[0];
    console.log(selectedFile)
    const objectURL = window.URL.createObjectURL(selectedFile);
    console.log(objectURL);

    const reader = new FileReader();
    console.log(reader)
    reader.addEventListener("load", function () {
        var res = reader.result
        res = res.replace(/.*base64,/,"")
        res = window.atob(res)
        //console.log(res)
        input_loadFromPresetFile(res);

    }, false);
    reader.readAsDataURL(selectedFile);
}


function input_updateProgram()
{
    console.log("updateProgram()");
    var program = document.getElementById("inputProgram").value; 
    g_quantitizeParameters.program = program;
    quantitize();
}

function input_updateTransformation()
{
    console.log("updateTransform()");
    var type = document.getElementById("inputTransformation").value; 
    var zoom= document.getElementById("inputZoom").value; 
    var focal = document.getElementById("inputFocal").value; 
    g_quantitizeParameters.transformationType = type;
    g_quantitizeParameters.zoom = zoom;
    g_quantitizeParameters.focal = focal;
    input_updateProgram();
}

function input_updateColor()
{
    console.log("updateColor()");
    var start = document.getElementById("startColor").value; 
    var end = document.getElementById("endColor").value; 
    var enabler = document.getElementById("enable_threshold").checked; 
    var thresholdSlider= document.getElementById("inputThreshold"); 
    g_quantitizeParameters.startColor= start;
    g_quantitizeParameters.endColor= end;
    g_quantitizeParameters.hasColorThreshold= enabler;
    g_quantitizeParameters.colorThreshold= thresholdSlider.value;
    thresholdSlider.disabled = !enabler;
    input_updateProgram();
}

function input_invertColor()
{
    console.log("invertColor()");
    var start = document.getElementById("startColor").value;
    var end = document.getElementById("endColor").value;
    document.getElementById("startColor").value = end;
    document.getElementById("endColor").value = start;
    input_updateColor();
}

function pushCurrentParameters()
{
    g_quantitizeParametersStack.push(deepClone(g_quantitizeParameters));
}

function popCurrentParameters()
{
    console.log(g_quantitizeParametersStack)
    if(g_quantitizeParametersStack.length > 1)
    {
        g_quantitizeParameters = g_quantitizeParametersStack.pop()
    } else {
        g_quantitizeParameters = g_quantitizeParametersStack[0];
    }
    console.log(g_quantitizeParameters)
    updateHTMLFromParams();
}

function getFormElementValue(elementID, defaultVal)
{
    element = document.getElementById(elementID);
    if(element != null)
        return element.value;
    return defaultVal;
}
function isFormElementChecked(elementID)
{
    element = document.getElementById(elementID);
    if(element != null)
        return element.checked;
    return false;
}


var g_generatorSettings = {minIters: 1, maxIters: 5, constants: true, oscillations: 30.0}
function input_updateGeneratorRules()
{
    var binaryFunc = []
    var unaryFunc= []
    if(isFormElementChecked("allow_modulo"))
    {
        binaryFunc.push("mod");
    }

    if(isFormElementChecked("allow_abs"))
    {
        unaryFunc.push("abs");
    }

    if(isFormElementChecked("allow_inv"))
    {
        unaryFunc.push("inv");
    }

    if(isFormElementChecked("allow_pow"))
    {
        binaryFunc.push("pow");
    }

    if(isFormElementChecked("allow_sin"))
    {
        unaryFunc.push("sin");
    }

    if(isFormElementChecked("allow_minmax"))
    {
        binaryFunc.push("min");
        binaryFunc.push("max");
    }

    g_generatorSettings = deepClone({
        minIters: getFormElementValue("minIters", 1),
        maxIters: getFormElementValue("maxIters", 5),
        binary: binaryFunc,
        unary: unaryFunc,
        constants: isFormElementChecked("allow_constant"),
        oscillations: getFormElementValue("oscillation", 30.0),
    })
}

function input_mutateFunction()
{
    pushCurrentParameters();
    const program = g_quantitizeParameters.program;
    const regexp = /[0-9]+.[0-9]*/g;

    var result = program.replace(regexp, function(match, token) {
        const newVal = match*(Math.random()*2.0) + Math.random()
        return (newVal).toFixed(2).toString();
    });
    console.log(result)

    g_quantitizeParameters.program = result
    quantitize()

}
function input_generateFunction()
{
    pushCurrentParameters();
    // Store current parameters
    //g_quantitizeParameters.program = generateExpression(6);
    var grammar = createGrammarFromConfig(g_generatorSettings);
    g_quantitizeParameters.program = generateExpressionFromGrammar(grammar,
        g_generatorSettings.minIters,
        g_generatorSettings.maxIters,
        g_generatorSettings.oscillations
    );
    //g_quantitizeParameters.program = generateExpression(6);
    quantitize();
}
function input_revertGenerateFunction()
{
    popCurrentParameters();
    quantitize();
}

// Taken from https://jsfiddle.net/magikMaker/7bjaT/
function Base64EncodeUrl(str){
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
}

// Taken from https://jsfiddle.net/magikMaker/7bjaT/
function Base64DecodeUrl(str){
    str = (str + '===').slice(0, str.length + (str.length % 4));
    return str.replace(/-/g, '+').replace(/_/g, '/');
}

function input_shareURL()
{
    let element = document.createElement("input")
    const search = "?data="+Base64EncodeUrl(window.btoa(JSON.stringify(g_quantitizeParameters)));
    const newURL = window.location.protocol + "//" + window.location.host + "/" + window.location.pathname + search;
    element.value = newURL;
    document.body.appendChild(element)

    element.select();
    element.setSelectionRange(0, 99999)
    document.execCommand("copy");
    alert("Saved to clip board");
    element.remove();
}

function cleanPresetList()
{
    const node = document.getElementById("inputPreset");
    while (node.firstChild) {
        node.removeChild(node.lastChild);
    }
}

function initializeDefaultPresets()
{
    input_loadFromPresetFile(
        '{"scorpion":{"program":"cos(x*y*4.0+tan(x))","transformationType":"circle"},"lol":{"program":"x*x","transformationType":"linear"},"circles":{"program":"min(min(5.0*pow(x,5.0),x*x*4.0), sin(x*30.0))","transformationType":"circle"},"India":null,"hearth":null,"ant":{"program":"mod(x+sin(y+8.0),1.0)","transformationType":"circle","startColor":"#FF0000","endColor":"#00FF00"},"ant2":{"program":"mod(x+sin(y+8.0),1.0)","transformationType":"circle","startColor":"#b5ff00","endColor":"#ff7500"},"HouseOfRisingSun":{"program":"mod(tan(y*0.2)+sin(y+8.0),1.0)","transformationType":"circle","startColor":"#ff0000","endColor":"#ffaf00"},"Owl":{"program":"mod(x,0.5)*mod(y*x*0.4,0.2)*10.0","transformationType":"circle","startColor":"#ff0000","endColor":"#ffaf00"},"Spiral":{"program":"sin(30.0*x+pow(y,3.0)*20.0)*sin(20.0*x)","transformationType":"polar","startColor":"#ff0000","endColor":"#ffaf00"},"Generator":{"program":"mod((y+(x*mod(x,0.196822567045852))),0.925478177444047)","transformationType":"circle","startColor":"#000000","endColor":"#ffffff"},"Generator2":{"program":"mod((mod(mod((x*sin(x)),1.1129733594351543),9.674507210305554)*(0.6239382487984468+mod(sin(y),9.987774062710699))),5.929907347341001)","transformationType":"circle","startColor":"#000000","endColor":"#970505"},"Generator3":{"program":"(sin(x)*mod((sin(sin((x+x)))+y),3.0428769123107555))","transformationType":"circle","startColor":"#000000","endColor":"#970505"},"Generator5":{"program":"sin(((6.21+(cos((x+x))+y))+sin((sin((x+x))+sin(sin(x))))))","transformationType":"circle","startColor":"#ff1e00","endColor":"#ff8300"},"Generator6":{"program":"(sin(mod(x,13.27))+(sin(mod(x,22.34))*cos(y)))","transformationType":"circle","startColor":"#e61f05","endColor":"#ff8300"},"Generator7":{"program":"mod(mod((cos(mod(y,25.16))*((mod(x,5.58)+sin(x))*3.45)),13.18),14.25)","transformationType":"circle","startColor":"#ff0000","endColor":"#ff6f00"},"Generator8":{"program":"((((9.19*(x+(x+x)))*y)+27.20)+sin(cos(x)))","transformationType":"circle","startColor":"#ff0000","endColor":"#ff6f00"},"Generator9":{"program":"((cos(y)*cos((y*((x+x)+mod(x,10.81)))))+mod(cos(cos(x)),19.03))","transformationType":"circle","startColor":"#000000","endColor":"#970505"},"Generator10":{"program":"(cos(x)+sin((8.05+mod(y,17.50))))","transformationType":"circle","startColor":"#000000","endColor":"#970505"},"Generator11":{"program":"(x*mod(((mod(2.43,22.21)+18.02)+cos(y)),0.39))","transformationType":"circle","startColor":"#000000","endColor":"#ffffff"},"Generator12":{"program":"((x+y)+mod(mod((mod((x*x),21.79)+(y+mod(x,20.31))),2.34),7.05))","transformationType":"circle","startColor":"#e61f05","endColor":"#ff8300"},"Generator13":{"program":"(x*(sin(y)+cos(x)))","transformationType":"circle","startColor":"#e61f05","endColor":"#ff8300"},"Generator14":{"program":"(sin(cos((mod(23.39,18.46)*y)))+(sin(25.24)+((sin(y)+(sin(x)*28.27))*cos(mod(sin(x),20.89)))))","transformationType":"circle","startColor":"#e61f05","endColor":"#ff8300"},"Generator15":{"program":"mod(sin((cos(x)+(12.98+y))),9.84)","transformationType":"circle","startColor":"#000000","endColor":"#ffffff"},"Generator16":{"program":"sin((y+((cos((x+x))+cos(x))*sin(y))))","transformationType":"circle","startColor":"#000000","endColor":"#ffffff"},"Generator17":{"program":"(mod(y,0.37)*(cos(y)*x))","transformationType":"circle","startColor":"#006b00","endColor":"#67f63a"},"Generator18":{"program":"(sin(cos(x))+((x+cos(x))*mod(((x*sin(x))*mod(sin(x),19.78)),3.29)))","transformationType":"circle","startColor":"#ff0021","endColor":"#ff8a00"},"Generator19":{"program":"mod(((sin(25.08)*sin(cos((x+x))))*y),1.51)","transformationType":"circle","startColor":"#ff0021","endColor":"#ff8a00"},"Generator20":{"program":"mod(((cos((x*y))+cos(x))+mod(24.91,3.19)),1.01)","transformationType":"circle","startColor":"#ff8a00","endColor":"#ff0021"},"Generator21":{"program":"(mod((cos(y)+mod(cos(sin(x)),25.87)),9.17)*3.13)","transformationType":"circle","startColor":"#e61f05","endColor":"#ff8300"},"Generator22":{"program":"((cos(1.02)+mod((cos((x*x))*23.58),23.55))*((((cos(x)*y)*x)*(y*x))+mod(((y+x)*sin(y)),2.47)))","transformationType":"circle","startColor":"#ff8300","endColor":"#e61f05"},"Generator23":{"program":"(sin(((17.19*y)*mod(y,20.95)))+x)","transformationType":"circle","startColor":"#ff8300","endColor":"#e61f05"},"Generator24":{"program":"mod(mod(((x*((x+x)+sin(x)))*mod(y,12.09)),6.43),8.19)","transformationType":"circle","startColor":"#ff8300","endColor":"#e61f05"},"Generator25":{"program":"mod(((sin((sin(x)*y))+mod(sin((x*x)),9.65))*mod(mod((3.96+cos(x)),2.19),25.24)),22.29)","transformationType":"circle","startColor":"#ff8300","endColor":"#e61f05"},"Generator26":{"program":"((mod(cos(x),14.36)+sin(y))*(y*x))","transformationType":"circle","startColor":"#ff8300","endColor":"#e61f05"},"Generator27":{"program":"(x+mod((sin(x)*sin(y)),18.51))","transformationType":"circle","startColor":"#ff8300","endColor":"#e61f05"},"Generator28":{"program":"sin(sin((sin(mod(mod(x,11.13),1.06))+mod(y,20.29))))","transformationType":"circle","startColor":"#ff8300","endColor":"#e61f05"},"Generator29":{"program":"mod((((x+(3.74+x))*sin(x))*mod(cos(y),0.71)),7.72)","transformationType":"circle","startColor":"#ffb156","endColor":"#ff8700"},"Generator30":{"program":"(cos((((28.17+(x+x))*mod((x*x),0.93))*y))*21.80)","transformationType":"circle","startColor":"#ffb156","endColor":"#ff8700"},"Generator 31":{"program":"sin(mod(sin(sin(sin(x)))+mod(y,25.42),96.32))","transformationType":"circle","startColor":"#00d8ff","endColor":"#001b65"},"Generator 32":{"program":"sin(y*mod(y,91.91)*mod(sin(sin(mod(y,87.85))*mod(sin(sin(x*70.03)),64.34)),97.54))","transformationType":"linear","startColor":"#ff0000","endColor":"#ff6600"},"Generator 33":{"program":"mod(sin(sin(y*y)*mod(mod(y+68.76,71.23)*y,28.00)+y+mod(y*10.18,14.46)+sin(x*38.45)),39.22)","transformationType":"polar","startColor":"#ff0000","endColor":"#ff6600"},"Generator 34":{"program":"sin(sin(mod(y,15.39))*70.41)*y*mod(72.06,55.44)+x+57.25*x","transformationType":"polar","startColor":"#ff0000","endColor":"#ff6600"},"Generator 35":{"program":"x*0.27*sin(0.06)*mod(x,0.41)*mod(x+x,0.13)+mod(x*x+y,0.29)+0.17+sin(y+0.32+sin(sin(sin(x))))+sin(mod(mod(sin(mod(x,0.16)),0.20)*sin(0.39),0.42))*sin(mod(mod(mod(y,0.49),0.10)*mod(mod(sin(mod(x,0.15)),0.01),0.28),0.37))","transformationType":"polar","startColor":"#ff0000","endColor":"#ff6600"},"Generator 36":{"program":"y*mod(sin(sin(sin(y)+y+y))+x,0.54)*x+mod(x,0.39)","transformationType":"polar","startColor":"#ff0000","endColor":"#ff6600"},"Mutation 1 (gen 7)":{"program":"mod(mod((cos(mod(y,14.89))*((mod(x,1.16)+sin(x))*1.58)),14.57),9.32)","transformationType":"circle","startColor":"#ff0000","endColor":"#ff6f00"},"Mutation 2 (gen 7)":{"program":"mod(mod((cos(mod(y,1.37))*((mod(x,0.97)+sin(x))*0.67)),3.46),1.28)","transformationType":"circle","startColor":"#ff0000","endColor":"#ff6f00"}}');
    updateHTMLPresetList();

}
function updateHTMLPresetList()
{
    const list = JSON.parse(localStorage.getItem("qat-list"));
    list.forEach(element =>  addPresetToHTML(element));
}

function getListOfAvailablePresets()
{
    return JSON.parse(localStorage.getItem("qat-list"));
}
function storePreset(presetName, parameters)
{
    list = JSON.parse(localStorage.getItem("qat-list"));
    if(list != null)
    {
        if(list.includes(presetName))
            return;
        list.push(presetName);
    } else
    {
        list = [presetName];
    }
    localStorage.setItem("qat-list",JSON.stringify(list));
    localStorage.setItem(presetName,JSON.stringify(parameters));
}

function addPresetToHTML(presetName)
{
    var optElement = document.createElement('option');
    optElement.value = presetName;
    optElement.innerHTML = presetName;
    document.getElementById("inputPreset").appendChild(optElement)
}
