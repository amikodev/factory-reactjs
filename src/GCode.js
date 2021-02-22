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

/**
 * GCode
 * 
 * https://ru.wikipedia.org/wiki/G-code
 * 
 * @author Prihodko D. G.
 * @copyright CB Asket
 * 
 */

import GCodeCR from './GCodeCompensationRadius';
import { COMPENSATION_NONE, COMPENSATION_LEFT, COMPENSATION_RIGHT } from './GCodeCompensationRadius';


var GCode = (function(){

    const OBJ_NAME_CNC_GCODE = 0x50;

    let letterCodes = {
        'G': 0x01,
        'N': 0x02,
        'M': 0x03,
        'O': 0x04,
        
        'X': 0x11,
        'Y': 0x12,
        'Z': 0x13,
        'A': 0x14,
        'B': 0x15,
        'C': 0x16,

        'P': 0x17,
        'F': 0x18,
        'S': 0x19,
        'R': 0x1A,
        'D': 0x1B,
        'L': 0x1C,
        'I': 0x1D,
        'J': 0x1E,
        'K': 0x1F
    };

    const COORD_ABSOLUTE = 0;
    const COORD_RELATIVE = 1;

    const RUN_FAST = 0;
    const RUN_WORK_LINEAR = 1;
    const RUN_WORK_CW = 2;
    const RUN_WORK_CCW = 3;

    const TYPE_LINE = 0;
    const TYPE_CIRCLE = 1;

    const UNIT_METRIC = 0;
    const UNIT_INCH = 1;

    const CIRCLE_RADIUS = 0;
    const CIRCLE_INC = 1;

    // const COMPENSATION_NONE = 0;      // компенсация инструмента отключена
    // const COMPENSATION_LEFT = 1;      // компенсация радиуса инструмента слева от траектории
    // const COMPENSATION_RIGHT = 2;     // компенсация радиуса инструмента справа от траектории
    const COMPENSATION_POS = 3;       // компенсация длины инструмента положительно
    const COMPENSATION_NEG = 4;       // компенсация длины инструмента отрицательно

    const COMPENSATION_RADIUS_SHAPE_NONE = 0;        // отсутствие фигуры при компенсации радиуса инструмента
    const COMPENSATION_RADIUS_SHAPE_POINT = 1;       // точка - фигура при компенсации радиуса инструмента
    const COMPENSATION_RADIUS_SHAPE_CIRCLE = 2;      // окружность - фигура при компенсации радиуса инструмента

    let _canvas = null;
    let _ctx = null;
    let _cmds = null;
    let _datas = null;

    let _zoom = 1;
    let _navLeft = 0;
    let _navTop = 0;


    let progParams = {
        coordSystem: COORD_ABSOLUTE,
        runType: RUN_FAST,
        currentCoord: {X: 0, Y: 0, Z: 0, A: 0, B: 0, C: 0},     // текущие координаты (абсолютные)
        targetCoord:  {X: 0, Y: 0, Z: 0, A: 0, B: 0, C: 0},     // целевые координаты (абсолютные или относительные, в зависимости от coordSystem)
        systemCoord:  {X: 0, Y: 0, Z: 0, A: 0, B: 0, C: 0},     // координаты нулевой точки при переводе на другую систему координат (G90 или G91)
        userZeroPoint: {X: 0, Y: 0, Z: 0, A: 0, B: 0, C: 0},    // координаты пользовательского "нуля"
        unit: UNIT_METRIC,                                      // единицы измерения
        circle: {
            type: CIRCLE_RADIUS,                                // тип окружности (CIRCLE_RADIUS, CIRCLE_INC)
            radius: 0,                                          // радиус окружности
            inc: {I: 0, J: 0, K: 0},
        },
        compensationRadius: {
            type: COMPENSATION_NONE,
            value: 0.0,
        },
        compensationLength: {
            type: COMPENSATION_NONE,
            value: 0.0,
        },
        // compensationLastPoint: null,                            // последняя точка компенсации радиуса инструмента
        pause: 0.0,                                             // пауза задаваемая командой G04, в секундах
    };


    const command_G = (value, frame) => {
        let processThisCommand = true;
        switch(value){
            case 0:     // G00 - Ускоренное перемещение инструмента (холостой ход)
                progParams.runType = RUN_FAST;
                break;
            case 1:     // G01 - Линейная интерполяция, скорость перемещения задаётся здесь же или ранее модальной командой F
                progParams.runType = RUN_WORK_LINEAR;
                break;
            case 2:     // G02 - Круговая интерполяция по часовой стрелке
                progParams.runType = RUN_WORK_CW;
                frame.map(cmd => {
                    switch(cmd[0]){
                        case 'R':
                            progParams.circle.type = CIRCLE_RADIUS;
                            progParams.circle.radius = cmd[1];
                            break;
                        case 'I':
                            progParams.circle.type = CIRCLE_INC;
                            progParams.circle.inc.I = cmd[1];
                            break;
                        case 'J':
                            progParams.circle.type = CIRCLE_INC;
                            progParams.circle.inc.J = cmd[1];
                            break;
                        case 'K':
                            progParams.circle.type = CIRCLE_INC;
                            progParams.circle.inc.K = cmd[1];
                            break;
                        default:
                            break;
                    }
                });
                break;
            case 3:     // G03 - Круговая интерполяция против часовой стрелки
                progParams.runType = RUN_WORK_CCW;
                frame.map(cmd => {
                    switch(cmd[0]){
                        case 'R':
                            progParams.circle.type = CIRCLE_RADIUS;
                            progParams.circle.radius = cmd[1];
                            break;
                        case 'I':
                            progParams.circle.type = CIRCLE_INC;
                            progParams.circle.inc.I = cmd[1];
                            break;
                        case 'J':
                            progParams.circle.type = CIRCLE_INC;
                            progParams.circle.inc.J = cmd[1];
                            break;
                        case 'K':
                            progParams.circle.type = CIRCLE_INC;
                            progParams.circle.inc.K = cmd[1];
                            break;
                        default:
                            break;
                    }
                });
                break;
            case 4:     // G04 - Задержка выполнения программы, способ задания величины задержки зависит от реализации системы управления, P обычно задает паузу в миллисекундах, X — в секундах.
                frame.map(cmd => {
                    switch(cmd[0]){
                        case 'P':       // пауза в миллисекундах
                            progParams.pause = cmd[1]/1000;
                            break;
                        case 'X':       // пауза с секундах
                            progParams.pause = cmd[1];
                            break;
                        default:
                            break;
                    }
                });
                processThisCommand = false;
                break;
            case 10:    // G10 - Переключение абсолютной системы координат
            case 15:    // G15 - Отмена полярной системы координат
            case 16:    // G16 - Переход в полярную систему координат (X радиус Y угол)
            case 17:    // G17 - Выбор рабочей плоскости X-Y
            case 18:    // G18 - Выбор рабочей плоскости Z-X
            case 19:    // G19 - Выбор рабочей плоскости Y-Z
                break;
            case 20:    // G20 - Режим работы в дюймовой системе
                progParams.unit = UNIT_INCH;
                break;
            case 21:    // G21 - Режим работы в метрической системе
                progParams.unit = UNIT_METRIC;
                break;
            case 28:    // G28 - Вернуться на референтную точку
            case 30:    // G30 - Поднятие по оси Z на точку смены инструмента
            case 31:    // G31 - Подача до пропуска
            case 40:    // G40 - Отмена компенсации радиуса инструмента
                progParams.compensationRadius.type = COMPENSATION_NONE;
                progParams.compensationRadius.value = 0.0;
                break;
            case 41:    // G41 - Компенсировать радиус инструмента слева от траектории
                progParams.compensationRadius.type = COMPENSATION_LEFT;
                progParams.compensationRadius.value = 1.0;      // радиус по умолчанию
                frame.map(cmd => {
                    switch(cmd[0]){
                        case 'R':       // радиус
                            progParams.compensationRadius.value = cmd[1];
                            break;
                        default:
                            break;
                    }
                    return null;
                });
                break;
            case 42:    // G42 - Компенсировать радиус инструмента справа от траектории
                progParams.compensationRadius.type = COMPENSATION_RIGHT;
                progParams.compensationRadius.value = 1.0;      // радиус по умолчанию
                frame.map(cmd => {
                    switch(cmd[0]){
                        case 'R':       // радиус
                            progParams.compensationRadius.value = cmd[1];
                            break;
                        default:
                            break;
                    }
                    return null;
                });
                break;
            case 43:    // G43 - Компенсировать длину инструмента положительно
                progParams.compensationLength.type = COMPENSATION_POS;
                progParams.compensationLength.value = 0.0;
                break;
            case 44:    // G44 - Компенсировать длину инструмента отрицательно
                progParams.compensationLength.type = COMPENSATION_NEG;
                progParams.compensationLength.value = 0.0;
                break;
            case 49:    // G49 - Отмена компенсации длины инструмента
                progParams.compensationLength.type = COMPENSATION_NONE;
                progParams.compensationLength.value = 0.0;
                break;
            case 50:    // G50 - Сброс всех масштабирующих коэффициентов в 1,0
            case 51:    // G51 - Назначение масштабов
            case 53:    // G53 - Переход в систему координат станка
            case 54:    // G54 - Переключиться на заданную оператором систему координат
            case 68:    // G68 - Поворот координат на нужный угол
            case 70:    // G70 - Цикл продольного чистового точения
            case 71:    // G71 - Цикл многопроходного продольного чернового точения
            case 80:    // G80 - Отмена циклов сверления, растачивания, нарезания резьбы метчиком и т. д.
            case 81:    // G81 - Цикл сверления
            case 82:    // G82 - Цикл сверления с задержкой
            case 83:    // G83 - Цикл прерывистого сверления (с полным выводом сверла)
            case 84:    // G84 - Цикл нарезания резьбы
                break;
            case 90:    // G90 - Задание абсолютных координат опорных точек траектории
                progParams.coordSystem = COORD_ABSOLUTE;
                progParams.targetCoord = Object.assign({}, progParams.currentCoord);
                progParams.systemCoord = {X: 0, Y: 0, Z: 0, A: 0, B: 0, C: 0};
                break;
            case 91:    // G91 - Задание координат инкрементально последней введённой опорной точки
                progParams.coordSystem = COORD_RELATIVE;
                progParams.targetCoord = {X: 0, Y: 0, Z: 0, A: 0, B: 0, C: 0};
                progParams.systemCoord = Object.assign({}, progParams.currentCoord);
                break;
            case 92:
                processThisCommand = false;
                break;
            case 94:    // G94 - F (подача) — в формате мм/мин
            case 95:    // G95 - F (подача) — в формате мм/об
            case 99:    // G99 - После каждого цикла не отходить на «проходную точку»

            default:
                break;
        }
        return processThisCommand;
    };

    const command_M = (value, frame) => {
        let processThisCommand = true;
        switch(value){
            case 3:     // M03 - включить плазму
            case 7:     // M07 - включить плазму

                break;
            case 5:     // M05 - выключить плазму
            case 8:     // M08 - включить плазму

                break;

            default:
                break;
        }
        return processThisCommand;
    };


    /**
     * Рисование фигуры
     */
    const draw = () => {
        if(_ctx === null)
            return;

        // очистка Canvas
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

        // progParams.compensationLastPoint = null;

        let lastPath = {
            path: null,
            left: null,
            right: null,
        };

        const drawLine = (pMoveParams, pMoveNextParams) => {

            let targetX = pMoveParams.target.x;
            let targetY = pMoveParams.target.y;

            let pParams = pMoveParams.pParams;

            let dash = pParams.runType === RUN_FAST ? [4, 4] : [];

            let p1 = {
                x: pParams.currentCoord.X + pParams.userZeroPoint.X,
                y: pParams.currentCoord.Y + pParams.userZeroPoint.Y
            };
            let p2 = {
                x: targetX + pParams.userZeroPoint.X,
                y: targetY + pParams.userZeroPoint.Y
            };

            GCodeCR.drawPoint({x: p1.x*_zoom+_navLeft, y: p1.y*_zoom+_navTop}, "#444");


            _ctx.beginPath();
            _ctx.moveTo(p1.x*_zoom+_navLeft, p1.y*_zoom+_navTop);
            _ctx.lineTo(p2.x*_zoom+_navLeft, p2.y*_zoom+_navTop);
            _ctx.setLineDash(dash);
            _ctx.strokeStyle = "#000";
            _ctx.stroke();


            if(pParams.runType !== RUN_FAST && pParams.compensationRadius.type != COMPENSATION_NONE){
                let side = pParams.compensationRadius.type;
                let length = pParams.compensationRadius.value;

                if(side === COMPENSATION_LEFT)
                    lastPath.left = drawLineOffset(p1, p2, length, side);
                else
                    lastPath.right = drawLineOffset(p1, p2, length, side);

                lastPath.path = {type: TYPE_LINE, side};
            } else{

                if(lastPath.path !== null){
                    let { side } = lastPath.path;
                    let lastPathBySide = side === COMPENSATION_LEFT ? lastPath.left : lastPath.right;
                    if(lastPathBySide !== null){
                        if(lastPath.path.type === TYPE_LINE){
                            let p3 = lastPathBySide.lastEndPoint ?? lastPathBySide.p1;
                            let p4 = lastPathBySide.p2;
            
                            _ctx.beginPath();
                            _ctx.moveTo(p3.x*_zoom+_navLeft, p3.y*_zoom+_navTop);
                            _ctx.lineTo(p4.x*_zoom+_navLeft, p4.y*_zoom+_navTop);
                            _ctx.lineTo(p1.x*_zoom+_navLeft, p1.y*_zoom+_navTop);
                            _ctx.setLineDash([1, 4]);
                            _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                            _ctx.stroke();

                        } else if(lastPath.path.type === TYPE_CIRCLE){
                            let { circleOffset } = lastPathBySide;

                            if(circleOffset.r > 0){
                                let angle3 = lastPathBySide.lastEndPoint !== null ? GCodeCR.getAngle2(circleOffset.center, lastPathBySide.lastEndPoint) : circleOffset.angle1;
                                let angle4 = circleOffset.angle2;

                                // console.log({angle3:angle3*180/Math.PI, angle4:angle4*180/Math.PI});
                                _ctx.beginPath();
                                _ctx.arc(circleOffset.center.x*_zoom+_navLeft, circleOffset.center.y*_zoom+_navTop, (circleOffset.r)*_zoom, angle3, angle4, !circleOffset.ccw);
                                _ctx.lineTo(p1.x*_zoom+_navLeft, p1.y*_zoom+_navTop);
                                _ctx.setLineDash([1, 4]);
                                _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                                _ctx.stroke();
                            }                
                        }
                    }
                }

                lastPath.path = null;
                lastPath.left = null;
                lastPath.right = null;
            }
        }


        let debugCircleCount = 0;
        const drawCircle = (pMoveParams, pMoveNextParams) => {
            let dash = [];

            let targetX = pMoveParams.target.x;
            let targetY = pMoveParams.target.y;

            let pParams = pMoveParams.pParams;

            let p1 = {
                x: pParams.currentCoord.X + pParams.userZeroPoint.X,
                y: pParams.currentCoord.Y + pParams.userZeroPoint.Y
            };
            let p2 = {
                x: targetX + pParams.userZeroPoint.X,
                y: targetY + pParams.userZeroPoint.Y
            };
            let p3 = {
                x: pMoveNextParams.target.x + pParams.userZeroPoint.X,
                y: pMoveNextParams.target.y + pParams.userZeroPoint.Y
            };

            GCodeCR.drawPoint({x: p1.x*_zoom+_navLeft, y: p1.y*_zoom+_navTop}, "#444");

            let cp = pParams.circle.type === CIRCLE_RADIUS ? 
                GCodeCR.calcCircleByRadius(p1, p2, pParams.circle.radius, pParams.runType === RUN_WORK_CCW) : 
                GCodeCR.calcCircleByInc(p1, p2, pParams.circle.inc.I, pParams.circle.inc.J, pParams.runType === RUN_WORK_CCW)
            ;

            // point center
            let pc = {
                x: cp.center.x + pParams.userZeroPoint.X,
                y: cp.center.y + pParams.userZeroPoint.Y
            };

            // console.log('circle', ++debugCircleCount, cp, {angle1:cp.angle1*180/Math.PI, angle2:cp.angle2*180/Math.PI});

            _ctx.beginPath();
            _ctx.arc(pc.x*_zoom+_navLeft, pc.y*_zoom+_navTop, (cp.r)*_zoom, cp.angle1, cp.angle2, !cp.ccw);
            _ctx.setLineDash(dash);
            _ctx.strokeStyle = "#000";
            _ctx.stroke();


            if(pParams.compensationRadius.type != COMPENSATION_NONE){
                let side = pParams.compensationRadius.type;
                let length = pParams.compensationRadius.value;

                let r = pParams.circle.type === CIRCLE_RADIUS ? pParams.circle.radius : cp.r;

                if(side === COMPENSATION_LEFT)
                    lastPath.left = drawCircleOffset(p1, p2, r, cp.ccw, length, side);
                else
                    lastPath.right = drawCircleOffset(p1, p2, r, cp.ccw, length, side);

                lastPath.path = {type: TYPE_CIRCLE, side};
            } else{

                // console.log('circle', ++debugCircleCount, cp, {angle1:cp.angle1*180/Math.PI, angle2:cp.angle2*180/Math.PI});

                lastPath.path = null;
            }
        }


        const drawLineOffset = (p1, p2, length, side) => {

            let { p1p, p2p, anglePerp } = GCodeCR.calcLineOffset(p1, p2, length, side);

            let lastEndPoint = null;

            // console.log('drawLineOffset', {p1p, p2p});
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

                    // console.log('drawLineOffset', {lp1: lastPathBySide.p1, lp2: lastPathBySide.p2, p1p, p2p, crossPointFounded, crossPoint});
                    if(crossPointFounded && crossPoint.inner){       // точка пересечения внутри

                        // отрезок на предыдущем участке пути
                        // до точки пересечения отрезков
                        _ctx.beginPath();
                        _ctx.moveTo(lastEndPoint.x*_zoom+_navLeft, lastEndPoint.y*_zoom+_navTop);
                        _ctx.lineTo(crossPoint.x*_zoom+_navLeft, crossPoint.y*_zoom+_navTop);
                        _ctx.setLineDash([1, 4]);
                        _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                        _ctx.stroke();
            
                        // точка пересечения
                        GCodeCR.drawPoint({x: crossPoint.x*_zoom+_navLeft, y: crossPoint.y*_zoom+_navTop}, side === COMPENSATION_LEFT ? "#080" : "#800");

                    } else{                     // окружность снаружи

                        // отрезок на предыдущем участке пути
                        // до конечной точки этого отрезка
                        _ctx.beginPath();
                        _ctx.moveTo(lastEndPoint.x*_zoom+_navLeft, lastEndPoint.y*_zoom+_navTop);
                        _ctx.lineTo(lastPathBySide.p2.x*_zoom+_navLeft, lastPathBySide.p2.y*_zoom+_navTop);
                        _ctx.setLineDash([1, 4]);
                        _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                        _ctx.stroke();
                
                        if(!GCodeCR.pointsIsEqual(p1, p2)){
                            // соединяющий сегмент окружности

                            let angle3 = lastPathBySide.anglePerp;
                            let angle4 = anglePerp;

                            // console.log({angle3:angle3*180/Math.PI, angle4:angle4*180/Math.PI, da:Math.abs(angle4-angle3)*180/Math.PI});
                            if(Math.abs(angle4-angle3) >= 0.0174 && Math.abs(angle4-angle3) <= 6.2657){     // > 1 градуса
                                _ctx.beginPath();
                                _ctx.arc(p1.x*_zoom+_navLeft, p1.y*_zoom+_navTop, length*_zoom, angle3, angle4, side === COMPENSATION_LEFT ? true : false);
                                _ctx.setLineDash([1, 4]);
                                _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                                _ctx.stroke();
                            }
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
                        _ctx.arc(lastPathBySide.circleOffset.center.x*_zoom+_navLeft, lastPathBySide.circleOffset.center.y*_zoom+_navTop, lastPathBySide.circleOffset.r*_zoom, angle1, angle2, !lastPathBySide.circleOffset.ccw);
                        _ctx.setLineDash([1, 4]);
                        _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                        _ctx.stroke();

                        // точка пересечения
                        GCodeCR.drawPoint({x: crossPoint.x*_zoom+_navLeft, y: crossPoint.y*_zoom+_navTop}, side === COMPENSATION_LEFT ? "#080" : "#800");

                    } else{                     // окружность снаружи

                        // окружность на предыдущем участке пути
                        // до конечной точки этой окружности
                        let {center, angle2, r, ccw} = lastPathBySide.circleOffset;

                        if(r > 0){ 
                            _ctx.beginPath();
                            _ctx.arc(center.x*_zoom+_navLeft, center.y*_zoom+_navTop, r*_zoom, angle1, angle2, !ccw);
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
                                // console.log({p1, p2}, lastPathBySide.circleOffset, {angle3:angle3*180/Math.PI, angle4:angle4*180/Math.PI, da: angle4-angle3});

                                if(Math.abs(angle4-angle3) >= 0.0174 && Math.abs(angle4-angle3) <= 6.2657){     // > 1 градуса
                                    _ctx.beginPath();
                                    _ctx.arc(p1.x*_zoom+_navLeft, p1.y*_zoom+_navTop, length*_zoom, angle3, angle4, side === COMPENSATION_LEFT ? true : false);
                                    _ctx.setLineDash([1, 4]);
                                    _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                                    _ctx.stroke();
                                }
                            }
                        }
                    }

                    lastEndPoint = crossPointFounded && crossPoint.inner ? crossPoint : null;
                }
            } else{
                // переход к точке коррекции радиуса инструмента
                _ctx.beginPath();
                _ctx.moveTo(p1.x*_zoom+_navLeft, p1.y*_zoom+_navTop);
                _ctx.lineTo(p1p.x*_zoom+_navLeft, p1p.y*_zoom+_navTop);
                _ctx.setLineDash([1, 4]);
                _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                _ctx.stroke();
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
                        _ctx.moveTo(lastEndPoint.x*_zoom+_navLeft, lastEndPoint.y*_zoom+_navTop);
                        _ctx.lineTo(crossPoint.x*_zoom+_navLeft, crossPoint.y*_zoom+_navTop);
                        _ctx.setLineDash([1, 4]);
                        _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                        _ctx.stroke();

                        // точка пересечения
                        GCodeCR.drawPoint({x: crossPoint.x*_zoom+_navLeft, y: crossPoint.y*_zoom+_navTop}, side === COMPENSATION_LEFT ? "#080" : "#800");

                    } else{                     // окружность снаружи

                        // отрезок на предыдущем участке пути
                        // до конечной точки этого отрезка
                        _ctx.beginPath();
                        _ctx.moveTo(lastEndPoint.x*_zoom+_navLeft, lastEndPoint.y*_zoom+_navTop);
                        _ctx.lineTo(lastPathBySide.p2.x*_zoom+_navLeft, lastPathBySide.p2.y*_zoom+_navTop);
                        _ctx.setLineDash([1, 4]);
                        _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                        _ctx.stroke();
                
                        if(!GCodeCR.pointsIsEqual(p1, p2)){
                            // соединяющий сегмент окружности
                            let angle3 = GCodeCR.getAngle2(p1, lastPathBySide.p2);
                            let angle4 = GCodeCR.getAngle2(p1, circleOffset.p1);

                            // console.log({angle3:angle3*180/Math.PI, angle4:angle4*180/Math.PI, da:Math.abs(angle4-angle3)*180/Math.PI});
                            if(Math.abs(angle4-angle3) >= 0.0174 && Math.abs(angle4-angle3) <= 6.2657){     // > 1 градуса
                                _ctx.beginPath();
                                _ctx.arc(p1.x*_zoom+_navLeft, p1.y*_zoom+_navTop, length*_zoom, angle3, angle4, side === COMPENSATION_LEFT ? true : false);
                                _ctx.setLineDash([1, 4]);
                                _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                                _ctx.stroke();
                            }
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

                    // console.log({circleOffset, crossPointFounded, crossPoint});
                    if(crossPointFounded && crossPoint !== null){    // точка пересечения внутри

                        // окружность на предыдущем участке пути
                        // до точки пересечения окружностей
                        let angle2 = GCodeCR.getAngle2(lastPathBySide.circleOffset.center, crossPoint);

                        _ctx.beginPath();
                        _ctx.arc(lastPathBySide.circleOffset.center.x*_zoom+_navLeft, lastPathBySide.circleOffset.center.y*_zoom+_navTop, lastPathBySide.circleOffset.r*_zoom, angle1, angle2, !lastPathBySide.circleOffset.ccw);
                        _ctx.setLineDash([1, 4]);
                        _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                        _ctx.stroke();

                        // точка пересечения
                        GCodeCR.drawPoint({x: crossPoint.x*_zoom+_navLeft, y: crossPoint.y*_zoom+_navTop}, side === COMPENSATION_LEFT ? "#080" : "#800");

                    } else{                     // окружность снаружи

                        // окружность на предыдущем участке пути
                        // до конечной точки этой окружности
                        let {center, angle2, r, ccw} = lastPathBySide.circleOffset;
                        // let angle2 = lastPathBySide.circleOffset.angle2;

                        if(r > 0){
                            _ctx.beginPath();
                            _ctx.arc(center.x*_zoom+_navLeft, center.y*_zoom+_navTop, r*_zoom, angle1, angle2, !ccw);
                            _ctx.setLineDash([1, 4]);
                            _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                            _ctx.stroke();

                            if(!GCodeCR.pointsIsEqual(p1, p2)){
                                // соединяющий сегмент окружности
                                // console.log(p1, lastEndPoint, circleOffset);
                                let angle3 = GCodeCR.getAngle2(p1, lastPathBySide.circleOffset.p2);
                                let angle4 = GCodeCR.getAngle2(p1, circleOffset.p1);

                                // console.log({angle3:angle3*180/Math.PI, angle4:angle4*180/Math.PI, da:Math.abs(angle4-angle3)*180/Math.PI});
                                if(Math.abs(angle4-angle3) >= 0.0174 && Math.abs(angle4-angle3) <= 6.2657){     // > 1 градуса
                                    _ctx.beginPath();
                                    _ctx.arc(p1.x*_zoom+_navLeft, p1.y*_zoom+_navTop, length*_zoom, angle3, angle4, side === COMPENSATION_LEFT ? true : false);
                                    _ctx.setLineDash([1, 4]);
                                    _ctx.strokeStyle = side === COMPENSATION_LEFT ? "#080" : "#800";
                                    _ctx.stroke();
                                }
                            }
                        }
                    }

                    lastEndPoint = crossPointFounded && crossPoint !== null ? crossPoint : null;
                }
            }

            return {p1, p2, r, ccw, circleOffset, lastEndPoint};
        }


        const recalcCoords = (targetX, targetY) => {
            progParams.currentCoord.X = targetX;
            progParams.currentCoord.Y = targetY;
        }


        const processFrame = frame => {
            // console.log('frame', frame);
            let processThisFrame = true;

            frame.map(el => {
                // console.log('el', el);
                let letter = el[0];
                let value = el[1];

                if(!processThisFrame)       // текущую команду Gxx не обрабатываем
                    return null;

                switch(letter){
                    case 'G':
                        processThisFrame = command_G(value, frame);
                        break;
                    case 'M':
                        processThisFrame = command_M(value, frame);
                        break;

                    case 'X':
                        progParams.targetCoord.X = parseFloat(value.toFixed(3));
                        break;
                    case 'Y':
                        progParams.targetCoord.Y = parseFloat(value.toFixed(3));
                        break;
                    case 'Z':
                        progParams.targetCoord.Z = parseFloat(value.toFixed(3));
                        break;
                    case 'A':
                        progParams.targetCoord.A = parseFloat(value.toFixed(3));
                        break;
                    case 'B':
                        progParams.targetCoord.B = parseFloat(value.toFixed(3));
                        break;
                    case 'C':
                        progParams.targetCoord.C = parseFloat(value.toFixed(3));
                        break;

                    case 'I':
                        progParams.circle.type = CIRCLE_INC;
                        progParams.circle.inc.I = parseFloat(value.toFixed(3));
                        break;
                    case 'J':
                        progParams.circle.type = CIRCLE_INC;
                        progParams.circle.inc.J = parseFloat(value.toFixed(3));
                        break;
                    case 'K':
                        progParams.circle.type = CIRCLE_INC;
                        progParams.circle.inc.K = parseFloat(value.toFixed(3));
                        break;

                    default:
                        break;
                }

                return null;
            });

            if(!processThisFrame)       // текущую команду Gxx не обрабатываем
                return false;

            return true;
        }

        // const processMove = (pParams) => {
        const processMove = (pMoveParams, pMoveNextParams) => {
            let { pParams } = pMoveParams;
            if(pParams.runType === RUN_FAST || pParams.runType === RUN_WORK_LINEAR){
                drawLine(pMoveParams, pMoveNextParams);
            } else if(pParams.runType === RUN_WORK_CW || pParams.runType === RUN_WORK_CCW){
                drawCircle(pMoveParams, pMoveNextParams);
            }

        }

        const process = (cmds) => {

            let pMoveParams = [];

            cmds.map(cmd => {
                let frame = [];
                cmd[1].map(cmdEl => {
                    if(cmdEl === null){
                        return;
                    }
                    let letter = cmdEl[1];
                    let value = cmdEl[2];
                    frame.push([letter, value]);
                    return null;
                });
                if(processFrame(frame)){
                    let pParams = Object.assign({}, progParams);
                    pParams = JSON.parse(JSON.stringify(pParams));
                    let targetPoint = {x: pParams.targetCoord.X + pParams.systemCoord.X, y: pParams.targetCoord.Y + pParams.systemCoord.Y};
                    // console.log('targetPoint', JSON.stringify(targetPoint));
                    
                    const _recalcCoords = () => {
                        if([RUN_FAST, RUN_WORK_LINEAR, RUN_WORK_CW, RUN_WORK_CCW].indexOf(pParams.runType) >= 0){
                            recalcCoords(targetPoint.x, targetPoint.y);
                        }
                    }

                    if(pMoveParams.length > 0){
                        let tX = pMoveParams[pMoveParams.length-1].target.x;
                        let tY = pMoveParams[pMoveParams.length-1].target.y;
                        if(targetPoint.x != tX || targetPoint.y != tY){
                            pMoveParams.push({target: targetPoint, pParams: pParams});
                            if(pMoveParams.length > 2){
                                pMoveParams.shift();    // удаление 0 элемента массива
                            }
                            processMove(pMoveParams[0], pMoveParams[1]);
                            _recalcCoords();
                        }
                    } else{
                        pMoveParams.push({target: targetPoint, pParams: pParams});
                        _recalcCoords();
                    }

                }
                return null;
            });

            if(pMoveParams.length >= 2){
                pMoveParams.shift();    // удаление 0 элемента массива
                processMove(pMoveParams[0], null);
            }

        }

        if(_cmds !== null){
            process(_cmds);
        }

    }

    /**
     * Парсинг программы gcode
     * @param gcode код gcode
     */
    const parse = (gcode) => {

        gcode = gcode
            .replace(/(\(.+\))/gm, "")
            .replace(/(;.*)$/gm, "")
            .replace(/(%)/gm, "")
        ;

        let ls = gcode.split("\n");

        let cmds = [];
        ls.map((l, ind) => {
            l = l.trim();
            if(l.length > 0){
                let fcs = l.split(/\s+/g);
                fcs = fcs.map(el => {
                    let letter = el.substr(0, 1);
                    if(letter === 'N'){
                        return null;
                    }

                    let letterCode = typeof letterCodes[letter] !== "undefined" ? letterCodes[letter] : null;
                    if(letterCode === null){
                        return null;
                    }

                    let hexArr = null;

                    if(['X', 'Y', 'Z', 'A', 'B', 'C', 'P', 'F', 'S', 'R', 'D', 'L', 'I', 'J', 'K'].indexOf(letter) !== -1){
                        // преобразование float в массив hex
                        var view = new DataView(new ArrayBuffer(4));
                        view.setFloat32(0, parseFloat(el.substr(1)));
                        // hexArr = Array.apply(null, { length: 4 }).map((_, i) => view.getUint8(i));
                        hexArr = Array.apply(null, { length: 4 }).map((_, i) => view.getUint8(3-i));
                    }                    

                    return [letterCode, letter, parseFloat(el.substr(1)), hexArr];
                });
                cmds.push([ind, fcs]);
            }
        });

        _cmds = cmds;

        let datas = [];
        cmds.map(cmd => {
            let data = [];
            data.push(OBJ_NAME_CNC_GCODE);      // 0 - OBJ_NAME_CNC_GCODE
            data = data.concat([ (cmd[0]) & 0xFF, (cmd[0] >> 8) & 0xFF ]);          // 1,2 - номер строки
            cmd[1].map(cmdEl => {
                if(cmdEl !== null){
                    if(data.length+(cmdEl[3] !== null ? cmdEl.length : 1) < 15){
                        data.push(cmdEl[0]);
                        if(cmdEl[3] !== null){
                            data = data.concat(cmdEl[3]);
                        } else{
                            data.push(cmdEl[2]);
                        }
                    } else{
                        for(let i=data.length; i<15; i++)
                            data.push(0x00);
                        data.push(0xFF);
                        datas.push(data);
                        data = [];

                        data.push(cmdEl[0]);
                        if(cmdEl[3] !== null){
                            data = data.concat(cmdEl[3]);
                        } else{
                            data.push(cmdEl[2]);
                        }
                    }
                }
            });
            datas.push(data);
        });

        _datas = datas;

        return {validate: true, data: datas};
    }

    /**
     * Установка canvas
     * @param canvas canvas
     */
    const setCanvas = canvas => {
        _canvas = canvas;
        if(canvas.getContext){
            _ctx = canvas.getContext('2d');        
            GCodeCR.setCanvasContext(_ctx);
        }
    }

    /**
     * Установка точки пользовательского "нуля"
     * @param point точка пользовательского "нуля"
     */
    const setUserZeroPoint = point => {
        progParams.userZeroPoint = Object.assign({X: 0, Y: 0, Z: 0, A: 0, B: 0, C: 0}, point);
    }

    /**
     * Установка масштаба для Canvas
     * @param zoom масштаб
     */
    const setCanvasZoom = zoom => {
        _zoom = zoom;
    }

    /**
     * Установка координат навигации для Canvas
     * @param left смещение слева
     * @param top смещение сверху
     */
    const setCanvasNav = (left, top) => {
        _navLeft = left;
        _navTop = top;
    }

    return {
        parse,
        setCanvas,
        draw,
        setUserZeroPoint,
        setCanvasZoom,
        setCanvasNav,
    };
})();


export default GCode;


