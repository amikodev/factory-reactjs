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

/**
 * События mouse.
 * Перемещение, клик, заход на объект, выход, нажатие кнопки, отжатие кнопки.
 * 
 * listeners['click'].forEach(func => func(intersects));
 * listeners['doubleClick'].forEach(func => func(intersects));
 * listeners['down'].forEach(func => func(intersects));
 * listeners['up'].forEach(func => func(intersects));
 * listeners['move'].forEach(func => func(intersects));
 * listeners['over'].forEach(func => func(intersect));   <--- only one intersect
 * listeners['out'].forEach(func => func(intersect));    <--- only one intersect
 * 
 * listeners['faceOver'].forEach(func => func(intersect, faceIndex));
 * listeners['faceOut'].forEach(func => func(intersect, faceIndex));
 * listeners['faceGroupOver'].forEach(func => func(intersect, faceGroupIndex));
 * listeners['faceGroupOut'].forEach(func => func(intersect, faceGroupIndex));
 */
function ThreeMouseEvents(){


    let _domElement = null;

    let intersectObjects = [];
    let intersectByMove = null;
    let intersectFaceIndex = null;
    let intersectFaceGroupIndex = null;
    

    let screenWidth = null;
    let screenHeight = null;

    let camera = null;

    let lastClickTime = null;

    let enabled = true;
    let controlRunned = false;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();


    const _this = this;

    let listeners = {
        'click': [],
        'doubleClick': [],
        'down': [],
        'up': [],
        'move': [],
        'over': [],
        'out': [],
        'faceOver': [],
        'faceOut': [],
        'faceGroupOver': [],
        'faceGroupOut': [],
    };


    const init = () => {

        domAddListener('click', 'click');
        domAddListener('mousedown', 'down');
        domAddListener('mouseup', 'up');
        domAddListener('pointermove', 'move');

    }

    const setDomElement = (domElement) => {
        _domElement = domElement;
    }

    const setScreenSize = (width, height) => {
        screenWidth = width;
        screenHeight = height;
    }

    const setCamera = cam => {
        camera = cam;
    }


    const domAddListener = (eventName, fEventName) => {

        if(_domElement === null) return;

        _domElement.addEventListener(eventName,  event => {

            if(eventName === 'pointermove' && !enabled){
                controlRunned = true;
            }

            if(!enabled) return;

            if(eventName === 'mouseup' && controlRunned){
                return;
            } else if(eventName === 'click' && controlRunned){
                controlRunned = false;
                return;
            }

            pointer.set( ( event.offsetX / screenWidth ) * 2 - 1, - ( event.offsetY / screenHeight ) * 2 + 1 );
            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObjects(intersectObjects);

            if(eventName === 'pointermove'){
                pointerMove(event, intersects);
            }

            if(typeof listeners[fEventName] !== 'undefined'){
                listeners[fEventName].forEach(func => {
                    func(event, intersects);
                });
            }

            if(eventName === 'click'){
                let clickTime = (new Date()).getTime();
                if(lastClickTime !== null){
                    if(clickTime - lastClickTime < 200){
                        // double click
                        (() => {
                            let fEventName = 'doubleClick';
                            if(typeof listeners[fEventName] !== 'undefined'){
                                listeners[fEventName].forEach(func => {
                                    func(event, intersects);
                                });
                            }
                        })();
                    }
                }
                lastClickTime = clickTime;
            }

        });    
    }

    const pointerOver = (event, intersect) => {
        const fEventName = 'over';
        if(typeof listeners[fEventName] !== 'undefined'){
            listeners[fEventName].forEach(func => {
                func(event, intersect);
            });
        }
    }

    const pointerOut = (event, intersect) => {
        const fEventName = 'out';
        if(typeof listeners[fEventName] !== 'undefined'){
            listeners[fEventName].forEach(func => {
                func(event, intersect);
            });
        }
    }

    const pointerFaceOver = (event, intersect, faceIndex) => {
        const fEventName = 'faceOver';
        if(typeof listeners[fEventName] !== 'undefined'){
            listeners[fEventName].forEach(func => {
                func(event, intersect, faceIndex);
            });
        }


        let { object } = intersect;

        let faceGroupInd = null;
        object.geometry.groups.forEach((group, ind) => {
            if(faceIndex*3 >= group.start && faceIndex*3 < group.start+group.count){
                faceGroupInd = ind;
            }
        });

        if(faceGroupInd !== intersectFaceGroupIndex){
            if(intersectFaceGroupIndex !== null){
                pointerFaceGroupOut(event, intersect, intersectFaceGroupIndex);
            }
            intersectFaceGroupIndex = faceGroupInd;
            pointerFaceGroupOver(event, intersect, intersectFaceGroupIndex);
        }

    }

    const pointerFaceOut = (event, intersect, faceIndex) => {
        const fEventName = 'faceOut';
        if(typeof listeners[fEventName] !== 'undefined'){
            listeners[fEventName].forEach(func => {
                func(event, intersect, faceIndex);
            });
        }
    }

    const pointerFaceGroupOver = (event, intersect, faceGroupIndex) => {
        const fEventName = 'faceGroupOver';
        if(faceGroupIndex !== null && typeof listeners[fEventName] !== 'undefined'){
            listeners[fEventName].forEach(func => {
                func(event, intersect, faceGroupIndex);
            });
        }
    }

    const pointerFaceGroupOut = (event, intersect, faceGroupIndex) => {
        const fEventName = 'faceGroupOut';
        if(faceGroupIndex !== null && typeof listeners[fEventName] !== 'undefined'){
            listeners[fEventName].forEach(func => {
                func(event, intersect, faceGroupIndex);
            });
        }
    }

    const pointerMove = (event, intersects) => {

        if(intersectByMove !== null){
            let isPointerOut = true;
            intersects.forEach(intersect => {
                let { object } = intersect;
                if(object === intersectByMove.object){
                    isPointerOut = false;
                }
            });

            if(isPointerOut){
                // mouse face out
                if(intersectFaceIndex !== null){
                    pointerFaceOut(event, intersectByMove, intersectFaceIndex);
                }

                // mouse face group out
                if(intersectFaceGroupIndex !== null){
                    pointerFaceGroupOut(event, intersectByMove, intersectFaceGroupIndex);
                    intersectFaceGroupIndex = null;
                }

                // mouse out
                pointerOut(event, intersectByMove);
                intersectByMove = null;
            }
        }

        // console.log(intersects);


        // let priorityIntersect = null;
        // // let camIntersectObjects = {};
        // intersects.forEach(intersect => {
        //     const camObject = intersect.object.userData.camObject;
        //     if(camObject !== null){
        //         if(camObject instanceof StlModelLink && priorityIntersect === null){
        //             priorityIntersect = intersect;
        //         }
        //         // if(camIntersectObjects[camObject.uuid] === undefined){
        //         //     camIntersectObjects[camObject.uuid] = {
        //         //         camObject, intersect,
        //         //     };
        //         // }
        //     }
        // });
        // // console.log(camIntersectObjects);


        intersects.forEach(intersect => {
            if(intersectByMove === null){
                intersectByMove = intersect;
                // mouse over
                // console.log('intersectByMove', intersectByMove);
                pointerOver(event, intersect);
            }

            // mouse face over
            if(intersect.faceIndex !== intersectFaceIndex){
                if(intersectFaceIndex !== null){
                    pointerFaceOut(event, intersect, intersectFaceIndex);
                }
                intersectFaceIndex = intersect.faceIndex;
                pointerFaceOver(event, intersect, intersectFaceIndex);
            }
        });
    }

    const setIntersectObjects = (objects) => {
        intersectObjects = objects;
    }

    const addIntersectObjects = (objects) => {
        intersectObjects.push(...objects);
    }

    const addListener = (eventName, funcCallback) => {
        if(typeof listeners[eventName] !== 'undefined'){
            listeners[eventName].push(funcCallback);
        }
    }

    const setEnabled = (en) => {
        enabled = en;
    }

    const getEnabled = () => {
        return enabled;
    }

    const apiContext = {
        init, setDomElement, setScreenSize, setCamera, 
        setIntersectObjects, addIntersectObjects, 
        addListener, 
        setEnabled, getEnabled, 

    };

    Object.keys(apiContext).forEach(name => _this[name] = apiContext[name]);

    return apiContext;
}


export default ThreeMouseEvents;
