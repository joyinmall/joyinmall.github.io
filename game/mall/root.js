
window.linkRes = (url) => {
    if (window.integrationSite) {
        return "https://cdn.jsdelivr.net/gh/joyinmall/joyinmall.github.io@8acdca3/game/" + url;
    } else {
        return url;
    }
}

loadScriptSync(linkRes("common/gameControlsManager.js"));
loadScriptSync(linkRes("common/scoreManager.js"));
loadScriptSync(linkRes("common/gameOverManager.js"));
loadScriptSync(linkRes("common/slideGestureDetector.js"));
loadScriptSync(linkRes("mall/room.js"));
loadScriptSync(linkRes("mall/ads/TvAd.js"));
loadScriptSync(linkRes("mall/ads/TaddtoyAd.js"));
loadScriptSync(linkRes("mall/ads/Banner.js"));
loadScriptSync(linkRes("mall/adsManager.js"));

window.moreGamesCallback = null;
window.gameScene = null;
window.currentActiveScene = null;
window.roomEdgeLength = 20;

window.canvas = document.getElementById("renderCanvas");

var startRenderLoop = function (engine, canvas) {
    engine.runRenderLoop(function () {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
}

window.engine = null;
window.mallScene = null;
var sceneToRender = null;
//window.createDefaultEngine = function() { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false}); };

var createScene = async function () {
    await BABYLON.InitializeCSG2Async();

    /*
     * FIRST SCENE
     */
    var firstScene = new BABYLON.Scene(window.engine);
    firstScene.clearColor = new BABYLON.Color3(0.03, 0.03, 0.55);

    window.mallScene = firstScene;

    /*
     * GUI SCENE
     */
    var guiScene = new BABYLON.Scene(window.engine);
    // MARK THE GUI SCENE AUTO CLEAR AS FALSE SO IT DOESN'T ERASE
    // THE CURRENTLY RENDERING SCENE
    guiScene.autoClear = false;
    var guiCamera = new BABYLON.FreeCamera("guiCamera", new BABYLON.Vector3(0,0,0), guiScene);

    window.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, guiScene);
	
	// Skybox
	var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, window.mallScene);
	var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", window.mallScene);
	skyboxMaterial.backFaceCulling = false;
	skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://raw.githubusercontent.com/xMichal123/mall-games/main/resources/skybox2");
	skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
	skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
	skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
	skybox.material = skyboxMaterial;			

    prepareGameRoom();

    adsManager.init();

    currentActiveScene = firstScene;

    //runRenderLoop inside a setTimeout is neccesary in the Playground
    //to stop the PG's runRenderLoop.
    setTimeout(function () {
        window.engine.stopRenderLoop();

        window.engine.runRenderLoop(function () {
            currentActiveScene.render();
            guiScene.render();
        });
    }, 500);

    return firstScene;
};

function prepareGameRoom() {
    createGameRoom(window.games);
} 


window.initFunction = async function() {
    /*var asyncEngineCreation = async function() {
        try {
        return createDefaultEngine();
        } catch(e) {
        console.log("the available createEngine function failed. Creating the default engine instead");
        return createDefaultEngine();
        }
    }*/

    window.engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false});//await asyncEngineCreation();

    if (!window.engine) throw 'engine should not be null.';

    startRenderLoop(window.engine, canvas);

    window.scene = createScene();
};

// Resize
window.addEventListener("resize", function () {
    window.engine.resize();
});

window.createGameEnvironment = function (games, adCallback, useMoreGamesLink = true) {
    window.games = games;
    window.useMoreGamesLink = useMoreGamesLink;
    gameOverManager.adCallback = adCallback;
    gameControlsManager.adCallback = adCallback;
    initFunction().then(() => { sceneToRender = window.mallScene });
}
