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

import {v4 as uuidv4} from 'uuid';

// import FileSystem from '../../../FileSystem.js';

import { DispatchableEvent } from './EventDispatcher';

import CamObject from './CamObject';
import { Point3, Point3Array, CamObjectParams, CamBoundSize } from './CamObject';

const CAM_TYPE: string = 'StlModel';
const CAM_TYPE_LINK: string = 'StlModelLink';

// const material = new THREE.MeshBasicMaterial( { color: 0x888888, side: THREE.DoubleSide, transparent: true, opacity: 0.8 } );
// const material = new THREE.MeshBasicMaterial( { color: 0x888888, side: THREE.DoubleSide } );
const material = new THREE.MeshStandardMaterial( { color: 0x888888 } );


/**
 * STL модель
 */
class StlModel extends CamObject{

    private fname: string = '';
    private name: string = '';
    // private caption: string = '';
    // private _mesh: THREE.Mesh = new THREE.Mesh();
    private _boundSize: CamBoundSize = {width: 0, height: 0, depth: 0};
    private _meshLoaded: boolean = false;

    constructor(){
        super();

        this._uuid = uuidv4().toUpperCase();
    

    }

    // GetUuid(): string{
    //     return this.uuid;
    // }

    set mesh(mesh: THREE.Mesh){
        this._mesh = mesh;
        this._meshLoaded = true;
    }

    get mesh(): THREE.Mesh{
        return this._mesh;
    }

    set boundSize(size: CamBoundSize){
        this._boundSize = size;
    }

    get boundSize(): CamBoundSize{
        return this._boundSize;
    }

    get meshLoaded(): boolean{
        return this._meshLoaded;
    }

    // readMesh(func: CallableFunction){

    //     if(!this._meshLoaded){
    //         (async () => {
    //             // чтение модели из файла
    //             const fname = this.fname;
    //             const fs: any = (new FileSystem()) as any;

    //             const content = await fs.readFileArrayBuffer(fname);
    //             const loader = new STLLoader();
    //             const geometry = loader.parse(content);
    
    //             parseGeometrySTLModel(geometry, (stlMesh, boundSize) => {
    //                 stlModel.mesh = stlMesh;
    //                 stlModel.boundSize = boundSize;
    //                 applyStl();
    //             });

    //         })();
    //     } else{
    //         applyStl();
    //     }


    // }

}

/**
 * Привязка к STL модели
 */
class StlModelLink extends CamObject{

    // private uuid: string;
    private _model: StlModel;
    private _faceGroupIndex: number = -1;
    // private _boundSize: CamBoundSize = {width: 0, height: 0, depth: 0};
    // private _group: THREE.Group = new THREE.Group();
    // private 

    constructor(model: StlModel){
        super();

        this._uuid = uuidv4().toUpperCase();
        this._model = model;

    }

    get model(): StlModel{
        return this._model;
    }

    set faceGroupIndex(index: number){
        this._faceGroupIndex = index;
    }

    get faceGroupIndex(): number{
        return this._faceGroupIndex;
    }

    // set group(gr: THREE.Group){
    //     this._group = gr;
    // }

    // get group(): THREE.Group{
    //     return this._group;
    // }

    get mesh(): THREE.Mesh{
        return <THREE.Mesh>this._group.children[0];
    }

    get caption(): string{
        return 'STL: '+this.uuid.split('-').splice(-1);
    }

    get dataForSave(): any{

        // let params: any = Object.assign({}, this.params, this._model.boundSize);

        return {
            type: CAM_TYPE_LINK,
            uuid: this._uuid,
            faceGroupIndex: this._faceGroupIndex,
            model: {
                uuid: this._model.uuid,
            },
            params: this.params,
        };
    }


    set size(p: Point3){

        // console.log('size', p, this._group);

        this._size = p;

        const scale: Point3 = {
            x: this._size.x / this._model.boundSize.width, 
            y: this._size.y / this._model.boundSize.height, 
            z: this._size.z / this._model.boundSize.depth, 
        };

        this._group.scale.set(scale.x, scale.y, scale.z);

        this._events.eventDispatch(new DispatchableEvent('size', {size: p}));
    }
    
    get size(): Point3{
        return this._size;
    }


    // /**
    //  * Установка параметров
    //  */
    //  setParams(params: CamObjectParams){

    //     // this.setSize(params.size);

    //     this.size = params.size;
    //     this.position = params.position;
    //     this.rotation = params.rotation;
    //     this.visible = params.visible;

    // }





}

export { StlModel, StlModelLink };

export {
    CAM_TYPE, CAM_TYPE_LINK, 
    material, 
};

