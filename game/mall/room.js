// Constants – adjust these to change the shape and behavior
let RECT_WIDTH = 12;         // Overall width of the rounded rectangle
let RECT_HEIGHT = 12;        // Overall height of the rounded rectangle
const CORNER_RADIUS = 2;       // Radius of the rounded corners

const SENSITIVITY_HORIZONTAL = 0.01; // Adjusts how fast the camera moves along the path horizontally
const SENSITIVITY_VERTICAL = 0.01;  // Adjusts vertical movement sensitivity
const VERTICAL_LIMIT = 0.5;      // Limits for vertical movement (in world units)
const Y_POS = 0.8;               // Base vertical position of the camera

// Pre-compute half dimensions
const halfW = RECT_WIDTH / 2;
const halfH = RECT_HEIGHT / 2;

// Compute lengths for each segment of the rounded rectangle perimeter:
// Straight segments:
const L_bottom = RECT_WIDTH - 2 * CORNER_RADIUS;
const L_right  = RECT_HEIGHT - 2 * CORNER_RADIUS;
const L_top    = RECT_WIDTH - 2 * CORNER_RADIUS;
const L_left   = RECT_HEIGHT - 2 * CORNER_RADIUS;
// Rounded corners (each a quarter-circle)
const L_arc = (Math.PI / 2) * CORNER_RADIUS;
// Total perimeter
const TOTAL_PERIMETER = L_bottom + L_right + L_top + L_left + 4 * L_arc;

let onArc = false;

let introMode = true;

// Define variables for rotation tracking
let verticalAngle = 0;

// Variables to track movement along the path and vertical offset
let pathDistance = L_bottom + L_right + L_top / 2 + 2 * L_arc;

let camera = null;

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
                currentActiveScene = mallScene;
                iframe.contentWindow.gameScene.dispose();
                removeIframe(iframe);
                advancedTexture.rootContainer.isVisible = false;
                mallScene.attachControl(canvas, true);
            }
        }
    );

    advancedTexture.rootContainer.isVisible = true;

    window.gameScene = iframe.contentWindow.gameScene;
    iframe.contentWindow.init();
    currentActiveScene = iframe.contentWindow.gameScene;
    mallScene.detachControl();
}

// Given a distance 's' along the perimeter (which wraps around), this function returns the (x,z) position.
function getPointOnRoundedRect(s) {
    // Wrap s to the total perimeter length
    s = ((s % TOTAL_PERIMETER) + TOTAL_PERIMETER) % TOTAL_PERIMETER;
    
    // Segment A: Bottom straight (from left to right)
    if (s <= L_bottom) {
        let t = s / L_bottom;
        let x = (-halfW + CORNER_RADIUS) + t * (RECT_WIDTH - 2 * CORNER_RADIUS);
        let z = -halfH;
        onArc = false;
        return new BABYLON.Vector3(x, Y_POS, z);
    }
    s -= L_bottom;
    
    // Segment B: Bottom-right arc (from 270° to 360°)
    if (s <= L_arc) {
        let t = s / L_arc;
        let angle = (3 * Math.PI / 2) + t * (Math.PI / 2);
        let cx = halfW - CORNER_RADIUS;
        let cz = -halfH + CORNER_RADIUS;
        let x = cx + CORNER_RADIUS * Math.cos(angle);
        let z = cz + CORNER_RADIUS * Math.sin(angle);
        onArc = true;
        return new BABYLON.Vector3(x, Y_POS, z);
    }
    s -= L_arc;
    
    // Segment C: Right straight (from bottom to top)
    if (s <= L_right) {
        let t = s / L_right;
        let z = (-halfH + CORNER_RADIUS) + t * (RECT_HEIGHT - 2 * CORNER_RADIUS);
        let x = halfW;
        onArc = false;
        return new BABYLON.Vector3(x, Y_POS, z);
    }
    s -= L_right;
    
    // Segment D: Top-right arc (from 0° to 90°)
    if (s <= L_arc) {
        let t = s / L_arc;
        let angle = 0 + t * (Math.PI / 2);
        let cx = halfW - CORNER_RADIUS;
        let cz = halfH - CORNER_RADIUS;
        let x = cx + CORNER_RADIUS * Math.cos(angle);
        let z = cz + CORNER_RADIUS * Math.sin(angle);
        onArc = true;
        return new BABYLON.Vector3(x, Y_POS, z);
    }
    s -= L_arc;
    
    // Segment E: Top straight (from right to left)
    if (s <= L_top) {
        let t = s / L_top;
        let x = (halfW - CORNER_RADIUS) - t * (RECT_WIDTH - 2 * CORNER_RADIUS);
        let z = halfH;
        onArc = false;
        return new BABYLON.Vector3(x, Y_POS, z);
    }
    s -= L_top;
    
    // Segment F: Top-left arc (from 90° to 180°)
    if (s <= L_arc) {
        let t = s / L_arc;
        let angle = (Math.PI / 2) + t * (Math.PI / 2);
        let cx = -halfW + CORNER_RADIUS;
        let cz = halfH - CORNER_RADIUS;
        let x = cx + CORNER_RADIUS * Math.cos(angle);
        let z = cz + CORNER_RADIUS * Math.sin(angle);
        onArc = true;
        return new BABYLON.Vector3(x, Y_POS, z);
    }
    s -= L_arc;
    
    // Segment G: Left straight (from top to bottom)
    if (s <= L_left) {
        let t = s / L_left;
        let z = (halfH - CORNER_RADIUS) - t * (RECT_HEIGHT - 2 * CORNER_RADIUS);
        let x = -halfW;
        onArc = false;
        return new BABYLON.Vector3(x, Y_POS, z);
    }
    s -= L_left;
    
    // Segment H: Bottom-left arc (from 180° to 270°)
    {
        let t = s / L_arc;
        let angle = Math.PI + t * (Math.PI / 2);
        let cx = -halfW + CORNER_RADIUS;
        let cz = -halfH + CORNER_RADIUS;
        let x = cx + CORNER_RADIUS * Math.cos(angle);
        let z = cz + CORNER_RADIUS * Math.sin(angle);
        onArc = true;
        return new BABYLON.Vector3(x, Y_POS, z);
    }
}

window.createGameRoom = (games) => {
     // Create a camera that will simulate the player's view
    camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0,0,0), mallScene);

    // Detach default camera controls
    camera.detachControl(canvas);

    // Set up initial camera properties
    camera.fov = 0.8;
    camera.minZ = 0.1;

    camera.position.x = 0;
    camera.position.z = -10;
    camera.position.y = Y_POS + verticalAngle; // Adjust vertical position based on vertical angle

    // Always look towards the center of the circle
    camera.setTarget(new BABYLON.Vector3(0, Y_POS, 0));

    // Light setup
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), mallScene);
    light.intensity = 0.5;

    const light2 = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, -1, 0), mallScene);
    light2.intensity = 0.5;

    createRoom(mallScene);

    BABYLON.SceneLoader.ImportMesh(
        "", // Empty if loading all meshes in the file
        "https://raw.githubusercontent.com/xMichal123/mall-games/main/resources/", // GitHub path
        "arcade-machine.glb", // File name
        mallScene,
        function (meshes, particleSystems, skeletons, animationGroups) {
            BABYLON.SceneLoader.ImportMesh(
                "", // Empty if loading all meshes in the file
                "https://raw.githubusercontent.com/xMichal123/mall-games/main/resources/", // GitHub path
                "start-button.glb", // File name
                mallScene,
                function (bmeshes, bparticleSystems, bskeletons, banimationGroups) {
            const originalMesh = meshes[0]; // Assume the first mesh is the main one
            const originalButton = bmeshes[0];

            const butScale = -0.04;
            originalButton.scaling = new BABYLON.Vector3(butScale, butScale, butScale);

            // Create an array of positions for a circle
            const radius = 9;
            const butRadius = 8.46;
            const numberOfInstances = games.length;
            //const diffAngle = Math.PI / 10;
            const diff = 7;
            const diffStart = -diff / 2;
            const diffStep = diff / (numberOfInstances - 1);
            const machineY = -1;
            //const center = new BABYLON.Vector3(0, 0, 0);

            // Assign a material
            const buttonMaterial = new BABYLON.StandardMaterial("buttonMaterial", mallScene);
            buttonMaterial.diffuseColor = BABYLON.Color3.Red();

            for (let i = 0; i < numberOfInstances; i++) {
                const iter = games[i];
                //const angle = diffAngle * i;
                const x = diffStart + i * diffStep//radius * Math.cos(angle);
                const z = radius;// * Math.sin(angle);
                const bx = x;//butRadius * Math.cos(angle);
                const bz = butRadius;// * Math.sin(angle);

                let instance = null;
                let button = null;

                if (i === 0) {
                    instance = originalMesh;
                    button = originalButton;
                } else {
                    instance = originalMesh.clone("instance" + i);
                    button = originalButton.clone("button" + i);
                }

                button.position = new BABYLON.Vector3(bx, machineY + 1.14, bz);
                //button.lookAt(center);
                button.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(-Math.PI / 2, 0, Math.PI);//button.rotationQuaternion.multiply(BABYLON.Quaternion.FromEulerAngles(-Math.PI / 2, 0, 0));

                button.actionManager = new BABYLON.ActionManager(mallScene);

                // **Click Action**
                button.actionManager.registerAction(
                    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                        startGame(iter);
                    }
                ));

                button.getChildMeshes().forEach((child) => {
                    child.isPickable = true;
                    child.actionManager = new BABYLON.ActionManager(mallScene);
                    child.actionManager.registerAction(
                        new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
                            startGame(iter);
                        })
                    );
                });

                instance.position = new BABYLON.Vector3(x, machineY, z);
                //instance.lookAt(center);

                // Create and set a rotation quaternion with an additional rotation of PI / 2
                instance.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(0, Math.PI / 2, 0);//instance.rotationQuaternion.multiply(BABYLON.Quaternion.FromEulerAngles(0, -Math.PI / 2, 0));

                // Create a video texture
                var videoTexture = new BABYLON.VideoTexture("video", "https://raw.githubusercontent.com/xMichal123/mall-games/main/" + iter + "/video.webm", currentActiveScene, true, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, { muted: true });
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
                            let texture = new BABYLON.Texture("https://raw.githubusercontent.com/xMichal123/mall-games/main/" + iter + "/machine-body.jpg", mallScene);
                            replaceTexture(mesh.material, texture);
                        }
                    }
                });
            }

            mallScene.onPointerDown = () => {
                if (introMode) {
                    introMode = false;

                    let animation = new BABYLON.Animation(
                        "cameraMove",
                        "position.z",
                        30, // FPS (higher is smoother)
                        BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
                    );
                    
                    // Define the animation keys
                    let startZ = camera.position.z;
                    let endZ = halfH;
                    let keys = [
                        { frame: 0, value: startZ },
                        { frame: 30, value: endZ } // Moves in 30 frames (~1 sec at 30 FPS)
                    ];
                    animation.setKeys(keys);

                    const easing = new BABYLON.QuadraticEase();
                    easing.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
                
                    animation.setEasingFunction(easing);
                                    
                    // Apply the animation to the camera
                    camera.animations = [animation];
                    
                    // Function to call when animation is done
                    let onAnimationEnd = function () {
                        registerEvents();
                    };
                    
                    // Start the animation and call the event when done
                    mallScene.beginDirectAnimation(camera, [animation], 0, 30, false, 1, onAnimationEnd);
                }
            }
        }, null, function (scene, message) {
            console.error(message); // Log any loading errors
        });
    }, null, function (scene, message) {
        console.error(message); // Log any loading errors
    });
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

    const maxRowWidth = roomEdgeLength;
    const boxHeight = 3.5;
    const heightOffset = -1;
    const boxSize = maxRowWidth + 0.03;

    var options = {
        width: boxSize,
        height: boxHeight,
        depth: boxSize,
        //faceColors: faceColors
    };

    var box = BABYLON.MeshBuilder.CreateBox('box', options, mallScene);
    //var box=Mesh.CreateBox("box",5,scene);
    box.showBoundingBox=false;
    //box.position = //GameConstants.SHOP_POSITION;
    box.position.y = heightOffset + boxHeight / 2;//(upProducts[0].height * scale + downProducts[0].height * scale) / 2;

    //Create the mirror material
		var mirrorMaterial = new BABYLON.StandardMaterial("mirror", mallScene);
		const mirrorTexture = new BABYLON.MirrorTexture("mirror", 1024, mallScene, true);
    mirrorMaterial.reflectionTexture = mirrorTexture;
    //mirrorMaterial.diffuseTexture = mirrorTexture;
		//mirrorTexture.mirrorPlane = reflector;
		mirrorMaterial.reflectionTexture.level = 0.5;
    mirrorMaterial.alpha = 0.1;


    const doorWidth = 4;
    const doorHeight = 2.8;

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
    buildExitButton(new BABYLON.Vector3(mx, (ty + dty) / 2, wz + 0.01), mallScene);

    const leftGlass = BABYLON.MeshBuilder.CreatePlane("leftGlass", { width: boxSize / 2 - doorWidth / 2, height: boxHeight, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, mallScene);
    leftGlass.position = new BABYLON.Vector3((lx + dlx) / 2, my, wz);
    decorateGlass(leftGlass, mallScene);

    const rightGlass = BABYLON.MeshBuilder.CreatePlane("rightGlass", { width: boxSize / 2 - doorWidth / 2, height: boxHeight, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, mallScene);
    rightGlass.position = new BABYLON.Vector3((rx + drx) / 2, my, wz);
    decorateGlass(rightGlass, mallScene);

    const topGlass = BABYLON.MeshBuilder.CreatePlane("topGlass", { width: doorWidth, height: boxHeight - doorHeight, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, mallScene);
    topGlass.position = new BABYLON.Vector3(mx, (ty + dty) / 2, wz);
    decorateGlass(topGlass, mallScene);

    const leftDoorGlass = BABYLON.MeshBuilder.CreatePlane("leftDoorGlass", { width: doorWidth / 2, height: doorHeight, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, mallScene);
    leftDoorGlass.position = new BABYLON.Vector3((mx + dlx) / 2, (dty + by) / 2, wz);
    decorateGlass(leftDoorGlass, mallScene);

    const rightDoorGlass = BABYLON.MeshBuilder.CreatePlane("rightDoorGlass", { width: doorWidth / 2, height: doorHeight, sideOrientation: BABYLON.Mesh.DOUBLESIDE }, mallScene);
    rightDoorGlass.position = new BABYLON.Vector3((mx + drx) / 2, (dty + by) / 2, wz);
    decorateGlass(rightDoorGlass, mallScene);
	
    //Define a material
    var f = mirrorMaterial;
    f.backFaceCulling = false;
    f.twoSidedLighting = true;
    
    const wallTexture = new BABYLON.Texture("https://raw.githubusercontent.com/xMichal123/mall-games/main/resources/wall.jpg", mallScene);
    //const floorTexture = new BABYLON.Texture("resources/wooden_floor.jpg",scene);
    //floorTexture.uScale = floorTexture.vScale = 10;
    
    var ba=new BABYLON.StandardMaterial("material1", mallScene);
    ba.diffuseTexture = wallTexture;
    ba.backFaceCulling = false;
    ba.twoSidedLighting = true;
    
    var l=new BABYLON.StandardMaterial("material2", mallScene);
    l.diffuseTexture = wallTexture;
    l.backFaceCulling = false;
    l.twoSidedLighting = true;
    
    var r=new BABYLON.StandardMaterial("material3", mallScene);
    r.diffuseTexture = wallTexture;
    r.backFaceCulling = false;
    r.twoSidedLighting = true;
    
    var t=new BABYLON.StandardMaterial("material4", mallScene);
    t.diffuseTexture = wallTexture;
    t.backFaceCulling = false;
    t.twoSidedLighting = true;
    t.specularPower = 500;
    t.specularColor = new BABYLON.Color3(1, 1, 1);
        
    var bo=new BABYLON.StandardMaterial("material5", mallScene);
    bo.diffuseTexture = wallTexture;
    bo.backFaceCulling = false;
    bo.twoSidedLighting = true;
    
    //put into one
    var multi=new BABYLON.MultiMaterial("nuggetman", mallScene);
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

    const pointLight2 = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(mx - lightOffset, ty - 0.1, box.position.z + lightOffset), mallScene);
    pointLight2.intensity = 0.2;

    const pointLight4 = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(mx + lightOffset, ty - 0.1, box.position.z + lightOffset), mallScene);
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
    var mirrorMaterial = new BABYLON.StandardMaterial("mirror", mallScene);
    mirrorMaterial.reflectionTexture = new BABYLON.MirrorTexture("mirror", 1024, mallScene, true);
    (mirrorMaterial.reflectionTexture).mirrorPlane = reflector;

    // exclude the glass from the render list
    let renderList = [...mallScene.meshes];
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
    const box = BABYLON.MeshBuilder.CreateBox("exitButton", { width: 1.5, height: 0.6, depth: 0.02 }, mallScene);
    box.rotation.y = Math.PI;
    box.material = new BABYLON.StandardMaterial("exitButtonMaterial", mallScene);
    (box.material).emissiveTexture = new BABYLON.Texture("https://raw.githubusercontent.com/xMichal123/mall-games/main/resources/exit_button.jpg", mallScene);
    (box.material).diffuseTexture = new BABYLON.Texture("https://raw.githubusercontent.com/xMichal123/mall-games/main/resources/exit_button.jpg", mallScene);
    //(box.material as StandardMaterial).emissiveTexture.level = 1;
    (box.material).specularPower = 0;
    (box.material).specularColor = new BABYLON.Color3(0, 0, 0);
    box.position = position;

    let isHovered = false;
    box.actionManager = new BABYLON.ActionManager(mallScene);
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
                    (box.material).diffuseTexture = new BABYLON.Texture("https://raw.githubusercontent.com/xMichal123/mall-games/main/resources/exit_button.jpg", mallScene);
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

function registerEvents() {
    // Event listener for pointer interaction
    mallScene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            mallScene.onPointerMove = (evt) => {
                // Update horizontal path distance based on pointer movement
                pathDistance += evt.movementX * SENSITIVITY_HORIZONTAL;
                // Update vertical offset within limits
                verticalAngle = Math.max(-VERTICAL_LIMIT, Math.min(VERTICAL_LIMIT, verticalAngle + evt.movementY * SENSITIVITY_VERTICAL));
                
                // Get new position on the rounded rectangle
                let newPos = getPointOnRoundedRect(pathDistance);
                camera.position.x = newPos.x;
                camera.position.z = newPos.z;
                camera.position.y = Y_POS + verticalAngle;
                
                if (onArc) {
                    // Keep the camera focused at the center (adjust if needed)
                    camera.setTarget(new BABYLON.Vector3(Math.sign(camera.position.x) * (halfW - CORNER_RADIUS), Y_POS, Math.sign(camera.position.z) * (halfH - CORNER_RADIUS)));
                    camera.rotation.y = Math.PI + camera.rotation.y;
                } else {
                    const epsilon = 0.01;

                    if (Math.abs(camera.position.x - halfW) < epsilon) {
                        camera.rotation.y = Math.PI / 2;
                    } else if (Math.abs(camera.position.x + halfW) < epsilon) {
                        camera.rotation.y = -Math.PI / 2;
                    } else if (Math.abs(camera.position.z - halfH) < epsilon) {
                        camera.rotation.y = 0 * Math.PI
                    } else if (Math.abs(camera.position.z + halfH) < epsilon) {
                        camera.rotation.y = Math.PI;
                    }
                }

                camera.rotation.x = 0.1 * verticalAngle * Math.PI;
            };
        }
    });

    mallScene.onPointerUp = () => {
        mallScene.onPointerMove = null;
    };    
}