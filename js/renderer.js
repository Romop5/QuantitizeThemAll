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

}

function getCanvasSize()
{
    var parent = document.getElementById("canvas-parent");
    return {width: parent.offsetWidth, 
            height: window.innerHeight*1.0};
    return {width: window.innerWidth/2.0, 
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

    //requestAnimationFrame(animate);

    //mesh.rotation.x += 0.005;
    //mesh.rotation.y += 0.01;

    //document.write("Render");
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
        imgData = offscreenRenderer.domElement.toDataURL(strMime);

        saveFile(imgData.replace(strMime, strDownloadMime), "test.png");

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

var quantitizeParameters = {
    program: "x+x",
    transformationType: "linear",
}
function quantitize()
{
   setProgramInputToText(quantitizeParameters.program);
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

   in vec2 uvPos;

   void main() {
       vec2 screenSize = vec2(SCREEN_SIZE);
       //float uv_x = (gl_FragCoord.x/screenSize.x)*2.0-1.0;
       //float uv_y = (gl_FragCoord.y/screenSize.y)*2.0-1.0;
       float uv_x = uvPos.x;
       float uv_y = uvPos.y;
       vec2 resultingUv = TRANSFORMATION(vec2(uv_x, uv_y));
       float x = resultingUv.x;
       float y = resultingUv.y;
       float program = PROGRAM;
       gl_FragColor = vec4(program,0.0,0.0, 1.0);
   }
   `

    var program = quantitizeParameters.program;
    var screenSize = getCanvasSize();
    var newFragmentShader = fragmentShaderTemplate
        .replace("PROGRAM", program)
        .replace("SCREEN_SIZE", screenSize.width+","+screenSize.height)
        .replace("TRANSFORMATION", quantitizeParameters.transformationType);
    console.log("New FS:"+newFragmentShader);

    var geometry = new THREE.PlaneBufferGeometry(2, 2);
    var material = new THREE.ShaderMaterial({vertexShader: vertexShaderLiteral, fragmentShader: newFragmentShader});

    mesh = new THREE.Mesh(geometry, material);
    resetScene();
    scene.add(mesh);
    renderer.render(scene, camera);


}
function input_setPreset()
{
    console.log("setPreset()");
    var programName = document.getElementById("inputPreset").value; 
    console.log("Name:" + programName);
    var db = localStorage.getItem(programName);
    quantitizeParameters = JSON.parse(db);
    quantitize();
    console.log("Params: " + db);
}


function input_updateProgram()
{
    console.log("updateProgram()");
    var program = document.getElementById("inputProgram").value; 
    quantitizeParameters.program = program;
    quantitize();
}

function input_updateTransformation()
{
    console.log("updateTransform()");
    var type = document.getElementById("inputTransformation").value; 
    quantitizeParameters.transformationType = type;
    input_updateProgram();
}

function input_updateColor()
{
    console.log("updateColor()");
    var start = document.getElementById("startColor").value; 
    var end = document.getElementById("endColor").value; 
    quantitizeParameters.startColor= start;
    quantitizeParameters.endColor= end;
    input_updateProgram();
}



var g_mutationContext = {};
function generateFunction()
{
    quantitizeParameters.program = "x+x+y";
    quantitize();
}

function initializeDefaultPresets()
{
    localStorage.setItem("scorpion", JSON.stringify({program: "cos(x*y*4.0+tan(x))", transformationType: "circle"}));
    localStorage.setItem("lol", JSON.stringify({program: "x*x", transformationType: "linear"}));
}
