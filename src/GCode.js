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

    const UNIT_METRIC = 0;
    const UNIT_INCH = 1;

    const CIRCLE_RADIUS = 0;
    const CIRCLE_INC = 1;

    const COMPENSATION_NONE = 0;      // компенсация инструмента отключена
    const COMPENSATION_LEFT = 1;      // компенсация радиуса инструмента слева от траектории
    const COMPENSATION_RIGHT = 2;     // компенсация радиуса инструмента справа от траектории
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
        compensationLastPoint: null,                            // последняя точка компенсации радиуса инструмента
        pause: 0.0,                                             // пауза задаваемая командой G04, в секундах
    };
    let progParamsLast = Object.assign({}, progParams);



    const command_G = (value, frame) => {
        let processThisCommand = true;
        switch(value){
            case 0:     // G00 - Ускоренное перемещение инструмента (холостой ход)
                progParams.runType = RUN_FAST;
                // progParams.radius = null;
                break;
            case 1:     // G01 - Линейная интерполяция, скорость перемещения задаётся здесь же или ранее модальной командой F
                progParams.runType = RUN_WORK_LINEAR;
                // progParams.radius = null;
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

        progParams.compensationLastPoint = null;

        // drawLine(pMoveParams, pMoveNextParams);

        // const drawLine = (targetX, targetY) => {
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
            let p3 = null;

            let compensationFunc = null;

            if(pMoveNextParams !== null){
                if(pMoveNextParams.pParams.runType === RUN_FAST){
                    compensationFunc = calcCompensationByLineLine;
                } else if(pMoveNextParams.pParams.runType === RUN_WORK_LINEAR){
                    compensationFunc = calcCompensationByLineLine;
                } else if(pMoveNextParams.pParams.runType === RUN_WORK_CW){
                    compensationFunc = calcCompensationByLineCircle;
                } else if(pMoveNextParams.pParams.runType === RUN_WORK_CCW){
                    compensationFunc = calcCompensationByLineCircle;
                }

                if(pMoveNextParams.pParams.runType !== RUN_FAST){
                    p3 = {
                        x: pMoveNextParams.target.x + pParams.userZeroPoint.X,
                        y: pMoveNextParams.target.y + pParams.userZeroPoint.Y
                    };
                }
            }

            _ctx.beginPath();
            _ctx.moveTo(p1.x*_zoom+_navLeft, p1.y*_zoom+_navTop);
            _ctx.lineTo(p2.x*_zoom+_navLeft, p2.y*_zoom+_navTop);
            _ctx.setLineDash(dash);
            _ctx.strokeStyle = "#000";
            _ctx.stroke();


            // let compensationPoints = calcCompensationByLine(pMoveParams, pMoveNextParams, p1, p2, p3);

            if(compensationFunc !== null){
                let { p8, p9, p10, side, shapeEnd } = compensationFunc(pMoveParams, pMoveNextParams, p1, p2, p3);
                // console.log(p8, p9, p10, side, type, circle);
                if(p8 !== null && p9 !== null){
                    // console.log('line compensationLastPoint', JSON.stringify(progParams.compensationLastPoint));
                    let lcp = progParams.compensationLastPoint === null ? p8 : progParams.compensationLastPoint;

                    // линия до точки компенсации радиуса
                    _ctx.beginPath();
                    _ctx.moveTo(lcp.x*_zoom+_navLeft, lcp.y*_zoom+_navTop);
                    _ctx.lineTo(p9.x*_zoom+_navLeft, p9.y*_zoom+_navTop);
                    _ctx.strokeStyle = side == COMPENSATION_LEFT ? "#800" : "#080";
                    _ctx.setLineDash([1, 4]);
                    _ctx.stroke();

                    // // точка
                    // _ctx.beginPath();
                    // _ctx.arc(p9.x*_zoom+_navLeft, p9.y*_zoom+_navTop, 2, 0, Math.PI*2, false);
                    // _ctx.fillStyle = "#080";
                    // _ctx.fill();

                    if(shapeEnd !== null && shapeEnd.type === COMPENSATION_RADIUS_SHAPE_CIRCLE){
                        const { circle } = shapeEnd;
                        _ctx.beginPath();
                        _ctx.arc(p2.x*_zoom+_navLeft, p2.y*_zoom+_navTop, (circle.radius)*_zoom, circle.a1, circle.a2, side == COMPENSATION_LEFT);
                        _ctx.setLineDash([1, 4]);
                        _ctx.stroke();
            
                        // // точка
                        // _ctx.beginPath();
                        // _ctx.arc(p10.x*_zoom+_navLeft, p10.y*_zoom+_navTop, 2, 0, Math.PI*2, false);
                        // _ctx.fillStyle = "#080";
                        // _ctx.fill();

                        progParams.compensationLastPoint = p10;
                    } else{

                        // // линия до точки компенсации радиуса
                        // _ctx.beginPath();
                        // _ctx.moveTo(lcp.x*_zoom+_navLeft, lcp.y*_zoom+_navTop);
                        // _ctx.lineTo(p9.x*_zoom+_navLeft, p9.y*_zoom+_navTop);
                        // _ctx.strokeStyle = side == COMPENSATION_LEFT ? "#800" : "#080";
                        // _ctx.setLineDash([1, 4]);
                        // _ctx.stroke();

                        // // точка
                        // _ctx.beginPath();
                        // _ctx.arc(p9.x*_zoom+_navLeft, p9.y*_zoom+_navTop, 2, 0, Math.PI*2, false);
                        // _ctx.fillStyle = "#080";
                        // _ctx.fill();



                        progParams.compensationLastPoint = p9;
                    }

                    if(p3 === null){
                        progParams.compensationLastPoint = null;
                    }
                }
            }
        }


        const calcCompensationByLineLine = (pMoveParams, pMoveNextParams, p1, p2, p3) => {

            let pParams = pMoveParams.pParams;

            let p8 = null;
            let p9 = null;
            let p10 = null;
            // let circle = null;
            let compensationSide = null;
            // let shapeEndType = null;
            let shapeEnd = null;

            if(pParams.compensationRadius.type != COMPENSATION_NONE){
                compensationSide = pParams.compensationRadius.type;

                // первая параллельная линия
                let pl = calcCompensationParallelLine(p1, p2, pParams);
                let p4 = pl.p1p, 
                    p5 = pl.p2p, 
                    angle1 = pl.angle, 
                    angle1Perp = pl.anglePerp;

                // console.log('p4, p5', p4, p5);
                // console.log('pl1', pl);

                if(p3 !== null){

                    // вторая параллельная линия
                    let pl = calcCompensationParallelLine(p2, p3, pParams);
                    let p6 = pl.p1p, 
                        p7 = pl.p2p, 
                        angle2 = pl.angle, 
                        angle2Perp = pl.anglePerp;

                    // console.log('pl2', pl);


                    // Получение фигуры при переходе от одной линии к другой.
                    // Это может быть точка (COMPENSATION_RADIUS_SHAPE_POINT) пересечения при угле пересечения параллельных линий менее 180 градусов
                    // или дуга окружности (COMPENSATION_RADIUS_SHAPE_CIRCLE) при угле более 180 градусов.
                    // При угле ровно 180 градусов берём точку.
                    let shapeEndType = getCompensationConnectionShape(angle1-Math.PI, angle2, pParams);
                    shapeEnd = {type: shapeEndType};

                    // console.log('shape', shape);

                    // console.log(p1, p2, p3, [angle1*180/Math.PI-180, angle2*180/Math.PI], dAngle*180/Math.PI, type);

                    if(shapeEndType === COMPENSATION_RADIUS_SHAPE_POINT){

                        // нахождение точки пересечения параллельных прямых p9
                        // уравнение прямой a*x + b*y + c = 0
                        let a1 = p4.y - p5.y;
                        let b1 = p5.x - p4.x;
                        let c1 = p4.x*p5.y - p5.x*p4.y;

                        let a2 = p6.y - p7.y;
                        let b2 = p7.x - p6.x;
                        let c2 = p6.x*p7.y - p7.x*p6.y;

                        // console.log('abc', [a1, b1, c1], [a2, b2, c2]);

                        if(a1 !== 0 || a2 !== 0){
                            let py = (a2*c1 - a1*c2) / (a1*b2 - a2*b1);
                            let px = 0;
                            
                            if(a1 !== 0)
                                px = -(b1*py + c1) / a1;
                            else
                                px = -(b2*py + c2) / a2;

                            // console.log('point', [px, py]);

                            p8 = p4;
                            p9 = {x: px, y: py};
                        }

                    } else if(shapeEndType === COMPENSATION_RADIUS_SHAPE_CIRCLE){

                        p8 = p4;
                        p9 = p5;
                        p10 = p6;

                        // console.log({p8, p9, p10});

                        let a1 = angle1Perp;
                        let a2 = angle2Perp;
                        if(pParams.compensationRadius.type == COMPENSATION_RIGHT){
                            a1 += Math.PI;
                            a2 += Math.PI;
                        }

                        shapeEnd.circle = {
                            a1,
                            a2,
                            radius: pParams.compensationRadius.value,
                        };

                    } else if(shapeEndType === COMPENSATION_RADIUS_SHAPE_NONE){

                        p8 = p4;
                        p9 = p5;
                    }
                    // console.log({p8, p9, p10});

                } else{
                    // конечная точка
                    p8 = p4;
                    p9 = p5;
                }

            } else{
                // компенсация радиуса для текущей линии выключена, но для следующей включена
                if(pMoveNextParams !== null && pMoveNextParams.pParams.compensationRadius.type != COMPENSATION_NONE){
                    compensationSide = pMoveNextParams.pParams.compensationRadius.type;

                    let pl = calcCompensationParallelLine(p2, pMoveNextParams.target, pMoveNextParams.pParams);
                    let p4 = pl.p1p;

                    p8 = p2;
                    p9 = p4;

                }
            }

            return {p8, p9, p10, side: compensationSide, shapeEnd};
        }

        const calcCompensationByLineCircle = (pMoveParams, pMoveNextParams, p1, p2, p3) => {

            let pParams = pMoveParams.pParams;

            let p8 = null;
            let p9 = null;
            let p10 = null;
            // let circle = null;
            let compensationSide = null;
            // let shapeEndType = null;
            let shapeEnd = null;


            if(pParams.compensationRadius.type != COMPENSATION_NONE){
                compensationSide = pParams.compensationRadius.type;

                // первая параллельная линия
                let pl = calcCompensationParallelLine(p1, p2, pParams);
                let p4 = pl.p1p, 
                    p5 = pl.p2p, 
                    angle1 = pl.angle, 
                    angle1Perp = pl.anglePerp;


                let cp2 = pMoveNextParams.pParams.circle.type === CIRCLE_RADIUS ? calcCircleByRadius(pMoveNextParams, null) : calcCircleByInc(pMoveNextParams, null);

                // console.log('cp2', cp2);

                // p3 = 
                // Получение фигуры при переходе от одной линии к другой.
                // Это может быть точка (COMPENSATION_RADIUS_SHAPE_POINT) пересечения при угле пересечения параллельных линий менее 180 градусов
                // или дуга окружности (COMPENSATION_RADIUS_SHAPE_CIRCLE) при угле более 180 градусов.
                // При угле ровно 180 градусов берём точку.
                let da = Math.PI/2;
                // if(!cp2.ccw && pParams.compensationRadius.type == COMPENSATION_RIGHT)
                if(!cp2.ccw)
                    da = -da;

                let shapeEndType = getCompensationConnectionShape(angle1-Math.PI, cp2.angle1+da, pParams);
                shapeEnd = {type: shapeEndType};

                // console.log('calcCompensationByLineCircle shape', shapeEnd);
                if(shapeEndType === COMPENSATION_RADIUS_SHAPE_POINT){

                    p8 = p4;

                    let rInc2 = pMoveNextParams.pParams.compensationRadius.value;
                    if(!cp2.ccw && pMoveNextParams.pParams.compensationRadius.type == COMPENSATION_RIGHT){
                        rInc2 = -rInc2;
                    } else if(cp2.ccw && pMoveNextParams.pParams.compensationRadius.type == COMPENSATION_LEFT){
                        rInc2 = -rInc2;
                    }

                    p9 = calcCompensationCrossLineCircle(p4, p5, {x: cp2.xc, y: cp2.yc}, cp2.r + rInc2);

                } else if(shapeEndType === COMPENSATION_RADIUS_SHAPE_CIRCLE){

                    p8 = p4;
                    p9 = p5;
                    
                    p10 = {
                        x: pMoveParams.target.x,
                        y: pMoveParams.target.y
                    };

                    let a1 = angle1Perp;
                    let a2 = cp2.angle1;

                    if(!cp2.ccw && pParams.compensationRadius.type == COMPENSATION_RIGHT){
                        a2 -= Math.PI;
                    } else if(cp2.ccw && pParams.compensationRadius.type == COMPENSATION_LEFT){
                        a2 += Math.PI;
                    }

                    if(pParams.compensationRadius.type == COMPENSATION_RIGHT){
                        a1 += Math.PI;
                    }

                    let cdx = pParams.compensationRadius.value * Math.cos(a2);
                    let cdy = pParams.compensationRadius.value * Math.sin(a2);
        
                    p10.x += cdx;
                    p10.y += cdy;

                    shapeEnd.circle = {
                        a1,
                        a2,
                        radius: pParams.compensationRadius.value,
                    };

                } else if(shapeEndType === COMPENSATION_RADIUS_SHAPE_NONE){

                }

            } else{
                // компенсация радиуса для текущей линии выключена, но для следующей включена
                if(pMoveNextParams !== null && pMoveNextParams.pParams.compensationRadius.type != COMPENSATION_NONE){
                    compensationSide = pMoveNextParams.pParams.compensationRadius.type;


                }
            }



            return {p8, p9, p10, side: compensationSide, shapeEnd};
        }

        /**
         * Поиск точек пересечения отрезка и окружности
         * @param p1 первая точка отрезка
         * @param p2 вторая точка отрезка
         * @param pc центр окружности
         * @param r радиус окружности
         */
        const calcCompensationCrossLineCircle = (p1, p2, pc, r) => {
            let crossPoint = null;

            // уравнение прямой a*x + b*y + c = 0
            // изменим параметр C с учётом того, что центр окружности считаем в начале координат
            let a1 = p1.y - p2.y;
            let b1 = p2.x - p1.x;
            // let c1 = p4.x*p5.y - p5.x*p4.y;
            let c1 = (p1.x-pc.x)*(p2.y-pc.y) - (p2.x-pc.x)*(p1.y-pc.y);


            let EPS = 1.0e-3;

            let a2b2 = a1*a1 + b1*b1;

            let x0 = -a1*c1/a2b2;
            let y0 = -b1*c1/a2b2;

            if(c1*c1 > r*r*a2b2 +EPS){
                // точек нет
                console.log('lineCircle dot', 'points not exists');
            } else if(Math.abs(c1*c1 - r*r*a2b2) < EPS){
                // одна точка
                let p12 = {
                    x: x0 + pc.x,
                    y: y0 + pc.y
                };
                // console.log('lineCircle dot', {p12});
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
                // console.log('lineCircle dot', {p4, p12, p13});

                let dp12 = {
                    dx: p1.x - p12.x,
                    dy: p1.y - p12.y
                };
                let dp13 = {
                    dx: p1.x - p13.x,
                    dy: p1.y - p13.y
                };

                if(dp12.dx*dp12.dx + dp12.dy*dp12.dy < dp13.dx*dp13.dx + dp13.dy*dp13.dy){
                    crossPoint = p12;
                } else{
                    crossPoint = p13;
                }

                // console.log('lineCircle dot p9', {p9});

            }
            
            return crossPoint;
        }

        /**
         * Поиск точек пересечения двух окружностей
         * @param pc1 центр первой окружности
         * @param r1 радиус первой окружности
         * @param pc2 центр второй окружности
         * @param r2 радиус второй окружности
         */
        const calcCompensationCrossCircleCircle = (pc1, r1, pc2, r2) => {
            
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
            // let x3 = cp.xc + a/d_2s*(cp2.xc - cp.xc);
            // let y3 = cp.yc + a/d_2s*(cp2.yc - cp.yc);

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

            // let x4 = x3 + tpx;
            // let y4 = y3 - tpy;
            // let x5 = x3 - tpx;
            // let y5 = y3 + tpy;

            // console.log('пересечение', {x4, y4, x5, y5});

            let angle1 = Math.atan2(p1.y-pc1.y, p1.x-pc1.x);
            let angle2 = Math.atan2(p2.y-pc1.y, p2.x-pc1.x);


            return {p0, p1, p2, angle1, angle2};
        }


        /**
         * Рассчёт параллельной линии
         * @param p1 первая точка отрезка
         * @param p2 вторая точка отрезка
         * @param pParams текущие параметры программы
         */
        const calcCompensationParallelLine = (p1, p2, pParams) => {
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

            let cdx = pParams.compensationRadius.value * Math.cos(anglePerp);
            let cdy = pParams.compensationRadius.value * Math.sin(anglePerp);

            if(pParams.compensationRadius.type == COMPENSATION_RIGHT){
                cdx = -cdx;
                cdy = -cdy;
            }

            // координаты отрезка параллельного первому
            p1p.x += cdx;
            p1p.y += cdy;
            p2p.x += cdx;
            p2p.y += cdy;

            return {p1p, p2p, angle, anglePerp};
        }


        const getCompensationConnectionShape = (angle1, angle2, pParams) => {
            // let dAngle = angle2 - (angle1 - Math.PI);
            let dAngle = angle2 - angle1;
            // if(angle2 > angle1) dAngle = angle1 - angle2;
            // dAngle = Math.abs(dAngle);

            if(dAngle >= Math.PI*2) dAngle -= Math.PI*2;
            else if(dAngle <= -Math.PI*2) dAngle = Math.abs(dAngle);
            else if(dAngle < 0) dAngle += Math.PI*2;
            // if(dAngle < 0) dAngle = Math.abs(dAngle);

            let shapeEndType = COMPENSATION_RADIUS_SHAPE_NONE;
            if(pParams.compensationRadius.type == COMPENSATION_LEFT){
                if(dAngle < Math.PI) shapeEndType = COMPENSATION_RADIUS_SHAPE_CIRCLE;
                else if(dAngle > Math.PI) shapeEndType = COMPENSATION_RADIUS_SHAPE_POINT;
            } else if(pParams.compensationRadius.type == COMPENSATION_RIGHT){
                if(dAngle < Math.PI) shapeEndType = COMPENSATION_RADIUS_SHAPE_POINT;
                else if(dAngle > Math.PI) shapeEndType = COMPENSATION_RADIUS_SHAPE_CIRCLE;
            }

            // console.log('angle2 > angle1', angle2 > angle1);

            console.log('getCompensationConnectionShape', {
                p10:progParams.compensationLastPoint,
                angle1:angle1*180/Math.PI, 
                angle2:angle2*180/Math.PI, 
                dAngle:dAngle*180/Math.PI,
                shapeEndType
            });


            return shapeEndType;
        }

        let debugCircleCount = 0;
        const drawCircle = (pMoveParams, pMoveNextParams, cp) => {
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

            // point center
            let pc = {
                x: cp.xc + pParams.userZeroPoint.X,
                y: cp.yc + pParams.userZeroPoint.Y
            };

            console.log('circle', ++debugCircleCount, cp, {angle1:cp.angle1*180/Math.PI, angle2:cp.angle2*180/Math.PI});

            let compensationFunc = null;

            if(pMoveNextParams !== null){
                if(pMoveNextParams.pParams.runType === RUN_WORK_LINEAR){
                    compensationFunc = calcCompensationByCircleLine;
                } else if(pMoveNextParams.pParams.runType === RUN_WORK_CW){
                    compensationFunc = calcCompensationByCircleCircle;
                } else if(pMoveNextParams.pParams.runType === RUN_WORK_CCW){
                    compensationFunc = calcCompensationByCircleCircle;
                }
            }

            _ctx.beginPath();
            _ctx.arc(pc.x*_zoom+_navLeft, pc.y*_zoom+_navTop, (cp.r)*_zoom, cp.angle1, cp.angle2, !cp.ccw);
            _ctx.setLineDash(dash);
            _ctx.strokeStyle = "#000";
            _ctx.stroke();


            if(compensationFunc !== null){
                // console.log('circle1 compensationLastPoint', JSON.stringify(progParams.compensationLastPoint));
                let { circle, p10, side, shapeEnd } = compensationFunc(pMoveParams, pMoveNextParams, p1, p2, p3, pc, cp);
                if(circle !== null){
                    // console.log('comp circle', circle);
                    if(circle.radius > 0){
                        _ctx.beginPath();
                        _ctx.arc(pc.x*_zoom+_navLeft, pc.y*_zoom+_navTop, (circle.radius)*_zoom, circle.a1, circle.a2, !cp.ccw);
                        _ctx.strokeStyle = side == COMPENSATION_LEFT ? "#800" : "#080";
                        _ctx.setLineDash([1, 4]);
                        _ctx.stroke();
                    
                        if(shapeEnd !== null && shapeEnd.type === COMPENSATION_RADIUS_SHAPE_CIRCLE){
                            const { circle } = shapeEnd;
                            // console.log({shapeEnd});
                            _ctx.beginPath();
                            _ctx.arc(p2.x*_zoom+_navLeft, p2.y*_zoom+_navTop, (circle.radius)*_zoom, circle.a1, circle.a2, side == COMPENSATION_LEFT);
                            _ctx.setLineDash([1, 4]);
                            _ctx.stroke();
                
                            // // точка
                            // _ctx.beginPath();
                            // _ctx.arc(p10.x*_zoom+_navLeft, p10.y*_zoom+_navTop, 2, 0, Math.PI*2, false);
                            // _ctx.fillStyle = "#080";
                            // _ctx.fill();

                            progParams.compensationLastPoint = p10;
                        } else{
                            // progParams.compensationLastPoint = p9;
                            // // точка
                            // _ctx.beginPath();
                            // _ctx.arc(p10.x*_zoom+_navLeft, p10.y*_zoom+_navTop, 2, 0, Math.PI*2, false);
                            // _ctx.fillStyle = "#080";
                            // _ctx.fill();

                            progParams.compensationLastPoint = p10;
                        }
                    }



                }

            }


        }


        const calcCompensationByCircleCircle = (pMoveParams, pMoveNextParams, p1, p2, p3, pointCenter, cp) => {

            let pParams = pMoveParams.pParams;

            let circle = null;
            let p10 = null;
            let compensationSide = null;
            let shapeEnd = null;

            if(pParams.compensationRadius.type != COMPENSATION_NONE){
                compensationSide = pParams.compensationRadius.type;

                let cp2 = pMoveNextParams.pParams.circle.type === CIRCLE_RADIUS ? calcCircleByRadius(pMoveNextParams, null) : calcCircleByInc(pMoveNextParams, null);


                // Получение фигуры при переходе от одной линии к другой.
                // Это может быть точка (COMPENSATION_RADIUS_SHAPE_POINT) пересечения при угле пересечения параллельных линий менее 180 градусов
                // или дуга окружности (COMPENSATION_RADIUS_SHAPE_CIRCLE) при угле более 180 градусов.
                // При угле ровно 180 градусов берём точку.
                let da1 = Math.PI/2;
                if(cp.ccw){
                    da1 = -da1;
                }
                let da2 = Math.PI/2;
                if(!cp2.ccw){
                    da2 = -da2;
                }




                /*
                // 
                let rInc = pParams.compensationRadius.value;
                if(!cp.ccw && pParams.compensationRadius.type == COMPENSATION_RIGHT){
                    rInc = -rInc;
                } else if(cp.ccw && pParams.compensationRadius.type == COMPENSATION_LEFT){
                    rInc = -rInc;
                }
                circle = {
                    a1: cp.angle1,
                    a2: cp.angle2,
                    radius: cp.r + rInc,
                };
                p10 = p2;
                // let shapeEndType = COMPENSATION_RADIUS_SHAPE_NONE;
                shapeEnd = {type: COMPENSATION_RADIUS_SHAPE_NONE};
                return {circle, p10, side: compensationSide, shapeEnd};
                */







                // if(cp2.angle1 < 0) cp2.angle1 += Math.PI*2;

                // let a1 = cp.angle2+da1;
                // let a2 = cp2.angle1+da2;
                // if(a2 > a1){
                //     let at = a1;
                //     a1 = a2;
                //     a2 = at;
                // }

                // let shapeEndType = getCompensationConnectionShape(a1, a2, pParams);

                let shapeEndType = getCompensationConnectionShape(cp.angle2+da1, cp2.angle1+da2, pParams);

                // if(!cp.ccw && !cp2.ccw && cp.angle2+da1 < cp2.angle1+da2 && shapeEndType === COMPENSATION_RADIUS_SHAPE_CIRCLE){
                //     shapeEndType = COMPENSATION_RADIUS_SHAPE_POINT;
                // }
                // if(cp.ccw && cp2.ccw && cp.angle2+da1 > cp2.angle1+da2 && shapeEndType === COMPENSATION_RADIUS_SHAPE_CIRCLE){
                //     shapeEndType = COMPENSATION_RADIUS_SHAPE_POINT;
                // }
                // if(cp.ccw && cp2.ccw && cp.angle2+da1 < 0 && cp2.angle1+da2 > 0 && shapeEndType === COMPENSATION_RADIUS_SHAPE_POINT){
                //     shapeEndType = COMPENSATION_RADIUS_SHAPE_CIRCLE;
                // }
                // if(!cp.ccw && !cp2.ccw && cp.angle2+da1 > 0 && cp2.angle1+da2 < 0 && shapeEndType === COMPENSATION_RADIUS_SHAPE_POINT){
                //     shapeEndType = COMPENSATION_RADIUS_SHAPE_CIRCLE;
                // }

                shapeEnd = {type: shapeEndType};
                // console.log({shapeEndType});
                if(shapeEndType === COMPENSATION_RADIUS_SHAPE_POINT){

                    let rInc = pParams.compensationRadius.value;
                    if(!cp.ccw && pParams.compensationRadius.type == COMPENSATION_RIGHT){
                        rInc = -rInc;
                    } else if(cp.ccw && pParams.compensationRadius.type == COMPENSATION_LEFT){
                        rInc = -rInc;
                    }

                    // console.log('circle2 compensationLastPoint', JSON.stringify(progParams.compensationLastPoint));
                    let lp = progParams.compensationLastPoint;
                    if(lp === null){
                        let cdx = pParams.compensationRadius.value * Math.cos(cp.angle1);
                        let cdy = pParams.compensationRadius.value * Math.sin(cp.angle1);
                        lp = {
                            x: p1.x + cdx,
                            y: p1.y + cdy
                        };
                    }
                        // console.log({progParams});
                    let dxc1 = lp.x - pointCenter.x;
                    let dyc1 = lp.y - pointCenter.y;
                    let angleLp = Math.atan2(dyc1, dxc1);


                    
                    let rInc2 = pMoveNextParams.pParams.compensationRadius.value;
                    if(!cp2.ccw && pMoveNextParams.pParams.compensationRadius.type == COMPENSATION_RIGHT){
                        rInc2 = -rInc2;
                    } else if(cp2.ccw && pMoveNextParams.pParams.compensationRadius.type == COMPENSATION_LEFT){
                        rInc2 = -rInc2;
                    }


                    // поиск точек пересечения двух окружностей

                    let r1 = cp.r + rInc;
                    let r2 = cp2.r + rInc2;

                    let { p0, p1, p2, angle1, angle2 } = calcCompensationCrossCircleCircle({x: cp.xc, y: cp.yc}, r1, {x: cp2.xc, y: cp2.yc}, r2);

                    // let dx = cp2.xc-cp.xc;
                    // let dy = cp2.yc-cp.yc
                    // let d_2 = dx*dx + dy*dy;
                    // let d_2s = Math.sqrt(d_2);
                    // let a = (r1*r1 - r2*r2 + d_2)/(2*d_2s);
                    // let h = Math.sqrt(r1*r1 - a*a);
                    // let p11 = {
                    //     x: cp.xc + a/d_2s*(cp2.xc - cp.xc),
                    //     y: cp.yc + a/d_2s*(cp2.yc - cp.yc)
                    // };
                    // // let x3 = cp.xc + a/d_2s*(cp2.xc - cp.xc);
                    // // let y3 = cp.yc + a/d_2s*(cp2.yc - cp.yc);

                    // let tpx = h/d_2s*dy;
                    // let tpy = h/d_2s*dx;
                    
                    // let p12 = {
                    //     x: p11.x + tpx,
                    //     y: p11.y - tpy
                    // };
                    // let p13 = {
                    //     x: p11.x - tpx,
                    //     y: p11.y + tpy
                    // };

                    // // let x4 = x3 + tpx;
                    // // let y4 = y3 - tpy;
                    // // let x5 = x3 - tpx;
                    // // let y5 = y3 + tpy;

                    // // console.log('пересечение', {x4, y4, x5, y5});

                    // let angle12 = Math.atan2(p12.y-cp.yc, p12.x-cp.xc);
                    // let angle13 = Math.atan2(p13.y-cp.yc, p13.x-cp.xc);

                    // let angle4 = Math.atan2(y4-cp.yc, x4-cp.xc);
                    // let angle5 = Math.atan2(y5-cp.yc, x5-cp.xc);

                    let da1 = Math.abs(cp.angle2 - angle1);
                    let da2 = Math.abs(cp.angle2 - angle2);

                    // let da4 = Math.abs(cp.angle2-angle4);
                    // let da5 = Math.abs(cp.angle2-angle5);


                    let angle3 = 0;
                    // console.log();
                    if(da1 < da2){
                        angle3 = angle1;
                        p10 = p1;                        
                    } else{
                        angle3 = angle2;
                        p10 = p2;
                    }

                    // if(!cp.ccw && !cp2.ccw && cp.angle2+da1 < cp2.angle1+da2){
                    //     if(da1 > da2){
                    //         angle3 = angle1;
                    //         p10 = p1;                        
                    //     } else{
                    //         angle3 = angle2;
                    //         p10 = p2;
                    //     }
                    // }


                    // let angle2 = da4 < da5 ? da4 : da4;

                    // console.log('углы', cp.angle2*180/Math.PI, angle4*180/Math.PI, angle5*180/Math.PI, Math.abs(cp.angle2-angle4)*180/Math.PI, Math.abs(cp.angle2-angle5)*180/Math.PI);

                    // console.log('shape point', pointCenter, cp.angle1, angle1);


                    // // точка
                    // _ctx.beginPath();
                    // _ctx.arc(x4*_zoom+_navLeft, y4*_zoom+_navTop, 2, 0, Math.PI*2, false);
                    // _ctx.fillStyle = "#080";
                    // _ctx.fill();
                    // // точка
                    // _ctx.beginPath();
                    // _ctx.arc(x5*_zoom+_navLeft, y5*_zoom+_navTop, 2, 0, Math.PI*2, false);
                    // _ctx.fillStyle = "#00F";
                    // _ctx.fill();


                    circle = {
                        a1: angleLp,
                        a2: angle3,
                        radius: cp.r + rInc,
                    };

                    console.log('CircleCircle point circle', {
                        a1:circle.a1*180/Math.PI,
                        a2:circle.a2*180/Math.PI,
                        radius:circle.radius,
                        da1:da1*180/Math.PI, 
                        da2:da2*180/Math.PI, 
                        cp_angle2:cp.angle2*180/Math.PI,
                        angle1:angle1*180/Math.PI, 
                        angle2:angle2*180/Math.PI,
                    });

                    if(isNaN(circle.a2)){
                        console.log('ERROR', {
                            angle1, angle2, p1, p2, cp, p0, r1, r2
                        });
                    }


                    // p10 = {
                    //     x: p2.x,
                    //     y: p2.y,
                    // };





                } else if(shapeEndType === COMPENSATION_RADIUS_SHAPE_CIRCLE){

                    let rInc = pParams.compensationRadius.value;
                    if(!cp.ccw && pParams.compensationRadius.type == COMPENSATION_RIGHT){
                        rInc = -rInc;
                    } else if(cp.ccw && pParams.compensationRadius.type == COMPENSATION_LEFT){
                        rInc = -rInc;
                    }

                    // console.log('circle2 compensationLastPoint', JSON.stringify(progParams.compensationLastPoint));
                    let lp = progParams.compensationLastPoint;
                    if(lp === null){
                        let cdx = pParams.compensationRadius.value * Math.cos(cp.angle1);
                        let cdy = pParams.compensationRadius.value * Math.sin(cp.angle1);
                        lp = {
                            x: p1.x + cdx,
                            y: p1.y + cdy
                        };
                    }
    
                    // console.log({progParams});
                    let dxc = lp.x - pointCenter.x;
                    let dyc = lp.y - pointCenter.y;
                    let angle1 = Math.atan2(dyc, dxc);

                    // console.log('shape circle', pointCenter, cp.angle1, angle1);

                    circle = {
                        // a1: cp.angle1,
                        a1: angle1,
                        a2: cp.angle2,
                        radius: cp.r + rInc,
                    };


                    p10 = {
                        x: p2.x, //pMoveParams.target.x,
                        y: p2.y, //pMoveParams.target.y
                    };

                    let a1 = cp.angle2; // + Math.PI;
                    let a2 = cp2.angle1;
                    // if(pParams.compensationRadius.type == COMPENSATION_RIGHT){
                    if(!cp.ccw){
                        a1 += Math.PI;
                        a2 += Math.PI;
                    }

                    if(pParams.compensationRadius.type == COMPENSATION_LEFT){
                        a1 -= Math.PI;
                    }

                    if(cp2.ccw && pParams.compensationRadius.type == COMPENSATION_LEFT){
                        a2 -= Math.PI;
                    }

                    if(!cp.ccw && cp2.ccw){
                        a2 -= Math.PI;
                    }


                    let cdx = pParams.compensationRadius.value * Math.cos(a2);
                    let cdy = pParams.compensationRadius.value * Math.sin(a2);
        
                    if(pParams.compensationRadius.type == COMPENSATION_RIGHT){
                        // cdx = -cdx;
                        // cdy = -cdy;
                    }
        
                    p10.x += cdx;
                    p10.y += cdy;

                    shapeEnd.circle = {
                        a1,
                        a2,
                        radius: pParams.compensationRadius.value,
                    };

                    console.log('shapeEnd.circle', {a1:a1/Math.PI*180, a2:a2/Math.PI*180, p10});




                } else if(shapeEndType === COMPENSATION_RADIUS_SHAPE_NONE){

                    let rInc = pParams.compensationRadius.value;
                    if(!cp.ccw && pParams.compensationRadius.type == COMPENSATION_RIGHT){
                        rInc = -rInc;
                    } else if(cp.ccw && pParams.compensationRadius.type == COMPENSATION_LEFT){
                        rInc = -rInc;
                    }

                    let lp = progParams.compensationLastPoint;
                    if(lp === null){
                        let cdx = pParams.compensationRadius.value * Math.cos(cp.angle1);
                        let cdy = pParams.compensationRadius.value * Math.sin(cp.angle1);
                        lp = {
                            x: p1.x + cdx,
                            y: p1.y + cdy
                        };
                    }
                        // console.log({progParams});
                    let dxc1 = lp.x - pointCenter.x;
                    let dyc1 = lp.y - pointCenter.y;
                    let angle1 = Math.atan2(dyc1, dxc1);


                    circle = {
                        a1: angle1,
                        a2: cp.angle2,
                        radius: cp.r + rInc,
                    };

                    p10 = {
                        x: p2.x, //pMoveParams.target.x,
                        y: p2.y, //pMoveParams.target.y
                    };

                    let a2 = cp2.angle1;

                    if(!cp.ccw){
                        a2 += Math.PI;
                    }

                    if(cp2.ccw && pParams.compensationRadius.type == COMPENSATION_LEFT){
                        a2 -= Math.PI;
                    }


                    let cdx = pParams.compensationRadius.value * Math.cos(a2);
                    let cdy = pParams.compensationRadius.value * Math.sin(a2);
        
                    if(pParams.compensationRadius.type == COMPENSATION_RIGHT){
                        // cdx = -cdx;
                        // cdy = -cdy;
                    }
        
                    p10.x += cdx;
                    p10.y += cdy;

                    // console.log('shapeEnd.none', a1/Math.PI*180, a2/Math.PI*180, p10);

                }

            } else{

            }



            return {circle, p10, side: compensationSide, shapeEnd};
        }
        
        const calcCompensationByCircleLine = (pMoveParams, pMoveNextParams, p1, p2, p3, pointCenter, cp) => {

            let pParams = pMoveParams.pParams;

            let circle = null;

            let p10 = null;
            let compensationSide = null;
            let shapeEnd = null;

            if(pParams.compensationRadius.type != COMPENSATION_NONE){
                compensationSide = pParams.compensationRadius.type;

                let rInc = pParams.compensationRadius.value;
                if(!cp.ccw && pParams.compensationRadius.type == COMPENSATION_RIGHT){
                    rInc = -rInc;
                } else if(cp.ccw && pParams.compensationRadius.type == COMPENSATION_LEFT){
                    rInc = -rInc;
                }

                // console.log('circle2 compensationLastPoint', JSON.stringify(progParams.compensationLastPoint));
                let lp = progParams.compensationLastPoint;
                if(lp === null){
                    let cdx = pParams.compensationRadius.value * Math.cos(cp.angle1);
                    let cdy = pParams.compensationRadius.value * Math.sin(cp.angle1);
                    lp = {
                        x: p1.x + cdx,
                        y: p1.y + cdy
                    };
                }
                // console.log({progParams});
                let dxc1 = lp.x - pointCenter.x;
                let dyc1 = lp.y - pointCenter.y;
                let angle1 = Math.atan2(dyc1, dxc1);


                // вторая параллельная линия
                let pl = calcCompensationParallelLine(p2, p3, pParams);
                let p6 = pl.p1p, 
                    p7 = pl.p2p,
                    angle2 = pl.angle, 
                    angle2Perp = pl.anglePerp;


                // Получение фигуры при переходе от одной линии к другой.
                // Это может быть точка (COMPENSATION_RADIUS_SHAPE_POINT) пересечения при угле пересечения параллельных линий менее 180 градусов
                // или дуга окружности (COMPENSATION_RADIUS_SHAPE_CIRCLE) при угле более 180 градусов.
                // При угле ровно 180 градусов берём точку.
                let da = Math.PI/2;
                if(cp.ccw){
                    da = -da;
                }
                let shapeEndType = getCompensationConnectionShape(cp.angle2+da, angle2, pParams);
                shapeEnd = {type: shapeEndType};
                // console.log({shapeEndType});
                if(shapeEndType === COMPENSATION_RADIUS_SHAPE_POINT){

                    // console.log({p7, p6, cp, rInc});
                    p10 = calcCompensationCrossLineCircle(p7, p6, {x: cp.xc, y: cp.yc}, cp.r + rInc);
                    // console.log({p10});

                    let dxc2 = p10.x - cp.xc;
                    let dyc2 = p10.y - cp.yc;
                    angle2 = Math.atan2(dyc2, dxc2);
    
                    // console.log({p10, angle1:angle1*180/Math.PI, angle2:angle2*180/Math.PI});

                    circle = {
                        a1: angle1,
                        a2: angle2,
                        radius: cp.r + rInc,
                    };


                } else if(shapeEndType === COMPENSATION_RADIUS_SHAPE_CIRCLE){

                    circle = {
                        a1: angle1,
                        a2: cp.angle2,
                        radius: cp.r + rInc,
                    };

                    p10 = {
                        x: p2.x,
                        y: p2.y,
                    };

                    let a1 = cp.angle2;
                    let a2 = angle2Perp;

                    if(!cp.ccw && pParams.compensationRadius.type == COMPENSATION_RIGHT){
                        a1 += Math.PI;
                    } else if(cp.ccw && pParams.compensationRadius.type == COMPENSATION_LEFT){
                        a1 -= Math.PI;
                    }

                    if(pParams.compensationRadius.type == COMPENSATION_RIGHT){
                        a2 -= Math.PI;
                    }                    

                    let cdx = pParams.compensationRadius.value * Math.cos(a2);
                    let cdy = pParams.compensationRadius.value * Math.sin(a2);
        
                    p10.x += cdx;
                    p10.y += cdy;

                    shapeEnd.circle = {
                        a1,
                        a2,
                        radius: pParams.compensationRadius.value,
                    };

                    // console.log('shapeEnd', {p10, a1:a1*180/Math.PI, a2:a2*180/Math.PI});
                } else if(shapeEndType === COMPENSATION_RADIUS_SHAPE_NONE){

                }


            } else{

            }



            return {circle, p10, side: compensationSide, shapeEnd};

        }
        

        const calcCircleByRadius = (pMoveParams, pMoveNextParams, calcCompensation=true) => {
         
            let targetX = pMoveParams.target.x;
            let targetY = pMoveParams.target.y;

            let pParams = pMoveParams.pParams;

            let x1 = pParams.currentCoord.X;
            let y1 = pParams.currentCoord.Y;
            let x2 = targetX;
            let y2 = targetY;
            let dx = x2-x1;
            let dy = y2-y1;
            let r = pParams.circle.radius;

            let radiusPositive = r >= 0;
            r = Math.abs(r);

            let d = Math.sqrt(dx*dx+dy*dy);
            let h = Math.sqrt(r*r-(d/2)*(d/2));

            let xc1 = x1 + dx/2 + h*dy / d;
            let yc1 = y1 + dy/2 - h*dx / d;

            let xc2 = x1 + dx/2 - h*dy / d;
            let yc2 = y1 + dy/2 + h*dx / d;


            let xc = xc2;
            let yc = yc2;

            if( (pParams.runType == RUN_WORK_CW && radiusPositive) || (pParams.runType == RUN_WORK_CCW && !radiusPositive) ){
                xc = xc1;
                yc = yc1;
            }

            let dxc1 = x1-xc;
            let dyc1 = y1-yc;
            let dxc2 = x2-xc;
            let dyc2 = y2-yc;

            let angle1 = Math.atan2(dyc1, dxc1);
            let angle2 = Math.atan2(dyc2, dxc2);

            let ccw = pParams.runType === RUN_WORK_CCW;

            // if(!ccw){
            //     if(angle1 < 0){
            //         angle1 += Math.PI*2;
            //     }

            // } else{
            //     if(angle2 < 0){
            //         angle2 += Math.PI*2;
            //         if(angle1 < 0){
            //             angle1 += Math.PI*2;
            //         }
            //     }
            // }

            // if(!ccw && angle1 < 0){
            //     angle1 += Math.PI*2;
            // } else if(ccw && angle2 < 0){
            //     angle2 += Math.PI*2;
            // }

            return {xc, yc, r, angle1, angle2, ccw};
        }

        const calcCircleByInc = (pMoveParams, pMoveNextParams, calcCompensation=true) => {

            let targetX = pMoveParams.target.x;
            let targetY = pMoveParams.target.y;

            let pParams = pMoveParams.pParams;

            let x1 = pParams.currentCoord.X;
            let y1 = pParams.currentCoord.Y;
            let x2 = targetX;
            let y2 = targetY;

            let incI = pParams.circle.inc.I;
            let incJ = pParams.circle.inc.J;

            let xc = pParams.currentCoord.X + incI;
            let yc = pParams.currentCoord.Y + incJ;

            let r = Math.sqrt(incI*incI + incJ*incJ);

            let dxc1 = x1-xc;
            let dyc1 = y1-yc;
            let dxc2 = x2-xc;
            let dyc2 = y2-yc;

            let angle1 = Math.atan2(dyc1, dxc1);
            let angle2 = Math.atan2(dyc2, dxc2);

            let ccw = pParams.runType === RUN_WORK_CCW;
            return {xc, yc, r, angle1, angle2, ccw};
        }


        const recalcCoords = (targetX, targetY) => {
            progParams.currentCoord.X = targetX;
            progParams.currentCoord.Y = targetY;
            // if(progParams.coordSystem === COORD_RELATIVE){
            //     // progParams.targetCoord.X = 0;
            //     // progParams.targetCoord.Y = 0;
            // } else{

            // }
        }


        let lastTargetX = 0.0;
        let lastTargetY = 0.0;
        // let willMove = false;        // будет выполнено перемещение

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
                        progParams.targetCoord.X = value;
                        break;
                    case 'Y':
                        progParams.targetCoord.Y = value;
                        break;
                    case 'Z':
                        progParams.targetCoord.Z = value;
                        break;
                    case 'A':
                        progParams.targetCoord.A = value;
                        break;
                    case 'B':
                        progParams.targetCoord.B = value;
                        break;
                    case 'C':
                        progParams.targetCoord.C = value;
                        break;

                    case 'I':
                        progParams.circle.type = CIRCLE_INC;
                        progParams.circle.inc.I = value;
                        break;
                    case 'J':
                        progParams.circle.type = CIRCLE_INC;
                        progParams.circle.inc.J = value;
                        break;
                    case 'K':
                        progParams.circle.type = CIRCLE_INC;
                        progParams.circle.inc.K = value;
                        break;

                    default:
                        break;
                }

                return null;
            });

            if(!processThisFrame)       // текущую команду Gxx не обрабатываем
                return false;

            // console.log('progParams', JSON.stringify(progParams));

            // let targetX = 0;
            // let targetY = 0;
            // if([RUN_FAST, RUN_WORK_LINEAR, RUN_WORK_CW, RUN_WORK_CCW].indexOf(progParams.runType) >= 0){
            //     // targetX = progParams.targetCoord.X + (progParams.coordSystem === COORD_RELATIVE ? progParams.systemCoord.X : 0);
            //     // targetY = progParams.targetCoord.Y + (progParams.coordSystem === COORD_RELATIVE ? progParams.systemCoord.Y : 0);
            //     targetX = progParams.targetCoord.X + progParams.systemCoord.X;
            //     targetY = progParams.targetCoord.Y + progParams.systemCoord.Y;
            // }

            // // let willMove = false;        // будет выполнено перемещение
            // if(progParams.runType === RUN_FAST){
            //     // if(lastTargetX != targetX || lastTargetY != targetY){
            //     //     willMove = true;
            //     //     lastTargetX = targetX;
            //     //     lastTargetY = targetY;
            //     // }
            //     drawLine(targetX, targetY);
            //     recalcCoords(targetX, targetY);
            // } else if(progParams.runType === RUN_WORK_LINEAR){
            //     console.log(frame, targetX, targetY);
            //     drawLine(targetX, targetY);
            //     recalcCoords(targetX, targetY);
            // } else if(progParams.runType === RUN_WORK_CW){
            //     let cp = progParams.circle.type === CIRCLE_RADIUS ? calcCircleByRadius(targetX, targetY) : calcCircleByInc(targetX, targetY);
            //     drawCircle(cp);
            //     recalcCoords(targetX, targetY);
            // } else if(progParams.runType === RUN_WORK_CCW){
            //     let cp = progParams.circle.type === CIRCLE_RADIUS ? calcCircleByRadius(targetX, targetY) : calcCircleByInc(targetX, targetY);
            //     drawCircle(cp);
            //     recalcCoords(targetX, targetY);
            // }

            return true;
        }

        // const processMove = (pParams) => {
        const processMove = (pMoveParams, pMoveNextParams) => {

            let pParams = pMoveParams.pParams;

            let targetX = 0;
            let targetY = 0;
            if([RUN_FAST, RUN_WORK_LINEAR, RUN_WORK_CW, RUN_WORK_CCW].indexOf(pParams.runType) >= 0){
                // targetX = progParams.targetCoord.X + (progParams.coordSystem === COORD_RELATIVE ? progParams.systemCoord.X : 0);
                // targetY = progParams.targetCoord.Y + (progParams.coordSystem === COORD_RELATIVE ? progParams.systemCoord.Y : 0);
                targetX = pParams.targetCoord.X + pParams.systemCoord.X;
                targetY = pParams.targetCoord.Y + pParams.systemCoord.Y;
            }

            // let willMove = false;        // будет выполнено перемещение
            if(pParams.runType === RUN_FAST){
                // if(lastTargetX != targetX || lastTargetY != targetY){
                //     willMove = true;
                //     lastTargetX = targetX;
                //     lastTargetY = targetY;
                // }
                // drawLine(targetX, targetY);
                drawLine(pMoveParams, pMoveNextParams);
                // recalcCoords(targetX, targetY);
            } else if(pParams.runType === RUN_WORK_LINEAR){
                // console.log(frame, targetX, targetY);
                // drawLine(targetX, targetY);
                drawLine(pMoveParams, pMoveNextParams);
                // recalcCoords(targetX, targetY);
            } else if(pParams.runType === RUN_WORK_CW){
                let cp = pParams.circle.type === CIRCLE_RADIUS ? calcCircleByRadius(pMoveParams, pMoveNextParams) : calcCircleByInc(pMoveParams, pMoveNextParams);
                drawCircle(pMoveParams, pMoveNextParams, cp);
                // recalcCoords(targetX, targetY);
            } else if(pParams.runType === RUN_WORK_CCW){
                let cp = pParams.circle.type === CIRCLE_RADIUS ? calcCircleByRadius(pMoveParams, pMoveNextParams) : calcCircleByInc(pMoveParams, pMoveNextParams);
                drawCircle(pMoveParams, pMoveNextParams, cp);
                // recalcCoords(targetX, targetY);
            }

        }

        const process = (cmds) => {
            // console.log('process');

            // let targetX = progParams.currentCoord.X;
            // let targetY = progParams.currentCoord.Y;

            let pMoveParams = [];
            // let pParams = Object.assign({}, progParams);
            // pMoveParams.push({target: {x: targetX, y: targetY}, pParams: pParams});

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
                    // console.log('---');
                    // console.log('pParams', JSON.stringify(pParams), JSON.stringify(pParams.targetCoord));
                    // console.log('processFrame', pParams.targetCoord, pParams.systemCoord, [pParams.targetCoord.X + pParams.systemCoord.X, pParams.targetCoord.Y + pParams.systemCoord.Y]);
                    let targetPoint = {x: pParams.targetCoord.X + pParams.systemCoord.X, y: pParams.targetCoord.Y + pParams.systemCoord.Y};
                    // let targetX = pParams.targetCoord.X + pParams.systemCoord.X;
                    // let targetY = pParams.targetCoord.Y + pParams.systemCoord.Y;
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
                            // pMoveParams.push({target: {x: targetX, y: targetY}, pParams: pParams});
                            if(pMoveParams.length > 2){
                                pMoveParams.shift();    // удаление 0 элемента массива
                                // console.log('shift');
                            }
                            // console.log('pMoveParams', JSON.stringify(pMoveParams));
                            processMove(pMoveParams[0], pMoveParams[1]);
                            _recalcCoords();
                        }
                    } else{
                        pMoveParams.push({target: targetPoint, pParams: pParams});
                        // pMoveParams.push({target: {x: targetX, y: targetY}, pParams: pParams});
                        // console.log('pMoveParams', JSON.stringify(pMoveParams));
                        processMove(pMoveParams[0], null);
                        _recalcCoords();
                    }

                    // pMoveParams.push({target: targetPoint, pParams: pParams});
                    

                    // if([RUN_FAST, RUN_WORK_LINEAR, RUN_WORK_CW, RUN_WORK_CCW].indexOf(pParams.runType) >= 0){

                    // }

                    // processMove(pParams);
                }
                return null;
            });

            // console.log('last command', );
            if(pMoveParams.length >= 2){
                pMoveParams.shift();    // удаление 0 элемента массива
                // console.log('shift');
                processMove(pMoveParams[0], null);
            }
            // console.log('pMoveParams', JSON.stringify(pMoveParams));


        }

        process(_cmds);

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
        if(canvas.getContext)
            _ctx = canvas.getContext('2d');        
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
        parse: parse,
        setCanvas: setCanvas,
        draw: draw,
        setUserZeroPoint: setUserZeroPoint,
        setCanvasZoom: setCanvasZoom,
        setCanvasNav: setCanvasNav,
    };
})();


export default GCode;


