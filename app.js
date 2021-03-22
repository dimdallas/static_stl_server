import * as THREE from './three.module.js';
import Stats from './stats.module.js';
import { STLLoader } from './STLLoader.js';

let container, stats;
let camera, cameraTarget
let scene, renderer;
let rotationMesh;
let staticMesh;
const rotationSpeed = .01;
const zoomStep = .0005;
let rotationBorder = 0;
let step = 0;
let zoom = 2;
let rotation = .8;
let prevPoint = 0;
let fileList;

let loader;
let mesh_uuid;

init();
// animate();

function init() {

    container = document.querySelector('.scene');
    // let upload = document.getElementById("uploadInput")
    // document.getElementById("uploadInput").style.cssText = upload+container;
    // container = document.createElement('div');
    // document.body.appendChild( container );


    //Camera setup
    const fov = 35;
    // const aspect = container.clientWidth /container.clientHeight;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 100;
    camera = new THREE.PerspectiveCamera( fov, aspect, near, far);
    camera.position.set( 3, 0.15, 3 );

    //vale target = module
    cameraTarget = new THREE.Vector3( 0, - 0.25, 0 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x72645b );
    scene.fog = new THREE.Fog( scene.background, 2, 15 );

    // Ground
    const plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry( 40, 40 ),
        new THREE.MeshPhongMaterial( { color: 0x999999, specular: 0x101010 } )
    );
    plane.rotation.x = - Math.PI / 2;
    plane.position.y = - 0.5;
    plane.receiveShadow = true;
    scene.add( plane );


    // stats
    // stats = new Stats();
    // container.appendChild( stats.dom );
    
    //For Debugging
    const axesHelper = new THREE.AxesHelper();
    scene.add( axesHelper );
    let gridHelper = new THREE.GridHelper(5,20);
    gridHelper.scale.set(0.2,0.2,0.2)
    //rotates in radians
    gridHelper.rotateX(Math.PI/2);
    scene.add(gridHelper);


    //CHOOSE FILE FROM FILE BROWSER
    const inputElement = document.getElementById("uploadInput");
    inputElement.addEventListener("change", handleFiles, false);
    

    // ASCII file
    loader = new STLLoader();

    loader.load( './house/tibia.stl', load_static);

    loader.load( './house/femur.stl', load_moving);


    // Lights
    scene.add( new THREE.HemisphereLight( 0x443333, 0x111122 ) );
    addShadowedLight( 1, 1, 1, 0xffffff, 1.35 );
    addShadowedLight( 0.5, 1, - 1, 0xffaa00, 1 );
    
    // renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    // renderer.setSize( container.clientWidth, container.clientHeight );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.outputEncoding = THREE.sRGBEncoding;

    renderer.shadowMap.enabled = true;

    container.append( renderer.domElement);

    window.addEventListener( 'resize', onWindowResize, true );
}

function load_moving(geometry) {

    //alert(geometry.attributes.position.count);
    const colors = [];

    for ( let i = 0, n = geometry.attributes.position.count; i < n; ++ i ) {

        colors.push( 1, 1, 1 );

    }

    geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
    const colors2 = geometry.attributes.color;
    var r,g,b;
    const strength = 10;
    const step = (strength / geometry.attributes.color.count);

    r = 1;
    g = 0;
    b = 0;

    for ( let i = 0, n = geometry.attributes.color.count; i < n; ++ i ) {

        if(r == 1)
        {
            r = 0;
            g = 1;
        }
        else if(g == 1)
        {
            g = 0;
            b = 1;
        }
        else if(b == 1)
        {
            b = 0;
            r = 1;
        }

        colors2.setXYZ( i, r,  g, b);

    }
    colors2.needsUpdate = true;

    //const material = new THREE.MeshPhongMaterial( { color: 0xfffffff	, specular: 0x111111, shininess: 100 } );	//0xfffffff				
    //const mesh = new THREE.Mesh( geometry, material );

    const material = new THREE.MeshLambertMaterial( {
        side: THREE.DoubleSide,
        color: 0xF5F5F5,
        vertexColors: true
    } );
    const mesh = new THREE.Mesh( geometry,  material);

    mesh.position.set( 0, 0, 0 );
    mesh.rotation.set(  -.5 * Math.PI, 0, 0 );
    mesh.scale.set( 0.005, 0.005, 0.005 );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // geometry.add(model_axes)
    rotationMesh = new THREE.Mesh( geometry, material );
    rotationMesh = mesh;

    mesh.name = "model"
    mesh_uuid = mesh.uuid;

    const model_axes = new THREE.AxesHelper();
    model_axes.scale.set(100,100,100)
    mesh.add( model_axes );
    
    scene.add( mesh );

    animate();
}

function load_static(geometry) {

    const material = new THREE.MeshPhongMaterial( { color: 0xfffffff, specular: 0x111111, shininess: 100 } );
    const mesh = new THREE.Mesh( geometry, material );

    mesh.position.set( 0, 0, 0 );
    mesh.rotation.set( - Math.PI / 2, 0 , 0 );
    mesh.scale.set( 0.005, 0.005, 0.005 );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    staticMesh = new THREE.Mesh( geometry, material );
    staticMesh = mesh;

    scene.add( mesh );

}

function handleFiles() {
    fileList = this.files;
    // console.log("hey")
    let filename= fileList[0].name
    // console.log(filename)
    // console.log(scene.getObjectByName("model"))

    scene.remove(scene.getObjectByName("model"))
    loader.load( "./house/"+filename, load_moving);
    
    // console.log(scene)
}

function addShadowedLight( x, y, z, color, intensity ) {

    const directionalLight = new THREE.DirectionalLight( color, intensity );
    directionalLight.position.set( x, y, z );
    scene.add( directionalLight );

    directionalLight.castShadow = true;

    const d = 1;
    directionalLight.shadow.camera.left = - d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = - d;

    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 4;

    directionalLight.shadow.bias = - 0.002;

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    render();
    // stats.update();

}

function render() {

    // const timer = Date.now() * 0.0002;

    $(window).on("wheel", function(e) {
        if (e.originalEvent.deltaY > 0)
        {
            if(zoom<5)
                zoom += zoomStep;
        }
        else
        {
            if(zoom>1)
                zoom -= zoomStep;
        }
    });

    $(window).on("mousedown",function() {
        $(window).mousemove(function( event ) {
            var offset = event.pageX - prevPoint;
            if(offset > 0)
            {
                rotation += rotationSpeed;
            }
            else if(offset < 0)
            {
                rotation -= rotationSpeed;
            }
            prevPoint = event.pageX;
        });
    });

    $(window).on("mouseup",function() {
        $(window).off("mousedown");
        $(window).off("mousemove");
    });


    if(rotationBorder <= 0)
    {
        step = .01;
    }
    else if(rotationBorder > 5)
    {
        step = -.01;
    }
    rotationBorder = rotationBorder + step;
    camera.position.x = Math.cos( Math.PI * rotation) * zoom;
    camera.position.z = Math.sin( Math.PI * rotation) * zoom;
    
    rotationMesh.rotation.set( -0.1  * Math.PI * rotationBorder, 0,0 );

    camera.lookAt( cameraTarget );

    renderer.render( scene, camera );
}