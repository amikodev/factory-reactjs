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

import CamObject from "../CamObject";
import { Point3 } from '../CamObject';
import InitialBlank from "../InitialBlank";
import { StlModel, StlModelLink } from "../StlModel";

import CamSupportObject from '../CamSupportObject';

import ScanDepth from '../ScanDepth.js';
import Strategy from './strategy/Strategy';


class Analyse{

    private _components: CamObject[] = [];

    private _funcFinishScanDepth: Function | null = null;

    set components(cs: CamObject[]){
        this._components = cs;
    }


    run(){

        // const geometry = this._needModels[0].mesh.geometry;

        const component: InitialBlank = <InitialBlank>this._components[0];
        const link: StlModelLink = component.childs[0];

        if(component.mesh !== null){
            component.mesh.visible = false;
        }

        this.scanDepth(link);

    }

    /**
     * Сканирование карты глубин
     */
    private scanDepth(link: StlModelLink){

        const accuracy = 0.1;   // точность в мм

        const canvasw = document.createElement('canvas');
        canvasw.width = link.size.x * 1/accuracy;
        canvasw.height = link.size.y * 1/accuracy;
        canvasw.setAttribute('style', 'display: none;');
        document.body.appendChild(canvasw);

        const clayGeometry = new THREE.PlaneGeometry(link.size.x, link.size.y, link.size.x * 1/accuracy, link.size.y * 1/accuracy);

        let workPoints: Point3[] = [];

        // const sd = new ScanDepth();
        const sd = new (ScanDepth as any)();
        sd.runWorker(canvasw, () => {

            sd.onGrayDepthMap( ({ grayDepthMap, width, height }: any) => {

                workPoints = [];

                const material = new THREE.MeshBasicMaterial({color: 0xFF0000});
                const groupGray = new THREE.Group();

                for(let j=0; j<height; j+=1){
                    let points3d: THREE.Vector3[] = [];
                    for(let i=0; i<width; i++){
                        const pos = j*width + i;
                        const gray = grayDepthMap[pos];

                        // if(gray === 0x00)
                        //     continue;

                        let x = (link.size.x * (i - width/2))/width;
                        let y = (link.size.y * (j - height/2))/height;
                        let z = -link.size.z * gray / 255;

                        let point = {
                            x: x,
                            y: y,
                            z: z,
                        };

                        points3d.push( new THREE.Vector3(point.x, point.y, point.z) );
                        workPoints.push(point);
                    }

                    const geometryByGray = new THREE.BufferGeometry().setFromPoints(points3d);
                    const line = new THREE.Line(geometryByGray, material);
                    line.computeLineDistances();

                    groupGray.add(line);
                }

                if(link.parentObject !== null && link.parentObject instanceof InitialBlank){
                    const p = link.group.position;
                    groupGray.position.copy(p);
                    groupGray.rotation.copy(link.group.rotation);
                    groupGray.position.z = 0;

                    const supportObj = new CamSupportObject(groupGray);
                    supportObj.caption = 'Path: '+supportObj.uuid.split('-').splice(-1);
                    link.parentObject.addSupportObject(supportObj);
                }

                if(typeof this._funcFinishScanDepth === 'function'){
                    this._funcFinishScanDepth({ link, workPoints, clayGeometry });
                }

            });
        });

        sd.setGeometry(link.model.mesh.geometry.clone());

    }

    runStrategiesToLinkModel(link: StlModelLink, workPoints: Point3[], strategies: Strategy[]){
        strategies.forEach(strategy => {
            strategy.run(workPoints);
        });
    }

    onFinishScanDepth(func: Function){
        this._funcFinishScanDepth = func;
    }

}

export default Analyse;
