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


import React from 'react';
import { Button } from '@material-ui/core';

import { Point3 } from '../equipment/cnc5AxisRouter/cam/CamObject';
import { StlModel, StlModelLink } from '../equipment/cnc5AxisRouter/cam/StlModel';

import DraftMill3DStrategy from '../equipment/cnc5AxisRouter/cam/analyse/strategy/DraftMill3DStrategy';
import { ScanAreaPath, PathPoint } from '../equipment/cnc5AxisRouter/cam/analyse/strategy/DraftMill3DStrategy';



interface IProps{};
interface IState{
    x: number;
    y: number;
    xa: number;
    ya: number;    
};

class PageStrategy extends React.Component<IProps, IState>{

    private refCanvas: React.RefObject<HTMLCanvasElement>;
    private ctx: CanvasRenderingContext2D | null = null;
    private canvasData: ImageData = new ImageData(1, 1);
    private canvasWidth: number = 0;
    private canvasHeight: number = 0;

    private draftMillStrategy: DraftMill3DStrategy | null = null;

    constructor(props: any){
        super(props);

        this.state = {
            x: 0,
            y: 0,
            xa: 0,
            ya: 0,
        };

        this.refCanvas = React.createRef();


    }

    componentDidMount(){

        let dataGrayMap: Array<Point3> = [];
        try{
            dataGrayMap = require('./model1.json');
        } catch(e){
            throw new Error('dataGrayMap not defined');
        }


        // console.log(dataGrayMap, dataGrayMap.length);

        const canvas = this.refCanvas.current;
        if(canvas === null) return;

        let ctx = canvas.getContext('2d');
        if(ctx === null || ctx === undefined) return;

        this.ctx = ctx;
        this.canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;



        let t0 = new Date().getTime();
        let minZ = 1000;
        let maxZ = -1000;
        dataGrayMap.forEach((point: Point3) => {
            if(minZ > point.z) minZ = point.z;
            if(maxZ < point.z) maxZ = point.z;
            
        });
        console.log('dt:',(new Date().getTime()-t0), 'ms');
        console.log({minZ, maxZ});

        // // запуск стратегий обработки
        const accuracy = 0.1;
        // analyse.runStrategiesToLinkModel(link, workPoints, [
        //     new OnePath3DStrategy({ link, clayGeometry }, accuracy),
        // ]);


        const model = new StlModel();
        const link = new StlModelLink(model);
        link.size = {x: 99.399, y: 99.399, z: 10.325};


        const width = Math.floor(link.size.x *1/accuracy);
        const height = Math.floor(link.size.y *1/accuracy);

        canvas.width = width;
        canvas.height = height;
        this.canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;


        let currentZ = -0.8;

        let x = 0, y = 0;
        dataGrayMap.forEach((point: Point3) => {

            // DEBUG !!!
            // if(point.x > -2 && point.x < 2 && point.y < 0) point.z = 0;    // DEBUG !!!
            // if(point.y > -2 && point.y < 2) point.z = 0;        // DEBUG !!!
            // if(point.x > -15 && point.x < 35 && point.y > -2 && point.y < 2) point.z = 0;   // DEBUG !!!
            // if(point.x > -15 && point.x < -10 && point.y > 0 && point.y < 40) point.z = 0;  // DEBUG !!!
            // if(point.x > 10 && point.x < 15 && point.y > 0 && point.y < 15) point.z = 0;    // DEBUG !!!
            // if(point.x > 20 && point.y < -20) point.z = -4;     // DEBUG !!!
            // if(point.x > -12 && point.x < -11 && point.y > -21 && point.y < -13) point.z = 0;
            // if(point.x > 4.5 && point.x < 9 && point.y > -45 && point.y < -42) point.z = -4;
            
            // if(point.y < -36) point.z = 0;
            // if(point.y < -20 && (point.x < -23 || point.x > 23)) point.z = 0;

            // let x = Math.floor(point.x *1/accuracy +width/2);
            // let y = Math.floor(point.y *1/accuracy +height/2);
            let gray = (point.z-minZ) * (0xFF-0x00) / (maxZ-minZ) + 0x00;

            // gray = point.z < -1.4 ? 0x80 : gray;
            gray = point.z < currentZ ? 0xB0 : 0xFF;

            this.drawPixelGray(x, y, gray);

            x++;
            if(x >= width){
                x = 0;
                y++;
            }
            
        });


        this.updateCanvas();

        let diam = 8;
        let r = diam/2;
        let ra = r *1/accuracy;

        // let diamDraftDelta = 2;
        // let rDraft = (diam+diamDraftDelta)/2;
        // let rDraftA = rDraft *1/accuracy;



        this.draftMillStrategy = new DraftMill3DStrategy({
            link: link,
            diam: 8,
            diamDraftDelta: 2,
        }, accuracy);

        this.draftMillStrategy.run(dataGrayMap);
        // console.log(this.draftMillStrategy.areas);

        console.log( 'rDraftA:', this.draftMillStrategy.rDraftA );



        // const maxDistA = Math.sqrt(width*width + height*height);

        // const areas = findSubAreas();
        const areas = this.draftMillStrategy.areas;
        console.log('areas', areas);

        let lastPP: PathPoint | null = null;

        areas.forEach((area, areaInd) => {
            if(area.entryPointFounded){

                if(ctx === null) return;

                let xca1 = area.entrance.p1.x *1/accuracy;
                let yca1 = area.entrance.p1.y *1/accuracy;

                ctx.beginPath();
                ctx.ellipse(xca1, yca1, ra, ra, 0, 0, Math.PI*2);
                ctx.fillStyle = '#877';
                ctx.fill();

                let xca2 = area.entrance.p2.x *1/accuracy;
                let yca2 = area.entrance.p2.y *1/accuracy;

                ctx.beginPath();
                ctx.ellipse(xca2, yca2, ra, ra, 0, 0, Math.PI*2);
                ctx.fillStyle = '#787';
                ctx.fill();

                // findPerimeterPath(area, 10000, xca1, yca1);
                // console.log('findCorrectionPath end');



                const drawAreaPath = (paths: ScanAreaPath[], color: string) => {
                    paths.forEach(path => {
                        const pathPoints = path.points;
    
                        // нарисовать путь движения
                        // let lastPP: PathPoint | null = null;
                        pathPoints.forEach((pp, ind) => {
                            if(ctx === null) return;
            
                            let xa = pp.x *1/accuracy;
                            let ya = pp.y *1/accuracy;
    
                            let isFastMove = false;
                            if(lastPP !== null && ind === 0){
                                isFastMove = true;
                            }
            
                            if(lastPP !== null){
                                let lxa = lastPP.x *1/accuracy;
                                let lya = lastPP.y *1/accuracy;
                
                                if(!isFastMove){
                                    ctx.beginPath();
                                    ctx.moveTo(lxa, lya);
                                    ctx.lineTo(xa, ya);
                                    ctx.strokeStyle = color;
                                    ctx.lineWidth = 2;
                                    ctx.setLineDash([]);
                                    ctx.stroke();
                                } else{
                                    ctx.beginPath();
                                    ctx.moveTo(lxa, lya);
                                    ctx.lineTo(xa, ya);
                                    ctx.strokeStyle = '#66A';
                                    ctx.lineWidth = 2;
                                    ctx.setLineDash([5, 5]);
                                    ctx.stroke();
                                }
                            }
            
                            ctx.beginPath();
                            ctx.ellipse(xa, ya, 4, 4, 0, 0, Math.PI*2);
                            ctx.fillStyle = color;
                            ctx.fill();
            
                            // окружности на первой и последней точках пути
                            if(ind === 0){
                                ctx.beginPath();
                                ctx.ellipse(xa, ya, 9, 9, 0, 0, Math.PI*2);
                                ctx.strokeStyle = color;
                                ctx.lineWidth = 1;
                                ctx.stroke();
                            } else if(ind === pathPoints.length-1){
                                ctx.beginPath();
                                ctx.ellipse(xa, ya, 14, 14, 0, 0, Math.PI*2);
                                ctx.strokeStyle = color;
                                ctx.lineWidth = 1;
                                ctx.stroke();
                            }
            
                            lastPP = pp;
                        });
                    });            
                }
        

                drawAreaPath(area.paths, '#F00');
                drawAreaPath(area.perimeterPaths, '#00C');

            }
        });
    }

    drawPixelGray(x: number, y: number, gray: number){

        x = Math.floor(x);
        y = Math.floor(y);

        const offset = (y*this.canvasWidth + x) *4;
        this.canvasData.data[offset+0] = gray;      // r
        this.canvasData.data[offset+1] = gray;      // g
        this.canvasData.data[offset+2] = gray;      // b
        this.canvasData.data[offset+3] = 0xFF;      // a

    }

    drawPixel(x: number, y: number, r: number, g: number, b: number, a: number=0xFF){

        x = Math.floor(x);
        y = Math.floor(y);

        const offset = (y*this.canvasWidth + x) *4;
        this.canvasData.data[offset+0] = r;      // r
        this.canvasData.data[offset+1] = g;      // g
        this.canvasData.data[offset+2] = b;      // b
        this.canvasData.data[offset+3] = a;      // a

    }

    updateCanvas(){
        if(this.ctx === null) return;

        this.ctx.putImageData(this.canvasData, 0, 0);
    }

    uploadCanvas(){
        if(this.ctx === null) return;

        this.canvasData = this.ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
    }

    handleMouseMove(event:any){
        // console.log(event, event.clientX, event.pageX, event.movementX);
        let x = (event.pageX-20) - this.canvasWidth/2;
        let y = (event.pageY-20) - this.canvasHeight/2;

        x /= 10;
        y /= 10;


        this.setState({x, y, xa: event.pageX-20, ya: event.pageY-20});
    }


    render(){
        return (
            <>
            <div style={{
                padding: 20,
                float: 'left',
            }}>
                <canvas 
                    ref={this.refCanvas} width={1000} height={1000} style={{border: '1px #CCC solid'}}
                    onMouseMove={e => this.handleMouseMove(e)}
                />
            </div>

            <div style={{
                padding: 20,

            }}>
                
                <Button variant="contained">button</Button> <br/><br/>
                x: {this.state.x}; y: {this.state.y} <br/>
                xa: {this.state.xa}; ya: {this.state.ya} <br/>

            </div>

            </>
        );
    }

}

export default PageStrategy;
