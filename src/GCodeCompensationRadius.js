/*
amikodev/factory-reactjs - Industrial equipment management with ReactJS
Copyright © 2020 Prihodko Dmitriy - asketcnc@yandex.ru
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

if(typeof Math.fmod === "undefined")
    Math.fmod = function (a,b) { return Number((a - (Math.floor(a / b) * b)).toPrecision(8)); };



const COMPENSATION_NONE = 0;      // компенсация инструмента отключена
const COMPENSATION_LEFT = 1;      // компенсация радиуса инструмента слева от траектории
const COMPENSATION_RIGHT = 2;     // компенсация радиуса инструмента справа от траектории


const EPS = 1e-4;

let _ctx = null;        // canvas context

/**
 * GCodeCompensationRadius
 * Компенсация радиуса инструмента
 * 
 * @author Prihodko D. G.
 * @copyright CB Asket
 * 
 */
var GCodeCompensationRadius = (function(){

    /**
     * Рассчёт параллельной линии
     * @param p1 первая точка отрезка
     * @param p2 вторая точка отрезка
     * @param length величина отступа
     * @param side сторона (слева/справа)
     */
    const calcLineOffset = (p1, p2, length, side) => {
        let p1p = {
            x: p1.x,
            y: p1.y
        };
        let p2p = {
            x: p2.x,
            y: p2.y
        };

        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let angle = Math.atan2(dy, dx);
        let anglePerp = angle + Math.PI/2;

        let cdx = length * Math.cos(anglePerp);
        let cdy = length * Math.sin(anglePerp);

        if(side == COMPENSATION_RIGHT){
            cdx = -cdx;
            cdy = -cdy;
            anglePerp = angle - Math.PI/2;
        }

        // координаты отрезка параллельного первому
        p1p.x += cdx;
        p1p.y += cdy;
        p2p.x += cdx;
        p2p.y += cdy;

        return {p1p, p2p, angle, anglePerp};
    };

    /**
     * Нахождение точки пересечения отрезков
     * @param p1 первая точка первого отрезка
     * @param p2 вторая точка первого отрезка
     * @param p3 первая точка второго отрезка
     * @param p4 вторая точка второго отрезка
     */
    const calcCrossLines = (p1, p2, p3, p4) => {

        let inner = false;      // пересечение внутри отрезка
        let crossPoint = {x: 0, y: 0, inner: inner};
        // let crossPoint = null;

        // уравнение прямой a*x + b*y + c = 0
        let a1 = p1.y - p2.y;
        let b1 = p2.x - p1.x;
        let c1 = p1.x*p2.y - p2.x*p1.y;

        let a2 = p3.y - p4.y;
        let b2 = p4.x - p3.x;
        let c2 = p3.x*p4.y - p4.x*p3.y;

        if(Math.abs(a1) < EPS) a1 = 0.0;
        if(Math.abs(a2) < EPS) a2 = 0.0;
        if(Math.abs(b1) < EPS) b1 = 0.0;
        if(Math.abs(b2) < EPS) b2 = 0.0;

        if(a1 !== 0 || a2 !== 0){
            let py = (a2*c1 - a1*c2) / (a1*b2 - a2*b1);
            let px = 0;
            
            if(a1 !== 0)
                px = -(b1*py + c1) / a1;
            else
                px = -(b2*py + c2) / a2;

            if(
                ( (px >= p1.x-EPS && px <= p2.x+EPS) || (px <= p1.x+EPS && px >= p2.x-EPS) ) &&
                ( (py >= p1.y-EPS && py <= p2.y+EPS) || (py <= p1.y+EPS && py >= p2.y-EPS) )
            ){
                inner = true;
            }

            // console.log({p1, p2, p3, p4, px, py, inner});
            crossPoint = {x: px, y: py, inner: inner};
        } else{
            throw new Error("Cross point not found");
        }

        return crossPoint;
    };

    /**
     * Получение полных параметров окружности на основе радиуса
     * @param p1 первая точка
     * @param p2 вторая точка
     * @param r радиус
     * @param ccw против часовой стрелки
     */
    const calcCircleByRadius = (p1, p2, r, ccw) => {

        let x1 = p1.x;
        let y1 = p1.y;
        let x2 = p2.x;
        let y2 = p2.y;
        let dx = x2-x1;
        let dy = y2-y1;

        let radiusPositive = r >= 0;
        r = Math.abs(r);

        let d = Math.sqrt(dx*dx+dy*dy);
        let drd = r*r-(d/2)*(d/2);
        if(drd < EPS) drd = 0;
        let h = Math.sqrt(drd);

        let xc1 = x1 + dx/2 + h*dy / d;
        let yc1 = y1 + dy/2 - h*dx / d;

        let xc2 = x1 + dx/2 - h*dy / d;
        let yc2 = y1 + dy/2 + h*dx / d;


        let xc = xc2;
        let yc = yc2;

        if( (!ccw && radiusPositive) || (ccw && !radiusPositive) ){
            xc = xc1;
            yc = yc1;
        }

        let angle1 = Math.atan2(y1-yc, x1-xc);
        let angle2 = Math.atan2(y2-yc, x2-xc);

        return {center: {x: xc, y: yc}, r, angle1, angle2, ccw, p1, p2};
    };

    /**
     * Получение полных параметров окружности на основе инкрементальных координат
     * @param p1 первая точка
     * @param p2 вторая точка
     * @param incI смещение по оси X
     * @param incJ смещение по оси Y
     * @param ccw против часовой стрелки
     */
    const calcCircleByInc = (p1, p2, incI, incJ, ccw) => {

        let x1 = p1.x;
        let y1 = p1.y;
        let x2 = p2.x;
        let y2 = p2.y;

        let xc = x1 + incI;
        let yc = y1 + incJ;

        let r = Math.sqrt(incI*incI + incJ*incJ);

        let angle1 = Math.atan2(y1-yc, x1-xc);
        let angle2 = Math.atan2(y2-yc, x2-xc);

        return {center: {x: xc, y: yc}, r, angle1, angle2, ccw, p1, p2};
    }
    
    /**
     * Рассчёт параллельной окружности
     * @param p1 первая точка отрезка
     * @param p2 вторая точка отрезка
     * @param r радиус окружности
     * @param ccw против часовой стрелки
     * @param length величина отступа
     * @param side сторона (слева/справа)
     */
    const calcCircleOffset = (p1, p2, r, ccw, length, side) => {
        let circle = calcCircleByRadius(p1, p2, r, ccw);

        if(!ccw && side === COMPENSATION_LEFT)
            circle.r += length;
        else if(ccw && side === COMPENSATION_RIGHT)
            circle.r += length;
        else 
            circle.r -= length;

        p1 = {
            x: circle.center.x + Math.cos(circle.angle1) * circle.r,
            y: circle.center.y + Math.sin(circle.angle1) * circle.r
        };
        p2 = {
            x: circle.center.x + Math.cos(circle.angle2) * circle.r,
            y: circle.center.y + Math.sin(circle.angle2) * circle.r
        };

        return {...circle, p1, p2};
    };

    /**
     * Нахождение точки пересечения отрезка и окружности
     * @param p1 первая точка отрезка
     * @param p2 вторая точка отрезка
     * @param circle окружность, полученная из методов calcCircleByRadius, calcCircleByInc, calcCircleOffset
     */
    const calcCrossLineCircle = (p1, p2, circle, _ctx) => {
        let inner = false;      // пересечение внутри отрезка
        // let crossPoint = {x: 0, y: 0, inner: inner};

        let crossPoint = null;

        let pc = circle.center;
        let r = circle.r;

        // уравнение прямой a*x + b*y + c = 0
        // изменим параметр C с учётом того, что центр окружности считаем в начале координат
        // console.log(p1, p2);
        let a1 = p1.y - p2.y;
        let b1 = p2.x - p1.x;
        let c1 = (p1.x-pc.x)*(p2.y-pc.y) - (p2.x-pc.x)*(p1.y-pc.y);

        let a2b2 = a1*a1 + b1*b1;

        let x0 = -a1*c1/a2b2;
        let y0 = -b1*c1/a2b2;

        if(c1*c1 > r*r*a2b2 +EPS){
            // точек нет
            // console.log('lineCircle dot', 'points not exists');
            throw new Error("Cross point not found");

        } else if(Math.abs(c1*c1 - r*r*a2b2) < EPS){
            // одна точка
            let p12 = {
                x: x0 + pc.x,
                y: y0 + pc.y
            };
            crossPoint = p12;
        } else{
            // две точки
            let d = r*r - c1*c1/a2b2;
            let mult = Math.sqrt(d / a2b2);
            let p12 = {
                x: x0 + b1 * mult + pc.x,
                y: y0 - a1 * mult + pc.y
            };
            let p13 = {
                x: x0 - b1 * mult + pc.x,
                y: y0 + a1 * mult + pc.y
            };

            let cwa1 = withinArc(circle, getAngle2(circle.center, p12));
            let cwa2 = withinArc(circle, getAngle2(circle.center, p13));

            let cwp1 = withinPoint(p1, p2, p12);
            let cwp2 = withinPoint(p1, p2, p13);

            // console.log({cwa1, cwa2, cwp1, cwp2});

            if(cwa1 && cwp1){
                crossPoint = p12;
                inner = true;
            } else if(cwa2 && cwp2){
                crossPoint = p13;
                inner = true;
            } else if(cwa1){
                crossPoint = p12;
            } else{
                crossPoint = p13;
            }

            // // точка пересечения
            // drawPoint(p12, "#888");
            // drawPoint(p13, "#888");
        }

        crossPoint.inner = inner;

        return crossPoint;
    };

    /**
     * Нахождение точек пересечения двух окружностей
     * @param circle1 первая окружность, полученная из методов calcCircleByRadius, calcCircleByInc, calcCircleOffset
     * @param circle2 вторая окружность, полученная из методов calcCircleByRadius, calcCircleByInc, calcCircleOffset
     */
    const getCrossCircles = (circle1, circle2) => {
        let pc1 = circle1.center;
        let pc2 = circle2.center;
        let r1 = circle1.r;
        let r2 = circle2.r;

        let dx = pc2.x-pc1.x;
        let dy = pc2.y-pc1.y;
        let d_2 = dx*dx + dy*dy;
        let d_2s = Math.sqrt(d_2);
        let a = (r1*r1 - r2*r2 + d_2)/(2*d_2s);
        let h = Math.sqrt(r1*r1 - a*a);
        
        let p0 = {
            x: pc1.x + a/d_2s*(pc2.x - pc1.x),
            y: pc1.y + a/d_2s*(pc2.y - pc1.y)
        };

        let tpx = h/d_2s*dy;
        let tpy = h/d_2s*dx;
        
        let p1 = {
            x: p0.x + tpx,
            y: p0.y - tpy
        };
        let p2 = {
            x: p0.x - tpx,
            y: p0.y + tpy
        };

        let angle1 = Math.atan2(p1.y-pc1.y, p1.x-pc1.x);
        let angle2 = Math.atan2(p2.y-pc1.y, p2.x-pc1.x);

        let angle3 = Math.atan2(p1.y-pc2.y, p1.x-pc2.x);
        let angle4 = Math.atan2(p2.y-pc2.y, p2.x-pc2.x);

        return {p0, p1, p2, angle1, angle2, angle3, angle4};
    };

    /**
     * Нахождение точки пересечения двух окружностей
     * @param circle1 первая окружность, полученная из методов calcCircleByRadius, calcCircleByInc, calcCircleOffset
     * @param circle2 вторая окружность, полученная из методов calcCircleByRadius, calcCircleByInc, calcCircleOffset
     */
    const calcCrossCircles = (circle1, circle2, _ctx) => {
        // let crossPoint = null;
        let crossPoint = {x: 0, y: 0};

        let crossCircles = getCrossCircles(circle1, circle2);
        // console.log({crossCircles});

        // // точка
        // drawPoint(crossCircles.p1, "#080");
        // drawPoint(crossCircles.p2, "#080");

        let cwa11 = withinArc(circle1, crossCircles.angle1);
        let cwa12 = withinArc(circle1, crossCircles.angle2);
        let cwa21 = withinArc(circle2, crossCircles.angle3);
        let cwa22 = withinArc(circle2, crossCircles.angle4);

        // console.log({cwa11, cwa12, cwa21, cwa22});

        if(cwa11 && cwa21){
            crossPoint = crossCircles.p1;
        } else if(cwa12 && cwa22){
            crossPoint = crossCircles.p2;
        } else if(cwa11 || cwa21){
            // crossPoint = crossCircles.p1;
            throw new Error("Cross point not found");
        } else if(cwa12 || cwa22){
            // crossPoint = crossCircles.p2;
            throw new Error("Cross point not found");

        } else{
            throw new Error("Cross point not found");
        }

        return crossPoint;
    }

    /**
     * Определение лежит ли точка a3 внутри сегмента окружности
     * @param circle окружность
     * @param a3 произвольный угол
     */
    const withinArc = (circle, a3) => {
        let a1 = Math.fmod(circle.angle1, Math.PI*2);
        let a2 = Math.fmod(circle.angle2, Math.PI*2);
        a3 = Math.fmod(a3, Math.PI*2);

        let inner = false;
        if(circle.ccw){
            inner = a2 > a1 ? (a3 >= a1 && a3 <= a2) : (a3 <= a2 || a3 >= a1);
        } else{
            inner = a2 < a1 ? (a3 >= a2 && a3 <= a1) : (a3 <= a1 || a3 >= a2);
        }

        return inner;
    }

    /**
     * Определение является ли точка p3 внутри отрезка между точками p1 и p2
     * @param p1 первая точка отрезка
     * @param p2 вторая точка отрезка
     * @param p3 произвольная точка
     */
    const withinPoint = (p1, p2, p3) => {
        let within =
            ( (p3.x >= p1.x-EPS && p3.x <= p2.x+EPS) || (p3.x <= p1.x+EPS && p3.x >= p2.x-EPS) ) &&
            ( (p3.y >= p1.y-EPS && p3.y <= p2.y+EPS) || (p3.y <= p1.y+EPS && p3.y >= p2.y-EPS) )
        ;
        return within;
    }

    /**
     * Получение угла по двум точкам
     * @param p1 первая точка
     * @param p2 вторая точка
     */
    const getAngle2 = (p1, p2) => {
        let angle = Math.atan2(p2.y-p1.y, p2.x-p1.x);
        return angle;
    }

    /**
     * Получение угла между тремя точками
     * @param p1 первая точка
     * @param p2 вторая точка
     * @param p3 третья точка
     */
    const getAngle3 = (p1, p2, p3) => {
        let angle = 0;
        return angle;
    }

    /**
     * Определение являются ли две точки с одними координатами
     * @param p1 первая точка
     * @param p2 вторая точка
     */
    const pointsIsEqual = (p1, p2) => {
        return p1.x === p2.x && p1.y === p2.y;
    }

    /**
     * Установка контекста canvas
     * @param ctx контекст canvas
     */
    const setCanvasContext = ctx => {
        _ctx = ctx;
    }

    /**
     * Рисование точки
     * @param point точка
     * @param color цвет
     */
    const drawPoint = (point, color) => {
        if(_ctx === null)
            return;

        _ctx.beginPath();
        _ctx.arc(point.x, point.y, 2, 0, Math.PI*2, false);
        _ctx.fillStyle = color;
        _ctx.fill();
    }


    return {

        calcLineOffset,                 // Рассчёт параллельной линии
        calcCircleOffset,               // Рассчёт параллельной окружности

        calcCircleByRadius,             // Получение полных параметров окружности на основе радиуса
        calcCircleByInc,                // Получение полных параметров окружности на основе инкрементальных координат

        calcCrossLines,                 // Нахождение точки пересечения отрезков
        calcCrossLineCircle,            // Нахождение точки пересечения отрезка и окружности
        calcCrossCircles,               // Нахождение точки пересечения двух окружностей

        getAngle2,                      // Получение угла по двум точкам
        // getAngle3,                      // Получение угла между тремя точками
        pointsIsEqual,                  // Определение являются ли две точки с одними координатами

        setCanvasContext,               // Установка контекста canvas
        drawPoint,                      // Рисование точки

    };
})();

export default GCodeCompensationRadius;
export { COMPENSATION_NONE, COMPENSATION_LEFT, COMPENSATION_RIGHT };
