/*
amikodev/factory-reactjs - Industrial equipment management with ReactJS
Copyright © 2021 Prihodko Dmitriy - asketcnc@yandex.ru
*/

/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/


import {
    MeshDepthMaterial, MeshStandardMaterial, 
    DoubleSide,
    RGBADepthPacking, BasicDepthPacking,
    
    WebGLRenderer, WebGLRenderTarget,

    Scene,
    Color,
    Mesh, 
    Group, 
    OrthographicCamera, HemisphereLight, DirectionalLight,
    Raycaster, 
    Vector2, Vector3, 

    BufferGeometry, BufferAttribute, 

} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';


global.document = {};

function ScanDepthWorker(){

    let screenWidth = 500;
    let screenHeight = 500;

    let camera = null;
    let target = null;
    let renderer = null;
    let scene = null;

    let raycaster = null;
    let pointer = null;
    let controls = null;


    const _this = this;


    const materialDepthRGBA = new MeshDepthMaterial( {
        // depthPacking: RGBADepthPacking,
        depthPacking: BasicDepthPacking,

        // side: DoubleSide
    } );

    const material1 = new MeshStandardMaterial({color: 0x7e31eb, side: DoubleSide});


    let cs = 200;
    let ratio = screenWidth / screenHeight;

    const init = (canvas, width, height) => {

        screenWidth = width;
        screenHeight = height;
        ratio = screenWidth / screenHeight;

        // console.log('init ScanDepthWorker');
    
        if(!canvas.style) canvas.style = { width: screenWidth, height: screenHeight };
    
        renderer = new WebGLRenderer({
            canvas
            // preserveDrawingBuffer: true,
        });
        renderer.setSize(screenWidth, screenHeight);
    
        target = new WebGLRenderTarget(screenWidth, screenHeight);

        scene = new Scene();

        scene.background = new Color(0x000000);
        scene.rotateY(-Math.PI/2);
        scene.rotateX(-Math.PI/2);


        cs = 200;
        ratio = screenWidth/screenHeight;

        camera = new OrthographicCamera(-cs*ratio, cs*ratio, cs, -cs, 0, 100);
        camera.position.set(-0.0001, 100, 0);


        const light = new HemisphereLight(0xffffbb, 0x080820, 1);
        scene.add(light);

        const light2 = new DirectionalLight(0xffffff, 0.4, 100);
        light2.position.set(20, 60, 120); //default; light shining from top
        scene.add(light2);
        
        raycaster = new Raycaster();
        pointer = new Vector2();

        controls = new OrbitControls(camera, renderer.domElement);

        // // запуск Chrome для загрузки файлов с локальной директории
        // // macos:   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security --user-data-dir=/Users/dmitriy/Projects/ReactJS/factory-management/
        // // windows: Chrome.exe --disable-web-security
        // loader.load('http://127.0.0.1:3003/models/rozetka_2.stl', geometry => {
        // 
        // }, null, error => {
        //     console.log(error);
        // });

    };

    const parseGeometry = (geometryOrig) => {

        const geometry = new BufferGeometry();

        for(let attributeName of Object.keys(geometryOrig.attributes)){
            const origAttribute = geometryOrig.attributes[attributeName];
            const attribute = new BufferAttribute(
                origAttribute.array,
                origAttribute.itemSize,
                false
            );
            geometry.setAttribute(attributeName, attribute);
        }
    
        geometry.groups = geometryOrig.groups;

        geometry.computeBoundingBox();

        let mesh = new Mesh(geometry, materialDepthRGBA);

        let bb = geometry.boundingBox;
        let bbc = {
            x: -(bb.max.x + bb.min.x)/2,
            y: -(bb.max.y + bb.min.y)/2,
            // z: -(bb.max.z + bb.min.z)/2 + (bb.max.z - bb.min.z)/2,
            z: -bb.min.z,
        };
        mesh.position.set(bbc.x, bbc.y, bbc.z);
        mesh.name = 'STL object';

        let gr = new Group();
        gr.add(mesh);

        let scale = 1;
        let boundSize = { width: (bb.max.x-bb.min.x)*scale, height: (bb.max.y-bb.min.y)*scale, depth: (bb.max.z-bb.min.z)*scale };
        gr.scale.set(scale, scale, scale);

        scene.add(gr);

        cs = Math.max(boundSize.width/2/ratio, boundSize.height/2);

        camera.left = -cs*ratio;
        camera.right = cs*ratio;
        camera.top = cs;
        camera.bottom = -cs;

        camera.far = boundSize.depth;
        camera.position.set(-0.0001, boundSize.depth, 0);
        camera.updateProjectionMatrix();

        renderer.render(scene, camera);


        let gl = renderer.getContext();

        let w = gl.drawingBufferWidth;
        let h = gl.drawingBufferHeight;
        
        var pixels = new Uint8Array(w * h * 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        let rMin = 255;
        let rMax = 0;
        let minPoint = {};
        let maxPoint = {};
        let pos = 0;
        for(let j=h-1; j>=0; j--){
            for(let i=0; i<w; i++){
                let r = pixels[pos+0];
                if(r != 0 && r < rMin){
                    rMin = r;
                    minPoint = {x: i, y: j};
                } 
                if(r > rMax){
                    rMax = r;
                    maxPoint = {x: i, y: j};
                } 
                pos += 4;
            }
        }

        let calcMin = boundSize.depth/255*(rMin-0);
        let calcMax = boundSize.depth/255*(rMax+0);

        calcMin -= 0.01;
        calcMax += 0.01;

        calcMin = 0;    // DEBUG !!! или вовсе не debug

        camera.far = calcMax - calcMin;
        camera.position.set(-0.0001, calcMax, 0);       // y, z, x
        camera.updateProjectionMatrix();

        renderer.render(scene, camera);

        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

        postMessage({pixels}, []);

        let depthMap = new Uint8Array(w * h);
        let pos0 = 0;
        let pos1 = 0;
        for(let j=h-1; j>=0; j--){
            for(let i=0; i<w; i++){
                let r = pixels[pos0+0];
                // пустые точки (0x00) никак не обрабатываем
                let d = r === 0x00 ? 0x00 : 0xFF - r;
                depthMap[pos1] = d;
                pos0 += 4;
                pos1++;
            }
        }

        postMessage({
            grayDepthMap: depthMap, 
            width: w, 
            height: h, 
            zCalcMin: calcMin, 
            zCalcMax: calcMax,
        });


        return;

        let intersectObjects2 = [];
        intersectObjects2.push(mesh);
        // intersectObjects.push(mesh);

        let points3d = [];

        console.log('STL start calculate intersects ...');

        let scanX = screenWidth/2;
        let scanY = screenHeight/2;

        for(let i=0; i<5; i++){
            scanX += 10;
            // scanY 

            pointer.set( ( scanX / screenWidth ) * 2 - 1, - ( scanY / screenHeight ) * 2 + 1 );
            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObjects(intersectObjects2);
            // console.log('intersects', intersects);

            console.log('STL intersects length', intersects.length);

            if(intersects.length > 0){
                const intersect = intersects[0];
                let point = intersect.point;

                point = { x: point.z, y: point.x, z: point.y };
                // console.log({point});

                points3d.push( new Vector3(point.x, point.y, point.z+0.5) );
            }

        }

        // const gl = new BufferGeometry().setFromPoints(points3d);
        // const line = new Line(gl, materialLineSelected1);
        // line.computeLineDistances();
        // scene.add(line);

        console.log('STL done.');
    }

    const apiContext = {

        init, 
        parseGeometry, 

        context: _this,
    };

    Object.keys(apiContext).map(name => _this[name] = apiContext[name]);

    return apiContext;

}


const sdw = new ScanDepthWorker();


onmessage = (event) => {
    // console.log('Cam.worker from main', event);

    const { data } = event;

    if(data.canvas){
        // Draw on the canvas
        sdw.init(data.canvas, data.width, data.height);
        postMessage({canvasInited: true});
    } else if(data.geometry){
        sdw.parseGeometry(event.data.geometry);
    } else{
        postMessage({message: 'Message not parsed', origEventData: event.data});
    }
}

