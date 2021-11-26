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

/**
 * GCode
 * 
 * https://ru.wikipedia.org/wiki/G-code
 * 
 * @author Prihodko D. G.
 * @copyright CB Asket
 * 
 */

 import GCodeCR from '../GCodeCompensationRadius';
 import { COMPENSATION_NONE, COMPENSATION_LEFT, COMPENSATION_RIGHT } from '../GCodeCompensationRadius';
 
const letterCodes = {
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

const COORD_SYSTEM_NULL = 0;
const COORD_SYSTEM_USER = 1;

const zeroPoint = {x: 0, y: 0, z: 0, a: 0, b: 0, c: 0};
const zeroCircleInc = {i: 0, j: 0, k: 0};

const FRAME_TYPE_UNKNOWN = 0;
const FRAME_TYPE_MOVE_LINE_FAST = 1;
const FRAME_TYPE_MOVE_LINE_WORK = 2;
const FRAME_TYPE_MOVE_CIRCLE_CW = 3;
const FRAME_TYPE_MOVE_CIRCLE_CCW = 4;
const FRAME_TYPE_PAUSE = 5;

const moveTypes = [FRAME_TYPE_MOVE_LINE_FAST, FRAME_TYPE_MOVE_LINE_WORK, FRAME_TYPE_MOVE_CIRCLE_CW, FRAME_TYPE_MOVE_CIRCLE_CCW];



var GCode = (function(){

    const OBJ_NAME_CNC_GCODE = 0x50;


    const COORD_ABSOLUTE = 0;
    const COORD_RELATIVE = 1;
    const COORD_OFFSET = 2;

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

    let _cmds = null;
    let _datas = null;


    let progParams2 = {
        numLine: 0,                                     // номер текущей строки
        coordType: COORD_ABSOLUTE,                      // тип координат
        currentCoord: Object.assign({}, zeroPoint),     // текущие координаты (абсолютные)
        targetCoord:  Object.assign({}, zeroPoint),     // целевые координаты (абсолютные или относительные, в зависимости от coordType)
        offsetCoord:  Object.assign({}, zeroPoint),     // координаты смещения (G92)
        unit: UNIT_METRIC,                              // единицы измерения
        compensationRadius: {                           // компенсация радиуса
            type: COMPENSATION_NONE,
            value: 0.0,
        },
        speed: 0.0,                                     // скорость перемещения, мм/сек
    };

    let framesData = [];                // подготовленные данные
    let prevFrameData = {};             // данные предыдущего фрейма


    let progParams = {
        numLine: 0,
        coordType: COORD_ABSOLUTE,
        runType: RUN_FAST,
        currentCoord: Object.assign({}, zeroPoint),     // текущие координаты (абсолютные)
        targetCoord:  Object.assign({}, zeroPoint),     // целевые координаты (абсолютные или относительные, в зависимости от coordType)
        offsetCoord:  Object.assign({}, zeroPoint),     // координаты смещения (G92)
        unit: UNIT_METRIC,                                      // единицы измерения
        circle: {
            type: CIRCLE_RADIUS,                                // тип окружности (CIRCLE_RADIUS, CIRCLE_INC)
            radius: 0,                                          // радиус окружности
            inc: Object.assign({}, zeroCircleInc),
        },
        compensationRadius: {
            type: COMPENSATION_NONE,
            value: 0.0,
        },
        // compensationLength: {
        //     type: COMPENSATION_NONE,
        //     value: 0.0,
        // },
        // compensationLastPoint: null,                            // последняя точка компенсации радиуса инструмента
        speed: 0.0,                                     // скорость перемещения, мм/сек
        pause: 0.0,                                     // пауза задаваемая командой G04, в секундах
        probe: {                                        // подача до пропуска
            point: Object.assign({}, zeroPoint),            // конечная точка перемещения
            speed: 0.0,                                     // скорость перемещения, мм/сек
            backOffset: 0.0,                                // величина отскока, мм
        },
    };

    /**
     * Системы координат
     */
    let coordSystems = {
        [COORD_SYSTEM_NULL]: Object.assign({}, zeroPoint),
        [COORD_SYSTEM_USER]: Object.assign({}, zeroPoint),
    };
    

    let _fastSpeed = 20.0;                // скорость быстрого перемещения, мм/сек
    let _workSpeed = 20.0;                // рабочая скорость перемещения, мм/сек
    let _fastSpeedModal = 20.0;
    let _workSpeedModal = 20.0;
    

    /**
     * Парсинг строк программы gcode
     * @param {array} gcodeLines строки gcode
     */
    const parseLines = (gcodeLines) => {
        let ls = gcodeLines;

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

        return { cmds };
    }

    /**
     * Анализ команды Gxx
     * @param {number} value значение xx команды Gxx
     * @param {array} frame полный фрейм
     * @param {object} frameData подготовленные данные фрейма
     * @returns флаг продолжения анализа фрейма
     */
    const command_G = (value, frame, frameData) => {
        let processThisCommand = true;
        switch(value){
            case 0:     // G00 - Ускоренное перемещение инструмента (холостой ход)
                frameData.type = FRAME_TYPE_MOVE_LINE_FAST;
                frameData.speed = _fastSpeedModal;
                frame.map(cmd => {
                    switch(cmd[0]){
                        case 'F':       // задание скорости перемещения, mm/min
                            _fastSpeedModal = frameData.speed = cmd[1]/60;
                            break;
                        default:
                            break;
                    }
                });
                // console.log(JSON.stringify({frameData}));
                break;
            case 1:     // G01 - Линейная интерполяция, скорость перемещения задаётся здесь же или ранее модальной командой F
                frameData.type = FRAME_TYPE_MOVE_LINE_WORK;
                frameData.speed = _workSpeedModal;
                frame.map(cmd => {
                    switch(cmd[0]){
                        case 'F':       // задание скорости перемещения, mm/min
                            _workSpeedModal = frameData.speed = cmd[1]/60;
                            break;
                        default:
                            break;
                    }
                });
                break;
            case 2:     // G02 - Круговая интерполяция по часовой стрелке
                frameData.type = FRAME_TYPE_MOVE_CIRCLE_CW;
                frameData.circle = {
                    type: CIRCLE_RADIUS,
                    radius: 0,
                    inc: Object.assign({}, zeroCircleInc),
                };
                frame.map(cmd => {
                    switch(cmd[0]){
                        case 'R':
                            frameData.circle.type = CIRCLE_RADIUS;
                            frameData.circle.radius = cmd[1];
                            break;
                        case 'I':
                            frameData.circle.type = CIRCLE_INC;
                            frameData.circle.inc.i = cmd[1];
                            break;
                        case 'J':
                            frameData.circle.type = CIRCLE_INC;
                            frameData.circle.inc.j = cmd[1];
                            break;
                        case 'K':
                            frameData.circle.type = CIRCLE_INC;
                            frameData.circle.inc.k = cmd[1];
                            break;
                        default:
                            break;
                    }
                });
                break;
            case 3:     // G03 - Круговая интерполяция против часовой стрелки
            frameData.type = FRAME_TYPE_MOVE_CIRCLE_CCW;
            frameData.circle = {
                type: CIRCLE_RADIUS,
                radius: 0,
                inc: Object.assign({}, zeroCircleInc),
            };
            frame.map(cmd => {
                switch(cmd[0]){
                    case 'R':
                        frameData.circle.type = CIRCLE_RADIUS;
                        frameData.circle.radius = cmd[1];
                        break;
                    case 'I':
                        frameData.circle.type = CIRCLE_INC;
                        frameData.circle.inc.i = cmd[1];
                        break;
                    case 'J':
                        frameData.circle.type = CIRCLE_INC;
                        frameData.circle.inc.j = cmd[1];
                        break;
                    case 'K':
                        frameData.circle.type = CIRCLE_INC;
                        frameData.circle.inc.k = cmd[1];
                        break;
                    default:
                        break;
                }
            });
            break;
            case 4:     // G04 - Задержка выполнения программы, способ задания величины задержки зависит от реализации системы управления, P обычно задает паузу в миллисекундах, X — в секундах.
                frameData.type = FRAME_TYPE_PAUSE;
                frame.map(cmd => {
                    switch(cmd[0]){
                        case 'P':       // пауза в миллисекундах
                            frameData.pause = cmd[1]/1000;
                            break;
                        case 'X':       // пауза с секундах
                            frameData.pause = cmd[1];
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
                // progParams.compensationLength.type = COMPENSATION_POS;
                // progParams.compensationLength.value = 0.0;
                break;
            case 44:    // G44 - Компенсировать длину инструмента отрицательно
                // progParams.compensationLength.type = COMPENSATION_NEG;
                // progParams.compensationLength.value = 0.0;
                break;
            case 49:    // G49 - Отмена компенсации длины инструмента
                // progParams.compensationLength.type = COMPENSATION_NONE;
                // progParams.compensationLength.value = 0.0;
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
                progParams.coordType = COORD_ABSOLUTE;
                break;
            case 91:    // G91 - Задание координат инкрементально последней введённой опорной точки
                progParams.coordType = COORD_RELATIVE;
                break;
            case 92:    // G92 - Смещение абсолютной системы координат
                progParams.coordType = COORD_OFFSET;
                progParams.targetCoord = Object.assign({}, zeroPoint);
                progParams.offsetCoord = Object.assign({}, progParams.currentCoord);
                frame.map(cmd => {
                    switch(cmd[0]){
                        case 'X':
                            progParams.offsetCoord.x -= cmd[1];
                            break;
                        case 'Y':
                            progParams.offsetCoord.y -= cmd[1];
                            break;
                        case 'Z':
                            progParams.offsetCoord.z -= cmd[1];
                            break;
                        case 'A':
                            progParams.offsetCoord.a -= cmd[1];
                            break;
                        case 'B':
                            progParams.offsetCoord.b -= cmd[1];
                            break;
                        case 'C':
                            progParams.offsetCoord.c -= cmd[1];
                            break;
                        default:
                            break;
                    }
                });
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

    /**
     * Анализ команды Mxx
     * @param {number} value значение xx команды Mxx
     * @param {array} frame полный фрейм
     * @param {object} frameData подготовленные данные фрейма
     * @returns флаг продолжения анализа фрейма
     */
     const command_M = (value, frame) => {
        let processThisCommand = true;
        switch(value){
            case 1:     // M01 - включить плазму (постпроцессор asketcnc_plasma)
            case 3:     // M03 - включить плазму
            case 7:     // M07 - включить плазму

                break;
            case 2:     // M02 - выключить плазму (постпроцессор asketcnc_plasma)
            case 5:     // M05 - выключить плазму
            case 8:     // M08 - включить плазму

                break;

            default:
                break;
        }
        return processThisCommand;
    };

    /**
     * Установка точки пользовательского "нуля"
     * @param point точка пользовательского "нуля"
     */
     const setUserZeroPoint = point => {
        coordSystems[COORD_SYSTEM_USER] = Object.assign({}, zeroPoint, point);
    }


    const recalcCoords = (targetPoint) => {
        progParams.currentCoord = Object.assign({}, targetPoint);
    }

    /**
     * Анализ фрейма
     * @param {array} frame фрейм
     * @returns 
     */
    const processFrame = (frame, frameData) => {
        let processThisFrame = true;

        const calcCoord = (axeName, value) => {
            let val = value;
            if(progParams.unit == UNIT_INCH){       // дюймы в миллиметры
                val *= 25.4;
            }

            frameData.speed = frameData.type === FRAME_TYPE_MOVE_LINE_FAST ? _fastSpeedModal : _workSpeedModal;

            if(moveTypes.includes(frameData.type)){
                if(typeof frameData.point === "undefined"){
                    frameData.point = Object.assign({}, progParams.targetCoord);
                }
                frameData.point[axeName] = progParams.targetCoord[axeName] = (progParams.coordType === COORD_RELATIVE ? progParams.targetCoord[axeName] : (progParams.coordType === COORD_OFFSET ? progParams.offsetCoord[axeName] : 0)) + val;
            } else if(frameData.type === FRAME_TYPE_UNKNOWN){
                if(moveTypes.includes(prevFrameData.type)){
                    frameData.type = prevFrameData.type;
                    if(typeof frameData.point === "undefined"){
                        frameData.point = Object.assign({}, progParams.targetCoord);
                    }
                    frameData.point[axeName] = progParams.targetCoord[axeName] = (progParams.coordType === COORD_RELATIVE ? progParams.targetCoord[axeName] : (progParams.coordType === COORD_OFFSET ? progParams.offsetCoord[axeName] : 0)) + val;
                }
            }
        }

        if(progParams.runType === RUN_WORK_CW || progParams.runType === RUN_WORK_CCW){
            frame.map(el => {
                if(!processThisFrame)
                    return null;

            });
            progParams.circle.inc = Object.assign({}, zeroCircleInc);
        }

        frame.map(el => {
            let letter = el[0];
            let value = el[1];

            if(!processThisFrame)       // текущую команду Gxx не обрабатываем
                return null;

            switch(letter){
                case 'G':
                    processThisFrame = command_G(value, frame, frameData);
                    break;
                case 'M':
                    processThisFrame = command_M(value, frame, frameData);
                    break;

                case 'X':
                    calcCoord('x', parseFloat(value.toFixed(3)));
                    break;
                case 'Y':
                    calcCoord('y', parseFloat(value.toFixed(3)));
                    break;
                case 'Z':
                    calcCoord('z', parseFloat(value.toFixed(3)));
                    break;
                case 'A':
                    calcCoord('a', parseFloat(value.toFixed(3)));
                    break;
                case 'B':
                    calcCoord('b', parseFloat(value.toFixed(3)));
                    break;
                case 'C':
                    calcCoord('c', parseFloat(value.toFixed(3)));
                    break;

                case 'I':
                    progParams.circle.type = CIRCLE_INC;
                    progParams.circle.inc.i = parseFloat(value.toFixed(3));
                    break;
                case 'J':
                    progParams.circle.type = CIRCLE_INC;
                    progParams.circle.inc.j = parseFloat(value.toFixed(3));
                    break;
                case 'K':
                    progParams.circle.type = CIRCLE_INC;
                    progParams.circle.inc.k = parseFloat(value.toFixed(3));
                    break;

                default:
                    break;
            }

            return null;
        });

        prevFrameData = Object.assign({}, frameData);

        if(!processThisFrame)       // текущую команду Gxx не обрабатываем
            return false;

        return true;
    }


    const processMove = (frameData, lastPoint) => {

        if(frameData.type === FRAME_TYPE_MOVE_LINE_FAST || frameData.type === FRAME_TYPE_MOVE_LINE_WORK){
            processLine(frameData, lastPoint);
        } else if(frameData.type === FRAME_TYPE_MOVE_CIRCLE_CW || frameData.type === FRAME_TYPE_MOVE_CIRCLE_CCW){
            processCircle(frameData, lastPoint);
        } else{

        }

    }

    const processLine = (frameData, lastPoint) => {
        let { point } = frameData;

        point = pointAdd(point, coordSystems[COORD_SYSTEM_USER]);
    }

    const processCircle = (frameData, lastPoint) => {
        let { point } = frameData;

        let p1 = Object.assign({}, lastPoint);
        let p2 = Object.assign({}, point);

        p1 = pointAdd(p1, coordSystems[COORD_SYSTEM_USER]);
        p2 = pointAdd(p2, coordSystems[COORD_SYSTEM_USER]);

        if(typeof frameData.circle === "undefined"){
            frameData.circle = Object.assign({}, progParams.circle);
        }

        let cp = frameData.circle.type === CIRCLE_RADIUS ?
            GCodeCR.calcCircleByRadius(p1, p2, frameData.circle.radius, frameData.type === FRAME_TYPE_MOVE_CIRCLE_CCW) :
            GCodeCR.calcCircleByInc(p1, p2, frameData.circle.inc.i, frameData.circle.inc.j, frameData.type === FRAME_TYPE_MOVE_CIRCLE_CCW)
        ;

        cp.p1 = cp.p2 = undefined;
        
        frameData.circle.data = cp;
    }


    const process = (cmds) => {
        let lastPoint = Object.assign({}, zeroPoint);

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

            let frameData = {
                type: FRAME_TYPE_UNKNOWN,
            };

            if(processFrame(frame, frameData)){
                framesData.push(frameData);
                if(moveTypes.includes(frameData.type)){
                    if(!pointsIsEqual(frameData.point, lastPoint)){
                        processMove(frameData, lastPoint);
                    }
                    lastPoint = Object.assign({}, frameData.point);
                }
            }

            return null;
        });

    }

    /**
     * Анализирование команд
     */
    const analyseData = () => {

        if(_cmds !== null){
            process(_cmds);
        }

        // console.log(framesData);
        return framesData;

    }

    /**
     * Рассчёт длины между двумя точками
     * @param {Point} point1 Точка 1
     * @param {Point} point2 Точка 2
     */
    const calcPointsDistance = (point1, point2) => {
        let sumSqr = Object.keys(point1).map(axeName => {
            let dv = point2[axeName] - point1[axeName];
            return dv*dv;
        }).reduce((a, b) => (a+b), 0);
        return Math.sqrt(sumSqr);
    }

    /**
     * Нахождение точки между двумя с пропорцией 0-point1, 1-point2
     * @param {Point} point1 Точка 1
     * @param {Point} point2 Точка 2
     */
    const calcPointWithProportion = (point1, point2, prop) => {
        let point = Object.assign({}, zeroPoint);
        Object.keys(point1).map(axeName => {
            point[axeName] = (point2[axeName] - point1[axeName]) * prop + point1[axeName];
        })
        return point;
    }

    /**
     * Нахождение точки point=point1+point2
     * @param {Point} point1 Точка 1
     * @param {Point} point2 Точка 2
     * @returns 
     */
    const pointAdd = (point1, point2) => {
        let point = {};
        Object.keys(point1).map(axeName => {
            point[axeName] = point1[axeName] + point2[axeName];
        });
        return point;
    }

    /**
     * Нахождение точки point=point2-point1
     * @param {Point} point1 Точка 1
     * @param {Point} point2 Точка 2
     * @returns 
     */
    const pointSub = (point1, point2) => {
        let point = {};
        Object.keys(point1).map(axeName => {
            point[axeName] = point2[axeName] - point1[axeName];
        });
        return point;
    }

    /**
     * Умножение координат точки
     * @param {Point} point Точка
     * @param {Number} mul Множитель
     */
    const pointMul = (point, mul) => {
        point = Object.assign({}, point);
        Object.keys(point).map(axeName => {
            point[axeName] *= mul;
        });
        return point;
    }

    /**
     * Определение являются ли две точки с одними координатами
     * @param {Point} p1 первая точка
     * @param {Point} p2 вторая точка
     */
    const pointsIsEqual = (point1, point2) => {
        // console.log('zzz', ...Object.keys(point1).map(axeName => (
        //     point2[axeName] === point1[axeName] ? 0 : 1
        // )));
        return Math.max(...Object.keys(point1).map(axeName => (
            point2[axeName] === point1[axeName] ? 0 : 1
        ))) === 0;
    }

    /**
     * Запуск программы gcode
     * @param {function} notifyFunc функция вызываемая для уведомления об изменении текущих координат
     */
    const run = (notifyFunc) => {

        let lastPoint = Object.assign({}, zeroPoint);

        let lpos = 0;

        const forEachPromise = (items, fn) => {
            return items.reduce( (promise, item) => {
                return promise.then( () => fn(item) );
            }, Promise.resolve() );
        }

        const eachFrameData = (frameData) => {
            return new Promise( (resolve, reject) => {

                // console.log(JSON.stringify(frameData));

                if(moveTypes.includes(frameData.type)){
                    let { point, speed } = frameData;

                    let p1 = lastPoint;
                    let p2 = point;

                    if(speed === 0) speed = 10;
                    // speed = 40;
                    let dl = speed / (1000/50);



                    if(frameData.type === FRAME_TYPE_MOVE_LINE_FAST || frameData.type === FRAME_TYPE_MOVE_LINE_WORK){

                        let length = calcPointsDistance(p1, p2);

                        let intervalTime = 50;

                        if(length > 0){
                            if(length < dl){
                                intervalTime = intervalTime * (length/dl);
                                dl = length;
                            }
                            let intervalID = window.setInterval(() => {
                                lpos += dl;
                                if(lpos < length){
                                    let currentPoint = calcPointWithProportion(p1, p2, lpos/length);
        
                                    if(typeof notifyFunc === "function"){
                                        notifyFunc(currentPoint);
                                    }

                                } else{
                                    lpos -= length;
                                    lastPoint = Object.assign({}, point);
                                    window.clearInterval(intervalID);
                                    if(typeof notifyFunc === "function"){
                                        notifyFunc(point);
                                    }
                                    resolve();
                                }
                            }, intervalTime);
                            return;
                        }

                    } else if(frameData.type === FRAME_TYPE_MOVE_CIRCLE_CW || frameData.type === FRAME_TYPE_MOVE_CIRCLE_CCW){

                        let cp = Object.assign({}, frameData.circle.data);
                        let pc = cp.center;

                        let a1 = cp.angle1;
                        let a2 = cp.angle2;
    
                        if(!cp.ccw){
                            if(a1 < a2) a1 += 2*Math.PI;
                        } else{
                            if(a2 < a1) a2 += 2*Math.PI;
                        }
    
                        let length = cp.r * Math.abs(a2-a1);
                        if(length > 0){
                            let intervalID = window.setInterval(() => {
                                lpos += dl;
                                if(lpos < length){
                                    let curAngle = (a2-a1)/length*lpos + a1;
                                    let currentPoint = Object.assign({}, zeroPoint);
                                    currentPoint.x = cp.r * Math.cos(curAngle) + pc.x;
                                    currentPoint.y = cp.r * Math.sin(curAngle) + pc.y;

                                    if(typeof notifyFunc === "function"){
                                        notifyFunc(currentPoint);
                                    }

                                } else{
                                    lpos -= length;
                                    lastPoint = Object.assign({}, point);
                                    window.clearInterval(intervalID);
                                    resolve();
                                }
                            }, 50);
                            return;
                        }
                    }
                }
                resolve();
            } );
        }

        forEachPromise(framesData, eachFrameData)
        .then(() => {
            console.log('done');
        })
        ;
        
    }

    const cleanCommands = () => {
        _cmds = null;
        framesData = [];
    }

    return {
        parseLines,
        setUserZeroPoint,
        analyseData,
        run,
        calcPointsDistance, calcPointWithProportion, 
        pointsIsEqual, pointAdd, pointSub, pointMul, 
        cleanCommands,
    };
});


export default GCode;

export { 
    letterCodes, 
    COORD_SYSTEM_NULL, COORD_SYSTEM_USER,

    FRAME_TYPE_UNKNOWN, 
    FRAME_TYPE_MOVE_LINE_FAST, FRAME_TYPE_MOVE_LINE_WORK,
    FRAME_TYPE_MOVE_CIRCLE_CW, FRAME_TYPE_MOVE_CIRCLE_CCW,
    FRAME_TYPE_PAUSE,

    moveTypes,
    zeroPoint,

};
