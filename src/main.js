const THREE = require('three');
import {OrbitControls} from './OrbitControls.js';

const sizeScale = 1/600;
const timeScale = 6000;
const EPSILON   = 10;
const scene    = new THREE.Scene();
const camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.001, 10000);
const renderer = new THREE.WebGLRenderer()
const controls = new OrbitControls(camera, renderer.domElement);
const clock    = new THREE.Clock()
var earthmesh  = null;
let last_t = 0, elapsed_t = 0, elapsed_days = 0;

function init() {

    document.body.appendChild(renderer.domElement);
    renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight);
    camera.position.set(0,0,40)
    window.addEventListener('resize', onWindowResize, false)

    scene.background = new THREE.Color( 0x000 );
    scene.add( new THREE.AxesHelper(50) );
    scene.add( new THREE.AmbientLight( 0xffffff ) )

    setBG();
    initEarth();

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

function render() {
    if(earthmesh) earthmesh.rotation.y += EARTH_ROT_RATE * timeScale * clock.getDelta();
    elapsed_t = clock.getElapsedTime()*timeScale % DAY;
    if( elapsed_t < last_t) document.getElementById("dayNo").textContent = ++elapsed_days;
    last_t = elapsed_t;
	renderer.render( scene, camera );
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function setBG(){
    const loader = new THREE.TextureLoader();
    loader.load( '../textures/stars.jpg', (texture) => 
        {
          const rt = new THREE.WebGLCubeRenderTarget(texture.image.width);
          rt.fromEquirectangularTexture(renderer, texture);
          scene.background = rt.texture;
        });
}

function initEarth(){
    var geometry = generateEllipsoid(DIA_EQU*sizeScale,DIA_POL*sizeScale)
    var material = new THREE.MeshPhongMaterial({bumpScale: 0.05, specular:  new THREE.Color('grey') });

    const loader = new THREE.TextureLoader();
    loader.load( '../textures/earth.jpg', ( texture ) => {
        material.map = texture
        loader.load( '../textures/earthDisp.jpg', ( texture ) => {
            material.displacementMap = texture
            loader.load( '../textures/earthSpecular.jpg', async function ( texture ) { 
                material.specularMap = texture;    
                earthmesh = new THREE.Mesh(geometry, material);
                var cloudmesh = await getCloudMesh(geometry.clone());
                earthmesh.add(cloudmesh)
                scene.add(earthmesh);
            }, undefined, ( err ) => console.error( 'An error happened.' ));
        }, undefined, ( err ) => console.error( 'An error happened.' ));

    }, undefined, ( err ) => console.error( 'An error happened.' ));


   
}

function generateEllipsoid(r1,r2){

    var shape = new THREE.EllipseCurve(
        0,  0,                       // ax, aY
        r1, r2,                      // xRadius, yRadius
        - Math.PI/2, Math.PI/2,      // aStartAngle, aEndAngle
        false,                       // aClockwise
        0                            // aRotation
    );
    
    return new THREE.LatheBufferGeometry(shape.getPoints(360), 360);
}

async function getCloudMesh(geometry){
    var canvasCloud = document.createElement('canvas');
    let img = await loadImage("../textures/earthcloudmap.jpg");
    canvasCloud.getContext('2d').drawImage(img, 0, 0)

    var material  = new THREE.MeshPhongMaterial({
      map         : new THREE.CanvasTexture(canvasCloud),
      side        : THREE.FrontSide,
      opacity     : 0.5,
      transparent : true,
      depthWrite  : false,
    });

    let mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(1.05)
    return mesh;
}

function loadImage(url) {
    return new Promise(r => { let i = new Image(); i.onload = (() => r(i)); i.src = url; });
}
  
init()
