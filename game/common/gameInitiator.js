// Load the library synchronously
loadScriptSync("https://cdn.jsdelivr.net/gh/xMichal123/babylon-libraries@latest/gameControlsManager.js");
loadScriptSync("https://cdn.jsdelivr.net/gh/xMichal123/babylon-libraries@latest/scoreManager.js");
loadScriptSync("https://cdn.jsdelivr.net/gh/xMichal123/babylon-libraries@d1b31c7/gameOverManager.js");
loadScriptSync("https://cdn.jsdelivr.net/gh/xMichal123/babylon-libraries@c413ac6/slideGestureDetector.js");

function removeIframe(iframe) {
    if (iframe && iframe.parentNode) {
        document.body.removeChild(iframe);
    }
}

function loadScriptInIframe(url, dependencies = {}, params = {}, callback = null) {
    // Step 1: Create the iframe
    const iframe = document.createElement("iframe");
    iframe.style.display = "none"; // Hide iframe
    document.body.appendChild(iframe);
    
    const iframeWindow = iframe.contentWindow;

    // Step 2: Inject dependencies and params
    for (const key in dependencies) {
        iframeWindow[key] = dependencies[key];
    }

    iframeWindow.params = params;
    window.moreGamesCallback = callback; // Pass the iframe explicitly

    // Step 3: Load and execute the script inside the iframe
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send();

    if (xhr.status === 200) {
        try {
            iframeWindow.eval(xhr.responseText);
        } catch (error) {
            console.error("Script execution error:", error);
        }
    } else {
        console.error(`Failed to load script: ${url}`);
    }

    return iframe;
}

window.moreGamesCallback = null;
window.gameScene = null;
let currentActiveScene = null;

window.canvas = document.getElementById("renderCanvas");

var startRenderLoop = function (engine, canvas) {
    engine.runRenderLoop(function () {
        if (sceneToRender && sceneToRender.activeCamera) {
            sceneToRender.render();
        }
    });
}

window.engine = null;
var scene = null;
var sceneToRender = null;
//window.createDefaultEngine = function() { return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false}); };

var createScene = function () {

    /*
     * FIRST SCENE
     */
    var firstScene = new BABYLON.Scene(window.engine);
    firstScene.clearColor = new BABYLON.Color3(0.03, 0.03, 0.55);

    scene = firstScene;

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
	var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, scene);
	var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
	skyboxMaterial.backFaceCulling = false;
	skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://raw.githubusercontent.com/xMichal123/mall-games/main/resources/skybox2", scene);
	skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
	skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
	skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
	skybox.material = skyboxMaterial;			

    prepareGameRoom(firstScene);

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

function prepareGameRoom(scene) {
    createGameRoom(window.games, scene);
} 

function startGame(gameName) {
    const BASE_URL = "https://cdn.jsdelivr.net/gh/xMichal123/mall-games@";
    const COMMIT_HASH = "latest"; // Update this if needed

    const scriptUrl = `${BASE_URL}${COMMIT_HASH}/${gameName}/game.js`;
    
    const iframe = loadScriptInIframe(scriptUrl,
        {
            gameControlsManager: gameControlsManager,
            scoreManager: scoreManager,
            gameOverManager: gameOverManager,
            slideGestureDetector: slideGestureDetector,
            BABYLON: BABYLON,
            engine: window.engine,
            advancedTexture: advancedTexture,
            canvas: window.canvas
        },
        {},
        () => {
            if (window.useMoreGamesLink) {
                window.location.href = 'https://www.joyinmall.com/game';
            } else {
                currentActiveScene = scene;
                iframe.contentWindow.gameScene.dispose();
                removeIframe(iframe);
                advancedTexture.rootContainer.isVisible = false;
                scene.attachControl(canvas, true);
            }
        }
    );

    advancedTexture.rootContainer.isVisible = true;

    window.gameScene = iframe.contentWindow.gameScene;
    iframe.contentWindow.init();
    currentActiveScene = iframe.contentWindow.gameScene;
    scene.detachControl();
}

function createGameRoom(games, scene) {
    // Define constants
    const radius = 6; // Radius of the circular path
    const verticalLimit = Math.PI / 8; // Limit for vertical rotation (in radians)

    // Create a camera that will simulate the player's view
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(radius, 2, 0), scene);

    // Detach default camera controls
    camera.detachControl(canvas);

    // Set up initial camera properties
    camera.fov = 0.8;
    camera.minZ = 0.1;
    const yPos = 1.8;

    // Define variables for rotation tracking
    let horizontalAngle = 0;
    let verticalAngle = 0;

    camera.position.x = radius * Math.cos(horizontalAngle);
    camera.position.z = radius * Math.sin(horizontalAngle);
    camera.position.y = yPos + verticalAngle; // Adjust vertical position based on vertical angle

    // Always look towards the center of the circle
    camera.setTarget(new BABYLON.Vector3(0, yPos, 0));
    camera.rotation.y = Math.PI + camera.rotation.y;

    // Event listener for controlling rotation
    scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            scene.onPointerMove = (evt) => {
                horizontalAngle += evt.movementX * 0.001;
                verticalAngle = Math.max(-verticalLimit, Math.min(verticalLimit, verticalAngle + evt.movementY * 0.01));
                
                // Calculate camera position based on horizontal rotation
                camera.position.x = radius * Math.cos(horizontalAngle);
                camera.position.z = radius * Math.sin(horizontalAngle);
                camera.position.y = yPos + verticalAngle; // Adjust vertical position based on vertical angle

                // Always look towards the center of the circle
                camera.setTarget(new BABYLON.Vector3(0, yPos, 0));
                camera.rotation.y = Math.PI + camera.rotation.y;
            };
        }
    });

    scene.onPointerUp = () => {
        scene.onPointerMove = null;
    };

    // Light setup
    /*var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;*/

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.5;

    const light2 = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, -1, 0), scene);
    light2.intensity = 0.5;

    createRoom();

    BABYLON.SceneLoader.ImportMesh(
        "", // Empty if loading all meshes in the file
        "https://raw.githubusercontent.com/xMichal123/mall-games/main/resources/", // GitHub path
        "arcade-machine.glb", // File name
        scene,
        function (meshes, particleSystems, skeletons, animationGroups) {
            BABYLON.SceneLoader.ImportMesh(
                "", // Empty if loading all meshes in the file
                "https://raw.githubusercontent.com/xMichal123/mall-games/main/resources/", // GitHub path
                "start-button.glb", // File name
                scene,
                function (bmeshes, bparticleSystems, bskeletons, banimationGroups) {
            const originalMesh = meshes[0]; // Assume the first mesh is the main one
            const originalButton = bmeshes[0];

            const butScale = -0.04;
            originalButton.scaling = new BABYLON.Vector3(butScale, butScale, butScale);

            // Create an array of positions for a circle
            const radius = 9;
            const butRadius = 8.46;
            const numberOfInstances = games.length;
            const diffAngle = Math.PI / 10;
            const center = new BABYLON.Vector3(0, 0, 0);

            // Assign a material
            const buttonMaterial = new BABYLON.StandardMaterial("buttonMaterial", scene);
            buttonMaterial.diffuseColor = BABYLON.Color3.Red();

            for (let i = 0; i < numberOfInstances; i++) {
                const iter = games[i];
                const angle = diffAngle * i;
                const x = radius * Math.cos(angle);
                const z = radius * Math.sin(angle);
                const bx = butRadius * Math.cos(angle);
                const bz = butRadius * Math.sin(angle);

                let instance = null;
                let button = null;

                if (i === 0) {
                    instance = originalMesh;
                    button = originalButton;
                } else {
                    instance = originalMesh.clone("instance" + i);
                    button = originalButton.clone("button" + i);
                }

                button.position = new BABYLON.Vector3(bx, 1.14, bz);
                button.lookAt(center);
                button.rotationQuaternion = button.rotationQuaternion.multiply(BABYLON.Quaternion.FromEulerAngles(-Math.PI / 2, 0, 0));

                button.actionManager = new BABYLON.ActionManager(scene);

                // **Click Action**
                button.actionManager.registerAction(
                    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                        startGame(iter);
                    }
                ));

                button.getChildMeshes().forEach((child) => {
                    child.isPickable = true;
                    child.actionManager = new BABYLON.ActionManager(scene);
                    child.actionManager.registerAction(
                        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                            startGame(iter);
                        })
                    );
                });

                instance.position = new BABYLON.Vector3(x, 0, z);
                instance.lookAt(center);

                // Create and set a rotation quaternion with an additional rotation of PI / 2
                instance.rotationQuaternion = instance.rotationQuaternion.multiply(BABYLON.Quaternion.FromEulerAngles(0, -Math.PI / 2, 0));

                // Create a video texture
                var videoTexture = new BABYLON.VideoTexture("video", "https://raw.githubusercontent.com/xMichal123/mall-games/main/" + iter + "/video.webm", currentActiveScene, true, false);
                videoTexture.uScale = 2.95;
                videoTexture.vScale = 3.2;

                videoTexture.video.loop = true; // Set the video to loop

                instance.getChildMeshes().forEach(mesh => {
                    if (mesh.material) {
                        if (mesh.name.endsWith('Display')) {
                            mesh.material = mesh.material.clone();
                            replaceTexture(mesh.material, videoTexture);
                        } else if (mesh.name.endsWith('Body')) {
                            mesh.material = mesh.material.clone();
                            let texture = new BABYLON.Texture("https://raw.githubusercontent.com/xMichal123/mall-games/main/" + iter + "/machine-body.jpg", scene);
                            replaceTexture(mesh.material, texture);
                        }
                    }
                });
            }
        }, null, function (scene, message) {
            console.error(message); // Log any loading errors
        });
    }, null, function (scene, message) {
        console.error(message); // Log any loading errors
    });
}

function cloneMeshWithChildren(originalMesh, newName, scene) {
    // Clone the parent mesh (without children)
    let clonedMesh = originalMesh.clone(newName);
    
    if (!clonedMesh) {
        console.error("Cloning failed for mesh:", originalMesh.name);
        return null;
    }

    // Remove automatically attached original children
    clonedMesh.getChildren().forEach(child => {
        child.setParent(null);  // Detach from the cloned mesh
    });

    // Recursively clone child meshes
    originalMesh.getChildMeshes().forEach((child) => {
        let clonedChild = child.clone(`${newName}_${child.name}`);
        if (clonedChild) {
            clonedChild.parent = clonedMesh; // Attach to cloned parent
        }
    });

    return clonedMesh;
}

// Function to replace texture with video texture
function replaceTexture(material, texture) {
    if (material instanceof BABYLON.PBRMaterial) {
        material.albedoTexture = texture;
    } else if (material instanceof BABYLON.StandardMaterial) {
        material.diffuseTexture = texture;
    }
}

function createRoom() {
        var faceColors = new Array(6);

    faceColors[4] = new BABYLON.Color4(1,0,0,0.25);   // red top
    faceColors[1] = new BABYLON.Color4(0,1,0,0.25);   // green front

    const maxRowWidth = 26;
    const boxHeight = 5;
    const heightOffset = -1;
    const boxSize = maxRowWidth + 0.03;

    var options = {
        width: boxSize,
        height: boxHeight,
        depth: boxSize,
        //faceColors: faceColors
    };

    var box = BABYLON.MeshBuilder.CreateBox('box', options, scene);
    //var box=Mesh.CreateBox("box",5,scene);
    box.showBoundingBox=false;
    //box.position = //GameConstants.SHOP_POSITION;
    box.position.y = heightOffset + boxHeight / 2;//(upProducts[0].height * scale + downProducts[0].height * scale) / 2;

    //Create the mirror material
		var mirrorMaterial = new BABYLON.StandardMaterial("mirror", scene);
		const mirrorTexture = new BABYLON.MirrorTexture("mirror", 1024, scene, true);
    mirrorMaterial.reflectionTexture = mirrorTexture;
    //mirrorMaterial.diffuseTexture = mirrorTexture;
		//mirrorTexture.mirrorPlane = reflector;
		mirrorMaterial.reflectionTexture.level = 0.5;
    mirrorMaterial.alpha = 0.1;


    const doorWidth = 6;
    const doorHeight = 4;

    const lx = box.position.x - boxSize / 2;
    const dlx = box.position.x - doorWidth / 2;
    const rx = box.position.x + boxSize / 2;
    const drx = box.position.x + doorWidth / 2;
    const ty = box.position.y + boxHeight / 2;
    const by = box.position.y - boxHeight / 2;
    const dty = by + doorHeight;
    const wz = box.position.z - boxSize / 2;
    const mx = box.position.x;
    const my = box.position.y;


    //const exitButtonBuilder = new ExitButtonBuilder();
    buildExitButton(new BABYLON.Vector3(mx, (ty + dty) / 2, wz + 0.01));

    const leftGlass = BABYLON.MeshBuilder.CreatePlane("leftGlass", { width: boxSize / 2 - doorWidth / 2, height: boxHeight, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
    leftGlass.position = new BABYLON.Vector3((lx + dlx) / 2, my, wz);
    decorateGlass(leftGlass);

    const rightGlass = BABYLON.MeshBuilder.CreatePlane("rightGlass", { width: boxSize / 2 - doorWidth / 2, height: boxHeight, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
    rightGlass.position = new BABYLON.Vector3((rx + drx) / 2, my, wz);
    decorateGlass(rightGlass);

    const topGlass = BABYLON.MeshBuilder.CreatePlane("topGlass", { width: doorWidth, height: boxHeight - doorHeight, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
    topGlass.position = new BABYLON.Vector3(mx, (ty + dty) / 2, wz);
    decorateGlass(topGlass);

    const leftDoorGlass = BABYLON.MeshBuilder.CreatePlane("leftDoorGlass", { width: doorWidth / 2, height: doorHeight, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
    leftDoorGlass.position = new BABYLON.Vector3((mx + dlx) / 2, (dty + by) / 2, wz);
    decorateGlass(leftDoorGlass);

    const rightDoorGlass = BABYLON.MeshBuilder.CreatePlane("rightDoorGlass", { width: doorWidth / 2, height: doorHeight, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, scene);
    rightDoorGlass.position = new BABYLON.Vector3((mx + drx) / 2, (dty + by) / 2, wz);
    decorateGlass(rightDoorGlass);
	
    //Define a material
    var f = mirrorMaterial;
    f.backFaceCulling = false;
    f.twoSidedLighting = true;
    
    const wallTexture = new BABYLON.Texture("https://raw.githubusercontent.com/xMichal123/mall-games/main/resources/wall.jpg",scene);
    //const floorTexture = new BABYLON.Texture("resources/wooden_floor.jpg",scene);
    //floorTexture.uScale = floorTexture.vScale = 10;
    
    var ba=new BABYLON.StandardMaterial("material1",scene);
    ba.diffuseTexture = wallTexture;
    ba.backFaceCulling = false;
    ba.twoSidedLighting = true;
    
    var l=new BABYLON.StandardMaterial("material2",scene);
    l.diffuseTexture = wallTexture;
    l.backFaceCulling = false;
    l.twoSidedLighting = true;
    
    var r=new BABYLON.StandardMaterial("material3",scene);
    r.diffuseTexture = wallTexture;
    r.backFaceCulling = false;
    r.twoSidedLighting = true;
    
    var t=new BABYLON.StandardMaterial("material4",scene);
    t.diffuseTexture = wallTexture;
    t.backFaceCulling = false;
    t.twoSidedLighting = true;
    t.specularPower = 500;
    t.specularColor = new BABYLON.Color3(1, 1, 1);
        
    var bo=new BABYLON.StandardMaterial("material5",scene);
    bo.diffuseTexture = wallTexture;
    bo.backFaceCulling = false;
    bo.twoSidedLighting = true;
    
    //put into one
    var multi=new BABYLON.MultiMaterial("nuggetman",scene);
    multi.subMaterials.push(ba);
    multi.subMaterials.push(f);
    multi.subMaterials.push(l);
    multi.subMaterials.push(r);
    multi.subMaterials.push(t);
    multi.subMaterials.push(bo);
    
    //apply material
    box.subMeshes=[];
    var verticesCount=box.getTotalVertices();
    box.subMeshes.push(new BABYLON.SubMesh(0, 0, verticesCount, 0, 6, box));
    box.subMeshes.push(new BABYLON.SubMesh(1, 1, verticesCount, 6, 6, box));
    box.subMeshes.push(new BABYLON.SubMesh(2, 2, verticesCount, 12, 6, box));
    box.subMeshes.push(new BABYLON.SubMesh(3, 3, verticesCount, 18, 6, box));
    box.subMeshes.push(new BABYLON.SubMesh(4, 4, verticesCount, 24, 6, box));
    box.subMeshes.push(new BABYLON.SubMesh(5, 5, verticesCount, 30, 6, box));
    box.material=multi;

    const lightOffset = 3;

    const pointLight2 = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(mx - lightOffset, ty - 0.1, box.position.z + lightOffset), scene);
    pointLight2.intensity = 0.2;

    const pointLight4 = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(mx + lightOffset, ty - 0.1, box.position.z + lightOffset), scene);
    pointLight4.intensity = 0.2;
}

function decorateGlass(glass) {
    glass.enableEdgesRendering();
    glass.edgesWidth = 5;
    glass.edgesColor = new BABYLON.Color4(0, 0, 0, 1);
	
    //Ensure working with new values for glass by computing and obtaining its worldMatrix
    glass.computeWorldMatrix(true);
    var glass_worldMatrix = glass.getWorldMatrix();

    //Obtain normals for plane and assign one of them as the normal
    var glass_vertexData = glass.getVerticesData("normal");
    var glassNormal = new BABYLON.Vector3(glass_vertexData[0], glass_vertexData[1], glass_vertexData[2]);	
    //Use worldMatrix to transform normal into its current value
    glassNormal = BABYLON.Vector3.TransformNormal(glassNormal, glass_worldMatrix)

    //Create reflecting surface for mirror surface
    var reflector = BABYLON.Plane.FromPositionAndNormal(glass.position, glassNormal.scale(-1));

    //Create the mirror material
    var mirrorMaterial = new BABYLON.StandardMaterial("mirror", scene);
    mirrorMaterial.reflectionTexture = new BABYLON.MirrorTexture("mirror", 1024, scene, true);
    (mirrorMaterial.reflectionTexture).mirrorPlane = reflector;

    // exclude the glass from the render list
    let renderList = [...scene.meshes];
    renderList.splice(renderList.indexOf(glass), 1);
    (mirrorMaterial.reflectionTexture).renderList = renderList;

    mirrorMaterial.reflectionTexture.level = 0.05;
    mirrorMaterial.alpha = 0.8;
    mirrorMaterial.specularPower = 0;
    mirrorMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
	
    glass.material = mirrorMaterial;
}

function buildExitButton(position) {
    const highlightLayer = new BABYLON.HighlightLayer("hl1");
    const box = BABYLON.MeshBuilder.CreateBox("exitButton", { width: 1.5, height: 0.6, depth: 0.02 }, scene);
    box.rotation.y = Math.PI;
    box.material = new BABYLON.StandardMaterial("exitButtonMaterial", scene);
    (box.material).emissiveTexture = new BABYLON.Texture("https://raw.githubusercontent.com/xMichal123/mall-games/main/resources/exit_button.jpg", scene);
    (box.material).diffuseTexture = new BABYLON.Texture("https://raw.githubusercontent.com/xMichal123/mall-games/main/resources/exit_button.jpg", scene);
    //(box.material as StandardMaterial).emissiveTexture.level = 1;
    (box.material).specularPower = 0;
    (box.material).specularColor = new BABYLON.Color3(0, 0, 0);
    box.position = position;

    let isHovered = false;
    box.actionManager = new BABYLON.ActionManager(scene);
    box.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOverTrigger,
            function () {
                if (!isHovered) {
                    // Set the diffuse texture to null to use the emissive texture
                    (box.material).diffuseTexture = null;
                    highlightLayer.addMesh(box, new BABYLON.Color3(0.7,1,0.4));
                    isHovered = true;
                }
            }
        )
    );
    
    box.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPointerOutTrigger,
            function () {
                if (isHovered) {
                    // Restore the original diffuse texture
                    (box.material).diffuseTexture = new BABYLON.Texture("https://raw.githubusercontent.com/xMichal123/mall-games/main/resources/exit_button.jpg", scene);
                    isHovered = false;
                    highlightLayer.removeAllMeshes();
                }
            }
        )
    );
    
    box.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            function () {
                if (window.useMoreGamesLink) {
                    window.location.href = 'https://www.joyinmall.com/game';
                } else {
                    window.location.href = 'https://www.joyinmall.com?exited';
                }
            }
        )
    );
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
    initFunction().then(() => { sceneToRender = scene });
}
