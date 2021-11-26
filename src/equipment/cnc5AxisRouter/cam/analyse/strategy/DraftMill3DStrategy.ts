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

// import * as THREE from 'three';

import { Point2, Point3 } from "../../CamObject";
import { StlModelLink } from "../../StlModel";
import Strategy from './Strategy';


export type ScanAreaMapPoint = {
    mapX: number;
    mapY: number;
}

export type ScanAreaEntrance = {
    p1: ScanAreaMapPoint;
    p2: ScanAreaMapPoint;
};

export type ScanAreaPath = {
    points: PathPoint[];
};

export type ScanArea = {
    entryPointFounded: boolean;
    entranceMap: ScanAreaEntrance;
    entrance: {
        p1: Point2;
        p2: Point2;
    };
    paths: ScanAreaPath[];
    perimeterPaths: ScanAreaPath[];
};

export type ScanDir = {
    founded: boolean;
    free: boolean;
    xa: number;
    ya: number;
    distance: number;
};

export type ScanDirIndex = {
    sd: ScanDir;
    dirIndex: number;
};

export type PathPoint = {
    x: number;
    y: number;    
};

export enum Direction{
    Up = -90, Down = 90, Left = 180, Right = 0
};

export const directions = [ Direction.Left, Direction.Up, Direction.Right, Direction.Down ];


export type DraftMill3DStrategyParams = {
    link?: StlModelLink;
    clayGeometry?: THREE.BufferGeometry;

    diam: number;
    diamDraftDelta: number;
};


class DraftMill3DStrategy extends Strategy{

    private _params: DraftMill3DStrategyParams;

    private _lastPx: number = -1;
    private _lastPy: number = -1;

    private _nx: number = 0;
    private _ny: number = 0;

    private _accuracy: number;

    private _r: number;
    private _ra: number;
    private _rDraftA: number; 

    // process areas
    private _workPoints: Point3[] = [];
    private _currentZ: number = 0;
    private _areas: ScanArea[] = [];
    private _scanWidth: number = 0;
    private _scanHeight: number = 0;
    private _map: Uint8Array = new Uint8Array(0);   // карта черновой обработки
    private _areaFirstPointFounded: boolean = false;
    private _areaEntrance: ScanAreaEntrance = {
        p1: {mapX: 0, mapY: 0},
        p2: {mapX: 0, mapY: 0},
    };


    constructor(params: DraftMill3DStrategyParams, accuracy: number = 0.1){
        super();

        this._params = params;
        this._accuracy = accuracy;

        this._r = params.diam/2;
        this._ra = this._r *1/accuracy;

        let rDraft = (params.diam+params.diamDraftDelta)/2;
        this._rDraftA = rDraft *1/accuracy;

    }

    public run(workPoints: Point3[]){

        const accuracy = this._accuracy;   // точность в мм

        // const clayGeometry = this._params.clayGeometry;
        const link = this._params.link;

        // if(!clayGeometry || !link)
        //     return;

        if(!link)
            return;

        this._nx = Math.floor(link.size.x *1/accuracy);
        this._ny = Math.floor(link.size.y *1/accuracy);

        this._workPoints = workPoints;
        this._currentZ = -0.8;

        this.processAreas();

    }

    /**
     * Поиск поверхностей
     */
    private findSubAreas(){

        const link = this._params.link;
        if(!link) return [];

        const diam = this._params.diam;
        const r = this._r;
        const accuracy = this._accuracy;
        const rDraftA = this._rDraftA;
        const width = this._nx;
        const height = this._ny;

        const scanWidth = Math.floor(link.size.x/diam*2-1);
        const scanHeight = Math.floor(link.size.y/diam*2-1);
        this._scanWidth = scanWidth;
        this._scanHeight = scanHeight;

        /**
         * Грубая карта всей поверхности.
         * Значение:
         *   0 - недоступно для обработки
         *   1 - доступно для обработки
         *   2 - определено как под-поверхность
         *   3 - путь для выборки внутренней части
         */
        const map = new Uint8Array(scanWidth*scanHeight);
        this._map = map;

        for(let k2=0; k2<scanHeight; k2++){
            for(let k1=0; k1<scanWidth; k1++){
                let xc = (k1*diam/2 + r);
                let yc = (k2*diam/2 + r);
                
                let xca = xc *1/accuracy;
                let yca = yc *1/accuracy;

                // проверка того, что текущий участок под фрезой свободен
                let avail = true;
                for(let j=-rDraftA; j<rDraftA; j++){
                    let dx = Math.sqrt( rDraftA*rDraftA - j*j );
                    for(let i=-dx; i<dx; i++){
                        if(xca+i < 0 || xca+i >= width || yca+j < 0 || yca+j >= height)
                            continue;
    
                        let index = (yca+j)*width + (xca+i);
                        index = Math.floor(index);
                        let point = this._workPoints[index];
    
                        if(point.z > this._currentZ){
                            avail = false;
                            break;
                        }
                    }
                    if(!avail) break;
                }
    
                if(avail){
                    let mapOffset = k2*scanWidth + k1;
                    map[mapOffset] = 1;
                }
            }
        }

        this.findAreas();
        this.findDraftPathInAreas();
    }

    /**
     * Сканирование направления на предмет столкновения с препятствием
     * @param dirAngle угол направления, градусы
     * @param maxDistanceA максимальная дистанция
     * @param xca начальная координата X
     * @param yca начальная координата Y
     * @param diamA диаметр окружности инструмента
     */
    private scanDirection(dirAngle: number, maxDistanceA: number, xca: number, yca: number, diamA: number): ScanDir{

        const width = this._nx;
        const height = this._ny;

        const a = dirAngle *Math.PI/180;

        let a1 = a - 90 *Math.PI/180;
        let a2 = a + 90 *Math.PI/180;

        const ra = diamA/2;
        const dAngle = Math.PI/180;

        let collisionFounded = false;
        let fxa = 0;
        let fya = 0;
        let free = true;

        for(let j=0; j<=maxDistanceA; j++){
            if(collisionFounded) break;

            // центр сканируемой окружности
            let x = xca + j * Math.cos(a);
            let y = yca + j * Math.sin(a);

            if(x < 0 || x >= width || y < 0 || y >= height){
                fxa = x;
                fya = y;
                if(x < 0) fxa = 0; else if(x >= width) fxa = width-1;
                if(y < 0) fya = 0; else if(y >= height) fya = height-1;
                collisionFounded = true;
                break;
            }
    
            // проход по дуге
            for(let i=a1; i<=a2; i += dAngle){
                let sx = x + ra * Math.cos(i);
                let sy = y + ra * Math.sin(i);
                sx = Math.floor(sx);
                sy = Math.floor(sy);

                if(sx < 0 || sx >= width || sy < 0 || sy >= height)
                    continue;

                let index = (sy)*width + (sx);
                index = Math.floor(index);

                let point = this._workPoints[index];
                if(point.z > this._currentZ){
                    collisionFounded = true;
                    fxa = x;
                    fya = y;
                    break;
                }
            }

            if(!collisionFounded){
                fxa = x;
                fya = y;
            }
        }

        const dx = fxa - xca;
        const dy = fya - yca;

        const distance = Math.sqrt(dx*dx + dy*dy);

        return {founded: collisionFounded, free, xa: fxa, ya: fya, distance};
    }


    /**
     * Поиск точек периметра
     * @param xca начальная координата X
     * @param yca начальная координата Y
     */
    private findPerimeterPath(area: ScanArea, maxStepsCount: number, xca: number, yca: number){
        
        let sd = this.scanDirection(Direction.Left, this._rDraftA*2, xca, yca, this._rDraftA*2);

        const perimeterFirstXa = sd.xa;
        const perimeterFirstYa = sd.ya;

        let xa = sd.xa;
        let ya = sd.ya;

        let lastXa = xa;
        let lastYa = ya;
        let vectorAngle = Math.atan2(ya-lastYa, xa-lastXa);

        let pointsCount = 1;
        let path: ScanAreaPath = {
            points: []
        };

        path.points.push({
            x: xca *this._accuracy,
            y: yca *this._accuracy
        });

        let dirIndex = 0;

        const calcDirIndex = (index: number) => {
            if(index < 0) index = directions.length + index;
            else if(index > directions.length-1) index = directions.length - index;
            return index;
        }


        let last4Points: [number, number][] = [];
        let last6Points: [number, number][] = [];


        let maxDistCount = 0;

        let c = 0;
        while(c < maxStepsCount){

            if(c > 5 && Math.abs(xa - perimeterFirstXa) <= 2 && Math.abs(ya - perimeterFirstYa) <= 2){
                // console.log('FINISH', c, '; pointsCount', pointsCount);
                break;
            }

            if(lastXa !== xa || lastYa !== ya){

                let currentVectorAngle = Math.atan2(ya-lastYa, xa-lastXa);
                if(currentVectorAngle !== vectorAngle){
                    const point: PathPoint = {
                        x: xa *this._accuracy,
                        y: ya *this._accuracy
                    };
                    path.points.push(point);

                    pointsCount++;
                    vectorAngle = currentVectorAngle;
                }

                lastXa = xa;
                lastYa = ya;
            }

            let collisioned = true;
            let dirCounter = 0;
            while(collisioned && dirCounter < directions.length){

                sd = this.scanDirection(directions[dirIndex], 20, xa, ya, this._rDraftA*2);

                // поиск паразитной зацикленности
                const searchParasiticLooping = (scanDir: ScanDir, dirIndex: number): ScanDirIndex => {

                    let sd: ScanDir = scanDir;

                    enum ParasitPointsCount{
                        Count4 = 4,
                        Count6 = 6
                    };

                    const scanLastPoints = (lp: [number, number][], pointsCount: ParasitPointsCount): ScanDirIndex => {
                        lp.push([sd.xa, sd.ya]);
                        if(lp.length > pointsCount*2){
                            lp.shift();
                        }
                        if(lp.length === pointsCount*2){
                            let pointsEquals = true;
                            for(let i=0; i<pointsCount; i++){
                                if(lp[i][0] !== lp[i+pointsCount][0] || lp[i][1] !== lp[i+pointsCount][1]){
                                    pointsEquals = false;
                                    break;
                                }
                            }
                            if(pointsEquals){
                                // parasitic looping

                                let sd2 = this.scanDirection(directions[3], 20, sd.xa-1, sd.ya, this._rDraftA*2);
                                dirIndex = 2;
                                if(sd2.distance >= 20){
                                    let sd3 = this.scanDirection(directions[dirIndex], 20, sd2.xa, sd2.ya, this._rDraftA*2);
                                    if(sd3.distance < 20){
                                        sd = sd3;
                                    }
                                } else if(sd2.distance === 0){
                                    dirIndex = 1;
                                    let sd4 = this.scanDirection(directions[dirIndex], 20, sd.xa+1, sd.ya, this._rDraftA*2);
                                    sd = sd4;
                                } else{
                                    sd = sd2;
                                }
                            }
                        }

                        return {sd, dirIndex};
                    }

                    let sdi: ScanDirIndex;

                    sdi = scanLastPoints(last4Points, ParasitPointsCount.Count4);
                    sd = sdi.sd;
                    dirIndex = sdi.dirIndex;

                    sdi = scanLastPoints(last6Points, ParasitPointsCount.Count6);
                    sd = sdi.sd;
                    dirIndex = sdi.dirIndex;
                    
                    return {sd, dirIndex};
                }

                const sdi = searchParasiticLooping(sd, dirIndex);
                sd = sdi.sd;
                dirIndex = sdi.dirIndex;


                if(!sd.founded || sd.distance > 1){

                    let angle = directions[dirIndex] *Math.PI/180;

                    let dx = Math.floor( 1 * Math.cos( angle ) );
                    let dy = Math.floor( 1 * Math.sin( angle ) );

                    xa += dx;
                    ya += dy;

                    if(sd.distance === 20){
                        maxDistCount++;
                    } else{
                        if(maxDistCount >= 3){
                            maxDistCount = 0;

                            let dirIndex2 = calcDirIndex(dirIndex+1);
                            let angle2 = directions[dirIndex2] *Math.PI/180;

                            xa += 1 * Math.cos( angle2 );
                            ya += 1 * Math.sin( angle2 );

                            let sd2 = this.scanDirection(directions[dirIndex], 20, xa, ya, this._rDraftA*2);

                            xa = sd2.xa;
                            ya = sd2.ya;
                        }
                    }
        
                    collisioned = false;
                    dirIndex = calcDirIndex(dirIndex-1);
                    break;
                }

                // if(maxDistCount >= 3){

                // }
                maxDistCount = 0;

                xa = sd.xa;
                ya = sd.ya;

                dirIndex = calcDirIndex(dirIndex+1);
                dirCounter++;
            }

            c++;
        }

        const point: PathPoint = {
            x: xa *this._accuracy,
            y: ya *this._accuracy
        };
        path.points.push(point);

        area.perimeterPaths.push(path);
    }


    /**
     * Процесс поиска путей на текущем слое _currentZ
     */
    private processAreas(){
        this.findSubAreas();

        this._areas.forEach((area, areaInd) => {
            if(area.entryPointFounded){

                let xca1 = area.entrance.p1.x *1/this._accuracy;
                let yca1 = area.entrance.p1.y *1/this._accuracy;

                // let xca2 = area.entrance.p2.x *1/this._accuracy;
                // let yca2 = area.entrance.p2.y *1/this._accuracy;

                this.findPerimeterPath(area, 10000, xca1, yca1);
            }
        });
    }

    /**
     * Получение значения ячейки карты черновой обработки
     * @param sx x
     * @param sy y
     */
    getMapCell(sx: number, sy: number): number{
        if(sx < 0 || sx >= this._scanWidth || sy < 0 || sy >= this._scanHeight)
            return -1;

        let offset = sy*this._scanWidth + sx;
        return this._map[offset];
    }

    /**
     * 
     * @param sx x
     * @param sy y
     */
    fillArea(sx: number, sy: number){
        let mapCell = this.getMapCell(sx, sy);

        if(mapCell === 1){
            let offset = sy*this._scanWidth + sx;
            this._map[offset] = 2;

            if(!this._areaFirstPointFounded){
                [
                    [sx-1, sy],
                    [sx+1, sy],
                    [sx, sy-1],
                    [sx, sy+1],
                ].forEach(el => {
                    if(this._areaFirstPointFounded) return;

                    if([1, 2].includes( this.getMapCell(el[0], el[1]) )){
                        this._areaFirstPointFounded = true;
                        this._areaEntrance.p1 = {mapX: sx, mapY: sy};
                        this._areaEntrance.p2 = {mapX: el[0], mapY: el[1]};
                    }
                });
            }

            this.fillArea(sx+0, sy-1);
            this.fillArea(sx+1, sy+0);
            this.fillArea(sx+0, sy+1);
            this.fillArea(sx-1, sy+0);
        }
    }

    /**
     * Поиск поверхностей для обработки
     */
    findAreas(){
        const areaEntrance = this._areaEntrance;
        const r = this._r;

        for(let i=0; i<this._map.length; i++){
            if(this._map[i] === 1){

                let mapX = i % this._scanWidth;
                let mapY = Math.floor(i/this._scanWidth);

                this._areaFirstPointFounded = false;
                this.fillArea(mapX, mapY);

                let area: ScanArea = {
                    entryPointFounded: this._areaFirstPointFounded,
                    entranceMap: Object.assign({}, areaEntrance),
                    entrance: {
                        p1: {x: areaEntrance.p1.mapX * r + r, y: areaEntrance.p1.mapY * r + r},
                        p2: {x: areaEntrance.p2.mapX * r + r, y: areaEntrance.p2.mapY * r + r},
                    },
                    paths: [],
                    perimeterPaths: [],
                };

                this._areas.push(area);
            }
        }
    }

    /**
     * Поиск путей для черновой обработки
     */
    findDraftPathInAreas(){

        const r = this._r;

        let path: ScanAreaPath = {
            points: []
        };

        let lastSx: number = -1;
        let lastSy: number = -1;

        let vectorAngle = -0.1;

        const addPoint = (sx: number, sy: number) => {
            let point: PathPoint = {
                x: sx * r + r, 
                y: sy * r + r
            };

            let currentVectorAngle = Math.atan2(sy-lastSy, sx-lastSx);
            if(path.points.length >= 2){
                if(currentVectorAngle === vectorAngle){
                    path.points.splice(-1, 1);      // remove last item
                }
            }
            vectorAngle = currentVectorAngle;
            path.points.push(point);
        }

        const sumDist = (sx: number, sy: number): number => {
            const sDist = Math.abs(sx-lastSx) + Math.abs(sy-lastSy);
            return sDist;
        }

        const findPath = (area: ScanArea, sx: number, sy: number) => {
            let mapCell = this.getMapCell(sx, sy);

            const matr: [number, number][] = [ [sx-1, sy], [sx+1, sy], [sx, sy-1], [sx, sy+1] ];

            if(mapCell === 2){
                let offset = sy*this._scanWidth + sx;
                this._map[offset] = 3;

                // случай быстрого перехода
                if(sumDist(sx, sy) === 2){

                    // простое решение на один шаг
                    let needMapPointFounded = false;
                    matr.forEach((el: [number, number]) => {
                        if(needMapPointFounded) return;
                        if( this.getMapCell(el[0], el[1]) === 3 && sumDist(el[0], el[1]) === 1 ){
                            needMapPointFounded = true;
                            addPoint(el[0], el[1]);
                            lastSx = el[0]; lastSy = el[1];
                        }
                    });

                } else if(sumDist(sx, sy) > 2){

                    // длинный переход
                    let needMapPointFounded = false;
                    matr.forEach((el: [number, number]) => {
                        if(needMapPointFounded) return;
                        if( this.getMapCell(el[0], el[1]) === 3 ){
                            needMapPointFounded = true;
                            // начало нового пути
                            area.paths.push(path);
                            path = {
                                points: []
                            };
                            vectorAngle = -0.1;
                            addPoint(el[0], el[1]);
                            lastSx = el[0]; lastSy = el[1];
                        }
                    });

                }

                addPoint(sx, sy);

                lastSx = sx;
                lastSy = sy;

                findPath(area, sx+0, sy-1);
                findPath(area, sx+0, sy+1);
                findPath(area, sx+1, sy+0);
                findPath(area, sx-1, sy+0);
            }
        }

        this._areas.forEach(area => {
            path = {
                points: []
            };

            lastSx = area.entranceMap.p1.mapX;
            lastSy = area.entranceMap.p1.mapY;
            findPath(area, area.entranceMap.p1.mapX, area.entranceMap.p1.mapY);

            area.paths.push(path);
        });
    }




    get rDraftA(): number{
        return this._rDraftA;
    }

    get areas(): ScanArea[]{
        return this._areas;
    }



}


export default DraftMill3DStrategy;
