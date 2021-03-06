/*
amikodev/factory-reactjs - Industrial equipment management with ReactJS
Copyright © 2020 Prihodko Dmitriy - prihdmitriy@yandex.ru
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
            case 41:    // G41 - Компенсировать радиус инструмента слева от траектории
            case 42:    // G42 - Компенсировать радиус инструмента справа от траектории
            case 43:    // G43 - Компенсировать длину инструмента положительно
            case 44:    // G44 - Компенсировать длину инструмента отрицательно
            case 49:    // G49 - Отмена компенсации длины инструмента
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

        // очистка канваса
        _ctx.clearRect(0, 0, _canvas.width, _canvas.height);

        const drawLine = (targetX, targetY) => {
            let dash = progParams.runType === RUN_FAST ? [4, 4] : [];

            _ctx.beginPath();
            _ctx.moveTo((progParams.currentCoord.X+progParams.userZeroPoint.X)*_zoom+_navLeft, (progParams.currentCoord.Y+progParams.userZeroPoint.Y)*_zoom+_navTop);
            _ctx.lineTo((targetX+progParams.userZeroPoint.X)*_zoom+_navLeft, (targetY+progParams.userZeroPoint.Y)*_zoom+_navTop);
            _ctx.setLineDash(dash);
            _ctx.stroke();

        }

        const drawCircle = cp => {
            let dash = [];
            _ctx.beginPath();
            _ctx.arc((cp.xc+progParams.userZeroPoint.X)*_zoom+_navLeft, (cp.yc+progParams.userZeroPoint.Y)*_zoom+_navTop, (cp.r)*_zoom, cp.angle1, cp.angle2, !cp.ccw);
            _ctx.setLineDash(dash);
            _ctx.stroke();
        }

        const calcCircleByRadius = (targetX, targetY) => {
         
            let x1 = progParams.currentCoord.X;
            let y1 = progParams.currentCoord.Y;
            let x2 = targetX;
            let y2 = targetY;
            let dx = x2-x1;
            let dy = y2-y1;
            let r = progParams.circle.radius;
            // let r = progParams.radius;

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

            if( (progParams.runType == RUN_WORK_CW && radiusPositive) || (progParams.runType == RUN_WORK_CCW && !radiusPositive) ){
                xc = xc1;
                yc = yc1;
            }

            let dxc1 = x1-xc;
            let dyc1 = y1-yc;
            let dxc2 = x2-xc;
            let dyc2 = y2-yc;

            let angle1 = Math.atan2(dyc1, dxc1);
            let angle2 = Math.atan2(dyc2, dxc2);

            let ccw = progParams.runType === RUN_WORK_CCW;
            return {xc, yc, r, angle1, angle2, ccw};
        }

        const calcCircleByInc = (targetX, targetY) => {

            let x1 = progParams.currentCoord.X;
            let y1 = progParams.currentCoord.Y;
            let x2 = targetX;
            let y2 = targetY;

            let incI = progParams.circle.inc.I;
            let incJ = progParams.circle.inc.J;

            let xc = progParams.currentCoord.X + incI;
            let yc = progParams.currentCoord.Y + incJ;

            let r = Math.sqrt(incI*incI + incJ*incJ);

            let dxc1 = x1-xc;
            let dyc1 = y1-yc;
            let dxc2 = x2-xc;
            let dyc2 = y2-yc;

            let angle1 = Math.atan2(dyc1, dxc1);
            let angle2 = Math.atan2(dyc2, dxc2);

            let ccw = progParams.runType === RUN_WORK_CCW;
            return {xc, yc, r, angle1, angle2, ccw};
        }


        const recalcCoords = (targetX, targetY) => {
            progParams.currentCoord.X = targetX;
            progParams.currentCoord.Y = targetY;
            if(progParams.coordSystem === COORD_RELATIVE){
                // progParams.targetCoord.X = 0;
                // progParams.targetCoord.Y = 0;
            } else{

            }
        }


        const processFrame = frame => {
            // console.log('frame', frame);
            let processThisFrame = true;

            frame.map(el => {
                // console.log('el', el);
                let letter = el[0];
                let value = el[1];

                if(!processThisFrame)       // текущую команду Gxx не обрабатываем
                    return;

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

            });

            if(!processThisFrame)       // текущую команду Gxx не обрабатываем
                return;

            // console.log('progParams', JSON.stringify(progParams));

            let targetX = 0;
            let targetY = 0;
            if([RUN_FAST, RUN_WORK_LINEAR, RUN_WORK_CW, RUN_WORK_CCW].indexOf(progParams.runType) >= 0){
                // targetX = progParams.targetCoord.X + (progParams.coordSystem === COORD_RELATIVE ? progParams.systemCoord.X : 0);
                // targetY = progParams.targetCoord.Y + (progParams.coordSystem === COORD_RELATIVE ? progParams.systemCoord.Y : 0);
                targetX = progParams.targetCoord.X + progParams.systemCoord.X;
                targetY = progParams.targetCoord.Y + progParams.systemCoord.Y;
            }

            if(progParams.runType === RUN_FAST){
                drawLine(targetX, targetY);
                recalcCoords(targetX, targetY);
            } else if(progParams.runType === RUN_WORK_LINEAR){
                drawLine(targetX, targetY);
                recalcCoords(targetX, targetY);
            } else if(progParams.runType === RUN_WORK_CW){
                let cp = progParams.circle.type === CIRCLE_RADIUS ? calcCircleByRadius(targetX, targetY) : calcCircleByInc(targetX, targetY);
                drawCircle(cp);
                recalcCoords(targetX, targetY);
            } else if(progParams.runType === RUN_WORK_CCW){
                let cp = progParams.circle.type === CIRCLE_RADIUS ? calcCircleByRadius(targetX, targetY) : calcCircleByInc(targetX, targetY);
                drawCircle(cp);
                recalcCoords(targetX, targetY);
            }

        }

        const process = (cmds) => {
            // console.log('process');
            cmds.map(cmd => {
                let frame = [];
                cmd[1].map(cmdEl => {
                    if(cmdEl === null){
                        return;
                    }
                    let letter = cmdEl[1];
                    let value = cmdEl[2];
                    frame.push([letter, value]);
                });
                processFrame(frame);
            });
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


