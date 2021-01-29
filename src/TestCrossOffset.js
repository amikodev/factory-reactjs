import React from 'react';

import Slider from '@material-ui/core/Slider';


import GCodeCR from './GCodeCompensationRadius';
import { COMPENSATION_NONE, COMPENSATION_LEFT, COMPENSATION_RIGHT } from './GCodeCompensationRadius';


const TYPE_LINE = 0;
const TYPE_CIRCLE = 1;

class TestCrossOffset extends React.Component{



    constructor(props){
        super(props);

        this.state = {
            cursorX: null,
            cursorY: null,
            angle: 0,
        };

        this._canvas = null;
        this._ctx = null;

        this.refCanvas = React.createRef();


        let path1 = [
            {type: TYPE_LINE, p1: {x: 100, y: 60}, p2: {x: 135, y: 70}},
            {type: TYPE_LINE, p1: null, p2: {x: 180, y: 140}},
            {type: TYPE_LINE, p1: null, p2: {x: 222, y: 113}},
            {type: TYPE_LINE, p1: null, p2: {x: 236, y: 71}},
            {type: TYPE_LINE, p1: null, p2: {x: 324, y: 112}},
            {type: TYPE_LINE, p1: null, p2: {x: 346, y: 258}},
            {type: TYPE_LINE, p1: null, p2: {x: 255, y: 258}},
            {type: TYPE_LINE, p1: null, p2: {x: 195, y: 318}},
            {type: TYPE_LINE, p1: null, p2: {x: 75, y: 198}},
            {type: TYPE_LINE, p1: null, p2: {x: 188, y: 245}},
            {type: TYPE_LINE, p1: null, p2: {x: 104, y: 154}},

            // {type: TYPE_LINE, p1: null, p2: {x: 0, y: 0}},
        ];


        let path2 = [
            {type: TYPE_LINE, p1: {x: 100, y: 60}, p2: {x: 135, y: 70}},
            {type: TYPE_LINE, p1: null, p2: {x: 180, y: 140}},

            // {type: TYPE_CIRCLE, p1: {x: 180, y: 140}, p2: {x: 222, y: 113}, r: 145, ccw: true },

            {type: TYPE_CIRCLE, p1: null, p2: {x: 222, y: 113}, r: 145, ccw: true },
            {type: TYPE_CIRCLE, p1: null, p2: {x: 236, y: 71}, r: -40, ccw: false},
            {type: TYPE_CIRCLE, p1: null, p2: {x: 324, y: 112}, r: 50, ccw: true},
            {type: TYPE_CIRCLE, p1: null, p2: {x: 344, y: 139}, r: 100, ccw: false},
            {type: TYPE_CIRCLE, p1: null, p2: {x: 288, y: 161}, r: 100, ccw: true},
            {type: TYPE_LINE, p1: null, p2: {x: 274, y: 178}},
            {type: TYPE_CIRCLE, p1: null, p2: {x: 278, y: 220}, r: 100, ccw: false},
            {type: TYPE_CIRCLE, p1: null, p2: {x: 346, y: 258}, r: 100, ccw: false},
            {type: TYPE_LINE, p1: null, p2: {x: 255, y: 260}},
            // {type: TYPE_CIRCLE, p1: null, p2: {x: 195, y: 318}, r: -60, ccw: true},
            {type: TYPE_CIRCLE, p1: null, p2: {x: 255, y: 300}, r: 40, ccw: true},
            {type: TYPE_CIRCLE, p1: null, p2: {x: 255, y: 340}, r: -40, ccw: true},
            {type: TYPE_LINE, p1: null, p2: {x: 75, y: 198}},
            {type: TYPE_CIRCLE, p1: null, p2: {x: 188, y: 245}, r: 140, ccw: true},
            {type: TYPE_LINE, p1: null, p2: {x: 104, y: 154}},
            {type: TYPE_LINE, p1: null, p2: {x: 90, y: 169}},
            {type: TYPE_LINE, p1: null, p2: {x: 65, y: 144}},

        ];

        let path3 = [
            {type: TYPE_CIRCLE, p1: {x: 116, y: 126}, p2: {x: 219, y: 209}, r: -120, ccw: true},
            {type: TYPE_CIRCLE, p1: null, p2: {x: 332, y: 219}, r: 160, ccw: false},
        ];


        this.path = path2;

        // this.paths = [path1];


    }

    componentDidMount(){

        let canvas = this.refCanvas.current;
        this._canvas = canvas;
        if(canvas.getContext){
            this._ctx = canvas.getContext('2d');
            GCodeCR.setCanvasContext(this._ctx);
            this.draw();
        }

    }

    /**
     * Рисование точки
     * @param point точка
     * @param color цвет
     */
    drawPoint(point, color){
        let _ctx = this._ctx;
        _ctx.beginPath();
        _ctx.arc(point.x, point.y, 2, 0, Math.PI*2, false);
        _ctx.fillStyle = color;
        _ctx.fill();
    }

    draw(){
        let _canvas = this._canvas;
        let _ctx = this._ctx;


        _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
        // around circle
        _ctx.beginPath();
        _ctx.arc(_canvas.width/2, _canvas.width/2, _canvas.width/2, 0, Math.PI*2, false);
        _ctx.setLineDash([1, 4]);
        _ctx.strokeStyle = "#888";
        _ctx.stroke();



        const rotate = (point, fi) => {
            let center = {x: _canvas.width/2, y: _canvas.height/2};

            let dx = point.x - center.x;
            let dy = point.y - center.y;

            let x = dx * Math.cos(fi) - dy * Math.sin(fi);
            let y = dx * Math.sin(fi) + dy * Math.cos(fi);
            x += center.x;
            y += center.y;

            return {x, y};
        }

        let lastP2 = null;
        let fi = this.state.angle/180*Math.PI;

        // рисование основной траектории
        this.path.map((p, ind) => {
            let { type, p1, p2 } = p;

            if(p1 === null){
                p1 = lastP2;
            }

            p1 = rotate(p1, fi);
            p2 = rotate(p2, fi);
        
            if(type === TYPE_LINE){

                _ctx.beginPath();
                _ctx.moveTo(p1.x, p1.y);
                _ctx.lineTo(p2.x, p2.y);
                _ctx.setLineDash([]);
                _ctx.strokeStyle = "#000";
                _ctx.stroke();

            } else if(type === TYPE_CIRCLE){

                let circle = GCodeCR.calcCircleByRadius(p1, p2, p.r, p.ccw);

                _ctx.beginPath();
                _ctx.arc(circle.center.x, circle.center.y, circle.r, circle.angle1, circle.angle2, !circle.ccw);
                _ctx.setLineDash([]);
                _ctx.strokeStyle = "#000";
                _ctx.stroke();

            }

            // this.drawPoint(p1, "#080");
            lastP2 = p2;
        });


        let lastPath = {
            path: null,
            left: null,
            right: null,
        };

        const drawLineOffset = (p1, p2, length, side) => {

            let { p1p, p2p, anglePerp } = GCodeCR.calcLineOffset(p1, p2, length, side);

            let lastEndPoint = null;

            if(lastPath.path !== null){

                let lastPathBySide = side === COMPENSATION_LEFT ? lastPath.left : lastPath.right;
                lastEndPoint = lastPathBySide.lastEndPoint;

                if(lastEndPoint === null){
                    lastEndPoint = lastPathBySide.p1;
                }

                if(lastPath.path.type === TYPE_LINE){

                    // точка пересечения отрезка на предыдущем участке пути и
                    // отрезком на текущем
                    let crossPoint;
                    let crossPointFounded = false;
                    try{
                        crossPoint = GCodeCR.calcCrossLines(lastPathBySide.p1, lastPathBySide.p2, p1p, p2p);
                        crossPointFounded = true;
                    } catch(e){
                    }
                    if(crossPointFounded && crossPoint.inner){       // точка пересечения внутри

                        // отрезок на предыдущем участке пути
                        // до точки пересечения отрезков
                        _ctx.beginPath();
                        _ctx.moveTo(lastEndPoint.x, lastEndPoint.y);
                        _ctx.lineTo(crossPoint.x, crossPoint.y);
                        _ctx.setLineDash([1, 4]);
                        _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                        _ctx.stroke();
            
                        // точка пересечения
                        this.drawPoint(crossPoint, side === COMPENSATION_LEFT ? "#080" : "#800");

                    } else{                     // окружность снаружи

                        // отрезок на предыдущем участке пути
                        // до конечной точки этого отрезка
                        _ctx.beginPath();
                        _ctx.moveTo(lastEndPoint.x, lastEndPoint.y);
                        _ctx.lineTo(lastPathBySide.p2.x, lastPathBySide.p2.y);
                        _ctx.setLineDash([1, 4]);
                        _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                        _ctx.stroke();
                
                        if(!GCodeCR.pointsIsEqual(p1, p2)){
                            // соединяющий сегмент окружности
                            _ctx.beginPath();
                            _ctx.arc(p1.x, p1.y, length, lastPathBySide.anglePerp, anglePerp, side === COMPENSATION_LEFT ? true : false);
                            _ctx.setLineDash([1, 4]);
                            _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                            _ctx.stroke();
                        }
                    }

                    lastEndPoint = crossPointFounded && crossPoint.inner ? crossPoint : null;
                    return {p1: p1p, p2: p2p, anglePerp, lastEndPoint};

                } else if(lastPath.path.type === TYPE_CIRCLE){

                    // точка пересечения окружности на предыдущем участке пути и
                    // отрезком на текущем
                    let crossPoint;
                    let crossPointFounded = false;
                    try{
                        crossPoint = GCodeCR.calcCrossLineCircle(p1p, p2p, lastPathBySide.circleOffset, _ctx);
                        crossPointFounded = true;
                    } catch(e){
                        // console.log(e);
                    }
                    // console.log({crossPoint});

                    let angle1 = GCodeCR.getAngle2(lastPathBySide.circleOffset.center, lastEndPoint);

                    if(crossPointFounded && crossPoint.inner){       // точка пересечения внутри

                        // окружность на предыдущем участке пути
                        // до точки пересечения с отрезком
                        let angle2 = GCodeCR.getAngle2(lastPathBySide.circleOffset.center, crossPoint);

                        _ctx.beginPath();
                        _ctx.arc(lastPathBySide.circleOffset.center.x, lastPathBySide.circleOffset.center.y, lastPathBySide.circleOffset.r, angle1, angle2, !lastPathBySide.circleOffset.ccw);
                        _ctx.setLineDash([1, 4]);
                        _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                        _ctx.stroke();
                        // _ctx.endPath();

                        // точка пересечения
                        this.drawPoint(crossPoint, side === COMPENSATION_LEFT ? "#080" : "#800");

                    } else{                     // окружность снаружи

                        // окружность на предыдущем участке пути
                        // до конечной точки этой окружности
                        let angle2 = lastPathBySide.circleOffset.angle2;

                        _ctx.beginPath();
                        _ctx.arc(lastPathBySide.circleOffset.center.x, lastPathBySide.circleOffset.center.y, lastPathBySide.circleOffset.r, angle1, angle2, !lastPathBySide.circleOffset.ccw);
                        _ctx.setLineDash([1, 4]);
                        _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                        _ctx.stroke();

                        // console.log({p1, p2});
                        if(!GCodeCR.pointsIsEqual(p1, p2)){
                            // соединяющий сегмент окружности
                            let angle3 = GCodeCR.getAngle2(p1, lastPathBySide.circleOffset.p2);
                            // let angle4 = GCodeCR.getAngle2(p1, circleOffset.p1);
                            let angle4 = anglePerp;
                            angle3 = Math.fmod(angle3, Math.PI*2);
                            angle4 = Math.fmod(angle4, Math.PI*2);
                            // if(angle4 > Math.PI*2) angle4 -= Math.PI*2;
                            // console.log({angle3:angle3*180/Math.PI, angle4:angle4*180/Math.PI});

                            _ctx.beginPath();
                            _ctx.arc(p1.x, p1.y, length, angle3, angle4, side === COMPENSATION_LEFT ? true : false);
                            _ctx.setLineDash([1, 4]);
                            _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                            _ctx.stroke();
                        }
                    }

                    lastEndPoint = crossPointFounded && crossPoint.inner ? crossPoint : null;
                }
            }

            return {p1: p1p, p2: p2p, anglePerp, lastEndPoint};
        }


        const drawCircleOffset = (p1, p2, r, ccw, length, side) => {

            let circleOffset = GCodeCR.calcCircleOffset(p1, p2, r, ccw, length, side);

            let lastEndPoint = null;

            if(lastPath.path !== null){

                let lastPathBySide = side === COMPENSATION_LEFT ? lastPath.left : lastPath.right;
                lastEndPoint = lastPathBySide.lastEndPoint;

                if(lastEndPoint === null){
                    lastEndPoint = lastPathBySide.p1;
                }
    
                if(lastPath.path.type === TYPE_LINE){

                    // точка пересечения отрезка на предыдущем участке пути и
                    // окружностью на текущем
                    let crossPoint;
                    let crossPointFounded = false;
                    try{
                        crossPoint = GCodeCR.calcCrossLineCircle(lastPathBySide.p1, lastPathBySide.p2, circleOffset, _ctx);
                        crossPointFounded = true;
                    } catch(e){
                    }

                    if(crossPointFounded && crossPoint.inner){       // точка пересечения внутри

                        // отрезок на предыдущем участке пути
                        // до точки пересечения отрезка и окружности
                        _ctx.beginPath();
                        _ctx.moveTo(lastEndPoint.x, lastEndPoint.y);
                        _ctx.lineTo(crossPoint.x, crossPoint.y);
                        _ctx.setLineDash([1, 4]);
                        _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                        _ctx.stroke();

                        // точка пересечения
                        this.drawPoint(crossPoint, side === COMPENSATION_LEFT ? "#080" : "#800");

                    } else{                     // окружность снаружи

                        // отрезок на предыдущем участке пути
                        // до конечной точки этого отрезка
                        _ctx.beginPath();
                        _ctx.moveTo(lastEndPoint.x, lastEndPoint.y);
                        _ctx.lineTo(lastPathBySide.p2.x, lastPathBySide.p2.y);
                        _ctx.setLineDash([1, 4]);
                        _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                        _ctx.stroke();
                
                        if(!GCodeCR.pointsIsEqual(p1, p2)){
                            // соединяющий сегмент окружности
                            let angle3 = GCodeCR.getAngle2(p1, lastPathBySide.p2);
                            let angle4 = GCodeCR.getAngle2(p1, circleOffset.p1);

                            _ctx.beginPath();
                            _ctx.arc(p1.x, p1.y, length, angle3, angle4, side === COMPENSATION_LEFT ? true : false);
                            _ctx.setLineDash([1, 4]);
                            _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                            _ctx.stroke();
                        }    
                    }

                    lastEndPoint = crossPointFounded && crossPoint.inner ? crossPoint : null;
                    
                } else if(lastPath.path.type === TYPE_CIRCLE){

                    // точка пересечения окружностей
                    let crossPoint;
                    let crossPointFounded = false;
                    try{
                        crossPoint = GCodeCR.calcCrossCircles(lastPathBySide.circleOffset, circleOffset, _ctx);
                        crossPointFounded = true;
                    } catch(e){
                    }

                    let angle1 = GCodeCR.getAngle2(lastPathBySide.circleOffset.center, lastEndPoint);

                    if(crossPointFounded && crossPoint !== null){    // точка пересечения внутри

                        // окружность на предыдущем участке пути
                        // до точки пересечения окружностей
                        let angle2 = GCodeCR.getAngle2(lastPathBySide.circleOffset.center, crossPoint);

                        _ctx.beginPath();
                        _ctx.arc(lastPathBySide.circleOffset.center.x, lastPathBySide.circleOffset.center.y, lastPathBySide.circleOffset.r, angle1, angle2, !lastPathBySide.circleOffset.ccw);
                        _ctx.setLineDash([1, 4]);
                        _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                        _ctx.stroke();

                        // точка пересечения
                        this.drawPoint(crossPoint, side === COMPENSATION_LEFT ? "#080" : "#800");

                    } else{                     // окружность снаружи

                        // окружность на предыдущем участке пути
                        // до конечной точки этой окружности
                        let angle2 = lastPathBySide.circleOffset.angle2;

                        _ctx.beginPath();
                        _ctx.arc(lastPathBySide.circleOffset.center.x, lastPathBySide.circleOffset.center.y, lastPathBySide.circleOffset.r, angle1, angle2, !lastPathBySide.circleOffset.ccw);
                        _ctx.setLineDash([1, 4]);
                        _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                        _ctx.stroke();

                        if(!GCodeCR.pointsIsEqual(p1, p2)){
                            // соединяющий сегмент окружности
                            // console.log(p1, lastEndPoint, circleOffset);
                            let angle3 = GCodeCR.getAngle2(p1, lastPathBySide.circleOffset.p2);
                            let angle4 = GCodeCR.getAngle2(p1, circleOffset.p1);

                            _ctx.beginPath();
                            _ctx.arc(p1.x, p1.y, length, angle3, angle4, side === COMPENSATION_LEFT ? true : false);
                            _ctx.setLineDash([1, 4]);
                            _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                            _ctx.stroke();
                        }
                    }

                    lastEndPoint = crossPointFounded && crossPoint !== null ? crossPoint : null;
                }
            }

            return {p1, p2, r, ccw, circleOffset, lastEndPoint};
        }


        // рисование параллельных линий
        let drawLeft = true;
        let drawRight = true;
        let drawEnd = true;
        let correctionLength = 10;
        this.path.map((p, ind) => {
            let { type, p1, p2 } = p;

            if(p1 === null){
                p1 = lastP2;
                p.p1 = p1;
            } else{
                p1 = rotate(p1, fi);
            }

            p2 = rotate(p2, fi);

            if(type === TYPE_LINE){

                // console.log('line left');
                if(drawLeft) lastPath.left = drawLineOffset(p1, p2, correctionLength, COMPENSATION_LEFT);
                // console.log('line right');
                if(drawRight) lastPath.right = drawLineOffset(p1, p2, correctionLength, COMPENSATION_RIGHT);

            } else if(type === TYPE_CIRCLE){
                let { r, ccw } = p;
                // console.log('circle left');
                if(drawLeft) lastPath.left = drawCircleOffset(p1, p2, r, ccw, correctionLength, COMPENSATION_LEFT);
                // console.log('circle right');
                if(drawRight) lastPath.right = drawCircleOffset(p1, p2, r, ccw, correctionLength, COMPENSATION_RIGHT);
            }

            lastPath.path = p;
            lastP2 = p2;
        });
        // console.log('lastPath.path', lastPath.path);
        if(lastPath.path.type === TYPE_LINE){
            // рисование параллельных линий на конце траектории
            // console.log('end line left');
            if(drawLeft && drawEnd) drawLineOffset(lastP2, lastP2, correctionLength, COMPENSATION_LEFT);
            // console.log('end line right');
            if(drawRight && drawEnd) drawLineOffset(lastP2, lastP2, correctionLength, COMPENSATION_RIGHT);
        } else if(lastPath.path.type === TYPE_CIRCLE){
            // рисование смещённых окружностей на конце траектории
            // console.log('end circle left');
            if(drawLeft && drawEnd) drawCircleOffset(lastP2, lastP2, lastPath.left.r, lastPath.left.ccw, correctionLength, COMPENSATION_LEFT);
            // console.log('end circle right');
            if(drawRight && drawEnd) drawCircleOffset(lastP2, lastP2, lastPath.right.r, lastPath.right.ccw, correctionLength, COMPENSATION_RIGHT);
        }
    }

    handleCanvasMouseMove(event){
        let oX = event.nativeEvent.offsetX;
        let oY = event.nativeEvent.offsetY;

        this.setState({
            cursorX: oX,
            cursorY: oY,
        });

    }

    handleAngleChange(event){
        let angle = parseFloat(event.target.value);
        this.setState({angle: angle}, () => {
            this.draw();
        });
    }

    handleAngleKeyUp(event){
        // console.log('handleAngleKeyPress', event.key);
        switch(event.key){
            case 'ArrowUp':
                this.setState({angle: this.state.angle+1}, () => {
                    this.draw();
                });
                break;
            case 'ArrowDown':
                this.setState({angle: this.state.angle-1}, () => {
                    this.draw();
                });
                break;
            default:
                break;
        }
    }

    handleAngleListChange(event){
        let angle = parseFloat(event.target.value);
        this.setState({angle: angle}, () => {
            this.draw();
        });
    }

    handleSliderAngleChange(event, value){
        let angle = parseFloat(value);
        this.setState({angle: angle}, () => {
            this.draw();
        });
    }

    render(){

        let angleList = [];
        for(let i=0; i<=360; i+=10)
            angleList.push(i);

        return (
            <>

            <canvas ref={this.refCanvas} style={{
                    border: '1px #000 solid',
                    transform: 'scale(1, -1)',
                    float: 'left',
                }} width={400} height={400}
                onMouseMove={e => this.handleCanvasMouseMove(e)}
                
            ></canvas>

            <div style={{
                marginLeft: 420
            }}>
                
                <div>x: {this.state.cursorX}</div>
                <div>y: {this.state.cursorY}</div>
                <div>angle: {this.state.angle}</div>

                <div>
                    <input type="text" onChange={e => this.handleAngleChange(e)} onKeyUp={e => this.handleAngleKeyUp(e)}/>
                    {/* <button onClick={e => this.handleAngleClick(e)}>set</button> */}
                    <select value={this.state.angle} onChange={e => this.handleAngleListChange(e)}>
                        {angleList.map(angle => <option key={angle} value={angle}>{angle}</option>)}
                    </select>

                    <br/><br/><br/><br/><br/>
                    <Slider 
                        style={{width: 500}}
                        value={this.state.angle} 
                        aria-labelledby="discrete-slider-always"
                        min={0}
                        max={360}
                        step={1}
                        onChange={(e, v) => this.handleSliderAngleChange(e, v)}
                    />
                </div>

            </div>

            <div className='clear'></div>

            </>
        );
    }
}



export default TestCrossOffset;
