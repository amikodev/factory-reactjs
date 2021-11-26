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

import GCode from '../../gcode/GCode';
import { zeroPoint3D, zeroPointABC } from './Vision3D';


const materialCenter = new THREE.MeshBasicMaterial( { color: 0x888888, opacity: 0.5, transparent: true, depthTest: false } );

const materialAxeX = new THREE.LineBasicMaterial( { color: 0xFF0000, depthTest: false } );
const materialAxeY = new THREE.LineBasicMaterial( { color: 0x00FF00, depthTest: false } );
const materialAxeZ = new THREE.LineBasicMaterial( { color: 0x0000FF, depthTest: false } );

const materialMeshAxeX = new THREE.MeshBasicMaterial( { color: 0xFF0000, opacity: 0.5, transparent: true, depthTest: false } );
const materialMeshAxeY = new THREE.MeshBasicMaterial( { color: 0x00FF00, opacity: 0.5, transparent: true, depthTest: false } );
const materialMeshAxeZ = new THREE.MeshBasicMaterial( { color: 0x0000FF, opacity: 0.5, transparent: true, depthTest: false } );

const materialTwoAxes = new THREE.MeshBasicMaterial( { color: 0x888800, opacity: 0.5, transparent: true, side: THREE.DoubleSide, depthTest: false } );

const materialRotate = new THREE.MeshBasicMaterial( { color: 0x888888, opacity: 0.5, transparent: true, depthTest: false } );


const TYPE_PLANE = 'Plane';
const TYPE_LINE = 'Line';
const TYPE_CONE = 'Cone';
const TYPE_CENTER = 'Center';
const TYPE_TWO_AXES = 'TwoAxes';
const TYPE_ROTATE = 'Rotate';

const materialPlane = new THREE.MeshBasicMaterial( {
    color: 0x888888, 
    visible: false, 
    opacity: 0.5, 
    transparent: true, 
    side: THREE.DoubleSide 
} );

let gc = new GCode();




const rotX = (point, angle) => {
    const { sin, cos } = Math;
    let x = point.x;
    let y = point.y*cos(angle) - point.z*sin(angle);
    let z = point.y*sin(angle) + point.z*cos(angle);
    return {x, y, z};
}

const rotY = (point, angle) => {
    const { sin, cos } = Math;
    let x =  point.x*cos(angle) + point.z*sin(angle);
    let y =  point.y;
    let z = -point.x*sin(angle) + point.z*cos(angle);
    return {x, y, z};
}

const rotZ = (point, angle) => {
    const { sin, cos } = Math;
    let x = point.x*cos(angle) - point.y*sin(angle);
    let y = point.x*sin(angle) + point.y*cos(angle);
    let z = point.z;
    return {x, y, z};
}

const rotatePoint = (point, pointABC) => {
    let p = Object.assign({}, point);
    p = rotX(p, pointABC.a);
    p = rotY(p, pointABC.b);
    p = rotZ(p, pointABC.c);
    return p;
}


const calcUVPoint = (uv, planeObject) => {
    let uvPoint = {
        x: (uv.x-0.5) * planeObject.geometry.parameters.width,
        y: (uv.y-0.5) * planeObject.geometry.parameters.height,
    };
    return uvPoint;
}

const calcPointByUV = (uv, planeObject) => {
    const uvPoint = calcUVPoint(uv, planeObject);
    let point = Object.assign({}, zeroPoint3D);

    let axeNames = planeObject.userData.axeNames;
    if(axeNames === 'xy') point = Object.assign({}, point, {x: uvPoint.x, y: uvPoint.y});
    else if(axeNames === 'yz') point = Object.assign({}, point, {y: uvPoint.x, z: uvPoint.y});
    else if(axeNames === 'xz') point = Object.assign({}, point, {x: uvPoint.x, z: uvPoint.y});

    return point;
}



function MoveHelper(point3d, size, sizeCone){

    let mrHelper = new MoveRotateHelper(point3d, null, size, sizeCone);
    this.uuid = mrHelper.uuid;

    return mrHelper;

}


function RotateHelper(pointABC){

    return {
        
    };
}


function MoveRotateHelper(point3d, pointABC, size, sizeCone){

    // вращение не реализовано
    pointABC = null;

    let rnd = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    let uuid = 'MoveRotateHelper_'+(new Date().getTime())+'_'+rnd;
    this.uuid = uuid;

    let group = new THREE.Group();
    let groupPlanes = new THREE.Group();
    let groupAxes = new THREE.Group();
    let groupTwoAxes = new THREE.Group();
    let groupRotate = new THREE.Group();

    let points3d = null;
    let geometry = null;
    let planeGeometry = null;

    let line = null;
    let cone = null;
    let plane = null;
    let rotateFigure = null;

    let changeFunc = null;
    let centerClickFunc = null;

    let intersectObjects = [];
    let intersectByMove = null;

    let dragAxeName = null;
    let dragPoint = null;
    let dragTargetPoint = null;
    let dragTwoAxesNames = null;
    let dragRotateAxeName = null;
    let dragTargetRotate = null;

    let dragUVWPoint = null;

    const axePlaneAxes = {
        'x': 'xy',
        'y': 'xy',
        'z': 'xz'
    };

    const rotateAxePlaneAxes = {
        'x': 'yz',
        'y': 'xz',
        'z': 'xy',
    };

    const _this = this;

    // planes
    planeGeometry = new THREE.PlaneGeometry(30000, 30000);

    [ 
        ['xy', [0, 0, 0], 0x888800], 
        ['yz', [0, -Math.PI/2, 0], 0x008888], 
        ['xz', [-Math.PI/2, 0, -Math.PI/2], 0x880088],
    ].map(el => {
        let material = materialPlane.clone();
        material.color.set(el[2]);
        plane = new THREE.Mesh(planeGeometry, material);
        plane.rotation.set(...el[1]);
        plane.name = 'MoveHelper';
        plane.userData = {type: TYPE_PLANE, axeNames: el[0], context: _this};
        groupPlanes.add(plane);
        intersectObjects.push(plane);
    });

    // lines
    [
        ['x', [size, 0, 0], materialAxeX],
        ['y', [0, size, 0], materialAxeY],
        ['z', [0, 0, size], materialAxeZ],
    ].map(el => {
        let material = el[2].clone();
        points3d = [];
        points3d.push( new THREE.Vector3(0, 0, 0) );
        // points3d.push( new THREE.Vector3(el[1][1], el[1][2], el[1][0]) );
        points3d.push( new THREE.Vector3(...el[1]) );
        geometry = new THREE.BufferGeometry().setFromPoints(points3d);
        line = new THREE.Line(geometry, material);
        line.name = 'MoveHelper';
        line.userData = {type: TYPE_LINE, axeName: el[0], context: _this};
        groupAxes.add(line);
        intersectObjects.push(line);
    });

    // cones
    geometry = new THREE.ConeGeometry(sizeCone/2, sizeCone, 32);
    let s = size+(sizeCone/2);

    [
        ['x', [s, 0, 0], [0, 0, -Math.PI/2], materialMeshAxeX],
        ['y', [0, s, 0], [0, 0, 0], materialMeshAxeY],
        ['z', [0, 0, s], [Math.PI/2, 0, 0], materialMeshAxeZ],
        // ['x', [s, 0, 0], [0, 0, -Math.PI/2], materialMeshAxeX],
    ].map(el => {
        let material = el[3].clone();
        cone = new THREE.Mesh(geometry, material);
        // cone.position.set(el[1][1], el[1][2], el[1][0]);
        cone.position.set(...el[1]);
        cone.rotation.set(...el[2]);
        cone.name = 'MoveHelper';
        cone.userData = {type: TYPE_CONE, axeName: el[0], context: _this};
        groupAxes.add(cone);
        intersectObjects.push(cone);
    });

    // two axes squares
    let size2 = size + sizeCone;
    let tsSize = size2*0.75;
    s = size2 - tsSize/2;
    geometry = new THREE.PlaneGeometry(tsSize, tsSize);

    [
        ['xy', [s, s, 0], [0, 0, 0]],
        ['yz', [0, s, s], [0, Math.PI/2, 0]],
        ['xz', [s, 0, s], [Math.PI/2, 0, 0]],
    ].map(el => {
        let material = materialTwoAxes.clone();
        plane = new THREE.Mesh(geometry, material);
        // plane.position.set(el[1][1], el[1][2], el[1][0]);
        plane.position.set(...el[1]);
        plane.rotation.set(...el[2]);
        plane.name = 'MoveHelper';
        plane.userData = {type: TYPE_TWO_AXES, axeNames: el[0], context: _this};
        groupTwoAxes.add(plane);
        intersectObjects.push(plane);
    });

    // center
    const centerSphere = new THREE.SphereGeometry(5, 16, 16);
    const centerMesh = new THREE.Mesh(centerSphere, materialCenter.clone());
    centerMesh.position.set(point3d.x, point3d.y, point3d.z);
    centerMesh.name = 'MoveHelper';
    centerMesh.userData = {type: TYPE_CENTER, context: _this};
    intersectObjects.push(centerMesh);
    group.add(centerMesh);


    // rotate
    // pointABC = {a: 0, b: 0, c: 0};
    if(pointABC !== null){
        let rSize = (size + sizeCone) * 1.6;
        let s = 10;
        geometry = new THREE.TorusGeometry(rSize, 5, 8, 32, Math.PI);

        [
            ['x', [0, 0, s], [Math.PI/2, Math.PI/2, 0]],
            ['y', [0, 0, s], [Math.PI/2, 0, 0]],
            ['z', [0, s, 0], [0, 0, 0]],
        ].map(el => {
            let material = materialRotate.clone();
            rotateFigure = new THREE.Mesh(geometry, material);
            // rotateFigure.position.set(el[1][1], el[1][2], el[1][0]);
            rotateFigure.position.set(...el[1]);
            rotateFigure.rotation.set(...el[2]);
            rotateFigure.name = 'MoveHelper';
            rotateFigure.userData = {type: TYPE_ROTATE, axeName: el[0], context: _this};
            groupRotate.add(rotateFigure);
            intersectObjects.push(rotateFigure);
        });
    }


    // groupPlanes.position.set(point3d.y, point3d.z, point3d.x);
    // groupAxes.position.set(point3d.y, point3d.z, point3d.x);
    // groupTwoAxes.position.set(point3d.y, point3d.z, point3d.x);
    // groupRotate.position.set(point3d.y, point3d.z, point3d.x);

    groupPlanes.position.set(point3d.x, point3d.y, point3d.z);
    groupAxes.position.set(point3d.x, point3d.y, point3d.z);
    groupTwoAxes.position.set(point3d.x, point3d.y, point3d.z);
    groupRotate.position.set(point3d.x, point3d.y, point3d.z);

    groupAxes.visible = false;
    groupTwoAxes.visible = false;
    groupRotate.visible = false;

    group.add(groupPlanes);
    group.add(groupAxes);
    group.add(groupTwoAxes);
    group.add(groupRotate);


    const getGroup = () => {
        return group;
    }

    const getIntersectObjects = () => {
        return intersectObjects;
    }


    const mouseOver = (intersect) => {
        let { object } = intersect;
        let { type } = object.userData;

        if(!groupAxes.visible && type !== TYPE_CENTER) 
            return;

        // console.log('MouseOver', object.userData);

        if(type === TYPE_LINE){
            // object.material.opacity = 0.8;
        } else if(type === TYPE_CONE){
            object.material.opacity = 0.8;
        } else if(type === TYPE_CENTER){
            object.material.opacity = 0.8;
        } else if(type === TYPE_TWO_AXES){
            object.material.opacity = 0.8;
        } else if(type === TYPE_ROTATE){
            object.material.opacity = 0.8;
        }

    }

    const mouseOut = (intersect) => {
        let { object } = intersect;
        let { type } = object.userData;

        if(!groupAxes.visible && type !== TYPE_CENTER) 
            return;

        // console.log('MouseOut', object.userData);

        if(type === TYPE_LINE){
            // object.material.opacity = 0.5;
        } else if(type === TYPE_CONE){
            object.material.opacity = 0.5;
        } else if(type === TYPE_CENTER){
            object.material.opacity = 0.5;
        } else if(type === TYPE_TWO_AXES){
            object.material.opacity = 0.5;
        } else if(type === TYPE_ROTATE){
            object.material.opacity = 0.5;
        }
        
    }

    const pointerMove = (event, intersects) => {

        if(intersectByMove !== null){
            let isMouseOut = true;
            intersects.map(intersect => {
                let { object } = intersect;
                if(object === intersectByMove.object){
                    isMouseOut = false;
                }
            });

            if(isMouseOut){
                // mouse out
                mouseOut(intersectByMove);
                intersectByMove = null;
            }
        }

        intersects.map(intersect => {
            let { object, point, uv } = intersect;

            if(intersectByMove === null && object.userData.type !== TYPE_PLANE){
                intersectByMove = intersect;
                // mouse over
                mouseOver(intersect);
            }

            if(!groupAxes.visible) 
                return;
    
            // mouse move
            // point = { x: point.z-17.5, y: point.x-25, z: point.y-13 };
            point = { x: point.z, y: point.x, z: point.y };
            // point = { x: point.x-25, y: point.y-13, z: point.z-17.5 };
            // point = rotY(point, Math.PI/2);
            // point = rotX(point, Math.PI/2);
            // console.log('MouseMove', object.userData, point);

            // перемещение по оси
            if(dragAxeName !== null && dragPoint !== null){
                let axeName = dragAxeName;
                let needAxeNames = axePlaneAxes[axeName];

                if(object.userData.type === TYPE_PLANE && object.userData.axeNames === needAxeNames){
                    // let uvwPoint = calcPointByUV(uv, object);
                    // console.log(point);

                    let dist = {
                        x: point.x-dragPoint.x,
                        y: point.y-dragPoint.y,
                        z: point.z-dragPoint.z
                    };

                    let targetPoint = Object.assign({}, point3d);

                    if(pointABC !== null){

                        dist = rotatePoint(dist, gc.pointSub(pointABC, zeroPointABC));
                        if(axeName !== 'x') dist.x = 0.0;
                        if(axeName !== 'y') dist.y = 0.0;
                        if(axeName !== 'z') dist.z = 0.0;
                        dist = rotatePoint(dist, pointABC);

                        targetPoint = gc.pointAdd(targetPoint, dist);

                    } else{

                        if(axeName === 'x') targetPoint.x += dist.x;
                        else if(axeName === 'y') targetPoint.y += dist.y;
                        else if(axeName === 'z') targetPoint.z += dist.z;
    
                    }

                    dragTargetPoint = targetPoint;
                    // groupAxes.position.set(targetPoint.y, targetPoint.z, targetPoint.x);
                    // groupTwoAxes.position.set(targetPoint.y, targetPoint.z, targetPoint.x);
                    // groupRotate.position.set(targetPoint.y, targetPoint.z, targetPoint.x);
                    // centerMesh.position.set(targetPoint.y, targetPoint.z, targetPoint.x);

                    groupAxes.position.set(targetPoint.x, targetPoint.y, targetPoint.z);
                    groupTwoAxes.position.set(targetPoint.x, targetPoint.y, targetPoint.z);
                    groupRotate.position.set(targetPoint.x, targetPoint.y, targetPoint.z);
                    centerMesh.position.set(targetPoint.x, targetPoint.y, targetPoint.z);
                
                
                    // уведомление об изменении координат
                    if(dist.x !== 0 && dist.y !== 0 && dist.z !== 0){
                        if(typeof changeFunc === 'function'){
                            changeFunc(targetPoint);
                        }
                    }
                }

            // перемещение по плоскости
            } else if(dragTwoAxesNames !== null && dragPoint !== null){
                let twoAxesNames = dragTwoAxesNames;
                let needAxeNames = twoAxesNames;

                if(object.userData.type === TYPE_PLANE && object.userData.axeNames === needAxeNames){
                    let dist = {
                        x: point.x-dragPoint.x,
                        y: point.y-dragPoint.y,
                        z: point.z-dragPoint.z
                    };

                    let targetPoint = Object.assign({}, point3d);

                    if(twoAxesNames.indexOf('x') >= 0) targetPoint.x += dist.x;
                    if(twoAxesNames.indexOf('y') >= 0) targetPoint.y += dist.y;
                    if(twoAxesNames.indexOf('z') >= 0) targetPoint.z += dist.z;

                    dragTargetPoint = targetPoint;
                    // groupAxes.position.set(targetPoint.y, targetPoint.z, targetPoint.x);
                    // groupTwoAxes.position.set(targetPoint.y, targetPoint.z, targetPoint.x);
                    // groupRotate.position.set(targetPoint.y, targetPoint.z, targetPoint.x);
                    // centerMesh.position.set(targetPoint.y, targetPoint.z, targetPoint.x);

                    groupAxes.position.set(targetPoint.x, targetPoint.y, targetPoint.z);
                    groupTwoAxes.position.set(targetPoint.x, targetPoint.y, targetPoint.z);
                    groupRotate.position.set(targetPoint.x, targetPoint.y, targetPoint.z);
                    centerMesh.position.set(targetPoint.x, targetPoint.y, targetPoint.z);
                

                    // уведомление об изменении координат
                    if(dist.x !== 0 && dist.y !== 0 && dist.z !== 0){
                        if(typeof changeFunc === 'function'){
                            changeFunc(targetPoint);
                        }
                    }
                }

            // перемещение по области вращения
            } else if(dragRotateAxeName !== null && dragPoint !== null){
                let rotateAxeName = dragRotateAxeName;
                let needAxeNames = rotateAxePlaneAxes[rotateAxeName];

                if(object.userData.type === TYPE_PLANE && object.userData.axeNames === needAxeNames){
                    let dist1 = gc.pointSub(point3d, dragPoint);
                    let dist2 = gc.pointSub(point3d, point);

                    let targetRotate = Object.assign({}, pointABC);


                    const needCalcAxes = {
                        'x': ['z', 'y'],
                        'y': ['z', 'x'],
                        'z': ['y', 'x'],
                    };
                    const ax = needCalcAxes[rotateAxeName];

                    let angle1 = Math.atan2(dist1[ax[0]], dist1[ax[1]]);
                    let angle2 = Math.atan2(dist2[ax[0]], dist2[ax[1]]);

                    let dAngle = angle2 - angle1;

                    if(rotateAxeName === 'x') targetRotate.a += dAngle;
                    else if(rotateAxeName === 'y') targetRotate.b += dAngle;
                    else if(rotateAxeName === 'z') targetRotate.c += dAngle;

                    dragTargetRotate = targetRotate;
                    // groupAxes.rotation.set(-targetRotate.b, targetRotate.c, targetRotate.a);
                    // groupTwoAxes.rotation.set(-targetRotate.b, targetRotate.c, targetRotate.a);
                    // groupRotate.rotation.set(-targetRotate.b, targetRotate.c, targetRotate.a);

                    groupAxes.rotation.set(targetRotate.a, -targetRotate.b, targetRotate.c);
                    groupTwoAxes.rotation.set(targetRotate.a, -targetRotate.b, targetRotate.c);
                    groupRotate.rotation.set(targetRotate.a, -targetRotate.b, targetRotate.c);

                    // console.log(rotateAxeName, dAngle*180/Math.PI);
                }

            }
        });
    }

    const pointerClick = (event, intersects) => {
        // console.log(intersects);
        intersects.map(intersect => {
            let { object } = intersect;
            // console.log(object.userData.type);
            if(object.userData.type === TYPE_CENTER){
                // console.log('center clicked');
                groupAxes.visible = !groupAxes.visible;
                groupTwoAxes.visible = groupAxes.visible;
                groupRotate.visible = groupAxes.visible;
                if(typeof centerClickFunc === 'function'){
                    centerClickFunc();
                }
            } else if(object.userData.type === TYPE_TWO_AXES){
                // console.log( object.userData );
            } else if(object.userData.type === TYPE_ROTATE){
                // console.log( object.userData );
            } else if(object.userData.type === TYPE_PLANE){
                let { uv } = intersect;
                let uvwPoint = calcPointByUV(uv, object);
                // console.log( 'click', uvwPoint, object.userData, intersect );
            }
        });
    }

    const pointerDown = (event, intersects) => {
        
        // console.log('pointerDown', intersects);
        // let line = null;
        // let cone = null;
        // let plane = null;
        let axeName = null;
        let twoAxesNames = null;
        let rotateAxeName = null;

        intersects.map(intersect => {
            if(axeName !== null) return;
            let { object } = intersect;
            if(object.userData.type === TYPE_LINE || object.userData.type === TYPE_CONE){
                axeName = object.userData.axeName;
                // if(object.userData.type === TYPE_LINE){
                //     line = object;
                // } else{
                //     cone = object;
                // }
            } else if(object.userData.type === TYPE_TWO_AXES){
                twoAxesNames = object.userData.axeNames;
            } else if(object.userData.type === TYPE_ROTATE){
                rotateAxeName = object.userData.axeName;
            }
        });

        if(axeName !== null){
            dragAxeName = axeName;
            let needAxeNames = axePlaneAxes[axeName];
            intersects.map(intersect => {
                let { object, point, uv } = intersect;
                if(object.userData.type === TYPE_PLANE && object.userData.axeNames === needAxeNames){
                    // plane = object;

                    // point = { x: point.z-17.5, y: point.x-25, z: point.y-13 };
                    point = { x: point.z, y: point.x, z: point.y };
                    // point = { x: point.x-25, y: point.y-13, z: point.z-17.5 };
                    dragPoint = point;

                    let uvwPoint = calcPointByUV(uv, object);
                    dragUVWPoint = uvwPoint;
                }
            });
        } else if(twoAxesNames !== null){
            dragTwoAxesNames = twoAxesNames;
            let needAxeNames = twoAxesNames;
            intersects.map(intersect => {
                let { object, point } = intersect;
                if(object.userData.type === TYPE_PLANE && object.userData.axeNames === needAxeNames){
                    // point = { x: point.z-17.5, y: point.x-25, z: point.y-13 };
                    point = { x: point.z, y: point.x, z: point.y };
                    // point = { x: point.x-25, y: point.y-13, z: point.z-17.5 };
                    dragPoint = point;
                }
            });
        } else if(rotateAxeName !== null){
            dragRotateAxeName = rotateAxeName;
            let needAxeNames = rotateAxePlaneAxes[rotateAxeName];
            intersects.map(intersect => {
                let { object, point } = intersect;
                if(object.userData.type === TYPE_PLANE && object.userData.axeNames === needAxeNames){
                    // point = { x: point.z-17.5, y: point.x-25, z: point.y-13 };
                    point = { x: point.z, y: point.x, z: point.y };
                    // point = { x: point.x-25, y: point.y-13, z: point.z-17.5 };
                    dragPoint = point;
                }
            });
        }

    }

    const pointerUp = (event, intersects) => {
        // console.log('pointerUp', intersects);
        if(dragAxeName !== null){
            let axeName = dragAxeName;
            let needAxeNames = axePlaneAxes[axeName];
            intersects.map(intersect => {
                let { object, point } = intersect;
                if(object.userData.type === TYPE_PLANE && object.userData.axeNames === needAxeNames){
                    if(dragTargetPoint !== null){
                        point3d = Object.assign({}, dragTargetPoint);
                        // groupPlanes.position.set(point3d.y, point3d.z, point3d.x);
                        groupPlanes.position.set(point3d.x, point3d.y, point3d.z);
                    }
                    dragAxeName = null;
                    dragPoint = null;
                    dragTargetPoint = null;
                    dragUVWPoint = null;
                }
            });
        } else if(dragTwoAxesNames !== null){
            let twoAxesNames = dragTwoAxesNames;
            let needAxeNames = twoAxesNames;
            intersects.map(intersect => {
                let { object, point } = intersect;
                if(object.userData.type === TYPE_PLANE && object.userData.axeNames === needAxeNames){
                    if(dragTargetPoint !== null){
                        point3d = Object.assign({}, dragTargetPoint);
                        // groupPlanes.position.set(point3d.y, point3d.z, point3d.x);
                        groupPlanes.position.set(point3d.x, point3d.y, point3d.z);
                    }
                    dragTwoAxesNames = null;
                    dragPoint = null;
                    dragTargetPoint = null;
                }
            });
        } else if(dragRotateAxeName !== null){
            let rotateAxeName = dragRotateAxeName;
            let needAxeNames = rotateAxePlaneAxes[rotateAxeName];
            intersects.map(intersect => {
                let { object, point } = intersect;
                if(object.userData.type === TYPE_PLANE && object.userData.axeNames === needAxeNames){
                    if(dragTargetRotate !== null){
                        pointABC = Object.assign({}, dragTargetRotate);
                        // groupPlanes.rotation.set(-pointABC.b, pointABC.c, pointABC.a);
                        groupPlanes.rotation.set(pointABC.a, -pointABC.b, pointABC.c);
                    }
                    dragRotateAxeName = null;
                    dragPoint = null;
                    dragTargetRotate = null;
                }
            });
        }
    }

    const getPoint = () => {
        let point = Object.assign({}, point3d);
        return point;
    }

    const setPoint = (targetPoint) => {
        point3d = Object.assign({}, targetPoint);
        // groupPlanes.position.set(point3d.y, point3d.z, point3d.x);
        // groupAxes.position.set(point3d.y, point3d.z, point3d.x);
        // groupTwoAxes.position.set(point3d.y, point3d.z, point3d.x);
        // groupRotate.position.set(point3d.y, point3d.z, point3d.x);
        // centerMesh.position.set(point3d.y, point3d.z, point3d.x);

        groupPlanes.position.set(point3d.x, point3d.y, point3d.z);
        groupAxes.position.set(point3d.x, point3d.y, point3d.z);
        groupTwoAxes.position.set(point3d.x, point3d.y, point3d.z);
        groupRotate.position.set(point3d.x, point3d.y, point3d.z);
        centerMesh.position.set(point3d.x, point3d.y, point3d.z);

    }

    const onChange = (func) => {
        changeFunc = func;
    }

    const onCenterClick = (func) => {
        centerClickFunc = func;
    }

    const getAxesVisible = () => {
        return groupAxes.visible;
    }

    const setAxesVisible = (visible) => {
        groupAxes.visible = visible;
    }

    const setTwoAxesVisible = (visible) => {
        groupTwoAxes.visible = visible;
    }

    const setRotateVisible = (visible) => {
        groupRotate.visible = visible;
    }

    const setVisible = (visible) => {
        group.visible = visible;
    }

    const isDragActive = () => {
        return dragPoint !== null;
    }

    const remove = () => {
        if(typeof this.__proto__.onRemove === 'function'){
            this.__proto__.onRemove(this);
        }
    }


    const apiContext = {
        uuid, 
        getGroup, getIntersectObjects, 
        pointerMove, pointerClick, pointerDown, pointerUp, 
        getPoint, setPoint, onChange, 
        onCenterClick, 
        setVisible, 
        getAxesVisible, setAxesVisible, setTwoAxesVisible, 
        setRotateVisible,
        isDragActive, 
        remove, 
        context: _this,
    };

    Object.keys(apiContext).map(name => _this[name] = apiContext[name]);


    if(typeof this.__proto__.onCreate === 'function'){
        this.__proto__.onCreate(this);
    }

    return apiContext;
}


export { MoveHelper, RotateHelper, MoveRotateHelper };
export { TYPE_PLANE, TYPE_LINE, TYPE_CONE, TYPE_CENTER, TYPE_TWO_AXES, TYPE_ROTATE };
export { rotX, rotY, rotZ, rotatePoint };
