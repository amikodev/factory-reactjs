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

import { Point3 } from "../../CamObject";
import { StlModelLink } from "../../StlModel";
import Strategy from "./Strategy";


export type OnePath3DStrategyParams = {
    link?: StlModelLink;
    clayGeometry?: THREE.BufferGeometry;
}


class OnePath3DStrategy extends Strategy{

    private _params: OnePath3DStrategyParams;

    private _lastPx: number = -1;
    private _lastPy: number = -1;

    private _nx: number = 0;
    private _ny: number = 0;

    private _accuracy: number;

    constructor(params: OnePath3DStrategyParams, accuracy: number = 0.1){
        super();

        this._params = params;
        this._accuracy = accuracy;

    }

    public run(workPoints: Point3[]){

        const accuracy = this._accuracy;   // точность в мм

        const clayGeometry = this._params.clayGeometry;
        const link = this._params.link;

        if(!clayGeometry || !link)
            return;

        this._nx = Math.floor(link.size.x *1/accuracy);
        this._ny = Math.floor(link.size.y *1/accuracy);

        let progressPerc = 100;
        let time0 = new Date().getTime();
        let workPos = 0;
        while(workPos < workPoints.length *(progressPerc/100)){
            let wPoint = workPoints[workPos];
            // this.clayCircleDown(wPoint.x+50, wPoint.y+50, 0.2, wPoint.z, false);
            this.clayCircleDown(wPoint.x + link.size.x/2, -wPoint.y + link.size.y/2, 0.2, wPoint.z, false);

            workPos += 1;
        }
        console.log('duration', (new Date().getTime())-time0, 'msec');

        clayGeometry.attributes.position.needsUpdate = true;
        clayGeometry.computeBoundingBox();
        clayGeometry.computeVertexNormals();
    }

    private clayCircleDown(x: number, y: number, diam: number, zDepth: number, needsUpdate: boolean){

        const accuracy = this._accuracy;   // точность в мм

        const clayGeometry = this._params.clayGeometry;

        if(!clayGeometry)
            return;

        let px = Math.floor(x * 1/accuracy);
        let py = Math.floor(y * 1/accuracy);

        const positionAttribute = clayGeometry.attributes.position;

        if(px === this._lastPx && py === this._lastPy)
            return;

        const pd = Math.floor(diam/2 * 1/accuracy);

        for(let j=-pd; j<pd; j++){
            let curPy = py+j;
            if(curPy < 0 || curPy >= this._ny)
                continue;

            let pdx = Math.floor(Math.sqrt(pd*pd - j*j));
            for(let i=-pdx; i<pdx; i++){
                let curPx = px+i;
                if(curPx < 0 || curPx >= this._nx)
                    continue;

                let index = (curPy*(this._nx+1) + curPx);

                let clayZ = positionAttribute.getZ(index);
                if(clayZ > zDepth){
                    positionAttribute.setZ(index, zDepth);
                }
            }
        }

        if(needsUpdate){
            clayGeometry.attributes.position.needsUpdate = true;
            clayGeometry.computeBoundingBox();
            clayGeometry.computeVertexNormals();
        }

        this._lastPx = px;
        this._lastPy = py;
    }

}

export default OnePath3DStrategy;
