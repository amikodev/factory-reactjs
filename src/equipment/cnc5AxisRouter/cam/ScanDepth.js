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

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CSG } from 'three-csg-ts';

import createWorker from 'offscreen-canvas/create-worker';

import CamModule from './CamModule';
import CamWorker from './Cam.worker';


function ScanDepth(){

    let screenWidth = 500;
    let screenHeight = 500;

    let camera = null;
    let target = null;
    let renderer = null;
    let scene = null;

    let raycaster = null;
    let pointer = null;
    let controls = null;


    let funcGrayDepthMap = null;
    let funcPixels = null;


    const _this = this;


    // const initThreeRenderer = (canvas) => {
    //     console.log('initThreeRenderer');

    //     // runWorker(canvas);


    //     // return;


    //     renderer = new THREE.WebGLRenderer({
    //         // alpha: true,
    //         // context: canvas,
    //         // preserveDrawingBuffer: true,
    //     });
    //     renderer.setSize(screenWidth, screenHeight);
    //     renderer.shadowMap.enabled = true;
    //     renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

    //     target = new THREE.WebGLRenderTarget(screenWidth, screenHeight);

    //     scene = new THREE.Scene();

    //     scene.background = new THREE.Color(0xFFFFFF);
    //     // scene.background = new THREE.Color(0x000000);
    //     scene.rotateY(-Math.PI/2);
    //     scene.rotateX(-Math.PI/2);


    //     let cs = 200;
    //     let ratio = screenWidth/screenHeight;

    //     camera = new THREE.OrthographicCamera(-cs*ratio, cs*ratio, cs, -cs, 0, 100);
    //     camera.position.set(-0.0001, 100, 0);

    //     raycaster = new THREE.Raycaster();
    //     pointer = new THREE.Vector2();

    //     controls = new OrbitControls(camera, canvas);


    //     console.log(renderer);

    // }

    // const workerHandler = () => {

    //     // import * as THREE from 'three';

    //     const initThreeRenderer = (canvas) => {
    //         console.log('initThreeRenderer');
    
    //         // runWorker(canvas);
    
    
    //         // return;
    
    
    //         renderer = new THREE.WebGLRenderer({
    //             // alpha: true,
    //             // context: canvas,
    //             // preserveDrawingBuffer: true,
    //         });
    //         renderer.setSize(screenWidth, screenHeight);
    
    //         target = new THREE.WebGLRenderTarget(screenWidth, screenHeight);
    
    //         scene = new THREE.Scene();
    
    //         scene.background = new THREE.Color(0xFFFFFF);
    //         // scene.background = new THREE.Color(0x000000);
    //         scene.rotateY(-Math.PI/2);
    //         scene.rotateX(-Math.PI/2);
    
    
    //         let cs = 200;
    //         let ratio = screenWidth/screenHeight;
    
    //         camera = new THREE.OrthographicCamera(-cs*ratio, cs*ratio, cs, -cs, 0, 100);
    //         camera.position.set(-0.0001, 100, 0);
    
    //         raycaster = new THREE.Raycaster();
    //         pointer = new THREE.Vector2();
    
    //         controls = new OrbitControls(camera, canvas);
    
    
    //         console.log(renderer);
    
    //     }
    

    //     onmessage = (event) => {
    //         console.log('ScanDepth from main', event);
    //         // postMessage(event.data);
    //         if(event.data.canvas){
    //             // Draw on the canvas
    //             postMessage({message: 'ScanDepth canvas recieved'});
    //             // console.log( event.data.canvas );

    //             initThreeRenderer(event.data.canvas);

    //         // } else if (event.data.message === 'move') {
    //         //     // Messages from main thread
    //         } else{
    //             postMessage(event.data);

    //         }
    //     }

    // };


    const worker = new CamWorker();

    // console.log(worker);

    const runWorker = (canvas, funcDone) => {


        let testCanvas = document.getElementById('testCanvas');

        testCanvas.width = canvas.width;
        testCanvas.height = canvas.height;

        // if(testCanvas === null){
        //     testCanvas = document.createElement('canvas');
        //     testCanvas.id = 'testCanvas';
        //     testCanvas.width = 500;
        //     testCanvas.height = 500;
        //     testCanvas.style = 'transform: scale(1, -1);';
        //     document.body.appendChild(testCanvas);
        // }


        // console.log({testImg});



        // const worker = createWorker(canvas, './Cam.worker.js', e => {
        //     console.log('ScanDepth from worker', e);
    
        // });
    
        // console.log(CamWorker);
        // console.log(worker);

    
        worker.onmessage = (event) => {
            // Messages from the worker
            // console.log('ScanDepth from worker', event);

            const { data } = event;

            if(data.canvasInited){

                if(typeof funcDone === 'function'){
                    funcDone();
                }

            } else if(data.pixels){
                // console.log(data);

                // console.log(data.pixels);

                // console.log(testCanvas, testCanvas.width);

                let ctx = testCanvas.getContext("2d");
                let myArray = data.pixels;
                let uac = new Uint8ClampedArray(myArray, testCanvas.width, testCanvas.height);
                let dat = new ImageData(uac, testCanvas.width, testCanvas.height);
                ctx.putImageData(dat, 0, 0);  

                if(typeof funcPixels === 'function'){
                    funcPixels(data.pixels);
                }

            } else if(data.grayDepthMap){

                if(typeof funcGrayDepthMap === 'function'){
                    funcGrayDepthMap(data);
                }

            }
        }

        var offscreen = canvas.transferControlToOffscreen();
        // console.log(canvas.clientWidth, canvas.screenWidth, canvas.width);
        worker.postMessage({
            canvas: offscreen,
            width: canvas.width,
            height: canvas.height
        }, [offscreen]);

        // // console.log(canvasw.transferControlToOffscreen);
        // const url = URL.createObjectURL(new Blob([`(${workerHandler})()`]));
        // const worker = createWorker(canvas, url, e => {
        //     // Messages from the worker
        //     console.log('ScanDepth from worker', e);
        // });

        // worker.post({message: 'update'});
        // console.log(worker);
        // window.setTimeout(() => {

        //     worker.postMessage({message: 'update'}, []);

        // }, 1000);

    }


    const setGeometry = (geometry) => {
        const arrayBuffers = [];

        for(let attributeName of Object.keys(geometry.attributes)){
            arrayBuffers.push(geometry.attributes[attributeName].array.buffer);
        }
        
        // console.log({geometry, arrayBuffers});
        // postMessage( { geometry }, arrayBuffers );        
        worker.postMessage({geometry}, arrayBuffers);
        // worker.postMessage({geometry});
    }

    const onGrayDepthMap = (func) => {
        funcGrayDepthMap = func;
    }

    const onPixels = (func) => {
        funcPixels = func;
    }



    const apiContext = {
        // uuid,
        // initThreeRenderer, 
        runWorker, 
        setGeometry, 

        onGrayDepthMap, 
        onPixels,

        context: _this,
    };

    Object.keys(apiContext).map(name => _this[name] = apiContext[name]);

    return apiContext;

}

export default ScanDepth;
